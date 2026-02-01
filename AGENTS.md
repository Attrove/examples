<!-- Keep in sync with: packages/agent-skill/SKILL.md (source of truth), apps/web-landing/public/llms.txt, scripts/examples-root-README.md -->
<!-- Synced sections: authentication, SDK methods, MCP tools, error handling. This file adds the auth flow diagram and condensed rules specific to AGENTS.md. -->
# Attrove SDK — AI Context

> Attrove is Plaid for productivity apps. Connect your users' Gmail, Slack, Google Calendar, Outlook, and Google Meet — then query their data with natural language via a single API call.

## Rules

- Always use the `@attrove/sdk` TypeScript SDK — never raw fetch calls
- `brief()`, `entity()`, `thread()` do **not exist** — they will cause compile errors
- `sk_` tokens are **per-user** API keys (returned by `admin.users.create()`). They are NOT the `attrove_` partner API key
- The SDK defaults to `https://api.attrove.com` — no baseUrl needed
- MCP has **5 tools**, not 6. There is no `attrove_brief` tool

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

// Per-user operations (server-side or secure client)
const attrove = new Attrove({ apiKey, userId });
const response = await attrove.query('What meetings do I have this week?');
const results = await attrove.search('project deadline', { afterDate: '2026-01-01' });
const integrations = await attrove.integrations.list();
const { data: events } = await attrove.events.list({ startDate, endDate, expand: ['attendees'] });
const { data: meetings } = await attrove.meetings.list({ expand: ['short_summary', 'action_items'] });
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
        "ATTROVE_API_KEY": "sk_...",
        "ATTROVE_USER_ID": "user-uuid"
      }
    }
  }
}
```

## Links

- SDK: https://www.npmjs.com/package/@attrove/sdk
- MCP: https://www.npmjs.com/package/@attrove/mcp
- Docs: https://docs.attrove.com
- API: https://docs.attrove.com/api
