import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getProfile } from "@/lib/profile";
import { Trophy, Shirt, Zap, TrendingUp, History as HistoryIcon, BarChart3, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrentWeather } from "@/lib/weather";
import { getRecentScans, getStyleStats, getHistory } from "@/lib/history";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from "recharts";

export default function Home() {
  const { t } = useTranslation();
  const profile = getProfile();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<{ temp: number; city?: string; label?: string; code?: number; wind?: number } | null>(null);

  useEffect(() => {
    getCurrentWeather().then((w) => {
      if (w) setWeather({ temp: w.temp, city: w.city, label: w.label, code: w.code, wind: w.wind });
    });
  }, []);

  const progress = Math.min(((profile?.vibers ?? 0) / 200) * 100, 100);
  const closetCount = profile?.closet?.length ?? 0;
  const featuredPiece = closetCount > 0 ? profile!.closet[0] : null;

  // Météo : visuel + phrase contextuelle
  const weatherVisual = useMemo(() => {
    if (!weather) return null;
    const c = weather.code ?? 0;
    const t = weather.temp;
    const wind = weather.wind ?? 0;

    // Catégories
    let kind: "sun" | "cloud" | "rain" | "snow" | "storm" | "fog" = "sun";
    if ([95, 96, 99].includes(c)) kind = "storm";
    else if ([71, 73, 75, 77, 85, 86].includes(c)) kind = "snow";
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(c)) kind = "rain";
    else if ([45, 48].includes(c)) kind = "fog";
    else if ([2, 3].includes(c)) kind = "cloud";
    else kind = "sun";

    const isWindy = wind >= 30;
    const isCold = t <= 5;
    const isHot = t >= 28;

    // Phrase contextuelle (priorité : extrême > pluie/neige/orage > vent > nuages > beau)
    let phrase = "";
    if (kind === "storm") phrase = "Tempête en vue. Reste à l'abri ou sort le trench imperméable.";
    else if (kind === "snow") phrase = "Il neige. Manteau chaud, écharpe en maille et bottes — on joue cocooning.";
    else if (kind === "rain") phrase = "Pluie au programme. Trench long, bottines en cuir et un parapluie élégant.";
    else if (kind === "fog") phrase = "Brouillard épais. Joue les couches sombres, écharpe XXL et silhouette mystérieuse.";
    else if (isWindy) phrase = `Du vent à ${wind} km/h. Évite les pièces volantes, mise sur des coupes ajustées.`;
    else if (isCold && kind === "cloud") phrase = "Froid et couvert. Pull en grosse maille + manteau long, ambiance sobre.";
    else if (isCold) phrase = "Il fait froid. Superpose intelligemment : sous-pull fin, pull, manteau structuré.";
    else if (isHot) phrase = "Il fait chaud. Lin, coton léger, couleurs claires — respire le style.";
    else if (kind === "cloud") phrase = "Ciel couvert. Parfait pour les tons neutres et un blazer bien coupé.";
    else phrase = "Beau temps. Sors la pièce qui te fait sentir bien, lumière naturelle au top.";

    // Override si une pièce du dressing est mise en avant
    if (featuredPiece && !["storm", "snow", "rain"].includes(kind) && !isCold) {
      phrase = `${phrase.split(".")[0]}. Et si tu sortais ton ${featuredPiece} aujourd'hui ?`;
    }

    const Icon =
      kind === "storm" ? CloudLightning
      : kind === "snow" ? CloudSnow
      : kind === "rain" ? CloudRain
      : kind === "fog" ? CloudFog
      : kind === "cloud" ? Cloud
      : isWindy ? Wind
      : Sun;

    const gradient =
      kind === "storm" ? "from-stone-700 via-stone-800 to-stone-900"
      : kind === "snow" ? "from-stone-50 via-stone-100 to-stone-200"
      : kind === "rain" ? "from-stone-400 via-stone-500 to-stone-700"
      : kind === "fog" ? "from-stone-300 via-stone-400 to-stone-500"
      : kind === "cloud" ? "from-stone-200 via-stone-300 to-stone-400"
      : isHot ? "from-amber-100 via-amber-200 to-orange-300"
      : "from-amber-50 via-stone-100 to-amber-100";

    // Texte clair seulement sur fonds vraiment foncés (storm, rain, fog)
    const textOnDark = ["storm", "rain", "fog"].includes(kind);

    return { Icon, gradient, phrase, textOnDark };
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
      {/* Header bonjour */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("home.hello")}
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-tight">
            {profile?.firstName}
          </h1>
        </div>
      </header>

      {/* Carte météo visuelle */}
      {weather && weatherVisual && (
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${weatherVisual.gradient} p-5 shadow-card`}
        >
          {/* Halo lumineux */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-black/20 blur-3xl" />

          <div className={`relative ${weatherVisual.textOnDark ? "text-white" : "text-slate-900"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 opacity-80">
                  <MapPin className="h-3 w-3" strokeWidth={2} />
                  <span className="text-xs uppercase tracking-[0.2em]">
                    {weather.city ?? t("home.location")}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1 font-mono-tech">
                  <span className="text-5xl font-bold tracking-tighter">
                    {weather.temp}
                  </span>
                  <span className="text-xl opacity-80">°C</span>
                </div>
                <p className="mt-0.5 text-xs capitalize opacity-90">
                  {weather.label}
                </p>
              </div>
              <weatherVisual.Icon className="h-14 w-14 drop-shadow-lg" strokeWidth={1.4} />
            </div>

            <p className="mt-4 font-serif text-base leading-snug">
              {weatherVisual.phrase}
            </p>
          </div>
        </div>
      )}

      {/* Widget Vibers */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <span className="font-serif text-lg leading-none text-foreground">
                {t("home.vibers")}
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
          {t("home.vibersHint")}
        </p>
      </div>

      {/* Smart Closet */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-1.5">
          <Shirt className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
          <span className="font-serif text-lg leading-none text-foreground">
            {t("home.smartCloset")}
          </span>
        </div>
        {closetCount === 0 ? (
          <>
            <p className="mt-3 text-sm leading-snug text-foreground/90">
              {t("home.closetEmpty")}
            </p>
            <button
              onClick={() => navigate("/app/profil")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-tight text-accent-foreground transition-all hover:opacity-90"
            >
              <Zap className="h-3.5 w-3.5" strokeWidth={2} />
              {t("home.addPiece")}
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-snug text-foreground/90">
              {t("home.closetCount", { count: closetCount })}
              {forgottenPiece && (
                <> {t("home.forgotten", { piece: forgottenPiece })}</>
              )}
            </p>
            <button
              onClick={() => navigate("/app/dressing", { state: { presetPiece: forgottenPiece } })}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-tight text-accent-foreground transition-all hover:opacity-90"
            >
              <Zap className="h-3.5 w-3.5" strokeWidth={2} />
              {t("home.createLookWith")}
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
              <span className="font-serif text-lg leading-none text-foreground">
                {t("home.evolution")}
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
            {t("home.lastScans", { count: scans.length })}
          </p>
        </div>
      )}

      {/* HISTORY — Carrousel des looks récents */}
      {recentLooks.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-1.5">
            <HistoryIcon className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
            <span className="font-serif text-lg leading-none text-foreground">
              {t("home.history")}
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
            <span className="font-serif text-lg leading-none text-foreground">
              {t("home.myStats")}
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