# @sibyl/capsule-spec

The **Capsule manifest** format — the keystone contract of Capsule Market / Sibyl OS. The registry
indexes it, the runtime executes it, the TrustManager gates on it.

This package ships three things that must stay in lockstep:

| File | What |
|---|---|
| `capsule.schema.json` | The machine-readable contract (JSON Schema draft-07). Source of truth. |
| `src/manifest.ts` | TypeScript types + helpers (`meetsTrust`, `validateManifest`). |
| `examples/hello-capsule/` | The smallest valid instant capsule (`capsule.json` + `index.js`). |

## Use

```bash
npm install
npm run build      # tsc -> dist/
npm test           # validates the example + edge cases against the schema (needs ajv)
```

```ts
import { validateManifest, meetsTrust, type CapsuleManifest } from "@sibyl/capsule-spec";

const { valid, errors } = await validateManifest(someJson);
if (!valid) throw new Error(errors.join("\n"));

// TrustManager-style check:
const granted = meetsTrust(/* have */ "L4", /* need */ "L2"); // true
```

## Design rules

- **`schema` is pinned in every manifest** so the capability vocabulary can grow without breaking
  older capsules. Bump it deliberately and document migrations.
- **`capabilities` are requests, not grants.** The schema validates *shape*; whether a capability is
  actually granted is a TrustManager runtime decision based on trust level. See
  [`../../docs/OPENTRUST_INTEGRATION.md`](../../docs/OPENTRUST_INTEGRATION.md).
- **`kind` drives conditional requirements**: `instant` needs `entry` + `runtime`; `native` needs `apk`.
- **`source.fork_of`** records lineage so the marketplace can render a fork graph.

Full prose spec: [`../../docs/CAPSULE_SPEC.md`](../../docs/CAPSULE_SPEC.md).
