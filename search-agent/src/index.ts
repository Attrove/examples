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

const userToken = process.env.ATTROVE_USER_TOKEN;
const userId = process.env.ATTROVE_USER_ID;
const query = process.argv.slice(2).join(" ") || "important updates this week";

if (!userToken || !userId) {
  console.error("Missing ATTROVE_USER_TOKEN or ATTROVE_USER_ID.");
  console.error("Copy .env.example to .env and add your credentials.");
  console.error("Note: ATTROVE_USER_TOKEN is the sk_ user token, not your attrove_ API key.");
  process.exit(1);
}

const attrove = new Attrove({ apiKey: userToken as ApiKeyFormat, userId });

async function main(): Promise<void> {
  console.log(`Q: ${query}\n`);

  const response = await attrove.query(query, { includeSources: true });

  if (!response.answer) {
    console.log("No answer was generated. This may mean no relevant messages were found.");
    console.log("Try connecting more integrations or using a different query.");
  } else {
    console.log(response.answer);
  }

  if (response.used_message_ids?.length > 0) {
    console.log(`\n(Based on ${response.used_message_ids.length} messages)`);
  }
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
