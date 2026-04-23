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
      heightCm,
      weightKg,
      city,
      weather, // { temp, code, label } optional
      closet,
      referencePhoto, // data URL or null
      lang = "fr",
      tier = "free",
    } = body ?? {};

    if (!style || !mood || !occasion) {
      return new Response(
        JSON.stringify({ error: "style, mood, occasion required" }),
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
      : `Génère un mannequin photoréaliste correspondant au profil (genre: ${gender ?? "unisexe"}${heightCm ? `, ${heightCm}cm` : ""}${weightKg ? `, ${weightKg}kg` : ""}).`;

    const imagePrompt = `Photographie mode éditoriale plein corps, ultra réaliste, lumière studio douce, fond neutre clair.
Style: ${style}. Mood: ${mood}. Occasion: ${occasion}.
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

    const imgRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: tier === "premium" ? "google/gemini-3-pro-image-preview" : "google/gemini-2.5-flash-image",
          messages,
          modalities: ["image", "text"],
        }),
      },
    );

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

    // Stylist advice (text)
    const langName =
      { fr: "français", en: "anglais", es: "espagnol", de: "allemand", it: "italien" }[lang] ?? "français";

    const adviceSystem = `Tu es un styliste de mode pointu, drôle, précis. Tu réponds STRICTEMENT en ${langName}. Tu donnes :
1) "bullets" : 3 à 5 pièces concrètes (matière + couleur + coupe) qui composent la tenue.
2) "advice" : 2 phrases max. ${weather ? `Commence OBLIGATOIREMENT par : "Vu qu'il fait ${weather.temp}°C à ${city ?? "ta ville"}, j'ai adapté ton look".` : ""}
Réponds via la fonction tool fournie.`;

    const adviceUserPrompt = `Style: ${style}. Mood: ${mood}. Occasion: ${occasion}. ${weatherLine} ${closetLine}`;

    const adviceRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: tier === "premium" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash-lite",
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
      },
    );

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