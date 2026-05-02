import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Crown, History, LogOut, Settings, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, clearProfile } from "@/lib/profile";
import { getHistory } from "@/lib/history";
import { supabase } from "@/integrations/supabase/client";

const LEVELS = [
  { name: "Débutant", min: 0 },
  { name: "Styliste", min: 1 },
  { name: "Trendsetter", min: 5 },
  { name: "Icône", min: 15 },
  { name: "Légende", min: 30 },
];

const getLevelInfo = (scans: number) => {
  let current = LEVELS[0];
  let next: typeof LEVELS[number] | null = LEVELS[1] ?? null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (scans >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const span = next ? next.min - current.min : 1;
  const progress = next ? Math.min(100, Math.round(((scans - current.min) / span) * 100)) : 100;
  return { current, next, progress };
};

export default function Profil() {
  const { t } = useTranslation();
  const profile = getProfile();
  const navigate = useNavigate();
  const looks = getHistory().filter((h) => h.type === "scan" && h.imageUrl);
  const totalScans = getHistory().filter((h) => h.type === "scan").length;
  const { current, next, progress } = getLevelInfo(totalScans);

  const reset = () => {
    clearProfile();
    navigate("/onboarding", { replace: true });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearProfile();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="space-y-6 px-5 pt-8 card-reveal-stagger">
      <header className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-neon font-serif text-3xl text-neon-foreground shadow-brand">
          {profile?.firstName?.[0]?.toUpperCase()}
        </div>
        <h1 className="mt-3 font-serif text-2xl">{profile?.firstName}</h1>
        <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-neon">
          {current.name}
        </p>
      </header>

      {/* Niveau + barre de progression */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-neon" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Niveau</span>
          <span className="ml-auto font-mono text-sm font-bold text-foreground">
            {totalScans} scan{totalScans > 1 ? "s" : ""}
          </span>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="font-serif text-lg text-foreground">{current.name}</p>
          {next && (
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              vers {next.name}
            </p>
          )}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-neon transition-all duration-500"
            style={{ width: `${progress}%`, boxShadow: "0 0 8px hsl(var(--neon))" }}
          />
        </div>
        {next && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Encore {Math.max(0, next.min - totalScans)} scan{next.min - totalScans > 1 ? "s" : ""} pour passer {next.name}.
          </p>
        )}
      </section>

      {/* Premium card */}
      <div className="rounded-3xl bg-foreground p-5 text-background shadow-soft">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-accent" />
          <span className="text-xs uppercase tracking-widest">Crédits & abonnements</span>
        </div>
        <p className="mt-2 font-serif text-2xl">Recharge ou passe en Style Pass</p>
        <p className="mt-1 text-xs text-background/70">
          Pack Découverte ponctuel (1,99 €) ou Style Pass mensuel / trimestriel pour scanner chaque jour avec l'IA premium.
        </p>
        <Button
          onClick={() => navigate("/app/paywall")}
          className="mt-4 h-11 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Voir les offres
        </Button>
      </div>

      {/* Mon historique — aperçu cliquable */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <button
          onClick={() => navigate("/app/history")}
          className="flex w-full items-center gap-2 text-left"
        >
          <History className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">{t("profile.myScans")}</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            {looks.length > 0 && <span className="font-mono-tech">{looks.length}</span>}
            <ChevronRight className="h-4 w-4" />
          </span>
        </button>
        {looks.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("profile.scansEmpty")}
          </p>
        ) : (
          <div className="-mx-5 mt-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-5">
              {looks.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary"
                >
                  <img
                    src={item.imageUrl!}
                    alt={item.style ?? "scan"}
                    className="h-full w-full object-cover"
                  />
                  {typeof item.score === "number" && (
                    <div className="absolute right-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 font-mono-tech text-[10px] font-bold text-accent-foreground">
                      {item.score.toFixed(1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {looks.length > 0 && (
          <button
            onClick={() => navigate("/app/history")}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            {t("profile.viewAll")} <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </section>

      <ul className="space-y-2">
        <Row
          icon={<Settings className="h-5 w-5" />}
          label={t("profile.settings")}
          onClick={() => navigate("/app/settings")}
        />
      </ul>

      <button
        onClick={reset}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground"
      >
        <LogOut className="h-4 w-4" />
        {t("profile.reset")}
      </button>

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground p-4 text-sm font-medium text-background"
      >
        <LogOut className="h-4 w-4" />
        {t("profile.signOut")}
      </button>
    </div>
  );
}

const Row = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => (
  <li>
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-muted-foreground">›</span>
    </button>
  </li>
);