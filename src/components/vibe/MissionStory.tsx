import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Share2, Upload, Sparkles, Clock, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  canSubmitStory,
  fileToDownscaledDataUrl,
  getRecentStoryImages,
  markShareNow,
  pushRecentStoryImage,
  formatRemaining,
} from "@/lib/storyMission";
import { updateProfile, getProfile } from "@/lib/profile";

type State = "idle" | "uploading" | "verifying" | "done" | "error";

const ERROR_KEYS = [
  "not_a_story", "no_outfit", "missing_tag", "close_friends",
  "duplicate", "rate_limited", "payment_required", "ai_error",
] as const;

export const MissionStory = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<State>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const [cooldown, setCooldown] = useState(canSubmitStory());
  // Progression locale 0..5. Le serveur garde la vérité, mais on l'affiche
  // immédiatement après chaque soumission.
  const [progress, setProgress] = useState<number>(() => {
    const raw = localStorage.getItem("vibe.story.progress");
    return raw ? Math.min(5, Number(raw) % 5) : 0;
  });
  const [justGrantedCredit, setJustGrantedCredit] = useState(false);

  const errorMessage = (code?: string) =>
    code && ERROR_KEYS.includes(code as any)
      ? t(`missionStory.errors.${code}`)
      : t("missionStory.errors.ai_error");

  const refreshCooldown = () => setCooldown(canSubmitStory());

  const onFile = async (file: File) => {
    const c = canSubmitStory();
    if (!c.ok) {
      toast.error(t("missionStory.cooldownTitle"), {
        description: t("missionStory.cooldownDesc", { time: formatRemaining(c.remainingMs) }),
      });
      return;
    }
    try {
      setState("uploading");
      const dataUrl = await fileToDownscaledDataUrl(file);
      const recentImages = getRecentStoryImages();

      setState("verifying");
      const { data, error } = await supabase.functions.invoke("verify-story", {
        body: { imageBase64: dataUrl, recentImages },
      });

      if (error || !data) {
        setState("error");
        toast.error(errorMessage((data as any)?.error));
        return;
      }

      if (data.error) {
        setState("error");
        toast.error(errorMessage(data.error));
        return;
      }

      if (!data.valid) {
        setState("error");
        toast.error(t("missionStory.rejected"), {
          description: errorMessage(data.code),
        });
        return;
      }

      // Succès
      pushRecentStoryImage(dataUrl);
      markShareNow();

      // Mettre à jour la progression locale (0→5)
      const nextProgress = ((progress + 1) % 5) || (data.creditsGranted ? 0 : (progress + 1));
      setProgress(nextProgress);
      localStorage.setItem("vibe.story.progress", String(nextProgress));

      // Si le serveur a crédité 1 scan, le refléter dans le profil local
      if (data.creditsGranted && data.creditsGranted > 0) {
        const cur = getProfile();
        if (cur) updateProfile({ vibers: (cur.vibers ?? 0) + data.creditsGranted });
        setJustGrantedCredit(true);
      } else {
        setJustGrantedCredit(false);
      }

      setState("done");
      refreshCooldown();
    } catch (e) {
      console.error(e);
      setState("error");
      toast.error(t("missionStory.uploadError"));
    }
  };

  const disabled = !cooldown.ok || state === "uploading" || state === "verifying";
  const filled = progress;
  const remaining = 5 - filled;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card">
      {/* halo accent (suit le thème) */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-40"
        style={{ background: "hsl(var(--accent))" }}
      />

      <div className="relative">
        <div className="flex items-center gap-1.5">
          <Share2 className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
          <span className="font-serif text-lg leading-none text-foreground">
            {t("missionStory.title")}
          </span>
          <span className="ml-auto rounded-full bg-accent px-2 py-0.5 font-mono-tech text-[10px] font-bold text-accent-foreground">
            {filled}/5
          </span>
        </div>

        <p className="mt-3 text-sm leading-snug text-foreground/90">
          {t("missionStory.subtitle")}
        </p>

        {/* Progress dots 0..5 */}
        <div className="mt-3 flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < filled ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          {t("missionStory.progress", { remaining })}
        </p>

        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <li>• {t("missionStory.rule1")}</li>
          <li>• {t("missionStory.rule2")}</li>
          <li>• {t("missionStory.rule3")}</li>
        </ul>

        <div className="mt-4">
          {state === "verifying" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent" />
              {t("missionStory.verifying")}
            </div>
          )}
          {state === "uploading" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="h-3.5 w-3.5 animate-pulse" />
              {t("missionStory.uploading")}
            </div>
          )}
          {state === "done" && (
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Check className="h-3.5 w-3.5" />
              {justGrantedCredit
                ? t("missionStory.scanGranted")
                : t("missionStory.storyValidated")}
            </div>
          )}
          {state === "error" && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("missionStory.errorHint")}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onFile(f);
          }}
        />

        {!cooldown.ok ? (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {t("missionStory.nextIn", { time: formatRemaining(cooldown.remainingMs) })}
          </div>
        ) : (
          <button
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-tight text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={2} />
            {state === "verifying" || state === "uploading"
              ? t("missionStory.verifyingShort")
              : state === "done"
              ? t("missionStory.tomorrow")
              : t("missionStory.upload")}
          </button>
        )}
      </div>
    </div>
  );
};