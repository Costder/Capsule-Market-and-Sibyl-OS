# Architecture

This document explains the layered design and *why each choice is the pragmatic one*. The
guiding principle: **don't reinvent the substrate; reinvent the layer that's actually ours.**

```
L4  Compute Mesh      — share/donate compute, USDC-paid, trust-gated        (Phase 3+)
L3  Agent Control     — device capabilities as MCP tools, passport-gated
L2  Capsule           — app format + host runtime + registry + CLI ("npm for mobile")
L1  OpenTrust         — passport per Capsule; TrustManager gates by L1–L7
L0  Substrate         — Sibyl OS = AOSP / LineageOS fork                     (Phase 2)
```

---

## L0 — Substrate (the OS itself)

**Decision: Sibyl OS is a fork of AOSP, tracked through LineageOS. Not a from-scratch kernel,
and not a pure-Linux distro first.**

Why an AOSP fork wins on every requirement that was stated:

- **"A new OS dies without apps."** Forking AOSP means Android apps run *natively* — there is no
  compatibility layer to build or maintain. This single fact is decisive.
- **Hardware support is the real OS-building cost.** Drivers, HALs, radio, power management, camera
  — this is where OS projects die. Riding AOSP + LineageOS device trees inherits all of it.
- **It's literally the CyanogenMod lineage.** LineageOS *is* the maintained continuation of
  CyanogenMod. Building on it continues the exact custom-ROM tradition that inspired this project.
- **Agent control is *better* on Android.** The framework exposes Accessibility, an app model, and
  IPC (Binder) we can extend. On a forked ROM we can promote agent control to a first-class system
  service — more powerful than anything possible on a locked OS.

**Honoring "no arbitrary restrictions":** ship with an unlockable bootloader, root-capable builds,
sideloading first-class, developer mode on by default, and **JIT allowed** (Android's ART runtime
already does JIT + profile-guided AOT — the work is simply *not locking it down*, unlike iOS which
forbids W^X exceptions outside WebKit).

**The "open as Linux" / BlackBerry-10 alternative (kept as a later track):** BB10 was a real
separate OS (QNX microkernel) with an *Android runtime layer* bolted on to run Android apps. The
modern open equivalent is **a real Linux base + [Waydroid](https://waydro.id) (a containerized
Android guest)**. This is the purest expression of "open like Linux," but it sacrifices native app
performance/compatibility short-term. We keep it as **Phase 5**, to revisit once the ecosystem
justifies it — not as the starting point.

**Reference device:** pick **one** (a Pixel — best AOSP support) before generalizing. Multi-device
ROM maintenance is a tax to defer.

---

## L1 — OpenTrust (the trust fabric)

**OpenTrust is the permission model, not an add-on.** Stock Android permissions are a coarse
per-app prompt. Sibyl replaces/augments them with a **trust-graded, registry-backed** model.

- Every Capsule carries an **OpenTrust passport** — signed claims: publisher identity, the
  capabilities it requests, and a trust level **L1–L7**.
- A system service, **TrustManager**, verifies the passport against the **OpenTrust Registry** at
  *install time* and *runtime*, and gates each capability grant by trust level + spend caps + a
  kill switch.
- This is **the exact model Hands-Body-&-Feet (HBF) already uses** to gate its ~94 capability tools.
  Apps are just another set of capability-bearing entities; the same machinery applies.

Reuse, not reinvention: the OpenTrust **Registry MCP** (`verify_tool` / `search_tools` /
`list_tools`) generalizes to `verify_capsule` / `search_capsules` / `list_capsules`. See
[`OPENTRUST_INTEGRATION.md`](OPENTRUST_INTEGRATION.md). Client lives in `packages/trust`.

---

## L2 — Capsule ("npm for mobile")

A **Capsule** is the unit of everything: *a signed, passport-bearing, forkable app bundle + a
manifest that declares its capabilities and trust level.* Two kinds:

- **Instant capsules** — JS or WASM bundles that run *inside a host runtime*, no install. This is
  the "see a demo, scan a QR, it's running" experience. [Expo Go](https://expo.dev) already proves
  this exact model (scan QR → a JS bundle runs instantly in a host app).
- **Native capsules** — full APKs for heavier apps. Installed, but still passport-gated.

Three components (all in `packages/`):

1. **`capsule-spec`** — the manifest format. The keystone. ✅ built out first.
2. **`capsule-runtime`** — the host app that fetches + runs capsules. Study/fork Expo's bundle host.
3. **`capsule-registry`** — the backend + CLI: `capsule publish` / `install` / `fork`. The "npm."
   Study npm's registry/CLI UX and F-Droid's open-repo + reproducible-build + signing model.

**Forkability** is a first-class goal: capsules are distributed as *source-available, inspectable*
bundles, not opaque binaries — so any capsule can be forked like a GitHub repo. The manifest
records `source.fork_of` to keep the lineage. This is what makes the ecosystem feel like the open
web rather than a sealed app store.

See [`CAPSULE_SPEC.md`](CAPSULE_SPEC.md).

---

## L3 — Agent control (AI drives the device)

**Every device capability is exposed as an MCP tool, gated by the caller's OpenTrust passport.**
This is the HBF model pointed at the phone: the device is a new *body* for the same agent fabric.

- **Tool surface** (examples): `screen.read`, `ui.tap`, `ui.type`, `app.launch`, `capsule.install`,
  `capsule.run`, `notifications.read`, `wallet.pay`, `compute.offer`. Each requires a minimum trust
  level; spend-bearing tools honor caps + kill switch.
- **Models:** local via [MLC-LLM](https://llm.mlc.ai) / [llama.cpp](https://github.com/ggerganov/llama.cpp)
  / Android **AICore** (Gemini Nano); API models via plain HTTP.
- **Compatibility falls out for free:** because the control surface is **MCP**, *any* agent that
  speaks tool-calling — **Hermes**, **OpenCLAW**, Claude, etc. — connects without bespoke work.
- **Bootstrap with no OS:** on *stock* Android, an **Accessibility Service** can already read the
  screen and perform taps/types. That proves the entire agent-control loop today; we promote it to
  a first-class system service once we have the fork.

See [`AGENT_CONTROL.md`](AGENT_CONTROL.md). Server lives in `packages/agent-mcp`.

---

## L4 — Compute mesh (share / donate compute)

Nodes advertise spare CPU/GPU/NPU; tasks (inference, builds) are dispatched to willing nodes and
optionally **paid or donated in USDC** via the OpenTrust wallet, with identity and trust gated by
OpenTrust. Think BOINC / Folding@home, but trust- and payment-native.

This is a full distributed-systems + economic-design problem and is **deliberately deferred** to a
later phase. It is listed here so the earlier layers (passport identity, the wallet, MCP tool
surface) are designed to make it possible later, not to build it now.

---

## What this buys us

The hard, expensive layer (L0) is *borrowed*. The novel, defensible layers (L1–L3) are *already
prototyped* in Joshua's OpenTrust + HBF work. The job is to **point an existing trust+agent fabric
at a phone, and wrap it in a marketplace** — not to invent an OS. That's what makes this tractable
for a small team.
