<!-- Keep in sync with: packages/agent-skill/SKILL.md (source of truth), apps/web-landing/public/llms.txt, scripts/examples-AGENTS.md -->
<!-- Synced sections: authentication, SDK methods, MCP tools, error handling. This file adds the examples table and getting-started guide specific to the public repo. -->
# Attrove Examples

Connect your users' Gmail, Slack, Google Calendar, Outlook, and Google Meet — then query their data with natural language via a single API call.

> **Attrove is Plaid for productivity apps.** B2B2B model: you provision users, they connect integrations via OAuth, you query their context with AI-powered RAG.

```typescript
const response = await attrove.query('What did we promise ACME last week?');
console.log(response.answer);
// "Based on the email thread from Jan 15, you committed to delivering the API integration by end of Q1..."
```

## Examples

| Example | Description | Lines |
|---------|-------------|-------|
| [`quickstart/`](./quickstart) | Full B2B2B provisioning flow — create users, generate connect tokens, query data | ~200 |
| [`daily-rundown/`](./daily-rundown) | Scheduled daily digest — calendar events, action items, AI summary | ~230 |
| [`meeting-prep-agent/`](./meeting-prep-agent) | AI meeting prep — upcoming events, past meetings, context brief | ~160 |
| [`search-agent/`](./search-agent) | Minimal Q&A — one API call to search across all integrations | ~65 |
| [`mcp-demo/`](./mcp-demo) | Zero-code MCP setup for Claude Desktop, Cursor, ChatGPT, Claude Code | config only |

## Getting Started

### 1. Install the SDK

```bash
npm install @attrove/sdk
```

### 2. Pick an example

**Building a B2B integration?** Start with [`quickstart/`](./quickstart) — it shows the complete flow: provision users, generate connect tokens, and query data.

**Want to try the SDK quickly?** Start with [`search-agent/`](./search-agent) — one file, one API call, ~65 lines.

**Using Claude or Cursor?** Start with [`mcp-demo/`](./mcp-demo) — zero code, just config.

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
| Connect token | `pit_...` | Short-lived (10 min): OAuth flow |

**The `quickstart/` example** uses client credentials (partner-level).
**All other examples** use `sk_` user tokens (per-user level).

See the [Authentication docs](https://docs.attrove.com/authentication) for the full flow.

## SDK Methods

```typescript
// Admin operations (server-side)
const admin = Attrove.admin({ clientId, clientSecret });
const { id, apiKey } = await admin.users.create({ email });
const { token } = await admin.users.createConnectToken(id);

// User operations
const attrove = new Attrove({ apiKey, userId });
await attrove.query('...');                    // AI-powered Q&A
await attrove.search('...');                   // Semantic search
await attrove.events.list({ ... });            // Calendar events
await attrove.meetings.list({ ... });          // Past meetings
await attrove.integrations.list();             // Connected services
```

**Methods that do NOT exist:** `brief()`, `entity()`, `thread()` — these will cause compile errors.

## MCP Server

The [`mcp-demo/`](./mcp-demo) example shows zero-code setup. For programmatic usage:

```bash
npm install @attrove/mcp
```

5 tools: `attrove_query`, `attrove_search`, `attrove_integrations`, `attrove_events`, `attrove_meetings`.

## Links

- [SDK on npm](https://www.npmjs.com/package/@attrove/sdk)
- [MCP on npm](https://www.npmjs.com/package/@attrove/mcp)
- [Documentation](https://docs.attrove.com)
- [API Reference](https://docs.attrove.com/api)
- [Dashboard](https://connect.attrove.com)

## License

MIT
