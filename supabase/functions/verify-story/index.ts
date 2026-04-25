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
    if (userErr || !userData?.user?.id) {
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
          `Analyse cette capture d'écran d'une story. Réponds UNIQUEMENT via l'outil verify_story.\n` +
          `Sois TRÈS strict — c'est un système anti-fraude pour valider une vraie diffusion publique.\n\n` +
          `1. is_story : true UNIQUEMENT si tu vois clairement l'UI native d'une story :\n` +
          `   • Instagram : barres de progression fines en haut, avatar rond + pseudo + "il y a Xh" en haut, icônes (cœur/avion) en bas, "Activité"/"Vu par X" en bas à gauche.\n` +
          `   • TikTok Story : barre du haut, pseudo + temps, indicateur "Story", icônes côté droit.\n` +
          `   Une simple photo dans la pellicule = false. Un post feed = false.\n\n` +
          `2. has_app_tag : true UNIQUEMENT si tu détectes par OCR un hashtag ou mention textuelle ` +
          `clairement visible parmi : "#vibe", "#vibeapp", "@vibe", "@vibe.app", "vibe.app". ` +
          `Le mot "vibe" tout seul (sans # ni @) ne suffit PAS. Si tu n'arrives pas à lire le tag, mets false.\n\n` +
          `3. is_close_friends : true si l'un de ces indices est présent :\n` +
          `   • Cercle vert "★ Amis proches" autour de l'avatar.\n` +
          `   • Étoile verte ou label "Close Friends" / "Amis proches" visible.\n` +
          `   • Bordure verte caractéristique de la story Close Friends.\n` +
          `   Sinon false.\n\n` +
          `4. has_public_views : true si tu vois un indicateur que la story est publique et vue par d'autres :\n` +
          `   • Mention "Vu par N" / "Viewed by N" / "N vues" en bas.\n` +
          `   • Liste de viewers (avatars empilés) en bas à gauche.\n` +
          `   • Compteur de vues TikTok visible (œil + nombre).\n` +
          `   Si rien de tout ça → false (probablement story brouillon, pellicule, ou screenshot avant publication).\n\n` +
          `5. shows_outfit : true si une tenue/silhouette habillée est visible (pas juste un visage ou un objet).\n\n` +
          `6. duplicate_index : si une des images de référence (recentImages) montre LA MÊME tenue ET le MÊME décor à >90%, renvoie son index (0..n-1). Sinon -1.\n\n` +
          `Mets une raison courte et factuelle dans "reason".`,
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
                    has_public_views: { type: "boolean" },
                    shows_outfit: { type: "boolean" },
                    duplicate_index: { type: "integer" },
                    reason: { type: "string" },
                  },
                  required: [
                    "is_story",
                    "has_app_tag",
                    "is_close_friends",
                    "has_public_views",
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
    else if (!args.has_public_views) { valid = false; code = "not_public"; }
    else if (typeof args.duplicate_index === "number" && args.duplicate_index >= 0) {
      valid = false; code = "duplicate";
    }

    // Si valid : on incrémente le compteur et on crédite 1 scan tous les 5.
    let storyCount = 0;
    let creditsGranted = 0;
    if (valid) {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const userId = userData.user.id;
      // Lire la valeur actuelle
      const { data: prof } = await admin
        .from("profiles")
        .select("story_count")
        .eq("id", userId)
        .maybeSingle();
      const before = prof?.story_count ?? 0;
      storyCount = before + 1;
      await admin.from("profiles")
        .update({ story_count: storyCount })
        .eq("id", userId);
      // Tous les 5 stories validées → 1 scan (1 viber) gratuit
      if (storyCount % 5 === 0) {
        const { error: rpcErr } = await admin.rpc("add_credits", {
          target_user: userId,
          scans: 1,
        });
        if (!rpcErr) creditsGranted = 1;
      }
    }

    return new Response(
      JSON.stringify({ valid, code, detail: args, storyCount, creditsGranted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("verify-story error", e);
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});