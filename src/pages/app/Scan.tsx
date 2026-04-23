import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Upload, Sparkles, Loader2, Palette, Ruler, Layers, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/profile";
import { toast } from "sonner";
import { StylistChat } from "@/components/vibe/StylistChat";

interface ScanResult {
  score: number;
  verdict: string;
  colorimetrie: string;
  proportions: string;
  matieres: string;
  detailKiller: string;
  tips: string[];
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Scan() {
  const { i18n } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const onFile = async (f: File) => {
    setResult(null);
    setPreview(URL.createObjectURL(f));
    try {
      const url = await fileToDataUrl(f);
      setDataUrl(url);
      analyze(url);
    } catch {
      toast.error("Impossible de lire la photo.");
    }
  };

  const analyze = async (img: string) => {
    const profile = getProfile();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-look", {
        body: {
          imageDataUrl: img,
          gender: profile?.gender,
          heightCm: profile?.heightCm,
          weightKg: profile?.weightKg,
          lang: i18n.language?.split("-")[0] ?? "fr",
        },
      });
      if (error) throw error;
      if ((data as any)?.error === "rate_limited") {
        toast.error("Trop de scans. Réessaie dans une minute.");
        return;
      }
      if ((data as any)?.error === "payment_required") {
        toast.error("Crédits IA épuisés.");
        return;
      }
      if (!(data as any)?.score) {
        toast.error("Analyse impossible. Reprends une photo plus nette.");
        return;
      }
      setResult(data as ScanResult);
    } catch (e) {
      console.error(e);
      toast.error("Scan impossible. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.score >= 8
      ? "text-emerald-500"
      : result.score >= 6.5
      ? "text-foreground"
      : "text-rose-500"
    : "text-foreground";

  return (
    <div className="space-y-6 px-5 pt-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Vibe Check
        </p>
        <h1 className="mt-1 font-serif text-3xl">Note ton look</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Analyse couture, sévère mais juste.
        </p>
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
              <Camera className="h-7 w-7 text-foreground" strokeWidth={1.5} />
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
            disabled={loading}
            className="h-12 flex-1 rounded-3xl bg-gradient-brand text-white hover:opacity-90 shadow-brand border-0"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {loading ? "Analyse en cours…" : preview ? "Changer de photo" : "Choisir une photo"}
          </Button>
          {preview && !loading && result && (
            <Button
              variant="outline"
              onClick={() => dataUrl && analyze(dataUrl)}
              className="h-12 rounded-3xl"
            >
              Re-noter
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div className="animate-fade-up space-y-4">
          {/* Score */}
          <div className="rounded-3xl bg-card p-6 shadow-card">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Vibe Check
                </p>
                <div className={`font-mono-tech text-6xl font-bold leading-none tracking-tighter ${scoreColor}`}>
                  {Number.isInteger(result.score) ? result.score : result.score.toFixed(1)}
                  <span className="text-2xl text-muted-foreground">/10</span>
                </div>
              </div>
              <div className="rounded-full bg-lime px-3 py-1 font-mono-tech text-[10px] uppercase tracking-widest shadow-brand">
                +10 VIBERS
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{result.verdict}</p>
          </div>

          {/* Analyse technique */}
          <div className="grid gap-3">
            <AnalysisRow icon={<Palette className="h-4 w-4" />} label="Colorimétrie" text={result.colorimetrie} />
            <AnalysisRow icon={<Ruler className="h-4 w-4" />} label="Proportions" text={result.proportions} />
            <AnalysisRow icon={<Layers className="h-4 w-4" />} label="Matières" text={result.matieres} />
            <AnalysisRow icon={<Crosshair className="h-4 w-4" />} label="Le détail qui tue" text={result.detailKiller} highlight />
          </div>

          {/* Conseils */}
          <div className="rounded-3xl bg-secondary p-5">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              3 actions immédiates
            </p>
            <ol className="space-y-3">
              {result.tips.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-[11px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <p>{t}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisRow({
  icon,
  label,
  text,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-4 ${
        highlight ? "bg-gradient-brand text-white shadow-brand" : "bg-card shadow-card"
      }`}
    >
      <div className={`flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest ${
        highlight ? "text-white/80" : "text-muted-foreground"
      }`}>
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed">{text}</p>
    </div>
  );
}