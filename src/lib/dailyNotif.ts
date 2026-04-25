// Notification web quotidienne du défi à 7h locale.
// 100% client-side : on programme un setTimeout au prochain 7h, on tire la
// notif via `new Notification(...)`, puis on re-programme le lendemain.
// On évite les doublons via un marqueur en localStorage (date du jour).

import { audienceFromGender, getDailyChallenge } from "./challenges";
import { getProfile } from "./profile";

const KEY_LAST_FIRED = "vibe.dailyNotif.lastFiredYmd";
const KEY_OPTED_IN = "vibe.dailyNotif.optedIn";

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const next7am = (now = new Date()): Date => {
  const t = new Date(now);
  t.setHours(7, 0, 0, 0);
  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
  return t;
};

export const isNotifSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getNotifPermission = (): NotificationPermission =>
  isNotifSupported() ? Notification.permission : "denied";

export const isOptedIn = () =>
  isNotifSupported() &&
  Notification.permission === "granted" &&
  localStorage.getItem(KEY_OPTED_IN) === "1";

export const requestNotifPermission = async (): Promise<NotificationPermission> => {
  if (!isNotifSupported()) return "denied";
  const p = await Notification.requestPermission();
  if (p === "granted") localStorage.setItem(KEY_OPTED_IN, "1");
  return p;
};

const fireDailyChallengeNotif = () => {
  if (!isOptedIn()) return;
  const today = ymd(new Date());
  if (localStorage.getItem(KEY_LAST_FIRED) === today) return;
  const profile = getProfile();
  const c = getDailyChallenge(audienceFromGender(profile?.gender));
  try {
    new Notification("VIBE — Défi du jour", {
      body: `${c.name} — ${c.hint}`,
      icon: "/favicon.ico",
      tag: "vibe-daily-challenge",
    });
    localStorage.setItem(KEY_LAST_FIRED, today);
  } catch {
    /* navigateur restreint, on ignore */
  }
};

let timer: number | null = null;

const schedule = () => {
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
  }
  const now = new Date();
  // Si on est passé après 7h aujourd'hui et qu'on n'a pas encore fire → fire maintenant.
  const today7 = new Date(now);
  today7.setHours(7, 0, 0, 0);
  if (now.getTime() >= today7.getTime()) {
    fireDailyChallengeNotif();
  }
  // Programme le prochain 7h.
  const next = next7am(now);
  const ms = Math.max(1000, next.getTime() - now.getTime());
  timer = window.setTimeout(() => {
    fireDailyChallengeNotif();
    schedule();
  }, ms);
};

export const initDailyChallengeNotif = () => {
  if (!isOptedIn()) return;
  schedule();
  // Re-checke au focus (utile si l'onglet a été en veille).
  window.addEventListener("focus", schedule);
};