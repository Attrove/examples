# AI Assistant Context for Meeting Prep Agent

This example builds an AI meeting prep agent using the Attrove SDK. It fetches upcoming calendar events, finds past meetings with the same attendees, and generates a context brief using RAG.

## SDK Methods Used

Only working SDK methods are used (no stubbed methods):

| Method | Purpose |
|--------|---------|
| `new Attrove({ apiKey, userId })` | Create client for an existing user |
| `attrove.events.list()` | List upcoming calendar events with attendees |
| `attrove.meetings.list()` | List past meetings with summaries and action items |
| `attrove.query()` | RAG query across all connected integrations |

### Unavailable Methods
- `attrove.brief()` — does not exist in the SDK yet (will cause a compile error)
- `attrove.entity()` — does not exist in the SDK yet (will cause a compile error)
- `attrove.thread()` — does not exist in the SDK yet (will cause a compile error)

## Key Patterns

```typescript
// Events with attendee expansion
const { data: events } = await attrove.events.list({
  startDate: new Date().toISOString().split('T')[0],
  endDate: tomorrow.toISOString().split('T')[0],
  expand: ["attendees", "description"],
});

// Meetings with summaries
const { data: meetings } = await attrove.meetings.list({
  expand: ["short_summary", "action_items"],
  limit: 5,
});

// RAG query with sources
const response = await attrove.query("What do I need to know?", {
  includeSources: true,
});
console.log(response.answer);
```

## B2B2B Provisioning (not shown in this example)

To integrate into your own app, add provisioning:

```typescript
const admin = Attrove.admin({ clientId, clientSecret });
const { id, apiKey: userToken } = await admin.users.create({ email });
const { token } = await admin.users.createConnectToken(id);
```

See `../quickstart` for the full flow.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATTROVE_SECRET_KEY` | Yes | User token (`sk_...` prefix). NOT the `attrove_` API key. |
| `ATTROVE_USER_ID` | Yes | User UUID |

## Error Handling

The SDK throws typed errors: `AuthenticationError`, `RateLimitError`, `ValidationError`, `NotFoundError`, `NetworkError`. Import from `@attrove/sdk`.
