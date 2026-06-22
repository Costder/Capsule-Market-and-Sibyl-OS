# capsule-registry  ▢ (Phase 1)

The **"npm for mobile"**: the backend that stores Capsules and serves them by QR/deep-link, plus the
CLI that makes publishing as easy as `npm publish`.

## What to build

**Backend**
- Store signed capsule bundles (content-addressed) + index their manifests.
- Resolve a capsule by id/version → manifest + bundle URL.
- Issue QR/deep-links that the `capsule-runtime` host can open.
- Verify passport + signature on publish (reject unsigned outside dev).
- Track `source.fork_of` to expose a **fork graph** (GitHub-network style).

**CLI**
```
capsule publish        # package, sign, push a capsule to the registry
capsule install <id>   # fetch a capsule (or print its QR)
capsule fork <id>      # clone a capsule's source, set source.fork_of, ready to edit + republish
```

## Fork / study

- **[npm](https://docs.npmjs.com/cli)** — registry + CLI UX to emulate (`publish`, semver, scopes).
- **[F-Droid](https://f-droid.org/docs/)** — open repo format, **reproducible builds**, and app
  signing. The gold standard for an *open* app repository.
- **[Termux](https://termux.dev)** — patterns for fetching + running packages on Android.

## Depends on

- `@sibyl/capsule-spec` — manifests are the index records.
- `@sibyl/trust` — publish-time passport/signature verification.

## Open questions

- Hosting model: centralized index first; federate/decentralize later?
- Namespacing + publisher identity (ties to OpenTrust passports).
- Moderation vs. openness — trust levels do most of the work, but define the floor.
