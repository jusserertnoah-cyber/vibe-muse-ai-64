import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { getProfile } from "@/lib/profile";

const Index = () => {
  const { session, loading } = useSession();
  if (loading) return null;
  const profile = getProfile();
  // Si l'utilisateur a déjà un profil (même sans session, en mode démo SMS),
  // on le laisse entrer dans l'app sans repasser par l'onboarding.
  if (profile) return <Navigate to="/app" replace />;
  return <Navigate to="/onboarding" replace />;
};

export default Index;
