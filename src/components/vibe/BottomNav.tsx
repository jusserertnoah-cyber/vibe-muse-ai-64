import { NavLink } from "react-router-dom";
import { Home, Sparkles, ScanLine, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app", label: "Accueil", icon: Home, end: true },
  { to: "/app/inspirations", label: "Inspirations", icon: Sparkles },
  { to: "/app/scan", label: "Scan", icon: ScanLine },
  { to: "/app/profil", label: "Profil", icon: User },
];

export const BottomNav = () => {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 glass-card"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium uppercase tracking-wider transition-all",
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
                      "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                      isActive && "bg-gradient-brand text-foreground shadow-brand"
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