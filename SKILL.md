---
name: attrove
description: "Watch outcomes and catch the conversations going quiet across users' Gmail, Slack, Outlook, Google Calendar, meetings, and notes — via SDK or MCP. Use when an app or agent needs to track an outcome until it resolves (renewals, deals, follow-ups), get silence and risk alerts with cited evidence, or search and query communication context. Attrove SDK (@attrove/sdk) and MCP server (@attrove/mcp): create Goals — watched outcomes that keep checking the communication stream — plus query conversations, search messages, and get meeting summaries, action items, and notes."
triggers:
  - "attrove"
  - "@attrove/sdk"
  - "@attrove/mcp"
  - "attrove sdk"
  - "attrove mcp"
  - "watched outcomes"
  - "goal tracking api"
  - "goal monitoring"
  - "outcome monitoring"
  - "silence detection"
  - "conversation monitoring"
  - "renewal at risk alerts"
  - "renewal going quiet"
  - "stale follow-up alert"
  - "deal slip detection"
  - "commitment tracking"
  - "catch dropped commitments"
  - "catch what slips"
  - "productivity api"
  - "communication intelligence"
  - "gmail slack calendar api"
  - "outlook calendar api"
  - "rag api"
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
compatibility: "Requires Node.js 18+. Works with Codex, Claude Code, Cursor, Claude Desktop, ChatGPT, and any MCP-compatible client."
metadata:
  version: "0.5.0"
  author: "Attrove <support@attrove.com>"
  homepage: "https://attrove.com/docs"
  repository: "https://github.com/attrove/attrove-js"
license: "MIT"
---

# Attrove

> Attrove catches the conversations going quiet. Create watched outcomes (Goals) over your users' Gmail, Slack, Google Calendar, Outlook, Google Meet, and Microsoft Teams — or over messages, meetings, events, and notes you push directly — and get silence and risk alerts with cited evidence. Conversation monitoring infrastructure for AI products. B2B2B model: you provision users, connect live sources through OAuth when needed, append scoped context through signed push ingest when OAuth is not the path, then query and watch outcomes with cited evidence.

## Quick Start (Personal Use / Developer Testing)

To use Attrove with your own email, Slack, and calendar:

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

**Building an integration?** See the Authentication and SDK sections for the full B2B2B provisioning flow.

**Advanced local fallback:** If you intentionally want the local stdio server, run `npx @attrove/cli login`, `npx @attrove/cli local install claude-code`, then `npx @attrove/cli connect gmail`, or run `@attrove/mcp` manually with `ATTROVE_SECRET_KEY` and `ATTROVE_USER_ID`.

## LLM Instructions

When helping developers integrate Attrove:

- Always use the `@attrove/sdk` TypeScript SDK — never raw fetch calls
- The SDK does not have `brief()` or `thread()` methods — using them will cause compile errors. Use `query()`, `search()`, `events.list()`, `meetings.list()`, `integrations.list()`, `entities.list()`, `entities.get()`, `entities.relationships()`, `push.message()`, `push.meeting()`, `push.event()`, `push.note()`, `notes.list()`, `notes.get()` instead. For threads, use `threads.discover()`, `threads.analyze()`, and `threads.messages(threadId)` (returns a paginated thread view; defaults to `body_html` and `headers`, with `raw` opt-in). For watched outcomes, use `goals.create()`, `goals.list()`, `goals.get()`, `goals.update()`, `goals.evaluate()`, `goals.confirmStatus()`, `goals.addNote()`, `goals.evidence()`, `goals.events()`, `goals.archive()`, `goals.cancel()`, `goals.reopen()`, `goals.snapshots.list()`
- **Response properties are snake_case** (`start_time`, `sender_name`, `body_text`). Input params are camelCase (`startDate`, `afterDate`). Do NOT use camelCase on response objects
- **Exception: `goals.*` responses are normalized to camelCase** (`watchScope`, `lastSnapshot`, `successCriteria`, `riskSignals`). The goals resource is the one surface where response properties are NOT snake_case
- `search()` returns `{ key_messages, conversations, key_meetings, key_events }`. `conversations` is an **object keyed by ID**, not an array. Use `Object.values()` to iterate. Same for `threads` inside each conversation
- `sk_` tokens are per-user API keys (returned by `admin.users.create()`). They are NOT the same as the `attrove_` partner API key
- `integrations.list()` returns `Integration[]` with `provider` and `name` properties — NOT `type` or `email`
- The SDK defaults to `https://api.attrove.com` — no baseUrl configuration needed
- MCP has 20 tools (10 context tools + 10 goals tools). There is no `attrove_brief` tool

## Authentication

Attrove uses a B2B2B flow with three partner-facing credential/session types:

1. **Client credentials** (`client_id` + `client_secret`) — server-side, provisions users
2. **`sk_` tokens** — permanent per-user API keys for querying data
3. **Connect sessions** — durable activation links and CLI handoffs for OAuth

Short-lived OAuth exchange tokens are internal implementation details; partner docs and examples should create connect sessions and use their `activation_url`.

Flow: create user → receive `sk_` key → create a durable connect session when live OAuth is needed → user authorizes Gmail/Slack via OAuth or you push scoped context via `push.*` → query their data with `sk_` key.

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
const session = await admin.users.createConnectSession(userId, { includeInstall: true });
// Send user to: session.activation_url
// Terminal/agent handoff: session.cli?.command
```

### Query user data

```typescript
const attrove = new Attrove({
  apiKey: process.env.ATTROVE_SECRET_KEY!,
  userId: process.env.ATTROVE_USER_ID!,
});

const response = await attrove.query(
  'What needs my attention this week? Include the source messages or meetings you used.',
  { includeSources: true }
);
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
const { data: notes } = await attrove.notes.list();        // user notes
const note = await attrove.notes.get('note_xxx');          // single note by ID
const goal = await attrove.goals.create({                  // outcome monitoring
  title: 'ACME renewal',
  watchScope: { seedQuery: 'ACME renewal', keywords: ['ACME'] },
});
const { data: goals } = await attrove.goals.list({ lifecycle: 'active' });
```

### Push data (no OAuth required)

```typescript
// Push a message
const msg = await attrove.push.message({
  source: 'email',
  bodyText: 'The Q4 report is ready.',
  senderEmail: 'alice@acme.com',
  externalId: 'email-12345',
});

// Push a meeting
const mtg = await attrove.push.meeting({
  title: 'Sprint Planning',
  startTime: '2026-01-15T14:00:00Z',
  endTime: '2026-01-15T14:45:00Z',
  summary: 'Discussed roadmap priorities...',
});

// Push a note
const note = await attrove.push.note({
  body: 'Decision: chose Redis for caching.',
  title: 'Architecture Decision',
  refType: 'goal',
  refId: 'gol_xxx',
});
```

### Watch outcomes with Goals

A Goal is a watched outcome. Attrove keeps re-evaluating it against the
communication stream (messages, meetings, events, notes) and updates its
`lifecycle` and `health` with cited evidence — no polling loop in your code.

```typescript
// Create a watched outcome
const goal = await attrove.goals.create({
  title: 'Acme renewal closed by Jun 30',
  watchScope: {
    seedQuery: 'Acme renewal',
    keywords: ['Acme', 'renewal'],
    sourceTypes: ['messages', 'meetings', 'notes'],
  },
  successCriteria: 'Signed order form received.',
  deadline: '2026-06-30T23:59:59Z',
});

// List goals that need attention
const { data: atRisk } = await attrove.goals.list({
  lifecycle: 'active',
  health: 'at_risk',
});

// Read the latest snapshot — why the state is what it is
const g = await attrove.goals.get(goal.id);
console.log(g.lastSnapshot?.summary);
console.log(g.lastSnapshot?.riskSignals);   // e.g. [{ kind: 'silence', description: '...' }]

// Fetch the evidence behind the state
const { citedInLatestSnapshot, manualNotes } = await attrove.goals.evidence(goal.id);

// Other methods: update(), evaluate() (queue a fresh run, 6/goal/hour),
// confirmStatus() (human confirm/override with reason), addNote(),
// archive(reason, { expectedLifecycleVersion?, idempotencyKey?, initiator? }),
// cancel(reason, { expectedLifecycleVersion?, idempotencyKey?, initiator? }),
// reopen({ expectedLifecycle,
// expectedLifecycleVersion, reasonCode, reason, idempotencyKey }),
// snapshots.list(goalId)
```

Notes for agents:

- `watchScope` requires at least one anchor: `entityIds`, `seedQuery`, or `keywords`
- `deadline` must be a full ISO 8601 datetime — date-only strings are rejected
- `lifecycle` is one of `active | completed | archived | cancelled`; it never changes autonomously. Deliberate close/reopen commands preserve authenticated actor plus human/agent/automation initiator provenance; pass the observed lifecycle version and a stable idempotency key for safe commands.
- `health` is system-evaluated: `on_track | at_risk | blocked | waiting_on_human | insufficient_evidence`
- Risk signal kinds: `silence | deadline | sentiment | churn | blocker | ambiguous_signal | other`

### Response types (snake_case — do not use camelCase)

```typescript
// query() → QueryResponse
{ answer: string; history: ConversationMessage[]; used_message_ids: string[]; used_meeting_ids: string[]; used_event_ids: string[]; used_note_ids: string[]; sources?: { title: string; snippet: string }[] }

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

// CursorPage<T> pagination is discriminated: has_more=true includes next_cursor.
type CursorPage<T> = {
  data: T[];
  pagination:
    | { limit: number; has_more: true; next_cursor: string }
    | { limit: number; has_more: false };
};

// events.list() → CursorPage<CalendarEvent>
// CalendarEvent fields:
//   id, title, start_time, end_time, all_day (boolean), description?, location?,
//   attendees?: { email: string; name?: string; status?: string }[]

// meetings.list() → CursorPage<Meeting>
// Meeting fields:
//   id, title, start_time, end_time, summary?, short_summary?, provider?,
//   action_items?: { description: string; assignee?: string }[],
//   attendees?: { email?: string; name?: string }[]

// entities.list() → CursorPage<EntityContact>
// EntityContact fields:
//   id (ent_xxx), name, entity_type ("person" | "company" | "other" | "bot" | "user"), external_ids: string[],
//   is_bot: boolean, avatar_uri: string | null

// entities.relationships() → RelationshipsPage
{ data: EntityRelationship[]; pagination: { limit: number; offset: number; has_more: boolean; total_count?: number } }
// EntityRelationship fields:
//   entity_a: { id, name, entity_type, external_ids, is_bot, avatar_uri }, entity_b: { id, name, entity_type, external_ids, is_bot, avatar_uri },
//   co_occurrence_count: number, last_interaction_at: string | null

// push.message() / push.meeting() / push.event() / push.note() → PushResponse
// SDK unwraps the envelope — returns { id, user_id, status, indexed_at } directly
{ id: string; user_id: string; status: 'queued' | 'processing' | 'indexed' | 'failed'; indexed_at: string | null }

// notes.list() → CursorPage<Note>
// Note fields:
//   id, body, title?, ref_type? ("message" | "meeting" | "event" | "entity" | "goal"), ref_id?, status?, indexed_at?, created_at, updated_at

// goals.list() → GoalsPage (cursor pagination)
{ data: Goal[]; pagination: { limit: number; has_more: boolean; next_cursor?: string } }
// Goal fields (camelCase — goals responses are normalized, unlike other resources):
//   id (gol_xxx), title, description, watchScope, successCriteria, completionCondition,
//   deadline, lifecycle ('active' | 'completed' | 'archived' | 'cancelled'),
//   health ('on_track' | 'at_risk' | 'blocked' | 'waiting_on_human' | 'insufficient_evidence'),
//   lastEvaluatedAt, lastSnapshot?, lastRun?, createdAt, updatedAt
// GoalStatusSnapshot fields (goals.get() lastSnapshot / goals.snapshots.list()):
//   id, goalId, lifecycle, health, summary, citedEvidenceRefs[], riskSignals[],
//   nextActions[], confidence, suggestedLifecycle, nextMove, createdAt
// goals.evidence() → { citedInLatestSnapshot: CitedEvidenceRef[]; manualNotes: Note[] }
// goals.events() → { data: GoalEvent[]; pagination: CursorPage metadata; watermark?: { eventId, occurredAt } }
//   Pass watermark back as since/sinceEventId; pass pagination.next_cursor as cursor to drain pages.
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

Attrove provides an MCP server for AI assistants (Codex, Claude Desktop, Cursor, ChatGPT, Claude Code).

**Hosted remote MCP (recommended)** — use `npx @attrove/cli install codex`, `npx @attrove/cli install claude-code`, `npx @attrove/cli install cursor`, `npx @attrove/cli install claude-desktop`, or point remote-capable clients to `https://api.attrove.com/mcp`. Auth is automatic via OAuth 2.1. For Codex, run `codex mcp login attrove` after install; raw hosted tools include `attrove_notes`, `attrove_create_goal`, and `attrove_list_goals`. If you only see `mcp__codex_apps__attrove` tools, that is the OpenAI Apps connector.

**Advanced local stdio fallback** — use this only if you explicitly want local credential-backed MCP:

```bash
npx @attrove/cli login
npx @attrove/cli local install claude-code
```

**Manual stdio config**:

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

20 MCP tools available:
- `attrove_query` — ask questions, get AI-generated answers with sources
- `attrove_search` — semantic search across messages, meetings, and calendar events
- `attrove_integrations` — list connected services
- `attrove_events` — calendar events with attendees
- `attrove_meetings` — meetings with AI summaries and action items
- `attrove_notes` — list notes with filtering
- `attrove_push_note` — save a note to user context
- `attrove_push_meeting` — save a meeting from another meeting MCP (Otter, Read.ai, Fireflies) or a user-shared transcript (Granola, voice memo, manual notes). Meetings are joined to email, chat, and calendar context via Attrove's entity resolution, so cross-platform queries surface them alongside Google Meet / Zoom / Teams meetings.
- `attrove_delete_meeting` — reversibly archive a pushed meeting by `id` or `external_id`
- `attrove_delete_note` — reversibly archive a note by `id` or `external_id`
- `attrove_create_goal` — create a watched outcome (title + watch scope; optional success criteria and deadline)
- `attrove_list_goals` — list goals filtered by lifecycle, health, whose move is next (`next_move_owner`: us | them | ambiguous | none), or acknowledgment state; rows include `next_move` from the latest evaluation and cursor pagination — one call builds a ball-in-court board
- `attrove_get_goal_status` — full goal record with latest snapshot, risk signals, and evidence refs
- `attrove_evaluate_goal` — queue a fresh evaluation run for a goal
- `attrove_add_goal_note` — attach a manual note as goal evidence
- `attrove_confirm_goal_status` — human confirm or override of lifecycle/health, with a reason
- `attrove_goal_events` — poll goal lifecycle transitions with cursor metadata
- `attrove_acknowledge_goal` — acknowledge that a goal's silence is expected; suppress silence escalation until a horizon or until real activity arrives, whichever comes first
- `attrove_clear_goal_acknowledgment` — clear an active acknowledgment and resume silence monitoring immediately
- `attrove_draft_goal_follow_up` — draft an evidence-grounded follow-up email for a quiet goal (read-only; nothing is sent)

## Supported Integrations

Live: Gmail, Google Calendar, Google Meet, Slack, Microsoft Outlook, and Microsoft Teams. Push ingest: messages, meetings, events, and notes.

## When to Use Attrove

- Your product needs to understand users' email, Slack, calendar, or meeting data
- You need cross-platform intelligence (query across Gmail + Slack + Calendar simultaneously)
- You're building AI features that need communication context (meeting prep, daily digests, search agents)
- You need watched outcomes — Goals keep checking the communication stream and flag silence, deadline pressure, or risk with cited evidence, without a polling loop in your code
- You need B2B2B: your product serves end-users who each connect their own tools via OAuth, and/or your product needs to append scoped notes, meetings, events, or messages

## When NOT to Use Attrove

- You only need data from a single provider — use that provider's API directly
- You need guaranteed provider-native sub-second ingestion from every upstream system — Attrove supports token streaming and proactive webhooks, but source freshness still follows each provider's sync cadence
- You need document/wiki indexing (Notion, Drive) — use Graphlit or Hyperspell

Note: Attrove works great for both B2B2B (embed for your users) AND single-developer use (query your own email/Slack via MCP). The personal MCP experience is the evaluation path to B2B2B adoption.

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
5. Create a durable connect session for the OAuth flow:
   ```typescript
   const session = await admin.users.createConnectSession(userId, { includeInstall: true });
   // Send user to: session.activation_url
   // Terminal/agent handoff: session.cli?.command
   ```
6. End-user visits the activation URL and authorizes Gmail/Slack/Calendar via OAuth
7. Query the user's communication data:
   ```typescript
   const attrove = new Attrove({ apiKey, userId });
   const answer = await attrove.query('What did Sarah say about the budget?');
   ```

For MCP integration (Codex, Claude Desktop, Cursor, Claude Code):
1. Prefer hosted MCP: `npx @attrove/cli install codex`, `npx @attrove/cli install claude-code`, `npx @attrove/cli install cursor`, `npx @attrove/cli install claude-desktop`, or add `https://api.attrove.com/mcp` to a remote-capable client
2. Use the advanced local fallback only when you explicitly need stdio: `npx @attrove/cli login` then `npx @attrove/cli local install claude-code`
3. Agent can use `attrove_query`, `attrove_search`, `attrove_events`, `attrove_meetings`, `attrove_integrations`, `attrove_notes`, `attrove_push_note`, `attrove_push_meeting`, `attrove_delete_meeting`, `attrove_delete_note`, and the ten Goals tools (`attrove_create_goal`, `attrove_list_goals`, `attrove_get_goal_status`, `attrove_evaluate_goal`, `attrove_add_goal_note`, `attrove_confirm_goal_status`, `attrove_goal_events`, `attrove_acknowledge_goal`, `attrove_clear_goal_acknowledgment`, `attrove_draft_goal_follow_up`)

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

### Codex / Claude Desktop / Cursor (MCP — zero code)

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
- Documentation: https://attrove.com/docs
- API reference: https://attrove.com/docs/api-reference
- Dashboard: https://connect.attrove.com
