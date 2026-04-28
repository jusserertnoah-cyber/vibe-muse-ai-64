import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { getProfile, hydrateProfileFromDb } from "@/lib/profile";
import { useSession } from "@/hooks/useSession";

export const AppLayout = () => {
  const { session, loading } = useSession();
  const [hydrating, setHydrating] = useState(true);
  const [profileReady, setProfileReady] = useState<boolean>(!!getProfile());
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (loading) return;
      const localProfile = getProfile();
      if (localProfile) {
        if (!cancelled) {
          setProfileReady(true);
          setHydrating(false);
        }
        return;
      }
      if (session?.user?.id) {
        const profile = await hydrateProfileFromDb(session.user.id);
        if (!cancelled) {
          setProfileReady(!!profile);
          setHydrating(false);
        }
        return;
      }
      if (!cancelled) {
        setProfileReady(false);
        setHydrating(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [loading, session]);

  if (loading || hydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }
  // Mode démo : si aucun provider SMS n'est branché, l'utilisateur n'a pas de
  // session Supabase mais a quand même rempli son profil local — on le laisse
  // entrer dans l'app pour ne pas le forcer à re-saisir son numéro.
  if (!session && !profileReady) return <Navigate to="/onboarding" replace />;
  if (!profileReady) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md pb-28">
        {/* Fade 0.3s à chaque changement de route — clé = pathname */}
        <div key={location.pathname} className="vibe-page-fade">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};