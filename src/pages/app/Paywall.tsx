import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Camera, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StripeCheckoutModal } from "@/components/StripeCheckoutModal";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";

type OfferId = "discovery" | "monthly" | "quarterly";

type Offer = {
  id: OfferId;
  name: string;
  price: string;
  priceId: string;
  subtitle: string;
  perks: string[];
  tag?: string;
  icon: React.ReactNode;
  cta: string;
};

const OFFERS: Offer[] = [
  {
    id: "discovery",
    name: "Pack Découverte",
    price: "1,99 €",
    priceId: "credits_starter_eur",
    subtitle: "Usage ponctuel · sans engagement",
    perks: [
      "5 scans (0,40 € / scan)",
      "IA premium (identique aux abonnements)",
      "Sans renouvellement automatique",
      "Idéal pour un événement (mariage, soirée…)",
    ],
    icon: <Camera className="h-5 w-5" />,
    cta: "Acheter le pack",
  },
  {
    id: "monthly",
    name: "Style Pass Mensuel",
    price: "8,99 € / mois",
    priceId: "style_pass_monthly_eur",
    subtitle: "L'IA premium au quotidien",
    perks: [
      "Jusqu'à 10 scans par jour",
      "IA premium (plus performante)",
      "Analyse complète : couleurs, coupe, météo",
      "Accès prioritaire au Top Vibes",
    ],
    tag: "Populaire",
    icon: <Sparkles className="h-5 w-5" />,
    cta: "S'abonner — 8,99 €/mois",
  },
  {
    id: "quarterly",
    name: "Style Pass Trimestriel",
    price: "19,99 € / 3 mois",
    priceId: "style_pass_quarterly_eur",
    subtitle: "Soit 6,66 € / mois — économise 25 %",
    perks: [
      "Toutes les fonctionnalités du Pass Mensuel",
      "Reviens à 6,66 € / mois",
      "Économise 25 % vs mensuel",
      "Offre la plus rentable",
    ],
    tag: "Éco -25%",
    icon: <Crown className="h-5 w-5" />,
    cta: "S'abonner — 19,99 € / 3 mois",
  },
];

export default function Paywall() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<OfferId>("monthly");
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
    const offer = OFFERS.find((o) => o.id === selected)!;
    setCheckoutPriceId(offer.priceId);
    setCheckoutOpen(true);
  };

  const current = OFFERS.find((o) => o.id === selected)!;

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
            <Sparkles className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-balance">
            Choisis ton plan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Un pack ponctuel ou un abonnement Style Pass pour devenir une icône.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {OFFERS.map((o) => {
            const active = selected === o.id;
            return (
              <button
                key={o.id}
                onClick={() => setSelected(o.id)}
                className={cn(
                  "relative flex w-full flex-col gap-3 rounded-3xl border-2 p-5 text-left transition-all",
                  active
                    ? "border-accent bg-card shadow-cobalt"
                    : "border-border bg-card hover:border-accent/40",
                )}
              >
                {o.tag && (
                  <span className="absolute -top-2 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                    {o.tag}
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                      active ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
                    )}
                  >
                    {o.icon}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {o.name}
                    </div>
                    <div className="mt-0.5 font-serif text-2xl leading-tight">{o.price}</div>
                    <div className="text-xs text-muted-foreground">{o.subtitle}</div>
                  </div>
                </div>
                <ul className="space-y-1 pl-1">
                  {o.perks.map((perk) => (
                    <li key={perk} className="flex gap-2 text-xs text-foreground/80">
                      <span className="text-accent">•</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <p className="mt-6 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          Paiement sécurisé via Stripe. Abonnements résiliables à tout moment, crédits sans expiration.
        </p>

        <div className="fixed bottom-24 left-0 right-0 px-5">
          <div className="mx-auto max-w-md space-y-3">
            <Button
              onClick={buy}
              className="h-14 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold shadow-cobalt"
            >
              {current.cta}
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