import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 px-5 py-4 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
          aria-label="Retour"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Légal</p>
          <h1 className="font-serif text-2xl leading-tight">{title}</h1>
        </div>
      </header>
      <article className="prose prose-sm mx-auto max-w-2xl space-y-5 px-5 pt-2 text-sm leading-relaxed text-foreground">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Dernière mise à jour : {updated}
        </p>
        {children}
      </article>
    </div>
  );
}

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-6 font-serif text-lg text-foreground">{children}</h2>
);

export const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);

export const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">{children}</ul>
);