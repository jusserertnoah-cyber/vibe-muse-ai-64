// Défis quotidiens unisexe — liste fixe rotative, déterministe par date.
// Aucun appel IA : on fait `liste[indexJour % N]`.

export interface DailyChallenge {
  id: string;
  name: string;       // Affiché dans le bandeau (court)
  hint: string;       // Petit conseil pour l'utilisateur
  detect: string;     // Description précise utilisée par l'IA pour détecter
  // Compatibilité météo. "any" = peu importe.
  // hot   : ≥ 22°C (pas de manteau / grosse maille)
  // cold  : ≤ 10°C (pas de robes courtes / sandales)
  // mild  : entre 10 et 22°C
  weather?: ("hot" | "mild" | "cold" | "any")[];
}

export type ChallengeAudience = "unisexe";

// Défis UNISEXE — uniquement des objets/pièces concrets et simples.
// Pas de concepts vagues type "layering 3 pièces" ou "tailoring".
export const CHALLENGES_UNISEX: DailyChallenge[] = [
  // === Accessoires (toute météo) ===
  { id: "red-touch",      name: "Une touche de rouge",   hint: "Un détail rouge visible (sac, écharpe, chaussettes, top…)", detect: "un élément clairement rouge (vêtement ou accessoire) visible sur la photo", weather: ["any"] },
  { id: "silver-acc",     name: "Bijou argenté",         hint: "Bijou, chaîne ou bracelet argenté bien visible",             detect: "au moins un bijou ou accessoire argenté visible", weather: ["any"] },
  { id: "gold-acc",       name: "Bijou doré",            hint: "Bijou, chaîne ou bracelet doré bien visible",                detect: "au moins un bijou ou accessoire doré visible", weather: ["any"] },
  { id: "watch",          name: "Une belle montre",      hint: "Montre visible au poignet",                                   detect: "une montre visible au poignet", weather: ["any"] },
  { id: "color-belt",     name: "Ceinture colorée",      hint: "Ceinture rouge, jaune, bleue ou verte bien visible",         detect: "une ceinture de couleur vive (rouge, jaune, bleue, verte) clairement visible", weather: ["any"] },
  { id: "white-sneaker",  name: "Sneakers blanches",     hint: "Une paire de sneakers blanches aux pieds",                   detect: "des sneakers blanches aux pieds", weather: ["any"] },
  { id: "white-shirt",    name: "Chemise blanche",       hint: "Une chemise blanche bien visible",                           detect: "une chemise blanche clairement visible", weather: ["any"] },
  { id: "denim",          name: "Pièce en jean",         hint: "Pantalon, jupe ou veste en jean",                            detect: "un vêtement en jean (denim) clairement visible", weather: ["any"] },
  { id: "bag",            name: "Sac à main",            hint: "Sac à main ou bandoulière",                                  detect: "un sac à main ou bandoulière clairement visible", weather: ["any"] },

  // === Chaud (≥ 22°C) ===
  { id: "sunglasses",     name: "Lunettes de soleil",    hint: "Lunettes de soleil portées",                                 detect: "des lunettes de soleil portées sur le visage ou sur la tête", weather: ["hot"] },
  { id: "shorts",         name: "Short ou bermuda",      hint: "Short, bermuda ou pantacourt",                               detect: "un short, bermuda ou pantacourt visible", weather: ["hot"] },
  { id: "cap",            name: "Casquette ou bob",      hint: "Casquette baseball, bob ou chapeau de paille",               detect: "une casquette, un bob ou un chapeau visible sur la tête", weather: ["hot", "mild"] },
  { id: "linen",          name: "Pièce en lin",          hint: "Chemise ou pantalon en lin",                                 detect: "un vêtement clairement en lin (chemise, pantalon, robe)", weather: ["hot"] },
  { id: "sandals",        name: "Sandales",              hint: "Sandales ou tongs aux pieds",                                detect: "des sandales ou tongs visibles aux pieds", weather: ["hot"] },
  { id: "tee-white",      name: "T-shirt blanc",         hint: "T-shirt blanc uni",                                          detect: "un t-shirt blanc uni clairement visible", weather: ["hot", "mild"] },

  // === Frais / Mi-saison (10–22°C) ===
  { id: "denim-jacket",   name: "Veste en jean",         hint: "Une veste en jean portée",                                   detect: "une veste en jean (trucker) clairement visible", weather: ["mild"] },
  { id: "blazer",         name: "Blazer",                hint: "Blazer ou veste de costume",                                 detect: "un blazer ou veste de costume clairement visible", weather: ["mild", "cold"] },
  { id: "leather-jacket", name: "Veste en cuir",         hint: "Veste en cuir noire ou marron",                              detect: "une veste en cuir clairement visible", weather: ["mild", "cold"] },
  { id: "hoodie",         name: "Hoodie / Sweat capuche", hint: "Sweat à capuche bien visible",                              detect: "un sweat à capuche (hoodie) clairement visible", weather: ["mild", "cold"] },
  { id: "cargo",          name: "Pantalon cargo",        hint: "Pantalon avec poches cargo",                                 detect: "un pantalon cargo (poches latérales visibles)", weather: ["mild", "cold"] },
  { id: "loafers",        name: "Mocassins",             hint: "Mocassins ou derbies en cuir",                               detect: "des mocassins ou derbies en cuir visibles", weather: ["mild", "cold"] },

  // === Froid (≤ 10°C) ===
  { id: "long-coat",      name: "Manteau long",          hint: "Manteau long descendant aux genoux",                         detect: "un manteau long (descendant au moins aux genoux) clairement visible", weather: ["cold"] },
  { id: "trench",         name: "Trench-coat",           hint: "Trench beige ou kaki",                                       detect: "un trench-coat clairement visible", weather: ["cold", "mild"] },
  { id: "scarf",          name: "Écharpe",               hint: "Écharpe visible autour du cou",                              detect: "une écharpe clairement visible autour du cou", weather: ["cold"] },
  { id: "knit-sweater",   name: "Pull en grosse maille", hint: "Pull tricoté épais",                                         detect: "un pull en grosse maille tricotée clairement visible", weather: ["cold"] },
  { id: "boots",          name: "Bottines",              hint: "Bottines en cuir aux pieds",                                 detect: "des bottines (boots, Chelsea) clairement visibles", weather: ["cold", "mild"] },
  { id: "beanie",         name: "Bonnet",                hint: "Bonnet sur la tête",                                         detect: "un bonnet clairement visible sur la tête", weather: ["cold"] },
  { id: "turtleneck",     name: "Col roulé",             hint: "Col roulé visible au cou",                                   detect: "un col roulé clairement visible au cou", weather: ["cold"] },
];

// Compat : alias historiques (ne plus utiliser).
export const CHALLENGES_MEN: DailyChallenge[] = CHALLENGES_UNISEX;
export const CHALLENGES_WOMEN: DailyChallenge[] = CHALLENGES_UNISEX;

// Compat : ancienne export (utilisée ailleurs si présent).
export const CHALLENGES = CHALLENGES_UNISEX;

// Index déterministe : nb jours depuis l'epoch.
function dayIndex(d = new Date()): number {
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(utc / 86400000);
}

export type WeatherBand = "hot" | "mild" | "cold";

export function bandFromTemp(tempC?: number | null): WeatherBand | null {
  if (typeof tempC !== "number" || Number.isNaN(tempC)) return null;
  if (tempC >= 22) return "hot";
  if (tempC <= 10) return "cold";
  return "mild";
}

export function getDailyChallenge(
  _audience: ChallengeAudience = "unisexe",
  date = new Date(),
  tempC?: number | null,
): DailyChallenge {
  const band = bandFromTemp(tempC);
  // Si météo connue : on filtre les défis compatibles (any + bande courante).
  // Sinon : tout le pool.
  const pool = band
    ? CHALLENGES_UNISEX.filter((c) => {
        const w = c.weather ?? ["any"];
        return w.includes("any") || w.includes(band);
      })
    : CHALLENGES_UNISEX;
  const list = pool.length > 0 ? pool : CHALLENGES_UNISEX;
  return list[dayIndex(date) % list.length];
}

// Helper conservé pour compat : retourne toujours "unisexe".
export function audienceFromGender(_gender?: string | null): ChallengeAudience {
  return "unisexe";
}

export function nextResetMs(date = new Date()): number {
  // Prochain dimanche 23:59 (heure locale)
  const d = new Date(date);
  const day = d.getDay(); // 0 = dimanche
  const daysUntilSunday = day === 0 ? (d.getHours() >= 24 ? 7 : 0) : 7 - day;
  const target = new Date(d);
  target.setDate(d.getDate() + daysUntilSunday);
  target.setHours(23, 59, 0, 0);
  if (target.getTime() <= d.getTime()) target.setDate(target.getDate() + 7);
  return target.getTime() - d.getTime();
}
