import { BottomNav } from "./BottomNav";

export function AppShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background pb-24">
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
