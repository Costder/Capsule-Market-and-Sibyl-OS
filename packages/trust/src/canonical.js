// Deterministic JSON canonicalization for signing.
// Stable across platforms: sorted object keys, undefined values dropped.
// Pure — no dependencies — so it runs identically in Node and React Native.

/**
 * @param {unknown} value
 * @returns {string} canonical JSON
 */
export function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") +
    "}"
  );
}
