import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VibeLogo } from "@/components/vibe/VibeLogo";
import { saveProfile, getProfile, hydrateProfileFromDb } from "@/lib/profile";
import { getDeviceId } from "@/lib/device";
import type { Gender, UserProfile } from "@/lib/types";
import { ArrowRight, Camera, MapPin, Mic, Sparkles, Phone, ShieldCheck, Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { COUNTRIES, findCountryByCode } from "@/lib/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const GENDERS: { id: Gender; labelKey: string; fallback: string }[] = [
  { id: "femme", labelKey: "onboarding.gender.femme", fallback: "Femme" },
  { id: "homme", labelKey: "onboarding.gender.homme", fallback: "Homme" },
  { id: "unisexe", labelKey: "onboarding.gender.unisex", fallback: "Non-binaire / Unisexe" },
];

const TOTAL_STEPS = 8;

const normalizePhone = (local: string, countryCode: string): string | null => {
  const country = findCountryByCode(countryCode);
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return null;
  const candidate = `+${country.dial}${digits}`;
  const parsed = parsePhoneNumberFromString(candidate, country.code as any);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
};

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
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Phone / OTP
  const [countryCode, setCountryCode] = useState<string>("FR");
  const [countryOpen, setCountryOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [e164, setE164] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  // Mode "j'ai déjà un compte" : on saute toutes les étapes profil et on
  // utilise l'écran téléphone uniquement pour se reconnecter.
  const [loginOnly, setLoginOnly] = useState(false);

  // Si l'utilisateur a déjà une session active et un profil, on file dans l'app
  useEffect(() => {
    if (loading) return;
    // 1) Local profile present → skip onboarding immediately.
    if (getProfile()) {
      navigate("/app", { replace: true });
      return;
    }
    // 2) Logged-in but no local profile → try to rebuild from DB.
    if (session?.user?.id) {
      hydrateProfileFromDb(session.user.id).then((p) => {
        if (p) navigate("/app", { replace: true });
      });
    }
  }, [loading, session, navigate]);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      toast("Géolocalisation indisponible sur ce navigateur");
      next();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        setCity("Ta ville");
        toast.success("Localisation activée");
        next();
      },
      () => {
        toast("Tu pourras l'activer plus tard depuis ton profil");
        next();
      },
      { timeout: 8000 }
    );
  };

  const persistProfile = async (userId?: string) => {
    const deviceId = await getDeviceId().catch(() => undefined);
    // Persist the chosen language so the whole app (and future sessions)
    // keeps using it. i18n.changeLanguage already writes to `vibe.lang`.
    if (lang && i18n.language?.split("-")[0] !== lang) {
      try { await i18n.changeLanguage(lang); } catch {}
    }
    try { localStorage.setItem("vibe.lang", lang); } catch {}
    const profile: UserProfile = {
      firstName: firstName.trim() || "Vibe",
      gender: gender ?? "unisexe",
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      age: age ? Number(age) : undefined,
      styles: [],
      city: city || undefined,
      referencePhoto: photo ?? undefined,
      closet: [],
      vibers: 20,
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
        vibers: profile.vibers,
        onboarded: true,
      }).eq("id", userId);
    }
    return profile;
  };

  const sendCode = async () => {
    const normalized = normalizePhone(phone, countryCode);
    if (!normalized) {
      toast.error("Numéro invalide", { description: "Vérifie le pays et le numéro saisi." });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { channel: "sms" },
    });
    setBusy(false);
    if (error) {
      // Mode démo : tant que le provider SMS n'est pas branché, on continue
      // quand même vers l'écran de saisie du code pour permettre la démo.
      toast("Mode démo activé", {
        description: "Le SMS n'est pas encore branché — tu peux continuer.",
      });
      setE164(normalized);
      setOtpSent(true);
      return;
    }
    toast.success("Code envoyé", { description: `Vérifie tes SMS sur ${normalized}` });
    setE164(normalized);
    setOtpSent(true);
  };

  const verifyAndFinish = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otp,
      type: "sms",
    });
    if (error) {
      if (loginOnly) {
        setBusy(false);
        toast.error("Code invalide", { description: "Vérifie le code reçu par SMS." });
        return;
      }
      // Mode démo : on finit quand même l'onboarding localement.
      const profile = await persistProfile(undefined);
      setBusy(false);
      toast.success(`Bienvenue ${profile.firstName} ✨ +20 Vibers offerts`);
      navigate("/app", { replace: true });
      return;
    }
    const userId = data.user?.id;
    // Connexion : si la BD a un profil onboardé, on file dans l'app.
    if (loginOnly && userId) {
      const p = await hydrateProfileFromDb(userId);
      setBusy(false);
      if (p) {
        toast.success(`Bon retour ${p.firstName} ✨`);
        navigate("/app", { replace: true });
        return;
      }
      // Pas de profil onboardé en BD → on bascule sur l'onboarding complet.
      toast("Termine ton profil pour continuer.");
      setLoginOnly(false);
      setStep(1);
      return;
    }
    const profile = await persistProfile(userId);
    setBusy(false);
    toast.success(`Bienvenue ${profile.firstName} ✨ +20 Vibers offerts`);
    navigate("/app", { replace: true });
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
              Retour
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
                Choisis ta langue
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu pourras la changer à tout moment depuis tes réglages.
              </p>
              <div className="space-y-3">
                {SUPPORTED_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      i18n.changeLanguage(l.code);
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
                Bienvenue.<br />Comment t'appelles-tu&nbsp;?
              </h1>
              <p className="text-sm text-muted-foreground">
                Ton prénom me sert à te conseiller comme une amie styliste.
              </p>
              <Input
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ton prénom"
                className="h-14 rounded-2xl border-border bg-card text-lg"
              />
            </div>
          )}

          {/* Step 2 — GENRE */}
          {step === 2 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Tu t'identifies comme&nbsp;?
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
                Ta morphologie&nbsp;?
              </h1>
              <p className="text-sm text-muted-foreground">
                Ton poids nous aide simplement à mieux ajuster les coupes et les volumes des vêtements suggérés pour un rendu parfait.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="rounded-2xl border border-border bg-card p-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Taille (cm)</span>
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
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Poids (kg)</span>
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
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Âge</span>
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
                Active la localisation
              </h1>
              <div className="rounded-2xl bg-secondary/60 p-5">
                <MapPin className="mb-3 h-6 w-6 text-cobalt" strokeWidth={1.5} />
                <p className="text-sm text-foreground">
                  VIBE analyse le ciel de ta ville pour que ton look soit aussi pratique que stylé.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  onClick={requestLocation}
                  className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand border-0"
                >
                  Activer la localisation
                </Button>
                <button
                  onClick={next}
                  className="w-full text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Passer cette étape
                </button>
              </div>
            </div>
          )}

          {/* Step 5 — PHOTO */}
          {step === 5 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Ta photo de référence
              </h1>
              <p className="text-sm text-muted-foreground">
                Une photo neutre (debout, face caméra, fond clair) nous permet de projeter virtuellement les tenues sur toi.
              </p>
              <div className="rounded-3xl border border-dashed border-border bg-card p-5">
                {photo ? (
                  <img src={photo} alt="Ta photo de référence" className="mx-auto h-56 rounded-2xl object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                      <Camera className="h-7 w-7 text-cobalt" strokeWidth={1.5} />
                    </div>
                    <p className="max-w-xs text-xs text-muted-foreground">
                      Format portrait recommandé. Tu pourras la modifier dans ton profil.
                    </p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])}
                />
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  className="mt-4 h-12 w-full rounded-2xl"
                >
                  {photo ? "Changer la photo" : "Choisir une photo"}
                </Button>
              </div>
              {!photo && (
                <button
                  onClick={next}
                  className="w-full text-xs uppercase tracking-widest text-muted-foreground"
                >
                  Passer pour l'instant
                </button>
              )}
            </div>
          )}

          {/* Step 6 — DRESSING info */}
          {step === 6 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Ton dressing
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu pourras dicter tes pièces à l'oral dans l'onglet Dressing. Sinon, je propose des tenues 100% inspirationnelles.
              </p>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                    <Mic className="h-5 w-5 text-cobalt" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Vibe Closet vocal</div>
                    <div className="text-xs text-muted-foreground">Disponible dans l'app</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7 — TÉLÉPHONE + OTP (création de compte en dernier) */}
          {step === 7 && (
            <div className="space-y-6">
              {!otpSent ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <Phone className="h-6 w-6 text-cobalt" strokeWidth={1.5} />
                  </div>
                  <h1 className="font-serif text-4xl leading-tight text-balance">
                    Dernière étape&nbsp;: ton numéro
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Tu recevras un code par SMS pour sécuriser ton compte. Aucun spam.
                  </p>
                  <div className="flex gap-2">
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex h-14 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-base"
                        >
                          <span className="text-xl leading-none">{findCountryByCode(countryCode).flag}</span>
                          <span className="font-mono text-sm text-muted-foreground">
                            +{findCountryByCode(countryCode).dial}
                          </span>
                          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un pays…" />
                          <CommandList>
                            <CommandEmpty>Aucun pays.</CommandEmpty>
                            <CommandGroup>
                              {COUNTRIES.map((c) => (
                                <CommandItem
                                  key={c.code}
                                  value={`${c.name} +${c.dial} ${c.code}`}
                                  onSelect={() => {
                                    setCountryCode(c.code);
                                    setCountryOpen(false);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-base">{c.flag}</span>
                                  <span className="flex-1 truncate">{c.name}</span>
                                  <span className="font-mono text-xs text-muted-foreground">+{c.dial}</span>
                                  <Check
                                    className={cn(
                                      "h-4 w-4 text-cobalt",
                                      countryCode === c.code ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      autoFocus
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="6 12 34 56 78"
                      className="h-14 flex-1 rounded-2xl border-border bg-card text-lg"
                    />
                  </div>
                  <Button
                    onClick={sendCode}
                    disabled={busy}
                    className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand border-0"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {busy ? "Envoi…" : "Recevoir le code"}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    En continuant, tu acceptes les CGU et la politique de confidentialité.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <ShieldCheck className="h-6 w-6 text-cobalt" strokeWidth={1.5} />
                  </div>
                  <h1 className="font-serif text-4xl leading-tight text-balance">
                    Entre le code reçu
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Code envoyé au <span className="font-medium text-foreground">{e164}</span>.
                  </p>
                  <Input
                    autoFocus
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="h-14 rounded-2xl border-border bg-card text-center font-mono-tech text-2xl tracking-[0.5em]"
                  />
                  <Button
                    onClick={verifyAndFinish}
                    disabled={busy}
                    className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand border-0"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {busy ? "Vérification…" : "Entrer dans VIBE"}
                  </Button>
                  <button
                    onClick={sendCode}
                    disabled={busy}
                    className="w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    Renvoyer le code
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bouton continuer pour étapes 0-6, et 4/5 ont leurs propres CTA mais on garde celui-ci pour cohérence */}
        {step < 7 && step !== 4 && step !== 5 && (
          <div className="pb-4 pt-6">
            <Button
              onClick={next}
              disabled={!canProceed()}
              className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand disabled:bg-muted disabled:bg-none disabled:text-muted-foreground disabled:shadow-none border-0"
            >
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
        {(step === 4 || step === 5) && (
          <div className="pb-4 pt-6">
            <Button
              onClick={next}
              className="h-14 w-full rounded-2xl bg-gradient-brand text-foreground hover:opacity-90 text-base shadow-brand border-0"
            >
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 0 && (
          <button
            onClick={() => { setLoginOnly(true); setStep(7); }}
            className="pb-2 text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            J'ai déjà un compte → Se connecter
          </button>
        )}
      </div>
    </div>
  );
}