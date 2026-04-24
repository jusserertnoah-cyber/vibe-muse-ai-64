import { getProfile, updateProfile } from "./profile";

// 1 crédit = 1 Viber (synchronisé avec l'affichage Home).
export const getCredits = (): number => getProfile()?.vibers ?? 0;

export const hasCredits = (n = 1): boolean => getCredits() >= n;

/** Consomme `n` crédits. Retourne true si OK, false si solde insuffisant. */
export const consumeCredits = (n = 1): boolean => {
  const profile = getProfile();
  if (!profile) return false;
  const current = profile.vibers ?? 0;
  if (current < n) return false;
  updateProfile({ vibers: current - n });
  return true;
};
