import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile } from "@/lib/profile";
import { Cloud, Trophy, Shirt, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentWeather } from "@/lib/weather";

export default function Home() {
  const { t } = useTranslation();
  const profile = getProfile();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<{ temp: number; city?: string; label?: string } | null>(null);

  useEffect(() => {
    getCurrentWeather().then((w) => {
      if (w) setWeather({ temp: w.temp, city: w.city, label: w.label });
    });
  }, []);

  const progress = Math.min(((profile?.vibers ?? 0) / 200) * 100, 100);
  const closetCount = profile?.closet?.length ?? 0;
  const featuredPiece = closetCount > 0 ? profile!.closet[0] : null;

  // Suggestion météo personnalisée
  const weatherSuggestion = useMemo(() => {
    if (!weather) return null;
    const t = weather.temp;
    const piece = featuredPiece
      ? featuredPiece
      : t < 5 ? "manteau en laine"
      : t < 12 ? "trench"
      : t < 18 ? "blazer léger"
      : t < 24 ? "chemise en lin"
      : "tee oversize";
    return `Il fait ${t}°C, parfait pour sortir ton ${piece} aujourd'hui.`;
  }, [weather, featuredPiece]);

  // Smart Closet : pièce "oubliée" (déterministe, basée sur le jour)
  const forgottenPiece = useMemo(() => {
    if (closetCount === 0) return null;
    const idx = (new Date().getDate() + closetCount) % closetCount;
    return profile!.closet[idx];
  }, [closetCount]);

  return (
    <div className="space-y-6 px-5 pt-8">
      {/* Header météo dynamique */}
      <header className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm text-muted-foreground">
                {weather?.city ?? "—"}
              </span>
              <span className="font-mono-tech text-sm font-bold tracking-tight">
                {weather ? `${weather.temp}°C` : "—"}
              </span>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("home.hello")} · {profile?.firstName}
          </p>
        </div>
        {weatherSuggestion && (
          <p className="text-sm leading-snug text-foreground/90">
            {weatherSuggestion}
          </p>
        )}
      </header>

      {/* Widget Vibers */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Vibers
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1 font-mono-tech">
              <span className="text-4xl font-bold tracking-tighter text-foreground">
                {profile?.vibers ?? 0}
              </span>
              <span className="text-base text-muted-foreground">/200</span>
            </div>
          </div>
          <span className="font-mono-tech text-xs text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${progress}%`, boxShadow: "0 0 12px hsl(var(--accent) / 0.6)" }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          200 Vibers = 1 mois Premium offert
        </p>
      </div>

      {/* Smart Closet */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-1.5">
          <Shirt className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Smart Closet
          </span>
        </div>
        {closetCount === 0 ? (
          <>
            <p className="mt-3 text-sm leading-snug text-foreground/90">
              Ton dressing est vide. Ajoute tes pièces pour des suggestions sur-mesure.
            </p>
            <button
              onClick={() => navigate("/app/profil")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-tight text-accent-foreground transition-all hover:opacity-90"
            >
              <Zap className="h-3.5 w-3.5" strokeWidth={2} />
              Ajouter une pièce
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-snug text-foreground/90">
              Tu as <span className="font-mono-tech font-bold">{closetCount}</span> pièce{closetCount > 1 ? "s" : ""} enregistrée{closetCount > 1 ? "s" : ""}.
              {forgottenPiece && (
                <> Tu n'as pas porté ton <span className="font-medium">{forgottenPiece}</span> depuis 2 semaines, on l'essaye aujourd'hui ?</>
              )}
            </p>
            <button
              onClick={() => navigate("/app/dressing", { state: { presetPiece: forgottenPiece } })}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-tight text-accent-foreground transition-all hover:opacity-90"
            >
              <Zap className="h-3.5 w-3.5" strokeWidth={2} />
              Créer un look avec
            </button>
          </>
        )}
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