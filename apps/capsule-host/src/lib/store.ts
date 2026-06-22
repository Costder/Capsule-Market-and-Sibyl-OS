import AsyncStorage from "@react-native-async-storage/async-storage";

const TRUST_KEY = "sibyl.trustStore";
const RECENTS_KEY = "sibyl.recents";

/** Local trust store: publisherKey -> effective level (L1..L7). */
export async function getTrustStore(): Promise<Record<string, string>> {
  const s = await AsyncStorage.getItem(TRUST_KEY);
  return s ? JSON.parse(s) : {};
}
export async function setTrustLevel(publisherKey: string, level: string) {
  const store = await getTrustStore();
  store[publisherKey] = level;
  await AsyncStorage.setItem(TRUST_KEY, JSON.stringify(store));
}

/** Per-capsule sandboxed key/value storage (backs the storage.local capability). */
export function capStore(id: string) {
  const k = (key: string) => `cap:${id}:${key}`;
  return {
    get: (key: string) => AsyncStorage.getItem(k(key)),
    set: async (key: string, value: string) => {
      await AsyncStorage.setItem(k(key), String(value));
      return true;
    },
  };
}

export type Recent = { id: string; title: string; src: string; at: number };
export async function getRecents(): Promise<Recent[]> {
  const s = await AsyncStorage.getItem(RECENTS_KEY);
  return s ? JSON.parse(s) : [];
}
export async function addRecent(entry: Recent) {
  const list = (await getRecents()).filter((r) => r.id !== entry.id);
  list.unshift(entry);
  await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, 20)));
}
