# Roadmap

Build order is **inverted from the dream**: the marketplace + trust + agent layer first (on stock
Android), the OS last (an AOSP fork). Each phase has a single proof it must produce before the next
begins.

---

## Phase 0 — Prove the thesis on stock Android *(now)*

No ROM. No kernel. Everything runs on an unmodified Android phone + a laptop.

- [ ] **Capsule manifest spec** — format, JSON Schema, TS types, one example capsule. *(in this repo: `packages/capsule-spec`)*
- [ ] **Capsule runtime PoC** — an Expo-Go-style host app: **scan a QR → a JS capsule runs instantly.**
- [ ] **One passport check** — before the capsule runs, verify its OpenTrust passport against the Registry (reuse the Registry MCP). Block if untrusted.
- [ ] **One agent action over MCP** — expose `capsule.run` (or `app.launch`) as an MCP tool so **Hermes** can trigger it.

**Definition of done — the whole thesis in one thread:**
`publish → QR → passport-verify → instant run → agent-trigger`, end to end, on a real phone.
If this works, the platform is real; everything after is scale and depth.

---

## Phase 1 — The marketplace ("npm for mobile")

- [ ] **Capsule registry** backend (index manifests, serve by QR/deep-link, store signed bundles).
- [ ] **CLI**: `capsule publish` / `capsule install` / `capsule fork` — publishing as easy as `npm publish`.
- [ ] **Passport-gated capabilities**: TrustManager grants/denies each declared capability by trust level.
- [ ] Onboard a handful of real capsules (incl. one *forked* from another, to exercise lineage).

**DoD:** a developer publishes a capsule from the CLI; a second developer forks it, edits it, and
republishes; a user installs either by scanning a QR — all passport-verified.

---

## Phase 2 — Sibyl OS (the AOSP fork)

- [ ] Fork AOSP via LineageOS for **one** reference device (Pixel).
- [ ] Bake **Capsule runtime**, **TrustManager**, and the **agent MCP service** in as first-class system components.
- [ ] Honor "no restrictions": unlockable bootloader, root-capable, JIT allowed, sideload-first, dev mode on.

**DoD:** a clean flash of Sibyl OS boots on the reference device, runs a normal Android app, runs a
Capsule, and an agent can drive the device — all on one OS image.

---

## Phase 3 — Forkable ecosystem + agent economy

- [ ] Marketplace polish: discovery, demos, ratings, fork graph visible like a repo network.
- [ ] Trust-graded capabilities for *all* apps; publisher reputation feeding trust levels.
- [ ] **Compute mesh v1**: a node offers compute; a task runs on it; settlement in USDC via the wallet.

---

## Phase 4 — Scale

- [ ] More reference devices. OTA updates. Reproducible builds for capsules.
- [ ] Local-model integration polished (on-device inference as a system capability).

---

## Phase 5 — The "open as Linux" track *(optional / radical)*

- [ ] Explore a **pure Linux base + Waydroid** build (the BlackBerry-10 model: real Linux, Android
      apps as a guest container) for the purist "open like Linux" expression — revisited only once
      the ecosystem justifies the app-compatibility tradeoff.

---

## The one thing to build first

The **Capsule runtime PoC** (Phase 0). It's buildable on a laptop + one phone, needs zero OS work,
and the moment "scan QR → passport-verified capsule runs → agent triggers it" works, the entire
vision has a beating heart. Start there.
