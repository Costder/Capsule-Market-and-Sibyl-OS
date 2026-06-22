# agent-mcp  ▢ (Phase 0 bootstrap → Phase 2 system service)

The **device-control surface, exposed as MCP tools, gated by OpenTrust passports.** This is the
Hands-Body-&-Feet model pointed at a phone: the device becomes a new *body* for the agent fabric,
and *any* tool-calling agent (Hermes, OpenCLAW, Claude) can drive it because the surface is MCP.

## What to build

**Phase 0 (no OS needed):** an MCP server backed by an Android **Accessibility Service**.
- Tools: `screen.read`, `ui.tap`, `ui.type`, `app.launch`, `capsule.run`.
- Each tool declares a **minimum trust level**; calls are checked by `@sibyl/trust` (the TrustManager)
  against the caller's passport. Spend/compute tools also honor caps + the kill switch.
- Point **Hermes** at it → an agent drives a stock phone. That closes the Phase-0 loop.

**Phase 2:** promote from an Accessibility Service to a **first-class system service** in the Sibyl
fork, with direct framework access (far beyond what Accessibility allows), still passport-bounded.

## Tool surface (v0 sketch)

| Tool | Min level |
|---|---|
| `screen.read`, `ui.tap`, `ui.type`, `ui.swipe`, `app.launch`, `app.list` | L4 |
| `capsule.install`, `capsule.run`, `capsule.fork`, `notifications.read` | L4 |
| `wallet.pay` | L5 (caps + kill switch) |
| `compute.offer`, `compute.request` | L4 |

## Models

Local via [MLC-LLM](https://llm.mlc.ai) / [llama.cpp](https://github.com/ggerganov/llama.cpp) /
Android **AICore (Gemini Nano)**; API models over HTTP. The control surface is identical regardless.

## Depends on

- `@sibyl/trust` — every guarded tool call is gated here.
- `@sibyl/capsule-spec` — for `capsule.*` tools.

See [`../../docs/AGENT_CONTROL.md`](../../docs/AGENT_CONTROL.md).

> **Note:** confirm exactly what **OpenCLAW** is so we can verify its integration surface. If it
> speaks MCP or generic tool-calling, it connects to this server with no special-casing.
