import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, Mic, Send, Sparkles, Square, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getProfile } from "@/lib/profile";
import { awardVibers } from "@/lib/vibers";
import { getTier } from "@/lib/tier";
import { pushHistory } from "@/lib/history";
import { getCurrentWeather, type WeatherSnapshot } from "@/lib/weather";
import { supabase } from "@/integrations/supabase/client";
import { StylistChat } from "@/components/vibe/StylistChat";

// Lightweight typing for the Web Speech API
type SR = any;
function getSpeechRecognition(): SR | null {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export default function Dressing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const profile = getProfile();

  const [brief, setBrief] = useState("");
  const [outfitPhoto, setOutfitPhoto] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [look, setLook] = useState<{
    bullets: string[];
    advice: string;
    imageUrl: string | null;
  } | null>(null);

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentWeather().then((w) => w && setWeather(w));
  }, []);

  const exit = () => navigate("/app");

  // --- Voice dictation ---
  const toggleRecording = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error("Dictée vocale non supportée sur ce navigateur");
      return;
    }
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = (i18n.language?.split("-")[0] === "en" ? "en-US" : "fr-FR");
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = brief ? brief + " " : "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setBrief((finalText + interim).replace(/\s+/g, " ").trimStart());
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  // --- Photo upload ---
  const onPickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Photo trop lourde (max 6 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setOutfitPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // --- Generate ---
  const generate = async () => {
    if (!brief.trim() && !outfitPhoto) {
      toast("Décris ta tenue ou ajoute une photo");
      return;
    }
    setLoading(true);
    setLook(null);
    try {
      const w = weather ?? (await getCurrentWeather());
      if (w && !weather) setWeather(w);

      const { data, error } = await supabase.functions.invoke("generate-look", {
        body: {
          userBrief: brief.trim() || undefined,
          outfitPhoto: outfitPhoto || undefined,
          gender: profile?.gender,
          age: profile?.age,
          heightCm: profile?.heightCm,
          weightKg: profile?.weightKg,
          city: w?.city ?? profile?.city,
          weather: w ? { temp: w.temp, code: w.code, label: w.label } : null,
          closet: profile?.closet ?? [],
          referencePhoto: profile?.referencePhoto ?? null,
          lang: i18n.language?.split("-")[0] ?? "fr",
          tier: getTier(),
        },
      });

      if (error) throw error;
      if ((data as any)?.error === "rate_limited") {
        toast.error(t("dressing.rateLimited"));
        return;
      }
      if ((data as any)?.error === "payment_required") {
        toast.error(t("dressing.paymentRequired"));
        return;
      }

      setLook({
        bullets: (data as any)?.bullets ?? [],
        advice: (data as any)?.advice ?? "",
        imageUrl: (data as any)?.imageUrl ?? null,
      });
      awardVibers("look");
      pushHistory({ type: "look", imageUrl: (data as any)?.imageUrl ?? null });
    } catch (e) {
      console.error(e);
      toast.error(t("dressing.error"));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLook(null);
    setBrief("");
    setOutfitPhoto(null);
  };

  // ---- Result view ----
  if (look) {
    return (
      <div className="min-h-screen bg-background px-5 pt-8 pb-32 animate-fade-in">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={reset} className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("dressing.newLook")}
            </button>
            <button onClick={exit}><X className="h-5 w-5" /></button>
          </div>
          <div className="overflow-hidden rounded-3xl bg-card shadow-card">
            <div className="relative aspect-[3/4] w-full bg-gradient-luxe">
              {look.imageUrl ? (
                <img src={look.imageUrl} alt="Look généré" className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full glass-panel px-4 py-2 text-xs uppercase tracking-widest">
                    {t("dressing.noImage")}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3 p-5">
              <ul className="space-y-1 text-sm">
                {look.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 text-accent" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl bg-secondary p-4 text-sm leading-relaxed">
                <div className="mb-1 text-[10px] font-medium uppercase tracking-widest text-accent">
                  {t("dressing.stylistAdvice")}
                </div>
                {look.advice}
              </div>
            </div>
          </div>

          <StylistChat
            mode="look"
            context={{
              look: { brief, bullets: look.bullets, advice: look.advice },
              weather: weather ? { temp: weather.temp, label: weather.label } : null,
            }}
            intro="Tenue posée. Une question, un swap, un accessoire ? Je t'écoute."
            suggestions={[
              "Avec quelles chaussures ?",
              "Plus chaud pour ce soir ?",
              "Une alternative plus chic ?",
            ]}
          />
        </div>
      </div>
    );
  }

  // ---- Loading view ----
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background animate-fade-in">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-accent/20" />
          <Loader2 className="absolute inset-0 m-auto h-12 w-12 animate-spin text-accent" />
        </div>
        <div className="text-center">
          <p className="font-serif text-2xl">{t("dressing.generating")}</p>
        </div>
      </div>
    );
  }

  // ---- Conversational input view ----
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background">
      <header className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={exit}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {weather ? `${weather.temp}° · ${weather.label}` : "Vibe Dressing"}
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-44">
        <div className="mx-auto max-w-md animate-fade-up space-y-6">
          <div>
            <h2 className="font-serif text-3xl leading-tight">Dis-moi ta tenue.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Décris-la, dicte-la à l'oral, ou montre-moi une photo de tes habits — je compose le look.
            </p>
          </div>

          {/* Text + voice input */}
          <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Ex: Soirée date un peu chic, je veux rester chill, plutôt sombre. Ou : look sport pour aller au café avec des potes…"
              className="min-h-[140px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0"
            />
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={toggleRecording}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  recording
                    ? "border-destructive bg-destructive text-destructive-foreground animate-pulse"
                    : "border-border bg-background hover:border-accent/50"
                )}
              >
                {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {recording ? "Stop" : "Dicter"}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:border-accent/50"
              >
                <ImagePlus className="h-4 w-4" />
                Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Outfit photo preview */}
          {outfitPhoto && (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
              <img src={outfitPhoto} alt="Tenue de référence" className="aspect-[4/3] w-full object-cover" />
              <button
                onClick={() => setOutfitPhoto(null)}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-3 left-3 rounded-full bg-accent px-3 py-1 text-[10px] uppercase tracking-widest text-accent-foreground">
                Inspiration tenue
              </div>
            </div>
          )}

          {profile?.closet?.length ? (
            <p className="text-xs text-muted-foreground">
              ✨ {t("dressing.closetUsed", { count: profile.closet.length })}
            </p>
          ) : null}
        </div>
      </div>

      <div className="fixed bottom-24 left-0 right-0 z-40 px-5 animate-fade-up">
        <div className="mx-auto max-w-md">
          <Button
            onClick={generate}
            disabled={!brief.trim() && !outfitPhoto}
            className="h-16 w-full rounded-3xl bg-gradient-brand text-foreground hover:opacity-90 text-lg font-semibold shadow-brand disabled:opacity-40 disabled:shadow-none border-0"
          >
            <Wand2 className="mr-2 h-5 w-5" />
            {t("dressing.generate")}
          </Button>
        </div>
      </div>
    </div>
  );
}
