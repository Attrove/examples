# MCP Demo — Zero Code

Give Claude, Cursor, or ChatGPT access to your real email, Slack, and calendar. No code required.

> **Important:** The MCP connector methods below (Claude Desktop, ChatGPT) let you query **your own account only**. When you authenticate, you're granting access to your own connected integrations — not your users' data. This is a security and privacy feature. To query your users' data programmatically, use the [SDK examples](../meeting-prep-agent) with the B2B2B provisioning flow.

## What is this?

The Attrove MCP server exposes 5 tools that any AI assistant can use to search your communications:

| Tool | What it does |
|------|-------------|
| `attrove_query` | Ask questions, get AI-generated answers with sources |
| `attrove_search` | Semantic search across email and Slack messages |
| `attrove_integrations` | List connected services (Gmail, Slack, etc.) |
| `attrove_events` | List calendar events with attendees |
| `attrove_meetings` | List meetings with AI summaries and action items |

## Setup: Claude Desktop Connector (Recommended)

Claude Desktop supports Attrove as a remote MCP connector over HTTP. Authentication is handled automatically — no tokens or env vars to configure.

1. Open Claude Desktop
2. Go to **Settings > Connectors** (or click the plug icon)
3. Click **Add Connector**
4. Enter the MCP endpoint URL:
   ```
   https://api.attrove.com/mcp
   ```
5. Claude Desktop will discover the auth endpoint automatically and prompt you to sign in with your Attrove account
6. Once authenticated, the 5 Attrove tools appear in your tools menu

That's it. Ask Claude a question like "What meetings do I have this week?" and it will call the Attrove tools on your behalf.

## Setup: ChatGPT

ChatGPT also connects via the hosted HTTP endpoint with automatic auth discovery.

1. Open ChatGPT Settings > **Connectors**
2. Click **Add Connector**
3. Enter the MCP endpoint URL:
   ```
   https://api.attrove.com/mcp
   ```
4. ChatGPT will discover the auth endpoint via `/.well-known/oauth-protected-resource` and prompt you to sign in

Both Claude Desktop and ChatGPT use OAuth 2.1 — you sign in once and your session stays active.

## Setup: Cursor (stdio)

Cursor uses the local stdio transport. Add this to your Cursor MCP config:

1. Open Cursor Settings (`Cmd+,`)
2. Navigate to **Features > MCP Servers**
3. Add the config:

```json
{
  "mcpServers": {
    "attrove": {
      "command": "npx",
      "args": ["@attrove/mcp"],
      "env": {
        "ATTROVE_API_KEY": "sk_...",
        "ATTROVE_USER_ID": "your-user-uuid"
      }
    }
  }
}
```

> **Note:** The stdio transport requires your `sk_` user token and user ID as env vars. The env var is named `ATTROVE_API_KEY` by the MCP package, but the value is your per-user `sk_` token — **not** your `attrove_` API key.

4. Restart Cursor

## Setup: Claude Code (Terminal)

```bash
export ATTROVE_API_KEY="sk_..."
export ATTROVE_USER_ID="your-user-uuid"
```

Then ask Claude Code questions about your email, Slack, and calendar directly.

> Same note as Cursor: `ATTROVE_API_KEY` expects the `sk_` user token.

## Try these prompts

Once connected via any method above:

- "What do I need to know before my meeting with Sarah tomorrow?"
- "What meetings do I have this week?"
- "Summarize my last meeting with the engineering team"
- "Find all emails from acme.com about the product launch"
- "What are my open action items?"

## Example Conversations

### Meeting prep

> **You:** What context do I need for my 2pm meeting with the marketing team?
>
> **Claude:** *calls `attrove_events` to find the meeting, then `attrove_query` to search relevant context*
>
> Based on your recent communications, here's what you should know...

### Email search

> **You:** Find discussions about the API migration from last month
>
> **Claude:** *calls `attrove_search` with date filters*
>
> I found 3 conversation threads about the API migration...

### Meeting summary

> **You:** What happened in my last meeting with the product team?
>
> **Claude:** *calls `attrove_meetings` to find the meeting with summary*
>
> Your last product team meeting was on January 22. Key decisions: ...

## How it works

```
┌──────────────────┐     ┌─────────────┐     ┌─────────────┐
│  Claude/Cursor/  │────▶│   Attrove   │────▶│   Attrove   │
│    ChatGPT       │     │  MCP Server │     │    API      │
└──────────────────┘     └─────────────┘     └─────────────┘
       │                       │                     │
       │ Natural language      │ Tool calls          │ RAG + Search
       │ questions             │ (5 tools)           │ across Gmail,
       │                       │                     │ Slack, Calendar
```

**HTTP connectors** (Claude Desktop, ChatGPT): Connect to `https://api.attrove.com/mcp`. Auth is handled via OAuth 2.1 — you sign in and your session is managed automatically. You query your own connected accounts.

**Stdio transport** (Cursor, Claude Code): Runs `npx @attrove/mcp` locally. Requires `sk_` user token and user ID as env vars. Used for development and testing.

## Who can see what?

The MCP connector authenticates **you** — the account holder. You can only query data from your own connected integrations (Gmail, Slack, Calendar, etc.).

This is distinct from the SDK's B2B2B flow, where a partner server provisions end users and queries their data on their behalf using `sk_` tokens. See the [quickstart](../quickstart) for that pattern.

## Resources

- [@attrove/mcp on npm](https://www.npmjs.com/package/@attrove/mcp)
- [SDK Documentation](https://docs.attrove.com/sdks/typescript)
- [Meeting Prep Agent](../meeting-prep-agent) (build it into your app)
- [Quickstart](../quickstart) (full B2B2B provisioning flow)
