#!/usr/bin/env node
// Sibyl agent MCP server (v0) — exposes the Capsule registry to any tool-calling
// agent (Hermes, OpenCLAW, Claude) over MCP stdio (newline-delimited JSON-RPC).
// Zero external deps. This is the seam that makes the platform agent-native:
// every capsule operation is a passport-checked tool call.
//
//   REGISTRY_URL=http://localhost:4173 node src/server.mjs
//
// Tools: capsule_search, capsule_resolve, capsule_run. capsule_run returns a
// deep link the on-device host opens — live on-device drive lands in v0.1.

import readline from "node:readline";
import { nodeCrypto, verifyPassport, effectiveLevel, grantedCapabilities } from "../../trust/src/index.js";

const REGISTRY = (process.env.REGISTRY_URL || "http://localhost:4173").replace(/\/$/, "");
const TRUST_STORE = {}; // publisherKey -> level; empty = everyone L1 (sandbox)

const TOOLS = [
  { name: "capsule_search", description: "List capsules available in the registry.", inputSchema: { type: "object", properties: {} } },
  { name: "capsule_resolve", description: "Resolve a capsule by id and verify its OpenTrust passport. Returns manifest, verification, and granted capabilities.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
  { name: "capsule_run", description: "Get a deep link that launches a capsule in the on-device Capsule host.", inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
];

async function callTool(name, args = {}) {
  if (name === "capsule_search") {
    const r = await fetch(`${REGISTRY}/`);
    return await r.json();
  }
  if (name === "capsule_resolve") {
    const r = await fetch(`${REGISTRY}/capsules/${encodeURIComponent(args.id)}`);
    if (!r.ok) throw new Error(`not found: ${args.id}`);
    const { manifest, passport } = await r.json();
    const b = await fetch(`${REGISTRY}/capsules/${encodeURIComponent(args.id)}/bundle`);
    const bundleHash = await nodeCrypto.sha256Hex(Buffer.from(await b.arrayBuffer()));
    const v = await verifyPassport({ passport, bundleHash, manifest }, nodeCrypto);
    const level = effectiveLevel(passport.publisherKey, TRUST_STORE);
    const granted = v.valid ? grantedCapabilities(manifest.capabilities || [], level) : [];
    return { manifest, verification: v, effectiveLevel: level, granted };
  }
  if (name === "capsule_run") {
    const resolveUrl = `${REGISTRY}/capsules/${encodeURIComponent(args.id)}`;
    return { deepLink: `capsule://run?src=${encodeURIComponent(resolveUrl)}`, resolveUrl };
  }
  throw new Error(`unknown tool: ${name}`);
}

function reply(id, result) { write({ jsonrpc: "2.0", id, result }); }
function replyErr(id, code, message) { write({ jsonrpc: "2.0", id, error: { code, message } }); }
function write(obj) { process.stdout.write(JSON.stringify(obj) + "\n"); }

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  try {
    if (method === "initialize") {
      return reply(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "sibyl-agent-mcp", version: "0.0.1" } });
    }
    if (method === "tools/list") return reply(id, { tools: TOOLS });
    if (method === "tools/call") {
      const out = await callTool(params?.name, params?.arguments || {});
      return reply(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
    }
    if (method === "notifications/initialized") return; // no response to notifications
    if (id !== undefined) replyErr(id, -32601, `method not found: ${method}`);
  } catch (e) {
    if (id !== undefined) replyErr(id, -32000, String((e && e.message) || e));
  }
});
