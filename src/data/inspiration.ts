import oldMoney from "@/assets/inspo-old-money-1.jpg";
import streetwear from "@/assets/inspo-streetwear-1.jpg";
import gorpcore from "@/assets/inspo-gorpcore-1.jpg";
import minimalism from "@/assets/inspo-minimalism-1.jpg";
import y2k from "@/assets/inspo-y2k-1.jpg";
import darkAcademia from "@/assets/inspo-dark-academia-1.jpg";
import type { StyleTag } from "@/lib/types";

export interface InspoLook {
  id: string;
  image: string;
  style: StyleTag;
  title: string;
  mood: string;
}

// 10 styles rois — placeholders (les nouveaux styles réutilisent les visuels les plus proches en attendant la génération IA).
export const STYLE_IMAGE: Record<StyleTag, string> = {
  "Vintage": y2k,
  "Old Money": oldMoney,
  "Classique": darkAcademia,
  "Sobre": minimalism,
  "Sport": gorpcore,
  "Streetwear": streetwear,
};

const TITLES: Record<StyleTag, string[]> = {
  "Vintage": ["Friperie 70's", "Denim brut", "Veste suédée", "Rétro chic"],
  "Old Money": ["Cashmere & Loafers", "Quiet Luxury", "Polo Club", "Riviera"],
  "Classique": ["Tailleur intemporel", "Chemise blanche", "Trench beige", "Costume marine"],
  "Sobre": ["Monochrome", "Lin écru", "Tailoring doux", "Off-Duty"],
  "Sport": ["Tech fleece", "Coupe-vent", "Sneakers fresh", "Relax fit"],
  "Streetwear": ["Cargo & Hoodie", "Urban Layers", "Box Logo", "Skate Era"],
};

const MOODS = ["Confiant", "Mystérieux", "Chill", "Power", "Raffiné", "Audacieux", "Pur", "Cool"];

export const ALL_STYLES: StyleTag[] = [
  "Vintage", "Old Money", "Classique", "Sobre", "Sport", "Streetwear",
];

// 8 looks max par style — galerie épurée pour la performance.
const PER_STYLE = 8;
export const INSPIRATION: InspoLook[] = ALL_STYLES.flatMap((style) => {
  const titles = TITLES[style];
  return Array.from({ length: PER_STYLE }, (_, i) => ({
    id: `${style.toLowerCase().replace(/[^a-z]/g, "")}-${i}`,
    image: STYLE_IMAGE[style],
    style,
    title: titles[i % titles.length],
    mood: MOODS[i % MOODS.length],
  }));
});