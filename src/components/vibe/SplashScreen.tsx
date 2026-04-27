import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const LETTERS = ["V", "I", "B", "E"];
const LIME = "#DFFF00";

// Durée totale du splash : 4 lettres × 700ms = 2.8s avant la sortie.
const STEP_MS = 700;

export const SplashScreen = ({ onDone }: { onDone?: () => void }) => {
  // Index de la prochaine lettre à retirer (0 → 4). Quand il atteint
  // LETTERS.length, on déclenche la sortie + onDone.
  const [removed, setRemoved] = useState(0);

  useEffect(() => {
    if (removed >= LETTERS.length) {
      // Dernière lettre partie → on prévient l'app que l'accueil peut arriver.
      onDone?.();
      return;
    }
    const t = setTimeout(() => setRemoved((n) => n + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [removed, onDone]);

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Logo VIBE — chaque lettre s'efface une par une au rythme du chargement.
          Quand la dernière disparaît → onDone() → l'accueil prend le relais.
          NB : on espace clairement les lettres pour éviter tout chevauchement
          visuel (sinon le "I" + "B" peuvent ressembler à un "J"). */}
      <div className="flex items-baseline" style={{ gap: "0.18em" }}>
        {LETTERS.map((letter, i) => {
          const isGone = i < removed;
          return (
            <motion.span
              key={`${letter}-${i}`}
              initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
              animate={
                isGone
                  ? { opacity: 0, y: -16, filter: "blur(8px)", scale: 0.9 }
                  : { opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }
              }
              transition={{
                duration: isGone ? 0.45 : 0.55,
                delay: isGone ? 0 : 0.1 + i * 0.12,
                ease: [0.65, 0, 0.35, 1],
              }}
              className="font-black text-white inline-block"
              style={{
                fontSize: "clamp(4rem, 16vw, 7rem)",
                lineHeight: 1,
                fontFamily: "Inter, system-ui, sans-serif",
                letterSpacing: "0.04em",
                textShadow: `0 0 18px ${LIME}99, 0 0 36px ${LIME}55`,
              }}
            >
              {letter}
            </motion.span>
          );
        })}
      </div>

      {/* Barre fine — se remplit en synchro avec les lettres qui partent. */}
      <div
        className="mt-10 h-[2px] w-48 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Chargement"
      >
        <motion.div
          initial={false}
          animate={{ width: `${(removed / LETTERS.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full"
          style={{
            background: LIME,
            boxShadow: `0 0 8px ${LIME}, 0 0 16px ${LIME}80`,
          }}
        />
      </div>
    </motion.div>
  );
};
