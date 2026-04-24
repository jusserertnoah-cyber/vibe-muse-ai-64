import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { applyTheme } from "@/lib/theme";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import { AppLayout } from "./components/vibe/AppLayout";
import Home from "./pages/app/Home.tsx";
import ScrollToTop from "./components/ScrollToTop";
// Route-level code splitting: keep the initial bundle small (better FCP/LCP).
// Heavy deps like Stripe SDK are pulled in only when the user opens the Paywall.
const Inspirations = lazy(() => import("./pages/app/Inspirations.tsx"));
const Scan = lazy(() => import("./pages/app/Scan.tsx"));
const Profil = lazy(() => import("./pages/app/Profil.tsx"));
const Paywall = lazy(() => import("./pages/app/Paywall.tsx"));
const Settings = lazy(() => import("./pages/app/Settings.tsx"));
const HistoryPage = lazy(() => import("./pages/app/HistoryPage.tsx"));
const Feed = lazy(() => import("./pages/app/Feed.tsx"));
const Privacy = lazy(() => import("./pages/legal/Privacy.tsx"));
const Terms = lazy(() => import("./pages/legal/Terms.tsx"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    applyTheme();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === "vibe.profile.v1" || e.key === "vibe.theme.v1") applyTheme();
    };
    const onProfileChange = () => applyTheme();
    window.addEventListener("storage", onStorage);
    window.addEventListener("vibe:profile-changed", onProfileChange);
    // Re-check on each navigation in case profile was just saved
    const interval = window.setInterval(applyTheme, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("vibe:profile-changed", onProfileChange);
      window.clearInterval(interval);
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
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
            <Route path="inspirations" element={<Inspirations />} />
            <Route path="scan" element={<Scan />} />
            <Route path="profil" element={<Profil />} />
            <Route path="paywall" element={<Paywall />} />
            <Route path="settings" element={<Settings />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="feed" element={<Feed />} />
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
