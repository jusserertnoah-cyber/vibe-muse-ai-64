import { getProfile } from "./profile";

export type Tier = "free" | "premium";

export const getTier = (): Tier => {
  const p = getProfile();
  if (!p?.premiumUntil) return "free";
  return new Date(p.premiumUntil) > new Date() ? "premium" : "free";
};

export const isPremium = () => getTier() === "premium";
