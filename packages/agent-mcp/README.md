# @sibyl/agent-mcp ✅ (v0)

The seam that makes the platform **agent-native**: an MCP server (stdio,
newline-delimited JSON-RPC, zero external deps) exposing the Capsule registry to
any tool-calling agent — **Hermes, OpenCLAW, Claude**. Smoke-tested.

```bash
REGISTRY_URL=http://localhost:4173 node src/server.mjs
```

Implements `initialize`, `tools/list`, `tools/call`. Tools:
- **`capsule_search`** — list capsules in the registry.
- **`capsule_resolve`** — fetch a capsule, **verify its passport**, return manifest +
  verification + granted capabilities.
- **`capsule_run`** — return a `capsule://run?src=…` deep link the on-device host opens.

Because it's MCP, any agent that speaks tool-calling connects with no special-casing.
**Live on-device drive** (the agent reading the screen / tapping, via the host
service) is Phase 0.5 — see `../../docs/ROADMAP.md`.
