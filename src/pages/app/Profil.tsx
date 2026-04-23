import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Crown, History, LogOut, Mic, Plus, Settings, Shirt, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, clearProfile, updateProfile } from "@/lib/profile";
import { toast } from "sonner";
import { getHistory } from "@/lib/history";

export default function Profil() {
  const { t } = useTranslation();
  const profile = getProfile();
  const navigate = useNavigate();
  const [closet, setCloset] = useState<string[]>(profile?.closet ?? []);
  const [newPiece, setNewPiece] = useState("");
  const looks = getHistory().filter((h) => h.imageUrl);

  const reset = () => {
    clearProfile();
    navigate("/onboarding", { replace: true });
  };

  const addPiece = () => {
    const v = newPiece.trim();
    if (!v) return;
    const next = [...closet, v];
    setCloset(next);
    updateProfile({ closet: next });
    setNewPiece("");
    toast.success(`Ajouté à ton Vibe Closet : ${v}`);
  };

  const removePiece = (idx: number) => {
    const next = closet.filter((_, i) => i !== idx);
    setCloset(next);
    updateProfile({ closet: next });
  };

  const onMic = () => toast("Enregistrement vocal — branché à l'étape suivante");

  return (
    <div className="space-y-6 px-5 pt-8">
      <header className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent font-serif text-3xl text-accent-foreground shadow-cobalt">
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
          <Crown className="h-4 w-4 text-accent" />
          <span className="text-xs uppercase tracking-widest">{t("profile.premium")}</span>
        </div>
        <p className="mt-2 font-serif text-2xl">Essai 7 jours gratuit</p>
        <p className="mt-1 text-xs text-background/70">
          1 scan + 1 génération par jour, sans carte bancaire.
        </p>
        <Button
          onClick={() => navigate("/app/paywall")}
          className="mt-4 h-11 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {t("profile.subscriptions")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Trophy className="h-4 w-4" />} label="Vibers" value={profile?.vibers ?? 0} />
        <Stat icon={<History className="h-4 w-4" />} label="Looks" value={looks.length} />
      </div>

      {/* Looks — historique visuel */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium">Mes looks</span>
        </div>
        {looks.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Tes tenues générées et tes scans apparaîtront ici.
          </p>
        ) : (
          <div className="-mx-5 mt-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 px-5">
              {looks.slice(0, 12).map((item) => (
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
        )}
      </section>

      {/* Vibe Closet */}
      <section className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shirt className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{t("profile.closet")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {closet.length === 0 ? t("profile.closetEmpty") : `${closet.length} pièces`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onMic} className="rounded-full">
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        {closet.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {closet.map((p, i) => (
              <li
                key={`${p}-${i}`}
                className="group flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs"
              >
                {p}
                <button onClick={() => removePiece(i)} aria-label={`Retirer ${p}`}>
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={newPiece}
            onChange={(e) => setNewPiece(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPiece()}
            placeholder="Ex : pull cachemire crème"
            className="h-11 flex-1 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-accent"
          />
          <Button onClick={addPiece} size="icon" className="h-11 w-11 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <ul className="space-y-2">
        <Row icon={<History className="h-5 w-5" />} label="Historique des Vibers" />
        <Row
          icon={<Settings className="h-5 w-5" />}
          label={t("profile.settings", { defaultValue: "Paramètres" })}
          onClick={() => navigate("/app/settings")}
        />
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

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="rounded-3xl border border-border bg-card p-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-[10px] uppercase tracking-widest">{label}</span>
    </div>
    <div className="mt-2 font-mono-tech text-2xl font-bold tracking-tight">{value}</div>
  </div>
);

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