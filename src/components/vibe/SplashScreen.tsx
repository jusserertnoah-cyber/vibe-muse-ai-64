import { motion } from "framer-motion";

const LETTERS = ["V", "I", "B", "E"];
const LIME = "#DFFF00";

export const SplashScreen = ({ onDone }: { onDone?: () => void }) => {
  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      exit={{ y: "-100%", opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Logo VIBE — lettres apparaissent une par une avec lueur lime */}
      <div className="flex items-center gap-1">
        {LETTERS.map((letter, i) => (
          <motion.span
            key={letter}
            initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              textShadow: [
                `0 0 0px ${LIME}`,
                `0 0 24px ${LIME}, 0 0 48px ${LIME}80`,
                `0 0 12px ${LIME}, 0 0 32px ${LIME}40`,
              ],
            }}
            transition={{
              delay: 0.15 + i * 0.18,
              duration: 0.6,
              ease: "easeOut",
              textShadow: { duration: 1.2, delay: 0.15 + i * 0.18 },
            }}
            className="font-black text-white"
            style={{
              fontSize: "clamp(3.5rem, 14vw, 6rem)",
              letterSpacing: "0.08em",
              lineHeight: 1,
            }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Barre de progression fine — remplissage fluide 2s */}
      <div
        className="mt-10 h-[2px] w-48 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Chargement"
      >
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => onDone?.()}
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
