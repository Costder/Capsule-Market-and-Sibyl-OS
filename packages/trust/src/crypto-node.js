// Ed25519 crypto adapter for Node (CLI, registry, tests).
// Uses Node's built-in crypto — zero external dependencies — via JWK key import.
// Keys are stored as base64url raw scalars: publicKey = x, secretKey = "d.x".

import {
  createPublicKey,
  createPrivateKey,
  sign as nodeSign,
  verify as nodeVerify,
  generateKeyPairSync,
  createHash,
} from "node:crypto";

function pubKeyObject(xB64u) {
  return createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: xB64u }, format: "jwk" });
}
function privKeyObject(dB64u, xB64u) {
  return createPrivateKey({
    key: { kty: "OKP", crv: "Ed25519", d: dB64u, x: xB64u },
    format: "jwk",
  });
}

/** @returns {{publisherKey:string, secretKey:string}} */
export function generateKeypair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const jpub = publicKey.export({ format: "jwk" });
  const jpriv = privateKey.export({ format: "jwk" });
  return { publisherKey: jpub.x, secretKey: `${jpriv.d}.${jpriv.x}` };
}

export const nodeCrypto = {
  /** @param {string} message @param {string} secretKey "d.x" */
  async sign(message, secretKey) {
    const [d, x] = secretKey.split(".");
    const key = privKeyObject(d, x);
    return nodeSign(null, Buffer.from(message, "utf8"), key).toString("base64");
  },
  /** @param {string} message @param {string} sigB64 @param {string} publisherKey x */
  async verify(message, sigB64, publisherKey) {
    try {
      const key = pubKeyObject(publisherKey);
      return nodeVerify(null, Buffer.from(message, "utf8"), key, Buffer.from(sigB64, "base64"));
    } catch {
      return false;
    }
  },
  /** sha256 hex of bytes (Buffer | Uint8Array | string). */
  async sha256Hex(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
  },
};

export default nodeCrypto;
