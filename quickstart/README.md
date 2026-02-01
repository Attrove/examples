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

Edit `.env` with your credentials from [connect.attrove.com/settings/api-keys](https://connect.attrove.com/settings/api-keys):

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

2. Generating connect token...
   Connect URL: https://connect.attrove.com/integrations/connect?token=pit_abc123...

3. Open the URL above to connect Gmail, Slack, or other integrations.

4. Querying user data...
   Connected integrations: gmail, slack

   Answer: Based on your recent messages...
```

## How It Works

Attrove uses a **B2B2B model** (Business → Business → Business):

1. **Your Server** provisions users via the Admin API
2. **Your Users** connect their Gmail/Slack via OAuth
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

// 3. Generate connect token for OAuth
const { token } = await admin.users.createConnectToken(userId);

// 4. Query user's data (after they connect integrations)
const attrove = new Attrove({ apiKey, userId });
const response = await attrove.query('What meetings do I have this week?');
```

## Authentication

Attrove uses three credential types:

| Credential | Format | Purpose | Lifetime |
|-----------|--------|---------|----------|
| **Client credentials** | `client_id` + `client_secret` | Server-side: provision users, generate tokens | Permanent |
| **API Key** | `sk_` | Per-user: query their data | Permanent |
| **Connect Token** | `pit_` | OAuth flow initialization | 10 minutes |

Your server uses `client_id` + `client_secret` to create users and generate `pit_` tokens.
Your app uses `sk_` tokens to query user data.

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
| [mcp-demo](../mcp-demo) | Zero-code Claude/Cursor/ChatGPT integration |

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

## MCP Server (Claude/Cursor/ChatGPT)

Use Attrove directly in Claude Desktop, Cursor, or ChatGPT:

```bash
npx @attrove/mcp
```

See the [MCP demo](../mcp-demo) for setup instructions.

## Resources

- [Documentation](https://docs.attrove.com)
- [API Reference](https://docs.attrove.com/api)
- [Dashboard](https://connect.attrove.com)
- [Support](mailto:support@attrove.com)

## License

MIT
