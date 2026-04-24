// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    // Require authenticated user — these endpoints call paid AI providers.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const body = await req.json();
    const {
      imageDataUrl,
      gender,
      heightCm,
      weightKg,
      lang = "fr",
      tier = "free",
    } = body ?? {};

    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: "imageDataUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langName =
      ({ fr: "français", en: "anglais", es: "espagnol", de: "allemand", it: "italien" } as Record<string, string>)[lang] ??
      "français";

    const profileLine = [
      gender ? `genre: ${gender}` : null,
      heightCm ? `taille: ${heightCm}cm` : null,
      weightKg ? `poids: ${weightKg}kg` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const systemPrompt = `Tu es un STYLISTE HAUTE COUTURE (Vogue, Saint Laurent). Tu analyses une tenue en allant DROIT AU BUT.

RÈGLES ABSOLUES :
1. ULTRA-COURT. Chaque champ = 1 phrase max, percutante, lisible en 2 secondes.
2. Ton bienveillant mais expert : tu encourages d'abord, tu corrigeras ensuite. Jamais cassant, jamais condescendant.
3. JAMAIS de conseils vagues ("essaie autre chose", "ajoute un accessoire"). Toujours CONCRET (couleur, coupe, cm, matière précise).
4. NOTE /10 honnête, décimales OK :
   - 9-10 = look parfait
   - 7-8 = très bon, 1 détail à peaufiner
   - 5-6 = correct, axes clairs d'amélioration
   - <5 = à retravailler en profondeur
5. Tu réponds STRICTEMENT en ${langName}, via la fonction tool fournie.

BIBLE STYLES (à utiliser pour identifier et valoriser) :
• OLD MONEY JEUNE : luxe discret, AUCUN logo, silhouettes propres. Palette crème/blanc cassé/marine/camel/beige/olive/gris chiné. Textures tweed, lin, cachemire, coton peigné, cuir lisse. Détails : boutons dorés, bijoux dorés minimalistes, sacs structurés, mocassins/ballerines/derbies cuir. Si tu détectes la combinaison textures riches (tweed/lin/cachemire) + neutres + détails dorés → identifie "Old Money Jeune" et valorise-la dans "strong" (ex : "Old Money impeccable : tweed + détails dorés parfaitement dosés").
• OVERSIZE : silhouettes XXL, hoodies/tees boxy, baggy/cargo, sneakers chunky, layering urbain.
• AMÉRICAIN : varsity/letterman jacket, sweat college, casquette baseball, jean droit/skinny, sneakers blanches (Converse, Air Force), vibe US college/preppy/sport.
• CLASSIQUE : coupes nettes, neutres, basiques bien coupés.
• SOBRE/MINIMAL : monochrome, lignes pures, peu d'accessoires.
• VINTAGE : pièces datées assumées, motifs rétro, cuirs patinés.
• SPORT : technique, fonctionnel, color-blocking.

IMPORTANT : tu DOIS toujours retourner un champ "style" qui correspond EXACTEMENT à l'un de ces labels (tels qu'écrits) : "Vintage", "Old Money", "Classique", "Sobre", "Sport", "Oversize", "Américain". Choisis celui qui colle le mieux à la tenue scannée.
${profileLine ? `Profil : ${profileLine}.` : ""}`;

    const userText = `Analyse cette tenue. Va droit au but : note, verdict, ce qui marche, ce qui pèche, 3 actions concrètes.`;

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: tier === "premium" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userText },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "vibe_check",
                description: "Analyse courte et actionnable d'une tenue.",
                parameters: {
                  type: "object",
                  properties: {
                    score: { type: "number", description: "Note /10, décimales OK." },
                    style: {
                      type: "string",
                      enum: ["Vintage", "Old Money", "Classique", "Sobre", "Sport", "Oversize", "Américain"],
                      description: "Style identifié sur la tenue (un seul, le plus dominant).",
                    },
                    verdict: { type: "string", description: "1 phrase courte (max 12 mots), bienveillante mais nette." },
                    strong: { type: "string", description: "Le point fort principal en 1 phrase concrète (couleur/coupe/matière nommée)." },
                    weak: { type: "string", description: "Le point à améliorer principal en 1 phrase concrète." },
                    tips: {
                      type: "array",
                      items: { type: "string" },
                      description: "Exactement 3 actions ultra-courtes (max 10 mots), concrètes et chiffrées.",
                      minItems: 3,
                      maxItems: 3,
                    },
                    fit: { type: "string", description: "Analyse du Fit : expertise sur la coupe (épaules, taille, longueur, volume). 1-2 phrases concrètes." },
                  colors: { type: "string", description: "Harmonie des couleurs : palette, contrastes, ce qui marche ou casse. 1-2 phrases concrètes." },
                  touch2026: { type: "string", description: "La Touche 2026 : LE conseil mode actuel pour moderniser la tenue (pièce, détail, accessoire tendance). 1-2 phrases." },
                  shopping: {
                    type: "array",
                    description: "Exactement 3 produits concrets pour compléter la tenue (pièces réelles trouvables).",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nom court du produit (ex: 'Mocassins cuir noir')." },
                        brand: { type: "string", description: "Marque suggérée réaliste (ex: 'COS', 'Sandro', 'Uniqlo U')." },
                        price: { type: "string", description: "Prix indicatif avec devise (ex: '89€')." },
                        why: { type: "string", description: "Pourquoi ce produit complète la tenue. 1 phrase max." },
                        query: { type: "string", description: "Requête de recherche Google Shopping (ex: 'mocassins cuir noir COS homme')." },
                      },
                      required: ["name", "brand", "price", "why", "query"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                  },
                  required: ["score", "style", "verdict", "strong", "weak", "tips", "fit", "colors", "touch2026", "shopping"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "vibe_check" } },
        }),
      },
    );

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("scan-look ai fail", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`ai ${aiRes.status}`);
    }

    const j = await aiRes.json();
    const args =
      j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(args);
    } catch (e) {
      console.error("parse fail", e, args);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error("scan-look error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});