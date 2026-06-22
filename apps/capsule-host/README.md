# capsule-host (Expo)

The on-device Capsule app: **scan a QR → verify the passport → run the capsule
sandboxed in a WebView, capability-gated.** Refuses to run anything whose passport
doesn't verify.

> Written by the cloud agent but **not yet run on a device** (it has no phone). This
> is the first thing to test at home. The trust/registry/CLI/runtime/MCP layers it
> depends on are already verified.

## Run it
```bash
# from the repo root (npm workspaces):
npm install
cd apps/capsule-host
npx expo install --check     # align expo-camera / webview / etc. to your SDK
npx expo start               # open in Expo Go or a dev build
```
Then start the registry on your laptop, publish a capsule, and scan its run-page QR
from the app. Put your laptop + phone on the same network and use the LAN IP in the
registry URL (e.g. `http://192.168.1.20:4173/...`).

## How it fits together
- `src/lib/capsule.ts` — `resolveCapsule()` fetches + verifies (`@noble/ed25519`) + computes grants; `parseScan()` reads `capsule://run?src=` or an https URL.
- `src/lib/trustClient.ts` — wraps `@sibyl/trust` **pure submodules** with the noble adapter (never the index, which needs Node crypto).
- `src/lib/store.ts` — AsyncStorage: trust store, per-capsule `storage.local`, recents.
- `App.tsx` — Home (scan / paste / recents) + Runner (WebView + `createHostBridge` gate + trust banner).

## Notes
- Monorepo resolution is handled by `metro.config.js` (watches the workspace root, enables package `exports`).
- Versions in `package.json` are a known-good Expo SDK 51 set; `npx expo install --check` will reconcile them to whatever SDK you have installed.
