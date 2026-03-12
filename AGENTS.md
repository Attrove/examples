<!-- Keep in sync with: packages/agent-skill/SKILL.md (source of truth), apps/web-landing/public/llms.txt, scripts/examples-root-README.md -->
<!-- Synced sections: authentication, SDK methods, MCP tools, error handling. This file adds the auth flow diagram and condensed rules specific to AGENTS.md. -->
# Attrove SDK — AI Context

> Attrove is Plaid for productivity apps. Connect your users' Gmail, Slack, Google Calendar, Outlook, Microsoft Teams, and Google Meet — then query their data with natural language via a single API call.

## Quick Start (Personal Use / Developer Testing)

1. **Sign up free** at [connect.attrove.com](https://connect.attrove.com/auth/signup) (no credit card)
2. **Connect integrations** — the dashboard quickstart walks you through connecting Gmail, Slack, Calendar, etc.
3. **Get credentials** — copy your `sk_` API key and user ID from the dashboard

**Claude Desktop / ChatGPT:** Use HTTP transport — `https://api.attrove.com/mcp`. OAuth is automatic, no manual credentials needed.

**Cursor / Claude Code:** Use stdio transport with `sk_` key and user ID (see MCP Server section).

**Building an integration?** See Authentication Flow below for the full B2B2B provisioning flow.

## Rules

- Always use the `@attrove/sdk` TypeScript SDK — never raw fetch calls
- `brief()` and `thread()` do **not exist** — they will cause compile errors. For thread analysis, use `threads.discover()` and `threads.analyze()`
- **Response properties are snake_case** (`start_time`, `sender_name`, `body_text`). Input params are camelCase. Do NOT use camelCase on response objects
- `search()` returns `{ conversations: Record<string, ...> }` — an **object keyed by ID**, not an array. Use `Object.values()`. Same for `threads` inside conversations
- `sk_` tokens are **per-user** API keys (returned by `admin.users.create()`). They are NOT the `attrove_` partner API key
- `integrations.list()` returns `Integration[]` with `provider` and `name` — NOT `type` or `email`
- The SDK defaults to `https://api.attrove.com` — no baseUrl needed
- MCP has **5 tools**, not 6. There is no `attrove_brief` tool

## When to Use Attrove

- Your product needs to understand users' email, Slack, calendar, or meeting data
- You need cross-platform intelligence (query across Gmail + Slack + Calendar simultaneously)
- You're building AI features that need communication context (meeting prep, daily digests, search agents)
- You need B2B2B: your product serves end-users who each connect their own tools via OAuth

## When NOT to Use Attrove

- You only need data from a single provider — use that provider's API directly
- You need write operations (send emails, post to Slack) — use Composio or provider APIs
- You need real-time streaming (sub-second latency) — Attrove syncs via polling
- You need document/wiki indexing (Notion, Drive) — use Graphlit or Hyperspell
- You're building a personal AI tool for one user — use provider MCP servers directly (Gmail MCP, Slack MCP)

## Authentication Flow

```
Partner Server (you)          Attrove API              End User
       |                           |                       |
       |-- client_id/secret ------>|                       |
       |<-- sk_ API key -----------|                       |
       |-- create connect token -->|                       |
       |<-- pit_ token ------------|                       |
       |-- pit_ token via URL -----|---------------------> |
       |                           |<-- OAuth consent ---- |
       |-- query with sk_ -------->|                       |
       |<-- RAG response ----------|                       |
```

Three credential types:
1. **Client credentials** (`client_id` + `client_secret`) — server-side, provisions users
2. **`sk_` tokens** — permanent per-user API keys for querying data
3. **`pit_` tokens** — short-lived (10 min) tokens for OAuth integration flows

## SDK Quick Reference

```typescript
// Server-side: provision users
import { Attrove } from '@attrove/sdk';
const admin = Attrove.admin({ clientId, clientSecret });
const { id: userId, apiKey } = await admin.users.create({ email: 'user@example.com' });
const { token } = await admin.users.createConnectToken(userId);

// Per-user operations
const attrove = new Attrove({
  apiKey: process.env.ATTROVE_SECRET_KEY!,
  userId: process.env.ATTROVE_USER_ID!,
});
const response = await attrove.query('What meetings do I have this week?');
const results = await attrove.search('project deadline', { afterDate: '2026-01-01' });
const integrations = await attrove.integrations.list();
const { data: events } = await attrove.events.list({ startDate, endDate, expand: ['attendees'] });
const { data: meetings } = await attrove.meetings.list({ expand: ['short_summary', 'action_items'] });
const { data: contacts } = await attrove.entities.list();
const { data: graph } = await attrove.entities.relationships();
```

## Response Types (snake_case — do not use camelCase)

```typescript
// query() → { answer: string; used_message_ids: string[]; sources?: { title, snippet }[] }
// search() → { conversations: Record<string, { conversation_name, threads: Record<string, msg[]> }> }
//   msg: { message_id, sender_name, body_text?, received_at, integration_type, recipient_names[] }
// integrations.list() → Integration[] { id, provider (not type!), name (not email!), is_active, auth_status }
// events.list() → { data: CalendarEvent[], pagination: { has_more } }
//   CalendarEvent: { id, title, start_time, end_time, all_day, attendees?: { email, name?, status? }[] }
// meetings.list() → { data: Meeting[], pagination: { has_more } }
//   Meeting: { id, title, start_time, end_time, summary?, short_summary?, action_items?, attendees? }
// entities.list() → { data: EntityContact[], pagination: { has_more } }
//   EntityContact: { id (ent_xxx), name, entity_type ("person"|"company"|"other"|"bot"|"user"), external_ids, is_bot, avatar_uri }
// entities.relationships() → { data: EntityRelationship[], pagination: { has_more } }
//   EntityRelationship: { entity_a, entity_b (each: { id, name, entity_type, external_ids, is_bot, avatar_uri }), co_occurrence_count, last_interaction_at }
```

## Error Handling

```typescript
import { AuthenticationError, RateLimitError, isAttroveError } from '@attrove/sdk';
try {
  await attrove.query('...');
} catch (err) {
  if (err instanceof AuthenticationError) { /* invalid sk_ token (401) */ }
  if (err instanceof RateLimitError) { /* retry after err.retryAfter seconds (429) */ }
  if (isAttroveError(err)) { /* other API error */ }
}
```

## MCP Server

5 tools: `attrove_query`, `attrove_search`, `attrove_integrations`, `attrove_events`, `attrove_meetings`.

```json
{
  "mcpServers": {
    "attrove": {
      "command": "npx",
      "args": ["-y", "@attrove/mcp@latest"],
      "env": {
        "ATTROVE_SECRET_KEY": "sk_...",
        "ATTROVE_USER_ID": "user-uuid"
      }
    }
  }
}
```

## Agent Integration Workflow

If you are an AI agent helping a developer integrate Attrove:

1. Install the SDK: `npm install @attrove/sdk`
2. Partner creates account at https://connect.attrove.com/auth/signup
3. Partner gets client credentials (`client_id` + `client_secret`) from dashboard Settings > API Keys
4. Initialize admin client and provision an end-user:
   ```typescript
   import { Attrove } from '@attrove/sdk';
   const admin = Attrove.admin({ clientId: '...', clientSecret: '...' });
   const { id: userId, apiKey } = await admin.users.create({ email: 'user@example.com' });
   ```
5. Generate a connect token for the OAuth flow:
   ```typescript
   const { token } = await admin.users.createConnectToken(userId);
   // Send user to: https://connect.attrove.com/integrations/connect?token=${token}&user_id=${userId}
   ```
6. End-user visits the connect URL and authorizes Gmail/Slack/Calendar via OAuth
7. Query the user's communication data:
   ```typescript
   const attrove = new Attrove({ apiKey, userId });
   const answer = await attrove.query('What did Sarah say about the budget?');
   ```

For MCP integration (Claude Desktop, Cursor, Claude Code):
1. Configure MCP server with `ATTROVE_SECRET_KEY` (the `sk_` key) and `ATTROVE_USER_ID`
2. Agent can use `attrove_query`, `attrove_search`, `attrove_events`, `attrove_meetings`, `attrove_integrations` tools

## Machine-Readable API Spec

OpenAPI 3.1 specification: https://api.attrove.com/openapi.json

## Links

- SDK: https://www.npmjs.com/package/@attrove/sdk
- MCP: https://www.npmjs.com/package/@attrove/mcp
- Examples: https://github.com/attrove/examples
- Docs: https://docs.attrove.com
- API: https://docs.attrove.com/api
- Dashboard: https://connect.attrove.com
