// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Mode test global : tant que Stripe n'est pas finalisé, aucun scan ne doit
// bloquer sur le solde ni consommer de crédits.
const TEST_MODE_NO_CREDITS = true;

// Lazy service-role client (pour rembourser un crédit en cas de scan invalide).
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabaseAdmin;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consommation atomique d'1 crédit — désactivée en mode test.
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const creditConsumed = !TEST_MODE_NO_CREDITS;
    if (creditConsumed) {
      const { data: ok, error: rpcErr } = await supabaseUser.rpc("consume_credit");
      if (rpcErr) {
        console.error("consume_credit error", rpcErr);
        return new Response(JSON.stringify({ error: "credit_check_failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!ok) {
        return new Response(JSON.stringify({ error: "no_credits" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY missing");

    const body = await req.json();
    const {
      imageDataUrl, gender, heightCm, weightKg, age,
      lang = "fr",
      challenge,         // { name, detect }  — défi du jour, optionnel
      occasion,          // string libre / preset (ex "Soirée", "Mariage")
      occasionNote,      // détails libres utilisateur (max 200 chars côté client)
      weather,           // { temp, label, city? }
    } = body ?? {};

    // Derive tier server-side from the DB — never trust client.
    let tier: "free" | "premium" = "free";
    try {
      const { data: prof } = await supabaseUser
        .from("profiles")
        .select("premium_until")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (prof?.premium_until && new Date(prof.premium_until) > new Date()) {
        tier = "premium";
      }
    } catch (_) { /* default free */ }

    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: "imageDataUrl required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langCode = ["fr", "en"].includes(lang) ? lang : "fr";
    const langName = langCode === "en" ? "English" : "français";
    const outputRule = langCode === "en"
      ? "Every visible text field you return MUST be in English: verdict, strong, weak, tips, fit, colors, touch2026, shopping.name, shopping.why and challenge_reason. Keep only the brand name Vibe unchanged."
      : "Tous les champs textuels visibles que tu renvoies DOIVENT être en français : verdict, strong, weak, tips, fit, colors, touch2026, shopping.name, shopping.why et challenge_reason. Garde seulement le nom Vibe inchangé.";

    const profileLine = [
      gender ? `genre: ${gender}` : null,
      age ? `âge: ${age} ans` : null,
      heightCm ? `taille: ${heightCm}cm` : null,
      weightKg ? `poids: ${weightKg}kg` : null,
    ].filter(Boolean).join(", ");

    const contextBlock = (() => {
      const parts: string[] = [];
      if (occasion) parts.push(`Occasion : ${String(occasion).slice(0, 80)}`);
      if (occasionNote) parts.push(`Précision utilisateur : ${String(occasionNote).slice(0, 240)}`);
      if (weather && typeof weather === "object") {
        const t = typeof weather.temp === "number" ? `${Math.round(weather.temp)}°C` : null;
        const lbl = weather.label ? String(weather.label) : null;
        const city = weather.city ? String(weather.city) : null;
        const wparts = [t, lbl, city].filter(Boolean).join(" · ");
        if (wparts) parts.push(`Météo actuelle : ${wparts}`);
      }
      if (parts.length === 0) return "";
      return `\n\nCONTEXTE DE PORT DE LA TENUE — adapte tes conseils en conséquence (couleurs, matières, couches, pertinence sociale) :\n- ${parts.join("\n- ")}`;
    })();

    const challengeBlock = challenge?.name
      ? `\n\nDÉFI DU JOUR : "${challenge.name}".
Critère STRICT de validation : ${challenge.detect}.
Tu DOIS examiner la photo et décider :
- challenge_met = true UNIQUEMENT si l'élément est CLAIREMENT visible sur la photo. Aucun bénéfice du doute.
- Sinon challenge_met = false.
- Renvoie aussi challenge_reason : 1 phrase courte expliquant ta décision.`
      : "";

    const systemPrompt = `Tu es un STYLISTE HAUTE COUTURE EXTRÊMEMENT SÉLECTIF (Vogue, Saint Laurent). Tu notes une tenue avec une rigueur compétitive.

RÈGLE ABSOLUE D'ENTRÉE :
Avant TOUTE analyse, vérifie qu'il s'agit bien d'une PHOTO D'UN ÊTRE HUMAIN PORTANT UNE TENUE.
Si l'image n'est PAS une personne réelle portant des vêtements (ex : objet seul, paysage, animal, écran/capture, dessin, photo vide, vêtement posé sans humain, selfie sans tenue visible), tu DOIS appeler la fonction tool "vibe_check" avec UNIQUEMENT :
  { "score": 0, "style": "Classique", "verdict": "ERREUR", "strong": "ERREUR", "weak": "ERREUR", "tips": ["ERREUR","ERREUR","ERREUR"], "fit": "ERREUR", "colors": "ERREUR", "touch2026": "ERREUR", "shopping": [{"name":"ERREUR","brand":"ERREUR","price":"-","why":"ERREUR","query":"-"},{"name":"ERREUR","brand":"ERREUR","price":"-","why":"ERREUR","query":"-"},{"name":"ERREUR","brand":"ERREUR","price":"-","why":"ERREUR","query":"-"}] }
Ne donne aucun avis, aucune note, aucune analyse dans ce cas.

ADAPTATION À L'ÂGE — IMPÉRATIF :
On ne s'habille pas pareil à 18 ans qu'à 60 ans. Adapte tes conseils, le verdict et la touche 2026 à l'âge de la personne :
• 13–22 : codes streetwear / Y2K / oversize assumés autorisés.
• 23–35 : équilibre tendance / élégance, pièces statement OK.
• 36–50 : élégance affirmée, coupes nettes, pièces durables, pas de gimmicks ado.
• 51+ : élégance intemporelle, matières nobles, coupes ajustées sans excès, JAMAIS de conseils type "hoodie crop", "baggy ado", couleurs criardes ou pièces TikTok. Vise Old Money / Classique / Sobre.
Si l'âge est inconnu, vise neutre adulte 25–35.

ÉCHELLE DE NOTATION (sur 10, OBLIGATOIREMENT avec 1 décimale, ex 7.4, 8.6, 9.1) :
• 1.0–4.9 : look raté, fautes majeures (couleurs criardes, coupes inadaptées, mismatch total).
• 5.0–6.9 : correct mais oubliable, manque d'intention.
• 7.0–8.4 : bon look, intention claire, 1 ou 2 détails à peaufiner.
• 8.5–9.0 : très haut niveau, harmonie réelle des matières et des coupes.
• 9.1–9.4 : excellent — très peu de gens atteignent cette zone.
• 9.5–9.7 : exceptionnel. Pour passer ce cap il faut une cohérence PARFAITE : harmonie des textures, ajustement des coupes (longueur des manches, tombé du pantalon, break, épaules), accord PRÉCIS des accessoires (taille de la montre vs poignet, bijoux non redondants).
• 9.8–9.9 : QUASI-PARFAIT. Plafond pour quelqu'un qui a appliqué tous les conseils. Garde toujours UN micro-détail à améliorer pour le pousser à chercher l'ultime.
• 10.0 : RARISSIME (1 sur 10 000). Réservé à un look digne d'un éditorial Vogue cover. Tu ne dois pratiquement JAMAIS donner 10.0.

COURBE DE DIFFICULTÉ : plus la note est haute, plus chaque dixième est difficile à gagner. Ne donne PAS 9.5+ si tu n'as pas analysé : matières (texture qui jure ?), coupes (manches trop longues, pantalon qui flotte/break ?), accessoires (montre proportionnée ? bijoux qui s'accordent ?).

EXEMPLES de critiques chirurgicales que tu DOIS savoir formuler quand pertinent :
- "Ta montre est trop massive pour ce poignet."
- "Le tissu de ta chemise jure avec la texture de ton veston."
- "Les manches dépassent de 2 cm — fais reprendre."
- "Le pantalon casse trop bas, ça écrase la silhouette."

RÈGLES DE FORME :
1. Ultra-court par champ (1 phrase percutante).
2. Ton bienveillant mais expert. Jamais cassant gratuitement.
3. JAMAIS de conseils vagues, toujours CONCRET (couleur, cm, matière nommée).
4. Tu réponds STRICTEMENT en ${langName}, via la fonction tool fournie.

BIBLE STYLES : "Vintage", "Old Money", "Classique", "Sobre", "Sport", "Oversize", "Américain". Tu DOIS choisir UN style exact dans cette liste pour le champ "style".${contextBlock}${challengeBlock}
${profileLine ? `\nProfil : ${profileLine}.` : ""}

${outputRule}`;

    const userText = langCode === "en"
      ? `Analyze this outfit rigorously. Give a decimal score (e.g. 8.4, 9.2). Be selective with 9.5+. Return the verdict, strength, weakness, 3 concrete actions, fit, colors, 2026 touch and 3 shopping products in English.${challenge?.name ? ` Also evaluate the challenge: "${challenge.name}".` : ""}`
      : `Analyse cette tenue avec rigueur. Donne une note décimale (ex 8.4, 9.2). Sois sélectif sur le 9.5+. Verdict, fort, faible, 3 actions concrètes, fit, couleurs, touche 2026, 3 produits shopping en français.${challenge?.name ? ` Évalue aussi le défi : "${challenge.name}".` : ""}`;

    const properties: any = {
      score: { type: "number", description: "Note /10 OBLIGATOIREMENT décimale (ex 7.4, 8.6, 9.1). 10.0 quasi interdit." },
      style: { type: "string", enum: ["Vintage", "Old Money", "Classique", "Sobre", "Sport", "Oversize", "Américain"] },
      verdict: { type: "string" },
      strong: { type: "string" },
      weak: { type: "string" },
      tips: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
      fit: { type: "string" },
      colors: { type: "string" },
      touch2026: { type: "string" },
      shopping: {
        type: "array", minItems: 3, maxItems: 3,
        items: {
          type: "object",
          properties: {
            name: { type: "string" }, brand: { type: "string" }, price: { type: "string" },
            why: { type: "string" }, query: { type: "string" },
          },
          required: ["name", "brand", "price", "why", "query"],
          additionalProperties: false,
        },
      },
    };
    const required = ["score", "style", "verdict", "strong", "weak", "tips", "fit", "colors", "touch2026", "shopping"];

    if (challenge?.name) {
      properties.challenge_met = { type: "boolean", description: "true UNIQUEMENT si l'élément du défi est clairement visible sur la photo." };
      properties.challenge_reason = { type: "string", description: "1 phrase expliquant la décision." };
      required.push("challenge_met", "challenge_reason");
    }

    // Mistral Pixtral — vision + tool calling pour JSON strict.
    const aiRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${MISTRAL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "pixtral-12b-2409",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: imageDataUrl },
          ]},
        ],
        tools: [{
          type: "function",
          function: {
            name: "vibe_check",
            description: "Analyse stricte d'une tenue avec score décimal.",
            parameters: { type: "object", properties, required, additionalProperties: false },
          },
        }],
        tool_choice: "any",
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("scan-look mistral fail", aiRes.status, errText);
      // En cas d'échec IA → on rembourse le crédit consommé (hors mode test).
      if (creditConsumed) {
        try { await getSupabase().rpc("add_credits", { target_user: userData.user.id, scans: 1 }); } catch (_) {}
      }
      if (aiRes.status === 429 || aiRes.status === 503 || aiRes.status === 529) {
        return new Response(JSON.stringify({ error: "rate_limited", refunded: true }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "payment_required", refunded: true }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "ai_error", refunded: true }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const j = await aiRes.json();
    const args = j?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(args); } catch (e) { console.error("parse fail", e, args); }

    // Si l'IA a détecté que ce n'est PAS une tenue humaine → on rembourse le crédit
    // et on renvoie une erreur claire au client (status 422 not_human).
    const isError = parsed?.verdict === "ERREUR" || parsed?.score === 0 || parsed?.strong === "ERREUR";
    if (isError) {
      if (creditConsumed) {
        try {
          await getSupabase().rpc("add_credits", { target_user: userData.user.id, scans: 1 });
        } catch (e) {
          console.error("refund credit failed", e);
        }
      }
      return new Response(JSON.stringify({ error: "not_human", refunded: true }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Plafond 9.9 hard côté serveur (rarissime 10.0)
    if (typeof parsed.score === "number") {
      if (parsed.score >= 10) {
        // 1 chance sur 10 000 d'autoriser un vrai 10.0
        if (Math.random() > 0.0001) parsed.score = 9.9;
        else parsed.score = 10.0;
      }
      // Forcer 1 décimale
      parsed.score = Math.round(parsed.score * 10) / 10;
    }

    // Si défi respecté → récompense (1 crédit gratuit tous les 10)
    if (challenge?.name && parsed.challenge_met === true) {
      const { data: rew } = await supabaseUser.rpc("reward_challenge");
      parsed.challenge_reward = rew;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    console.error("scan-look error", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
