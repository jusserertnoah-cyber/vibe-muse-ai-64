import { NavLink } from "react-router-dom";
import { Home, Trophy, ScanLine, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const { t } = useTranslation();
  const tabs = [
    { to: "/app", label: t("nav.home"), icon: Home, end: true },
    { to: "/app/topvibes", label: "Top Vibes", icon: Trophy },
    { to: "/app/scan", label: t("nav.scan"), icon: ScanLine },
    { to: "/app/profil", label: t("nav.profile"), icon: User },
  ];
  return (
    <nav
      aria-label={t("nav.aria")}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium uppercase tracking-wider transition-all duration-250",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
                      isActive
                        ? "bg-neon text-neon-foreground shadow-brand"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};