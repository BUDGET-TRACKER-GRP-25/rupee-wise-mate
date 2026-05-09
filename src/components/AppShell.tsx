import { BottomNav } from "./BottomNav";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/external-client";
import { useNavigate } from "@tanstack/react-router";

export function AppShell({
  children,
  hideNav = false,
  showLogout = false,
}: {
  children: React.ReactNode;
  hideNav?: boolean;
  showLogout?: boolean;
}) {
  const navigate = useNavigate();
  const onLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background pb-24">
        {showLogout && (
          <button
            onClick={onLogout}
            aria-label="Sign out"
            className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
