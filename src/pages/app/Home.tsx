import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "@/lib/profile";
import { ArrowDownRight, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ScanFromDB {
  id: string;
  score: number;
  coherence: number;
  originalite: number;
  fit: number;
  point_fort: string;
  point_faible: string;
  conseil: string;
  image_url?: string;
  created_at: string;
}

export default function Home() {
  const navigate = useNavigate();
  const profile = getProfile();
  const [dbScans, setDbScans] = useState<ScanFromDB[]>([]);
  const [loading, setLoading] = useState(true);

  // Load scans from Supabase
  useEffect(() => {
    let cancelled = false;

    const fetchScans = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("scans")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
        if (!cancelled && !error && data) setDbScans(data as ScanFromDB[]);
      } catch (e) {
        console.error("Failed to load scans from DB", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // getUser() valide la session côté serveur, plus fiable que getSession()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return;
      if (user?.id) fetchScans(user.id);
      else setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const weekDays = useMemo(() => {
    const labels = ["L", "M", "M", "J", "V", "S", "D"];
    const now = new Date();
    const jsDay = now.getDay(); // 0..6 with Sunday=0
    const mondayShift = jsDay === 0 ? 6 : jsDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayShift);
    return labels.map((label, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return { label, dateKey: toDateKey(date), isToday: toDateKey(date) === toDateKey(now) };
    });
  }, []);

  const [selectedDay, setSelectedDay] = useState(
    weekDays.find((d) => d.isToday)?.dateKey ?? weekDays[0].dateKey
  );

  const scansForSelectedDay = useMemo(
    () => dbScans.filter((s) => toDateKey(new Date(s.created_at)) === selectedDay),
    [dbScans, selectedDay]
  );

  const avgScore = scansForSelectedDay.length
    ? Math.round(scansForSelectedDay.reduce((acc, s) => acc + s.score, 0) / scansForSelectedDay.length * 10) / 10
    : 0;
  const bestScore = scansForSelectedDay.length
    ? Math.max(...scansForSelectedDay.map((s) => s.score ?? 0))
    : 0;
  
  const avgCoherence = scansForSelectedDay.length
    ? Math.round(scansForSelectedDay.reduce((acc, s) => acc + s.coherence, 0) / scansForSelectedDay.length)
    : 0;
  const avgOriginalite = scansForSelectedDay.length
    ? Math.round(scansForSelectedDay.reduce((acc, s) => acc + s.originalite, 0) / scansForSelectedDay.length)
    : 0;
  const avgFit = scansForSelectedDay.length
    ? Math.round(scansForSelectedDay.reduce((acc, s) => acc + s.fit, 0) / scansForSelectedDay.length)
    : 0;

  const previousDay = useMemo(() => {
    const selected = new Date(selectedDay);
    selected.setDate(selected.getDate() - 1);
    const prevKey = toDateKey(selected);
    const prev = dbScans.filter((s) => toDateKey(new Date(s.created_at)) === prevKey);
    if (!prev.length) return null;
    const prevAvg = Math.round(prev.reduce((acc, s) => acc + s.score, 0) / prev.length * 10) / 10;
    return Math.round((avgScore - prevAvg) * 10) / 10;
  }, [selectedDay, dbScans, avgScore]);

  const hasScansByDay = useMemo(() => {
    const set = new Set<string>(dbScans.map((s) => toDateKey(new Date(s.created_at))));
    return set;
  }, [dbScans]);

  const progressPct = Math.max(0, Math.min(100, Math.round(avgScore * 10)));
  const ringDash = 2 * Math.PI * 28;
  const ringOffset = ringDash - (progressPct / 100) * ringDash;

  return (
    <div className="min-h-screen space-y-5 bg-[#FAFAFA] px-5 pt-8 pb-6 text-[#111111]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#888888]">
            BONJOUR
          </p>
          <h1
            className="mt-1 text-[32px] leading-[38px] text-[#111111]"
            style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
          >
            {profile?.firstName || "Vibe"}
          </h1>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F0F0] px-3 py-1.5 text-sm font-medium text-[#111111]">
          <Zap className="h-3.5 w-3.5" strokeWidth={2.2} />
          {profile?.vibers ?? 0}
        </div>
      </header>

      <section className="rounded-2xl border border-[#F0F0F0] bg-white px-3 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          {weekDays.map((day) => {
            const active = selectedDay === day.dateKey;
            const hasScan = hasScansByDay.has(day.dateKey);
            return (
              <button
                key={day.dateKey}
                onClick={() => setSelectedDay(day.dateKey)}
                className="flex w-9 flex-col items-center gap-1"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    active ? "bg-[#111111] text-white" : "text-[#111111]"
                  }`}
                  style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 500 }}
                >
                  {day.label}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${hasScan ? "bg-[#111111]" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#F0F0F0] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#888888]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
              Score moyen du jour
            </p>
            <p
              className="mt-1 text-5xl text-[#111111]"
              style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
            >
              {avgScore}
            </p>
          </div>
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#E5E5E5" strokeWidth="8" />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                stroke="#111111"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ringDash}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div
              className="absolute inset-0 flex items-center justify-center text-sm text-[#111111]"
              style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
            >
              {progressPct}%
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <MiniStat label="scans" value={scansForSelectedDay.length.toString()} />
          <MiniStat label="meilleur" value={bestScore ? `${bestScore}` : "--"} />
          <MiniStat
            label="vs hier"
            value={previousDay === null ? "--" : `${previousDay >= 0 ? "+" : ""}${previousDay}`}
            color={previousDay === null ? "#888888" : previousDay > 0 ? "#22C55E" : previousDay < 0 ? "#EF4444" : "#888888"}
          />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <RingCard label="Cohérence" value={avgCoherence} color="#7C5CFC" />
        <RingCard label="Originalité" value={avgOriginalite} color="#F43F5E" />
        <RingCard label="Fit" value={avgFit} color="#06B6D4" />
      </section>

      <section className="space-y-3">
        <h2
          className="text-xl text-[#111111]"
          style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
        >
          Mes scans
        </h2>

        {scansForSelectedDay.length === 0 ? (
          <div className="rounded-2xl border border-[#F0F0F0] bg-white px-5 py-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p
              className="text-xl text-[#111111]"
              style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
            >
              Lance ton premier vibe
            </p>
            <p className="mt-2 text-sm text-[#888888]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
              Fais un scan pour afficher tes stats du jour.
            </p>
            <div className="mt-3 flex justify-center text-[#888888]">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
        ) : (
          scansForSelectedDay.map((scan) => (
            <button
              key={scan.id}
              onClick={() => navigate(`/scan/${scan.id}`)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#F0F0F0] bg-white p-3 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:bg-[#FAFAFA]"
            >
              {scan.image_url ? (
                <img src={scan.image_url} alt="Scan" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-[#F0F0F0]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#111111]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 500 }}>
                  Scan du jour
                </p>
                <p className="text-xs text-[#888888]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                  {new Date(scan.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span
                className="rounded-full bg-[#111111] px-3 py-1 text-sm text-white"
                style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
              >
                {scan.score}
              </span>
            </button>
          ))
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value, color = "#111111" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-[#F0F0F0] bg-white p-2">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#888888]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        {label}
      </p>
      <p
        className="mt-1 text-base"
        style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600, color }}
      >
        {value}
      </p>
    </div>
  );
}

function RingCard({ label, value, color }: { label: string; value: number; color: string }) {
  const ringDash = 2 * Math.PI * 20;
  const ringOffset = ringDash - (value / 10) * ringDash;
  const bgOpacity = color + "1A"; // 0.1 opacity hex
  
  return (
    <div className="rounded-xl border border-[#F0F0F0] bg-white p-3 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="relative mx-auto h-16 w-16">
        <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90">
          <circle cx="24" cy="24" r="16" fill="none" stroke={color} strokeWidth="4" opacity="0.1" />
          <circle
            cx="24"
            cy="24"
            r="16"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={ringDash}
            strokeDashoffset={ringOffset}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-bold"
          style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', color: "#111111" }}
        >
          {value}
        </div>
      </div>
      <p className="mt-2 text-xs text-[#888888]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        {label}
      </p>
    </div>
  );
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}