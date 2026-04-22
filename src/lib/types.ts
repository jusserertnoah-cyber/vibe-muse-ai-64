export type Gender = "femme" | "homme" | "unisexe";
export type Morphology = "A" | "V" | "H" | "X" | "O";
export type StyleTag =
  | "Old Money"
  | "Streetwear"
  | "Gorpcore"
  | "Minimalisme"
  | "Y2K"
  | "Dark Academia";

export interface UserProfile {
  firstName: string;
  gender: Gender;
  morphology: Morphology;
  styles: StyleTag[];
  city?: string;
  closet: string[];
  vibers: number;
  premiumUntil?: string;
  deviceId?: string;
  createdAt: string;
}