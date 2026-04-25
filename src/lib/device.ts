import FingerprintJS from "@fingerprintjs/fingerprintjs";

const STORAGE_KEY = "vibe.deviceId.v1";
let cached: string | null = null;
let pending: Promise<string> | null = null;

const fallbackId = (): string => {
  // Crypto-strong random fallback so we never block the UI on FingerprintJS.
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return "fb_" + Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "fb_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};

const readStored = (): string | null => {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
};
const writeStored = (v: string) => {
  try { localStorage.setItem(STORAGE_KEY, v); } catch {}
};

/**
 * Renvoie un identifiant stable pour l'appareil.
 * - Si on a déjà un id en cache/localStorage → retour immédiat (synchrone).
 * - Sinon, on tente FingerprintJS avec un timeout de 2s, sinon fallback random.
 * Cela évite que l'UI reste figée quand FingerprintJS est lent (téléphone, réseau bridé).
 */
export const getDeviceId = async (): Promise<string> => {
  if (cached) return cached;
  const stored = readStored();
  if (stored && stored.length >= 8) {
    cached = stored;
    return cached;
  }
  if (pending) return pending;
  pending = (async () => {
    const timeout = new Promise<string>((resolve) => setTimeout(() => resolve(fallbackId()), 2000));
    const fp = (async () => {
      try {
        const inst = await FingerprintJS.load();
        const r = await inst.get();
        return r.visitorId;
      } catch {
        return fallbackId();
      }
    })();
    const id = await Promise.race([fp, timeout]);
    cached = id;
    writeStored(id);
    return id;
  })();
  try {
    const id = await pending;
    return id;
  } finally {
    pending = null;
  }
};