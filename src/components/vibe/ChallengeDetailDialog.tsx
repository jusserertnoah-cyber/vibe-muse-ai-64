import { useEffect, useState } from "react";
import { Flame, Sparkles, Target, Camera, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DailyChallenge } from "@/lib/challenges";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  challenge: DailyChallenge;
  onScan: () => void;
}

export const ChallengeDetailDialog = ({ open, onOpenChange, challenge, onScan }: Props) => {
  const [completed, setCompleted] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("challenges_completed")
        .eq("id", uid)
        .maybeSingle();
      if (active && data) setCompleted(data.challenges_completed ?? 0);
    })();
    return () => { active = false; };
  }, [open]);

  const inCycle = completed != null ? completed % 10 : 0;
  const remaining = completed != null ? 10 - inCycle : 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-accent" />
            Défi du jour
          </div>
          <DialogTitle className="font-serif text-2xl leading-tight">
            {challenge.name}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {challenge.hint}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Comment ça marche */}
          <div className="rounded-2xl bg-secondary p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Comment ça marche
            </div>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">1</span>
                <span>Avant de te prendre en photo, intègre l'élément du défi dans ta tenue.</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">2</span>
                <span>L'objet doit être <strong>clairement visible</strong> sur la photo (l'IA vérifie).</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">3</span>
                <span>Lance ton scan : si validé, le défi compte pour le compteur.</span>
              </li>
            </ol>
          </div>

          {/* Détail de détection */}
          <div className="rounded-2xl border border-border p-4">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Ce que l'IA cherche
            </div>
            <p className="text-sm text-foreground/90">{challenge.detect}</p>
          </div>

          {/* Récompense + progression */}
          <div className="rounded-2xl bg-gradient-brand p-4 shadow-brand">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-foreground/70">
              <Trophy className="h-3.5 w-3.5" />
              Récompense
            </div>
            <p className="font-serif text-lg leading-tight">
              10 défis réussis = 1 scan offert
            </p>
            {completed != null && (
              <>
                <div className="mt-3 flex items-center gap-1.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${i < inCycle ? "bg-foreground" : "bg-foreground/20"}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-xs text-foreground/80">
                  {inCycle}/10 — encore <strong>{remaining}</strong> défi{remaining > 1 ? "s" : ""} pour ton prochain scan offert.
                </p>
              </>
            )}
          </div>

          <Button
            onClick={onScan}
            className="h-12 w-full rounded-2xl bg-foreground text-background hover:bg-foreground/90"
          >
            <Camera className="mr-2 h-4 w-4" />
            Scanner ma tenue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};