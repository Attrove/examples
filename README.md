<!-- Keep in sync with: packages/agent-skill/SKILL.md (source of truth), apps/web-landing/public/llms.txt, scripts/examples-AGENTS.md -->
<!-- Synced sections: authentication, SDK methods, MCP tools, error handling. This file adds the examples table and getting-started guide specific to the public repo. -->
# Attrove Examples

Catch the conversations going quiet. Connect your users' Gmail, Slack, Google Calendar, Outlook, Google Meet, and Microsoft Teams — or push messages, meetings, events, and notes directly — then create watched outcomes (Goals) that flag silence and risk, and query the same stream with cited evidence.

> **Attrove watches work across email, chat, meetings, and calendar — when something starts to slip, it alerts the owner with proof.** Communication intelligence infrastructure for AI products. B2B2B model: you provision users, connect live sources through OAuth when needed, append scoped context through signed push ingest when OAuth is not the path, then query and watch outcomes with cited evidence.

```typescript
const response = await attrove.query('What did we promise ACME last week?');
console.log(response.answer);
// "Based on the email thread from Jan 15, you committed to delivering the API integration by end of Q1..."
```

## Examples

| Example | Description | Lines |
|---------|-------------|-------|
| [`goal-monitor/`](./goal-monitor) | Outcome goal monitor — create a watched outcome, evaluate, inspect evidence, and poll goal events | ~150 |
| [`quickstart/`](./quickstart) | Full B2B2B provisioning flow — create users, create durable connect sessions, query data | ~200 |
| [`daily-rundown/`](./daily-rundown) | Scheduled daily digest — calendar events, action items, AI summary | ~230 |
| [`meeting-prep-agent/`](./meeting-prep-agent) | AI meeting prep — upcoming events, past meetings, context brief | ~160 |
| [`search-agent/`](./search-agent) | Minimal Q&A — one API call to search across all integrations | ~65 |
| [`mcp-demo/`](./mcp-demo) | Zero-code MCP setup for Codex, Claude Desktop, Cursor, ChatGPT, Claude Code | config only |

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

**Building an integration?** Follow the Getting Started guide below.

**Advanced local fallback:** If you intentionally want the local stdio server, run `npx @attrove/cli login`, `npx @attrove/cli local install claude-code`, then `npx @attrove/cli connect gmail`, or run `@attrove/mcp` manually with `ATTROVE_SECRET_KEY` and `ATTROVE_USER_ID`.

## Getting Started

### 1. Install the SDK

```bash
npm install @attrove/sdk
```

### 2. Pick an example

**Building a B2B integration?** Start with [`quickstart/`](./quickstart) — it shows the complete flow: provision users, create durable connect sessions, and query data.

**Want to try the SDK quickly?** Start with [`search-agent/`](./search-agent) — one file, one API call, ~65 lines.

**Want to track an outcome?** Start with [`goal-monitor/`](./goal-monitor) — creates an active goal, attaches evidence, queues evaluation, and shows polling.

**Using Codex, Claude, or Cursor?** Start with [`mcp-demo/`](./mcp-demo) — zero code, just config.

### 3. Run it

Each example has its own README with setup instructions. The general pattern:

```bash
cd quickstart  # or any example
npm install
cp .env.example .env
# Add your credentials to .env
npm start
```

## Authentication

Attrove uses three credential types:

| Credential | Format | Purpose |
|-----------|--------|---------|
| Client credentials | `client_id` + `client_secret` | Server-side: provision users |
| User token | `sk_...` | Per-user: query their data |
| Connect session | `activation_url` + CLI/MCP artifacts | Durable handoff for OAuth, CLI, and MCP onboarding |
| Connect token | `pit_...` | Internal short-lived OAuth token resolved by connect sessions |

**The `quickstart/` example** uses client credentials (partner-level).
**All other examples** use `sk_` user tokens (per-user level).

See the [Authentication docs](https://attrove.com/docs/quickstart) for the full flow.

## SDK Methods

```typescript
// Admin operations (server-side)
const admin = Attrove.admin({ clientId, clientSecret });
const { id, apiKey } = await admin.users.create({ email });
const session = await admin.users.createConnectSession(id, { includeInstall: true });
console.log(session.activation_url);
console.log(session.cli?.command);

// User operations
const attrove = new Attrove({ apiKey, userId });
await attrove.query('...');                    // AI-powered Q&A
await attrove.search('...');                   // Semantic search
await attrove.events.list({ ... });            // Calendar events
await attrove.meetings.list({ ... });          // Past meetings
await attrove.integrations.list();             // Connected services
await attrove.entities.list();                 // People the user communicates with
await attrove.entities.relationships();        // Co-occurrence network
await attrove.goals.create({ ... });           // Watch an outcome (renewal, deal, commitment)
await attrove.goals.list({ health: 'at_risk' }); // Goals that need attention
await attrove.goals.evidence('gol_xxx');       // The proof behind a goal's state
await attrove.goals.events({ since });         // Poll goal lifecycle transitions (watermark + cursor)
```

**Methods that do NOT exist:** `brief()` and `thread()` — these will cause compile errors. Use the documented resource namespaces, including `goals.*`. For threads, use `threads.discover()`, `threads.analyze()`, and `threads.messages(threadId)`.

**Response properties are snake_case** (e.g., `start_time`, `sender_name`, `body_text`). Input params are camelCase. `search()` returns conversations as a `Record<string, ...>` (object), not an array — use `Object.values()` to iterate. Exception: `goals.*` responses are normalized to camelCase (`watchScope`, `lastSnapshot`, `riskSignals`).

## MCP Server

The [`mcp-demo/`](./mcp-demo) example shows zero-code setup. For programmatic usage:

```bash
npm install @attrove/mcp
```

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
npx @attrove/cli connect gmail
```

20 tools: `attrove_query`, `attrove_search`, `attrove_integrations`, `attrove_events`, `attrove_meetings`, `attrove_notes`, `attrove_push_note`, `attrove_push_meeting`, `attrove_delete_meeting`, `attrove_delete_note`, `attrove_create_goal`, `attrove_list_goals`, `attrove_get_goal_status`, `attrove_evaluate_goal`, `attrove_add_goal_note`, `attrove_confirm_goal_status`, `attrove_goal_events`, `attrove_acknowledge_goal`, `attrove_clear_goal_acknowledgment`, `attrove_draft_goal_follow_up`.

## Links

- [SDK on npm](https://www.npmjs.com/package/@attrove/sdk)
- [MCP on npm](https://www.npmjs.com/package/@attrove/mcp)
- [Documentation](https://attrove.com/docs)
- [API Reference](https://attrove.com/docs/api-reference)
- [Dashboard](https://connect.attrove.com)

## License

MIT
