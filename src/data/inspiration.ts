import vintageW from "@/assets/inspo-vintage-w.jpg";
import vintageM from "@/assets/inspo-vintage-m.jpg";
import oldmoneyW from "@/assets/inspo-oldmoney-w.jpg";
import oldmoneyM from "@/assets/inspo-oldmoney-m.jpg";
import classiqueW from "@/assets/inspo-classique-w.jpg";
import classiqueM from "@/assets/inspo-classique-m.jpg";
import sobreW from "@/assets/inspo-sobre-w.jpg";
import sobreM from "@/assets/inspo-sobre-m.jpg";
import sportW from "@/assets/inspo-sport-w.jpg";
import sportM from "@/assets/inspo-sport-m.jpg";
import streetW from "@/assets/inspo-street-w.jpg";
import streetM from "@/assets/inspo-street-m.jpg";
import type { StyleTag } from "@/lib/types";

export interface InspoLook {
  id: string;
  image: string;
  style: StyleTag;
  title: string;
  mood: string;
  gender: "F" | "M";
}

export const ALL_STYLES: StyleTag[] = [
  "Vintage", "Old Money", "Classique", "Sobre", "Sport", "Streetwear",
];

// Image phare par style (utilisée comme fallback)
export const STYLE_IMAGE: Record<StyleTag, string> = {
  "Vintage": vintageW,
  "Old Money": oldmoneyW,
  "Classique": classiqueW,
  "Sobre": sobreW,
  "Sport": sportW,
  "Streetwear": streetW,
};

// 2 looks par style (femme + homme) = 12 looks au total.
const PAIRS: Record<StyleTag, { f: string; m: string; titleF: string; titleM: string; mood: string }> = {
  "Vintage":    { f: vintageW,   m: vintageM,   titleF: "Friperie 70's",     titleM: "Velours rétro",      mood: "Chill" },
  "Old Money":  { f: oldmoneyW,  m: oldmoneyM,  titleF: "Cashmere & Loafers", titleM: "Polo Club",          mood: "Raffiné" },
  "Classique":  { f: classiqueW, m: classiqueM, titleF: "Trench beige",       titleM: "Costume marine",     mood: "Confiant" },
  "Sobre":      { f: sobreW,     m: sobreM,     titleF: "Lin écru",           titleM: "Maille douce",       mood: "Pur" },
  "Sport":      { f: sportW,     m: sportM,     titleF: "Tech fleece",        titleM: "Hoodie & Joggers",   mood: "Énergique" },
  "Streetwear": { f: streetW,    m: streetM,    titleF: "Hoodie oversize",    titleM: "Cargo & Hoodie",     mood: "Cool" },
};

export const INSPIRATION: InspoLook[] = ALL_STYLES.flatMap((style) => {
  const p = PAIRS[style];
  const slug = style.toLowerCase().replace(/[^a-z]/g, "");
  return [
    { id: `${slug}-f`, image: p.f, style, title: p.titleF, mood: p.mood, gender: "F" as const },
    { id: `${slug}-m`, image: p.m, style, title: p.titleM, mood: p.mood, gender: "M" as const },
  ];
});
