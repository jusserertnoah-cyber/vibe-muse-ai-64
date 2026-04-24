import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { getProfile } from "@/lib/profile";

const Index = () => {
  const { session, loading } = useSession();
  if (loading) return null;
  const profile = getProfile();
  // Pas de session → on commence l'onboarding (langue d'abord, téléphone à la fin).
  if (!session) return <Navigate to={profile ? "/onboarding" : "/onboarding"} replace />;
  return <Navigate to={profile ? "/app" : "/onboarding"} replace />;
};

export default Index;
