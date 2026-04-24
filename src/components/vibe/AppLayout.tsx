import { Outlet, Navigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { getProfile } from "@/lib/profile";
import { useSession } from "@/hooks/useSession";

export const AppLayout = () => {
  const { session, loading } = useSession();
  if (loading) return null;
  const profile = getProfile();
  // Mode démo : si aucun provider SMS n'est branché, l'utilisateur n'a pas de
  // session Supabase mais a quand même rempli son profil local — on le laisse
  // entrer dans l'app pour ne pas le forcer à re-saisir son numéro.
  if (!session && !profile) return <Navigate to="/onboarding" replace />;
  if (!profile) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md pb-28">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};