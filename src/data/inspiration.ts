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
const STYLE_IMAGE: Record<StyleTag, string> = {
  "Old Money": oldMoney,
  "Streetwear": streetwear,
  "Gorpcore": gorpcore,
  "Minimalisme": minimalism,
  "Y2K": y2k,
  "Dark Academia": darkAcademia,
  "Blokecore": streetwear,
  "Cyber-Y2K": y2k,
  "Modern Gothic": darkAcademia,
  "Clean Fit": minimalism,
};

const TITLES: Record<StyleTag, string[]> = {
  "Old Money": ["Cashmere & Loafers", "Quiet Luxury", "Polo Club", "Riviera"],
  "Streetwear": ["Cargo & Hoodie", "Urban Layers", "Box Logo", "Skate Era"],
  "Gorpcore": ["Shell Jacket", "Tech Fleece", "Trail Mix", "Summit Ready"],
  "Minimalisme": ["White & Black", "Monochrome", "Soft Tailoring", "Off-Duty"],
  "Y2K": ["Low-Rise Denim", "Butterfly Era", "Mesh Top", "Velour"],
  "Dark Academia": ["Tweed & Pleats", "Library Mood", "Oxford Walks", "Autumn Tome"],
  "Blokecore": ["Footy Shirt", "Track Top", "Terrace Casual", "Old Trafford"],
  "Cyber-Y2K": ["Chrome Vibe", "Matrix Coat", "Tokyo Glow", "Holographic"],
  "Modern Gothic": ["Black Drape", "Crucifix Layers", "Veil Coat", "Onyx Suit"],
  "Clean Fit": ["Crisp Tee", "Pleated Trouser", "Sneakers Fresh", "Sunday Linen"],
};

const MOODS = ["Confiant", "Mystérieux", "Chill", "Power", "Raffiné", "Audacieux", "Pur", "Cool"];

const ALL_STYLES: StyleTag[] = [
  "Old Money", "Streetwear", "Gorpcore", "Minimalisme",
  "Y2K", "Dark Academia", "Blokecore", "Cyber-Y2K",
  "Modern Gothic", "Clean Fit",
];

// Génère 500 slots — placeholders en attendant la génération IA serveur.
export const INSPIRATION: InspoLook[] = Array.from({ length: 500 }, (_, i) => {
  const style = ALL_STYLES[i % ALL_STYLES.length];
  const titles = TITLES[style];
  return {
    id: `${style.toLowerCase().replace(/[^a-z]/g, "")}-${i}`,
    image: STYLE_IMAGE[style],
    style,
    title: titles[i % titles.length],
    mood: MOODS[i % MOODS.length],
  };
});