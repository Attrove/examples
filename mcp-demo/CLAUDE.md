# AI Assistant Context for MCP Demo

This is a zero-code example showing how to connect AI assistants (Claude, Cursor, ChatGPT) to Attrove via the Model Context Protocol.

**Access scope:** MCP connectors (Claude Desktop, ChatGPT) authenticate you and let you query your own account only — not your end users' data. This is a security/privacy feature. For querying users' data, use the SDK with the B2B2B provisioning flow.

## MCP Tools Available (5 tools)

| Tool | Parameters | Purpose |
|------|-----------|---------|
| `attrove_query` | query (required), integration_ids, include_sources | Ask questions, get AI answers |
| `attrove_search` | query (required), after_date, before_date, sender_domains, include_body_text | Semantic search |
| `attrove_integrations` | none | List connected services |
| `attrove_events` | start_date, end_date, limit | Calendar events with attendees |
| `attrove_meetings` | start_date, end_date, provider, limit | Meetings with AI summaries |

There is no `attrove_brief` tool. The `brief()` SDK method is not yet implemented.

## Two Connection Methods

### HTTP connectors (Claude Desktop, ChatGPT) — recommended
- Endpoint: `https://api.attrove.com/mcp`
- Auth: Automatic via OAuth 2.1 — the client discovers `/.well-known/oauth-protected-resource`, prompts sign-in, and manages the session
- No tokens or env vars to configure
- You query your own connected accounts

### Stdio transport (Cursor, Claude Code)
- Command: `npx @attrove/mcp`
- Requires two env vars:
  - `ATTROVE_SECRET_KEY` — the `sk_...` per-user secret key (not the partner `client_id`/`client_secret`)
  - `ATTROVE_USER_ID` — user UUID

```json
{
  "mcpServers": {
    "attrove": {
      "command": "npx",
      "args": ["@attrove/mcp"],
      "env": {
        "ATTROVE_SECRET_KEY": "sk_...",
        "ATTROVE_USER_ID": "user-uuid"
      }
    }
  }
}
```

## Example Prompts

- "What do I need to know before my meeting with [name] tomorrow?"
- "What meetings do I have this week?"
- "Summarize my last meeting with the engineering team"
- "Find all emails from acme.com about the product launch"
- "What services are connected to my account?"
