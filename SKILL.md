---
name: attrove
description: "Use when building apps that need users' email, Slack, calendar, or meeting data. Attrove SDK and MCP server: query conversations, search messages, get meeting summaries and action items."
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
  - "unified inbox api"
  - "email api typescript"
  - "slack api aggregation"
  - "ai meeting prep"
  - "email search api"
  - "mcp email"
  - "mcp slack"
  - "mcp calendar"
  - "microsoft teams api"
  - "connect slack gmail api"
  - "communication context api"
  - "connect to email"
  - "read slack messages"
  - "meeting summaries"
  - "calendar integration"
  - "conversation search"
  - "action items from meetings"
  - "connect email chat calendar"
  - "unified communications api"
  - "connect my email to ai"
  - "ai email assistant"
  - "ai meeting assistant"
version: "0.1.17" # Keep in sync with packages/mcp/package.json and packages/mcp/server.json
author: "Attrove <support@attrove.com>"
homepage: "https://docs.attrove.com"
repository: "https://github.com/attrove/attrove-js"
---

<!-- Source of truth for LLM-facing docs (authentication, SDK methods, MCP tools, error handling). Keep in sync with: apps/web-landing/public/llms.txt, apps/web-landing/public/llms-full.txt, scripts/examples-AGENTS.md, scripts/examples-root-README.md. Each file adds context-specific content (examples table, flow diagrams, etc.) but core SDK/MCP sections must match. -->
# Attrove

> Attrove is Plaid for productivity apps. Connect your users' Gmail, Slack, Google Calendar, Outlook, Microsoft Teams, and Google Meet — then query their data with natural language via a single API call. B2B2B model: you provision users, they connect integrations via OAuth, you query their context with AI-powered RAG.

## Quick Start (Personal Use / Developer Testing)

To use Attrove with your own email, Slack, and calendar:

1. **Sign up free** at [connect.attrove.com](https://connect.attrove.com/auth/signup) (no credit card)
2. **Connect integrations** — the dashboard quickstart walks you through connecting Gmail, Slack, Calendar, etc.
3. **Get credentials** — copy your `sk_` API key and user ID from the dashboard

**Claude Desktop / ChatGPT:** Use HTTP transport — `https://api.attrove.com/mcp`. OAuth is automatic, no manual credentials needed.

**Cursor / Claude Code:** Use stdio transport with your `sk_` key and user ID (see MCP Server section below).

**Building an integration?** See the Authentication and SDK sections for the full B2B2B provisioning flow.

## LLM Instructions

When helping developers integrate Attrove:

- Always use the `@attrove/sdk` TypeScript SDK — never raw fetch calls
- The SDK does not have `brief()` or `thread()` methods — using them will cause compile errors. Use `query()`, `search()`, `events.list()`, `meetings.list()`, `integrations.list()`, `entities.list()`, `entities.get()`, `entities.relationships()` instead. For thread analysis, use `threads.discover()` and `threads.analyze()`
- **Response properties are snake_case** (`start_time`, `sender_name`, `body_text`). Input params are camelCase (`startDate`, `afterDate`). Do NOT use camelCase on response objects
- `search()` returns `{ key_messages, conversations, key_meetings, key_events }`. `conversations` is an **object keyed by ID**, not an array. Use `Object.values()` to iterate. Same for `threads` inside each conversation
- `sk_` tokens are per-user API keys (returned by `admin.users.create()`). They are NOT the same as the `attrove_` partner API key
- `integrations.list()` returns `Integration[]` with `provider` and `name` properties — NOT `type` or `email`
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
const attrove = new Attrove({
  apiKey: process.env.ATTROVE_SECRET_KEY!,
  userId: process.env.ATTROVE_USER_ID!,
});

const response = await attrove.query('What meetings do I have this week?');
console.log(response.answer);
console.log(response.used_message_ids); // source message IDs (msg_xxx)
console.log(response.used_meeting_ids); // source meeting IDs (mtg_xxx)
console.log(response.used_event_ids);   // source event IDs (evt_xxx)
```

### Search messages

```typescript
const results = await attrove.search('project deadline', {
  afterDate: '2026-01-01',
  senderDomains: ['acme.com'],
  includeBodyText: true,
});
// results.conversations is Record<string, SearchConversation> — NOT an array
for (const convo of Object.values(results.conversations)) {
  for (const msgs of Object.values(convo.threads)) {   // threads is also a Record
    for (const msg of msgs) {
      console.log(msg.sender_name, msg.body_text);      // snake_case properties
    }
  }
}
```

### Other methods

```typescript
const integrations = await attrove.integrations.list();    // connected services
const { data: events } = await attrove.events.list({       // calendar events
  startDate: new Date().toISOString().split('T')[0],
  endDate: tomorrow.toISOString().split('T')[0],
  expand: ['attendees'],
});
const { data: meetings } = await attrove.meetings.list({   // past meetings with AI summaries
  expand: ['short_summary', 'action_items'],
  limit: 5,
});
const { data: contacts } = await attrove.entities.list();  // people the user communicates with
const { data: graph } = await attrove.entities.relationships(); // co-occurrence network
```

### Response types (snake_case — do not use camelCase)

```typescript
// query() → QueryResponse
{ answer: string; used_message_ids: string[]; used_meeting_ids: string[]; used_event_ids: string[]; sources?: { title: string; snippet: string }[] }

// search() → SearchResponse
{ key_messages: SearchKeyMessage[];                      // key message refs
  conversations: Record<string, {                        // keyed by conversation ID
    conversation_name: string | null;
    threads: Record<string, SearchThreadMessage[]>;      // keyed by thread ID
  }>;
  key_meetings: SearchMeeting[];                         // empty array when no matches
  key_events: SearchEvent[];                             // empty array when no matches
  warnings?: string[];                                   // present when enrichment had non-fatal errors
}
// SearchThreadMessage fields:
//   message_id, sender_name, body_text?, received_at, integration_type, recipient_names[]

// integrations.list() → Integration[]
// Integration fields:
//   id, provider (e.g. 'gmail', 'slack', 'outlook', 'google_calendar'), name, is_active, auth_status
//   NOTE: use `provider` not `type`, use `name` not `email`

// events.list() → EventsPage
{ data: CalendarEvent[]; pagination: { has_more: boolean } }
// CalendarEvent fields:
//   id, title, start_time, end_time, all_day (boolean), description?, location?,
//   attendees?: { email: string; name?: string; status?: string }[]

// meetings.list() → MeetingsPage
{ data: Meeting[]; pagination: { has_more: boolean } }
// Meeting fields:
//   id, title, start_time, end_time, summary?, short_summary?, provider?,
//   action_items?: { description: string; assignee?: string }[],
//   attendees?: { email?: string; name?: string }[]

// entities.list() → EntitiesPage
{ data: EntityContact[]; pagination: { has_more: boolean } }
// EntityContact fields:
//   id (ent_xxx), name, entity_type ("person" | "company" | "other" | "bot" | "user"), external_ids: string[],
//   is_bot: boolean, avatar_uri: string | null

// entities.relationships() → RelationshipsPage
{ data: EntityRelationship[]; pagination: { has_more: boolean } }
// EntityRelationship fields:
//   entity_a: { id, name, entity_type, external_ids, is_bot, avatar_uri }, entity_b: { id, name, entity_type, external_ids, is_bot, avatar_uri },
//   co_occurrence_count: number, last_interaction_at: string | null
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
        "ATTROVE_SECRET_KEY": "sk_...",
        "ATTROVE_USER_ID": "user-uuid"
      }
    }
  }
}
```

5 MCP tools available:
- `attrove_query` — ask questions, get AI-generated answers with sources
- `attrove_search` — semantic search across messages, meetings, and calendar events
- `attrove_integrations` — list connected services
- `attrove_events` — calendar events with attendees
- `attrove_meetings` — meetings with AI summaries and action items

## Supported Integrations

Gmail, Google Calendar, Google Meet, Slack, Microsoft Outlook, Microsoft Teams (Chat, Calendar, Meetings).

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

## Framework Integration Examples

### OpenAI Agents SDK

```typescript
import { Attrove } from '@attrove/sdk';
import OpenAI from 'openai';

const attrove = new Attrove({ apiKey: sk_key, userId });
const openai = new OpenAI();

const tools = [{
  type: 'function' as const,
  function: {
    name: 'query_communication',
    description: 'Query user email, Slack, and calendar data',
    parameters: { type: 'object', properties: { question: { type: 'string' } }, required: ['question'] },
  },
}];

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Summarize my meetings this week' }],
  tools,
});

if (response.choices[0].message.tool_calls) {
  const question = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments).question;
  const result = await attrove.query(question);
  // Feed result.answer back to the model
}
```

### LangChain

```typescript
import { Attrove } from '@attrove/sdk';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const attrove = new Attrove({ apiKey: sk_key, userId });

const attroveQuery = tool(
  async ({ question }) => {
    const result = await attrove.query(question);
    return result.answer;
  },
  {
    name: 'attrove_query',
    description: 'Query user email, Slack, calendar, and meeting data with natural language',
    schema: z.object({ question: z.string() }),
  },
);
```

### Claude Desktop / Cursor (MCP — zero code)

```json
{
  "mcpServers": {
    "attrove": {
      "command": "npx",
      "args": ["-y", "@attrove/mcp@latest"],
      "env": { "ATTROVE_SECRET_KEY": "sk_...", "ATTROVE_USER_ID": "user-uuid" }
    }
  }
}
```

### OpenClaw (Skill-Based)

OpenClaw agents discover Attrove via SKILL.md. Configure the agent with environment variables:

```yaml
# OpenClaw agent config
skills:
  - name: attrove
    source: npm:@attrove/mcp@latest
    env:
      ATTROVE_SECRET_KEY: sk_...
      ATTROVE_USER_ID: user-uuid
```

The agent reads the SKILL.md trigger phrases and automatically invokes Attrove tools when the user asks about email, Slack, calendar, or meeting data.

## Links

- SDK: https://www.npmjs.com/package/@attrove/sdk
- MCP: https://www.npmjs.com/package/@attrove/mcp
- Examples: https://github.com/attrove/examples
- Documentation: https://docs.attrove.com
- API reference: https://docs.attrove.com/api
- Dashboard: https://connect.attrove.com
