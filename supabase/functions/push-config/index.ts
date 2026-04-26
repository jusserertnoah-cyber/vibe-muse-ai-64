const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Renvoie l'App ID OneSignal (valeur publique) pour init côté client.
Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const APP_ID = Deno.env.get("ONESIGNAL_APP_ID") ?? "";
  return new Response(JSON.stringify({ appId: APP_ID }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});