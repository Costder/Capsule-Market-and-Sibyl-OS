# @sibyl/capsule-runtime ✅

The host/guest bridge that runs capsules **sandboxed** with **capability-gated RPC**.
Unit-tested — `node --test`.

- **`bridge.js`** (host side): `createHostBridge({ granted, killSwitch, handlers })`
  → a message handler. Every capsule RPC is checked against `granted` (from
  `@sibyl/trust`) before a handler runs. Kill switch denies everything.
- **`guest.js`**: `guestBootstrapSource(manifestJson)` → JS injected into the
  WebView that exposes a promise-based `window.capsule` API (storage, net, notify,
  ui) which forwards calls to the host over `postMessage`.

The guest has **no direct device access** — it can never exceed its grants. The
host app (`apps/capsule-host`) wires real handlers (AsyncStorage, fetch, alerts)
behind the gate. See `../../docs/AGENT_CONTROL.md`.
