// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  const scans = parseInt(session.metadata?.scans ?? "0", 10);

  if (!userId || !priceId || !scans) {
    console.warn("checkout.completed missing metadata", session.id);
    return;
  }

  const supabase = getSupabase();

  // Idempotent: insert purchase row
  const { error: insertErr } = await supabase
    .from("credit_purchases")
    .upsert(
      {
        user_id: userId,
        stripe_session_id: session.id,
        price_id: priceId,
        amount_cents: session.amount_total ?? 0,
        currency: session.currency ?? "eur",
        scans_granted: scans,
        status: "paid",
        environment: env,
      },
      { onConflict: "stripe_session_id" },
    );

  if (insertErr) {
    console.error("purchase insert err", insertErr);
    return;
  }

  // Add credits
  const { error: rpcErr } = await supabase.rpc("add_credits", {
    target_user: userId,
    scans,
  });
  if (rpcErr) console.error("add_credits rpc err", rpcErr);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);
    console.log("webhook event", event.type);

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object, env);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error", e);
    return new Response("Webhook error", { status: 400 });
  }
});