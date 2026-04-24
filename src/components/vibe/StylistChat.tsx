import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, Sparkles } from "lucide-react";
import { getProfile } from "@/lib/profile";
import { getTier } from "@/lib/tier";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  mode: "scan" | "look";
  context: any;
  intro?: string;
  suggestions?: string[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stylist`;

export function StylistChat({ mode, context, intro, suggestions = [] }: Props) {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Msg[]>(
    intro ? [{ role: "assistant", content: intro }] : [],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const v = text.trim();
    if (!v || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: v };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content !== intro) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m,
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const profile = getProfile();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        toast.error("Connecte-toi pour discuter avec le styliste.");
        setLoading(false);
        return;
      }
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          mode,
          messages: next,
          context: {
            ...context,
            profile: profile
              ? { gender: profile.gender, heightCm: profile.heightCm, weightKg: profile.weightKg }
              : null,
          },
          lang: i18n.language?.split("-")[0] ?? "fr",
          tier: getTier(),
        }),
      });

      if (resp.status === 429) {
        toast.error("Trop de messages. Patiente une minute.");
        setLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Crédits IA épuisés.");
        setLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("stream fail");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Le styliste ne répond pas. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <span className="text-xs uppercase tracking-widest font-mono-tech">
          Chat styliste
        </span>
      </div>

      <div ref={scrollRef} className="max-h-80 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              {m.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1" />
              écrit…
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 0 && messages.filter((m) => m.role === "user").length === 0 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={loading}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t border-border px-3 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pose ta question…"
          disabled={loading}
          className="flex-1 rounded-xl bg-background px-4 py-2.5 text-sm outline-none border border-border focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}