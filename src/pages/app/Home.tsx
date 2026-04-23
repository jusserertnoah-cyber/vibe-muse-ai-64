import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile } from "@/lib/profile";
import { ALL_STYLES } from "@/data/inspiration";
import { Cloud, Sparkles, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StyleTag } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { getCurrentWeather } from "@/lib/weather";

const FILTERS: ("Pour toi" | StyleTag)[] = ["Pour toi", ...ALL_STYLES];

// Tagline éditoriale par style — pas d'image, que du texte.
const STYLE_TAGLINES: Record<StyleTag, string> = {
  "Vintage":    "Friperie 70's, denim brut, cuir patiné.",
  "Old Money":  "Cashmere, mocassins, blazer croisé.",
  "Classique":  "Trench, chemise blanche, costume marine.",
  "Sobre":      "Lin écru, maille douce, palette neutre.",
  "Sport":      "Tech fleece, sneakers blanches, hoodie net.",
  "Streetwear": "Cargo ample, hoodie oversize, accessoires bold.",
};

export default function Home() {
  const { t } = useTranslation();
  const profile = getProfile();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Pour toi");
  const [weather, setWeather] = useState<{ temp: number; city?: string } | null>(null);

  useEffect(() => {
    getCurrentWeather().then((w) => {
      if (w) setWeather({ temp: w.temp, city: w.city });
    });
  }, []);

  const styles = useMemo(() => {
    if (filter === "Pour toi") return ALL_STYLES;
    return ALL_STYLES.filter((s) => s === filter);
  }, [filter]);

  const progress = Math.min(((profile?.vibers ?? 0) / 200) * 100, 100);

  return (
    <div className="space-y-6 px-5 pt-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("home.hello")}
          </p>
          <h1 className="mt-1 font-serif text-3xl">{profile?.firstName}</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full glass-panel px-4 py-2 text-sm">
          <Cloud className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="font-mono-tech">{weather ? `${weather.temp}°` : "—"}</span>
          {weather?.city && (
            <span className="text-muted-foreground">· {weather.city}</span>
          )}
        </div>
      </header>

      {/* Vibers card */}
      <div className="rounded-3xl bg-card p-5 shadow-card border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <span className="text-sm font-medium">Tes Vibers</span>
          </div>
          <span className="font-mono-tech text-xl font-bold">
            {profile?.vibers ?? 0}
            <span className="text-muted-foreground">/200</span>
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          200 Vibers = 1 mois Premium offert ✨ (limité aux 500 premiers du mois)
        </p>
      </div>

      {/* Filters */}
      <div className="-mx-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all",
                filter === f
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="Univers de style">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl">Explore</h2>
          <span className="text-xs text-muted-foreground font-mono-tech">
            {styles.length}/{ALL_STYLES.length}
          </span>
        </div>
        <div className="grid gap-3">
          {styles.map((s, i) => (
            <button
              key={s}
              onClick={() => navigate("/app/dressing", { state: { presetStyle: s } })}
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 text-left transition-all hover:border-accent hover:bg-secondary"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-mono-tech">
                  <Sparkles className="h-3 w-3 text-accent" />
                  {String(i + 1).padStart(2, "0")} · Univers
                </div>
                <div className="mt-1 font-serif text-2xl">{s}</div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {STYLE_TAGLINES[s]}
                </p>
              </div>
              <ArrowRight className="ml-3 h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:text-accent group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}