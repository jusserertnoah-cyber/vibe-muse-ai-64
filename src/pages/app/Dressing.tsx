import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Mood, Occasion, StyleTag } from "@/lib/types";
import { getProfile } from "@/lib/profile";
import oldMoney from "@/assets/inspo-old-money-1.jpg";
import streetwear from "@/assets/inspo-streetwear-1.jpg";
import gorpcore from "@/assets/inspo-gorpcore-1.jpg";
import minimalism from "@/assets/inspo-minimalism-1.jpg";
import y2k from "@/assets/inspo-y2k-1.jpg";
import darkAcademia from "@/assets/inspo-dark-academia-1.jpg";

const STYLES: { id: StyleTag; img: string }[] = [
  { id: "Old Money", img: oldMoney },
  { id: "Streetwear", img: streetwear },
  { id: "Gorpcore", img: gorpcore },
  { id: "Minimalisme", img: minimalism },
  { id: "Y2K", img: y2k },
  { id: "Dark Academia", img: darkAcademia },
  { id: "Blokecore", img: streetwear },
  { id: "Cyber-Y2K", img: y2k },
  { id: "Modern Gothic", img: darkAcademia },
  { id: "Clean Fit", img: minimalism },
];

const MOODS: Mood[] = [
  "Confiant", "Chill", "Mystérieux", "Bad Boy/Girl", "Énervé",
  "Romantique", "Pro", "Créatif", "Énergique", "Discret",
];

const OCCASIONS: Occasion[] = [
  "Date Night", "Premier Date", "Travail/Entretien", "Sortie Potes",
  "Soirée Club", "Sport/Gym", "Mariage/Fête", "Chill Maison",
  "Voyage/Aéroport", "Shooting Photo",
];

type Step = 0 | 1 | 2 | 3;

export default function Dressing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const profile = getProfile();
  const [step, setStep] = useState<Step>(0);
  const [style, setStyle] = useState<StyleTag | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [loading, setLoading] = useState(false);
  const [look, setLook] = useState<{ bullets: string[]; advice: string } | null>(null);

  const goNext = (s: Step) => setStep(s);

  const generate = () => {
    if (!style || !mood || !occasion) {
      toast("Complète les 3 étapes");
      return;
    }
    setLoading(true);
    setLook(null);
    setTimeout(() => {
      setLook({
        bullets: [
          "Pull cachemire crème oversized",
          "Pantalon tailoring taupe",
          "Mocassins cuir marron foncé",
        ],
        advice:
          "L'équilibre des volumes affine la silhouette. Cette palette construit une aura raffinée, parfaite pour booster ton mindset.",
      });
      setLoading(false);
    }, 1400);
  };

  const reset = () => {
    setLook(null);
    setStep(0);
    setStyle(null);
    setMood(null);
    setOccasion(null);
  };

  const exit = () => navigate("/app");

  // Result view
  if (look) {
    return (
      <div className="min-h-screen bg-background px-5 pt-8 pb-32 animate-fade-in">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={reset} className="text-xs uppercase tracking-widest text-muted-foreground">
              Nouvelle tenue
            </button>
            <button onClick={exit}><X className="h-5 w-5" /></button>
          </div>
          <div className="overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="relative aspect-[3/4] w-full bg-gradient-luxe">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full glass-panel px-4 py-2 text-xs uppercase tracking-widest">
                  Visuel IA · à venir
                </div>
              </div>
              <div className="absolute bottom-3 left-3 rounded-full bg-accent px-3 py-1 text-[10px] uppercase tracking-widest text-accent-foreground">
                {mood} · {style}
              </div>
            </div>
            <div className="space-y-3 p-5">
              <ul className="space-y-1 text-sm">
                {look.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 text-accent" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl bg-secondary p-4 text-sm leading-relaxed">
                <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-accent">
                  Avis du styliste
                </div>
                {look.advice}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading view (full screen)
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background animate-fade-in">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-accent/20" />
          <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-accent" />
        </div>
        <div className="text-center">
          <p className="font-serif text-2xl">{t("dressing.generating")}</p>
          <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
            {style} · {mood} · {occasion}
          </p>
        </div>
      </div>
    );
  }

  // Step views — full screen
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={() => (step === 0 ? exit() : goNext((step - 1) as Step))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
        >
          {step === 0 ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-8 rounded-full transition-all duration-500",
                i <= step ? "bg-accent" : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32">
        <div key={step} className="mx-auto max-w-md animate-fade-up">
          {step === 0 && (
            <>
              <h2 className="font-serif text-3xl leading-tight">{t("dressing.step1")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Choisis l'univers qui te parle aujourd'hui.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {STYLES.map((s) => {
                  const active = style === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setStyle(s.id); setTimeout(() => goNext(1), 250); }}
                      className={cn(
                        "group relative aspect-[3/4] overflow-hidden rounded-3xl shadow-card transition-all",
                        active && "ring-4 ring-accent ring-offset-2 ring-offset-background scale-[0.98]"
                      )}
                    >
                      <img src={s.img} alt={s.id} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-3">
                        <div className="text-sm font-medium text-background">{s.id}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-serif text-3xl leading-tight">{t("dressing.step2")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                L'émotion que tu veux dégager.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {MOODS.map((m) => {
                  const active = mood === m;
                  return (
                    <button
                      key={m}
                      onClick={() => { setMood(m); setTimeout(() => goNext(2), 200); }}
                      className={cn(
                        "rounded-full border-2 px-5 py-3 text-base font-medium transition-all",
                        active
                          ? "border-accent bg-accent text-accent-foreground scale-105 shadow-cobalt"
                          : "border-border bg-card hover:border-accent/40"
                      )}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-serif text-3xl leading-tight">{t("dressing.step3")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Le contexte change tout.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {OCCASIONS.map((o) => {
                  const active = occasion === o;
                  return (
                    <button
                      key={o}
                      onClick={() => setOccasion(o)}
                      className={cn(
                        "rounded-full border px-4 py-2.5 text-sm transition-all",
                        active
                          ? "border-accent bg-accent text-accent-foreground shadow-cobalt"
                          : "border-border bg-card hover:border-accent/40"
                      )}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {profile?.closet?.length ? (
                <p className="mt-6 text-xs text-muted-foreground">
                  ✨ {profile.closet.length} pièces de ton Vibe Closet seront prises en compte.
                </p>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Sticky CTA — only visible on step 2 (occasion needs explicit confirm) */}
      {step === 2 && (
        <div className="fixed bottom-24 left-0 right-0 z-40 px-5 animate-fade-up">
          <div className="mx-auto max-w-md">
            <Button
              onClick={generate}
              disabled={!occasion}
              className="h-16 w-full rounded-3xl bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-semibold shadow-cobalt disabled:opacity-40 disabled:shadow-none"
            >
              <Wand2 className="mr-2 h-5 w-5" />
              {t("dressing.generate")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}