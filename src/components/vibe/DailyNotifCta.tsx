import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { toast } from "sonner";
import {
  initDailyChallengeNotif,
  isNotifSupported,
  isOptedIn,
  requestNotifPermission,
} from "@/lib/dailyNotif";
import { requestPushPermission } from "@/lib/push";

export const DailyNotifCta = () => {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(isNotifSupported());
    setEnabled(isOptedIn());
  }, []);

  if (!supported) return null;

  const onEnable = async () => {
    setBusy(true);
    try {
      const p = await requestNotifPermission();
      if (p === "granted") {
        setEnabled(true);
        initDailyChallengeNotif();
        // Souscrit aussi aux push OneSignal (défi du jour + nouveautés
        // envoyées par broadcast serveur, fonctionne app fermée).
        await requestPushPermission().catch(() => false);
        toast.success("Notif activée", {
          description: "Défi du jour à 7h + nouveautés Vibe.",
        });
      } else {
        toast.error("Permission refusée", {
          description: "Tu peux l'activer dans les réglages du navigateur.",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  if (enabled) {
    return (
      <div className="flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-emerald-500" />
        Notifs activées — défi du jour 7h + nouveautés.
      </div>
    );
  }

  return (
    <button
      onClick={onEnable}
      disabled={busy}
      className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card p-4 text-left shadow-card transition active:scale-[0.99] disabled:opacity-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary">
        <Bell className="h-5 w-5 text-foreground" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-base leading-none">Active les notifs Vibe</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Défi du jour à 7h + alertes nouveautés et challenges spéciaux.
        </p>
      </div>
      <BellOff className="h-4 w-4 text-muted-foreground" />
    </button>
  );
};