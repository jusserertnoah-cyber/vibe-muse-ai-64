import { getProfile, updateProfile } from "./profile";
import { toast } from "sonner";

export type VibersReason = "scan" | "look" | "closet" | "onboarding";

export const VIBERS_REWARDS: Record<VibersReason, number> = {
  scan: 10,
  look: 15,
  closet: 5,
  onboarding: 20,
};

const LABELS: Record<VibersReason, string> = {
  scan: "Vibe Check analysé",
  look: "Tenue générée",
  closet: "Pièce ajoutée au dressing",
  onboarding: "Bienvenue dans Vibe",
};

const DAILY_KEY = "vibe.vibers.daily.v1";
const HISTORY_KEY = "vibe.vibers.history.v1";

interface VibersEntry {
  reason: VibersReason;
  delta: number;
  at: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const getDailyCount = (reason: VibersReason): number => {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (data.date !== today()) return 0;
    return data.counts?.[reason] ?? 0;
  } catch { return 0; }
};

const bumpDaily = (reason: VibersReason) => {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    let data = raw ? JSON.parse(raw) : { date: today(), counts: {} };
    if (data.date !== today()) data = { date: today(), counts: {} };
    data.counts[reason] = (data.counts[reason] ?? 0) + 1;
    localStorage.setItem(DAILY_KEY, JSON.stringify(data));
  } catch {}
};

// Cap quotidien anti-farm
const DAILY_CAPS: Record<VibersReason, number> = {
  scan: 5,
  look: 5,
  closet: 10,
  onboarding: 1,
};

export const getVibersHistory = (): VibersEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const pushHistory = (entry: VibersEntry) => {
  const list = getVibersHistory();
  list.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)));
};

export const awardVibers = (reason: VibersReason, opts?: { silent?: boolean }) => {
  const profile = getProfile();
  if (!profile) return null;

  if (getDailyCount(reason) >= DAILY_CAPS[reason]) {
    return { awarded: 0, total: profile.vibers, capped: true };
  }

  const delta = VIBERS_REWARDS[reason];
  const prev = profile.vibers ?? 0;
  const next = prev + delta;
  updateProfile({ vibers: next });
  bumpDaily(reason);
  pushHistory({ reason, delta, at: new Date().toISOString() });

  if (!opts?.silent) {
    toast.success(`+${delta} Vibers · ${LABELS[reason]}`, {
      description: `Total : ${next}/200`,
    });
  }

  // Premium offert au passage des 200
  if (prev < 200 && next >= 200) {
    const oneMonth = new Date();
    oneMonth.setMonth(oneMonth.getMonth() + 1);
    updateProfile({ premiumUntil: oneMonth.toISOString() });
    toast.success("🎉 Bravo ! 1 mois Premium offert.", {
      description: "Profite de ton accès illimité.",
    });
  }

  return { awarded: delta, total: next, capped: false };
};
