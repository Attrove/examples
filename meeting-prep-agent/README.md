# Meeting Prep Agent

Build a meeting prep agent in ~160 lines of TypeScript. Searches your real Gmail, Slack, and Calendar to generate a context brief before every meeting.

## What it does

1. Fetches your upcoming calendar events (next 24 hours)
2. Finds past meetings with the same attendees
3. Queries your email and Slack for relevant context
4. Outputs a prep brief with action items, recent threads, and key decisions

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# User token (sk_ prefix) — NOT your attrove_ API key
ATTROVE_USER_TOKEN=sk_...
ATTROVE_USER_ID=your-user-uuid
```

Don't have a user token yet? [Sign up free](https://connect.attrove.com) and provision a user with the [quickstart](../quickstart). The `sk_` token is returned by `admin.users.create()`.

## Run

```bash
npm start
```

Example output:

```
Found 2 upcoming meeting(s).

────────────────────────────────────────────────────────────
Meeting: Q1 Planning Sync
Time:    02:00 PM - 03:00 PM
With:    Sarah Chen, Mike Torres

Previous meetings with these people:
  - Sprint Retrospective (Jan 22)
    Discussed velocity improvements and agreed to reduce WIP limits.

Prep Brief:
Based on recent communications:
- Sarah emailed about updated Q1 OKRs on Jan 20, requesting feedback on the
  new revenue targets before this meeting.
- Mike shared a Slack thread in #product about feature prioritization, with
  3 open action items from last week's sprint retro.
- Key decision pending: whether to ship v2.1 in Feb or bundle with the March release.
```

## How it works

```typescript
// Fetch upcoming events with attendee details
const { data: events } = await attrove.events.list({
  startDate: new Date().toISOString(),
  endDate: tomorrow.toISOString(),
  expand: ["attendees", "description"],
});

// Check past meetings with the same people
const { data: pastMeetings } = await attrove.meetings.list({
  expand: ["short_summary", "action_items"],
  limit: 5,
});

// Generate a prep brief using RAG across all integrations
const response = await attrove.query(
  `What do I need to know before my meeting with ${attendeeNames}?`,
  { includeSources: true }
);
```

Three SDK methods. Real data. Ship it.

## SDK Methods Used

| Method | Purpose |
|--------|---------|
| `attrove.events.list()` | Get upcoming calendar events with attendees |
| `attrove.meetings.list()` | Find past meetings with same people |
| `attrove.query()` | RAG query across email, Slack, and calendar |

## B2B2B Integration

To integrate this into your own app, add user provisioning:

```typescript
import { Attrove } from '@attrove/sdk';

// Server-side: provision users
const admin = Attrove.admin({ clientId, clientSecret });
const { id, apiKey: userToken } = await admin.users.create({ email: 'user@example.com' });
const { token } = await admin.users.createConnectToken(id);

// Send connectUrl to user → they connect Gmail/Slack → you query their context
const attrove = new Attrove({ apiKey: userToken, userId: id });
const brief = await attrove.query('What do I need to know before my next meeting?');
```

See the [quickstart](../quickstart) for the full B2B2B flow.

## Resources

- [SDK Documentation](https://docs.attrove.com/sdks/typescript)
- [API Reference](https://docs.attrove.com/api)
- [MCP Server](https://www.npmjs.com/package/@attrove/mcp) (zero-code version)
