import { useState } from "react";
import { getProfile } from "@/lib/profile";
import { Mic, Sparkles, Shirt, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Mood, Occasion } from "@/lib/types";

const MOODS: Mood[] = [
  "Confiant", "Chill", "Mystérieux", "Bad Boy/Girl", "Énervé",
  "Romantique", "Pro", "Créatif", "Énergique", "Discret",
];

const OCCASIONS: Occasion[] = [
  "Date Night", "Premier Date", "Travail/Entretien", "Sortie Potes",
  "Soirée Club", "Sport/Gym", "Mariage/Fête", "Chill Maison",
  "Voyage/Aéroport", "Shooting Photo",
];

interface Look {
  bullets: string[];
  mood: Mood;
  occasion: Occasion;
  advice: string;
}

export default function Dressing() {
  const profile = getProfile();
  const [mood, setMood] = useState<Mood | null>(null);
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [other, setOther] = useState("");
  const [look, setLook] = useState<Look | null>(null);
  const [loading, setLoading] = useState(false);

  const onMic = () => {
    toast("Vibe Closet vocal — branché à l'étape 2 avec Lovable AI");
  };

  const generate = () => {
    if (!mood || (!occasion && !other.trim())) {
      toast("Choisis un mood et une occasion");
      return;
    }
    setLoading(true);
    setLook(null);
    setTimeout(() => {
      setLook({
        bullets: [
          "Pull cachemire crème oversized",
          "Pantalon tailoring taupe",
          "Mocassins cuir marron foncé",
        ],
        mood: mood,
        occasion: occasion ?? ("Custom" as Occasion),
        advice:
          "L'équilibre des volumes entre le pull oversized et le tailoring affine la silhouette. Le crème + taupe construit une aura raffinée, parfaite pour booster ton mindset.",
      });
      setLoading(false);
    }, 700);
  };

  return (
    <div className="space-y-6 px-5 pt-8 pb-32">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Dressing
        </p>
        <h1 className="mt-1 font-serif text-3xl">Ton styliste</h1>
      </header>

      {/* Vibe Closet */}
      <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
        <Shirt className="h-5 w-5 text-cobalt" strokeWidth={1.5} />
        <div className="flex-1">
          <div className="text-sm font-medium">Vibe Closet</div>
          <div className="text-xs text-muted-foreground">
            {profile?.closet?.length
              ? `${profile.closet.length} pièces enregistrées`
              : "Dicte tes vêtements pour des tenues 100% personnalisées"}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onMic} className="rounded-full">
          <Mic className="h-4 w-4" />
        </Button>
      </div>

      {/* Mood */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Ton mood
        </h2>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = mood === m;
            return (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-all",
                  active
                    ? "border-cobalt bg-cobalt text-cobalt-foreground shadow-cobalt"
                    : "border-border bg-card text-foreground hover:border-cobalt/40"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </section>

      {/* Occasion */}
      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Ton rendez-vous
        </h2>
        <div className="flex flex-wrap gap-2">
          {OCCASIONS.map((o) => {
            const active = occasion === o;
            return (
              <button
                key={o}
                onClick={() => { setOccasion(o); setOther(""); }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-all",
                  active
                    ? "border-cobalt bg-cobalt text-cobalt-foreground shadow-cobalt"
                    : "border-border bg-card text-foreground hover:border-cobalt/40"
                )}
              >
                {o}
              </button>
            );
          })}
        </div>
        <input
          value={other}
          onChange={(e) => { setOther(e.target.value); if (e.target.value) setOccasion(null); }}
          placeholder="Autre… (ex : vernissage, brunch dimanche)"
          className="mt-3 h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-cobalt/60"
        />
      </section>

      {/* Result */}
      {loading && (
        <div className="animate-fade-up rounded-3xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Composition de ta tenue…
        </div>
      )}

      {look && (
        <div className="animate-fade-up space-y-4 rounded-3xl bg-card shadow-card overflow-hidden">
          {/* Visuel — placeholder en attente du virtual try-on */}
          <div className="relative aspect-[3/4] w-full bg-gradient-luxe">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full glass-panel px-4 py-2 text-xs uppercase tracking-widest text-foreground">
                Visuel IA · à venir
              </div>
            </div>
            <div className="absolute bottom-3 left-3 rounded-full bg-cobalt px-3 py-1 text-[10px] uppercase tracking-widest text-cobalt-foreground">
              {look.mood}
            </div>
          </div>
          <div className="space-y-3 p-5">
            <ul className="space-y-1 text-sm">
              {look.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 text-cobalt" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="rounded-2xl bg-secondary/60 p-4 text-sm leading-relaxed text-foreground">
              <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-cobalt">
                Avis du styliste
              </div>
              {look.advice}
            </div>
          </div>
        </div>
      )}

      {/* Sticky generate */}
      <div className="fixed bottom-24 left-0 right-0 z-30 px-5">
        <div className="mx-auto max-w-md">
          <Button
            onClick={generate}
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-cobalt text-cobalt-foreground hover:bg-cobalt/90 text-base shadow-cobalt"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Générer ma tenue
          </Button>
        </div>
      </div>
    </div>
  );
}