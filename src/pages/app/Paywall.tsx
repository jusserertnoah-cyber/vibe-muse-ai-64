import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Camera, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StripeCheckoutModal } from "@/components/StripeCheckoutModal";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";

type PackId = "starter" | "vibe" | "stylist" | "premium";

type Pack = {
  id: PackId;
  name: string;
  price: string;
  priceId: string;
  scans: number;
  perScan: string;
  tag?: string;
  icon: React.ReactNode;
  highlight?: boolean;
};

const PACKS: Pack[] = [
  {
    id: "starter",
    name: "Starter",
    price: "2 €",
    priceId: "credits_starter_eur",
    scans: 5,
    perScan: "0,40 € / scan",
    icon: <Camera className="h-5 w-5" />,
  },
  {
    id: "vibe",
    name: "Vibe Pack",
    price: "5 €",
    priceId: "credits_vibe_pack_eur",
    scans: 15,
    perScan: "0,33 € / scan",
    tag: "Populaire",
    icon: <Sparkles className="h-5 w-5" />,
    highlight: true,
  },
  {
    id: "stylist",
    name: "Styliste",
    price: "10 €",
    priceId: "credits_styliste_eur",
    scans: 40,
    perScan: "0,25 € / scan",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "premium",
    name: "Premium",
    price: "20 €",
    priceId: "credits_premium_eur",
    scans: 100,
    perScan: "0,20 € / scan",
    tag: "Best value",
    icon: <Crown className="h-5 w-5" />,
  },
];

export default function Paywall() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<PackId>("vibe");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPriceId, setCheckoutPriceId] = useState<string | null>(null);

  // Retour de paiement Stripe → ?checkout=success
  useEffect(() => {
    if (params.get("checkout") === "success") {
      toast.success("Paiement validé ! Tes crédits sont en cours d'ajout.");
      params.delete("checkout");
      params.delete("session_id");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const buy = async () => {
    const pack = PACKS.find((p) => p.id === selected)!;
    // L'achat est ouvert même sans session : l'edge function `create-checkout`
    // gère le cas anonyme. Le checkout Stripe collecte un email et le webhook
    // crédite ensuite l'utilisateur correspondant.
    setCheckoutPriceId(pack.priceId);
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <PaymentTestModeBanner />
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 px-5 py-4 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <div className="mx-auto max-w-md px-5 pt-2">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-cobalt">
            <Camera className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-balance">
            Recharge tes crédits
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            1 crédit = 1 scan IA complet (audit fit, couleurs, touche 2026, shopping list).
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {PACKS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-3xl border-2 p-4 text-left transition-all",
                  active
                    ? "border-accent bg-card shadow-cobalt"
                    : "border-border bg-card hover:border-accent/40",
                )}
              >
                {p.tag && (
                  <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-accent-foreground">
                    {p.tag}
                  </span>
                )}
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl",
                    active ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
                  )}
                >
                  {p.icon}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {p.name}
                </span>
                <span className="font-serif text-2xl leading-none">{p.price}</span>
                <span className="text-sm font-medium">{p.scans} scans</span>
                <span className="text-[10px] text-muted-foreground">{p.perScan}</span>
              </button>
            );
          })}
        </div>

        <p className="mt-6 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          Paiement sécurisé via Stripe. Crédits sans expiration, utilisables quand tu veux.
        </p>

        <div className="fixed bottom-24 left-0 right-0 px-5">
          <div className="mx-auto max-w-md space-y-3">
            <Button
              onClick={buy}
              className="h-14 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold shadow-cobalt"
            >
              Acheter ce pack
            </Button>
            <button
              onClick={() => toast("Achats restaurés (mock)")}
              className="block w-full text-center text-xs uppercase tracking-widest text-muted-foreground"
            >
              Restaurer mes achats
            </button>
          </div>
        </div>
      </div>

      <StripeCheckoutModal
        open={checkoutOpen}
        priceId={checkoutPriceId}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}