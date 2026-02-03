# AI Assistant Context for Daily Rundown

This example generates a daily comms digest using the Attrove SDK. It fetches calendar events, searches for recent action items, and generates an AI digest — all in parallel.

## SDK Methods Used

Only working SDK methods are used (no stubbed methods):

| Method | Purpose |
|--------|---------|
| `new Attrove({ apiKey, userId })` | Create client for an existing user |
| `attrove.events.list()` | Today's calendar events with attendees |
| `attrove.search()` | Search for action items and decisions |
| `attrove.query()` | AI-generated daily digest |

### Unavailable Methods
- `attrove.brief()`, `attrove.entity()`, `attrove.thread()` — do not exist in the SDK yet (will cause a compile error)

## Key Patterns

```typescript
// Parallel fetching with graceful partial failure
const [eventsSettled, searchSettled, digestSettled] = await Promise.allSettled([
  attrove.events.list({ startDate, endDate, expand: ["attendees"] }),
  attrove.search("action items OR decisions", { afterDate, includeBodyText: true }),
  attrove.query("Generate a daily digest...", { includeSources: true }),
]);

// Search with date filtering
const results = await attrove.search("action items", {
  afterDate: yesterday.toISOString().split('T')[0],
  includeBodyText: true,
});

// Iterate search results grouped by conversation
for (const [id, conv] of Object.entries(results.conversations)) {
  console.log(conv.conversation_name);
  for (const messages of Object.values(conv.threads)) {
    // messages is SearchThreadMessage[]
  }
}
```

## Email Sending

The `--send` flag uses [Resend](https://resend.com) to send the digest via email. This is optional — requires `RESEND_API_KEY` and `SEND_TO` env vars.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATTROVE_USER_TOKEN` | Yes | User token (`sk_...` prefix). NOT the `attrove_` API key. |
| `ATTROVE_USER_ID` | Yes | User UUID |
| `RESEND_API_KEY` | No | Resend API key (for `--send`) |
| `SEND_TO` | No | Email recipient (for `--send`) |

## Error Handling

The SDK throws typed errors: `AuthenticationError`, `RateLimitError`, `ValidationError`, `NotFoundError`, `NetworkError`. Import from `@attrove/sdk`.
