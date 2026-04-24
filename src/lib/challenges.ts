// Défis quotidiens unisexe — liste fixe rotative, déterministe par date.
// Aucun appel IA : on fait `liste[indexJour % N]`.

export interface DailyChallenge {
  id: string;
  name: string;       // Affiché dans le bandeau (court)
  hint: string;       // Petit conseil pour l'utilisateur
  detect: string;     // Description précise utilisée par l'IA pour détecter
}

export const CHALLENGES: DailyChallenge[] = [
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

// Index déterministe : nb jours depuis l'epoch.
function dayIndex(d = new Date()): number {
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor(utc / 86400000);
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  return CHALLENGES[dayIndex(date) % CHALLENGES.length];
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
