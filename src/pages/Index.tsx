import { Navigate } from "react-router-dom";
import { getProfile } from "@/lib/profile";

const Index = () => {
  const profile = getProfile();
  return <Navigate to={profile ? "/app" : "/onboarding"} replace />;
};

export default Index;
