import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getProfile } from "@/lib/profile";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, MapPin, Zap, Flame } from "lucide-react";
import { getCurrentWeather } from "@/lib/weather";
import { MissionStory } from "@/components/vibe/MissionStory";
import { audienceFromGender, getDailyChallenge, getLocalizedChallenge } from "@/lib/challenges";
import { ChallengeDetailDialog } from "@/components/vibe/ChallengeDetailDialog";

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const profile = getProfile();
  const [weather, setWeather] = useState<{ temp: number; city?: string; label?: string; code?: number; wind?: number } | null>(null);
  // Le défi du jour s'adapte à la météo (chaud / mi-saison / froid).
  const challenge = useMemo(
    () => getLocalizedChallenge(getDailyChallenge(audienceFromGender(profile?.gender), new Date(), weather?.temp ?? null)),
    [weather?.temp, profile?.gender, i18n.language],
  );
  const [challengeOpen, setChallengeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getCurrentWeather().then((w) => {
        if (!cancelled && w) setWeather({ temp: w.temp, city: w.city, label: w.label, code: w.code, wind: w.wind });
      });
    load();
    // Auto-refresh toutes les 5 min + à chaque retour sur l'onglet
    const id = setInterval(load, 5 * 60 * 1000);
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [i18n.language]);

  const credits = profile?.vibers ?? 0;
  const closetCount = profile?.closet?.length ?? 0;
  const featuredPiece = closetCount > 0 ? profile!.closet[0] : null;

  // Météo : visuel + phrase contextuelle
  const weatherVisual = useMemo(() => {
    if (!weather) return null;
    const c = weather.code ?? 0;
    const temp = weather.temp;
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
    const isCold = temp <= 5;
    const isHot = temp >= 28;

    // Phrase contextuelle traduite
    let phrase = "";
    if (kind === "storm") phrase = t("home.weather.storm");
    else if (kind === "snow") phrase = t("home.weather.snow");
    else if (kind === "rain") phrase = t("home.weather.rain");
    else if (kind === "fog") phrase = t("home.weather.fog");
    else if (isWindy) phrase = t("home.weather.windy", { wind });
    else if (isCold && kind === "cloud") phrase = t("home.weather.coldCloud");
    else if (isCold) phrase = t("home.weather.cold");
    else if (isHot) phrase = t("home.weather.hot");
    else if (kind === "cloud") phrase = t("home.weather.cloud");
    else phrase = t("home.weather.sun");

    // Override si une pièce du dressing est mise en avant
    if (featuredPiece && !["storm", "snow", "rain"].includes(kind) && !isCold) {
      phrase = `${phrase} ${t("home.weather.featuredAddon", { piece: featuredPiece })}`;
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

    return { Icon, gradient, phrase, textOnDark, kind, isWindy };
  }, [weather, featuredPiece, t]);

  return (
    <div className="space-y-6 px-5 pt-8">
      {/* Header bonjour + Capsule Crédits */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("home.hello")}
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-tight">
            {profile?.firstName}
          </h1>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 font-mono-tech text-sm font-bold text-accent-foreground shadow-brand">
          <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
          {t("home.credits")}&nbsp;: {credits}
        </div>
      </header>

      {/* Bandeau Défi du jour — TOUT EN HAUT (au-dessus de la météo) */}
      <button
        onClick={() => setChallengeOpen(true)}
        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-3xl bg-gradient-brand p-5 text-left shadow-brand active:scale-[0.99]"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-foreground/10">
          <Flame className="h-7 w-7 text-foreground" strokeWidth={1.6} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/70">{t("home.dailyChallenge")}</p>
          <p className="mt-0.5 truncate font-serif text-xl">{challenge.name}</p>
          <p className="mt-0.5 truncate text-xs text-foreground/80">{challenge.hint}</p>
        </div>
        <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-foreground/70 sm:block">{t("home.scanReward")}</span>
      </button>

      {/* Carte météo visuelle */}
      {weather && weatherVisual && (
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${weatherVisual.gradient} p-5 shadow-card`}
        >
          {/* Animations de fond selon la météo */}
          <WeatherFx kind={weatherVisual.kind} isWindy={weatherVisual.isWindy} />

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

      {/* Mission Story — Jauge récompense */}
      <MissionStory />

      <ChallengeDetailDialog
        open={challengeOpen}
        onOpenChange={setChallengeOpen}
        challenge={challenge}
        onScan={() => { setChallengeOpen(false); navigate("/app/scan"); }}
      />
    </div>
  );
}

// ─── Effets météo en fond ───────────────────────────────────────────────
function WeatherFx({ kind, isWindy }: { kind: string; isWindy: boolean }) {
  if (kind === "sun") {
    return (
      <>
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 animate-pulse rounded-full bg-yellow-300/60 blur-3xl" />
        <div className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full bg-yellow-200/40 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 opacity-40">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white"
              style={{
                top: `${10 + (i * 11) % 80}%`,
                left: `${(i * 23) % 90}%`,
                animation: `vibe-twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>
      </>
    );
  }
  if (kind === "cloud" || kind === "fog") {
    return (
      <>
        <div
          className="pointer-events-none absolute -left-10 top-4 h-20 w-40 rounded-full bg-white/40 blur-2xl"
          style={{ animation: "vibe-drift 18s linear infinite" }}
        />
        <div
          className="pointer-events-none absolute right-0 top-16 h-16 w-32 rounded-full bg-white/30 blur-2xl"
          style={{ animation: "vibe-drift 24s linear infinite reverse" }}
        />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-24 w-48 rounded-full bg-stone-500/30 blur-3xl" />
      </>
    );
  }
  if (kind === "rain") {
    return (
      <>
        <div className="pointer-events-none absolute -left-6 top-2 h-16 w-32 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="absolute h-6 w-px bg-white/50"
              style={{
                left: `${(i * 7) % 100}%`,
                top: "-10%",
                animation: `vibe-rain ${0.6 + (i % 4) * 0.15}s linear ${i * 0.07}s infinite`,
              }}
            />
          ))}
        </div>
      </>
    );
  }
  if (kind === "snow") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-white"
            style={{
              left: `${(i * 11) % 100}%`,
              top: "-10%",
              animation: `vibe-snow ${4 + (i % 5)}s linear ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }
  if (kind === "storm") {
    return (
      <>
        <div
          className="pointer-events-none absolute inset-0 bg-white/0"
          style={{ animation: "vibe-flash 5s ease-in-out infinite" }}
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <span
              key={i}
              className="absolute h-8 w-px bg-white/60"
              style={{
                left: `${(i * 9) % 100}%`,
                top: "-10%",
                animation: `vibe-rain ${0.5 + (i % 3) * 0.1}s linear ${i * 0.05}s infinite`,
              }}
            />
          ))}
        </div>
      </>
    );
  }
  if (isWindy) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute h-px bg-white/50"
            style={{
              top: `${15 + i * 12}%`,
              left: "-20%",
              width: `${40 + (i * 17) % 40}%`,
              animation: `vibe-wind ${3 + (i % 3)}s linear ${i * 0.4}s infinite`,
            }}
          />
        ))}
      </div>
    );
  }
  return null;
}