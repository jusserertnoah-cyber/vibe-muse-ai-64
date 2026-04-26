const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Broadcaste une notification push à TOUS les abonnés OneSignal de l'app.
// Utilisé pour : défi du jour, nouveautés.
// Auth: requiert un user authentifié (toute personne connectée peut envoyer
// pour tester ; à durcir avec un rôle admin si besoin).

type Body = {
  title: string;
  message: string;
  url?: string;
  segment?: string; // ex: "Subscribed Users", "Active Users"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const REST_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
    if (!APP_ID || !REST_KEY) {
      return new Response(
        JSON.stringify({ error: "OneSignal non configuré" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    if (!body?.title || !body?.message) {
      return new Response(
        JSON.stringify({ error: "title et message requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = {
      app_id: APP_ID,
      included_segments: [body.segment ?? "Subscribed Users"],
      headings: { en: body.title, fr: body.title },
      contents: { en: body.message, fr: body.message },
      url: body.url,
    };

    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        Authorization: `Key ${REST_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "OneSignal error", details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});