import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { CameraView, useCameraPermissions } from "expo-camera";
import { WebView } from "react-native-webview";
import { createHostBridge, guestBootstrapSource } from "@sibyl/capsule-runtime";

import { resolveCapsule, parseScan, ResolvedCapsule } from "./src/lib/capsule";
import { capStore, addRecent, getRecents, Recent } from "./src/lib/store";

const C = {
  bg: "#0b0f1a", card: "#121829", line: "#25304d", text: "#e8ecf5",
  dim: "#8a96b3", accent: "#3b82f6", good: "#34d399", bad: "#f87171",
};

export default function App() {
  const [capsule, setCapsule] = useState<ResolvedCapsule | null>(null);
  if (capsule) return <Runner capsule={capsule} onExit={() => setCapsule(null)} />;
  return <Home onLaunch={setCapsule} />;
}

function Home({ onLaunch }: { onLaunch: (c: ResolvedCapsule) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [recents, setRecents] = useState<Recent[]>([]);

  useEffect(() => { getRecents().then(setRecents); }, []);

  async function launch(src: string) {
    setBusy(true); setScanning(false);
    try {
      const c = await resolveCapsule(src);
      if (!c.verification.valid) {
        Alert.alert("Untrusted capsule", `Refusing to run: ${c.verification.reason}`);
        return;
      }
      await addRecent({ id: c.id, title: c.manifest.title || c.manifest.name, src, at: Date.now() });
      onLaunch(c);
    } catch (e: any) {
      Alert.alert("Could not load capsule", String(e?.message || e));
    } finally { setBusy(false); }
  }

  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <Text style={s.h1}>Capsule</Text>
      <Text style={s.sub}>Scan a QR or paste a link to run a passport-verified capsule.</Text>

      {scanning ? (
        <View style={s.scanner}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
              const src = parseScan(data);
              if (src) launch(src);
              else Alert.alert("Not a capsule code", data);
            }}
          />
          <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setScanning(false)}>
            <Text style={s.btnGhostText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={s.btn}
          onPress={async () => {
            if (!permission?.granted) { const p = await requestPermission(); if (!p.granted) return; }
            setScanning(true);
          }}
        >
          <Text style={s.btnText}>Scan QR</Text>
        </TouchableOpacity>
      )}

      <Text style={s.label}>…or paste a capsule resolve URL</Text>
      <TextInput
        style={s.input} placeholder="http://192.168.x.x:4173/capsules/hello-capsule@0.1.0"
        placeholderTextColor={C.dim} autoCapitalize="none" autoCorrect={false}
        value={url} onChangeText={setUrl}
      />
      <TouchableOpacity style={[s.btn, s.btnGhost]} disabled={!url || busy} onPress={() => launch(url.trim())}>
        {busy ? <ActivityIndicator color={C.text} /> : <Text style={s.btnGhostText}>Open link</Text>}
      </TouchableOpacity>

      <Text style={s.label}>Recent</Text>
      <ScrollView style={{ flex: 1 }}>
        {recents.length === 0 && <Text style={s.dim}>Nothing yet.</Text>}
        {recents.map((r) => (
          <TouchableOpacity key={r.id} style={s.recent} onPress={() => launch(r.src)}>
            <Text style={s.recentTitle}>{r.title}</Text>
            <Text style={s.dim}>{r.id}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function Runner({ capsule, onExit }: { capsule: ResolvedCapsule; onExit: () => void }) {
  const webRef = useRef<WebView>(null);
  const store = useMemo(() => capStore(capsule.id), [capsule.id]);

  const bridge = useMemo(
    () =>
      createHostBridge({
        granted: capsule.granted,
        killSwitch: false,
        handlers: {
          "storage.get": ({ key }: any) => store.get(key),
          "storage.set": ({ key, value }: any) => store.set(key, value),
          "net.fetch": async ({ url, opts }: any) => {
            const r = await fetch(url, opts);
            return { status: r.status, body: await r.text() };
          },
          "notify": ({ title, body }: any) => { Alert.alert(title || "Capsule", body || ""); return true; },
          "ui.render": () => true,
        },
      }),
    [capsule.id, capsule.granted, store]
  );

  async function onMessage(e: any) {
    let req: any;
    try { req = JSON.parse(e.nativeEvent.data); } catch { return; }
    const res = await bridge(req);
    if (res) {
      const payload = JSON.stringify(JSON.stringify(res));
      webRef.current?.injectJavaScript(
        `(function(){var ev=new MessageEvent('message',{data:${payload}});window.dispatchEvent(ev);document.dispatchEvent(ev);})();true;`
      );
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <View style={s.bar}>
        <TouchableOpacity onPress={onExit}><Text style={s.back}>‹ Exit</Text></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.barTitle} numberOfLines={1}>{capsule.manifest.title || capsule.manifest.name}</Text>
          <Text style={s.barSub} numberOfLines={1}>
            {capsule.passport.publisher} · <Text style={{ color: C.good }}>verified</Text> · {capsule.level} ·{" "}
            {capsule.granted.length ? capsule.granted.join(", ") : "no capabilities"}
          </Text>
        </View>
      </View>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: capsule.html }}
        injectedJavaScriptBeforeContentLoaded={guestBootstrapSource(JSON.stringify(capsule.manifest))}
        onMessage={onMessage}
        style={{ flex: 1, backgroundColor: "#fff" }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 64 },
  h1: { color: C.text, fontSize: 34, fontWeight: "800" },
  sub: { color: C.dim, marginTop: 6, marginBottom: 20 },
  label: { color: C.dim, marginTop: 22, marginBottom: 8, fontWeight: "600" },
  dim: { color: C.dim },
  btn: { backgroundColor: C.accent, padding: 16, borderRadius: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1, borderColor: C.line, marginTop: 10 },
  btnGhostText: { color: C.text, fontWeight: "600" },
  input: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 12, color: C.text, padding: 14 },
  scanner: { height: 320, borderRadius: 16, overflow: "hidden", backgroundColor: "#000" },
  recent: { backgroundColor: C.card, borderColor: C.line, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  recentTitle: { color: C.text, fontWeight: "700", fontSize: 16 },
  bar: { flexDirection: "row", alignItems: "center", paddingTop: 52, paddingBottom: 12, paddingHorizontal: 14, backgroundColor: C.card, borderBottomColor: C.line, borderBottomWidth: 1, gap: 12 },
  back: { color: C.accent, fontSize: 16, fontWeight: "600" },
  barTitle: { color: C.text, fontWeight: "700" },
  barSub: { color: C.dim, fontSize: 12 },
});
