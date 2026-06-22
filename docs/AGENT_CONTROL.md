# Agent Control

Goal: **an AI agent can drive the entire device** — using a local *or* an API model — and *any*
agent framework (Hermes, OpenCLAW, Claude, …) can connect without bespoke integration.

The mechanism is one idea: **expose every device capability as an MCP tool, gated by the caller's
OpenTrust passport.** This is the Hands-Body-&-Feet model pointed at a phone. The device becomes a
new *body* for the same agent fabric Joshua already runs.

---

## Why MCP (and why compatibility is free)

Hermes already speaks MCP/tool-calling. So does Claude. So does any modern agent framework —
including **OpenCLAW** *(noted: confirm exactly what OpenCLAW is so we can check its integration
surface — but if it speaks MCP or generic tool-calling, it connects with no special-casing)*.

By making the **device control surface an MCP server**, "compatible with Hermes and OpenCLAW" stops
being a feature to build per-framework and becomes a property of the architecture: implement the
server once, every tool-calling agent gets it.

---

## The tool surface (v0 sketch)

Each tool declares a **minimum trust level**; the TrustManager enforces it per call (see
`OPENTRUST_INTEGRATION.md`).

| Tool | Does | Min level |
|---|---|---|
| `screen.read` | Return the current UI tree / screenshot + a11y labels | L4 |
| `ui.tap` / `ui.type` / `ui.swipe` | Synthesize input events | L4 |
| `app.launch` / `app.list` | Launch / enumerate installed apps | L4 |
| `capsule.install` / `capsule.run` / `capsule.fork` | Manage capsules | L4 |
| `notifications.read` | Read the notification stream | L4 |
| `wallet.pay` | Pay USDC (caps + kill switch apply) | L5 |
| `compute.offer` / `compute.request` | Participate in the compute mesh | L4 |

The surface grows over time; the trust gating keeps it safe to grow.

---

## Models

- **Local:** [MLC-LLM](https://llm.mlc.ai), [llama.cpp](https://github.com/ggerganov/llama.cpp), or
  Android **AICore / Gemini Nano**. Keeps control private and offline-capable.
- **API:** any hosted model over HTTP. The control surface is identical regardless of model.

The agent loop (perceive → decide → act) is model-agnostic: `screen.read` to perceive, the model to
decide, `ui.*` / `app.*` / `capsule.*` to act.

---

## Bootstrap path — prove it with **no OS work**

The whole loop is demonstrable on *stock* Android today:

1. Build an **Accessibility Service** — it can read the screen tree and perform taps/types. This is
   how every "computer-use on Android" demo works.
2. Wrap it as an **MCP server** exposing `screen.read` / `ui.tap` / `app.launch`.
3. Point **Hermes** at it. Now an agent drives a stock phone.

Once that loop is real, **promote it to a first-class system service in the Sibyl fork** — where it
can do far more than Accessibility allows (direct framework access, system-level capability grants),
still bounded by the passport.

Server implementation lives in [`packages/agent-mcp`](../packages/agent-mcp).

---

## Security posture

"An agent can control everything" is only acceptable because **everything is gated**:
- the agent acts under *its own* passport and trust level,
- spend- and compute-bearing tools honor caps,
- a single **kill switch** freezes all guarded capabilities,
- `screen.read` and input synthesis are themselves L4 capabilities, not ambient powers.

Trust-by-default is the thing we're explicitly *not* doing.
