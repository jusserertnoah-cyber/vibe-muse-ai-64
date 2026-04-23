import { useNavigate } from "react-router-dom";
import { ArrowLeft, History as HistoryIcon } from "lucide-react";
import { getHistory } from "@/lib/history";

export default function HistoryPage() {
  const navigate = useNavigate();
  const looks = getHistory().filter((h) => h.imageUrl);

  return (
    <div className="space-y-5 px-5 pt-8">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Profil
          </p>
          <h1 className="font-serif text-2xl leading-tight">Mon historique</h1>
        </div>
        <span className="ml-auto font-mono-tech text-xs text-muted-foreground">
          {looks.length}
        </span>
      </header>

      {looks.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <HistoryIcon className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Tes tenues générées et tes scans apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {looks.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-secondary"
            >
              <img
                src={item.imageUrl!}
                alt={item.style ?? "look"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {typeof item.score === "number" && (
                <div className="absolute right-1.5 top-1.5 rounded-full bg-accent px-1.5 py-0.5 font-mono-tech text-[10px] font-bold text-accent-foreground">
                  {item.score.toFixed(1)}
                </div>
              )}
              {item.type === "look" && item.style && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-[9px] font-medium uppercase tracking-wider text-white">
                  {item.style}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}