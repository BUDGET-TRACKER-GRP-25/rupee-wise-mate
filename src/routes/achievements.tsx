import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/external-client";
import { AppShell } from "@/components/AppShell";
import { Loader2, Trophy, Sparkles, PartyPopper, Lock } from "lucide-react";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "SpendSmart — Achievements" },
      { name: "description", content: "Celebrate the months you stayed under budget and unlock savings badges." },
    ],
  }),
  component: AchievementsPage,
});

type Settings = { id: string; monthly_budget: number; created_at: string };
type Expense = { amount: number; date: string };

type MonthStat = {
  key: string; // YYYY-MM
  label: string;
  spent: number;
  budget: number;
  saved: number;
  isCurrent: boolean;
  isComplete: boolean; // month has ended
};

function tierFor(savedPct: number) {
  if (savedPct >= 40) return { name: "Legendary Saver", emoji: "🏆", cls: "bg-[oklch(0.96_0.1_85)] text-[oklch(0.45_0.15_70)]" };
  if (savedPct >= 25) return { name: "Super Saver", emoji: "🥇", cls: "bg-primary-soft text-primary" };
  if (savedPct >= 10) return { name: "Smart Saver", emoji: "🥈", cls: "bg-accent text-accent-foreground" };
  if (savedPct > 0) return { name: "On Track", emoji: "🌱", cls: "bg-secondary text-secondary-foreground" };
  return null;
}

function AchievementsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase
        .from("user_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      setSettings((s?.[0] as Settings) ?? null);
      const { data: e } = await supabase.from("expenses").select("amount,date");
      setExpenses((e ?? []) as Expense[]);
    })();
  }, []);

  const months = useMemo<MonthStat[]>(() => {
    if (!settings || !expenses) return [];
    const budget = Number(settings.monthly_budget);
    const map = new Map<string, number>();
    for (const e of expenses) {
      const key = e.date.slice(0, 7); // YYYY-MM
      map.set(key, (map.get(key) ?? 0) + Number(e.amount));
    }
    // Always include current month
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(curKey)) map.set(curKey, 0);

    const stats: MonthStat[] = Array.from(map.entries()).map(([key, spent]) => {
      const [y, m] = key.split("-").map(Number);
      const d = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      const isCurrent = key === curKey;
      const isComplete = lastDay.getTime() < new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return {
        key,
        label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
        spent,
        budget,
        saved: budget - spent,
        isCurrent,
        isComplete,
      };
    });
    stats.sort((a, b) => (a.key < b.key ? 1 : -1));
    return stats;
  }, [settings, expenses]);

  if (!settings || !expenses) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const earned = months.filter((m) => m.isComplete && m.saved > 0);
  const totalSaved = earned.reduce((s, m) => s + m.saved, 0);
  const current = months.find((m) => m.isCurrent);
  const currentSaved = current ? Math.max(current.budget - current.spent, 0) : 0;
  const currentPct = current && current.budget > 0 ? (currentSaved / current.budget) * 100 : 0;

  return (
    <AppShell>
      <div className="px-5 pt-8">
        <p className="text-sm text-muted-foreground">Your wins 🎉</p>
        <h1 className="text-xl font-bold">Achievements</h1>
      </div>

      {/* Hero */}
      <div className="mx-5 mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.78_0.14_160)] p-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide opacity-90">Total saved (past months)</p>
            <p className="num-xl text-2xl font-extrabold">{formatINR(totalSaved)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm opacity-95">
          {earned.length === 0
            ? "Finish this month under budget to unlock your first badge ✨"
            : `You've earned ${earned.length} savings badge${earned.length > 1 ? "s" : ""}. Keep it up!`}
        </p>
      </div>

      {/* This month progress */}
      {current && (
        <div className="mx-5 mt-5 rounded-3xl bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">This month</p>
              <p className="mt-1 text-sm">
                On pace to save{" "}
                <span className="num-xl font-bold text-primary">{formatINR(currentSaved)}</span>
              </p>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(Math.max(currentPct, 0), 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {currentSaved > 0
              ? "Stay strong till month end to lock in this badge!"
              : "No savings yet — small choices add up 💪"}
          </p>
        </div>
      )}

      {/* Past months */}
      <div className="mx-5 mt-7 flex-1">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Past months
        </h2>
        {months.filter((m) => m.isComplete).length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Your finished months will appear here at the end of the month 🗓️
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {months
              .filter((m) => m.isComplete)
              .map((m) => {
                const savedPct = m.budget > 0 ? (m.saved / m.budget) * 100 : 0;
                const tier = m.saved > 0 ? tierFor(savedPct) : null;
                return (
                  <li
                    key={m.key}
                    className={`rounded-2xl p-4 shadow-sm ${
                      tier ? "bg-card" : "bg-coral-soft"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                          tier ? "bg-primary-soft" : "bg-card"
                        }`}
                      >
                        {tier ? tier.emoji : <Lock className="h-5 w-5 text-coral" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{m.label}</p>
                          {tier && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tier.cls}`}
                            >
                              <PartyPopper className="h-3 w-3" />
                              {tier.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Spent {formatINR(m.spent)} of {formatINR(m.budget)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">
                        {m.saved > 0 ? "Saved" : "Over by"}
                      </span>
                      <span
                        className={`num-xl text-lg font-extrabold ${
                          m.saved > 0 ? "text-primary" : "text-coral"
                        }`}
                      >
                        {formatINR(Math.abs(m.saved))}
                      </span>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
