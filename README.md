# Sibyl OS + Capsule Market

> An open, agent-native mobile platform. **Capsule Market** is a trust-gated,
> forkable app marketplace ("npm for mobile"); **Sibyl OS** is the AOSP-based open
> OS it eventually runs on. Every app is a **Capsule** — a signed, passport-bearing,
> forkable bundle — and an AI agent can drive the whole device, safely, because
> every capability is gated by an **OpenTrust passport**.

**Status: Phase 0 (Capsule v0) is built.** The trust, registry/CLI, runtime, and
agent-MCP layers are implemented and tested; the Expo host app is written and ready
to run on a device. See [`docs/MVP_SPEC.md`](docs/MVP_SPEC.md) and
[`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Why now

Google's **Android Developer Verification** starts enforcing **Sept 30, 2026** —
every developer must register with Google + upload ID or their apps won't install
(even sideloaded / F-Droid). Developers are revolting (#KeepAndroidOpen). Capsules
**aren't installed APKs** — they're signed bundles that run *inside* the host — so
they sidestep the lockdown, and the OpenTrust passport answers "who made this / is
it untampered?" **without** Google's central gate.

We are **not** building another on-device AI agent We're
building the **trust + distribution layer** those agents lack.

## Try it in 2 minutes (no installs, pure Node)

```bash
# start the registry
node packages/capsule-registry/src/server.mjs        # http://localhost:4173

# create an identity + a capsule, then publish it (verified on upload)
node packages/capsule-registry/src/cli.mjs keygen
node packages/capsule-registry/src/cli.mjs init ./my-capsule --name my-capsule --title "My Capsule"
node packages/capsule-registry/src/cli.mjs publish ./my-capsule --registry http://localhost:4173 --level L2
# → open the printed run page to see the scan-to-run QR

# run the security tests
( cd packages/trust && node --test )
( cd packages/capsule-runtime && node --test )
```

Then the phone app:

```bash
npm install                          # repo root (npm workspaces)
cd apps/capsule-host
npx expo install --check             # align native deps to your Expo SDK
npx expo start                       # open in Expo Go / a dev build, scan the QR
```

## Repo map

```
docs/
  MVP_SPEC.md           what v0 is + how to run it
  ROADMAP.md            MVP → Operating System, phase by phase
  ARCHITECTURE.md       the layered design (L0–L4)
  OPENTRUST_INTEGRATION.md · AGENT_CONTROL.md · CAPSULE_SPEC.md · GLOSSARY.md
packages/
  capsule-spec/         the manifest contract (JSON Schema + types + example)
  trust/                ✅ OpenTrust passports: sign/verify, grants, kill switch (tested)
  capsule-runtime/      ✅ capability-gated host/guest bridge (tested)
  capsule-registry/     ✅ registry server + `capsule` CLI (tested e2e)
  agent-mcp/            ✅ MCP server: capsule_search/resolve/run (tested)
apps/
  capsule-host/         the Expo app: scan QR → verify → run sandboxed
```

## How the trust model works (the core idea)

1. A capsule is **signed** (ed25519) by its publisher → an OpenTrust **passport**
   over the manifest + a hash of the bundle.
2. Anyone can **verify** authorship + integrity offline. Tampered bundle = rejected.
3. **Identity is decentralized; trust *level* is local policy.** An unknown but
   validly-signed publisher runs at **L1 (sandbox)**. Your trust store can pin a
   publisher higher. A capsule only gets the capabilities its **effective level**
   allows — `granted = requested ∩ allowed-at-level` — with a global kill switch.

This is the same L1–L7 + caps + kill-switch model from OpenTrust / Hands-Body-&-Feet,
applied to apps and to the agent that drives them.

## License
See [`LICENSE`](LICENSE).
