// Runs with: node --test   (uses Node built-in ed25519 — no install needed)
import { test } from "node:test";
import assert from "node:assert/strict";

import { nodeCrypto, generateKeypair } from "../src/crypto-node.js";
import { buildClaims, signPassport, verifyPassport } from "../src/passport.js";
import {
  grantedCapabilities,
  gate,
  effectiveLevel,
  meetsTrust,
} from "../src/grants.js";

async function makeSignedCapsule(overrides = {}) {
  const { publisherKey, secretKey } = generateKeypair();
  const bundle = overrides.bundle ?? "<h1>hello capsule</h1>";
  const bundleHash = await nodeCrypto.sha256Hex(bundle);
  const manifest = {
    name: "hello-capsule",
    version: "0.1.0",
    trust: { publisherKey },
    ...overrides.manifest,
  };
  const claims = buildClaims({
    publisher: "test",
    publisherKey,
    trustLevel: overrides.trustLevel ?? "L2",
    capabilities: overrides.capabilities ?? ["storage.local", "net.fetch"],
    capsuleName: manifest.name,
    version: manifest.version,
    bundleHash,
  });
  const passport = await signPassport(claims, secretKey, nodeCrypto);
  return { publisherKey, secretKey, bundle, bundleHash, manifest, passport };
}

test("a correctly signed passport verifies", async () => {
  const c = await makeSignedCapsule();
  const r = await verifyPassport(
    { passport: c.passport, bundleHash: c.bundleHash, manifest: c.manifest },
    nodeCrypto
  );
  assert.equal(r.valid, true, r.reason);
  assert.equal(r.claimedLevel, "L2");
});

test("a tampered bundle is rejected", async () => {
  const c = await makeSignedCapsule();
  const tamperedHash = await nodeCrypto.sha256Hex("<h1>evil</h1>");
  const r = await verifyPassport(
    { passport: c.passport, bundleHash: tamperedHash, manifest: c.manifest },
    nodeCrypto
  );
  assert.equal(r.valid, false);
  assert.match(r.reason, /bundle hash/);
});

test("a forged signature (wrong key) is rejected", async () => {
  const c = await makeSignedCapsule();
  const attacker = generateKeypair();
  const forged = { ...c.passport, publisherKey: attacker.publisherKey };
  const r = await verifyPassport({ passport: forged, bundleHash: c.bundleHash }, nodeCrypto);
  assert.equal(r.valid, false);
  assert.match(r.reason, /bad signature/);
});

test("passport not bound to the manifest publisher is rejected", async () => {
  const c = await makeSignedCapsule();
  const otherManifest = { ...c.manifest, trust: { publisherKey: "AAAAdifferentkey" } };
  const r = await verifyPassport(
    { passport: c.passport, bundleHash: c.bundleHash, manifest: otherManifest },
    nodeCrypto
  );
  assert.equal(r.valid, false);
  assert.match(r.reason, /not bound/);
});

test("requests are not grants: unknown publisher gets L1, loses net.fetch", async () => {
  const c = await makeSignedCapsule({ capabilities: ["storage.local", "net.fetch"] });
  const level = effectiveLevel(c.publisherKey, /* empty store */ {});
  assert.equal(level, "L1");
  const granted = grantedCapabilities(["storage.local", "net.fetch"], level);
  assert.deepEqual(granted, ["storage.local"]);
});

test("trust store pins a publisher to L4, unlocking agent.control", async () => {
  const c = await makeSignedCapsule({ capabilities: ["agent.control", "wallet.spend"] });
  const store = { [c.publisherKey]: "L4" };
  const level = effectiveLevel(c.publisherKey, store);
  const granted = grantedCapabilities(["agent.control", "wallet.spend"], level);
  assert.deepEqual(granted, ["agent.control"]); // wallet.spend needs L5
  assert.equal(gate("agent.control", { granted }), true);
  assert.equal(gate("wallet.spend", { granted }), false);
});

test("kill switch freezes all granted capabilities", () => {
  const granted = ["storage.local", "agent.control"];
  assert.equal(gate("agent.control", { granted, killSwitch: true }), false);
});

test("trust ordering", () => {
  assert.equal(meetsTrust("L4", "L2"), true);
  assert.equal(meetsTrust("L1", "L2"), false);
});
