import { test } from "node:test";
import assert from "node:assert/strict";
import { createHostBridge } from "../src/bridge.js";
import { guestBootstrapSource } from "../src/guest.js";

function makeBridge(granted, killSwitch = false) {
  const store = {};
  return createHostBridge({
    granted,
    killSwitch,
    handlers: {
      "storage.get": ({ key }) => store[key] ?? null,
      "storage.set": ({ key, value }) => { store[key] = value; return true; },
      "net.fetch": ({ url }) => ({ fetched: url }),
      "ui.render": () => true,
    },
  });
}

test("granted capability executes the handler", async () => {
  const h = makeBridge(["storage.local"]);
  const set = await h({ t: "capsule-rpc", id: 1, cap: "storage.local", method: "storage.set", args: { key: "n", value: "1" } });
  assert.equal(set.ok, true);
  const get = await h({ t: "capsule-rpc", id: 2, cap: "storage.local", method: "storage.get", args: { key: "n" } });
  assert.equal(get.result, "1");
});

test("ungranted capability is denied", async () => {
  const h = makeBridge(["storage.local"]); // net.fetch NOT granted
  const r = await h({ t: "capsule-rpc", id: 3, cap: "net.fetch", method: "net.fetch", args: { url: "https://x" } });
  assert.equal(r.ok, false);
  assert.match(r.error, /not granted/);
});

test("kill switch denies everything", async () => {
  const h = makeBridge(["storage.local"], true);
  const r = await h({ t: "capsule-rpc", id: 4, cap: "storage.local", method: "storage.get", args: { key: "n" } });
  assert.equal(r.ok, false);
  assert.match(r.error, /kill switch/);
});

test("unknown method errors", async () => {
  const h = makeBridge(["storage.local"]);
  const r = await h({ t: "capsule-rpc", id: 5, cap: "storage.local", method: "nope", args: {} });
  assert.equal(r.ok, false);
  assert.match(r.error, /unknown method/);
});

test("non-rpc messages are ignored", async () => {
  const h = makeBridge([]);
  assert.equal(await h({ t: "other" }), null);
});

test("guest bootstrap source is syntactically valid JS", () => {
  const src = guestBootstrapSource(JSON.stringify({ name: "hello" }));
  // Throws on syntax error:
  // eslint-disable-next-line no-new-func
  new Function(src);
  assert.match(src, /window\.capsule/);
});
