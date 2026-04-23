import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles, Wand2, X, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Mood, Occasion, StyleTag } from "@/lib/types";
import { getProfile } from "@/lib/profile";
import { awardVibers } from "@/lib/vibers";
import { getTier } from "@/lib/tier";
import { ALL_STYLES } from "@/data/inspiration";
import { getCurrentWeather, type WeatherSnapshot } from "@/lib/weather";
import { supabase } from "@/integrations/supabase/client";
import { StylistChat } from "@/components/vibe/StylistChat";

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = getProfile();
  const presetStyle = (location.state as any)?.presetStyle as StyleTag | undefined;
  const [step, setStep] = useState<Step>(presetStyle ? 1 : 0);
  const [style, setStyle] = useState<StyleTag | null>(presetStyle ?? null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [look, setLook] = useState<{
    bullets: string[];
    advice: string;
    imageUrl: string | null;
  } | null>(null);

  useEffect(() => {
    getCurrentWeather().then((w) => w && setWeather(w));
  }, []);

  const goNext = (s: Step) => setStep(s);

  const generate = async () => {
    if (!style || !mood || !occasion) {
      toast(t("dressing.completeSteps"));
      return;
    }
    setLoading(true);
    setLook(null);
    try {
      // Fetch fresh weather (best effort)
      const w = weather ?? (await getCurrentWeather());
      if (w && !weather) setWeather(w);

      const { data, error } = await supabase.functions.invoke("generate-look", {
        body: {
          style,
          mood,
          occasion,
          gender: profile?.gender,
          heightCm: profile?.heightCm,
          weightKg: profile?.weightKg,
          city: w?.city ?? profile?.city,
          weather: w
            ? { temp: w.temp, code: w.code, label: w.label }
            : null,
          closet: profile?.closet ?? [],
          referencePhoto: profile?.referencePhoto ?? null,
          lang: i18n.language?.split("-")[0] ?? "fr",
          tier: getTier(),
        },
      });

      if (error) throw error;
      if ((data as any)?.error === "rate_limited") {
        toast.error(t("dressing.rateLimited"));
        setLoading(false);
        return;
      }
      if ((data as any)?.error === "payment_required") {
        toast.error(t("dressing.paymentRequired"));
        setLoading(false);
        return;
      }

      setLook({
        bullets: (data as any)?.bullets ?? [],
        advice: (data as any)?.advice ?? "",
        imageUrl: (data as any)?.imageUrl ?? null,
      });
      awardVibers("look");
    } catch (e) {
      console.error(e);
      toast.error(t("dressing.error"));
    } finally {
      setLoading(false);
    }
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
              {t("dressing.newLook")}
            </button>
            <button onClick={exit}><X className="h-5 w-5" /></button>
          </div>
          <div className="overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="relative aspect-[3/4] w-full bg-gradient-luxe">
              {look.imageUrl ? (
                <img
                  src={look.imageUrl}
                  alt={`${style} · ${mood}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full glass-panel px-4 py-2 text-xs uppercase tracking-widest">
                    {t("dressing.noImage")}
                  </div>
                </div>
              )}
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
                  {t("dressing.stylistAdvice")}
                </div>
                {look.advice}
              </div>
            </div>
          </div>

          <StylistChat
            mode="look"
            context={{
              look: { style, mood, occasion, bullets: look.bullets, advice: look.advice },
              weather: weather ? { temp: weather.temp, label: weather.label } : null,
            }}
            intro="Tenue posée. Une question, un swap, un accessoire ? Je t'écoute."
            suggestions={[
              "Avec quelles chaussures ?",
              "Plus chaud pour ce soir ?",
              "Une alternative plus chic ?",
            ]}
          />
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
                i <= step ? "bg-gradient-brand" : "bg-muted"
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
                {ALL_STYLES.map((s) => {
                  const active = style === s;
                  return (
                    <button
                      key={s}
                      onClick={() => { setStyle(s); setTimeout(() => goNext(1), 250); }}
                      className={cn(
                        "flex aspect-[5/3] items-center justify-center rounded-3xl border-2 px-4 text-center font-serif text-lg font-medium transition-all",
                        active
                          ? "border-accent bg-accent text-accent-foreground scale-[0.97] shadow-cobalt"
                          : "border-border bg-card text-foreground hover:border-accent/50 hover:bg-accent/10"
                      )}
                    >
                      {s}
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
              className="h-16 w-full rounded-3xl bg-gradient-brand text-white hover:opacity-90 text-lg font-semibold shadow-brand disabled:opacity-40 disabled:shadow-none border-0"
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