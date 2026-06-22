// OpenTrust passport: sign + verify a capsule's authorship and integrity.
//
// A passport is a set of signed CLAIMS about a capsule. The signature proves the
// holder of the publisher key authored exactly this manifest + bundle. It does
// NOT, by itself, say the publisher is trusted — that's the local trust store's
// job (see grants.js). Identity is decentralized; trust LEVEL is a local policy.

import { canonicalize } from "./canonical.js";

export const PASSPORT_VERSION = "0";

/**
 * @typedef {Object} Claims
 * @property {string} v
 * @property {string} publisher       Human label for the publisher.
 * @property {string} publisherKey    base64url ed25519 public key (the identity).
 * @property {string} trustLevel      Claimed level L1..L7 (advisory; store decides effective).
 * @property {string[]} capabilities  Requested capability scopes.
 * @property {string} capsuleName
 * @property {string} version
 * @property {string} bundleHash      sha256 hex of the capsule bundle bytes.
 * @property {string} issuedAt        ISO timestamp.
 * @property {string} [sig]           base64 signature over the claims (added by signPassport).
 */

/** Build the canonical claim set (everything that gets signed). */
export function buildClaims(input) {
  return {
    v: PASSPORT_VERSION,
    publisher: input.publisher,
    publisherKey: input.publisherKey,
    trustLevel: input.trustLevel,
    capabilities: [...(input.capabilities || [])].sort(),
    capsuleName: input.capsuleName,
    version: input.version,
    bundleHash: input.bundleHash,
    issuedAt: input.issuedAt || new Date().toISOString(),
  };
}

/** The exact message bytes that are signed/verified (claims minus the signature). */
export function claimsMessage(claims) {
  const { sig, ...rest } = claims;
  return canonicalize(rest);
}

/**
 * Sign claims, returning a complete passport (claims + sig).
 * @param {Claims} claims
 * @param {string} secretKey
 * @param {{sign:(msg:string,sk:string)=>Promise<string>}} crypto
 */
export async function signPassport(claims, secretKey, crypto) {
  const sig = await crypto.sign(claimsMessage(claims), secretKey);
  return { ...claims, sig };
}

/**
 * Verify a passport's authenticity (signature) and integrity (bundle hash),
 * and — when a manifest is supplied — that the passport is bound to it.
 *
 * @param {{passport:Claims, bundleHash?:string, manifest?:any}} args
 * @param {{verify:(msg:string,sig:string,pk:string)=>Promise<boolean>}} crypto
 * @returns {Promise<{valid:boolean, reason?:string, claimedLevel?:string, capabilities?:string[]}>}
 */
export async function verifyPassport({ passport, bundleHash, manifest }, crypto) {
  if (!passport || typeof passport !== "object") {
    return { valid: false, reason: "no passport" };
  }
  if (!passport.sig) return { valid: false, reason: "unsigned" };
  if (!passport.publisherKey) return { valid: false, reason: "no publisher key" };
  if (!passport.trustLevel) return { valid: false, reason: "no trust level" };

  const ok = await crypto.verify(
    claimsMessage(passport),
    passport.sig,
    passport.publisherKey
  );
  if (!ok) return { valid: false, reason: "bad signature" };

  if (bundleHash !== undefined && passport.bundleHash !== bundleHash) {
    return { valid: false, reason: "bundle hash mismatch (tampered bundle)" };
  }

  if (manifest) {
    if (manifest.trust?.publisherKey &&
        manifest.trust.publisherKey !== passport.publisherKey) {
      return { valid: false, reason: "passport not bound to manifest publisher" };
    }
    if (manifest.name && manifest.name !== passport.capsuleName) {
      return { valid: false, reason: "capsule name mismatch" };
    }
    if (manifest.version && manifest.version !== passport.version) {
      return { valid: false, reason: "version mismatch" };
    }
  }

  return {
    valid: true,
    claimedLevel: passport.trustLevel,
    capabilities: passport.capabilities || [],
  };
}
