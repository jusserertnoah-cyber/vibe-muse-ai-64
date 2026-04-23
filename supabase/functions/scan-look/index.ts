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
                  },
                  required: ["score", "verdict", "strong", "weak", "tips"],
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