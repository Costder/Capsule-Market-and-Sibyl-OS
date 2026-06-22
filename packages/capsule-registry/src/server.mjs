#!/usr/bin/env node
// Capsule registry — the "npm for mobile" backend. Zero external deps (Node http
// + filesystem). Verifies each capsule's OpenTrust passport on publish, serves
// manifests/bundles, and renders a scan-to-run QR page.
//
// Run:  node src/server.mjs            (PORT defaults to 4173, STORE to ./store)

import http from "node:http";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nodeCrypto, verifyPassport } from "../../trust/src/index.js";

const PORT = Number(process.env.PORT || 4173);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STORE = process.env.STORE || path.join(ROOT, "store");

const idOf = (name, version) => `${name}@${version}`;
const dirOf = (id) => path.join(STORE, encodeURIComponent(id));

function send(res, status, body, headers = {}) {
  const data = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body, null, 2);
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(data);
}
async function readJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function publish(req, res, baseUrl) {
  const { manifest, passport, bundleBase64 } = await readJsonBody(req);
  if (!manifest?.name || !manifest?.version) return send(res, 400, { error: "manifest name/version required" });
  if (!bundleBase64) return send(res, 400, { error: "bundleBase64 required" });
  const bundle = Buffer.from(bundleBase64, "base64");
  const bundleHash = await nodeCrypto.sha256Hex(bundle);

  // Trust gate: the registry refuses to host a capsule whose passport doesn't
  // verify against its own bytes. Identity is the price of distribution.
  const v = await verifyPassport({ passport, bundleHash, manifest }, nodeCrypto);
  if (!v.valid) return send(res, 403, { error: `passport invalid: ${v.reason}` });

  const id = idOf(manifest.name, manifest.version);
  const dir = dirOf(id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(dir, "passport.json"), JSON.stringify(passport, null, 2));
  await writeFile(path.join(dir, "bundle.bin"), bundle);
  return send(res, 201, {
    id,
    publisher: passport.publisher,
    trustLevel: passport.trustLevel,
    resolveUrl: `${baseUrl}/capsules/${encodeURIComponent(id)}`,
    runPage: `${baseUrl}/c/${encodeURIComponent(id)}`,
  });
}

async function resolve(res, id) {
  const dir = dirOf(id);
  if (!existsSync(dir)) return send(res, 404, { error: "not found" });
  const manifest = JSON.parse(await readFile(path.join(dir, "manifest.json"), "utf8"));
  const passport = JSON.parse(await readFile(path.join(dir, "passport.json"), "utf8"));
  return send(res, 200, { id, manifest, passport });
}

async function serveBundle(res, id) {
  const file = path.join(dirOf(id), "bundle.bin");
  if (!existsSync(file)) return send(res, 404, { error: "not found" });
  const manifest = JSON.parse(await readFile(path.join(dirOf(id), "manifest.json"), "utf8"));
  const type = manifest.runtime?.engine === "web" ? "text/html; charset=utf-8" : "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  res.end(await readFile(file));
}

async function listCapsules(res, baseUrl) {
  await mkdir(STORE, { recursive: true });
  const ids = (await readdir(STORE)).map(decodeURIComponent);
  return send(res, 200, { count: ids.length, capsules: ids.map((id) => ({ id, runPage: `${baseUrl}/c/${encodeURIComponent(id)}` })) });
}

function runPage(res, id, baseUrl) {
  const resolveUrl = `${baseUrl}/capsules/${encodeURIComponent(id)}`;
  const deepLink = `capsule://run?src=${encodeURIComponent(resolveUrl)}`;
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${id} — Capsule</title><style>body{font-family:system-ui;background:#0b0f1a;color:#e8ecf5;display:grid;place-items:center;min-height:100vh;margin:0}
.card{background:#121829;border:1px solid #25304d;border-radius:20px;padding:32px;max-width:380px;text-align:center}
#qr{background:#fff;padding:16px;border-radius:12px;display:inline-block;margin:16px 0}
a.btn{display:block;margin-top:12px;padding:14px;background:#3b82f6;color:#fff;border-radius:12px;text-decoration:none;font-weight:600}
small{color:#8a96b3;word-break:break-all}</style></head><body><div class="card">
<h2>${id}</h2><p>Scan with the Capsule app to run instantly.</p>
<div id="qr"></div>
<a class="btn" href="${deepLink}">Open in Capsule</a>
<p><small>${resolveUrl}</small></p></div>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
<script>new QRCode(document.getElementById("qr"),{text:${JSON.stringify(deepLink)},width:220,height:220});</script>
</body></html>`);
}

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://${req.headers.host}`;
  try {
    const url = new URL(req.url, baseUrl);
    const p = url.pathname;
    if (req.method === "POST" && p === "/capsules") return await publish(req, res, baseUrl);
    if (req.method === "GET" && p === "/") return await listCapsules(res, baseUrl);
    let m;
    if (req.method === "GET" && (m = p.match(/^\/capsules\/([^/]+)$/))) return await resolve(res, decodeURIComponent(m[1]));
    if (req.method === "GET" && (m = p.match(/^\/capsules\/([^/]+)\/bundle$/))) return await serveBundle(res, decodeURIComponent(m[1]));
    if (req.method === "GET" && (m = p.match(/^\/c\/([^/]+)$/))) return runPage(res, decodeURIComponent(m[1]), baseUrl);
    return send(res, 404, { error: "no route" });
  } catch (e) {
    return send(res, 500, { error: String((e && e.message) || e) });
  }
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => console.log(`capsule-registry on http://localhost:${PORT}  (store: ${STORE})`));
}
export { server };
