// Guest side: the `capsule` API injected into the sandboxed WebView.
//
// Exposes a tiny promise-based API to capsule code. Every call is forwarded to
// the host over postMessage; the host gates it and replies. The guest can never
// exceed its granted capabilities because it has no direct device access.

/**
 * Returns JS source to inject into the WebView before the capsule loads
 * (react-native-webview: injectedJavaScriptBeforeContentLoaded).
 * `manifestJson` lets the capsule read its own manifest via capsule.manifest.
 */
export function guestBootstrapSource(manifestJson = "null") {
  return `(function(){
  var seq = 0;
  var pending = {};
  function send(cap, method, args){
    return new Promise(function(resolve, reject){
      var id = ++seq;
      pending[id] = { resolve: resolve, reject: reject };
      var msg = { t: "capsule-rpc", id: id, cap: cap, method: method, args: args };
      (window.ReactNativeWebView ? window.ReactNativeWebView.postMessage(JSON.stringify(msg))
                                 : window.parent.postMessage(JSON.stringify(msg), "*"));
    });
  }
  function onMessage(ev){
    var data = ev && ev.data; if (typeof data !== "string") return;
    var res; try { res = JSON.parse(data); } catch(e){ return; }
    if (!res || res.t !== "capsule-rpc-res") return;
    var p = pending[res.id]; if (!p) return; delete pending[res.id];
    res.ok ? p.resolve(res.result) : p.reject(new Error(res.error || "denied"));
  }
  window.addEventListener("message", onMessage);
  document.addEventListener("message", onMessage); // RN Android delivers here

  window.capsule = {
    manifest: ${manifestJson},
    storage: {
      get: function(k){ return send("storage.local", "storage.get", { key: k }); },
      set: function(k, v){ return send("storage.local", "storage.set", { key: k, value: v }); }
    },
    net: {
      fetch: function(url, opts){ return send("net.fetch", "net.fetch", { url: url, opts: opts }); }
    },
    notify: function(title, body){ return send("notifications.post", "notify", { title: title, body: body }); },
    ui: {
      ready: function(){ return send(null, "ui.render", { ready: true }); }
    }
  };
  if (window.__capsuleMain) { try { window.__capsuleMain(window.capsule); } catch(e){ console.error(e); } }
})();`;
}
