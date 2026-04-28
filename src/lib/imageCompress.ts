/**
 * Compresse une image (File ou dataURL) en JPEG ~1024px max, qualité 0.82.
 * But : limiter le payload envoyé aux APIs vision (Mistral / Lovable AI) et
 * éviter les rate-limits / timeouts.
 */
const DEFAULT_MAX = 1024;
const DEFAULT_QUALITY = 0.82;

export const compressImageFile = (
  file: File,
  maxSize = DEFAULT_MAX,
  quality = DEFAULT_QUALITY,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => compressDataUrl(reader.result as string, maxSize, quality).then(resolve, reject);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const compressDataUrl = (
  src: string,
  maxSize = DEFAULT_MAX,
  quality = DEFAULT_QUALITY,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no_canvas_ctx"));
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = src;
  });