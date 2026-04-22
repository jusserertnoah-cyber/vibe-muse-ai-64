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

// Base catalog. Will be expanded server-side later.
export const INSPIRATION: InspoLook[] = [
  { id: "om-1", image: oldMoney, style: "Old Money", title: "Cashmere & Loafers", mood: "Élégant" },
  { id: "sw-1", image: streetwear, style: "Streetwear", title: "Cargo & Hoodie", mood: "Confiant" },
  { id: "gc-1", image: gorpcore, style: "Gorpcore", title: "Shell Jacket", mood: "Aventurier" },
  { id: "mn-1", image: minimalism, style: "Minimalisme", title: "White & Black", mood: "Pur" },
  { id: "y2-1", image: y2k, style: "Y2K", title: "Low-Rise Denim", mood: "Audacieux" },
  { id: "da-1", image: darkAcademia, style: "Dark Academia", title: "Tweed & Pleats", mood: "Mystérieux" },
  { id: "om-2", image: oldMoney, style: "Old Money", title: "Quiet Luxury", mood: "Raffiné" },
  { id: "sw-2", image: streetwear, style: "Streetwear", title: "Urban Layers", mood: "Cool" },
  { id: "gc-2", image: gorpcore, style: "Gorpcore", title: "Tech Fleece", mood: "Libre" },
  { id: "mn-2", image: minimalism, style: "Minimalisme", title: "Monochrome", mood: "Calme" },
  { id: "y2-2", image: y2k, style: "Y2K", title: "Butterfly Era", mood: "Playful" },
  { id: "da-2", image: darkAcademia, style: "Dark Academia", title: "Library Mood", mood: "Profond" },
];