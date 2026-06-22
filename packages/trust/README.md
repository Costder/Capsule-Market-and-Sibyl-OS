# trust  ▢ (Phase 0 — the TrustManager client)

OpenTrust passport **verification + capability gating** — the client side of Sibyl's permission
model. This is the one component that must exist in *every* phase, because nothing guarded runs
without it.

## What to build

- **`verifyPassport(passport)`** — check signature; resolve trust level against the OpenTrust
  Registry (reuse the Registry MCP: `verify_tool`/`search_tools` generalize to
  `verify_capsule`/`search_capsules`).
- **`grants(manifest, passport)`** — given a capsule's requested `capabilities[]` and its resolved
  trust level, return the set actually **granted** (request ∩ allowed-at-level). Requests are never
  silently escalated.
- **`gate(capability, ctx)`** — the runtime check the capsule-runtime and agent-mcp call before any
  guarded action: `(capability ∈ granted) ∧ (level ≥ minLevel)`, plus spend caps + kill switch for
  value-bearing calls.

## Mirror the existing model

This is **the HBF gating logic applied to apps + device capabilities**: L1–L7 trust levels, spend
caps, and a global kill switch — the same machinery that already gates HBF's ~94 tools. Passport
claims must carry a **numeric** trust level under the hood (as in HBF's `PassportClaims`) or the
trust check mis-allows.

## Depends on

- `@sibyl/capsule-spec` — `TrustLevel`, `meetsTrust`, `CapsuleManifest`.
- The OpenTrust Registry (via its MCP / SDK) — the source of truth for verification.

See [`../../docs/OPENTRUST_INTEGRATION.md`](../../docs/OPENTRUST_INTEGRATION.md).
