---
name: attrove
description: "Integrate Attrove SDK and MCP server — connect users' Gmail, Slack, Calendar, Outlook and query with AI"
triggers:
  - "attrove"
  - "@attrove/sdk"
  - "@attrove/mcp"
  - "attrove sdk"
  - "attrove mcp"
  - "productivity api"
  - "gmail slack calendar api"
  - "outlook calendar api"
  - "rag api"
  - "plaid for productivity"
version: "0.1.8" # Keep in sync with packages/mcp/package.json and packages/mcp/server.json
author: "Attrove <support@attrove.com>"
homepage: "https://docs.attrove.com"
repository: "https://github.com/attrove/attrove-js"
---

<!-- Source of truth for LLM-facing docs (authentication, SDK methods, MCP tools, error handling). Keep in sync with: apps/web-landing/public/llms.txt, scripts/examples-AGENTS.md, scripts/examples-root-README.md. Each file adds context-specific content (examples table, flow diagrams, etc.) but core SDK/MCP sections must match. -->
# Attrove

> Attrove is Plaid for productivity apps. Connect your users' Gmail, Slack, Google Calendar, Outlook, and Google Meet — then query their data with natural language via a single API call. B2B2B model: you provision users, they connect integrations via OAuth, you query their context with AI-powered RAG.

## LLM Instructions

When helping developers integrate Attrove:

- Always use the `@attrove/sdk` TypeScript SDK — never raw fetch calls
- The SDK does not have `brief()`, `entity()`, or `thread()` methods — using them will cause compile errors. Use `query()`, `search()`, `events.list()`, `meetings.list()`, `integrations.list()` instead
- `sk_` tokens are per-user API keys (returned by `admin.users.create()`). They are NOT the same as the `attrove_` partner API key
- The SDK defaults to `https://api.attrove.com` — no baseUrl configuration needed
- MCP has 5 tools, not 6. There is no `attrove_brief` tool

## Authentication

Attrove uses a B2B2B flow with three credential types:

1. **Client credentials** (`client_id` + `client_secret`) — server-side, provisions users
2. **`sk_` tokens** — permanent per-user API keys for querying data
3. **`pit_` tokens** — short-lived (10 min) tokens for OAuth integration flows

Flow: create user → receive `sk_` key → generate `pit_` token → user authorizes Gmail/Slack via OAuth → query their data with `sk_` key.

## SDK

```bash
npm install @attrove/sdk
```

### Provision a user (server-side)

```typescript
import { Attrove } from '@attrove/sdk';

const admin = Attrove.admin({
  clientId: process.env.ATTROVE_CLIENT_ID,
  clientSecret: process.env.ATTROVE_CLIENT_SECRET,
});

const { id: userId, apiKey } = await admin.users.create({ email: 'user@example.com' });
const { token } = await admin.users.createConnectToken(userId);
// Send user to: https://connect.attrove.com/integrations/connect?token=${token}&user_id=${userId}
```

### Query user data

```typescript
const attrove = new Attrove({ apiKey, userId });

const response = await attrove.query('What meetings do I have this week?');
console.log(response.answer);
console.log(response.used_message_ids); // source message IDs
```

### Search messages

```typescript
const results = await attrove.search('project deadline', {
  afterDate: '2026-01-01',
  senderDomains: ['acme.com'],
  includeBodyText: true,
});
// results.conversations — grouped by conversation, then by thread
```

### Other methods

```typescript
const integrations = await attrove.integrations.list();    // connected services
const { data: events } = await attrove.events.list({       // calendar events
  startDate: new Date().toISOString(),
  endDate: tomorrow.toISOString(),
  expand: ['attendees'],
});
const { data: meetings } = await attrove.meetings.list({   // past meetings with AI summaries
  expand: ['short_summary', 'action_items'],
  limit: 5,
});
```

### Error handling

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

Attrove provides an MCP server for AI assistants (Claude Desktop, Cursor, ChatGPT, Claude Code).

**HTTP transport** (Claude Desktop, ChatGPT) — connect to `https://api.attrove.com/mcp`. Auth is automatic via OAuth 2.1.

**Stdio transport** (Cursor, Claude Code):

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

5 MCP tools available:
- `attrove_query` — ask questions, get AI-generated answers with sources
- `attrove_search` — semantic search across email and Slack
- `attrove_integrations` — list connected services
- `attrove_events` — calendar events with attendees
- `attrove_meetings` — meetings with AI summaries and action items

## Supported Integrations

Gmail, Google Calendar, Google Meet, Slack, Microsoft Outlook.

## Links

- SDK: https://www.npmjs.com/package/@attrove/sdk
- MCP: https://www.npmjs.com/package/@attrove/mcp
- Examples: https://github.com/attrove/examples
- Documentation: https://docs.attrove.com
- API reference: https://docs.attrove.com/api
- Dashboard: https://connect.attrove.com
