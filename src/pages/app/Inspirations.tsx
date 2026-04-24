import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { INSPIRATION, type InspoLook } from "@/data/inspiration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Filtres demandés (mix style + mood)
const FILTERS = [
  "Tous",
  "Street US",
  "Classique",
  "Old Money",
  "Vintage",
  "Sport",
  "Chill",
  "Oversize",
] as const;
type Filter = (typeof FILTERS)[number];

// Map filtre → prédicat sur InspoLook
const matches = (look: InspoLook, f: Filter): boolean => {
  if (f === "Tous") return true;
  if (f === "Street US") return look.style === "Américain";
  if (f === "Chill") return look.style === "Sobre" || look.mood === "Chill";
  return look.style === (f as InspoLook["style"]);
};

export default function Inspirations() {
  const [filter, setFilter] = useState<Filter>("Tous");
  const [open, setOpen] = useState<InspoLook | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const cache = useRef<Record<string, string>>({});

  const items = useMemo(
    () => INSPIRATION.filter((l) => matches(l, filter)),
    [filter],
  );

  useEffect(() => {
    if (!open) return;
    if (cache.current[open.id]) {
      setAnalysis(cache.current[open.id]);
      return;
    }
    setAnalysis("");
    setLoading(true);
    supabase.functions
      .invoke("inspiration-analysis", {
        body: {
          style: open.style,
          title: open.title,
          mood: open.mood,
          gender: open.gender,
        },
      })
      .then(({ data, error }) => {
        if (error || !data || (data as any)?.error) {
          const code = (data as any)?.error;
          if (code === "rate_limited") {
            toast.error("Trop de demandes. Réessaie dans une minute.");
          } else if (code === "payment_required") {
            toast.error("Crédits IA épuisés.");
          } else {
            toast.error("Analyse impossible. Réessaie.");
          }
          setAnalysis("");
          return;
        }
        const text = (data as { analysis?: string }).analysis ?? "";
        cache.current[open.id] = text;
        setAnalysis(text);
      })
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <div className="space-y-5 px-5 pt-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Galerie de styles
        </p>
        <h1 className="mt-1 font-serif text-3xl leading-tight">Inspirations</h1>
      </header>

      {/* Filtres horizontaux scrollables */}
      <div className="-mx-5 overflow-x-auto px-5 scrollbar-hide">
        <div className="flex w-max gap-2 pb-1">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "border-foreground bg-foreground text-background shadow-card"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Masonry grid (CSS columns) */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Pas encore de looks pour ce filtre.
        </div>
      ) : (
        <div className="columns-2 gap-3 [column-fill:_balance]">
          {items.map((look, i) => (
            <button
              key={look.id}
              onClick={() => setOpen(look)}
              className="mb-3 block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-card transition-transform active:scale-[0.98]"
            >
              <img
                src={look.image}
                alt={`${look.title} — style ${look.style}`}
                loading="lazy"
                className="block w-full"
                style={{
                  aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "4/5" : "2/3",
                  objectFit: "cover",
                }}
              />
              <div className="p-2.5">
                <p className="truncate font-serif text-sm leading-tight">
                  {look.title}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {look.style}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background shadow-card sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 shadow-card backdrop-blur"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            <img
              src={open.image}
              alt={open.title}
              className="block w-full"
              style={{ aspectRatio: "3/4", objectFit: "cover" }}
            />

            <div className="space-y-3 p-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {open.style} · {open.mood}
                </p>
                <h2 className="mt-1 font-serif text-2xl leading-tight">
                  {open.title}
                </h2>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles
                    className="h-3.5 w-3.5 text-accent"
                    strokeWidth={1.5}
                  />
                  <span className="font-serif text-sm leading-none">
                    Pourquoi ce look fonctionne
                  </span>
                </div>

                {loading ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Analyse en cours…
                  </div>
                ) : analysis ? (
                  <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {analysis}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Analyse indisponible.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}