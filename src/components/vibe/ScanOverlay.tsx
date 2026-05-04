import { useEffect, useState } from "react";

const PHASES = [
  "Analyse du fit...",
  "Lecture des couleurs...",
  "Tendances 2026...",
  "Calcul du score final...",
];

/**
 * Overlay plein écran pendant le scan d'une tenue.
 * - Photo en fond (assombrie)
 * - Cercle de progression qui se remplit avec le pourcent au centre
 * - Messages d'étapes qui changent toutes ~2s
 * - Barre de progression chartreuse en bas
 * - À la fin (score reçu) : score animé count-up
 */
export const ScanOverlay = ({
  imageUrl,
  open,
  finishingScore,
  onDone,
}: {
  imageUrl: string;
  open: boolean;
  finishingScore: number | null;
  onDone: () => void;
}) => {
  const [progress, setProgress] = useState(0);
  const [counter, setCounter] = useState(0);
  const [phaseIdx, setPhaseIdx] = useState(0);

  // Progression simulée — plafonne à 95% tant qu'on n'a pas la note.
  useEffect(() => {
    if (!open) { setProgress(0); setPhaseIdx(0); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const target = 95 * (1 - Math.exp(-elapsed / 3.5));
      setProgress((p) => (finishingScore != null ? 100 : Math.max(p, target)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, finishingScore]);

  // Rotation des messages toutes les 2s
  useEffect(() => {
    if (!open || finishingScore != null) return;
    const id = setInterval(() => {
      setPhaseIdx((i) => Math.min(i + 1, PHASES.length - 1));
    }, 2000);
    return () => clearInterval(id);
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
  const pct = Math.floor(progress);

  // Cercle SVG
  const size = 200;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (progress / 100);

  const scoreColor =
    finishingScore == null
      ? "#F0F0EB"
      : finishingScore >= 8
      ? "#C8F135"
      : finishingScore >= 6.5
      ? "#F0F0EB"
      : "#E05252";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        backgroundColor: "#0A0A0A",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Photo en fond plein écran, assombrie */}
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: finishing ? "blur(14px) brightness(0.35)" : "blur(2px) brightness(0.45)", transition: "filter 600ms ease" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.85) 100%)" }} />
        </>
      )}

      {/* Contenu centré */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6">
        {!finishing ? (
          <>
            {/* Cercle de progression avec % au centre */}
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke="rgba(240,240,235,0.12)"
                  strokeWidth={stroke}
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke="#C8F135"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${c}`}
                  style={{
                    transition: "stroke-dasharray 500ms cubic-bezier(0.2,0.7,0.2,1)",
                    filter: "drop-shadow(0 0 8px rgba(200,241,53,0.5))",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  style={{
                    fontFamily: "'Azeret Mono', ui-monospace, monospace",
                    fontWeight: 700,
                    fontSize: 44,
                    letterSpacing: "-0.03em",
                    color: "#F0F0EB",
                  }}
                >
                  {pct}
                  <span style={{ fontSize: 20, color: "#5A5A5A" }}>%</span>
                </span>
              </div>
            </div>

            {/* Message d'étape */}
            <p
              key={phaseIdx}
              className="mt-10 text-center"
              style={{
                fontFamily: "'Azeret Mono', ui-monospace, monospace",
                fontWeight: 500,
                fontSize: 15,
                letterSpacing: "0.02em",
                color: "#F0F0EB",
                animation: "count-up 0.4s ease both",
              }}
            >
              {PHASES[phaseIdx]}
            </p>

            {/* Barre de progression chartreuse */}
            <div
              className="mt-6 h-1 w-full max-w-[260px] overflow-hidden"
              style={{ borderRadius: 100, backgroundColor: "rgba(240,240,235,0.10)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "#C8F135",
                  borderRadius: 100,
                  boxShadow: "0 0 12px rgba(200,241,53,0.6)",
                  transition: "width 500ms cubic-bezier(0.2,0.7,0.2,1)",
                }}
              />
            </div>
          </>
        ) : (
          <div
            className="text-center"
            style={{ animation: "count-up 0.7s cubic-bezier(0.2,0.7,0.2,1) both" }}
          >
            <p
              style={{
                fontFamily: "'Azeret Mono', ui-monospace, monospace",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#5A5A5A",
              }}
            >
              Vibe Score
            </p>
            <p
              style={{
                fontFamily: "'Azeret Mono', ui-monospace, monospace",
                fontWeight: 700,
                fontSize: 96,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: scoreColor,
                marginTop: 8,
              }}
            >
              {counter.toFixed(1)}
              <span style={{ fontSize: 28, color: "#5A5A5A" }}>/10</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
