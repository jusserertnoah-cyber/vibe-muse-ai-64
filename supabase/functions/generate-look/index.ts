// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const body = await req.json();
    const {
      style,
      mood,
      occasion,
      gender,
      age,
      heightCm,
      weightKg,
      city,
      weather, // { temp, code, label } optional
      closet,
      referencePhoto, // data URL or null
      lang = "fr",
      tier = "free",
      userBrief, // free-form description from user (text or transcribed voice)
      outfitPhoto, // optional data URL of an outfit/garment photo from the user
    } = body ?? {};

    const hasBrief = typeof userBrief === "string" && userBrief.trim().length > 0;
    const hasOutfitPhoto = typeof outfitPhoto === "string" && outfitPhoto.startsWith("data:");

    if (!hasBrief && !hasOutfitPhoto && (!style || !mood || !occasion)) {
      return new Response(
        JSON.stringify({ error: "brief, photo or style/mood/occasion required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const weatherLine = weather
      ? `Météo actuelle à ${city ?? "la ville"}: ${weather.temp}°C, ${weather.label}. Adapte impérativement la tenue (couches, manches, chaussures fermées si froid/pluie ; tissus respirants si chaud).`
      : "Météo non disponible : reste polyvalent.";

    const closetLine = Array.isArray(closet) && closet.length
      ? `Pioche au moins une pièce dans son Vibe Closet si pertinent : ${closet.slice(0, 12).join(", ")}.`
      : "";

    const personLine = referencePhoto
      ? "Une photo de référence de la personne est fournie : projette la tenue sur CETTE personne en gardant son visage, sa pose et sa morphologie."
      : `Génère un mannequin photoréaliste correspondant FIDÈLEMENT au profil (genre: ${gender ?? "unisexe"}${age ? `, âge ${age} ans — visage et morphologie cohérents avec cet âge, pas plus jeune ni plus vieux` : ""}${heightCm ? `, ${heightCm}cm` : ""}${weightKg ? `, ${weightKg}kg` : ""}).`;

    // === STYLE BIBLE ===
    const isFemme = (gender ?? "").toLowerCase().startsWith("f");
    const styleKey = String(style).toLowerCase();

    const oldMoneyFemmeVariants = [
      "Veste de tailleur en tweed blanc cassé à boutons dorés, pantalon large en crêpe de soie crème, ballerines en cuir noir lisse, sac structuré noir à fermoir doré, petites créoles dorées. Terrasse de café parisienne.",
      "Pull en cachemire camel à col rond, jupe midi plissée en laine beige, mocassins en cuir bordeaux, sac seau en cuir cognac, foulard en soie noué au cou. Allée bordée de platanes.",
      "Chemise blanche en coton peigné, gilet sans manches en maille marine boutons dorés, pantalon à pinces gris chiné, mocassins penny noirs, perles d'oreille discrètes. Bibliothèque boisée.",
      "Trench beige ceinturé, col roulé écru en cachemire, jupe crayon olive en laine, ballerines noires bout pointu, sac structuré camel à anse courte. Quai parisien à l'automne.",
      "Robe chemise en lin blanc cassé, ceinture fine en cuir marron, espadrilles plates beige, panier en osier, lunettes carrées écaille. Jardin méditerranéen.",
    ];
    const oldMoneyHommeVariants = [
      "Polo maille de coton marine ajusté, pantalon à pinces lin beige, ceinture cuir marron lisse, mocassins daim marron, montre cuir discrète, lunettes Wayfarer. Rue pavée élégante.",
      "Blazer croisé en laine bleu marine boutons dorés, chemise oxford blanche col boutonné, pantalon flanelle gris, mocassins penny noirs, pochette de costume blanche. Hall d'hôtel classique.",
      "Pull col V camel en cachemire sur chemise blanche, chinos crème, mocassins horsebit cognac, ceinture cuir cognac, montre vintage cuir brun. Bord de mer normand.",
      "Cardigan tweed olive boutons cornes, t-shirt blanc en coton peigné, pantalon chino beige, sneakers cuir blanches minimalistes, bracelet cuir marron. Campus universitaire.",
      "Trench camel ceinturé, col roulé blanc cassé, pantalon laine grise, derbies cuir marron, écharpe cachemire crème. Promenade en ville.",
    ];

    let styleDirective = "";
    if (styleKey.includes("old money")) {
      const pool = isFemme ? oldMoneyFemmeVariants : oldMoneyHommeVariants;
      const variant = pool[Math.floor(Math.random() * pool.length)];
      styleDirective = `STYLE STRICT — OLD MONEY JEUNE (${isFemme ? "fille" : "garçon"}) :
Philosophie : luxe discret, élégance intemporelle, AUCUN logo visible, silhouettes propres.
Palette OBLIGATOIRE : crème, blanc cassé, gris chiné, marine, camel, beige, olive. INTERDIT : couleurs vives, néon, fluo.
Textures OBLIGATOIRES : tweed, lin, cachemire, coton peigné, cuir lisse.
Détails clés : boutons dorés (vestes/cardigans), bijoux dorés minimalistes, sacs structurés, chaussures plates élégantes (mocassins, ballerines, derbies cuir).
Tenue à composer (varie cette base, n'invente pas un autre style) : ${variant}`;
    }

    const oversizeFemmeVariants = [
      "Hoodie XXL crème oversize, cargo baggy beige, sneakers chunky blanches, casquette noire, sac banane en bandoulière. Rue urbaine.",
      "Tee boxy noir oversize, jean baggy bleu délavé, sneakers chunky grises, lunettes ovales, chaîne argent. Skatepark béton.",
      "Sweat oversize gris chiné rentré dans un short cargo kaki, chaussettes mi-mollet, sneakers chunky, bob coton. Parking urbain.",
      "Chemise oversize blanche déboutonnée sur brassière noire, cargo parachute beige, sneakers blanches montantes, sac tote. Friche industrielle.",
      "Trench oversize beige sur hoodie noir, jogging baggy noir, sneakers chunky, lunettes carrées noires. Sortie de métro.",
    ];
    const oversizeHommeVariants = [
      "Tee boxy noir oversize, jean baggy bleu foncé, sneakers chunky blanches/grises, lunettes solaires, chaîne argent. Rue urbaine.",
      "Hoodie XXL beige sable, cargo baggy noir, sneakers chunky blanches, casquette noire. Skatepark.",
      "Chemise oversize denim sur tee blanc, jogging baggy gris, sneakers chunky noires, bob. Friche industrielle.",
      "Sweat crewneck oversize gris, short cargo long kaki, chaussettes hautes, sneakers basses chunky, lunettes rectangulaires. Parking béton.",
      "Trench oversize camel sur hoodie noir, jean parachute baggy, sneakers chunky blanches. Bord de route urbain.",
    ];
    if (styleKey.includes("oversize")) {
      const pool = isFemme ? oversizeFemmeVariants : oversizeHommeVariants;
      const variant = pool[Math.floor(Math.random() * pool.length)];
      styleDirective = `STYLE STRICT — OVERSIZE (${isFemme ? "fille" : "garçon"}) :
Silhouettes XXL, coupes très amples, layering visible. Sneakers chunky obligatoires. Palette urbaine (noir, blanc cassé, beige, gris, kaki, denim). AUCUN logo agressif.
Tenue à composer (varie cette base) : ${variant}`;
    }

    const americainFemmeVariants = [
      "Varsity letterman jacket marine et crème avec lettre brodée, tee blanc basique, jean droit bleu clair, sneakers Converse blanches montantes, casquette baseball blanche. Campus US.",
      "Sweat college oversize gris à logo université, mini-jupe plissée à carreaux, chaussettes hautes blanches, sneakers blanches basses, scrunchie. Pelouse de campus.",
      "Tee blanc rentré dans un jean mom bleu, chemise carreaux rouge nouée à la taille, baskets blanches Air Force, casquette baseball. Diner américain.",
      "Hoodie sport gris université, jogging assorti, baskets blanches, casquette baseball noire, tote bag toile. Bibliothèque universitaire.",
      "Robe cheerleader-inspired courte plissée, sweat oversize college par-dessus, chaussettes hautes, baskets blanches. Stade.",
    ];
    const americainHommeVariants = [
      "Varsity letterman jacket marine manches cuir crème lettre brodée, tee blanc, jean droit bleu, sneakers Converse blanches, casquette baseball. Campus US.",
      "Hoodie college gris à logo université, jogging assorti, baskets blanches Air Force, casquette baseball. Cour de campus.",
      "Tee blanc basique, surchemise carreaux rouge/noir ouverte, jean droit bleu, baskets blanches, casquette. Diner américain.",
      "Polo rugby rayé bleu/blanc, chino kaki, baskets blanches basses, casquette baseball. Tailgate party.",
      "Sweat crewneck université crème lettre flockée, jean droit, baskets Converse blanches montantes, sac à dos toile. Allée de campus.",
    ];
    if (styleKey.includes("améric") || styleKey.includes("americain") || styleKey.includes("american")) {
      const pool = isFemme ? americainFemmeVariants : americainHommeVariants;
      const variant = pool[Math.floor(Math.random() * pool.length)];
      styleDirective = `STYLE STRICT — AMÉRICAIN / US PREPPY-COLLEGE (${isFemme ? "fille" : "garçon"}) :
Inspiration college américain : varsity/letterman jackets, sweats université, casquettes baseball, jeans droits, sneakers blanches iconiques (Converse, Air Force). Palette : marine, blanc, crème, rouge, denim. Vibe US lycée/campus, énergique et sportive.
Tenue à composer (varie cette base) : ${variant}`;
    }

    const imagePrompt = `Photographie mode éditoriale plein corps, ultra réaliste, lumière studio douce, fond neutre clair.
Style: ${style}. Mood: ${mood}. Occasion: ${occasion}.
${styleDirective}
${weatherLine}
${personLine}
${closetLine}
Tenue cohérente, élégante, détails de matières visibles (texture, plis, ombres réalistes). Pas de texte ni logo dans l'image.`;

    const messages: any[] = [
      {
        role: "user",
        content: referencePhoto
          ? [
              { type: "text", text: imagePrompt },
              { type: "image_url", image_url: { url: referencePhoto } },
            ]
          : imagePrompt,
      },
    ];

    // Language name shared by image + advice prompts
    const langName =
      { fr: "français", en: "anglais", es: "espagnol", de: "allemand", it: "italien" }[lang] ?? "français";

    const adviceSystem = `Tu es un styliste de mode pointu, drôle, précis. Tu réponds STRICTEMENT en ${langName}. Tu donnes :
1) "bullets" : 3 à 5 pièces concrètes (matière + couleur + coupe) qui composent la tenue.
2) "advice" : 2 phrases max. ${weather ? `Commence OBLIGATOIREMENT par : "Vu qu'il fait ${weather.temp}°C à ${city ?? "ta ville"}, j'ai adapté ton look".` : ""}
Réponds via la fonction tool fournie.`;

    const adviceUserPrompt = `Style: ${style}. Mood: ${mood}. Occasion: ${occasion}. ${weatherLine} ${closetLine}`;

    // Run image generation and stylist advice IN PARALLEL — wall time ≈ slowest of the two.
    const imgPromise = fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    const advicePromise = fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: adviceSystem },
            { role: "user", content: adviceUserPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "stylist_output",
                description: "Returns the look bullets and stylist advice.",
                parameters: {
                  type: "object",
                  properties: {
                    bullets: {
                      type: "array",
                      items: { type: "string" },
                    },
                    advice: { type: "string" },
                  },
                  required: ["bullets", "advice"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "stylist_output" } },
        }),
    });

    const [imgRes, adviceRes] = await Promise.all([imgPromise, advicePromise]);

    if (!imgRes.ok) {
      const t = await imgRes.text();
      console.error("image gen failed", imgRes.status, t);
      if (imgRes.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imgRes.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`image gen ${imgRes.status}`);
    }

    const imgJson = await imgRes.json();
    const imageUrl =
      imgJson?.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;

    let bullets: string[] = [];
    let advice = "";
    if (adviceRes.ok) {
      const j = await adviceRes.json();
      const args =
        j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
      try {
        const parsed = JSON.parse(args);
        bullets = parsed.bullets ?? [];
        advice = parsed.advice ?? "";
      } catch (e) {
        console.error("advice parse fail", e);
      }
    } else {
      console.error("advice failed", adviceRes.status, await adviceRes.text());
    }

    return new Response(
      JSON.stringify({ imageUrl, bullets, advice, weather }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (e) {
    console.error("generate-look error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});