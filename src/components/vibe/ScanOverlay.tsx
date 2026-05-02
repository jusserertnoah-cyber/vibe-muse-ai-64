import { useEffect, useState } from "react";

/**
 * Overlay plein écran pendant le scan d'une tenue.
 * - Fond blanc premium
 * - Photo de l'utilisateur avec effet Ken Burns (zoom lent continu)
 * - Laser horizontal jaune néon qui monte/descend en boucle
 * - Jauge verticale "liquide jaune" qui se remplit avec vaguelette
 * - À la fin (score reçu) : photo blur + score fade-in/scale-in
 */
export const ScanOverlay = ({
  imageUrl,
  open,
  finishingScore,
  onDone,
}: {
  imageUrl: string;
  open: boolean;
  /** Quand renseigné → on lance la séquence de fin (blur photo + score animé). */
  finishingScore: number | null;
  /** Appelé une fois l'animation de fin terminée pour fermer l'overlay. */
  onDone: () => void;
}) => {
  const [progress, setProgress] = useState(0); // 0..95 simulé pendant l'analyse
  const [counter, setCounter] = useState(0);

  // Progression simulée (jauge liquide) — plafonne à 95% tant qu'on n'a pas la note.
  useEffect(() => {
    if (!open) { setProgress(0); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      // Courbe douce qui plafonne vers 95% en ~8s.
      const target = 95 * (1 - Math.exp(-elapsed / 3.5));
      setProgress((p) => (finishingScore != null ? 100 : Math.max(p, target)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, finishingScore]);

  // Animation du compteur 0 → score
  useEffect(() => {
    if (finishingScore == null) { setCounter(0); return; }
    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCounter(Math.round(eased * finishingScore * 10) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const closeTimer = setTimeout(() => onDone(), duration + 1400);
    return () => { cancelAnimationFrame(raf); clearTimeout(closeTimer); };
  }, [finishingScore, onDone]);

  if (!open) return null;

  const finishing = finishingScore != null;
  const scoreColor =
    finishingScore == null
      ? "hsl(var(--foreground))"
      : finishingScore >= 8
      ? "hsl(140 70% 35%)"   // vert "top"
      : finishingScore >= 6.5
      ? "hsl(var(--foreground))"
      : "hsl(0 75% 50%)";    // rouge "flop"

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header minimal */}
      <div className="flex items-center justify-between px-5 py-3">
        <span className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          VIBE · scan en cours
        </span>
        <span className="font-mono-tech text-xs font-semibold text-foreground">
          {Math.floor(progress)}%
        </span>
      </div>

      {/* Zone photo + laser + jauge */}
      <div className="relative flex-1 overflow-hidden px-5 pb-6">
        <div className="relative mx-auto h-full w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border">
          {/* Photo Ken Burns + blur final */}
          <img
            src={imageUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-700 ${finishing ? "blur-md scale-110" : ""}`}
            style={{
              animation: finishing ? undefined : "vibeKenBurns 14s ease-in-out infinite alternate",
            }}
          />

          {/* Laser horizontal jaune néon */}
          {!finishing && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-[3px] mix-blend-screen"
              style={{
                top: 0,
                background:
                  "linear-gradient(90deg, transparent 0%, hsl(var(--accent)) 20%, #fff 50%, hsl(var(--accent)) 80%, transparent 100%)",
                boxShadow:
                  "0 0 14px hsl(var(--accent)), 0 0 30px hsl(var(--accent)), 0 0 60px hsl(var(--accent) / 0.6)",
                animation: "vibeLaser 2.4s ease-in-out infinite",
              }}
            />
          )}

          {/* Jauge liquide verticale (à droite) */}
          {!finishing && (
            <div className="absolute right-3 top-3 bottom-3 w-3 overflow-hidden rounded-full border border-border bg-card/70 backdrop-blur">
              <div
                className="absolute inset-x-0 bottom-0 transition-[height] duration-500 ease-out"
                style={{
                  height: `${progress}%`,
                  background:
                    "linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(60 100% 60%) 100%)",
                  boxShadow: "0 0 12px hsl(var(--accent) / 0.7)",
                }}
              >
                {/* vaguelette */}
                <div
                  className="absolute -top-1 left-0 right-0 h-2 opacity-90"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 50%, #fff8 0 35%, transparent 36%), radial-gradient(ellipse at 70% 50%, #fff6 0 40%, transparent 41%)",
                    animation: "vibeWave 1.4s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
          )}

          {/* Score final fade-in/scale + micro-vibration (haptic visuel) */}
          {finishing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="vibe-haptic rounded-xl border border-border bg-card px-8 py-6 text-center shadow-brand"
                style={{
                  animation: "vibeScoreIn 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both, vibeHaptic 0.45s 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
                }}
              >
                <p className="font-mono-tech text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Vibe Score
                </p>
                <p
                  className="mt-1 font-mono-tech text-7xl font-bold leading-none tracking-tighter"
                  style={{ color: scoreColor }}
                >
                  {counter.toFixed(1)}
                  <span className="text-2xl text-muted-foreground">/10</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tagline */}
        <p className="mt-4 text-center font-serif text-sm italic text-muted-foreground">
          {finishing ? "Verdict prêt." : "L'IA Vibe analyse ta tenue…"}
        </p>
      </div>

      {/* Keyframes locales — évite de polluer index.css */}
      <style>{`
        @keyframes vibeKenBurns {
          0%   { transform: scale(1) translate(0,0); }
          50%  { transform: scale(1.08) translate(-1.5%, -1%); }
          100% { transform: scale(1.12) translate(1%, 1.5%); }
        }
        @keyframes vibeLaser {
          0%   { top: 0%;   opacity: 0.4; }
          15%  { opacity: 1; }
          50%  { top: 98%;  opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 0%;   opacity: 0.4; }
        }
        @keyframes vibeWave {
          0%, 100% { transform: translateX(-10%); }
          50%      { transform: translateX(10%); }
        }
        @keyframes vibeScoreIn {
          0%   { opacity: 0; transform: scale(1.25); filter: blur(8px); }
          100% { opacity: 1; transform: scale(1);    filter: blur(0); }
        }
      `}</style>
    </div>
  );
};