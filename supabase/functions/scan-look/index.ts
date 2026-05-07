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
      ? "Every visible text field you return MUST be in English: verdict, strong, weak, tips, shopping.name, shopping.why and challenge_reason. Keep only the brand name Vibe unchanged."
      : "Tous les champs textuels visibles que tu renvoies DOIVENT être en français : verdict, strong, weak, tips, shopping.name, shopping.why et challenge_reason. Garde seulement le nom Vibe inchangé.";

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
  { "score": 0, "coherence": 0, "originalite": 0, "fit": 0, "point_fort": "ERREUR", "point_faible": "ERREUR", "conseil": "ERREUR" }
Ne donne aucun avis, aucune note, aucune analyse dans ce cas.

ADAPTATION À L'ÂGE — IMPÉRATIF (cette règle prime sur tout le reste) :
On ne s'habille pas pareil à 18 ans qu'à 60 ans. Adapte STRICTEMENT tes notes et conseils à l'âge réel de la personne :
• 13–17 : codes ado, basiques carrés. Nota stricte pas au-delà de 8.
• 18–22 : streetwear / Y2K / oversize autorisés. Max 9 possible.
• 23–35 : équilibre tendance / élégance. Max 9.2.
• 36–50 : élégance affirmée, coupes nettes. Max 9.3.
• 51+ : élégance intemporelle, sobriété. Max 9.4.
Si l'âge est inconnu, vise neutre adulte 25–35.

ÉCHELLE DE NOTATION (sur 10, OBLIGATOIREMENT avec 1 décimale, ex 7.4, 8.6, 9.1) :
• 1.0–4.9 : look raté, fautes majeures (couleurs criardes, coupes inadaptées, mismatch total).
• 5.0–6.9 : correct mais oubliable, manque d'intention.
• 7.0–8.4 : bon look, intention claire, 1 ou 2 détails à peaufiner.
• 8.5–9.0 : très haut niveau, harmonie réelle des matières et des coupes.
• 9.1–9.4 : excellent — très peu de gens atteignent cette zone.
• 9.5–9.7 : exceptionnel. Pour passer ce cap il faut une cohérence PARFAITE : harmonie des textures, ajustement des coupes, accord PRÉCIS des accessoires.
• 9.8–9.9 : QUASI-PARFAIT. Plafond pour quelqu'un qui a appliqué tous les conseils.
• 10.0 : RARISSIME (1 sur 10 000). Réservé à un look digne d'un éditorial Vogue.

NOUVELLE STRUCTURE JSON STRICTE — LIS ATTENTIVEMENT :
Tu DOIS retourner exactement ces 6 champs (plus challenge_met et challenge_reason si applicable) :
- "score": Nombre décimal /10 (ex: 8.4, 7.2, 9.1). OBLIGATOIRE.
- "coherence": Nombre entier 0–10. Mesure l'harmonie des matières, couleurs et coupes ensemble.
- "originalite": Nombre entier 0–10. Mesure la personnalité et l'audace de la tenue.
- "fit": Nombre entier 0–10. Mesure l'ajustement et la proportion des pièces sur la silhouette.
- "point_fort": STRING texte brut, MAXIMUM 15 MOTS. Décris en 1 phrase ultra-courte ce qui marche le mieux. Direct, percutant. Pas de politesse.
- "point_faible": STRING texte brut, MAXIMUM 15 MOTS. Décris le principal défaut en 1 phrase ultra-courte. Direct. Pas de politesse.
- "conseil": STRING texte brut, MAXIMUM 15 MOTS. UNE action concrète et immédiate à faire pour améliorer. Nomme une couleur (ex "bordeaux"), une matière (ex "coton brut") ou un % (ex "raccourcir de 2cm"), JAMAIS vague.

RÈGLES STRICTES DE TEXTE :
1. Chaque champ texte (point_fort, point_faible, conseil) : MAXIMUM 15 MOTS. Pas plus. Compte-les.
2. Ton : direct, jeune, jeune, dans l'esprit Cal AI / fashion app Gen-Z. Court. Percutant.
3. Jamais de formules de politesse ("Cet outfit...". "On remarque que...". "Cette tenue présente..." → INTERDIT).
4. Jamais de ponctuation inutile (pas de "..." ni de "–" pour lister).
5. Va DROIT au but. Coupe au maximum : pas de détails secondaires.${contextBlock}${challengeBlock}
${profileLine ? `\nProfil : ${profileLine}.` : ""}

${outputRule}`;

    const userText = langCode === "en"
      ? `Analyze this outfit rigorously. Decimal score (e.g. 8.4, 9.2). Return: score, coherence (0-10), originalite (0-10), fit (0-10), point_fort (max 15 words), point_faible (max 15 words), conseil (max 15 words, concrete action).${challenge?.name ? ` Also evaluate the challenge: "${challenge.name}".` : ""}`
      : `Analyse cette tenue avec rigueur. Note décimale (ex 8.4, 9.2). Renvoie : score, coherence (0-10), originalite (0-10), fit (0-10), point_fort (max 15 mots), point_faible (max 15 mots), conseil (max 15 mots, action concrète).${challenge?.name ? ` Évalue aussi le défi : "${challenge.name}".` : ""}`;

    const properties: any = {
      score: { type: "number", description: "Note /10 OBLIGATOIREMENT décimale (ex 7.4, 8.6, 9.1). 10.0 quasi interdit." },
      coherence: { type: "integer", minimum: 0, maximum: 10, description: "Harmonie des matières, couleurs et coupes (0-10)." },
      originalite: { type: "integer", minimum: 0, maximum: 10, description: "Personnalité et audace de la tenue (0-10)." },
      fit: { type: "integer", minimum: 0, maximum: 10, description: "Ajustement et proportion des pièces (0-10)." },
      point_fort: { type: "string", description: "Maximum 15 mots. 1 phrase ultra-courte, direct, percutant. Pas de politesse." },
      point_faible: { type: "string", description: "Maximum 15 mots. 1 phrase ultra-courte, direct. Principal défaut." },
      conseil: { type: "string", description: "Maximum 15 mots. 1 action concrète immédiate. Nomme couleur, matière ou %. Jamais vague." },
    };
    const required = ["score", "coherence", "originalite", "fit", "point_fort", "point_faible", "conseil"];

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
      console.error("scan-look ai fail", aiRes.status, errText);
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
    const isError = parsed?.point_fort === "ERREUR" || parsed?.score === 0 || parsed?.point_faible === "ERREUR";
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

    // Enregistrer le résultat du scan dans la table scans
    try {
      await getSupabase().from("scans").insert({
        user_id: userData.user.id,
        image_url: img,
        score: parsed.score,
        coherence: parsed.coherence ?? 0,
        originalite: parsed.originalite ?? 0,
        fit: parsed.fit ?? 0,
        point_fort: parsed.point_fort ?? "",
        point_faible: parsed.point_faible ?? "",
        conseil: parsed.conseil ?? "",
        challenge_name: challenge?.name ?? null,
        challenge_met: parsed.challenge_met ?? null,
        challenge_reason: parsed.challenge_reason ?? null,
      });
    } catch (e) {
      console.error("scan save error", e);
      // Non-bloquant : on retourne quand même le résultat au client
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
