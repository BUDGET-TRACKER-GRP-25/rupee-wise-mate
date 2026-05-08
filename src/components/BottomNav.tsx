import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Plus, Receipt, PieChart, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/add", label: "Add", icon: Plus },
  { to: "/history", label: "History", icon: Receipt },
  { to: "/insights", label: "Insights", icon: PieChart },
  { to: "/achievements", label: "Wins", icon: Trophy },
] as const;

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <ul className="grid grid-cols-5 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <li key={to} className="flex">
              <Link
                to={to}
                className={cn(
                  "mx-auto flex w-full flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
