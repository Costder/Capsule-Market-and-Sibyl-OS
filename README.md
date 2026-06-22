# Sibyl OS + Capsule Market

> An open, agent-native mobile platform: an AOSP-based mobile OS (**Sibyl OS**) and a
> trust-gated, forkable app marketplace (**Capsule Market**) where every app is an
> OpenTrust-passported, instantly-installable **Capsule** — and where an AI agent can
> drive the entire device.

**Status:** Phase 0 — foundation & spec. Nothing is shipped yet; this repo currently defines
the architecture, the roadmap, and the keystone artifact (the Capsule manifest spec).

---

## Start here (read this first)

The instinct on a project this big is to start by "building the OS." **Don't.** Nobody builds
a mobile OS from scratch — Android itself is the Linux kernel plus a userspace Google assembled.
And the OS is the *least* original part of this vision.

The parts that are actually *ours* — a **trust-gated marketplace**, **agent-native device
control**, and **QR-instant distribution** — are buildable **on top of the Android that already
exists**, with no kernel work. We build those first, prove them, and only *descend* into a
custom OS (an AOSP fork) once they're real.

So the build order is inverted from the dream: **the marketplace + trust + agent layer come
first; the OS comes last.** See [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## The vision, mapped to real technology

| Requirement | How we deliver it | Build on |
|---|---|---|
| "npm for mobile" — see a demo, scan a QR, run instantly | **Capsules**: signed app bundles fetched + run by a host runtime. Instant for JS/WASM; installed for native. | Expo / Expo Go (proves "scan QR → runs"), F-Droid (open repo + signing), npm (registry/CLI UX) |
| Android app compatibility (the "dies without apps" problem) | Sibyl OS is an **AOSP fork** → Android apps run natively, for free. | AOSP, LineageOS |
| Customization & forking (the CyanogenMod era) | OS = a LineageOS-lineage fork. Apps = **forkable Capsules** (source-available bundles, not opaque APKs). | LineageOS, Paranoid Android |
| No arbitrary tech restrictions (e.g. JIT) | Open ROM: unlockable bootloader, root-capable, sideload-first, JIT allowed (ART already JITs — we just don't lock it). | AOSP / ART |
| OpenTrust integrated from day one (every app needs a passport) | Every Capsule carries an **OpenTrust passport**; a system **TrustManager** verifies it and gates capabilities by trust level **L1–L7** + spend caps + kill switch. | OpenTrust Registry SDK; the HBF gating model |
| AI agent controls the whole device (local or API models) | Device capabilities exposed as **MCP tools**, passport-gated. Local models via MLC-LLM/llama.cpp/AICore; API models via HTTP. | Android Accessibility (bootstrap), MCP |
| Compatible with Hermes / OpenCLAW / any agent | Because control is **MCP**, any agent that speaks tool-calling connects for free. | MCP |
| Share / donate compute | A trust-gated compute mesh; tasks paid/donated in USDC via the OpenTrust wallet. (Later phase.) | BOINC-style mesh + HBF wallet |

Full reasoning: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Architecture at a glance

```
┌──────────────────────────────────────────────────────────────────────┐
│  L4  Compute Mesh        share/donate compute · USDC-paid · trust-gated │  (Phase 3+)
├──────────────────────────────────────────────────────────────────────┤
│  L3  Agent Control       device capabilities as MCP tools, passport-    │
│                          gated · local + API models · Hermes/OpenCLAW   │  packages/agent-mcp
├──────────────────────────────────────────────────────────────────────┤
│  L2  Capsule             app format + host runtime + registry + CLI     │  packages/capsule-*
│      ("npm for mobile")  scan QR → instant run · forkable bundles       │
├──────────────────────────────────────────────────────────────────────┤
│  L1  OpenTrust           passport per Capsule · TrustManager verifies   │
│      (trust fabric)      · capabilities gated by L1–L7 + caps + kill    │  packages/trust
├──────────────────────────────────────────────────────────────────────┤
│  L0  Substrate           Sibyl OS = AOSP / LineageOS fork               │  (Phase 2)
│                          Android-app-compatible · open · no restrictions │
└──────────────────────────────────────────────────────────────────────┘
```

The radical part isn't L0 — it's that **L1–L3 are the same trust + agent fabric Joshua already
built** (OpenTrust Registry + Hands-Body-&-Feet). The phone is just a new *body* for it.

---

## Repo map

```
docs/
  ARCHITECTURE.md            Layered design (L0–L4), each mapped to real tech
  ROADMAP.md                 Phased plan (crawl → walk → run) with definition-of-done
  CAPSULE_SPEC.md            The Capsule format + manifest (the keystone artifact)
  OPENTRUST_INTEGRATION.md   Passports, TrustManager, L1–L7 capability gating
  AGENT_CONTROL.md           The device-control MCP service; Hermes/OpenCLAW compat
  GLOSSARY.md                Terms of art
packages/
  capsule-spec/              ✅ CONCRETE: manifest JSON Schema + TS types + example capsule
  capsule-runtime/           ▢ stub: the Expo-Go-style host that runs Capsules instantly
  capsule-registry/          ▢ stub: the "npm for mobile" backend + CLI (publish/install/fork)
  agent-mcp/                 ▢ stub: device-control MCP server (the HBF model for the phone)
  trust/                     ▢ stub: OpenTrust passport verification client
CONTRIBUTING.md
```

`capsule-spec` is intentionally the one piece built out first: the manifest is the keystone
every other component keys off (the registry indexes it, the runtime executes it, the
TrustManager gates on it). Define it once, and the rest of the system has a contract to build
against.

---

## License

See [`LICENSE`](LICENSE).
