export type Gender = "femme" | "homme" | "unisexe";
export type StyleTag =
  | "Vintage"
  | "Old Money"
  | "Classique"
  | "Sobre"
  | "Sport"
  | "Streetwear";

export type Mood =
  | "Confiant" | "Chill" | "Mystérieux" | "Bad Boy/Girl" | "Énervé"
  | "Romantique" | "Pro" | "Créatif" | "Énergique" | "Discret";

export type Occasion =
  | "Date Night" | "Premier Date" | "Travail/Entretien" | "Sortie Potes"
  | "Soirée Club" | "Sport/Gym" | "Mariage/Fête" | "Chill Maison"
  | "Voyage/Aéroport" | "Shooting Photo";

export interface UserProfile {
  firstName: string;
  email?: string;
  gender: Gender;
  heightCm?: number;
  weightKg?: number;
  styles: StyleTag[];
  city?: string;
  referencePhoto?: string; // data URL — virtual try-on base
  closet: string[];
  vibers: number;
  premiumUntil?: string;
  deviceId?: string;
  createdAt: string;
}