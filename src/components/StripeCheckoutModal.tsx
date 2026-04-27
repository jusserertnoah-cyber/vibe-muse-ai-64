import { useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  priceId: string | null;
  onClose: () => void;
}

// IMPORTANT : on garde UNE SEULE référence à la Promise Stripe pour tout
// le cycle de vie de l'app. Si on appelle `getStripe()` à chaque render,
// `EmbeddedCheckoutProvider` reçoit une nouvelle prop `stripe` et démonte
// le formulaire → erreur "cannot change client secret after creation".
const stripePromise = getStripe();

export function StripeCheckoutModal({ open, priceId, onClose }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !priceId) {
      setClientSecret(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const returnUrl = `${window.location.origin}/app/paywall?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
        const { data: sess } = await supabase.auth.getSession();
        const { data, error } = await supabase.functions.invoke("create-checkout", {
          body: { priceId, returnUrl, environment: getStripeEnvironment() },
          headers: sess.session?.access_token
            ? { Authorization: `Bearer ${sess.session.access_token}` }
            : undefined,
        });
        if (cancelled) return;
        if (error || !data?.clientSecret) {
          setError(error?.message ?? "Erreur lors de la création du paiement");
          return;
        }
        setClientSecret(data.clientSecret);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Erreur inconnue");
      }
    })();
    return () => { cancelled = true; };
  }, [open, priceId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {error ? (
          <div className="p-6 text-sm text-destructive">{error}</div>
        ) : !clientSecret ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div id="checkout">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}