import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Scan {
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
  challenge_name?: string;
  challenge_met?: boolean;
  challenge_reason?: string;
}

export default function ScanResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScan = async () => {
      if (!id) {
        setError("ID du scan manquant");
        setLoading(false);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from("scans")
          .select("*")
          .eq("id", id)
          .single();
        if (err || !data) {
          setError("Scan non trouvé");
        } else {
          setScan(data as Scan);
        }
      } catch (e) {
        console.error("Failed to load scan", e);
        setError("Erreur lors du chargement du scan");
      } finally {
        setLoading(false);
      }
    };
    loadScan();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <Loader2 className="h-6 w-6 animate-spin text-[#111111]" />
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-5 pt-8 pb-6 text-[#111111]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg p-2 text-[#111111] hover:bg-[#F0F0F0]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="mt-10 text-center">
          <p className="text-lg text-[#111111]" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {error || "Scan non trouvé"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-[#FAFAFA] px-5 pt-8 pb-8 text-[#111111]">
      {/* Header */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg p-2 text-[#111111] hover:bg-[#F0F0F0]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p
          className="text-xs uppercase tracking-[0.2em] text-[#888888]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          {new Date(scan.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <div className="w-10" />
      </header>

      {/* Image tenue */}
      {scan.image_url && (
        <div className="overflow-hidden rounded-2xl">
          <img src={scan.image_url} alt="Outfit" className="h-80 w-full object-cover" />
        </div>
      )}

      {/* Score global */}
      <section className="rounded-xl bg-[#F5F5F5] px-5 py-4">
        <p
          className="text-[11px] uppercase tracking-[0.2em] text-[#888888]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          Vibe Score
        </p>
        <p
          className="mt-1 text-6xl"
          style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 700, color: "#111111" }}
        >
          {scan.score}
          <span
            className="text-2xl"
            style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 400, color: "#888888" }}
          >
            /10
          </span>
        </p>
      </section>

      {/* 3 Rings */}
      <section className="grid grid-cols-3 gap-2">
        <RingCard label="Cohérence" value={scan.coherence} color="#7C5CFC" />
        <RingCard label="Originalité" value={scan.originalite} color="#F43F5E" />
        <RingCard label="Fit" value={scan.fit} color="#06B6D4" />
      </section>

      {/* Point Fort */}
      <section
        className="rounded-xl bg-[#F5F5F5] p-4"
        style={{ borderLeft: "4px solid #22C55E" }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.15em] text-[#888888]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          Point fort
        </p>
        <p
          className="mt-2 text-sm leading-relaxed text-[#111111]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          {scan.point_fort}
        </p>
      </section>

      {/* Point Faible */}
      <section
        className="rounded-xl bg-[#F5F5F5] p-4"
        style={{ borderLeft: "4px solid #FB923C" }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.15em] text-[#888888]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          Point faible
        </p>
        <p
          className="mt-2 text-sm leading-relaxed text-[#111111]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          {scan.point_faible}
        </p>
      </section>

      {/* Conseil */}
      <section
        className="rounded-xl bg-[#F5F5F5] p-4"
        style={{ borderLeft: "4px solid #111111" }}
      >
        <p
          className="text-[11px] uppercase tracking-[0.15em] text-[#888888]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          Conseil
        </p>
        <p
          className="mt-2 text-sm leading-relaxed text-[#111111]"
          style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
        >
          {scan.conseil}
        </p>
      </section>

      {/* Challenge (si applicable) */}
      {scan.challenge_name && (
        <section className="rounded-xl bg-[#F5F5F5] p-4">
          <p
            className="text-[11px] uppercase tracking-[0.15em] text-[#888888]"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            Défi du jour
          </p>
          <p
            className="mt-2 text-sm font-semibold text-[#111111]"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            {scan.challenge_name}
          </p>
          {scan.challenge_met != null && (
            <p
              className="mt-1 text-sm"
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                color: scan.challenge_met ? "#22C55E" : "#888888",
              }}
            >
              {scan.challenge_met ? "✓ Défi validé" : "✗ Défi non détecté"}
            </p>
          )}
          {scan.challenge_reason && (
            <p
              className="mt-1 text-sm text-[#888888]"
              style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
            >
              {scan.challenge_reason}
            </p>
          )}
        </section>
      )}

      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="w-full rounded-xl bg-[#111111] py-3.5 text-sm text-white"
        style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 600 }}
      >
        Retour
      </button>
    </div>
  );
}

function RingCard({ label, value, color }: { label: string; value: number; color: string }) {
  const ringDash = 2 * Math.PI * 20;
  const ringOffset = ringDash - (value / 10) * ringDash;

  return (
    <div className="rounded-xl bg-[#F5F5F5] p-3 text-center">
      <div className="relative mx-auto h-16 w-16">
        <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90">
          <circle cx="24" cy="24" r="16" fill="none" stroke={color} strokeWidth="4" opacity="0.12" />
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
          className="absolute inset-0 flex items-center justify-center text-sm"
          style={{ fontFamily: '"Azeret Mono", ui-monospace, monospace', fontWeight: 700, color: "#111111" }}
        >
          {value}
        </div>
      </div>
      <p
        className="mt-2 text-xs text-[#888888]"
        style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
      >
        {label}
      </p>
    </div>
  );
}
