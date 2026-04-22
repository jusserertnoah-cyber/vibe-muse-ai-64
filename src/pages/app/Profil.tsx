import { getProfile, clearProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Crown, History, LogOut, Settings, Trophy } from "lucide-react";

export default function Profil() {
  const profile = getProfile();
  const navigate = useNavigate();

  const reset = () => {
    clearProfile();
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="space-y-6 px-5 pt-8">
      <header className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary font-serif text-3xl text-foreground">
          {profile?.firstName?.[0]?.toUpperCase()}
        </div>
        <h1 className="mt-3 font-serif text-2xl">{profile?.firstName}</h1>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {profile?.styles.slice(0, 3).join(" · ")}
        </p>
      </header>

      {/* Premium card */}
      <div className="rounded-3xl bg-foreground p-5 text-background shadow-soft">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          <span className="text-xs uppercase tracking-widest">Premium</span>
        </div>
        <p className="mt-2 font-serif text-2xl">Essai 7 jours gratuit</p>
        <p className="mt-1 text-xs text-background/70">
          1 scan + 1 génération par jour, sans carte bancaire.
        </p>
        <Button
          variant="secondary"
          className="mt-4 h-11 w-full rounded-2xl text-foreground"
        >
          Voir les abonnements
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Trophy className="h-4 w-4" />} label="Vibers" value={profile?.vibers ?? 0} />
        <Stat icon={<History className="h-4 w-4" />} label="Looks" value={0} />
      </div>

      <ul className="space-y-2">
        <Row icon={<History className="h-5 w-5" />} label="Historique des Vibers" />
        <Row icon={<Settings className="h-5 w-5" />} label="Paramètres" />
      </ul>

      <button
        onClick={reset}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground"
      >
        <LogOut className="h-4 w-4" />
        Réinitialiser le profil
      </button>
    </div>
  );
}

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) => (
  <div className="rounded-3xl border border-border bg-card p-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-[10px] uppercase tracking-widest">{label}</span>
    </div>
    <div className="mt-2 font-serif text-2xl">{value}</div>
  </div>
);

const Row = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <li>
    <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-muted-foreground">›</span>
    </button>
  </li>
);