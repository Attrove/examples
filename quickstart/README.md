# Attrove Quickstart

Get up and running with Attrove in 5 minutes. Add AI-powered communication context to your app.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/attrove/examples)

## What is Attrove?

Attrove is **Plaid for productivity apps**. Connect your users' Gmail, Slack, Google Calendar, and more — then query their data with natural language.

```typescript
const response = await attrove.query('What did we promise ACME last week?');
console.log(response.answer);
// "Based on the email thread from Jan 15, you committed to delivering the API integration by end of Q1..."
```

## Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Attrove API credentials ([sign up free](https://connect.attrove.com))

### 1. Clone & Install

```bash
git clone https://github.com/attrove/examples.git
cd examples/quickstart
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` with your credentials from [connect.attrove.com/keys](https://connect.attrove.com/keys):

```bash
ATTROVE_CLIENT_ID=your-client-id
ATTROVE_CLIENT_SECRET=your-client-secret
```

### 3. Run

```bash
npm start
```

Or try demo mode first (no credentials needed):

```bash
npm start -- --demo
```

You'll see:

```
Attrove Quickstart
==================

1. Provisioning user: demo@yourapp.com
   User created: 2322ac54-9642-4a9e-a504-b0d227d17fa7
   API Key: sk_live_demo_abc...

2. Creating durable connect session...
   Activation URL: https://connect.attrove.com/integrations/connect?session=8f4a2c1b-...
   Terminal handoff: npx @attrove/cli connect --session 8f4a2c1b-...

3. Open the URL above to connect Gmail, Slack, or other integrations.

4. Querying user data...
   Connected integrations: gmail, slack

   Answer: Based on your recent communications...
```

## How It Works

Attrove uses a **B2B2B model** (Business → Business → Business):

1. **Your Server** provisions users via the Admin API
2. **Your Users** connect their Gmail/Slack via a durable activation URL or CLI handoff
3. **Your App** queries their data via the SDK

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Your App   │────▶│   Attrove   │────▶│ Gmail/Slack │
│  (Server)   │     │    API      │     │   (OAuth)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │    Provision      │    Connect
       │    Users          │    Integrations
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  Your App   │────▶│   Attrove   │
│  (Client)   │     │    RAG      │
└─────────────┘     └─────────────┘
       │                   │
       │    Query          │    AI-Powered
       │    Data           │    Answers
```

## Code Overview

```typescript
// 1. Create admin client (server-side only)
const admin = Attrove.admin({ clientId, clientSecret });

// 2. Provision a user
const { id: userId, apiKey } = await admin.users.create({ email });

// 3. Create durable connect session for OAuth
const session = await admin.users.createConnectSession(userId, {
  provider: 'gmail',
  includeInstall: true,
});

console.log(session.activation_url);
console.log(session.cli?.command);

// 4. Query user's data (after they connect integrations)
const attrove = new Attrove({ apiKey, userId });
const response = await attrove.query(
  'What needs my attention this week? Include the source messages or meetings you used.',
  { includeSources: true },
);
console.log(response.used_message_ids); // msg_xxx IDs
console.log(response.used_meeting_ids); // mtg_xxx IDs
console.log(response.used_event_ids);   // evt_xxx IDs
```

## Authentication

Attrove uses three credential types:

| Credential | Format | Purpose | Lifetime |
|-----------|--------|---------|----------|
| **Client credentials** | `client_id` + `client_secret` | Server-side: provision users and create durable connect sessions | Permanent |
| **API Key** | `sk_` | Per-user: query their data | Permanent |
| **Connect Session** | UUID session | Durable OAuth activation link and CLI handoff | 7 days |

Your server uses `client_id` + `client_secret` to create users and durable connect sessions.
Your app uses `sk_` tokens to query user data.

> Short-lived `pit_` exchange tokens are an internal implementation detail used during OAuth. You should never need to handle them directly — `createConnectSession` returns everything you need.

## Testing

```bash
npm test                    # Unit tests (no credentials needed)
npm run test:integration    # Integration tests (requires real credentials)
```

## More Examples

| Example | Description |
|---------|-------------|
| [meeting-prep-agent](../meeting-prep-agent) | AI meeting prep agent in ~160 lines |
| [daily-rundown](../daily-rundown) | Daily comms digest in ~230 lines |
| [search-agent](../search-agent) | Semantic search in ~65 lines |
| [goal-monitor](../goal-monitor) | Outcome goal monitor using Goals SDK methods |
| [mcp-demo](../mcp-demo) | Zero-code Codex/Claude/Cursor/ChatGPT integration |

## SDK

```bash
npm install @attrove/sdk
```

```typescript
import { Attrove } from '@attrove/sdk';

// Server-side: Admin operations
const admin = Attrove.admin({
  clientId: process.env.ATTROVE_CLIENT_ID,
  clientSecret: process.env.ATTROVE_CLIENT_SECRET,
});

// Client-side: User operations
const attrove = new Attrove({
  apiKey: userApiKey,  // sk_...
  userId: userId,      // UUID
});
```

## MCP Server (Codex/Claude/Cursor/ChatGPT)

Use Attrove directly in Codex, Claude Desktop, Cursor, or ChatGPT:

```bash
npx @attrove/cli install codex
npx @attrove/cli install claude-code
npx @attrove/cli install cursor
npx @attrove/cli install claude-desktop
```

For Codex, run `codex mcp login attrove` after install. If you only see
`mcp__codex_apps__attrove` tools, that is the OpenAI Apps connector rather
than the raw hosted MCP server.

After OAuth completes, ask your AI client:

```text
Use Attrove to list my connected integrations.

What needs my attention this week? Include the source messages or meetings you used.
```

See the [MCP demo](../mcp-demo) for setup instructions and advanced local fallback.

## Resources

- [Documentation](https://attrove.com/docs)
- [API Reference](https://attrove.com/docs/api-reference)
- [Dashboard](https://connect.attrove.com)
- [Support](mailto:support@attrove.com)

## License

MIT
