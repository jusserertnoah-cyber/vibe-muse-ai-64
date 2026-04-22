import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Plan = "week" | "month" | "quarter";

export default function Paywall() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan>("month");

  const PLANS: { id: Plan; price: string; period: string; tag?: string; benefits: string[] }[] = [
    {
      id: "week",
      price: "3,99 €",
      period: t("paywall.week"),
      tag: t("paywall.ideal"),
      benefits: ["Générations illimitées", "Vibe Check HD", "Annulable à tout moment"],
    },
    {
      id: "month",
      price: "9,99 €",
      period: t("paywall.month"),
      tag: t("paywall.popular"),
      benefits: ["Tout du plan Semaine", "Essayage virtuel HD", "Vibe Closet illimité"],
    },
    {
      id: "quarter",
      price: "19,99 €",
      period: t("paywall.quarter"),
      tag: t("paywall.icon") + " · " + t("paywall.save"),
      benefits: ["Tout du plan Mois", "Accès anticipé aux nouveautés", "Support prioritaire"],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 px-5 py-4 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>

      <div className="mx-auto max-w-md px-5 pt-2">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-cobalt">
            <Crown className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-balance">
            {t("paywall.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("paywall.subtitle")}</p>
        </div>

        <div className="mt-8 space-y-3">
          {PLANS.map((p) => {
            const active = plan === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={cn(
                  "w-full rounded-3xl border-2 p-5 text-left transition-all",
                  active
                    ? "border-accent bg-card shadow-cobalt"
                    : "border-border bg-card hover:border-accent/40"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-2xl">{p.price}</span>
                      <span className="text-sm text-muted-foreground">/ {p.period}</span>
                    </div>
                    {p.tag && (
                      <span className="mt-1 inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-accent-foreground">
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                      active ? "border-accent bg-accent" : "border-border"
                    )}
                  >
                    {active && <Check className="h-3.5 w-3.5 text-accent-foreground" />}
                  </div>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-accent" />
                      {b}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-24 left-0 right-0 px-5">
          <div className="mx-auto max-w-md space-y-3">
            <Button
              onClick={() => toast("Stripe — connexion à brancher dans le tour suivant")}
              className="h-14 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold shadow-cobalt"
            >
              {t("paywall.subscribe")}
            </Button>
            <button
              onClick={() => toast("Achats restaurés (mock)")}
              className="block w-full text-center text-xs uppercase tracking-widest text-muted-foreground"
            >
              {t("paywall.restore")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}