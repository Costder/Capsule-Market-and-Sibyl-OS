# MVP Spec — Capsule v0

The smallest thing that proves the whole thesis and lands on the live
**#KeepAndroidOpen** moment: an **open, trust-gated way to ship and run mobile apps
+ agents that survives the lockdown** — runnable by any Android/Linux developer
today, with **no ROM and no Play Store**.

> Strategy context: we are NOT building "another AI phone." The on-device-agent
> space is a red ocean (AIOS, MANTIS, PokeClaw, …). Our wedge is the **trust +
> distribution layer** none of them have. See `docs/ARCHITECTURE.md` and the
> project doc.

---

## What v0 is

Four pieces, three of them already built and tested in this repo:

| Piece | What it does | Status |
|---|---|---|
| **`@sibyl/trust`** | OpenTrust passports: ed25519 sign/verify, bundle-integrity, capability grants by trust level (L1–L7) + kill switch | ✅ built + unit-tested |
| **`@sibyl/capsule-registry`** (server + `capsule` CLI) | "npm for mobile": `capsule keygen / init / sign / publish`; registry verifies every passport before hosting; serves a scan-to-run QR page | ✅ built + e2e-tested |
| **`@sibyl/agent-mcp`** | MCP server exposing `capsule_search / resolve / run` to any agent (Hermes, OpenCLAW, Claude) | ✅ built + smoke-tested |
| **`capsule-host`** (Expo app) | Scan QR → verify passport → run the capsule sandboxed in a WebView, capability-gated | ✅ written (run it on a device) |

## The end-to-end loop v0 delivers

```
dev writes a capsule (HTML/JS)
   └─ capsule sign         → ed25519 passport over manifest + bundle hash
   └─ capsule publish      → registry verifies passport, hosts it, returns a QR page
user opens the QR page, scans with the Capsule app
   └─ host fetches manifest + passport + bundle
   └─ host verifies the passport (authorship + integrity) with @noble/ed25519
   └─ host computes EFFECTIVE trust level from its local trust store
   └─ host grants only the capabilities that level allows
   └─ capsule runs sandboxed in a WebView; every device call is gated
agent (optional) drives it
   └─ MCP: capsule_search / capsule_resolve (verifies) / capsule_run (deep link)
```

## Why this sidesteps the September 30 lockdown

Google's developer-verification blocks **installation of unverified APKs**.
Instant capsules are **not installed** — they're signed web/JS bundles fetched and
run *inside* the host (the host itself is one normal app). So a developer ships
new capsules to users with **zero Google registration**, and the trust question
("who made this, is it untampered?") is answered by the **OpenTrust passport**,
not Google's central ID gate.

---

## Component detail

### Capsule (the unit)
A signed bundle + `capsule.json` manifest (schema: `packages/capsule-spec`).
- `kind: "instant"`, `runtime.engine: "web"`, `entry: "index.html"` for v0.
- `capabilities[]`: requested scopes (`storage.local`, `net.fetch`, …). **Requests, not grants.**
- `trust`: `{ minLevel, publisherKey, passport }`.

### Passport (`@sibyl/trust`)
Signed claims: `{ publisher, publisherKey, trustLevel, capabilities, capsuleName, version, bundleHash, issuedAt, sig }`.
- **Authorship**: ed25519 signature over canonicalized claims.
- **Integrity**: `bundleHash` (sha256) must match the actual bytes — tamper = reject.
- **Binding**: passport's publisherKey/name/version must match the manifest.
- **Identity is decentralized; trust LEVEL is local policy.** An unknown but
  validly-signed publisher is **L1 (sandbox)**. The host's trust store can pin a
  publisher to a higher level. `grantedCapabilities = requested ∩ allowed-at-level`.

### Capability gate (the TrustManager, `@sibyl/capsule-runtime`)
Capsule code can't touch the device — it sends RPC over postMessage; the host
checks `gate(capability)` before executing. A global **kill switch** freezes all
guarded calls. Capability → min level table lives in `@sibyl/trust/grants`.

### Registry + CLI (`@sibyl/capsule-registry`)
- `POST /capsules` — **verifies the passport against the uploaded bytes**, rejects on mismatch (returns 403).
- `GET /capsules/:id`, `/:id/bundle`, `/c/:id` (QR run page), `GET /` (list).
- CLI: `keygen` (ed25519 identity), `init` (scaffold), `sign`, `publish`.

### Host (`apps/capsule-host`, Expo)
- `expo-camera` QR scan + paste-URL + recents.
- `resolveCapsule()` → fetch + verify (`@noble/ed25519`) + compute grants.
- **Refuses to run** if the passport doesn't verify.
- Runs the capsule in `react-native-webview`; `createHostBridge` enforces the gate;
  `storage.local` backed by AsyncStorage, `net.fetch` by real fetch (gated), etc.
- Trust banner shows publisher · verified · level · granted capabilities.

### Agent surface (`@sibyl/agent-mcp`)
MCP stdio server (newline-delimited JSON-RPC): `initialize`, `tools/list`,
`tools/call`. Tools: `capsule_search`, `capsule_resolve` (verifies + returns
grants), `capsule_run` (deep link). Live on-device drive (screen/tap) is v0.1.

---

## How to run it (what's testable today)

```bash
# 1. Backend (no installs needed — pure Node)
node packages/capsule-registry/src/server.mjs            # registry on :4173

node packages/capsule-registry/src/cli.mjs keygen
node packages/capsule-registry/src/cli.mjs init ./my-capsule --name my-capsule
node packages/capsule-registry/src/cli.mjs publish ./my-capsule --registry http://localhost:4173 --level L2
# → open the printed run page, see the QR

# 2. Tests (no installs needed)
cd packages/trust && node --test
cd packages/capsule-runtime && node --test

# 3. The host app (needs install + a phone/emulator)
npm install                      # from repo root (workspaces)
cd apps/capsule-host && npx expo install --check && npx expo start
# scan the registry QR with Expo Go / a dev build
```

> Note: the agent sandbox that wrote this couldn't run a phone, so the Expo host
> is the one piece not yet run end-to-end on a device — that's the first thing to
> test at home. The trust/registry/CLI/runtime/MCP layers are verified.

## Explicit non-goals for v0
The AOSP/LineageOS fork; "feature parity with Android"; native-APK capsules;
payments; the compute mesh; live on-device agent drive (screen reading/taps);
multi-device sync. All are later phases — see `docs/ROADMAP.md`.
