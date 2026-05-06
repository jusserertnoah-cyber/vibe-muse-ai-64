import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile } from "@/lib/profile";
import { ArrowDownRight, Zap } from "lucide-react";
import { getRecentScans } from "@/lib/history";

export default function Home() {
  const navigate = useNavigate();
  const profile = getProfile();
  const scans = useMemo(() => getRecentScans(50), []);

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
    () => scans.filter((s) => toDateKey(new Date(s.at)) === selectedDay),
    [scans, selectedDay]
  );

  const scansWithScore = scansForSelectedDay.filter((s) => typeof s.score === "number");
  const avgScore = scansWithScore.length
    ? Math.round(scansWithScore.reduce((acc, s) => acc + (s.score ?? 0), 0) / scansWithScore.length)
    : 0;
  const bestScore = scansWithScore.length
    ? Math.max(...scansWithScore.map((s) => s.score ?? 0))
    : 0;

  const previousDay = useMemo(() => {
    const selected = new Date(selectedDay);
    selected.setDate(selected.getDate() - 1);
    const prevKey = toDateKey(selected);
    const prev = scans.filter((s) => toDateKey(new Date(s.at)) === prevKey && typeof s.score === "number");
    if (!prev.length) return 0;
    const prevAvg = Math.round(prev.reduce((acc, s) => acc + (s.score ?? 0), 0) / prev.length);
    return avgScore - prevAvg;
  }, [selectedDay, scans, avgScore]);

  const hasScansByDay = useMemo(() => {
    const set = new Set<string>(scans.map((s) => toDateKey(new Date(s.at))));
    return set;
  }, [scans]);

  const progressPct = Math.max(0, Math.min(100, avgScore));
  const ringDash = 2 * Math.PI * 28;
  const ringOffset = ringDash - (progressPct / 100) * ringDash;

  return (
    <div className="min-h-screen space-y-5 bg-[#FAFAFA] px-5 pt-8 pb-6 text-[#111111]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#999999]">
            BONJOUR
          </p>
          <h1
            className="mt-1 text-[32px] leading-[38px] text-[#111111]"
            style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
          >
            {profile?.firstName || "Vibe"}
          </h1>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] px-3 py-1.5 text-sm font-medium text-[#7C5CFC]">
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
                    active ? "bg-[#7C5CFC] text-white" : "text-[#111111]"
                  }`}
                  style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 500 }}
                >
                  {day.label}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${hasScan ? "bg-[#7C5CFC]" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#F0F0F0] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#999999]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
              Score moyen du jour
            </p>
            <p
              className="mt-1 text-5xl text-[#7C5CFC]"
              style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
            >
              {avgScore}
            </p>
          </div>
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#F0F0F0" strokeWidth="8" />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                stroke="#7C5CFC"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={ringDash}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div
              className="absolute inset-0 flex items-center justify-center text-sm text-[#7C5CFC]"
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
            label="progression"
            value={`${previousDay >= 0 ? "+" : ""}${previousDay}`}
            isAccent={previousDay >= 0}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2
          className="text-xl text-[#111111]"
          style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
        >
          Mes derniers vibes
        </h2>

        {scansForSelectedDay.length === 0 ? (
          <div className="rounded-2xl border border-[#F0F0F0] bg-white px-5 py-10 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p
              className="text-xl text-[#111111]"
              style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
            >
              Lance ton premier vibe
            </p>
            <p className="mt-2 text-sm text-[#999999]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
              Fais un scan pour afficher tes stats du jour.
            </p>
            <div className="mt-3 flex justify-center text-[#7C5CFC]">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
        ) : (
          scansForSelectedDay.map((scan) => (
            <button
              key={scan.id}
              onClick={() => navigate("/app/history")}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#F0F0F0] bg-white p-3 text-left shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            >
              {scan.imageUrl ? (
                <img src={scan.imageUrl} alt="Scan" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-[#F4F1FA]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[#111111]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 500 }}>
                  Scan du jour
                </p>
                <p className="text-xs text-[#999999]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                  {new Date(scan.at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <span
                className="rounded-full bg-[#EDE9FE] px-3 py-1 text-sm text-[#7C5CFC]"
                style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
              >
                {scan.score ?? "--"}
              </span>
            </button>
          ))
        )}
      </section>
    </div>
  );
}

function MiniStat({ label, value, isAccent = false }: { label: string; value: string; isAccent?: boolean }) {
  return (
    <div className="rounded-xl border border-[#F0F0F0] bg-white p-2">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#999999]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
        {label}
      </p>
      <p
        className={`mt-1 text-base ${isAccent ? "text-[#7C5CFC]" : "text-[#111111]"}`}
        style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 600 }}
      >
        {value}
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