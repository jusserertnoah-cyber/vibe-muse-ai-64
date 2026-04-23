import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bell,
  CreditCard,
  FileText,
  Globe,
  Ruler,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Check,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getProfile, updateProfile, clearProfile } from "@/lib/profile";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { THEMES, getSavedTheme, setTheme, resolveTheme, type ThemeName } from "@/lib/theme";

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3 rounded-3xl border border-border bg-card p-5">
    <div className="flex items-center gap-2 text-accent">
      {icon}
      <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">
        {title}
      </h2>
    </div>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1 block text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    {children}
  </label>
);

const Row = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left text-sm"
  >
    <span className="text-muted-foreground">{icon}</span>
    <span className="flex-1">{label}</span>
    <span className="text-muted-foreground">›</span>
  </button>
);

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const profile = getProfile();
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [heightCm, setHeightCm] = useState(profile?.heightCm?.toString() ?? "");
  const [weightKg, setWeightKg] = useState(profile?.weightKg?.toString() ?? "");
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [showLang, setShowLang] = useState(false);
  const [morningTip, setMorningTip] = useState(
    () => localStorage.getItem("vibe.morningTip") === "1",
  );
  const [units, setUnits] = useState<"metric" | "imperial">(
    () => (localStorage.getItem("vibe.units") as any) ?? "metric",
  );
  const [theme, setThemeState] = useState<ThemeName>(() => getSavedTheme() ?? resolveTheme());

  const chooseTheme = (t: ThemeName) => {
    setThemeState(t);
    setTheme(t);
  };

  const save = () => {
    updateProfile({
      firstName: firstName.trim() || profile?.firstName || "Vibe",
      email: email.trim() || undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      age: age ? Number(age) : undefined,
    });
    toast.success(t("settings.saved"));
  };

  const toggleMorning = (v: boolean) => {
    setMorningTip(v);
    localStorage.setItem("vibe.morningTip", v ? "1" : "0");
  };

  const setUnit = (u: "metric" | "imperial") => {
    setUnits(u);
    localStorage.setItem("vibe.units", u);
  };

  const deleteAccount = () => {
    if (!confirm(t("settings.delete") + " ?")) return;
    clearProfile();
    navigate("/onboarding", { replace: true });
  };

  return (
    <div className="space-y-6 px-5 pt-6 pb-32">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-serif text-2xl">{t("settings.title")}</h1>
      </header>

      {/* Account */}
      <Section icon={<UserIcon className="h-4 w-4" />} title={t("settings.account")}>
        <Field label={t("settings.firstName")}>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-11 rounded-xl border-border bg-background"
          />
        </Field>
        <Field label={t("settings.email")}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="h-11 rounded-xl border-border bg-background"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("settings.height")}>
            <Input
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className="h-11 rounded-xl border-border bg-background"
            />
          </Field>
          <Field label={t("settings.weight")}>
            <Input
              type="number"
              inputMode="numeric"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="h-11 rounded-xl border-border bg-background"
            />
          </Field>
        </div>
        <Field label="Âge">
          <Input
            type="number"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            className="h-11 rounded-xl border-border bg-background"
          />
        </Field>
        <Button
          onClick={save}
          className="h-11 w-full rounded-xl bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {t("common.save")}
        </Button>
      </Section>

      {/* Language */}
      <Section icon={<Globe className="h-4 w-4" />} title={t("settings.language")}>
        <button
          onClick={() => setShowLang((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm"
        >
          <span className="flex items-center gap-2">
            {SUPPORTED_LANGUAGES.find((l) => i18n.language?.startsWith(l.code))?.flag}{" "}
            {SUPPORTED_LANGUAGES.find((l) => i18n.language?.startsWith(l.code))?.label}
          </span>
          <span className="text-muted-foreground">›</span>
        </button>
        {showLang && (
          <div className="mt-2 flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGES.map((l) => {
              const active = i18n.language?.startsWith(l.code);
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    i18n.changeLanguage(l.code);
                    setShowLang(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                    active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background",
                  )}
                >
                  <span>{l.flag}</span>
                  {l.label}
                  {active && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* Theme */}
      <Section icon={<Palette className="h-4 w-4" />} title="Thème">
        <p className="text-xs text-muted-foreground">
          Choisis l'accent couleur de l'app. La base reste crème, blanc et noir.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((th) => {
            const active = theme === th.id;
            return (
              <button
                key={th.id}
                onClick={() => chooseTheme(th.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all",
                  active ? "border-accent bg-accent/10" : "border-border bg-background hover:border-accent/40",
                )}
              >
                <span
                  className="h-8 w-8 rounded-full ring-1 ring-border"
                  style={{ background: th.swatch }}
                />
                <span className="text-[11px] font-medium">{th.label}</span>
                {active && <Check className="h-3 w-3 text-accent" />}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Subscription (real) */}
      <Section icon={<CreditCard className="h-4 w-4" />} title={t("settings.subscription")}>
        <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm">
          <span className="text-muted-foreground">Status</span>
          <span className="font-medium">{t("settings.free")}</span>
        </div>
        <Button
          variant="outline"
          onClick={() => toast(t("settings.stripeSoon"))}
          className="h-11 w-full rounded-xl"
        >
          {t("settings.manage")}
        </Button>
      </Section>

      {/* Preferences */}
      <Section icon={<Bell className="h-4 w-4" />} title={t("settings.preferences")}>
        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
          <span className="text-sm">{t("settings.morningTip")}</span>
          <Switch checked={morningTip} onCheckedChange={toggleMorning} />
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Ruler className="h-3.5 w-3.5" />
            {t("settings.units")}
          </div>
          <div className="flex gap-2">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={cn(
                  "flex-1 rounded-lg border px-3 py-2 text-xs font-medium",
                  units === u
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background",
                )}
              >
                {t(`settings.${u}`)}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Legal */}
      <Section icon={<ShieldCheck className="h-4 w-4" />} title={t("settings.legal")}>
        <Row icon={<FileText className="h-4 w-4" />} label={t("settings.privacy")} onClick={() => toast("Bientôt")} />
        <Row icon={<FileText className="h-4 w-4" />} label={t("settings.terms")} onClick={() => toast("Bientôt")} />
      </Section>

      <button
        onClick={deleteAccount}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        {t("settings.delete")}
      </button>
    </div>
  );
}