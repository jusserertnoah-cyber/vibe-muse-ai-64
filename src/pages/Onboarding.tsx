import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VibeLogo } from "@/components/vibe/VibeLogo";
import { saveProfile, getProfile, hydrateProfileFromDb } from "@/lib/profile";
import { getDeviceId } from "@/lib/device";
import type { Gender, UserProfile } from "@/lib/types";
import { ArrowRight, MapPin, Sparkles, Mail, ShieldCheck, Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES } from "@/i18n";

const GENDERS: { id: Gender; labelKey: string; fallback: string }[] = [
  { id: "femme", labelKey: "onboarding.gender.femme", fallback: "Femme" },
  { id: "homme", labelKey: "onboarding.gender.homme", fallback: "Homme" },
  { id: "unisexe", labelKey: "onboarding.gender.unisex", fallback: "Non-binaire / Unisexe" },
];

// Steps: 0 langue, 1 prénom, 2 genre, 3 morpho, 4 localisation, 5 email.
const TOTAL_STEPS = 6;
const EMAIL_STEP = 5;

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { session, loading } = useSession();

  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<string>(i18n.language?.split("-")[0] || "fr");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [city, setCity] = useState("");

  // Email / Magic Link
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loginOnly, setLoginOnly] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (getProfile()) {
      navigate("/app", { replace: true });
      return;
    }
    if (session?.user?.id) {
      // User just clicked the magic link. Hydrate, claim welcome pack, persist.
      (async () => {
        const p = await hydrateProfileFromDb(session.user.id);
        if (p) {
          navigate("/app", { replace: true });
          return;
        }
        // First-time user: persist their pending onboarding answers if present,
        // then attempt to claim the welcome pack (1 device = 1 pack).
        if (firstName.trim() || gender) {
          await persistAndClaim(session.user.id, session.user.email ?? undefined);
        }
      })();
    }
  }, [loading, session, navigate]);

  const persistAndClaim = async (userId: string, userEmail?: string) => {
    const profile = await persistProfile(userId, userEmail);
    try {
      const deviceId = await getDeviceId();
      const { data, error } = await supabase.functions.invoke("claim-welcome-pack", {
        body: { deviceId },
      });
      if (error) {
        toast(t("onboarding.welcome", { name: profile.firstName }));
      } else if (data?.granted) {
        toast.success(t("onboarding.welcomePackGranted", { defaultValue: "3 scans offerts ajoutés !" }));
      } else if (data?.reason === "already_claimed") {
        toast(t("onboarding.welcomePackUsed", {
          defaultValue: "Pack de bienvenue déjà utilisé sur cet appareil",
        }));
      }
    } catch {
      // Non-blocking
    }
    navigate("/app", { replace: true });
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      toast(t("onboarding.location.unavailable"));
      next();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setCity(t("onboarding.location.cityFallback"));
        toast.success(t("onboarding.location.enabled"));
        next();
      },
      () => {
        toast(t("onboarding.location.later"));
        next();
      },
      { timeout: 8000 }
    );
  };

  const persistProfile = async (userId?: string, userEmail?: string) => {
    const deviceId = await getDeviceId().catch(() => undefined);
    if (lang && i18n.language?.split("-")[0] !== lang) {
      try { await i18n.changeLanguage(lang); } catch {}
    }
    try { localStorage.setItem("vibe.lang", lang); } catch {}
    const profile: UserProfile = {
      firstName: firstName.trim() || "Vibe",
      email: userEmail,
      gender: gender ?? "unisexe",
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      age: age ? Number(age) : undefined,
      styles: [],
      city: city || undefined,
      referencePhoto: undefined,
      closet: [],
      vibers: 0,
      deviceId,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    if (userId) {
      await supabase.from("profiles").update({
        first_name: profile.firstName,
        gender: profile.gender,
        age: profile.age,
        height: profile.heightCm,
        weight: profile.weightKg,
        styles: profile.styles,
        onboarded: true,
      }).eq("id", userId);
    }
    return profile;
  };

  const sendMagicLink = async () => {
    const cleaned = email.trim().toLowerCase();
    if (!isValidEmail(cleaned)) {
      toast.error(t("onboarding.email.invalidTitle", { defaultValue: "Email invalide" }), {
        description: t("onboarding.email.invalidDesc", { defaultValue: "Vérifie ton adresse." }),
      });
      return;
    }
    setBusy(true);
    // En prod (mobile inclus), on force l'URL publiée stable plutôt que
    // window.location.origin (qui pointerait vers un preview Lovable).
    const isProd = window.location.hostname.endsWith(".lovable.app") &&
      !window.location.hostname.startsWith("id-preview--");
    const baseUrl = isProd
      ? window.location.origin
      : "https://vibe-muse-ai-64.lovable.app";
    const { error } = await supabase.auth.signInWithOtp({
      email: cleaned,
      options: {
        emailRedirectTo: `${baseUrl}/onboarding`,
        shouldCreateUser: !loginOnly,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(t("onboarding.email.errorTitle", { defaultValue: "Envoi impossible" }), {
        description: error.message,
      });
      return;
    }
    setLinkSent(true);
    toast.success(t("onboarding.email.sentTitle", { defaultValue: "Lien envoyé !" }), {
      description: t("onboarding.email.sentDesc", {
        defaultValue: "Ouvre ton mail et clique sur le lien pour te connecter.",
        email: cleaned,
      }),
    });
  };

  if (loading) return null;

  const canProceed = () => {
    switch (step) {
      case 0: return !!lang;
      case 1: return firstName.trim().length >= 2;
      case 2: return !!gender;
      case 3: {
        const h = Number(heightCm), w = Number(weightKg), a = Number(age);
        return h >= 120 && h <= 230 && w >= 30 && w <= 250 && a >= 10 && a <= 100;
      }
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <VibeLogo className="text-xl" />
          {step > 0 && (
            <button
              onClick={back}
              className="text-xs uppercase tracking-widest text-muted-foreground"
            >
              {t("common.back")}
            </button>
          )}
        </header>

        <div className="mt-6 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                i <= step ? "bg-gradient-brand" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="mt-12 flex-1 animate-fade-up">
          {/* Step 0 — LANGUE */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <Globe className="h-6 w-6 text-cobalt" strokeWidth={1.5} />
              </div>
              <h1 className="font-serif text-4xl leading-tight text-balance">
                {t("onboarding.language.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.language.subtitle")}
              </p>
              <div className="space-y-3">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      i18n.changeLanguage(l.code);
                      try { localStorage.setItem("vibe.lang", l.code); } catch {}
                    }}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left text-lg font-medium transition-all",
                      lang === l.code
                        ? "border-cobalt bg-secondary shadow-soft"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <span className="text-2xl leading-none">{l.flag}</span>
                    <span className="flex-1">{l.label}</span>
                    {lang === l.code && <Check className="h-5 w-5 text-cobalt" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — PRÉNOM */}
          {step === 1 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                {t("onboarding.name.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.name.subtitle")}
              </p>
              <Input
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("onboarding.name.placeholder")}
                className="h-14 rounded-2xl border-border bg-card text-lg"
              />
            </div>
          )}

          {/* Step 2 — GENRE */}
          {step === 2 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                {t("onboarding.gender.title")}
              </h1>
              <div className="space-y-3">
                {GENDERS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGender(g.id)}
                    className={cn(
                      "w-full rounded-2xl border bg-card p-5 text-left text-lg font-medium transition-all",
                      gender === g.id
                        ? "border-cobalt bg-secondary shadow-soft"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {t(g.labelKey, g.fallback)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — MORPHO */}
          {step === 3 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                {t("onboarding.morpho.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("onboarding.morpho.subtitle")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="rounded-2xl border border-border bg-card p-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("onboarding.morpho.height")}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="175"
                    className="mt-1 w-full bg-transparent font-serif text-3xl outline-none"
                  />
                </label>
                <label className="rounded-2xl border border-border bg-card p-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("onboarding.morpho.weight")}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="68"
                    className="mt-1 w-full bg-transparent font-serif text-3xl outline-none"
                  />
                </label>
                <label className="col-span-2 rounded-2xl border border-border bg-card p-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("onboarding.morpho.age")}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="25"
                    className="mt-1 w-full bg-transparent font-serif text-3xl outline-none"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 4 — LOCALISATION */}
          {step === 4 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                {t("onboarding.location.title")}
              </h1>
              <div className="rounded-2xl bg-secondary/60 p-5">
                <MapPin className="mb-3 h-6 w-6 text-cobalt" strokeWidth={1.5} />
                <p className="text-sm text-foreground">
                  {t("onboarding.location.subtitle")}
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  onClick={requestLocation}
                  className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand border-0"
                >
                  {t("onboarding.location.enable")}
                </Button>
                <button
                  onClick={next}
                  className="w-full text-xs uppercase tracking-widest text-muted-foreground"
                >
                  {t("common.skip")}
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — EMAIL MAGIC LINK */}
          {step === EMAIL_STEP && (
            <div className="space-y-6">
              {!linkSent ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <Mail className="h-6 w-6 text-cobalt" strokeWidth={1.5} />
                  </div>
                  <h1 className="font-serif text-4xl leading-tight text-balance">
                    {t("onboarding.email.title", { defaultValue: "Ton email" })}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t("onboarding.email.subtitle", {
                      defaultValue:
                        "Pas de mot de passe. Reçois un lien magique pour te connecter en un clic.",
                    })}
                  </p>
                  <Input
                    autoFocus
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@exemple.com"
                    className="h-14 rounded-2xl border-border bg-card text-lg"
                  />
                  <Button
                    onClick={sendMagicLink}
                    disabled={busy || !isValidEmail(email)}
                    className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand border-0"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {busy
                      ? t("onboarding.email.sending", { defaultValue: "Envoi…" })
                      : t("onboarding.email.receive", { defaultValue: "Recevoir le lien" })}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    {t("onboarding.email.legal", {
                      defaultValue:
                        "On utilise ton email uniquement pour te connecter et sécuriser ton compte.",
                    })}
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <ShieldCheck className="h-6 w-6 text-cobalt" strokeWidth={1.5} />
                  </div>
                  <h1 className="font-serif text-4xl leading-tight text-balance">
                    {t("onboarding.email.checkTitle", { defaultValue: "Check tes mails" })}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t("onboarding.email.sentTo", { defaultValue: "Lien envoyé à" })}{" "}
                    <span className="font-medium text-foreground">{email}</span>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("onboarding.email.openLink", {
                      defaultValue:
                        "Ouvre l'email et clique sur le lien — tu seras connecté automatiquement.",
                    })}
                  </p>
                  <Button
                    onClick={sendMagicLink}
                    disabled={busy}
                    variant="outline"
                    className="h-14 w-full rounded-2xl text-base"
                  >
                    {t("onboarding.email.resend", { defaultValue: "Renvoyer le lien" })}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* CTA Continuer pour étapes 0-3 (4 = location avec son CTA, 5 = email) */}
        {step < EMAIL_STEP && step !== 4 && (
          <div className="pb-4 pt-6">
            <Button
              onClick={next}
              disabled={!canProceed()}
              className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand disabled:bg-muted disabled:bg-none disabled:text-muted-foreground disabled:shadow-none border-0"
            >
              {t("common.continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 0 && (
          <button
            onClick={() => { setLoginOnly(true); setStep(EMAIL_STEP); }}
            className="pb-2 text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            {t("onboarding.haveAccount")}
          </button>
        )}
      </div>
    </div>
  );
}
