import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    q: "Mon paiement est validé mais mes crédits ne sont pas arrivés.",
    a: "Les crédits sont ajoutés automatiquement par notre serveur dès que la banque confirme le paiement (en général en moins de 10 secondes). Ferme puis rouvre l'écran Accueil pour rafraîchir le solde. Si rien après 2 minutes, écris-nous avec ton email d'achat et la date — on règle ça en quelques heures.",
  },
  {
    q: "Le scan ne marche pas / m'a dit ERREUR.",
    a: "Vibe analyse uniquement les photos d'une PERSONNE qui porte une tenue (en pied de préférence). Si tu prends en photo un objet, un paysage, un vêtement seul ou un écran, on te renvoie une erreur et AUCUN crédit n'est utilisé. Reprends une photo de toi en lumière naturelle.",
  },
  {
    q: "Comment annuler mon abonnement Style Pass ?",
    a: "Tu peux résilier à tout moment depuis Réglages → Abonnement. La résiliation prend effet à la fin de la période en cours (tu gardes tes accès jusque-là). Aucun frais caché, aucun engagement.",
  },
];

export default function FAQ() {
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
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Aide</p>
          <h1 className="font-serif text-2xl leading-tight">FAQ & Support</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-5 pt-2">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <HelpCircle className="mt-0.5 h-5 w-5 text-accent" />
          <p className="text-sm text-muted-foreground">
            Les 3 questions les plus fréquentes. Si ta réponse n'est pas ici, écris-nous — on répond sous 24h.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-card px-4"
            >
              <AccordionTrigger className="text-left font-serif text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <a
          href="mailto:hello@vibe.app?subject=Support%20Vibe"
          className="flex items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-4 text-sm font-semibold text-background transition active:scale-95"
        >
          <Mail className="h-4 w-4" />
          Contacter le support
        </a>
      </div>
    </div>
  );
}
