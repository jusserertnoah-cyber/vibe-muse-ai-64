import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { getProfile, hydrateProfileFromDb } from "@/lib/profile";
import { VibeLogo } from "@/components/vibe/VibeLogo";

const Index = () => {
  const { session, loading } = useSession();
  const [hydrating, setHydrating] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean>(!!getProfile());

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (loading) return;
      // Already have a local profile → no DB roundtrip needed.
      if (getProfile()) {
        if (!cancelled) {
          setHasProfile(true);
          setHydrating(false);
        }
        return;
      }
      // Logged-in user without local profile (new device / cleared cache):
      // try to rebuild it from the DB so we don't force onboarding again.
      if (session?.user?.id) {
        const p = await hydrateProfileFromDb(session.user.id);
        if (!cancelled) {
          setHasProfile(!!p);
          setHydrating(false);
        }
        return;
      }
      if (!cancelled) {
        setHasProfile(false);
        setHydrating(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [loading, session]);

  if (loading || hydrating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6">
        <VibeLogo variant="full" className="text-4xl" />
        <p className="font-serif text-sm italic text-muted-foreground text-center max-w-xs">
          Vibe : ne doute plus jamais de ton style.
        </p>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }
  if (hasProfile) return <Navigate to="/app" replace />;
  return <Navigate to="/onboarding" replace />;
};

export default Index;
