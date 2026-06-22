# Roadmap — from MVP to an Operating System

Build order is inverted from the dream: **the open trust + distribution layer
first (on stock Android, this repo), the OS last.** Each phase has a single proof
it must produce before the next begins. The northern star: **the open, agent-native
mobile platform AI labs and developers choose — and, eventually, the consumer OS
that rides on top of that ecosystem.**

Positioning (see project doc): the non-programmer consumer is the **destination**;
developers + AI-agent builders being evicted by Google's Sept 30 2026
*editted out some of claude'ss bad writting.**

---

## Phase 0 — Capsule v0: prove the loop on stock Android ✅ (this repo)
Open, trust-gated distribution + run, no ROM, no Play Store.
- [x] Capsule manifest spec (`packages/capsule-spec`)
- [x] OpenTrust passports: ed25519 sign/verify, integrity, capability grants + kill switch (`@sibyl/trust`, unit-tested)
- [x] Capability-gated host/guest runtime bridge (`@sibyl/capsule-runtime`, unit-tested)
- [x] Registry + `capsule` CLI; passport verified on publish (`@sibyl/capsule-registry`, e2e-tested incl. tamper-reject)
- [x] Agent MCP server: `capsule_search/resolve/run` (`@sibyl/agent-mcp`, smoke-tested)
- [x] Expo host app: scan QR → verify → run sandboxed, capability-gated (`apps/capsule-host`)
- [ ] **DoD: run the host on a real phone**, scan a published capsule's QR, watch it verify + run, and confirm an ungranted capability is blocked.

## Phase 0.5 — Make it real for developers
The "npm for mobile" experience + the agent loop close.
- [ ] Hosted registry (a real domain) + `capsule login`/publisher accounts keyed by ed25519 identity.
- [ ] `capsule fork` + a visible fork graph (the "fork apps themselves" goal).
- [ ] Live on-device agent drive: promote `agent-mcp` to actually launch/operate capsules on the host (pair over LAN/WebSocket), gated by passport.
- [ ] Capsule discovery (search, categories, demos) + a web directory.
- [ ] Trust UX: prompt to raise a publisher's level; signed publisher reputation.
- [ ] DoD: a developer publishes from the CLI, a second forks + edits + republishes, a user runs either by scanning — all passport-verified — and an agent runs one via MCP.

## Phase 1 — Capability depth + offline
- [ ] WASM capsules (compute-heavy, still sandboxed) alongside web capsules.
- [ ] Expand the capability vocabulary (sensors, notifications, files, share) with gates.
- [ ] On-device model capability (`ai.infer`) via llama.cpp / MLC / AICore for local capsules + agents.
- [ ] Offline capsule cache (content-addressed bundles).
- [ ] DoD: a capsule does meaningful local work offline with on-device AI, fully gated.

## Phase 2 — Sibyl OS, increment 1: the launcher + system service
Descend toward the OS without forking yet.
- [ ] Capsule **launcher/home-screen** (replaceable, like the ROMs of old).
- [ ] Promote TrustManager + the agent bridge to an Android **foreground/system service** (Accessibility-backed) so an agent can drive the *whole* device, passport-bounded.
- [ ] System-wide capability prompts + kill switch in the OS UI.
- [ ] DoD: a Pixel running stock Android + Sibyl launcher feels like "the agent-native phone" with capsules as first-class.

## Phase 3 — Sibyl OS, increment 2: the AOSP/LineageOS fork
Now own the platform.
- [ ] Fork AOSP via LineageOS for **one** reference device (Pixel).
- [ ] Bake Capsule runtime + TrustManager + agent service in as system components.
- [ ] Honor "no arbitrary restrictions": unlockable, root-capable, JIT allowed, sideload-first, dev mode on.
- [ ] Native-APK capsules (installed, still passport-gated) for heavy apps.
- [ ] Built-in Android-app compatibility (it *is* AOSP) — the "dies without apps" guarantee.
- [ ] DoD: a clean flash boots, runs a normal Android app, runs a capsule, and an agent drives the device — one OS image.

## Phase 4 — Ecosystem + agent economy
- [ ] Payments: USDC wallet Or stripe (OpenTrust/HBF) → paid capsules + the `wallet.spend` capability.
- [ ] **Compute mesh**: nodes share/donate compute, settled in USDC, trust-gated (the "share compute" goal).
- [ ] Cross-device + cross-agent coordination.
- [ ] OEM / preinstall conversations (the only proven consumer path — cf. Motorola × GrapheneOS).

## Phase 5 — Consumer + the "open as Linux" track
- [ ] One-tap, grandpa-simple consumer onboarding; the AI operates apps for non-programmers.
- [ ] Optional pure-Linux + Waydroid build (the BlackBerry-10 model) for the open-as-Linux purists.
- [ ] DoD: a non-technical person uses Sibyl in daily life without ever seeing a terminal.

---

## The one thing to do next
**Phase 0 DoD: run `apps/capsule-host` on a real phone and complete the
scan → verify → run loop against the local registry.** Everything else builds on
that loop working on a device.
