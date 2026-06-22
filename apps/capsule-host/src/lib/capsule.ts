import { verify, sha256Hex, effectiveLevel, grantedCapabilities } from "./trustClient";
import { getTrustStore } from "./store";

export type ResolvedCapsule = {
  id: string;
  manifest: any;
  passport: any;
  html: string;
  verification: { valid: boolean; reason?: string; claimedLevel?: string };
  level: string;
  granted: string[];
};

/** Turn a scanned QR string into a registry resolve URL. */
export function parseScan(data: string): string | null {
  if (!data) return null;
  if (data.startsWith("capsule://run")) {
    const m = data.match(/[?&]src=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
  if (data.startsWith("http://") || data.startsWith("https://")) return data;
  return null;
}

/** Fetch, verify, and compute granted capabilities for a capsule. */
export async function resolveCapsule(src: string): Promise<ResolvedCapsule> {
  const r = await fetch(src);
  if (!r.ok) throw new Error(`resolve failed (${r.status})`);
  const { id, manifest, passport } = await r.json();
  const b = await fetch(src.replace(/\/$/, "") + "/bundle");
  if (!b.ok) throw new Error(`bundle fetch failed (${b.status})`);
  const html = await b.text();

  const bundleHash = await sha256Hex(html);
  const verification = await verify({ passport, bundleHash, manifest });

  const store = await getTrustStore();
  const level = effectiveLevel(passport.publisherKey, store);
  const granted = verification.valid
    ? grantedCapabilities(manifest.capabilities || [], level)
    : [];

  return {
    id: id || `${manifest.name}@${manifest.version}`,
    manifest,
    passport,
    html,
    verification,
    level,
    granted,
  };
}
