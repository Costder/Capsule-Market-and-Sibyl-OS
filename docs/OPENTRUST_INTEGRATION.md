# OpenTrust Integration

OpenTrust is wired in **from day one** as the platform's permission model — not a plugin. The
thesis: *stock app permissions are a coarse per-app prompt; Sibyl grades trust on a registry-backed
L1–L7 scale and gates every capability against it.* This reuses machinery Joshua already built.

---

## The pieces that already exist (reuse, don't rebuild)

- **OpenTrust Registry (MCP, `opentrust-sdk`)** — tools `verify_tool` / `search_tools` / `list_tools`.
  These generalize cleanly to **`verify_capsule` / `search_capsules` / `list_capsules`**: a capsule is
  just another registry-listed, capability-bearing entity.
- **Hands-Body-&-Feet (HBF)** — already gates ~94 capability tools by **trust level L1–L7 + spend caps
  + a kill switch**, with passport claims minted as a JWT. Sibyl's TrustManager is *the same gating
  logic applied to apps and device capabilities* instead of agent tools.

So the device's permission system and the agent's tool-gating system are **one system**, not two.

---

## Passports

Every Capsule carries an **OpenTrust passport**: signed claims describing
- **identity** — who published it (publisher key / DID),
- **requested capabilities** — the `capabilities[]` from its manifest,
- **trust level** — `L1`…`L7` (must be numeric under the hood, like HBF's `PassportClaims`, or the
  trust check mis-allows).

Passports are referenced or embedded in `trust.passport` in the manifest. Prefer **embed-and-verify**
for instant capsules so first-run trust needs no network round-trip.

---

## TrustManager (the system service)

A Sibyl system service that sits between a Capsule (or the agent) and any guarded capability.

```
install:   verify passport signature  →  resolve trust level against Registry  →  record grants
runtime:   on each guarded call → check (capability ∈ granted) ∧ (level ≥ minLevel)
           spend-bearing calls → also check spend caps + global kill switch
```

- **Capabilities are requests; grants are decided here.** A capsule that *requests* `wallet.spend`
  but only holds `L2` is installable, but that capability is denied (capsule runs degraded). No
  silent escalation.
- **Spend caps + kill switch** mirror HBF exactly: any `wallet.spend` / `compute.offer` call is
  bounded, and a single kill switch can freeze all guarded capability use device-wide.
- **Escalation re-prompts.** If a capsule update raises its requested level/capabilities, the user
  must re-approve — never inherited silently across versions.

---

## Trust levels (starting interpretation)

| Level | Rough meaning | Example capabilities unlocked |
|---|---|---|
| L1 | Unverified / sandbox-only | `storage.local` |
| L2 | Signed publisher, basic reputation | `net.fetch`, `notifications.post` |
| L3 | Established publisher | `device.sensors` |
| L4 | Trusted / agent-eligible | `agent.control`, `compute.offer` |
| L5 | High-trust, value-bearing | `wallet.spend` (within caps) |
| L6–L7 | System / first-party | reserved for core services |

Exact thresholds are policy and will be tuned; the levels themselves come straight from the
existing OpenTrust passport model.

---

## Why this matters for the rest of the platform

- It makes "AI agent controls the whole device" **safe** — the agent's reach is bounded by its
  passport, with a kill switch, not by trust-by-default.
- It makes the marketplace **accountable** — every capsule has a verifiable publisher and trust
  level, and capability creep is visible.
- It's the **foundation the compute mesh needs** — paying/donating compute requires exactly this
  identity + spend-cap fabric.

Client implementation lives in [`packages/trust`](../packages/trust).
