# Glossary

**Sibyl OS** — the mobile operating system. An AOSP/LineageOS fork: Android-app-compatible, open,
free of arbitrary restrictions (JIT allowed, unlockable, root-capable, sideload-first).

**Capsule Market** — the app marketplace. "npm for mobile": publish, discover, scan-QR-to-run, and
*fork* apps.

**Capsule** — the unit of distribution: a signed, passport-bearing, forkable app bundle + a
manifest. Either **instant** (JS/WASM, runs in the host runtime, no install) or **native** (an APK).

**Manifest (`capsule.json`)** — the keystone artifact. Declares a capsule's identity, kind, entry,
requested capabilities, trust requirements, source/lineage, and store presentation. Spec in
`docs/CAPSULE_SPEC.md`.

**Capsule runtime** — the host app that fetches and runs capsules. Instant capsules run *inside* it
(the Expo-Go model). Lives in `packages/capsule-runtime`.

**Capsule registry** — the backend + CLI (`capsule publish/install/fork`) that stores capsules and
serves them by QR/deep-link. The "npm registry" of the platform. Lives in `packages/capsule-registry`.

**OpenTrust** — the trust fabric. A registry of verifiable, capability-bearing entities with trust
levels L1–L7. Joshua's existing system; reused as Sibyl's permission model.

**Passport** — signed OpenTrust claims attached to a capsule (or an agent): identity, requested
capabilities, trust level. Verified at install + runtime.

**TrustManager** — the Sibyl system service that verifies passports and grants/denies capabilities
by trust level + spend caps + kill switch. The HBF gating model applied to apps + device control.

**Trust level (L1–L7)** — graded trust from L1 (unverified/sandbox) to L7 (system/first-party).
Determines which capabilities a capsule or agent may actually exercise.

**Capability** — a namespaced `domain.action` permission a capsule requests (e.g. `net.fetch`,
`wallet.spend`, `agent.control`). Requests ≠ grants; the TrustManager decides.

**Agent MCP service** — the device-control surface exposed as MCP tools, passport-gated. Lets any
tool-calling agent (Hermes, OpenCLAW, Claude) drive the device. Lives in `packages/agent-mcp`.

**HBF (Hands-Body-&-Feet)** — Joshua's existing MCP server (~94 capability tools gated by L1–L7 +
spend caps + kill switch, with a USDC wallet). The conceptual template for Sibyl's TrustManager and
agent MCP service.

**Hermes** — Joshua's local CLI agent (shell/fs/git, YOLO mode). A first-class client of the agent
MCP service.

**OpenCLAW** — an agent framework Sibyl targets for compatibility *(exact definition to confirm;
MCP compatibility makes the integration generic regardless)*.

**Compute mesh** — the (later-phase) layer where nodes share/donate compute, settled in USDC via the
OpenTrust wallet, trust-gated by passports.

**Waydroid** — a containerized Android guest that runs on a real Linux host. The modern equivalent
of BlackBerry 10's Android runtime layer; the basis of the optional "pure Linux" Phase 5 track.

**Instant vs native capsule** — *instant* = no-install JS/WASM run inside the host (scan-QR-and-go);
*native* = an installed APK. Both are passport-gated.
