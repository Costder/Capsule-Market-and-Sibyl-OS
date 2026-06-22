// Host side of the capsule runtime bridge.
//
// A capsule (guest) runs sandboxed (in a WebView). It can't touch the device
// directly — it sends RPC messages, and the host enforces the capability gate
// (from @sibyl/trust) before executing each one. This is the choke point that
// makes running untrusted capsule code safe.

/** @typedef {{t:"capsule-rpc", id:string|number, cap?:string, method:string, args?:any}} RpcRequest */

function response(id, ok, result, error) {
  return { t: "capsule-rpc-res", id, ok, result: ok ? result : undefined, error: ok ? undefined : error };
}

/**
 * Create a host-side message handler.
 * @param {Object} cfg
 * @param {string[]} cfg.granted      Capabilities actually granted (from trust.grantedCapabilities).
 * @param {boolean} [cfg.killSwitch]  When true, every guarded call is denied.
 * @param {Record<string, (args:any, ctx:{cap?:string})=>any>} cfg.handlers
 *        Method implementations. Each method that touches a guarded resource
 *        should be invoked by the guest with the matching `cap`.
 * @returns {(req:RpcRequest)=>Promise<object|null>}
 */
export function createHostBridge({ granted = [], killSwitch = false, handlers = {} }) {
  return async function handle(req) {
    if (!req || req.t !== "capsule-rpc") return null;
    const { id, cap, method } = req;
    if (killSwitch) return response(id, false, null, "kill switch active");
    if (cap && !granted.includes(cap)) {
      return response(id, false, null, `capability not granted: ${cap}`);
    }
    const fn = handlers[method];
    if (typeof fn !== "function") {
      return response(id, false, null, `unknown method: ${method}`);
    }
    try {
      const result = await fn(req.args, { cap });
      return response(id, true, result);
    } catch (e) {
      return response(id, false, null, String((e && e.message) || e));
    }
  };
}

// Which capability each built-in guest method requires. The host wires these so
// the gate is enforced even if a capsule lies about `cap`.
export const METHOD_CAPABILITY = {
  "storage.get": "storage.local",
  "storage.set": "storage.local",
  "net.fetch": "net.fetch",
  "notify": "notifications.post",
  "ui.render": null, // rendering inside the sandbox needs no capability
};
