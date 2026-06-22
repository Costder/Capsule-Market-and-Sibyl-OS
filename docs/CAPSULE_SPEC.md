# Capsule Specification (v0 draft)

A **Capsule** is the unit of distribution for Capsule Market — *a signed, passport-bearing,
forkable app bundle plus a manifest.* The manifest is the keystone of the whole platform: the
**registry** indexes it, the **runtime** executes it, and the **TrustManager** gates on it.

This document is the human-readable spec. The machine-readable contract is
[`packages/capsule-spec/capsule.schema.json`](../packages/capsule-spec/capsule.schema.json), with
TypeScript types in [`packages/capsule-spec/src/manifest.ts`](../packages/capsule-spec/src/manifest.ts)
and a worked example in
[`packages/capsule-spec/examples/hello-capsule/`](../packages/capsule-spec/examples/hello-capsule/).

---

## Two kinds of Capsule

| Kind | `kind` | What it is | Distribution UX |
|---|---|---|---|
| **Instant** | `"instant"` | A JS or WASM bundle that runs *inside* the Capsule runtime host. No install. | scan QR → runs immediately |
| **Native** | `"native"` | A full APK. Installed onto the device. | scan QR → install → run (still passport-gated) |

Instant capsules are how we deliver "see a demo, scan, it's running." Native capsules are the
escape hatch for apps that need full native power.

---

## Manifest fields (`capsule.json`)

```jsonc
{
  "schema": "https://sibyl.os/schemas/capsule/v0",   // schema version pin
  "name": "hello-capsule",                            // unique id within publisher namespace
  "version": "0.1.0",                                 // semver
  "title": "Hello, Capsule",                          // human title
  "description": "The smallest possible instant capsule.",
  "kind": "instant",                                  // "instant" | "native"

  "entry": "index.js",                                // instant: bundle entry. native: omit
  "apk": null,                                         // native: path/ref to APK. instant: null
  "runtime": { "engine": "js", "min": "0.1.0" },      // "js" | "wasm" (instant) ; n/a for native

  "capabilities": [                                   // capability scopes this capsule REQUESTS
    "net.fetch",                                      // see capability vocabulary below
    "storage.local"
  ],

  "trust": {
    "minLevel": "L2",                                 // minimum trust level the platform must grant
    "passport": "did:opentrust:...",                  // ref to (or embedded) OpenTrust passport
    "signature": "ed25519:...",                       // signature over the bundle + manifest
    "publisherKey": "ed25519:..."                     // publisher public key
  },

  "source": {                                         // forkability + provenance
    "repo": "https://github.com/.../hello-capsule",
    "fork_of": null,                                  // capsule id this was forked from, if any
    "license": "MIT"
  },

  "ui": {                                             // store presentation
    "icon": "assets/icon.png",
    "screenshots": ["assets/1.png"],
    "demo": null                                      // optional instant-demo capsule ref
  }
}
```

### Field notes

- **`name` + publisher namespace** → globally unique id (like `@publisher/name` in npm).
- **`kind` drives which fields are required** — `entry` for instant, `apk` for native (enforced by
  the JSON Schema via conditional requirements).
- **`capabilities`** is a *request*, not a grant. The TrustManager decides what is actually granted
  based on the passport's trust level. A capsule that requests more than its trust level allows is
  installable but runs degraded (or is blocked) — see `OPENTRUST_INTEGRATION.md`.
- **`trust.signature`** covers the bundle hash + the manifest, so the registry and the device can
  both verify integrity independently. Unsigned capsules are dev-only.
- **`source.fork_of`** records lineage so the marketplace can show a fork graph (GitHub-network
  style). This is the mechanic behind "fork, modify, and experiment within the apps themselves."

---

## Capability vocabulary (v0, extend over time)

Capabilities are namespaced `domain.action`. Each maps to a minimum trust level the TrustManager
enforces. Draft starting set:

| Capability | Meaning | Suggested min level |
|---|---|---|
| `storage.local` | Read/write the capsule's own sandboxed storage | L1 |
| `net.fetch` | Outbound HTTP(S) | L2 |
| `notifications.post` | Post notifications | L2 |
| `device.sensors` | Read sensors (location, motion) | L3 |
| `agent.control` | Be driven by / drive the agent MCP surface | L4 |
| `wallet.spend` | Spend from the OpenTrust wallet (caps apply) | L5 |
| `compute.offer` | Contribute to / consume the compute mesh | L4 |

This table is intentionally small for v0. The point of pinning `schema` in every manifest is that
we can grow the vocabulary without breaking older capsules.

---

## Open questions (decide as the runtime takes shape)

- **Bundle packaging**: single signed archive (`.capsule`) vs. content-addressed chunks (better for
  forking/dedup). Leaning content-addressed.
- **WASM ABI**: which host functions instant-WASM capsules may import.
- **Passport embedding**: reference-by-DID (resolve at runtime) vs. embed-and-verify (offline-capable).
  Likely support both; prefer embed-and-verify for instant trust on first run.
- **Versioning of granted capabilities** across capsule updates (re-prompt on escalation).
