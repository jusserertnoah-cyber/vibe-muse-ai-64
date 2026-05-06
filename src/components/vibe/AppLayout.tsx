import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { getProfile, hydrateProfileFromDb } from "@/lib/profile";
import { useSession } from "@/hooks/useSession";

export const AppLayout = () => {
  const { session, loading } = useSession();
  const [hydrating, setHydrating] = useState(true);
  const [profileReady, setProfileReady] = useState<boolean>(!!getProfile());
  const location = useLocation();
  const navigate = useNavigate();
  const showScanFab = !location.pathname.startsWith("/app/scan");
  const isHome = location.pathname === "/app";

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (loading) return;
      const localProfile = getProfile();
      if (session?.user?.id) {
        const profile = localProfile ?? await hydrateProfileFromDb(session.user.id);
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
  if (!session) return <Navigate to="/onboarding" replace />;
  if (!profileReady) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-md pb-28">
        {/* Fade 0.3s à chaque changement de route — clé = pathname */}
        <div key={location.pathname} className="vibe-page-fade">
          <Outlet />
        </div>
      </main>
      {showScanFab && (
        <button
          type="button"
          onClick={() => navigate("/app/scan")}
          aria-label="Ouvrir le scan"
          className={`fixed bottom-[88px] right-5 z-[60] flex h-[60px] w-[60px] items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 active:scale-95 ${
            isHome
              ? "bg-[#7C5CFC] text-white shadow-[0_8px_32px_rgba(124,92,252,0.35)]"
              : "bg-[#C8F135] text-black shadow-[0_8px_32px_rgba(200,241,53,0.35)]"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>
      )}
      <BottomNav />
    </div>
  );
};