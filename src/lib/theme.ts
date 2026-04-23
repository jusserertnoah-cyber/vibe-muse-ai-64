const KEY = "vibe.theme.v1";

export type ThemeName = "lime" | "mauve" | "mono";
export const THEMES: { id: ThemeName; label: string; swatch: string }[] = [
  { id: "lime",  label: "Lime",        swatch: "hsl(71 100% 50%)" },
  { id: "mauve", label: "Mauve rosé",  swatch: "hsl(320 55% 78%)" },
  { id: "mono",  label: "Noir & blanc", swatch: "hsl(30 10% 12%)" },
];

import { getProfile } from "./profile";

/** Theme effectivement appliqué : préférence utilisateur > déduction du genre. */
export const resolveTheme = (): ThemeName => {
  const saved = (localStorage.getItem(KEY) as ThemeName | null) ?? null;
  if (saved && ["lime", "mauve", "mono"].includes(saved)) return saved;
  const p = getProfile();
  if (p?.gender === "femme" || p?.gender === "unisexe") return "mauve";
  return "lime";
};

export const getSavedTheme = (): ThemeName | null => {
  const v = localStorage.getItem(KEY);
  return v === "lime" || v === "mauve" || v === "mono" ? v : null;
};

export const setTheme = (t: ThemeName) => {
  localStorage.setItem(KEY, t);
  applyTheme();
};

export const clearThemeOverride = () => {
  localStorage.removeItem(KEY);
  applyTheme();
};

export const applyTheme = () => {
  const root = document.documentElement;
  root.classList.remove("theme-mauve", "theme-mono");
  const t = resolveTheme();
  if (t === "mauve") root.classList.add("theme-mauve");
  else if (t === "mono") root.classList.add("theme-mono");
  // 'lime' = no class (default)
  try { window.dispatchEvent(new CustomEvent("vibe:theme-changed", { detail: t })); } catch {}
};