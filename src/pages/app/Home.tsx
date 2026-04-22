import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile } from "@/lib/profile";
import { INSPIRATION, ALL_STYLES } from "@/data/inspiration";
import { Cloud, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StyleTag } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { getCurrentWeather } from "@/lib/weather";

const FILTERS: ("Pour toi" | StyleTag)[] = ["Pour toi", ...ALL_STYLES];

const PAGE = 12;

export default function Home() {
  const { t } = useTranslation();
  const profile = getProfile();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Pour toi");
  const [count, setCount] = useState(PAGE);
  const [weather, setWeather] = useState<{ temp: number; city?: string } | null>(null);

  useEffect(() => {
    getCurrentWeather().then((w) => {
      if (w) setWeather({ temp: w.temp, city: w.city });
    });
  }, []);
  useEffect(() => { setCount(PAGE); }, [filter]);

  const looks = useMemo(() => {
    if (filter === "Pour toi") {
      return profile?.styles.length
        ? INSPIRATION.filter((l) => profile.styles.includes(l.style))
        : INSPIRATION;
    }
    return INSPIRATION.filter((l) => l.style === filter);
  }, [filter, profile?.styles]);

  const display = (looks.length ? looks : INSPIRATION).slice(0, count);
  const total = looks.length || INSPIRATION.length;
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
          <span>{weather ? `${weather.temp}°` : "—"}</span>
          {weather?.city && (
            <span className="text-muted-foreground">· {weather.city}</span>
          )}
        </div>
      </header>

      {/* Vibers card */}
      <div className="rounded-[28px] bg-gradient-luxe p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-cobalt" strokeWidth={1.5} />
            <span className="text-sm font-medium">Tes Vibers</span>
          </div>
          <span className="font-serif text-xl">
            {profile?.vibers ?? 0}
            <span className="text-muted-foreground">/200</span>
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/60">
          <div
            className="h-full rounded-full bg-cobalt transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-foreground/70">
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
                  ? "border-cobalt bg-cobalt text-cobalt-foreground"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="Galerie d'inspiration">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl">Explore</h2>
          <span className="text-xs text-muted-foreground">
            {Math.min(count, total)} / {total}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {display.map((look, i) => (
            <button
              key={`${look.id}-${i}`}
              onClick={() => navigate("/app/dressing", { state: { inspo: look } })}
              className={cn(
                "group relative overflow-hidden rounded-3xl bg-muted shadow-card transition-all hover:shadow-soft",
                i % 7 === 0 ? "row-span-2 aspect-[3/5]" : "aspect-[3/4]"
              )}
            >
              <img
                src={look.image}
                alt={`${look.title} — ${look.style}`}
                loading="lazy"
                width={768}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-3">
                <div className="text-[10px] uppercase tracking-widest text-background/80">
                  {look.style}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-background">
                  <Sparkles className="h-3 w-3" />
                  {look.title}
                </div>
              </div>
            </button>
          ))}
        </div>
        {count < total && (
          <button
            onClick={() => setCount((c) => c + PAGE)}
            className="mt-6 h-12 w-full rounded-2xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:border-cobalt/40 hover:text-cobalt"
          >
            Voir plus d'inspirations
          </button>
        )}
      </section>
    </div>
  );
}