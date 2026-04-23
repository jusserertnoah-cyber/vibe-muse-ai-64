const KEY_LAST = "vibe.story.lastAt.v1";
const KEY_RECENT = "vibe.story.recent.v1"; // last 5 base64 (downscaled)

export const getLastShareAt = (): number => {
  const v = localStorage.getItem(KEY_LAST);
  return v ? parseInt(v, 10) : 0;
};

export const canSubmitStory = (): { ok: boolean; remainingMs: number } => {
  const last = getLastShareAt();
  const elapsed = Date.now() - last;
  const wait = 24 * 60 * 60 * 1000;
  if (elapsed >= wait) return { ok: true, remainingMs: 0 };
  return { ok: false, remainingMs: wait - elapsed };
};

export const markShareNow = () => {
  localStorage.setItem(KEY_LAST, String(Date.now()));
};

export const getRecentStoryImages = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY_RECENT);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
};

export const pushRecentStoryImage = (b64: string) => {
  const list = getRecentStoryImages();
  list.unshift(b64);
  localStorage.setItem(KEY_RECENT, JSON.stringify(list.slice(0, 5)));
};

/** Downscale image to ~512px JPEG base64 (under data URL form). */
export const fileToDownscaledDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 512;
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const formatRemaining = (ms: number): string => {
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};