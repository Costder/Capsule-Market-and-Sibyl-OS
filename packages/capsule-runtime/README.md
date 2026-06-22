# capsule-runtime  ▢ (Phase 0 — build this first)

The **host app that fetches and runs Capsules**. For *instant* capsules it runs the bundle inside
itself (no install); for *native* capsules it hands off to the OS installer. This is where the
"see a demo, scan a QR, it's running" experience lives.

## What to build (Phase 0 PoC)

A single Android app that:

1. **Scans a QR** → resolves a Capsule (manifest + bundle) from a URL / the registry.
2. **Verifies the passport** via `@sibyl/trust` against the OpenTrust Registry. Block if untrusted.
3. **Runs the instant capsule** — load `entry` and execute it against a host-provided `capsule` API
   whose surface is bounded by the capabilities the TrustManager granted.
4. Exposes `capsule.run` as an **MCP tool** (via `@sibyl/agent-mcp`) so Hermes can trigger it.

**Definition of done:** scan QR → passport-verified → instant capsule runs → an agent can trigger it.

## Fork / study

- **[Expo / Expo Go](https://expo.dev)** — the existing proof that "scan QR → a JS bundle runs
  instantly in a host runtime" works. Start by understanding its bundle-serving + runtime model;
  the Phase-0 PoC can be built *as* an Expo app.
- React Native for the host shell.

## Depends on

- `@sibyl/capsule-spec` — to parse/validate manifests.
- `@sibyl/trust` — to verify passports + resolve granted capabilities.
- `@sibyl/agent-mcp` — to expose runtime actions as agent tools.

## Open questions

- Sandboxing instant-JS execution (isolate per capsule; enforce the granted-capability surface).
- WASM engine choice + host-import ABI.
- Bundle fetch + cache (content-addressed, per `docs/CAPSULE_SPEC.md`).
