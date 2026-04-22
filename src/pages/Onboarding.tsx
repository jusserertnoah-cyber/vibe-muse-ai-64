import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VibeLogo } from "@/components/vibe/VibeLogo";
import { saveProfile } from "@/lib/profile";
import { getDeviceId } from "@/lib/device";
import type { Gender, StyleTag, UserProfile } from "@/lib/types";
import { ArrowRight, Camera, Check, MapPin, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STYLES: StyleTag[] = [
  "Old Money", "Streetwear", "Gorpcore", "Minimalisme",
  "Y2K", "Dark Academia", "Blokecore", "Cyber-Y2K",
  "Modern Gothic", "Clean Fit",
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: "femme", label: "Femme" },
  { id: "homme", label: "Homme" },
  { id: "unisexe", label: "Non-binaire / Unisexe" },
];

const TOTAL_STEPS = 7;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [styles, setStyles] = useState<StyleTag[]>([]);
  const [city, setCity] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const toggleStyle = (s: StyleTag) =>
    setStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

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

  const finish = async () => {
    const deviceId = await getDeviceId().catch(() => undefined);
    const profile: UserProfile = {
      firstName: firstName.trim() || "Vibe",
      gender: gender ?? "unisexe",
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      styles,
      city: city || undefined,
      referencePhoto: photo ?? undefined,
      closet: [],
      vibers: 0,
      deviceId,
      createdAt: new Date().toISOString(),
    };
    saveProfile(profile);
    toast.success(`Bienvenue ${profile.firstName} ✨`);
    navigate("/app", { replace: true });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return firstName.trim().length >= 2;
      case 1: return !!gender;
      case 2: {
        const h = Number(heightCm), w = Number(weightKg);
        return h >= 120 && h <= 230 && w >= 30 && w <= 250;
      }
      case 3: return styles.length > 0;
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
                i <= step ? "bg-cobalt" : "bg-muted"
              )}
            />
          ))}
        </div>

        <div className="mt-12 flex-1 animate-fade-up">
          {step === 0 && (
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

          {step === 1 && (
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
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Ta morphologie&nbsp;?
              </h1>
              <p className="text-sm text-muted-foreground">
                Ton poids nous aide simplement à mieux ajuster les coupes et les
                volumes des vêtements suggérés pour un rendu parfait.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="rounded-2xl border border-border bg-card p-4">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Taille (cm)
                  </span>
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
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    Poids (kg)
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="68"
                    className="mt-1 w-full bg-transparent font-serif text-3xl outline-none"
                  />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Tes vibes préférées&nbsp;?
              </h1>
              <p className="text-sm text-muted-foreground">
                Choisis-en au moins une. Tu peux en sélectionner plusieurs.
              </p>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((s) => {
                  const active = styles.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleStyle(s)}
                      className={cn(
                        "rounded-full border px-4 py-2.5 text-sm transition-all",
                        active
                          ? "border-cobalt bg-cobalt text-cobalt-foreground"
                          : "border-border bg-card text-foreground hover:border-cobalt/40"
                      )}
                    >
                      {active && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Active la localisation
              </h1>
              <div className="rounded-2xl bg-secondary/60 p-5">
                <MapPin className="mb-3 h-6 w-6 text-cobalt" strokeWidth={1.5} />
                <p className="text-sm text-foreground">
                  VIBE analyse le ciel de ta ville pour que ton look soit aussi
                  pratique que stylé.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  onClick={requestLocation}
                  className="h-14 w-full rounded-2xl bg-cobalt text-cobalt-foreground hover:bg-cobalt/90 text-base shadow-cobalt"
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

          {step === 5 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Ta photo de référence
              </h1>
              <p className="text-sm text-muted-foreground">
                Une photo neutre (debout, face caméra, fond clair) nous permet de
                projeter virtuellement les tenues sur toi.
              </p>
              <div className="rounded-3xl border border-dashed border-border bg-card p-5">
                {photo ? (
                  <img
                    src={photo}
                    alt="Ta photo de référence"
                    className="mx-auto h-56 rounded-2xl object-cover"
                  />
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
              <button
                onClick={next}
                className="w-full text-xs uppercase tracking-widest text-muted-foreground"
              >
                Passer pour l'instant
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Ton dressing
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu pourras dicter tes pièces à l'oral dans l'onglet Dressing.
                Sinon, je propose des tenues 100% inspirationnelles.
              </p>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                      <Mic className="h-5 w-5 text-cobalt" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Vibe Closet vocal</div>
                      <div className="text-xs text-muted-foreground">
                        Disponible dans l'app
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={finish}
                  className="h-14 w-full rounded-2xl bg-cobalt text-cobalt-foreground hover:bg-cobalt/90 text-base shadow-cobalt"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Entrer dans VIBE
                </Button>
              </div>
            </div>
          )}
        </div>

        {step < 6 && (
          <div className="pb-4 pt-6">
            <Button
              onClick={next}
              disabled={!canProceed()}
              className="h-14 w-full rounded-2xl bg-cobalt text-cobalt-foreground hover:bg-cobalt/90 text-base shadow-cobalt disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}