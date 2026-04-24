import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyBody {
  imageBase64: string; // data URL or raw base64
  recentImages?: string[]; // up to 5 previous base64s for dedup
}

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

    const { imageBase64, recentImages = [] } = (await req.json()) as VerifyBody;
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Missing image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const userContent: any[] = [
      {
        type: "text",
        text:
          `Analyse cette capture d'écran. Réponds UNIQUEMENT via l'outil verify_story.\n` +
          `Critères :\n` +
          `1. is_story : true seulement si on voit clairement une UI de story Instagram OU TikTok ` +
          `(barre de progression en haut, icônes vues/réponses, avatar+pseudo en haut).\n` +
          `2. has_app_tag : true si tu détectes par OCR le mot "Vibe" ou "@vibe" ou un tag/mention de l'app de stylisme Vibe.\n` +
          `3. is_close_friends : true SEULEMENT si tu vois l'icône cercle vert "Amis proches" Instagram.\n` +
          `4. shows_outfit : true si une tenue/personne est visible.\n` +
          `5. duplicate_index : si une des images de référence (recentImages) montre LA MÊME tenue ET LE MÊME décor à >90%, renvoie son index (0..n-1). Sinon -1.\n` +
          `Sois strict mais juste.`,
      },
      { type: "image_url", image_url: { url: dataUrl } },
    ];

    recentImages.slice(0, 5).forEach((img, i) => {
      const url = img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
      userContent.push({
        type: "text",
        text: `Image de référence #${i} (story déjà soumise) :`,
      });
      userContent.push({ type: "image_url", image_url: { url } });
    });

    const aiResp = await fetch(
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
            {
              role: "system",
              content:
                "Tu es un agent anti-fraude pour valider des stories Instagram/TikTok soumises par des utilisateurs. Tu dois être strict et structuré.",
            },
            { role: "user", content: userContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "verify_story",
                description: "Renvoie le verdict de validation de la story.",
                parameters: {
                  type: "object",
                  properties: {
                    is_story: { type: "boolean" },
                    has_app_tag: { type: "boolean" },
                    is_close_friends: { type: "boolean" },
                    shows_outfit: { type: "boolean" },
                    duplicate_index: { type: "integer" },
                    reason: { type: "string" },
                  },
                  required: [
                    "is_story",
                    "has_app_tag",
                    "is_close_friends",
                    "shows_outfit",
                    "duplicate_index",
                    "reason",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "verify_story" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "rate_limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "payment_required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "no_tool_call" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(toolCall.function.arguments);

    // Verdict côté serveur
    let valid = true;
    let code = "ok";
    if (!args.is_story) { valid = false; code = "not_a_story"; }
    else if (!args.shows_outfit) { valid = false; code = "no_outfit"; }
    else if (!args.has_app_tag) { valid = false; code = "missing_tag"; }
    else if (args.is_close_friends) { valid = false; code = "close_friends"; }
    else if (typeof args.duplicate_index === "number" && args.duplicate_index >= 0) {
      valid = false; code = "duplicate";
    }

    return new Response(
      JSON.stringify({ valid, code, detail: args }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("verify-story error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});