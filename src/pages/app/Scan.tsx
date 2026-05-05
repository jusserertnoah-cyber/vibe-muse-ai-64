import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Upload, Loader2, Check, AlertCircle, Ruler, Palette, Sparkles, ShoppingBag, ExternalLink, Share2, Flame, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getProfile } from "@/lib/profile";
import { awardVibers } from "@/lib/vibers";
import { getTier } from "@/lib/tier";
import { pushHistory } from "@/lib/history";
import { toast } from "sonner";
import { StylistChat } from "@/components/vibe/StylistChat";
import { audienceFromGender, getDailyChallenge, getLocalizedChallenge } from "@/lib/challenges";
import { getCoords, fetchWeather, getCurrentWeather, type WeatherSnapshot } from "@/lib/weather";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScanOverlay } from "@/components/vibe/ScanOverlay";
import { compressImageFile } from "@/lib/imageCompress";

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

// Conversion + compression : on envoie ~1024px JPEG q0.82 à l'IA pour limiter
// le payload et éviter les rate-limits.
const fileToDataUrl = (file: File) => compressImageFile(file, 1024, 0.82);

const OCCASION_KEYS = [
  "date","evening","work","brunch","wedding","friends","romantic","school","sport","travel",
] as const;

export default function Scan() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  // Score "fini" injecté dans l'overlay pour déclencher l'animation finale.
  // Reste à null tant que l'analyse n'est pas terminée avec succès.
  const [finishingScore, setFinishingScore] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  // Message "analyse approfondie" après 15s
  const [longRunning, setLongRunning] = useState(false);
  // Étape "contexte" entre import photo et analyse
  const [contextOpen, setContextOpen] = useState(false);
  const [occasion, setOccasion] = useState<string>("");
  const [occasionNote, setOccasionNote] = useState<string>("");
  const profileForChallenge = getProfile();
  // Température courante (cache léger via getCurrentWeather) → défi adapté à la météo.
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  useEffect(() => {
    getCurrentWeather().then((w) => { if (w) setCurrentTemp(w.temp); }).catch(() => {});
  }, []);
  const challenge = useMemo(
    () => getLocalizedChallenge(getDailyChallenge(audienceFromGender(profileForChallenge?.gender), new Date(), currentTemp)),
    [currentTemp, profileForChallenge?.gender, i18n.language],
  );

  const onFile = async (f: File) => {
    setResult(null);
    setShared(false);
    setPreview(URL.createObjectURL(f));
    try {
      const url = await fileToDataUrl(f);
      setDataUrl(url);
      // Avant d'analyser, on demande le contexte (occasion / situation)
      setContextOpen(true);
    } catch {
      toast.error(t("scan.readError"));
    }
  };

  const analyze = async (img: string, ctx?: { occasion?: string; note?: string }) => {
    const profile = getProfile();
    // Garde-fou : sans session Supabase, l'edge function rejette en 401.
    // On redirige vers l'onboarding pour que l'utilisateur s'authentifie.
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      toast.error(t("scan.errors.auth", { defaultValue: "Connecte-toi pour scanner ta tenue." }));
      navigate("/onboarding");
      return;
    }
    setLoading(true);
    setFinishingScore(null);
    setLongRunning(false);
    const longTimer = setTimeout(() => setLongRunning(true), 15000);
    // Météo auto (l'IA "sait" déjà, vu qu'on l'a dans l'app)
    let weather: WeatherSnapshot | null = null;
    try {
      const c = await getCoords();
      weather = await fetchWeather(c.lat, c.lon);
    } catch {
      // pas de météo dispo, on continue sans
    }
    // Appel direct via fetch : on évite supabase.functions.invoke qui
    // log un console.error sur tout statut non-2xx (402, 422, 429…),
    // ce qui déclenche l'overlay runtime-error "blank screen".
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-look`;
    const token = sess.session.access_token;
    const payload = {
      imageDataUrl: img,
      gender: profile?.gender,
      age: profile?.age,
      heightCm: profile?.heightCm,
      weightKg: profile?.weightKg,
      lang: i18n.language?.split("-")[0] ?? "fr",
      tier: getTier(),
      challenge: { name: challenge.name, detect: challenge.detect },
      occasion: ctx?.occasion ?? undefined,
      occasionNote: ctx?.note ?? undefined,
      weather: weather
        ? { temp: weather.temp, label: weather.label, city: weather.city ?? null }
        : undefined,
    };
    const callOnce = () => fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(payload),
    });
    try {
      let res: Response;
      try {
        res = await callOnce();
      } catch (netErr) {
        // Retry discret en cas d'erreur réseau pure
        await new Promise((r) => setTimeout(r, 800));
        res = await callOnce();
      }
      const status = res.status;
      let data: any = null;
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        const errCode = String(data?.error ?? "").toLowerCase();
        if (status === 402 || errCode === "no_credits") {
          toast.error(t("scan.creditInsufficient"), { description: t("scan.creditTopup") });
          navigate("/app/paywall");
          return;
        }
        if (status === 422 || errCode === "not_human") {
          toast.error(t("scan.errors.notHuman", { defaultValue: "Cette image n'est pas une tenue. Aucun crédit n'a été utilisé." }));
          return;
        }
        if (status === 429 || errCode === "rate_limited") {
          toast.error("L'IA analyse trop de styles en ce moment, réessaie dans 30 secondes 😅", { description: "Aucun crédit utilisé." });
          return;
        }
        if (status === 401) {
          toast.error(t("scan.errors.auth", { defaultValue: "Connecte-toi pour scanner ta tenue." }));
          navigate("/onboarding");
          return;
        }
        throw new Error(`scan-look ${status} ${errCode}`);
      }
      if (data?.error === "not_human") {
        toast.error(t("scan.errors.notHuman", { defaultValue: "Cette image n'est pas une tenue. Aucun crédit n'a été utilisé." }));
        return;
      }
      if (data?.error === "no_credits") {
        toast.error(t("scan.creditInsufficient"), { description: t("scan.creditTopup") });
        navigate("/app/paywall");
        return;
      }
      if (data?.error === "rate_limited") {
        toast.error("L'IA analyse trop de styles en ce moment, réessaie dans 30 secondes 😅", {
          description: "Aucun crédit utilisé.",
        });
        return;
      }
      if (data?.error === "payment_required") {
        toast.error(t("scan.errors.credits"));
        return;
      }
      if (!data?.score) {
        toast.error(t("scan.errors.blur"));
        return;
      }
      const r = data as ScanResult;
      setResult(r);
      // Déclenche l'animation finale dans l'overlay (compteur + score),
      // l'overlay se ferme tout seul via onDone.
      setFinishingScore(typeof r.score === "number" ? r.score : 0);
      if (r.challenge_met) {
        if (r.challenge_reward?.granted_credit) {
          toast.success(t("scan.challengeBonus"), { description: t("scan.challengeBonusDesc") });
        } else {
          toast.success(t("scan.challengeOk", { name: challenge.name }), {
            description: r.challenge_reward ? t("scan.challengeProgress", { n: r.challenge_reward.total_completed % 10 }) : undefined,
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
      setFinishingScore(null);
    } finally {
      clearTimeout(longTimer);
      setLongRunning(false);
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
        toast.error(t("scan.shareLogin"));
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
      toast.success(t("scan.shareDone"));
      navigate("/app/topvibes");
    } catch (e) {
      console.error(e);
      toast.error(t("scan.shareError"));
    } finally {
      setSharing(false);
      setConfirmShare(false);
    }
  };

  const scoreColor = result
    ? result.score >= 8
      ? "text-accent"
      : result.score >= 6.5
      ? "text-foreground"
      : "text-destructive"
    : "text-foreground";

  return (
    <div className="space-y-6 px-5 pt-8">
      <ScanOverlay
        imageUrl={preview ?? ""}
        open={loading || finishingScore != null}
        finishingScore={finishingScore}
        onDone={() => setFinishingScore(null)}
      />
      {/* HERO + picker : masqués dès qu'un résultat est dispo, pour que la
          page résultat remplace entièrement l'écran (pas de superposition). */}
      {!result && (
      <>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 text-foreground shadow-card">
        {/* halos lime adoucis sur fond clair */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "hsl(var(--accent))" }}
        />
        <div
          className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(var(--accent))" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground" /> {t("scan.kicker")}
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight">
            {t("scan.title")}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-snug text-muted-foreground">
            {t("scan.subtitle")}
          </p>

          {/* mini specs */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: <Ruler className="h-3.5 w-3.5" />, label: t("scan.specFit") },
              { icon: <Palette className="h-3.5 w-3.5" />, label: t("scan.specColors") },
              { icon: <Sparkles className="h-3.5 w-3.5" />, label: t("scan.spec2026") },
            ].map((it) => (
              <div
                key={it.label}
                className="flex items-center justify-center gap-1.5 rounded-full bg-secondary px-2 py-1.5 text-[10px] font-medium uppercase tracking-widest text-foreground"
              >
                {it.icon}
                {it.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-3xl border border-dashed border-border bg-card p-6">
        {preview && (
          <img
            src={preview}
            alt={t("scan.previewAlt")}
            className="mx-auto h-72 rounded-2xl object-cover"
          />
        )}
        {/* Inputs cachés : caméra (capture) + galerie */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />

        {/* Action directe : 2 cartes minimalistes (style Apple / Cal.com).
            Cliquer ouvre directement le picker fichier — pas d'étape intermédiaire. */}
        <div className={`grid grid-cols-2 gap-3 ${preview ? "mt-5" : ""}`}>
          <button
            onClick={() => !loading && fileRef.current?.click()}
            disabled={loading}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-card p-6 text-foreground shadow-soft transition-all duration-200 ease-out hover:border-foreground/40 active:scale-95 disabled:opacity-60"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground text-background transition-transform duration-200 group-hover:scale-105">
              <Camera className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <span className="text-[15px] font-medium leading-none">Prendre une photo</span>
            <span className="text-[11px] text-muted-foreground">Caméra arrière</span>
          </button>
          <button
            onClick={() => !loading && galleryRef.current?.click()}
            disabled={loading}
            className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-card p-6 text-foreground shadow-soft transition-all duration-200 ease-out hover:border-foreground/40 active:scale-95 disabled:opacity-60"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground transition-transform duration-200 group-hover:scale-105">
              <Upload className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <span className="text-[15px] font-medium leading-none">Importer une photo</span>
            <span className="text-[11px] text-muted-foreground">Depuis la galerie</span>
          </button>
        </div>

        {preview && !loading && result && (
          <Button
            variant="outline"
            onClick={() => dataUrl && analyze(dataUrl)}
            className="mt-3 h-12 w-full rounded-3xl"
          >
            {t("scan.rescore")}
          </Button>
        )}
        {loading && (
          <p className="mt-4 text-center font-serif text-sm italic text-muted-foreground transition-opacity duration-300">
            {longRunning ? "Analyse approfondie en cours…" : "Vibe : ne doute plus jamais de ton style."}
          </p>
        )}
      </div>
      </>
      )}

      {result && (
        <div className="animate-fade-up space-y-6">
          {/* Photo de la tenue analysée + bouton "nouveau scan" */}
          {preview && (
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              <img
                src={preview}
                alt={t("scan.previewAlt")}
                className="h-72 w-full object-cover"
              />
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setPreview(null);
              setDataUrl(null);
              setShared(false);
              setFinishingScore(null);
            }}
            className="h-11 w-full rounded-3xl"
          >
            Nouveau scan
          </Button>
          {/* Score */}
          <div className="vibe-haptic rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-end justify-between">
              <div>
                <p className="label-ai">Vibe Score</p>
                <div className={`font-mono-tech text-6xl font-bold leading-none tracking-tighter ${scoreColor}`}>
                  {Number.isInteger(result.score) ? result.score : result.score.toFixed(1)}
                  <span className="text-2xl text-muted-foreground">/10</span>
                </div>
              </div>
              <div className="rounded-full border border-border bg-secondary px-3 py-1 font-mono-tech text-[10px] font-bold uppercase tracking-[0.1em] text-foreground">
                {result.style ?? t("scan.vibers")}
              </div>
            </div>
            <p className="mt-3 text-base leading-snug text-foreground">{result.verdict}</p>

            {/* Dashboard d'analyse — 3 barres dérivées du score (avec léger
                offset déterministe pour donner du relief, sans changer la note). */}
            <ScoreBars score={result.score} />

            {result.challenge_met != null && (
              <div className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${result.challenge_met ? "border-accent/40 bg-accent/10 text-foreground" : "border-border bg-secondary text-muted-foreground"}`}>
                <Flame className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">{t("scan.challengeLabel")} : {challenge.name}</p>
                  <p className="text-xs">{result.challenge_met ? t("scan.challengeValidated") : t("scan.challengeNotDetected")}{result.challenge_reason ? ` — ${result.challenge_reason}` : ""}</p>
                </div>
              </div>
            )}
            <Button
              onClick={() => setConfirmShare(true)}
              disabled={sharing || shared || result.score < 9}
              className="mt-4 h-12 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
            >
              {sharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
              {shared
                ? t("scan.sharedDone")
                : result.score >= 9
                ? "Partager mon score"
                : t("scan.scoreNeeded", { score: result.score.toFixed(1) })}
            </Button>
          </div>

          {/* Points forts / À améliorer */}
          <div className="grid gap-3">
            <AnalysisRow icon={<Check className="h-4 w-4" />} label={t("scan.strong")} text={firstSentence(result.strong)} />
            <AnalysisRow icon={<AlertCircle className="h-4 w-4" />} label={t("scan.weak")} text={firstSentence(result.weak)} highlight />
          </div>

          {/* Conseils */}
          <div className="space-y-3">
            <p className="label-ai">{t("scan.tipsTitle")}</p>
            <div className="grid gap-3">
              {result.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-soft"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary font-mono-tech text-[11px] font-bold text-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[15px] leading-snug text-foreground">{firstSentence(tip)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* L'avis de VIBE — audit styliste */}
          {(result.fit || result.colors || result.touch2026) && (
            <section className="rounded-3xl bg-card p-5 shadow-card">
              <header className="mb-4 flex items-center justify-between">
                <p className="font-serif text-xl leading-none">{t("scan.vibeAdvice")}</p>
                <span className="rounded-full bg-secondary px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {t("scan.stylistAudit")}
                </span>
              </header>
              <div className="space-y-4">
                {result.fit && (
                  <AuditBlock icon={<Ruler className="h-4 w-4" />} title={t("scan.auditFit")} text={firstSentence(result.fit)} />
                )}
                {result.colors && (
                  <AuditBlock icon={<Palette className="h-4 w-4" />} title={t("scan.auditColors")} text={firstSentence(result.colors)} />
                )}
                {result.touch2026 && (
                  <AuditBlock
                    icon={<Sparkles className="h-4 w-4" />}
                    title={t("scan.auditTouch")}
                    text={firstSentence(result.touch2026)}
                    accent
                  />
                )}
              </div>
            </section>
          )}

          <StylistChat
            mode="scan"
            context={{ scan: result }}
            intro={t("stylistChat.scanIntro")}
            suggestions={[
              t("stylistChat.scanSug1"),
              t("stylistChat.scanSug2"),
              t("stylistChat.scanSug3"),
            ]}
          />
        </div>
      )}
      <AlertDialog open={confirmShare} onOpenChange={setConfirmShare}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scanDialog.shareTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scanDialog.shareDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sharing}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={shareToFeed} disabled={sharing}>
              {sharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("scanDialog.shareConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scanDialog.pickerTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("scanDialog.pickerDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setPickerOpen(false); fileRef.current?.click(); }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-foreground p-4 text-background transition active:scale-[0.97]"
            >
              <Camera className="h-7 w-7" strokeWidth={1.6} />
              <span className="font-serif text-sm">{t("scanDialog.pickerCamera")}</span>
            </button>
            <button
              onClick={() => { setPickerOpen(false); galleryRef.current?.click(); }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-secondary p-4 text-foreground transition active:scale-[0.97]"
            >
              <Upload className="h-7 w-7" strokeWidth={1.6} />
              <span className="font-serif text-sm">{t("scanDialog.pickerImport")}</span>
            </button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Étape contexte : occasion / situation avant l'analyse */}
      <AlertDialog open={contextOpen} onOpenChange={(o) => { if (!loading) setContextOpen(o); }}>
        <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("scanDialog.occasionTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("scanDialog.occasionDesc")}
              <span className="mt-1 block text-xs text-muted-foreground">
                {t("scanDialog.occasionWeather")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {OCCASION_KEYS.map((key) => {
                const label = t(`occasion.${key}`);
                const active = occasion === label;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOccasion(active ? "" : label)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-foreground text-background shadow-card"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
                {t("scanDialog.occasionDetails")}
              </label>
              <Textarea
                value={occasionNote}
                onChange={(e) => setOccasionNote(e.target.value.slice(0, 200))}
                placeholder={t("scanDialog.occasionPlaceholder")}
                className="min-h-[80px] rounded-2xl"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">{occasionNote.length}/200</p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading || !dataUrl}
              onClick={() => {
                if (!dataUrl) return;
                setContextOpen(false);
                analyze(dataUrl, { occasion: occasion || undefined, note: occasionNote || undefined });
              }}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              {t("scan.launchVibe")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Dashboard 3 barres : Colorimétrie / Proportions / Cohésion.
 * Les 3 valeurs sont dérivées du score global (avec un offset déterministe
 * léger basé sur le score, pas de random pour rester stable au re-render).
 * Animation : remplissage progressif au montage.
 */
function ScoreBars({ score }: { score: number }) {
  const base = Math.max(0, Math.min(10, score));
  const seed = Math.round(base * 10);
  const offsets = [
    ((seed * 7) % 9) / 10 - 0.4,   // -0.4..+0.4
    ((seed * 13) % 11) / 10 - 0.5, // -0.5..+0.5
    ((seed * 17) % 7) / 10 - 0.3,  // -0.3..+0.3
  ];
  const items = [
    { label: "Colorimétrie", value: clamp10(base + offsets[0]) },
    { label: "Proportions",  value: clamp10(base + offsets[1]) },
    { label: "Cohésion",     value: clamp10(base + offsets[2]) },
  ];
  return (
    <div className="mt-5 space-y-3">
      {items.map((it, i) => (
        <div key={it.label}>
          <div className="mb-1 flex items-center justify-between">
            <span className="label-ai">{it.label}</span>
            <span className="font-mono-tech text-[12px] font-bold text-foreground">
              {it.value.toFixed(1)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${it.value * 10}%`,
                background:
                  it.value >= 8
                    ? "hsl(140 65% 38%)"
                    : it.value >= 6.5
                    ? "hsl(220 39% 11%)"
                    : "hsl(0 72% 50%)",
                transition: `width 900ms cubic-bezier(0.2,0.7,0.2,1) ${120 * i}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function clamp10(v: number) { return Math.max(0, Math.min(10, v)); }

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

function ShoppingCard({ item, buyLabel }: { item: { name: string; brand: string; price: string; why: string; query: string }; buyLabel: string }) {
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
          {buyLabel}
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}