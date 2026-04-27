import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { applyTheme } from "@/lib/theme";
import { initDailyChallengeNotif } from "@/lib/dailyNotif";
import { initPush } from "@/lib/push";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import { AppLayout } from "./components/vibe/AppLayout";
import Home from "./pages/app/Home.tsx";
import ScrollToTop from "./components/ScrollToTop";
import { SplashScreen } from "./components/vibe/SplashScreen";
// Route-level code splitting: keep the initial bundle small (better FCP/LCP).
// Heavy deps like Stripe SDK are pulled in only when the user opens the Paywall.
const Scan = lazy(() => import("./pages/app/Scan.tsx"));
const Profil = lazy(() => import("./pages/app/Profil.tsx"));
const Paywall = lazy(() => import("./pages/app/Paywall.tsx"));
const Settings = lazy(() => import("./pages/app/Settings.tsx"));
const HistoryPage = lazy(() => import("./pages/app/HistoryPage.tsx"));
const TopVibes = lazy(() => import("./pages/app/TopVibes.tsx"));
const FAQ = lazy(() => import("./pages/app/FAQ.tsx"));
const Privacy = lazy(() => import("./pages/legal/Privacy.tsx"));
const Terms = lazy(() => import("./pages/legal/Terms.tsx"));

const queryClient = new QueryClient();

const App = () => {
  // Splash : affiché au boot, masque le chargement Supabase / lazy chunks.
  // Ne s'affiche QU'UNE FOIS par session (sessionStorage) pour ne pas
  // saouler l'utilisateur à chaque navigation interne.
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem("vibe.splashShown") !== "1";
    } catch {
      return true;
    }
  });
  const [splashMinDone, setSplashMinDone] = useState(false);

  useEffect(() => {
    applyTheme();
    // Démarre la planif de la notif quotidienne 7h (no-op si pas opt-in).
    initDailyChallengeNotif();
    // Init OneSignal Web Push (App ID récupéré côté serveur car non bundlé).
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("push-config");
        if (data?.appId) initPush(data.appId);
      } catch {
        // silencieux : push optionnel
      }
    })();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "vibe.profile.v1" || e.key === "vibe.theme.v1") applyTheme();
    };
    const onProfileChange = () => applyTheme();
    window.addEventListener("storage", onStorage);
    window.addEventListener("vibe:profile-changed", onProfileChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vibe:profile-changed", onProfileChange);
    };
  }, []);

  // Quand l'animation de la barre est finie ET que React/Supabase sont prêts,
  // on retire le splash. Ici l'app est déjà montée → on attend juste la barre.
  useEffect(() => {
    if (showSplash && splashMinDone) {
      const t = setTimeout(() => {
        setShowSplash(false);
        try { sessionStorage.setItem("vibe.splashShown", "1"); } catch {}
      }, 200);
      return () => clearTimeout(t);
    }
  }, [showSplash, splashMinDone]);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AnimatePresence>
        {showSplash && (
          <SplashScreen key="splash" onDone={() => setSplashMinDone(true)} />
        )}
      </AnimatePresence>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* /auth est un alias historique → on redirige vers l'onboarding
              qui contient désormais l'écran de connexion (téléphone). */}
          <Route path="/auth" element={<Onboarding />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/legal/privacy" element={<Privacy />} />
          <Route path="/legal/terms" element={<Terms />} />
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="scan" element={<Scan />} />
            <Route path="profil" element={<Profil />} />
            <Route path="paywall" element={<Paywall />} />
            <Route path="settings" element={<Settings />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="topvibes" element={<TopVibes />} />
            <Route path="faq" element={<FAQ />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
