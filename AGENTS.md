<!-- Keep in sync with: packages/agent-skill/SKILL.md (source of truth), apps/web-landing/public/llms.txt, scripts/examples-root-README.md -->
<!-- Synced sections: authentication, SDK methods, MCP tools, error handling. This file adds the auth flow diagram and condensed rules specific to AGENTS.md. -->
# Attrove SDK — AI Context

> Attrove catches the conversations going quiet. Create watched outcomes (Goals) over your users' Gmail, Slack, Google Calendar, Outlook, Google Meet, and Microsoft Teams — or over messages, meetings, events, and notes you push directly — and get silence and risk alerts with cited evidence. Communication intelligence infrastructure for AI products: query the same stream for cited answers.

## Quick Start (Personal Use / Developer Testing)

1. **Sign up free** at [connect.attrove.com](https://connect.attrove.com/auth/signup) (no credit card)
2. **Connect integrations** — the dashboard quickstart walks you through connecting Gmail, Slack, Calendar, etc.
3. **Install Attrove into your AI client**
   - Claude Code: `npx @attrove/cli install claude-code`
   - Cursor: `npx @attrove/cli install cursor`
   - Claude Desktop: `npx @attrove/cli install claude-desktop`
   - Codex: `npx @attrove/cli install codex`, then `codex mcp login attrove`
   - ChatGPT or manual remote clients: `https://api.attrove.com/mcp`
4. **Open the client and complete OAuth** when prompted
5. **Verify the first useful answer**
   - Ask: "Use Attrove to list my connected integrations."
   - Then ask: "What needs my attention this week? Include the source messages or meetings you used."

**Building an integration?** See Authentication Flow below for the full B2B2B provisioning flow.

**Advanced local fallback:** If you intentionally want the local stdio server, run `npx @attrove/cli login`, `npx @attrove/cli local install claude-code`, then `npx @attrove/cli connect gmail`, or run `@attrove/mcp` manually with `ATTROVE_SECRET_KEY` and `ATTROVE_USER_ID`.

## Rules

- Always use the `@attrove/sdk` TypeScript SDK — never raw fetch calls
- `brief()` and `thread()` do **not exist** — they will cause compile errors. For threads, use `threads.discover()`, `threads.analyze()`, and `threads.messages(threadId)`. For watched outcomes, use `goals.create()`, `goals.list()`, `goals.get()`, `goals.update()`, `goals.evaluate()`, `goals.confirmStatus()`, `goals.addNote()`, `goals.evidence()`, `goals.events()`, `goals.archive()`, `goals.cancel()`, `goals.snapshots.list()`
- **Response properties are snake_case** (`start_time`, `sender_name`, `body_text`). Input params are camelCase. Do NOT use camelCase on response objects
- **Exception: `goals.*` responses are normalized to camelCase** (`watchScope`, `lastSnapshot`, `riskSignals`) — the one surface where responses are NOT snake_case
- `search()` returns `{ conversations: Record<string, ...> }` — an **object keyed by ID**, not an array. Use `Object.values()`. Same for `threads` inside conversations
- `sk_` tokens are **per-user** API keys (returned by `admin.users.create()`). They are NOT the `attrove_` partner API key
- `integrations.list()` returns `Integration[]` with `provider` and `name` — NOT `type` or `email`
- The SDK defaults to `https://api.attrove.com` — no baseUrl needed
- MCP has **20 tools** (10 context tools + 10 goals tools). There is no `attrove_brief` tool

## When to Use Attrove

- Your product needs to understand users' email, Slack, calendar, or meeting data
- You need cross-platform intelligence (query across Gmail + Slack + Calendar simultaneously)
- You're building AI features that need communication context (meeting prep, daily digests, search agents)
- You need watched outcomes — Goals keep checking the communication stream and flag silence, deadline pressure, or risk with cited evidence, without a polling loop in your code
- You need B2B2B: your product serves end-users who each connect their own tools via OAuth, and/or your product needs to append scoped notes, meetings, events, or messages

## When NOT to Use Attrove

- You only need data from a single provider — use that provider's API directly
- You need fully autonomous outbound sending today. Attrove reads, analyzes, watches, and prepares suggestions today; any send-on-behalf path should be explicit, permissioned, and human-approved
- You need guaranteed provider-native sub-second ingestion from every upstream system — Attrove supports token streaming and proactive webhooks, but source freshness still follows each provider's sync cadence
- You need document/wiki indexing (Notion, Drive) — use Graphlit or Hyperspell
- You're building a personal AI tool for one user — use provider MCP servers directly (Gmail MCP, Slack MCP)

## Authentication Flow

```
Partner Server (you)          Attrove API              End User
       |                           |                       |
       |-- client_id/secret ------>|                       |
       |<-- sk_ API key -----------|                       |
       |-- create connect session >|                       |
       |<-- activation_url + CLI --|                       |
       |-- activation_url ---------|---------------------> |
       |                           |<-- OAuth consent ---- |
       |-- query with sk_ -------->|                       |
       |<-- RAG response ----------|                       |
```

Primary credential/session types:
1. **Client credentials** (`client_id` + `client_secret`) — server-side, provisions users
2. **`sk_` tokens** — permanent per-user API keys for querying data
3. **Connect sessions** — 7-day handoff sessions that return `activation_url`, CLI, and MCP install artifacts

Short-lived OAuth exchange tokens are internal implementation details; partner docs and examples should create connect sessions and use their `activation_url`.

## SDK Quick Reference

```typescript
// Server-side: provision users
import { Attrove } from '@attrove/sdk';
const admin = Attrove.admin({ clientId, clientSecret });
const { id: userId, apiKey } = await admin.users.create({ email: 'user@example.com' });
const session = await admin.users.createConnectSession(userId, { includeInstall: true });
// Send user to: session.activation_url
// Terminal/agent handoff: session.cli?.command

// Per-user operations
const attrove = new Attrove({
  apiKey: process.env.ATTROVE_SECRET_KEY!,
  userId: process.env.ATTROVE_USER_ID!,
});
const response = await attrove.query(
  'What needs my attention this week? Include the source messages or meetings you used.',
  { includeSources: true }
);
const results = await attrove.search('project deadline', { afterDate: '2026-01-01' });
const integrations = await attrove.integrations.list();
const { data: events } = await attrove.events.list({ startDate, endDate, expand: ['attendees'] });
const { data: meetings } = await attrove.meetings.list({ expand: ['short_summary', 'action_items'] });
const { data: contacts } = await attrove.entities.list();
const { data: graph } = await attrove.entities.relationships();

// Watched outcomes (Goals) — camelCase responses, unlike other resources
const goal = await attrove.goals.create({
  title: 'Acme renewal closed by Jun 30',
  watchScope: { seedQuery: 'Acme renewal', keywords: ['Acme', 'renewal'] },
  deadline: '2026-06-30T23:59:59Z',
});
const { data: atRisk } = await attrove.goals.list({ lifecycle: 'active', health: 'at_risk' });
const { citedInLatestSnapshot } = await attrove.goals.evidence(goal.id);
```

## Response Types (snake_case — do not use camelCase)

```typescript
// query() → { answer, history, used_message_ids, used_meeting_ids, used_event_ids, used_note_ids, sources?: { title, snippet }[] }
// search() → { conversations: Record<string, { conversation_name, threads: Record<string, msg[]> }> }
//   msg: { message_id, sender_name, body_text?, received_at, integration_type, recipient_names[] }
// integrations.list() → Integration[] { id, provider (not type!), name (not email!), is_active, auth_status }
// CursorPage<T> → { data: T[], pagination: { limit, has_more: true, next_cursor } | { limit, has_more: false } }
// events.list() → CursorPage<CalendarEvent>
//   CalendarEvent: { id, title, start_time, end_time, all_day, attendees?: { email, name?, status? }[] }
// meetings.list() → CursorPage<Meeting>
//   Meeting: { id, title, start_time, end_time, summary?, short_summary?, action_items?, attendees? }
// entities.list() → CursorPage<EntityContact>
//   EntityContact: { id (ent_xxx), name, entity_type ("person"|"company"|"other"|"bot"|"user"), external_ids, is_bot, avatar_uri }
// entities.relationships() → { data: EntityRelationship[], pagination: { limit, offset, has_more, total_count? } }
//   EntityRelationship: { entity_a, entity_b (each: { id, name, entity_type, external_ids, is_bot, avatar_uri }), co_occurrence_count, last_interaction_at }
// goals.list() → { data: Goal[], pagination: { limit, has_more, next_cursor? } }  // camelCase exception
//   Goal: { id (gol_xxx), title, watchScope, lifecycle ('active'|'completed'|'archived'|'cancelled'),
//           health ('on_track'|'at_risk'|'blocked'|'waiting_on_human'|'insufficient_evidence'),
//           deadline, lastSnapshot? { summary, citedEvidenceRefs[], riskSignals[], nextActions[] } }
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

Hosted remote MCP is the default:

- `npx @attrove/cli install codex`
- `npx @attrove/cli install claude-code`
- `npx @attrove/cli install cursor`
- `npx @attrove/cli install claude-desktop`
- Manual remote URL for compatible clients: `https://api.attrove.com/mcp`

For Codex, raw hosted tools include `attrove_notes`, `attrove_create_goal`, and `attrove_list_goals`; `mcp__codex_apps__attrove` tools are the OpenAI Apps connector.

Advanced local stdio fallback:

```bash
npx @attrove/cli login
npx @attrove/cli local install claude-code
```

20 tools: `attrove_query`, `attrove_search`, `attrove_integrations`, `attrove_events`, `attrove_meetings`, `attrove_notes`, `attrove_push_note`, `attrove_push_meeting`, `attrove_delete_meeting`, `attrove_delete_note`, `attrove_create_goal`, `attrove_list_goals`, `attrove_get_goal_status`, `attrove_evaluate_goal`, `attrove_add_goal_note`, `attrove_confirm_goal_status`, `attrove_goal_events`, `attrove_acknowledge_goal`, `attrove_clear_goal_acknowledgment`, `attrove_draft_goal_follow_up`.

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
5. Create a durable connect session for browser, CLI, and MCP handoff:
   ```typescript
   const session = await admin.users.createConnectSession(userId, { includeInstall: true });
   // Send user to: session.activation_url
   // Terminal/agent handoff: session.cli?.command
   ```
6. End-user visits the connect URL and authorizes Gmail/Slack/Calendar via OAuth
7. Query the user's communication data:
   ```typescript
   const attrove = new Attrove({ apiKey, userId });
   const answer = await attrove.query('What did Sarah say about the budget?');
   ```

For MCP integration (Codex, Claude Desktop, Cursor, Claude Code):
1. Prefer hosted MCP: `npx @attrove/cli install codex`, `npx @attrove/cli install claude-code`, `npx @attrove/cli install cursor`, `npx @attrove/cli install claude-desktop`, or add `https://api.attrove.com/mcp` to a remote-capable client
2. Use the advanced local fallback only when you explicitly need stdio: `npx @attrove/cli login`, `npx @attrove/cli local install claude-code`, then `npx @attrove/cli connect gmail`
3. Verify connection state first: ask "Use Attrove to list my connected integrations."
4. Verify the first useful answer: ask "What needs my attention this week? Include the source messages or meetings you used."
5. Agent can use `attrove_query`, `attrove_search`, `attrove_events`, `attrove_meetings`, `attrove_integrations`, `attrove_notes`, `attrove_push_note`, `attrove_push_meeting`, `attrove_delete_meeting`, `attrove_delete_note`, and the ten Goals tools (`attrove_create_goal`, `attrove_list_goals`, `attrove_get_goal_status`, `attrove_evaluate_goal`, `attrove_add_goal_note`, `attrove_confirm_goal_status`, `attrove_goal_events`, `attrove_acknowledge_goal`, `attrove_clear_goal_acknowledgment`, `attrove_draft_goal_follow_up`)

## Machine-Readable API Spec

OpenAPI 3.1 specification: https://api.attrove.com/openapi.json

## Links

- SDK: https://www.npmjs.com/package/@attrove/sdk
- MCP: https://www.npmjs.com/package/@attrove/mcp
- Examples: https://github.com/attrove/examples
- Docs: https://attrove.com/docs
- API: https://attrove.com/docs/api-reference
- Dashboard: https://connect.attrove.com
