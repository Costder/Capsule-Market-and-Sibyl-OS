# @sibyl/capsule-registry ✅

The "npm for mobile" backend + the `capsule` CLI. **Zero external dependencies**
(Node `http` + filesystem; reuses `@sibyl/trust` by relative import). Verified
end-to-end, including tamper rejection.

## Server
```bash
node src/server.mjs            # PORT=4173, STORE=./store by default
```
- `POST /capsules` — **verifies the passport against the uploaded bytes**; rejects
  with 403 on signature/hash mismatch. Only then does it host the capsule.
- `GET /capsules/:id` · `GET /capsules/:id/bundle` · `GET /c/:id` (scan-to-run QR page) · `GET /`

## CLI
```bash
node src/cli.mjs keygen                                   # ed25519 identity → ~/.capsule/identity.json
node src/cli.mjs init ./my-capsule --name my-capsule
node src/cli.mjs sign ./my-capsule --level L2
node src/cli.mjs publish ./my-capsule --registry http://localhost:4173
```
(When installed via workspaces, this is just `capsule <cmd>`.)

The registry being unable to host a capsule whose passport doesn't verify is the
point: **identity is the price of distribution**, enforced without a central ID gate.
