import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VibeLogo } from "@/components/vibe/VibeLogo";
import { saveProfile } from "@/lib/profile";
import { getDeviceId } from "@/lib/device";
import type { Gender, Morphology, StyleTag, UserProfile } from "@/lib/types";
import { ArrowRight, MapPin, Mic, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STYLES: StyleTag[] = [
  "Old Money",
  "Streetwear",
  "Gorpcore",
  "Minimalisme",
  "Y2K",
  "Dark Academia",
];

const MORPHOS: { id: Morphology; label: string; hint: string }[] = [
  { id: "A", label: "A", hint: "Hanches > épaules" },
  { id: "V", label: "V", hint: "Épaules > hanches" },
  { id: "H", label: "H", hint: "Silhouette droite" },
  { id: "X", label: "X", hint: "Taille marquée" },
  { id: "O", label: "O", hint: "Taille ronde" },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: "femme", label: "Femme" },
  { id: "homme", label: "Homme" },
  { id: "unisexe", label: "Unisexe" },
];

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [morphology, setMorphology] = useState<Morphology | null>(null);
  const [styles, setStyles] = useState<StyleTag[]>([]);
  const [city, setCity] = useState("");
  const [closet, setCloset] = useState<string[]>([]);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const toggleStyle = (s: StyleTag) =>
    setStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

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
      morphology: morphology ?? "H",
      styles,
      city: city || undefined,
      closet,
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
      case 2: return !!morphology;
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

        {/* Progress */}
        <div className="mt-6 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                i <= step ? "bg-primary" : "bg-muted"
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
                        ? "border-primary bg-secondary shadow-soft"
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
                Pour des coupes qui te flattent vraiment.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MORPHOS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMorphology(m.id)}
                    className={cn(
                      "rounded-2xl border bg-card p-5 text-left transition-all",
                      morphology === m.id
                        ? "border-primary bg-secondary shadow-soft"
                        : "border-border"
                    )}
                  >
                    <div className="font-serif text-2xl">{m.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h1 className="font-serif text-4xl leading-tight text-balance">
                Tes vibes préférées&nbsp;?
              </h1>
              <p className="text-sm text-muted-foreground">Choisis-en au moins une.</p>
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
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40"
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
                <MapPin className="mb-3 h-6 w-6 text-primary" strokeWidth={1.5} />
                <p className="text-sm text-foreground">
                  Nous avons besoin de ta localisation pour ajuster tes tenues à la
                  météo locale et te proposer le look parfait pour ta journée.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  onClick={requestLocation}
                  className="h-14 w-full rounded-2xl text-base"
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
                Ton dressing
              </h1>
              <p className="text-sm text-muted-foreground">
                Tu peux dicter tes pièces à l'oral plus tard dans l'onglet Dressing.
                Sinon, je propose des tenues 100% inspirationnelles.
              </p>
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                      <Mic className="h-5 w-5 text-primary" strokeWidth={1.5} />
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
                  className="h-14 w-full rounded-2xl text-base"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Entrer dans VIBE
                </Button>
              </div>
            </div>
          )}
        </div>

        {step < 5 && (
          <div className="pb-4 pt-6">
            <Button
              onClick={next}
              disabled={!canProceed()}
              className="h-14 w-full rounded-2xl text-base"
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