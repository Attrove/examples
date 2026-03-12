/**
 * Search Agent — ask your comms anything.
 *
 * Usage:
 *   npm start -- "what did we promise ACME last week?"
 *   npm start -- "open action items"
 *   npm start                          # defaults to "important updates this week"
 */

import "dotenv/config";
import {
  Attrove,
  type ApiKeyFormat,
  AuthenticationError,
  RateLimitError,
  isAttroveError,
} from "@attrove/sdk";

const secretKey = process.env.ATTROVE_SECRET_KEY;
const userId = process.env.ATTROVE_USER_ID;
const query = process.argv.slice(2).join(" ") || "important updates this week";

if (!secretKey || !userId) {
  console.error("Missing ATTROVE_SECRET_KEY or ATTROVE_USER_ID.");
  console.error("Copy .env.example to .env and add your credentials.");
  console.error("Note: ATTROVE_SECRET_KEY is the sk_ per-user key, not your partner client_id/client_secret.");
  process.exit(1);
}

const attrove = new Attrove({ apiKey: secretKey as ApiKeyFormat, userId });

async function main(): Promise<void> {
  console.log(`Q: ${query}\n`);

  const response = await attrove.query(query, { includeSources: true });

  if (!response.answer) {
    console.log("No answer was generated. This may mean no relevant context was found.");
    console.log("Try connecting more integrations or using a different query.");
  } else {
    console.log(response.answer);
  }

  const sourceBreakdown: string[] = [];
  if (response.used_message_ids.length > 0) {
    const n = response.used_message_ids.length;
    sourceBreakdown.push(`${n} ${n === 1 ? "message" : "messages"}`);
  }
  if (response.used_meeting_ids.length > 0) {
    const n = response.used_meeting_ids.length;
    sourceBreakdown.push(`${n} ${n === 1 ? "meeting" : "meetings"}`);
  }
  if (response.used_event_ids.length > 0) {
    const n = response.used_event_ids.length;
    sourceBreakdown.push(`${n} ${n === 1 ? "event" : "events"}`);
  }
  if (sourceBreakdown.length > 0) {
    console.log(`\n(Based on ${sourceBreakdown.join(", ")})`);
  }
}

main().catch((err: unknown) => {
  if (err instanceof AuthenticationError) {
    console.error("Authentication Error:", err.message);
    console.error("  Check your ATTROVE_SECRET_KEY — get it from admin.users.create()");
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
