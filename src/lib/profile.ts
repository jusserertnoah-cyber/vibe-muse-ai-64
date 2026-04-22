import { UserProfile } from "./types";

const KEY = "vibe.profile.v1";

export const getProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
};

export const saveProfile = (p: UserProfile) => {
  localStorage.setItem(KEY, JSON.stringify(p));
};

export const updateProfile = (patch: Partial<UserProfile>) => {
  const current = getProfile();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveProfile(next);
  return next;
};

export const clearProfile = () => localStorage.removeItem(KEY);