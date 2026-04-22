import { useRef, useState } from "react";
import { Camera, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanResult {
  score: number;
  tips: string[];
}

export default function Scan() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const onFile = (f: File) => {
    setPreview(URL.createObjectURL(f));
    setResult(null);
    // Stub — branche IA à l'étape 2
    setTimeout(() => {
      setResult({
        score: 8,
        tips: [
          "Joue sur les volumes : un haut plus structuré équilibrerait la silhouette.",
          "Ajoute un accessoire métallique pour casser la palette.",
          "Des chaussures plus minimalistes affineraient l'allure.",
        ],
      });
    }, 900);
  };

  return (
    <div className="space-y-6 px-5 pt-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Vibe Check
        </p>
        <h1 className="mt-1 font-serif text-3xl">Note ton look</h1>
      </header>

      <div className="rounded-3xl border border-dashed border-border bg-card p-6">
        {preview ? (
          <img
            src={preview}
            alt="Ton look"
            className="mx-auto h-72 rounded-2xl object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Camera className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Prends-toi en photo (en pied, lumière naturelle) pour un scan honnête.
            </p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <div className="mt-5 flex gap-2">
          <Button
            onClick={() => fileRef.current?.click()}
            className="h-12 flex-1 rounded-2xl bg-cobalt text-cobalt-foreground hover:bg-cobalt/90 shadow-cobalt"
          >
            <Upload className="mr-2 h-4 w-4" />
            {preview ? "Changer" : "Choisir une photo"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="animate-fade-up space-y-4 rounded-3xl bg-gradient-luxe p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-foreground/60">
                Aura
              </p>
              <div className="font-serif text-5xl text-cobalt">
                {result.score}
                <span className="text-2xl text-foreground/60">/10</span>
              </div>
            </div>
            <div className="rounded-full bg-neon px-3 py-1 text-xs uppercase tracking-widest text-neon-foreground">
              +10 Vibers
            </div>
          </div>
          <div className="space-y-2">
            {result.tips.map((t, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                <p>{t}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}