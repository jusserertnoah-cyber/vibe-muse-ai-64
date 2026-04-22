import { useState } from "react";
import { getProfile } from "@/lib/profile";
import { Mic, Send, Sparkles, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "ai";
  text: string;
  image?: string;
  bullets?: string[];
  mood?: string;
}

export default function Dressing() {
  const profile = getProfile();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: `Salut ${profile?.firstName} ✨ Dis-moi ton humeur, ta journée ou la météo, je crée ta tenue.`,
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    // Stub — réponse IA viendra à l'étape 2 (Lovable AI)
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "L'IA stylsite arrive à l'étape 2 — pour l'instant voici une suggestion type :",
          bullets: [
            "Pull cachemire crème oversized",
            "Pantalon tailoring taupe",
            "Mocassins cuir marron foncé",
          ],
          mood: "Confiant · Raffiné",
        },
      ]);
    }, 600);
  };

  const onMic = () => {
    toast("Enregistrement vocal — branché à l'étape 2 avec Lovable AI");
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col px-5 pt-8">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Dressing
        </p>
        <h1 className="mt-1 font-serif text-3xl">Ton styliste</h1>
      </header>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Shirt className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <div className="flex-1">
          <div className="text-sm font-medium">Vibe Closet</div>
          <div className="text-xs text-muted-foreground">
            {profile?.closet.length
              ? `${profile.closet.length} pièces enregistrées`
              : "Dicte tes vêtements pour des tenues 100% personnalisées"}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onMic}
          className="rounded-full"
        >
          <Mic className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 pb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "flex animate-fade-up",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] space-y-2 rounded-3xl px-4 py-3 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border"
              )}
            >
              <p>{m.text}</p>
              {m.bullets && (
                <ul className="space-y-1 pt-1 text-xs">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <Sparkles className="mt-0.5 h-3 w-3 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              {m.mood && (
                <div className="pt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Mood : {m.mood}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-24 flex items-center gap-2 rounded-full border border-border bg-card p-2 shadow-card">
        <button
          onClick={onMic}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground"
          aria-label="Dicter"
        >
          <Mic className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Décris ta journée…"
          className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={send}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label="Envoyer"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}