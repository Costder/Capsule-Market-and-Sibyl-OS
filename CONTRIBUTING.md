# Contributing

This is an early-stage, design-first repo. Right now the most valuable contributions are **sharp
critique of the architecture** and **building out Phase 0** (see `docs/ROADMAP.md`).

## Monorepo layout

```
docs/                 design + spec (read these first)
packages/
  capsule-spec/       the manifest format — the contract everything keys off  (start here)
  capsule-runtime/    the Expo-Go-style host that runs capsules
  capsule-registry/   the "npm for mobile" backend + CLI
  agent-mcp/          the device-control MCP server
  trust/              OpenTrust passport verification client
```

## Principles

1. **Don't reinvent the substrate.** Fork AOSP/LineageOS, study Expo/F-Droid/npm. Spend novelty
   budget on the trust + agent + forkability layer, which is what's actually new.
2. **The manifest is the contract.** Changes to `capsule-spec` ripple everywhere — propose schema
   changes as a doc + schema PR before code depends on them.
3. **Trust is not optional.** Any capability that touches the network, sensors, the wallet, or the
   agent surface must be gated by the TrustManager. No ambient powers.
4. **Prove on stock Android before touching the ROM.** If a thing can be demonstrated without a
   custom OS, it must be, first.

## Dev setup (Phase 0, evolving)

- Node 20+ for `capsule-spec`, `capsule-registry`, `agent-mcp`.
- `capsule-spec`: `cd packages/capsule-spec && npm install && npm run build && npm test`.
- Runtime PoC will use Expo (React Native) — see `packages/capsule-runtime/README.md`.

## Commit/PR norms

- Small, reviewable commits. Reference the roadmap phase in the description.
- Schema/spec changes bump the `schema` version pin in manifests and note migration in the PR.
