/**
 * Daily Rundown
 *
 * Generates a daily digest: open actions, decisions, important meetings,
 * and a comms summary from your email, Slack, and calendar.
 *
 * Usage:
 *   npm start              # Print digest to console
 *   npm start -- --send    # Send digest via Resend email
 */

import "dotenv/config";
import {
  Attrove,
  type ApiKeyFormat,
  AuthenticationError,
  RateLimitError,
  isAttroveError,
} from "@attrove/sdk";

const userToken = process.env.ATTROVE_USER_TOKEN;
const userId = process.env.ATTROVE_USER_ID;
const shouldSend = process.argv.includes("--send");

if (!userToken || !userId) {
  console.error("Missing ATTROVE_USER_TOKEN or ATTROVE_USER_ID.");
  console.error("Copy .env.example to .env and add your credentials.");
  console.error("Note: ATTROVE_USER_TOKEN is the sk_ user token, not your attrove_ API key.");
  process.exit(1);
}

const attrove = new Attrove({ apiKey: userToken as ApiKeyFormat, userId });

async function main(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const dateLabel = today.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Fetch today's calendar, recent threads, and generate digest in parallel
  const [eventsSettled, searchSettled, digestSettled] = await Promise.allSettled([
    attrove.events.list({
      startDate: today.toISOString(),
      endDate: endOfDay.toISOString(),
      expand: ["attendees"],
    }),
    attrove.search("action items OR decisions OR follow up OR deadline", {
      afterDate: yesterday.toISOString(),
      includeBodyText: true,
    }),
    attrove.query(
      `Generate a concise daily digest for today. Include:
1. Open action items that need attention
2. Key decisions made in the last 24 hours
3. Important threads or conversations to follow up on
4. A 2-3 sentence summary of recent communications

Format as a structured digest with clear sections.`,
      { includeSources: true },
    ),
  ]);

  // Report any individual failures before building the digest
  const failures: [string, PromiseSettledResult<unknown>][] = [
    ["fetch calendar events", eventsSettled],
    ["search recent threads", searchSettled],
    ["generate AI digest", digestSettled],
  ];
  for (const [label, settled] of failures) {
    if (settled.status === "rejected") {
      const reason = settled.reason instanceof Error ? settled.reason.message : settled.reason;
      console.error(`Failed to ${label}:`, reason);
    }
  }

  // If all three failed, exit early
  if (failures.every(([, s]) => s.status === "rejected")) {
    console.error("\nAll API calls failed. Check your credentials and try again.");
    process.exit(1);
  }

  // Build the digest from successful results
  const sections: string[] = [];

  sections.push(`Daily Rundown - ${dateLabel}`);
  sections.push("=".repeat(50));

  // Calendar section
  if (eventsSettled.status === "fulfilled") {
    const events = eventsSettled.value.data;
    sections.push(`\nCalendar (${events.length} events)`);
    sections.push("-".repeat(30));
    if (events.length === 0) {
      sections.push("  No meetings today.");
    } else {
      for (const event of events) {
        const time = new Date(event.start_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const attendeeList = toArray(event.attendees);
        const attendees = attendeeList
          .map((a) => a.name || a.email)
          .filter(Boolean)
          .slice(0, 3)
          .join(", ");
        sections.push(`  ${time}  ${event.title}`);
        if (attendees) sections.push(`         with ${attendees}`);
      }
    }
  } else {
    sections.push("\nCalendar");
    sections.push("-".repeat(30));
    sections.push("  (failed to load — see error above)");
  }

  // Recent threads section
  if (searchSettled.status === "fulfilled") {
    const searchResult = searchSettled.value;
    const threadCount = Object.keys(searchResult.conversations).length;
    sections.push(`\nRecent Threads (${threadCount} active)`);
    sections.push("-".repeat(30));
    for (const conv of Object.values(searchResult.conversations).slice(0, 5)) {
      const name = conv.conversation_name || "Unnamed thread";
      const msgCount = Object.values(conv.threads).flat().length;
      sections.push(`  - ${name} (${msgCount} messages)`);
    }
  } else {
    sections.push("\nRecent Threads");
    sections.push("-".repeat(30));
    sections.push("  (failed to load — see error above)");
  }

  // AI digest section
  if (digestSettled.status === "fulfilled") {
    sections.push("\nDigest");
    sections.push("-".repeat(30));
    sections.push(digestSettled.value.answer);
  } else {
    sections.push("\nDigest");
    sections.push("-".repeat(30));
    sections.push("  (failed to generate — see error above)");
  }

  const digest = sections.join("\n");

  // Output to console
  console.log(digest);

  const failureCount = failures.filter(([, s]) => s.status === "rejected").length;

  // Optionally send via email
  if (shouldSend) {
    const resendKey = process.env.RESEND_API_KEY;
    const sendTo = process.env.SEND_TO;
    if (!resendKey || !sendTo) {
      console.error("\nSet RESEND_API_KEY and SEND_TO in .env to send via email.");
      process.exit(1);
    }
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Daily Rundown <digest@updates.attrove.com>",
        to: sendTo,
        subject: `Daily Rundown - ${dateLabel}`,
        text: digest,
      });
      console.log(`\nSent to ${sendTo}`);
    } catch (emailErr: unknown) {
      console.error("\nFailed to send email:", emailErr instanceof Error ? emailErr.message : emailErr);
      console.error("The digest was printed above. Check your RESEND_API_KEY and ensure the 'resend' package is installed.");
      process.exit(1);
    }
  }

  if (failureCount > 0) {
    process.exit(2);
  }
}

/** Normalize a field that may be an array, a JSON string, or undefined. */
function toArray<T>(value: T[] | string | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        // prettier-ignore
        console.warn(`Warning: Expected array but got ${typeof parsed}. Raw value: "${value.slice(0, 100)}"`);
        return [];
      }
      return parsed;
    } catch (err: unknown) {
      // prettier-ignore
      console.warn(`Warning: Failed to parse array field. Raw value: "${value.slice(0, 100)}". Error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }
  return [];
}

main().catch((err: unknown) => {
  if (err instanceof AuthenticationError) {
    console.error("Authentication Error:", err.message);
    console.error("  Check your ATTROVE_USER_TOKEN — get it from admin.users.create()");
  } else if (err instanceof RateLimitError) {
    console.error("Rate Limited:", err.message);
    const waitTime = err.retryAfter ?? 60;
    console.error(`  Please wait ${waitTime} seconds before retrying`);
  } else if (isAttroveError(err)) {
    console.error(`API Error [${err.code}]:`, err.message);
    if (err.status) console.error(`  HTTP Status: ${err.status}`);
  } else if (err instanceof Error) {
    console.error("Error:", err.message);
  } else {
    console.error("Unknown error:", err);
  }
  process.exit(1);
});
