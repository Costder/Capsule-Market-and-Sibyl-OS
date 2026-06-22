// Ed25519 crypto adapter for React Native (the capsule-host app).
// Pure JS via @noble/ed25519 + @noble/hashes — works where Node's crypto isn't
// available. Same interface as crypto-node.js so passport.js is runtime-agnostic.
//
// NOTE: requires `@noble/ed25519` and `@noble/hashes` in the host app. This file
// is imported only by the host, never by the Node CLI/registry/tests.

import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

// @noble/ed25519 v2 needs sha512 wired up explicitly.
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const enc = new TextEncoder();

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// base64url (no padding), used for raw key scalars exported from JWK.
function b64uToBytes(b64u) {
  let b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return b64ToBytes(b64);
}
function bytesToB64(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export const nobleCrypto = {
  async sign(message, secretKey) {
    const [d] = secretKey.split(".");
    const sig = await ed.signAsync(enc.encode(message), b64uToBytes(d));
    return bytesToB64(sig);
  },
  async verify(message, sigB64, publisherKey) {
    try {
      const sig = b64ToBytes(sigB64);
      return await ed.verifyAsync(sig, enc.encode(message), b64uToBytes(publisherKey));
    } catch {
      return false;
    }
  },
  async sha256Hex(bytes) {
    const data = typeof bytes === "string" ? enc.encode(bytes) : bytes;
    return bytesToHex(sha256(data));
  },
};

export default nobleCrypto;
