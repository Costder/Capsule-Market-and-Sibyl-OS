// The smallest possible instant capsule.
//
// In a real instant capsule this entry module is loaded and executed by the
// Capsule runtime host (the Expo-Go-style runner). The host injects a `capsule`
// API object whose surface is bounded by the capabilities the TrustManager
// actually granted (here: only "storage.local").
//
// For now this is illustrative — the host API is defined as the runtime PoC is built.

export default function main(capsule) {
  const name = (capsule && capsule.env && capsule.env.user) || "world";

  // Allowed: this capsule requested and was granted "storage.local".
  if (capsule && capsule.storage) {
    const runs = Number(capsule.storage.get("runs") || 0) + 1;
    capsule.storage.set("runs", String(runs));
    capsule.ui.text(`Hello, ${name}! (run #${runs})`);
  } else {
    console.log(`Hello, ${name}!`);
  }

  // Would FAIL the TrustManager: this capsule did not request "net.fetch".
  //   capsule.net.fetch("https://example.com")  // -> denied at L1 without grant
}
