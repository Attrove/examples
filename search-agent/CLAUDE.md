# AI Assistant Context for Search Agent

Minimal example: ask your comms anything in ~65 lines using the Attrove SDK. One API call.

## SDK Methods Used

| Method | Purpose |
|--------|---------|
| `new Attrove({ apiKey, userId })` | Create client |
| `attrove.query()` | AI-powered Q&A across all connected integrations |

### Unavailable Methods
- `attrove.brief()`, `attrove.entity()`, `attrove.thread()` — do not exist in the SDK yet (will cause a compile error)

## Key Patterns

```typescript
// Ask anything — AI searches email, Slack, calendar and answers
const response = await attrove.query("what did we promise ACME?", {
  includeSources: true,
});
console.log(response.answer);
console.log(response.used_message_ids); // msg_xxx source IDs
console.log(response.used_meeting_ids); // mtg_xxx source IDs
console.log(response.used_event_ids);   // evt_xxx source IDs
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATTROVE_SECRET_KEY` | Yes | User token (`sk_...` prefix). NOT the `attrove_` API key. |
| `ATTROVE_USER_ID` | Yes | User UUID |
