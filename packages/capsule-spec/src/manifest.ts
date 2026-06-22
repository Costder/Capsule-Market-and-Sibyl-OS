/**
 * @sibyl/capsule-spec — the Capsule manifest contract.
 *
 * This is the keystone of the platform: the registry indexes a CapsuleManifest,
 * the runtime executes it, and the TrustManager gates on it. Keep this file and
 * `capsule.schema.json` in lockstep.
 */

export const CAPSULE_SCHEMA_ID = "https://sibyl.os/schemas/capsule/v0" as const;

/** Graded trust, L1 (unverified/sandbox) .. L7 (system/first-party). */
export type TrustLevel = "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";

/** "instant" = JS/WASM bundle run inside the host (no install). "native" = an installed APK. */
export type CapsuleKind = "instant" | "native";

/** Namespaced capability scope, e.g. "net.fetch", "wallet.spend". */
export type Capability = `${string}.${string}`;

export interface CapsuleRuntime {
  engine: "js" | "wasm";
  min?: string;
}

export interface CapsuleTrust {
  /** Minimum trust level the platform must grant for this capsule to run as intended. */
  minLevel: TrustLevel;
  /** DID/reference to (or embedded) OpenTrust passport. */
  passport: string;
  /** Signature over bundle hash + manifest. null only for dev/unsigned capsules. */
  signature?: string | null;
  publisherKey?: string | null;
}

export interface CapsuleSource {
  repo?: string | null;
  /** Capsule id this was forked from, if any. Powers the fork graph. */
  fork_of?: string | null;
  license: string;
}

export interface CapsuleUI {
  icon?: string | null;
  screenshots?: string[];
  demo?: string | null;
}

export interface CapsuleManifest {
  schema: typeof CAPSULE_SCHEMA_ID;
  /** Capsule id within the publisher namespace. */
  name: string;
  /** Semantic version. */
  version: string;
  title: string;
  description?: string;
  kind: CapsuleKind;
  /** instant: bundle entry file. native: null/omitted. */
  entry?: string | null;
  /** native: path/ref to APK. instant: null/omitted. */
  apk?: string | null;
  /** instant only. */
  runtime?: CapsuleRuntime;
  /** Capability scopes REQUESTED (not granted — the TrustManager decides). */
  capabilities: Capability[];
  trust: CapsuleTrust;
  source: CapsuleSource;
  ui?: CapsuleUI;
}

/** Ordered so we can compare trust levels numerically. */
const TRUST_ORDER: TrustLevel[] = ["L1", "L2", "L3", "L4", "L5", "L6", "L7"];

/** Returns true if `have` meets or exceeds `need`. */
export function meetsTrust(have: TrustLevel, need: TrustLevel): boolean {
  return TRUST_ORDER.indexOf(have) >= TRUST_ORDER.indexOf(need);
}

/**
 * Validate a manifest object against capsule.schema.json using Ajv.
 *
 * Kept dependency-light and lazy so consumers that only need the TYPES don't pay
 * for Ajv. Returns { valid, errors }.
 */
export async function validateManifest(
  manifest: unknown
): Promise<{ valid: boolean; errors: string[] }> {
  const [{ default: Ajv }, schemaMod] = await Promise.all([
    import("ajv"),
    import("../capsule.schema.json", { assert: { type: "json" } } as ImportCallOptions).catch(
      () => null
    ),
  ]);

  // Resolve schema from the package file regardless of bundler JSON-assert support.
  const schema =
    (schemaMod as { default?: object } | null)?.default ??
    (await loadSchemaFromDisk());

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema as object);
  const valid = validate(manifest) as boolean;
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || "(root)"} ${e.message ?? "invalid"}`
  );
  return { valid, errors };
}

async function loadSchemaFromDisk(): Promise<object> {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const here = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.resolve(here, "..", "capsule.schema.json");
  return JSON.parse(await readFile(schemaPath, "utf8"));
}
