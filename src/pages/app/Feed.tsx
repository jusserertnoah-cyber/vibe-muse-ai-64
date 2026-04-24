import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";

interface Post {
  id: string;
  user_id: string;
  image_url: string;
  ai_score: number | null;
  caption: string | null;
  created_at: string;
}

export default function Feed() {
  const { session, loading: authLoading } = useSession();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      navigate("/onboarding");
      return;
    }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!active) return;
      if (!error && data) setPosts(data as Post[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [authLoading, session, navigate]);

  return (
    <div className="space-y-6 px-5 pt-8 pb-24">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Communauté
        </p>
        <h1 className="mt-1 font-serif text-3xl">Le Feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les derniers looks scannés par la communauté.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.4} />
          <p className="font-serif text-lg">Aucun look pour l'instant</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Scanne le tien et sois le premier à le partager.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const score = post.ai_score;
  const scoreColor =
    score == null
      ? "text-foreground"
      : score >= 8
      ? "text-emerald-500"
      : score >= 6.5
      ? "text-foreground"
      : "text-rose-500";
  return (
    <article className="overflow-hidden rounded-3xl bg-card shadow-card">
      <div className="relative">
        <img
          src={post.image_url}
          alt="Look partagé"
          className="aspect-[4/5] w-full object-cover"
          loading="lazy"
        />
        {score != null && (
          <div className="absolute right-3 top-3 rounded-2xl bg-background/90 px-3 py-1.5 backdrop-blur">
            <span className={`font-mono-tech text-lg font-bold ${scoreColor}`}>
              {Number.isInteger(score) ? score : score.toFixed(1)}
              <span className="text-xs text-muted-foreground">/10</span>
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        {post.caption && (
          <p className="font-serif text-base leading-snug">{post.caption}</p>
        )}
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <button className="flex items-center gap-1.5 transition hover:text-foreground">
            <Heart className="h-4 w-4" strokeWidth={1.6} />
            J'aime
          </button>
          <time>{new Date(post.created_at).toLocaleDateString()}</time>
        </div>
      </div>
    </article>
  );
}