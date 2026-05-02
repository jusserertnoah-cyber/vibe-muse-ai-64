import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Camera, Zap, Trophy } from "lucide-react";

/**
 * 3 slides marketing affichées une seule fois (avant Onboarding) pour
 * présenter Vibe au premier lancement. Stockage : `vibe.intro.seen.v1`.
 */
const KEY = "vibe.intro.seen.v1";

export const hasSeenIntro = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};
const markSeen = () => { try { localStorage.setItem(KEY, "1"); } catch {} };

interface Slide {
  num: string;
  title: string;
  desc: string;
  illu: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    num: "01 — Scanne",
    title: "Prends ton look en photo.",
    desc: "L'IA analyse ton fit en quelques secondes. Couleurs, coupe, tendance 2026 — elle voit tout.",
    illu: (
      <div className="relative flex h-52 w-full items-center justify-center rounded-2xl bg-card">
        <Camera className="h-16 w-16 text-white/80" strokeWidth={1.4} />
        <span className="absolute right-3 top-3 rounded-full bg-neon px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-neon-foreground">
          IA
        </span>
      </div>
    ),
  },
  {
    num: "02 — Reçois ta note",
    title: "Sévère mais juste. Toujours.",
    desc: "Pas de compliments vides. Une vraie note sur 10, avec les points à améliorer pour passer au niveau supérieur.",
    illu: (
      <div className="relative flex h-52 w-full items-center justify-center rounded-2xl bg-card">
        <Zap className="h-16 w-16 text-neon" strokeWidth={1.4} />
        <span className="absolute right-3 top-3 rounded-full bg-neon px-2 py-0.5 font-mono text-[11px] font-bold text-neon-foreground">
          9.4
        </span>
      </div>
    ),
  },
  {
    num: "03 — Grimpe",
    title: "Défi du jour. Top Vibes. Badges.",
    desc: "Un défi chaque matin, des missions story, un classement communautaire. Le style devient un jeu.",
    illu: (
      <div className="flex h-52 w-full items-center justify-center rounded-2xl bg-neon">
        <Trophy className="h-16 w-16 text-neon-foreground" strokeWidth={1.6} />
      </div>
    ),
  },
];

export const IntroSlides = ({ onDone }: { onDone: () => void }) => {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const isLast = i === SLIDES.length - 1;

  const next = () => {
    if (isLast) {
      markSeen();
      onDone();
    } else {
      setI(i + 1);
    }
  };

  const skip = () => {
    markSeen();
    onDone();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <span
            className="text-2xl font-extrabold lowercase tracking-tight text-neon"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            vibe.
          </span>
          <button
            onClick={skip}
            className="text-xs uppercase tracking-widest text-muted-foreground transition hover:text-foreground"
          >
            Passer
          </button>
        </header>

        {/* Progress bar — 3 segments */}
        <div className="mt-6 flex gap-1.5">
          {SLIDES.map((_, k) => (
            <div
              key={k}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${k <= i ? "bg-neon" : "bg-border"}`}
            />
          ))}
        </div>

        {/* Slide content with translateX transition */}
        <div className="mt-12 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
              className="space-y-6"
            >
              {slide.illu}
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-neon">
                {slide.num}
              </p>
              <h1
                className="text-3xl leading-tight text-foreground"
                style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                {slide.title}
              </h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {slide.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pb-4 pt-6">
          <button
            onClick={next}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-neon text-base font-semibold text-neon-foreground transition-transform duration-150 active:scale-95"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {isLast ? "Créer mon profil" : "Continuer"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
