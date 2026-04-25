// Défis quotidiens unisexe — liste fixe rotative, déterministe par date.
// Aucun appel IA : on fait `liste[indexJour % N]`.

export interface DailyChallenge {
  id: string;
  name: string;       // Affiché dans le bandeau (court)
  hint: string;       // Petit conseil pour l'utilisateur
  detect: string;     // Description précise utilisée par l'IA pour détecter
}

export type ChallengeAudience = "homme" | "femme" | "unisexe";

// Défis UNISEXE (utilisés pour tout le monde, fallback si pas de genre).
export const CHALLENGES_UNISEX: DailyChallenge[] = [
  { id: "red-touch",    name: "Une touche de rouge",          hint: "Un détail rouge visible (sac, écharpe, chaussettes, top…)", detect: "un élément clairement rouge (vêtement ou accessoire) visible sur la photo" },
  { id: "silver-acc",   name: "Accessoires argentés",          hint: "Bijou, ceinture ou chaîne argentée bien visible",            detect: "au moins un accessoire argenté (bijou, ceinture, chaîne) visible" },
  { id: "gold-acc",     name: "Détails dorés",                  hint: "Bijou doré, boutons dorés, ceinture dorée…",                 detect: "au moins un détail doré (bijou, bouton, ceinture) visible" },
  { id: "futuro-glasses", name: "Lunettes futuristes",          hint: "Lunettes de soleil sport/wrap/visière",                       detect: "des lunettes de soleil au design futuriste (wrap, visière, masque)" },
  { id: "minimal-jewel",  name: "Bijoux minimalistes",          hint: "Une fine chaîne, anneaux discrets…",                          detect: "des bijoux fins et minimalistes (fine chaîne, petits anneaux)" },
  { id: "white-sneaker",  name: "Sneakers blanches",            hint: "Une paire de sneakers blanches",                              detect: "des sneakers blanches aux pieds" },
  { id: "leather-piece",  name: "Une pièce en cuir",            hint: "Veste, jupe, sac, ceinture en cuir",                          detect: "une pièce en cuir clairement visible (veste, jupe, sac, ceinture)" },
  { id: "denim-on-denim", name: "Total denim",                  hint: "Haut + bas en denim",                                         detect: "un look total denim (haut et bas en jean)" },
  { id: "monochrome",     name: "Total look monochrome",        hint: "Une seule couleur dominante sur tout le look",                detect: "un look monochrome (une seule teinte dominante)" },
  { id: "oversized-coat", name: "Manteau oversize",             hint: "Un manteau XXL/oversize",                                     detect: "un manteau ou veste clairement oversize" },
  { id: "scarf",          name: "Écharpe statement",            hint: "Écharpe XXL, motif ou couleur forte",                         detect: "une écharpe visible et marquée (taille, motif ou couleur)" },
  { id: "cap",            name: "Casquette ou bob",             hint: "Cap baseball, bob, gavroche…",                                detect: "un couvre-chef visible (casquette, bob)" },
  { id: "watch",          name: "Une belle montre",             hint: "Montre visible au poignet",                                   detect: "une montre visible au poignet" },
  { id: "boots",          name: "Bottes ou bottines",           hint: "Boots cuir, Chelsea, cowboy…",                                detect: "des bottes ou bottines visibles" },
  { id: "knit",           name: "Maille épaisse",               hint: "Gros pull en maille / cardigan tricoté",                      detect: "un vêtement en grosse maille tricotée" },
  { id: "stripes",        name: "Rayures marinières",           hint: "Top ou pull à rayures",                                        detect: "des rayures clairement visibles sur un vêtement" },
  { id: "color-pop",      name: "Une couleur pop",              hint: "Vert pomme, fuchsia, jaune fluo…",                            detect: "une couleur saturée et pop sur au moins une pièce" },
  { id: "tailoring",      name: "Touche tailoring",             hint: "Blazer ou pantalon coupe tailleur",                            detect: "un vêtement coupe tailleur (blazer, pantalon à pli)" },
  { id: "layering",       name: "Layering 3 pièces",            hint: "Au moins 3 couches superposées (ex: tee + chemise + veste)",  detect: "au moins 3 couches de vêtements superposées clairement visibles" },
  { id: "structured-bag", name: "Sac structuré",                hint: "Sac à main ou bandoulière structuré",                          detect: "un sac structuré (à main ou bandoulière) visible" },
  { id: "logo-free",      name: "Zéro logo apparent",           hint: "Aucun logo visible sur le look",                              detect: "aucun logo de marque visible sur les vêtements" },
  { id: "earth-tones",    name: "Palette terreuse",             hint: "Camel, beige, marron, olive",                                 detect: "une palette de tons terreux dominants (camel, beige, marron, olive)" },
  { id: "pleated",        name: "Pli/plissé",                   hint: "Jupe ou pantalon plissé",                                     detect: "un vêtement plissé ou à plis (jupe, pantalon)" },
  { id: "satin",          name: "Touche satin",                 hint: "Une pièce satinée (top, jupe, foulard)",                       detect: "une pièce en matière satinée brillante" },
  { id: "color-block",    name: "Color blocking",               hint: "2-3 blocs de couleurs franches",                              detect: "un color blocking franc (au moins 2 blocs de couleurs vives)" },
  { id: "loafers",        name: "Mocassins ou derbies",         hint: "Mocassins, derbies cuir aux pieds",                           detect: "des mocassins ou derbies en cuir visibles" },
  { id: "hoodie",         name: "Hoodie sous une veste",        hint: "Hoodie visible sous un blazer ou trench",                     detect: "un hoodie portée sous une veste structurée" },
  { id: "cargo",          name: "Pantalon cargo",               hint: "Pantalon avec poches latérales cargo",                        detect: "un pantalon cargo (poches latérales visibles)" },
  { id: "white-shirt",    name: "Chemise blanche",              hint: "Une chemise blanche dans le look",                            detect: "une chemise blanche clairement visible" },
  { id: "bold-belt",      name: "Ceinture statement",           hint: "Ceinture marquée (boucle, couleur, taille)",                  detect: "une ceinture marquée et bien visible" },
];

// Défis HOMME (vestiaire masculin marqué).
export const CHALLENGES_MEN: DailyChallenge[] = [
  { id: "m-suit",         name: "Costume bien coupé",           hint: "Veste + pantalon assortis, coupe nette",                       detect: "un costume coordonné (veste et pantalon assortis) bien coupé sur un homme" },
  { id: "m-tie",          name: "Cravate ou nœud pap'",         hint: "Cravate fine, large ou nœud papillon",                          detect: "une cravate ou un nœud papillon visible au cou" },
  { id: "m-pocket-sq",    name: "Pochette costume",              hint: "Pochette en tissu visible dans la poche poitrine",             detect: "une pochette de costume visible dans la poche poitrine d'une veste" },
  { id: "m-trench",       name: "Trench / pardessus",            hint: "Long manteau classique homme",                                  detect: "un trench ou pardessus long porté par un homme" },
  { id: "m-loafers",      name: "Mocassins city",                hint: "Mocassins penny / tassel cuir",                                 detect: "des mocassins ou derbies cuir aux pieds" },
  { id: "m-chelsea",      name: "Chelsea boots",                 hint: "Bottines Chelsea cuir",                                          detect: "des bottines Chelsea visibles" },
  { id: "m-polo",         name: "Polo rentré",                   hint: "Polo rentré dans pantalon, propre",                              detect: "un polo manches courtes rentré dans le pantalon" },
  { id: "m-oxford",       name: "Chemise Oxford",                 hint: "Chemise Oxford col boutonné",                                   detect: "une chemise Oxford col boutonné visible" },
  { id: "m-watch-leather", name: "Montre bracelet cuir",          hint: "Montre classique, bracelet cuir",                               detect: "une montre à bracelet cuir au poignet" },
  { id: "m-blazer-tee",   name: "Blazer + tee blanc",            hint: "Tee blanc sous blazer structuré",                                detect: "un tee-shirt blanc porté sous un blazer structuré sur un homme" },
  { id: "m-cargo",        name: "Cargo + sneakers",              hint: "Pantalon cargo + sneakers tech",                                 detect: "un pantalon cargo combiné à des sneakers visibles" },
  { id: "m-overshirt",    name: "Surchemise",                     hint: "Overshirt en laine ou denim ouverte",                            detect: "une surchemise (overshirt) ouverte par-dessus un t-shirt" },
  { id: "m-roll-neck",    name: "Col roulé",                      hint: "Col roulé fin sous veste",                                       detect: "un col roulé visible au cou" },
  { id: "m-leather-jkt",  name: "Veste en cuir",                  hint: "Perfecto, biker ou trucker cuir",                                detect: "une veste en cuir noire ou marron portée par un homme" },
  { id: "m-sneakers-tech", name: "Sneakers techniques",            hint: "Sneakers running / trail visibles",                              detect: "des sneakers techniques (running/trail) visibles" },
];

// Défis FEMME (vestiaire féminin marqué).
export const CHALLENGES_WOMEN: DailyChallenge[] = [
  { id: "w-midi-dress",   name: "Robe midi",                     hint: "Robe longueur mollet bien tombée",                                detect: "une robe midi (longueur mollet) portée par une femme" },
  { id: "w-mini-dress",   name: "Robe mini",                     hint: "Robe courte au-dessus du genou",                                  detect: "une robe courte (mini) au-dessus du genou" },
  { id: "w-heels",        name: "Talons hauts",                  hint: "Escarpins ou sandales à talons",                                  detect: "des chaussures à talons hauts visibles" },
  { id: "w-ballet-flats", name: "Ballerines",                    hint: "Ballerines plates aux pieds",                                     detect: "des ballerines plates visibles aux pieds" },
  { id: "w-blazer-skirt", name: "Blazer + jupe",                 hint: "Blazer cintré + jupe tailleur",                                   detect: "un blazer associé à une jupe sur une femme" },
  { id: "w-pleated-skirt", name: "Jupe plissée",                  hint: "Jupe à plis visibles",                                            detect: "une jupe plissée portée par une femme" },
  { id: "w-trench",       name: "Trench beige",                  hint: "Trench classique beige",                                          detect: "un trench beige porté par une femme" },
  { id: "w-mini-bag",     name: "Mini sac structuré",            hint: "Petit sac à main bien structuré",                                  detect: "un mini sac à main structuré visible" },
  { id: "w-pearl-jewel",  name: "Touche perles",                 hint: "Boucles, collier ou broche perles",                                detect: "des bijoux en perles visibles (collier, boucles)" },
  { id: "w-knee-boots",   name: "Bottes hautes",                 hint: "Bottes au genou ou cuissardes",                                    detect: "des bottes hautes (au genou ou cuissardes) visibles" },
  { id: "w-tights",       name: "Collants opaques + jupe",       hint: "Collants noirs/colorés + jupe",                                    detect: "des collants opaques portés avec une jupe ou robe" },
  { id: "w-cropped-top",  name: "Top court",                     hint: "Top crop laissant la taille",                                      detect: "un top court (crop top) visible" },
  { id: "w-wide-pants",   name: "Pantalon large",                hint: "Wide-leg / palazzo bien tombé",                                    detect: "un pantalon large (wide-leg) porté par une femme" },
  { id: "w-oversized-blazer", name: "Blazer oversize",            hint: "Blazer XXL épaules tombantes",                                    detect: "un blazer clairement oversize porté par une femme" },
  { id: "w-headband",     name: "Bandeau ou foulard cheveux",    hint: "Bandeau, headband ou foulard noué",                                detect: "un bandeau ou foulard dans les cheveux" },
];

// Compat : ancienne export (utilisée ailleurs si présent).
export const CHALLENGES = CHALLENGES_UNISEX;

// Index déterministe : nb jours depuis l'epoch.
function dayIndex(d = new Date()): number {
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(utc / 86400000);
}

export function getDailyChallenge(
  audience: ChallengeAudience = "unisexe",
  date = new Date(),
): DailyChallenge {
  const list =
    audience === "homme" ? CHALLENGES_MEN
    : audience === "femme" ? CHALLENGES_WOMEN
    : CHALLENGES_UNISEX;
  return list[dayIndex(date) % list.length];
}

// Helper : déduit l'audience depuis le profil utilisateur stocké.
export function audienceFromGender(gender?: string | null): ChallengeAudience {
  if (gender === "homme") return "homme";
  if (gender === "femme") return "femme";
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
