/**
 * Meeting Prep Agent
 *
 * AI agent that preps you for your next meeting using real email,
 * Slack, and calendar context.
 *
 * Run with: npm start
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

if (!userToken || !userId) {
  console.error("Missing ATTROVE_USER_TOKEN or ATTROVE_USER_ID.");
  console.error("Copy .env.example to .env and add your credentials.");
  console.error("Note: ATTROVE_USER_TOKEN is the sk_ user token, not your attrove_ API key.");
  process.exit(1);
}

const attrove = new Attrove({ apiKey: userToken as ApiKeyFormat, userId });

/** Format a Date as YYYY-MM-DD in local timezone (not UTC). */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function main(): Promise<void> {
  // Step 1: Get upcoming calendar events
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const { data: events } = await attrove.events.list({
    startDate: formatLocalDate(now),
    endDate: formatLocalDate(tomorrow),
    expand: ["attendees", "description"],
  });

  if (events.length === 0) {
    console.log("No upcoming meetings in the next 24 hours.");
    return;
  }

  console.log(`Found ${events.length} upcoming meeting(s).\n`);

  // Step 2: For each meeting, generate a prep brief
  let failures = 0;
  for (const event of events) {
    try {
      // attendees may arrive as a JSON string from the API — normalize to array
      const attendees = toArray(event.attendees);
      const attendeeNames = attendees
        .map((a) => a.name || a.email)
        .filter(Boolean)
        .join(", ");

      console.log("─".repeat(60));
      console.log(`Meeting: ${event.title}`);
      console.log(`Time:    ${formatTime(event.start_time)} - ${formatTime(event.end_time)}`);
      if (attendeeNames) console.log(`With:    ${attendeeNames}`);
      console.log("");

      // Step 3: Check for past meetings with same attendees
      const { data: pastMeetings } = await attrove.meetings.list({
        expand: ["short_summary", "action_items"],
        limit: 5,
      });

      const relevantMeetings = pastMeetings.filter((m) => {
        const mAttendees = toArray(m.attendees);
        return mAttendees.some((a) =>
          attendees.some((ea) => ea.email && ea.email === a.email),
        );
      });

      if (relevantMeetings.length > 0) {
        console.log("Previous meetings with these people:");
        for (const m of relevantMeetings.slice(0, 3)) {
          console.log(`  - ${m.title} (${formatDate(m.start_time)})`);
          if (m.short_summary) console.log(`    ${m.short_summary}`);
        }
        console.log("");
      }

      // Step 4: Query for relevant context across email and Slack
      const prompt = attendeeNames
        ? `What do I need to know before my meeting "${event.title}" with ${attendeeNames}? Include any recent email threads, Slack messages, open action items, or decisions involving these people.`
        : `What do I need to know before my meeting "${event.title}"? Include any recent context, action items, or decisions related to this topic.`;

      const response = await attrove.query(prompt, { includeSources: true });

      console.log("Prep Brief:");
      console.log(response.answer);
      console.log("");
    } catch (meetingErr: unknown) {
      failures++;
      console.error(`Failed to prep "${event.title}":`, meetingErr instanceof Error ? meetingErr.message : meetingErr);
      console.log("");
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} meeting(s) could not be prepped. See errors above.`);
    process.exit(1);
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
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
