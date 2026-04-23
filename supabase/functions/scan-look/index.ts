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
      imageDataUrl,
      gender,
      heightCm,
      weightKg,
      lang = "fr",
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

    const systemPrompt = `Tu es un EXPERT STYLISTE HAUTE COUTURE et CONSULTANT EN IMAGE de niveau international (Vogue, Dior, Saint Laurent). Tu analyses une photo de tenue avec une PRÉCISION CHIRURGICALE.

RÈGLES ABSOLUES — tu DOIS les respecter sinon ta réponse est nulle :
1. INTERDICTION TOTALE de conseils génériques. JAMAIS "ajoute un accessoire", "essaie autre chose", "c'est sympa", "bon style".
2. ANALYSE TECHNIQUE OBLIGATOIRE :
   - Colorimétrie : nomme les couleurs précises et juge l'harmonie avec la carnation visible (ex: "Le bleu cobalt jure avec ton sous-ton chaud doré").
   - Proportions : compare les volumes des pièces entre elles${heightCm ? ` et avec la morphologie (${heightCm}cm)` : ""} (ex: "Le pantalon trop large tasse ta silhouette de ${heightCm ?? "X"}cm").
   - Matières : identifie les textures (laine, coton oxford, denim brut, satin…) et juge leur association.
3. LE DÉTAIL QUI TUE : repère UN détail précis et concret visible sur la photo (lacet mal serré, manche qui dépasse, bouton mal aligné, association de textures osée, ourlet trop long, montre dépareillée…) et commente-le explicitement.
4. NOTE /10 sévère mais juste, JAMAIS la même valeur banale :
   - 8-10 réservé aux looks PARFAITS (cohérence totale, détails maîtrisés)
   - 7 = solide avec 1 vraie faiblesse
   - 4-6 = potentiel mais erreurs de débutant
   - 1-3 = incohérent
   Utilise des décimales possibles (ex: 6.5).
5. 3 CONSEILS — chacun = ACTION IMMÉDIATE chiffrée et concrète, jamais vague.
   ✅ "Remonte tes manches de 3cm pour affiner les poignets"
   ✅ "Remplace cette ceinture noire par un cuir marron foncé pour rappeler tes derbies"
   ❌ "Ajoute des accessoires" / "Essaie un autre haut"

Tu réponds STRICTEMENT en ${langName}. Tu réponds UNIQUEMENT via la fonction tool fournie.
${profileLine ? `Profil porteur : ${profileLine}.` : ""}`;

    const userText = `Analyse cette tenue avec ta grille technique. Sois sévère, précis, chirurgical. Repère LE détail qui tue.`;

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
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
                description: "Returns the strict couture analysis of the outfit.",
                parameters: {
                  type: "object",
                  properties: {
                    score: {
                      type: "number",
                      description: "Note /10, peut être décimale (ex 6.5).",
                    },
                    verdict: {
                      type: "string",
                      description: "1 phrase punch — verdict global.",
                    },
                    colorimetrie: {
                      type: "string",
                      description: "Analyse couleur précise vs carnation.",
                    },
                    proportions: {
                      type: "string",
                      description: "Analyse volumes & morpho.",
                    },
                    matieres: {
                      type: "string",
                      description: "Analyse des textures / matières.",
                    },
                    detailKiller: {
                      type: "string",
                      description: "LE détail précis repéré sur la photo.",
                    },
                    tips: {
                      type: "array",
                      items: { type: "string" },
                      description: "Exactement 3 actions immédiates chiffrées.",
                      minItems: 3,
                      maxItems: 3,
                    },
                  },
                  required: [
                    "score",
                    "verdict",
                    "colorimetrie",
                    "proportions",
                    "matieres",
                    "detailKiller",
                    "tips",
                  ],
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