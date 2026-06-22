// Capability gating — the TrustManager logic, pure and portable.
//
// Requests are not grants. A capsule declares the capabilities it wants; the
// EFFECTIVE trust level (from the local trust store, not the capsule's own
// claim) decides which are actually granted. A kill switch can freeze everything.

export const TRUST_ORDER = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"];

export function levelIndex(level) {
  return TRUST_ORDER.indexOf(level);
}

/** True if `have` meets or exceeds `need`. */
export function meetsTrust(have, need) {
  const h = levelIndex(have);
  const n = levelIndex(need);
  return h >= 0 && n >= 0 && h >= n;
}

// Minimum trust level required for each capability. Extend over time; the
// pinned manifest schema version lets us grow this without breaking old capsules.
export const CAPABILITY_MIN_LEVEL = {
  "storage.local": "L1",
  "net.fetch": "L2",
  "notifications.post": "L2",
  "device.sensors": "L3",
  "agent.control": "L4",
  "compute.offer": "L4",
  "wallet.spend": "L5",
};

/**
 * Resolve a publisher's EFFECTIVE level from the local trust store.
 * Unknown publishers are L1 (sandbox) — identity proven, trust not yet granted.
 * @param {string} publisherKey
 * @param {Record<string,string>} [trustStore] publisherKey -> assigned level
 */
export function effectiveLevel(publisherKey, trustStore) {
  return (trustStore && trustStore[publisherKey]) || "L1";
}

/**
 * Given requested capabilities and an effective level, return those granted.
 * @param {string[]} requested
 * @param {string} level
 */
export function grantedCapabilities(requested, level) {
  return (requested || []).filter((cap) => {
    const min = CAPABILITY_MIN_LEVEL[cap];
    return min !== undefined && meetsTrust(level, min);
  });
}

/**
 * Runtime check called before any guarded action.
 * @param {string} capability
 * @param {{granted:string[], killSwitch?:boolean}} ctx
 */
export function gate(capability, ctx) {
  if (!ctx || ctx.killSwitch) return false;
  return (ctx.granted || []).includes(capability);
}
