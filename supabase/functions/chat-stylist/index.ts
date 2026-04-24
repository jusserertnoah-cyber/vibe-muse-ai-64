// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: userData, error: userErr } =
      await sb.auth.getUser(authHeader.replace("Bearer ", ""));
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
      mode, // "scan" | "look"
      messages = [],
      context = {},
      lang = "fr",
      tier = "free",
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

    const baseRules = `Tu es un STYLISTE HAUTE COUTURE (Vogue / Saint Laurent). Tu réponds STRICTEMENT en ${langName}.
RÈGLES :
- ULTRA-COURT : 1 à 2 phrases MAX. Lisible en 3 secondes.
- Toujours concret : couleur, coupe, matière, cm si pertinent.
- Ton chaleureux, bienveillant, expert. Jamais cassant.
- INTERDIT : "essaie autre chose", "ajoute des accessoires", flatteries vides.
- Tu peux poser UNE question ciblée si vraiment nécessaire.`;

    let contextLine = "";
    if (mode === "scan" && context?.scan) {
      const s = context.scan;
      contextLine = `Contexte du Vibe Check — Note: ${s.score}/10. Verdict: ${s.verdict}. Point fort: ${s.strong ?? s.colorimetrie ?? ""}. À améliorer: ${s.weak ?? s.detailKiller ?? ""}. Conseils donnés: ${(s.tips || []).join(" | ")}.`;
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
          model: tier === "premium" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash-lite",
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