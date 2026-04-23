import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile } from "@/lib/profile";
import { Cloud, Trophy, Shirt, Zap, TrendingUp, History as HistoryIcon, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentWeather } from "@/lib/weather";
import { getRecentScans, getStyleStats, getHistory } from "@/lib/history";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";

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

  // Style Journey & stats
  const scans = useMemo(() => getRecentScans(7).slice().reverse(), []);
  const chartData = scans.map((s, i) => ({ i: i + 1, score: s.score ?? 0 }));
  const lastScore = scans.length ? scans[scans.length - 1].score ?? 0 : null;
  const firstScore = scans.length ? scans[0].score ?? 0 : null;
  const trend = lastScore !== null && firstScore !== null ? lastScore - firstScore : 0;

  const recentLooks = useMemo(
    () => getHistory().filter((h) => h.imageUrl).slice(0, 5),
    [],
  );

  const styleStats = useMemo(() => getStyleStats(), []);

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

      {/* MY STATS — Style Journey */}
      {scans.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono-tech">
                EVOLUTION
              </span>
            </div>
            <div className="flex items-baseline gap-2 font-mono-tech">
              <span className="text-2xl font-bold tracking-tighter">
                {lastScore?.toFixed(1)}
              </span>
              <span className={`text-xs ${trend >= 0 ? "text-accent" : "text-muted-foreground"}`}>
                {trend >= 0 ? "+" : ""}{trend.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="mt-3 h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <YAxis domain={[0, 10]} hide />
                <Tooltip
                  cursor={false}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 11,
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                  labelFormatter={() => ""}
                  formatter={(v: number) => [`${v}/10`, "Note"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--accent))", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground font-mono-tech">
            {scans.length} derniers scans
          </p>
        </div>
      )}

      {/* HISTORY — Carrousel des looks récents */}
      {recentLooks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <HistoryIcon className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono-tech">
              HISTORY
            </span>
          </div>
          <div className="-mx-5 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-5">
              {recentLooks.map((item) => (
                <div
                  key={item.id}
                  className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary"
                >
                  <img
                    src={item.imageUrl!}
                    alt={item.style ?? "look"}
                    className="h-full w-full object-cover"
                  />
                  {typeof item.score === "number" && (
                    <div className="absolute right-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 font-mono-tech text-[10px] font-bold text-accent-foreground">
                      {item.score.toFixed(1)}
                    </div>
                  )}
                  {item.type === "look" && item.style && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[9px] font-medium uppercase tracking-wider text-white">
                      {item.style}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MY STATS — Top styles */}
      {styleStats.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono-tech">
              MY STATS
            </span>
          </div>
          <ul className="space-y-2.5">
            {styleStats.map((s) => (
              <li key={s.style}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{s.style}</span>
                  <span className="font-mono-tech text-muted-foreground">{s.pct}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}