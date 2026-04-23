import { Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { getProfile } from "@/lib/profile";

const Index = () => {
  const { session, loading } = useSession();
  if (loading) return null;
  if (!session) return <Navigate to="/auth" replace />;
  const profile = getProfile();
  return <Navigate to={profile ? "/app" : "/onboarding"} replace />;
};

export default Index;
