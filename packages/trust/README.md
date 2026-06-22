# @sibyl/trust ✅

OpenTrust passport verification + capability gating. Pure, portable core with
pluggable ed25519 adapters: **Node built-in crypto** (CLI/registry/tests) and
**@noble/ed25519** (the React Native host). Unit-tested — `node --test`.

## What it does
- **Passport** (`passport.js`): sign/verify ed25519 over canonicalized claims;
  enforce bundle-hash integrity and manifest binding.
- **Grants** (`grants.js`): trust levels L1–L7, `effectiveLevel` from a local trust
  store, `grantedCapabilities = requested ∩ allowed-at-level`, `gate()` + kill switch.
- **Canonical** (`canonical.js`): deterministic JSON for stable signatures.

## Import map (important for React Native)
The package index (`@sibyl/trust`) pulls in Node's `crypto` via the Node adapter —
fine for Node, but **the RN host must import the pure submodules instead**:

```js
import { verifyPassport } from "@sibyl/trust/passport";
import { grantedCapabilities, effectiveLevel } from "@sibyl/trust/grants";
import { nobleCrypto } from "@sibyl/trust/crypto-noble";
```

## Core idea
Identity is decentralized (anyone can sign); **trust level is local policy**. A
validly-signed unknown publisher is L1 (sandbox) until the user/host pins it higher.
See `../../docs/OPENTRUST_INTEGRATION.md`.
