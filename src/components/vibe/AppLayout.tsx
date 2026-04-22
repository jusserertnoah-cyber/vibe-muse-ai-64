import { Outlet, Navigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { getProfile } from "@/lib/profile";

export const AppLayout = () => {
  const profile = getProfile();
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