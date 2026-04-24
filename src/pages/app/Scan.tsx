import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Upload, Loader2, Check, AlertCircle, Ruler, Palette, Sparkles, ShoppingBag, ExternalLink, Share2, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/profile";
import { awardVibers } from "@/lib/vibers";
import { getTier } from "@/lib/tier";
import { pushHistory } from "@/lib/history";
import { toast } from "sonner";
import { StylistChat } from "@/components/vibe/StylistChat";
import { getDailyChallenge } from "@/lib/challenges";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ShoppingItem {
  name: string;
  brand: string;
  price: string;
  why: string;
  query: string;
}

interface ScanResult {
  score: number;
  style?: string;
  verdict: string;
  strong: string;
  weak: string;
  tips: string[];
  fit?: string;
  colors?: string;
  touch2026?: string;
  shopping?: ShoppingItem[];
  challenge_met?: boolean;
  challenge_reason?: string;
  challenge_reward?: { total_completed: number; granted_credit: boolean };
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Scan() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);
  const challenge = getDailyChallenge();

  const onFile = async (f: File) => {
    setResult(null);
    setShared(false);
    setPreview(URL.createObjectURL(f));
    try {
      const url = await fileToDataUrl(f);
      setDataUrl(url);
      analyze(url);
    } catch {
      toast.error(t("scan.readError"));
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
          tier: getTier(),
          challenge: { name: challenge.name, detect: challenge.detect },
        },
      });
      if (error) {
        // Edge function renvoie 402 quand pas de crédit → message clair + paywall
        const msg = String(error.message ?? "");
        if (msg.includes("402") || msg.toLowerCase().includes("no_credits")) {
          toast.error("Crédit insuffisant", { description: "Achète un pack pour continuer." });
          navigate("/app/paywall");
          return;
        }
        throw error;
      }
      if ((data as any)?.error === "no_credits") {
        toast.error("Crédit insuffisant", { description: "Achète un pack pour continuer." });
        navigate("/app/paywall");
        return;
      }
      if ((data as any)?.error === "rate_limited") {
        toast.error(t("scan.errors.rate"));
        return;
      }
      if ((data as any)?.error === "payment_required") {
        toast.error(t("scan.errors.credits"));
        return;
      }
      if (!(data as any)?.score) {
        toast.error(t("scan.errors.blur"));
        return;
      }
      setResult(data as ScanResult);
      const r = data as ScanResult;
      if (r.challenge_met) {
        if (r.challenge_reward?.granted_credit) {
          toast.success("🎉 10 défis réussis !", { description: "1 scan gratuit ajouté à ton compte." });
        } else {
          toast.success(`✓ Défi "${challenge.name}" validé`, {
            description: r.challenge_reward ? `${r.challenge_reward.total_completed % 10}/10 vers ton prochain scan offert` : undefined,
          });
        }
      }
      pushHistory({
        type: "scan",
        imageUrl: img,
        score: r.score,
        style: (data as any).style,
      });
    } catch (e) {
      console.error(e);
      toast.error(t("scan.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const shareToFeed = async () => {
    if (!dataUrl || !result || sharing) return;
    setSharing(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user?.id;
      if (!userId) {
        toast.error("Connecte-toi pour partager au feed.");
        return;
      }
      const profile = getProfile();
      // Règle "1 seul post actif" : on remplace l'ancien (compteur Vibes reset).
      await supabase.from("posts").delete().eq("user_id", userId);
      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        image_url: dataUrl,
        ai_score: result.score,
        caption: result.verdict,
        pseudo: profile?.firstName ?? null,
        challenge_name: challenge.name,
        challenge_met: !!result.challenge_met,
      });
      if (error) throw error;
      setShared(true);
      toast.success("Posté dans Top Vibes !");
      navigate("/app/topvibes");
    } catch (e) {
      console.error(e);
      toast.error("Impossible de partager pour l'instant.");
    } finally {
      setSharing(false);
      setConfirmShare(false);
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
          {t("scan.kicker")}
        </p>
        <h1 className="mt-1 font-serif text-3xl">{t("scan.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("scan.subtitle")}
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
            <p className="max-w-xs text-sm leading-snug text-muted-foreground">
              {t("scan.hint")}
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
            className="h-14 flex-1 rounded-3xl bg-gradient-brand font-serif text-lg text-foreground hover:opacity-90 shadow-brand border-0"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {loading ? t("scan.loading") : preview ? t("scan.change") : t("scan.choose")}
          </Button>
          {preview && !loading && result && (
            <Button
              variant="outline"
              onClick={() => dataUrl && analyze(dataUrl)}
              className="h-12 rounded-3xl"
            >
              {t("scan.rescore")}
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
                  {t("scan.kicker")}
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
            <p className="mt-3 font-serif text-lg leading-snug">{result.verdict}</p>
            {result.challenge_met != null && (
              <div className={`mt-3 flex items-start gap-2 rounded-2xl p-3 text-sm ${result.challenge_met ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                <Flame className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Défi : {challenge.name}</p>
                  <p className="text-xs">{result.challenge_met ? "Validé" : "Non détecté sur la photo"}{result.challenge_reason ? ` — ${result.challenge_reason}` : ""}</p>
                </div>
              </div>
            )}
            {result.score >= 9 ? (
              <Button
                onClick={() => setConfirmShare(true)}
                disabled={sharing || shared}
                className="mt-4 h-11 w-full rounded-2xl bg-gradient-brand text-foreground shadow-brand"
              >
                {sharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                {shared ? "Posté dans Top Vibes" : "Partager mon look dans le Feed"}
              </Button>
            ) : (
              <p className="mt-4 rounded-2xl bg-secondary p-3 text-center text-xs text-muted-foreground">
                Score 9.0+ requis pour entrer dans Top Vibes (actuel : {result.score.toFixed(1)})
              </p>
            )}
          </div>

          {/* Points forts / À améliorer */}
          <div className="grid gap-3">
            <AnalysisRow icon={<Check className="h-4 w-4" />} label={t("scan.strong")} text={result.strong} />
            <AnalysisRow icon={<AlertCircle className="h-4 w-4" />} label={t("scan.weak")} text={result.weak} highlight />
          </div>

          {/* Conseils */}
          <div className="rounded-3xl bg-secondary p-5">
            <p className="mb-3 font-serif text-lg leading-none">
              {t("scan.tipsTitle")}
            </p>
            <ol className="space-y-3">
              {result.tips.map((t, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-[11px] font-semibold text-foreground">
                    {i + 1}
                  </span>
                  <p>{t}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* L'avis de VIBE — audit styliste */}
          {(result.fit || result.colors || result.touch2026) && (
            <section className="rounded-3xl bg-card p-5 shadow-card">
              <header className="mb-4 flex items-center justify-between">
                <p className="font-serif text-xl leading-none">L'avis de VIBE</p>
                <span className="rounded-full bg-secondary px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Audit styliste
                </span>
              </header>
              <div className="space-y-4">
                {result.fit && (
                  <AuditBlock icon={<Ruler className="h-4 w-4" />} title="Analyse du Fit" text={result.fit} />
                )}
                {result.colors && (
                  <AuditBlock icon={<Palette className="h-4 w-4" />} title="Harmonie des couleurs" text={result.colors} />
                )}
                {result.touch2026 && (
                  <AuditBlock
                    icon={<Sparkles className="h-4 w-4" />}
                    title="La Touche 2026"
                    text={result.touch2026}
                    accent
                  />
                )}
              </div>
            </section>
          )}

          {/* Shopping list affiliée */}
          {result.shopping && result.shopping.length > 0 && (
            <section>
              <header className="mb-3 flex items-center gap-2 px-1">
                <ShoppingBag className="h-4 w-4 text-foreground" strokeWidth={1.8} />
                <p className="font-serif text-xl leading-none">Complète ta tenue</p>
              </header>
              <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
                {result.shopping.map((item, i) => (
                  <ShoppingCard key={i} item={item} />
                ))}
              </div>
            </section>
          )}

          <StylistChat
            mode="scan"
            context={{ scan: result }}
            intro="Verdict posé. Pose-moi tes questions — couleur, coupe, accessoire, alternative à acheter."
            suggestions={[
              "Quelle couleur de chaussure mettre ?",
              "Comment porter ça en hiver ?",
              "Une alternative plus chic ?",
            ]}
          />
        </div>
      )}
      <AlertDialog open={confirmShare} onOpenChange={setConfirmShare}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Partager dans Top Vibes</AlertDialogTitle>
            <AlertDialogDescription>
              En partageant tu confirmes être l'auteur de la photo et autorises VIBE à l'afficher publiquement
              dans le classement hebdomadaire. La photo sera supprimée au reset de la semaine
              (sauf si tu finis n°1, dans ce cas elle rejoint le Hall of Fame).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sharing}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={shareToFeed} disabled={sharing}>
              {sharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              J'accepte et je partage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
        highlight ? "bg-gradient-brand text-foreground shadow-brand" : "bg-card shadow-card"
      }`}
    >
      <div className={`flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest ${
        highlight ? "text-foreground/70" : "text-muted-foreground"
      }`}>
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function AuditBlock({
  icon,
  title,
  text,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        accent ? "bg-gradient-brand text-foreground shadow-brand" : "bg-secondary"
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full ${
            accent ? "bg-foreground/10" : "bg-card"
          }`}
        >
          {icon}
        </span>
        <p className="font-serif text-base leading-none">{title}</p>
      </div>
      <p className={`text-sm leading-relaxed ${accent ? "text-foreground/90" : "text-foreground"}`}>
        {text}
      </p>
    </div>
  );
}

function ShoppingCard({ item }: { item: { name: string; brand: string; price: string; why: string; query: string } }) {
  const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(item.query)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-56 shrink-0 snap-start flex-col rounded-3xl bg-card p-3 shadow-card transition hover:shadow-brand"
    >
      <div className="mb-3 flex aspect-square items-center justify-center rounded-2xl bg-secondary">
        <ShoppingBag className="h-10 w-10 text-muted-foreground" strokeWidth={1.2} />
      </div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{item.brand}</p>
      <p className="mt-0.5 line-clamp-2 font-serif text-sm leading-snug">{item.name}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{item.why}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono-tech text-sm font-semibold">{item.price}</span>
        <span className="flex items-center gap-1 rounded-full bg-gradient-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground shadow-brand">
          Acheter
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}