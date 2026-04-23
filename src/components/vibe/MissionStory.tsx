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
import { awardVibers } from "@/lib/vibers";

type State = "idle" | "uploading" | "verifying" | "done" | "error";

const ERROR_MSG: Record<string, string> = {
  not_a_story: "Ce n'est pas une story active. Envoie un screenshot d'une story Instagram ou TikTok publiée.",
  no_outfit: "Aucune tenue détectée sur la story.",
  missing_tag: "Le tag/mention de Vibe est introuvable. Ajoute @vibe ou le tag de l'app.",
  close_friends: "Les stories en Amis proches ne comptent pas. On veut de la visibilité publique.",
  duplicate: "Cette story ressemble trop à une déjà soumise. Sors une nouvelle tenue !",
  rate_limited: "Trop de demandes, réessaie dans une minute.",
  payment_required: "Crédits IA épuisés.",
  ai_error: "Vérification impossible. Réessaie.",
};

export const MissionStory = () => {
  const { t } = useTranslation();
  const [state, setState] = useState<State>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const [cooldown, setCooldown] = useState(canSubmitStory());

  const refreshCooldown = () => setCooldown(canSubmitStory());

  const onFile = async (file: File) => {
    const c = canSubmitStory();
    if (!c.ok) {
      toast.error("Reviens plus tard", {
        description: `Prochaine mission dans ${formatRemaining(c.remainingMs)}.`,
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
        toast.error(ERROR_MSG[(data as any)?.error] ?? "Vérification impossible.");
        return;
      }

      if (data.error) {
        setState("error");
        toast.error(ERROR_MSG[data.error] ?? "Vérification impossible.");
        return;
      }

      if (!data.valid) {
        setState("error");
        toast.error("Story refusée", {
          description: ERROR_MSG[data.code] ?? "Critères non remplis.",
        });
        return;
      }

      // Succès
      pushRecentStoryImage(dataUrl);
      markShareNow();
      awardVibers("share");
      setState("done");
      refreshCooldown();
    } catch (e) {
      console.error(e);
      setState("error");
      toast.error("Erreur lors de l'envoi.");
    }
  };

  const disabled = !cooldown.ok || state === "uploading" || state === "verifying";

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
            Mission Story
          </span>
          <span className="ml-auto rounded-full bg-accent px-2 py-0.5 font-mono-tech text-[10px] font-bold text-accent-foreground">
            +30
          </span>
        </div>

        <p className="mt-3 text-sm leading-snug text-foreground/90">
          Partage ta tenue en story (Instagram ou TikTok) avec le tag <span className="font-bold">@vibe</span> et empoche <span className="font-bold">30 Vibers</span>.
        </p>
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          <li>• Story publique uniquement (pas Amis proches)</li>
          <li>• Tag @vibe visible</li>
          <li>• 1 fois par 24h</li>
        </ul>

        <div className="mt-4">
          {state === "verifying" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent" />
              Analyse anti-fraude en cours…
            </div>
          )}
          {state === "uploading" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="h-3.5 w-3.5 animate-pulse" />
              Préparation de l'image…
            </div>
          )}
          {state === "done" && (
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Check className="h-3.5 w-3.5" />
              +30 Vibers crédités. Reviens demain pour une nouvelle mission.
            </div>
          )}
          {state === "error" && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              Réessaie avec une vraie story publique avec @vibe.
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
            Prochaine dans {formatRemaining(cooldown.remainingMs)}
          </div>
        ) : (
          <button
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold tracking-tight text-accent-foreground transition-all hover:opacity-90 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={2} />
            {state === "verifying" || state === "uploading"
              ? "Vérification…"
              : state === "done"
              ? "Envoyer une autre demain"
              : "Uploader ma story"}
          </button>
        )}
      </div>
    </div>
  );
};