import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Loader2, Sparkles, Trophy, Medal, Timer, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { audienceFromGender, getDailyChallenge, nextResetMs } from "@/lib/challenges";
import { getProfile } from "@/lib/profile";
import { getCurrentWeather } from "@/lib/weather";
import { toast } from "sonner";

interface Post {
  id: string;
  user_id: string;
  pseudo: string | null;
  image_url: string;
  ai_score: number | null;
  caption: string | null;
  vibe_count: number;
  challenge_name: string | null;
  challenge_met: boolean;
  created_at: string;
}

export default function TopVibes() {
  const { session, loading: authLoading } = useSession();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  useEffect(() => {
    getCurrentWeather().then((w) => { if (w) setCurrentTemp(w.temp); }).catch(() => {});
  }, []);
  const challenge = useMemo(() => {
    const p = getProfile();
    return getDailyChallenge(audienceFromGender(p?.gender), new Date(), currentTemp);
  }, [currentTemp]);
  const [resetIn, setResetIn] = useState(nextResetMs());

  useEffect(() => {
    const id = setInterval(() => setResetIn(nextResetMs()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate("/onboarding"); return; }
    let active = true;
    (async () => {
      const { data: postsData } = await supabase.from("posts").select("*")
        .order("vibe_count", { ascending: false }).order("created_at", { ascending: false }).limit(50);
      const { data: votes } = await supabase.from("post_votes").select("post_id").eq("user_id", session.user.id);
      if (!active) return;
      if (postsData) setPosts(postsData as unknown as Post[]);
      if (votes) setMyVotes(new Set(votes.map(v => v.post_id)));
      setLoading(false);
    })();

    const channel = supabase.channel("topvibes-posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        supabase.from("posts").select("*").order("vibe_count", { ascending: false }).order("created_at", { ascending: false }).limit(50)
          .then(({ data }) => data && setPosts(data as unknown as Post[]));
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [authLoading, session, navigate]);

  const onVibe = async (postId: string) => {
    const { data, error } = await supabase.rpc("toggle_vibe", { target_post: postId });
    if (error) { toast.error("Vote impossible"); return; }
    const row = Array.isArray(data) ? data[0] : data;
    const vibed = row?.vibed;
    setMyVotes((prev) => {
      const next = new Set(prev);
      if (vibed) next.add(postId); else next.delete(postId);
      return next;
    });
  };

  const top3 = posts.slice(0, 3);
  const rest = posts.slice(3, 13); // top 10 hors podium = 4..13

  return (
    <div className="space-y-5 px-5 pt-8 pb-24">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Communauté</p>
        <h1 className="mt-1 font-serif text-3xl">Top Vibes</h1>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          Reset du classement dans : <span className="font-mono-tech text-foreground">{fmtCountdown(resetIn)}</span>
        </div>
      </header>

      {/* Défi du jour */}
      <div className="rounded-3xl bg-gradient-brand p-5 shadow-brand">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-foreground/70">
          <Flame className="h-3.5 w-3.5" /> Défi du jour
        </div>
        <p className="mt-1 font-serif text-2xl leading-tight">{challenge.name}</p>
        <p className="mt-1 text-sm text-foreground/80">{challenge.hint}</p>
        <p className="mt-2 text-[11px] uppercase tracking-widest text-foreground/60">10 défis réussis = 1 scan offert</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <>
          {/* État vide engageant : on affiche quand même les sections */}
          <section>
            <h2 className="mb-2 flex items-center gap-2 font-serif text-xl">
              <Trophy className="h-5 w-5 text-amber-500" /> Vibe of the Week
            </h2>
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-500/60" strokeWidth={1.2} />
              <p className="font-serif text-lg">Le trône est vacant</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sois le/la premier·e à atteindre 9.0+ pour décrocher la couronne de la semaine.
              </p>
              <button
                onClick={() => navigate("/app/scan")}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                Scanner ma tenue
              </button>
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-lg">Top 10 de la semaine</h2>
            <ul className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
                    #{i + 1}
                  </div>
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Place libre</p>
                    <p className="text-xs text-muted-foreground/70">Score 9.0+ requis</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <>
          {/* Vibe of the Week */}
          {top3[0] && (
            <section>
              <h2 className="mb-2 flex items-center gap-2 font-serif text-xl"><Trophy className="h-5 w-5 text-amber-500" /> Vibe of the Week</h2>
              <PostCard post={top3[0]} rank={1} vibed={myVotes.has(top3[0].id)} onVibe={onVibe} highlight />
            </section>
          )}

          {/* Podium */}
          {top3.length > 1 && (
            <section className="grid grid-cols-2 gap-3">
              {top3.slice(1).map((p, i) => (
                <PostCard key={p.id} post={p} rank={i + 2} vibed={myVotes.has(p.id)} onVibe={onVibe} compact />
              ))}
            </section>
          )}

          {/* Top 10 reste */}
          {rest.length > 0 && (
            <section>
              <h2 className="mb-2 font-serif text-lg">Top 10 de la semaine</h2>
              <ul className="space-y-3">
                {rest.map((p, i) => (
                  <PostRow key={p.id} post={p} rank={i + 4} vibed={myVotes.has(p.id)} onVibe={onVibe} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${d}j ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function MedalIcon({ rank }: { rank: number }) {
  const color = rank === 1 ? "text-amber-500" : rank === 2 ? "text-zinc-400" : "text-orange-400";
  return <Medal className={`h-4 w-4 ${color}`} />;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  const tone = score >= 9.5 ? "text-emerald-500" : score >= 9 ? "text-foreground" : "text-muted-foreground";
  return (
    <span className={`font-mono-tech text-base font-bold ${tone}`}>
      {score.toFixed(1)}<span className="text-xs text-muted-foreground">/10</span>
    </span>
  );
}

function PostCard({
  post, rank, vibed, onVibe, highlight, compact,
}: { post: Post; rank: number; vibed: boolean; onVibe: (id: string) => void; highlight?: boolean; compact?: boolean }) {
  return (
    <article className={`overflow-hidden rounded-3xl bg-card shadow-card ${highlight ? "ring-2 ring-amber-400" : ""}`}>
      <div className="relative">
        <img src={post.image_url} alt={`Look #${rank}`} className={`w-full object-cover ${compact ? "aspect-square" : "aspect-[4/5]"}`} loading="lazy" />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
          {rank <= 3 ? <MedalIcon rank={rank} /> : null}#{rank}
        </div>
        <div className="absolute right-3 top-3 rounded-2xl bg-background/90 px-2.5 py-1 backdrop-blur">
          <ScoreBadge score={post.ai_score} />
        </div>
      </div>
      <div className="p-3">
        {post.challenge_met && post.challenge_name && (
          <p className="mb-1 text-[10px] uppercase tracking-widest text-emerald-600">✓ Défi : {post.challenge_name}</p>
        )}
        {post.caption && <p className={`font-serif leading-snug ${compact ? "text-sm line-clamp-2" : "text-base"}`}>{post.caption}</p>}
        <div className="mt-2 flex items-center justify-between">
          <button onClick={() => onVibe(post.id)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${vibed ? "bg-gradient-brand text-foreground shadow-brand" : "bg-secondary text-foreground hover:bg-secondary/70"}`}>
            <Heart className={`h-4 w-4 ${vibed ? "fill-current" : ""}`} strokeWidth={1.8} />
            Vibe · {post.vibe_count}
          </button>
          <span className="text-[10px] text-muted-foreground">{post.pseudo ?? "Anonyme"}</span>
        </div>
      </div>
    </article>
  );
}

function PostRow({ post, rank, vibed, onVibe }: { post: Post; rank: number; vibed: boolean; onVibe: (id: string) => void }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card p-2 shadow-card">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold">#{rank}</div>
      <img src={post.image_url} alt={`Look #${rank}`} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-serif text-sm">{post.pseudo ?? "Anonyme"}</p>
          <ScoreBadge score={post.ai_score} />
        </div>
        {post.caption && <p className="truncate text-xs text-muted-foreground">{post.caption}</p>}
      </div>
      <button onClick={() => onVibe(post.id)} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold ${vibed ? "bg-gradient-brand text-foreground shadow-brand" : "bg-secondary"}`}>
        <Heart className={`h-3.5 w-3.5 ${vibed ? "fill-current" : ""}`} strokeWidth={1.8} />
        {post.vibe_count}
      </button>
    </li>
  );
}
