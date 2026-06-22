import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Ajv from "ajv";

const here = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(
  await readFile(path.resolve(here, "..", "capsule.schema.json"), "utf8")
);

function makeValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

test("the hello-capsule example is a valid manifest", async () => {
  const manifest = JSON.parse(
    await readFile(
      path.resolve(here, "..", "examples", "hello-capsule", "capsule.json"),
      "utf8"
    )
  );
  const validate = makeValidator();
  const ok = validate(manifest);
  assert.equal(ok, true, JSON.stringify(validate.errors, null, 2));
});

test("an instant capsule without an entry is rejected", () => {
  const validate = makeValidator();
  const bad = {
    schema: "https://sibyl.os/schemas/capsule/v0",
    name: "no-entry",
    version: "0.1.0",
    title: "No Entry",
    kind: "instant",
    runtime: { engine: "js" },
    capabilities: [],
    trust: { minLevel: "L1", passport: "did:opentrust:x" },
    source: { license: "MIT" }
    // entry missing -> should fail the conditional requirement
  };
  assert.equal(validate(bad), false);
});

test("a capability that requests more than its level is still schema-valid (grant is decided by TrustManager)", () => {
  const validate = makeValidator();
  const manifest = {
    schema: "https://sibyl.os/schemas/capsule/v0",
    name: "greedy",
    version: "0.1.0",
    title: "Greedy",
    kind: "instant",
    entry: "index.js",
    runtime: { engine: "js" },
    capabilities: ["wallet.spend"],
    trust: { minLevel: "L2", passport: "did:opentrust:x" },
    source: { license: "MIT" }
  };
  // The schema only checks SHAPE. Whether wallet.spend is granted at L2 is a
  // TrustManager runtime decision, not a manifest-validity question.
  assert.equal(validate(manifest), true, JSON.stringify(validate.errors, null, 2));
});
