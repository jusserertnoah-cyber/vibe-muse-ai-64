import { UserProfile } from "./types";
import { supabase } from "@/integrations/supabase/client";

const KEY = "vibe.profile.v1";

const toNullableNumber = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const syncProfileToDb = async (userId: string, profile: UserProfile) => {
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    first_name: profile.firstName || "Vibe",
    gender: profile.gender || "unisexe",
    age: toNullableNumber(profile.age),
    height: toNullableNumber(profile.heightCm),
    weight: toNullableNumber(profile.weightKg),
    styles: profile.styles ?? [],
    closet: profile.closet ?? [],
    onboarded: true,
  }, { onConflict: "id" });

  if (error) throw error;
};

const syncCurrentProfileInBackground = (profile: UserProfile) => {
  supabase.auth.getSession().then(({ data }) => {
    const userId = data.session?.user?.id;
    if (!userId) return;
    void syncProfileToDb(userId, profile).catch(() => {});
  }).catch(() => {});
};

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
  syncCurrentProfileInBackground(p);
  try { window.dispatchEvent(new CustomEvent("vibe:profile-changed")); } catch {}
};

export const updateProfile = (patch: Partial<UserProfile>) => {
  const current = getProfile();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveProfile(next);
  return next;
};

export const clearProfile = () => {
  localStorage.removeItem(KEY);
  try { window.dispatchEvent(new CustomEvent("vibe:profile-changed")); } catch {}
};

/**
 * Hydrate the local profile from the Supabase `profiles` row for the given user.
 * Returns the local profile if the remote row is marked as onboarded, otherwise null.
 * This lets a returning user (new device / cleared cache) skip the onboarding.
 */
export const hydrateProfileFromDb = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, gender, age, height, weight, styles, vibers, onboarded, premium_until")
      .eq("id", userId)
      .maybeSingle();
    if (error || !data || !data.onboarded) return null;
    const existing = getProfile();
    const profile: UserProfile = {
      firstName: data.first_name || existing?.firstName || "Vibe",
      gender: (data.gender as UserProfile["gender"]) || existing?.gender || "unisexe",
      age: data.age ?? existing?.age,
      heightCm: data.height ?? existing?.heightCm,
      weightKg: data.weight ?? existing?.weightKg,
      styles: (data.styles as UserProfile["styles"]) ?? existing?.styles ?? [],
      city: existing?.city,
      referencePhoto: existing?.referencePhoto,
      closet: existing?.closet ?? [],
      vibers: data.vibers ?? existing?.vibers ?? 0,
      premiumUntil: data.premium_until ?? existing?.premiumUntil,
      deviceId: existing?.deviceId,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveProfile(profile);
    return profile;
  } catch {
    return null;
  }
};