// @sibyl/trust — OpenTrust passport verification + capability gating.
// Pure, portable core (canonical, passport, grants) plus pluggable ed25519
// adapters: nodeCrypto for CLI/registry/tests, nobleCrypto for the RN host.

export * from "./canonical.js";
export * from "./passport.js";
export * from "./grants.js";
export { nodeCrypto, generateKeypair } from "./crypto-node.js";
// nobleCrypto is intentionally NOT re-exported here to keep Node consumers free
// of the @noble dependency. Import it directly: "@sibyl/trust/crypto-noble".
