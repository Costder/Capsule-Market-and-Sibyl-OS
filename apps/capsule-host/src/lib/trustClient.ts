// Thin wrapper over @sibyl/trust using the @noble (pure-JS) crypto adapter.
// We import the PURE submodules only — never "@sibyl/trust" (its index pulls in
// Node's crypto via crypto-node.js, which can't bundle for React Native).
import { verifyPassport } from "@sibyl/trust/passport";
import { grantedCapabilities, effectiveLevel } from "@sibyl/trust/grants";
import { nobleCrypto } from "@sibyl/trust/crypto-noble";

export { grantedCapabilities, effectiveLevel };

export async function verify(args: { passport: any; bundleHash: string; manifest: any }) {
  return verifyPassport(args, nobleCrypto);
}
export async function sha256Hex(text: string) {
  return nobleCrypto.sha256Hex(text);
}
