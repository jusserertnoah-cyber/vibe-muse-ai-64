import { NavLink } from "react-router-dom";
import { Home, Trophy, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const { t } = useTranslation();
  const tabs = [
    { to: "/app", label: t("nav.home"), icon: Home, end: true },
    { to: "/app/topvibes", label: "Top Vibes", icon: Trophy },
    { to: "/app/profil", label: t("nav.profile"), icon: User },
  ];
  return (
    <nav
      aria-label={t("nav.aria")}
      className="flex-shrink-0 bg-white"
      style={{
        borderTop: "0.5px solid #E5E5E5",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors duration-200",
                  isActive ? "text-[#111111]" : "text-[#888888]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.2 : 1.5}
                  />
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