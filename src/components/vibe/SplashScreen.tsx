import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Splash "cercle pulsant" : 2.4s puis fade out 0.6s.
const TOTAL_MS = 2400;
const NEON = "#CCFF00";

export const SplashScreen = ({ onDone }: { onDone?: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      onDone?.();
    }, TOTAL_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={{ opacity: show ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Logo central — anneaux concentriques pulsants + V néon */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {/* Anneau extérieur 200px (très soft) */}
        <span
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: "rgba(204,255,0,0.07)",
            animation: "ringPulseSoft 2.6s ease-in-out infinite 0.4s",
          }}
        />
        {/* Anneau 160px */}
        <span
          className="absolute rounded-full border"
          style={{
            width: 160, height: 160,
            borderColor: "rgba(204,255,0,0.15)",
            animation: "ringPulseSoft 2.2s ease-in-out infinite 0.2s",
          }}
        />
        {/* Anneau 120px (plein, premier plan) */}
        <span
          className="absolute flex items-center justify-center rounded-full border-2"
          style={{
            width: 120, height: 120,
            borderColor: "#2a2a2a",
            animation: "ringPulse 1.8s ease-in-out infinite",
          }}
        >
          {/* Cercle plein néon avec V */}
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 80, height: 80,
              background: NEON,
              boxShadow: `0 0 32px ${NEON}99, 0 0 64px ${NEON}55`,
            }}
          >
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 32,
                color: "#0a0a0a",
                letterSpacing: "-0.02em",
              }}
            >
              V
            </span>
          </span>
        </span>
      </div>

      {/* Wordmark + tagline */}
      <div className="mt-12 flex flex-col items-center" style={{ animation: "fadeUp 0.6s ease 0.2s both" }}>
        <span
          className="text-white"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: "0.12em",
          }}
        >
          VIBE
        </span>
        <span
          className="mt-3 text-[11px] uppercase"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "#888",
            letterSpacing: "0.3em",
            fontWeight: 500,
          }}
        >
          note ton style
        </span>
      </div>

      {/* 3 dots loader */}
      <div className="mt-12 flex gap-2.5" aria-label="Chargement" role="progressbar">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1.5 w-1.5 rounded-full"
            style={{
              background: "#2a2a2a",
              animation: `dotPulse 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
