#!/usr/bin/env node
// `capsule` CLI — keygen, init, sign, publish. Zero external deps; reuses
// @sibyl/trust via relative import so it runs straight from the monorepo.
//
//   capsule keygen
//   capsule init ./my-capsule --name my-capsule --title "My Capsule"
//   capsule sign ./my-capsule --level L2
//   capsule publish ./my-capsule --registry http://localhost:4173

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { nodeCrypto, generateKeypair, buildClaims, signPassport } from "../../trust/src/index.js";

const DEFAULT_IDENTITY = path.join(os.homedir(), ".capsule", "identity.json");

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) out[a.slice(2)] = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? true : argv[++i];
    else out._.push(a);
  }
  return out;
}
const die = (msg) => { console.error("error: " + msg); process.exit(1); };

async function loadIdentity(file) {
  const f = file || DEFAULT_IDENTITY;
  if (!existsSync(f)) die(`no identity at ${f} — run \`capsule keygen\` first`);
  return JSON.parse(await readFile(f, "utf8"));
}

async function keygen(args) {
  const out = args.out || DEFAULT_IDENTITY;
  const kp = generateKeypair();
  const identity = { publisher: args.publisher || os.userInfo().username, ...kp };
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(identity, null, 2));
  console.log(`identity written to ${out}`);
  console.log(`publisherKey: ${identity.publisherKey}`);
}

async function init(args) {
  const dir = args._[0] || die("usage: capsule init <dir>");
  const name = args.name || path.basename(path.resolve(dir));
  await mkdir(dir, { recursive: true });
  const manifest = {
    schema: "https://sibyl.os/schemas/capsule/v0",
    name, version: "0.1.0", title: args.title || name,
    description: "", kind: "instant", entry: "index.html", apk: null,
    runtime: { engine: "web", min: "0.1.0" },
    capabilities: ["storage.local"],
    trust: { minLevel: "L1", passport: "passport.json", signature: null, publisherKey: null },
    source: { repo: null, fork_of: null, license: "MIT" },
    ui: { icon: null, screenshots: [], demo: null },
  };
  await writeFile(path.join(dir, "capsule.json"), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(dir, "index.html"),
`<!doctype html><meta charset="utf-8"><title>${name}</title>
<body style="font-family:system-ui;display:grid;place-items:center;height:90vh;margin:0">
<main style="text-align:center"><h1>${name}</h1><p id="out">loading…</p></main>
<script>
window.__capsuleMain = async function(capsule){
  var n = Number(await capsule.storage.get("runs") || 0) + 1;
  await capsule.storage.set("runs", String(n));
  document.getElementById("out").textContent = "Hello from a Capsule — run #" + n;
};
</script>`);
  console.log(`scaffolded capsule in ${dir}`);
}

async function buildPassport(dir, args) {
  const manifest = JSON.parse(await readFile(path.join(dir, "capsule.json"), "utf8"));
  const entry = manifest.entry || "index.html";
  const bundle = await readFile(path.join(dir, entry));
  const bundleHash = await nodeCrypto.sha256Hex(bundle);
  const id = await loadIdentity(args.identity);
  const level = args.level || manifest.trust?.minLevel || "L1";
  const claims = buildClaims({
    publisher: id.publisher, publisherKey: id.publisherKey, trustLevel: level,
    capabilities: manifest.capabilities || [], capsuleName: manifest.name,
    version: manifest.version, bundleHash,
  });
  const passport = await signPassport(claims, id.secretKey, nodeCrypto);
  manifest.trust = { ...manifest.trust, minLevel: level, publisherKey: id.publisherKey };
  await writeFile(path.join(dir, "capsule.json"), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(dir, "passport.json"), JSON.stringify(passport, null, 2));
  return { manifest, passport, bundle };
}

async function sign(args) {
  const dir = args._[0] || die("usage: capsule sign <dir>");
  const { passport } = await buildPassport(dir, args);
  console.log(`signed ${passport.capsuleName}@${passport.version} as ${passport.publisher} (claimed ${passport.trustLevel})`);
}

async function publish(args) {
  const dir = args._[0] || die("usage: capsule publish <dir> --registry <url>");
  const registry = args.registry || die("--registry <url> required");
  const { manifest, passport, bundle } = await buildPassport(dir, args);
  const res = await fetch(registry.replace(/\/$/, "") + "/capsules", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ manifest, passport, bundleBase64: bundle.toString("base64") }),
  });
  const body = await res.json();
  if (!res.ok) die(`publish failed (${res.status}): ${body.error}`);
  console.log(`published ${body.id}`);
  console.log(`  run page: ${body.runPage}`);
  console.log(`  resolve : ${body.resolveUrl}`);
}

const cmds = { keygen, init, sign, publish };
const args = parseArgs(process.argv.slice(2));
const cmd = args._.shift();
if (!cmd || !cmds[cmd]) {
  console.log("capsule <keygen|init|sign|publish> [...]");
  process.exit(cmd ? 1 : 0);
}
cmds[cmd](args).catch((e) => die(String((e && e.message) || e)));
