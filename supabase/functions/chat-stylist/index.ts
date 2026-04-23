// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Msg = { role: "user" | "assistant"; content: string };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const body = await req.json();
    const {
      mode, // "scan" | "look"
      messages = [],
      context = {},
      lang = "fr",
    } = body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langName =
      ({ fr: "français", en: "anglais", es: "espagnol", de: "allemand", it: "italien" } as Record<string, string>)[lang] ??
      "français";

    const baseRules = `Tu es un STYLISTE HAUTE COUTURE expert (Vogue / Saint Laurent). Tu réponds STRICTEMENT en ${langName}.
RÈGLES :
- Réponses COURTES (2-4 phrases max), incisives, jamais génériques.
- Toujours actionnable : couleur précise, coupe précise, matière précise, mesure en cm si pertinent.
- INTERDIT : "essaie autre chose", "ajoute des accessoires", "c'est sympa", flatteries vides.
- Tu peux poser UNE question ciblée si elle débloque vraiment le conseil.
- Tu utilises le tutoiement, ton chaleureux mais expert.`;

    let contextLine = "";
    if (mode === "scan" && context?.scan) {
      const s = context.scan;
      contextLine = `Contexte du Vibe Check précédent — Note: ${s.score}/10. Verdict: ${s.verdict}. Colorimétrie: ${s.colorimetrie}. Proportions: ${s.proportions}. Matières: ${s.matieres}. Détail repéré: ${s.detailKiller}. Conseils déjà donnés: ${(s.tips || []).join(" | ")}.`;
    } else if (mode === "look" && context?.look) {
      const l = context.look;
      contextLine = `Contexte de la tenue générée — Style: ${l.style}. Mood: ${l.mood}. Occasion: ${l.occasion}. Pièces: ${(l.bullets || []).join(" / ")}. Avis styliste donné: ${l.advice}.`;
      if (context.weather) {
        contextLine += ` Météo: ${context.weather.temp}°C, ${context.weather.label}.`;
      }
    }
    if (context?.profile) {
      const p = context.profile;
      contextLine += ` Profil: ${[p.gender, p.heightCm ? `${p.heightCm}cm` : null, p.weightKg ? `${p.weightKg}kg` : null].filter(Boolean).join(", ")}.`;
    }

    const systemPrompt = `${baseRules}\n\n${contextLine}`.trim();

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-12).map((m: Msg) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        }),
      },
    );

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("chat-stylist ai fail", aiRes.status, t);
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

    return new Response(aiRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-stylist error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});