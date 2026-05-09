import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/external-client";
import { useSession } from "@/hooks/use-session";
import { AppShell } from "@/components/AppShell";
import { Plus, Sparkles, Loader2, AlertTriangle, ShieldCheck } from "lucide-react";
import { CATEGORIES, categoryEmoji, formatINR, monthRange } from "@/lib/format";
import { getAiSuggestion } from "@/lib/ai.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpendSmart — Your dashboard" },
      { name: "description", content: "See your monthly budget at a glance with friendly AI insights." },
    ],
  }),
  component: HomePage,
});

type Settings = { id: string; monthly_income: number; monthly_budget: number; currency: string };
type Expense = { id: string; amount: number; category: string; note: string | null; date: string; created_at: string };

function HomePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const fetchAi = useServerFn(getAiSuggestion);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data: s } = await supabase
        .from("user_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!s || s.length === 0) {
        navigate({ to: "/onboarding" });
        return;
      }
      setSettings(s[0] as Settings);

      const { start, end } = monthRange();
      const { data: e } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("created_at", { ascending: false });
      setExpenses((e ?? []) as Expense[]);
    })();
  }, [navigate, authLoading, user]);

  const totalSpent = useMemo(
    () => (expenses ?? []).reduce((sum, x) => sum + Number(x.amount), 0),
    [expenses],
  );
  const today = new Date().toISOString().slice(0, 10);
  const todayExpenses = (expenses ?? []).filter((e) => e.date === today);

  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses ?? []) map[e.category] = (map[e.category] ?? 0) + Number(e.amount);
    return map;
  }, [expenses]);

  // Cache AI per session
  useEffect(() => {
    if (!settings || !expenses) return;
    const cacheKey = `ss-insight-${settings.id}-${monthRange().label}-${expenses.length}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setInsight(cached);
      return;
    }
    setInsightLoading(true);
    fetchAi({
      data: {
        type: "insight",
        monthlyBudget: Number(settings.monthly_budget),
        totalSpent,
        breakdown,
      },
    })
      .then((r) => {
        setInsight(r.text);
        sessionStorage.setItem(cacheKey, r.text);
      })
      .finally(() => setInsightLoading(false));
  }, [settings, expenses, totalSpent, breakdown, fetchAi]);

  if (!settings || !expenses) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const budget = Number(settings.monthly_budget);
  const remaining = Math.max(budget - totalSpent, 0);
  const overspent = totalSpent > budget;
  const overBy = Math.max(totalSpent - budget, 0);
  const lowBalance = !overspent && remaining <= 100;
  const pct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const remainingPct = 100 - pct;

  let ringColor = "var(--color-primary)";
  if (overspent || lowBalance || pct >= 80) ringColor = "var(--color-coral)";
  else if (pct >= 50) ringColor = "var(--color-warn)";

  let badge = { emoji: "😊", text: "On Track", cls: "bg-primary-soft text-primary" };
  if (overspent) badge = { emoji: "🚨", text: "Budget Exceeded", cls: "bg-coral text-coral-foreground" };
  else if (lowBalance) badge = { emoji: "⚠️", text: "Almost Out", cls: "bg-coral text-coral-foreground" };
  else if (remainingPct < 20) badge = { emoji: "😬", text: "Overspending", cls: "bg-coral-soft text-coral" };
  else if (remainingPct < 50) badge = { emoji: "😐", text: "Watch Out", cls: "bg-[oklch(0.96_0.06_85)] text-[oklch(0.45_0.15_70)]" };

  return (
    <AppShell showLogout>
      <div className="px-5 pt-8">
        <p className="text-sm text-muted-foreground">Hey there 👋</p>
        <h1 className="text-xl font-bold">Here's your month so far</h1>
      </div>

      {/* Ring */}
      <div className="mt-6 flex flex-col items-center px-5">
        <ProgressRing pct={pct} color={ringColor} />
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Spent <span className="font-semibold text-foreground">{formatINR(totalSpent)}</span> of{" "}
            <span className="font-semibold text-foreground">{formatINR(budget)}</span> budget
          </p>
          <p className="num-xl mt-1 text-lg font-bold">{formatINR(remaining)} remaining</p>
        </div>
        <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${badge.cls}`}>
          <span>{badge.emoji}</span> {badge.text}
        </span>
      </div>

      {/* Status alert */}
      {overspent || lowBalance ? (
        <div
          role="alert"
          className="mx-5 mt-5 flex items-start gap-3 rounded-3xl border-2 border-coral bg-coral-soft p-4 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-coral-foreground">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-coral">
              {overspent ? "Red Alert — Budget exceeded!" : "Red Alert — Almost out of budget!"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
              {overspent ? (
                <>You're over by <span className="num-xl font-bold">{formatINR(overBy)}</span>. Time to hit pause on non-essentials. 🛑</>
              ) : (
                <>Only <span className="num-xl font-bold">{formatINR(remaining)}</span> left this month. Slow down on spending! 🛑</>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-3xl bg-primary-soft p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">Safe Zone ✅</p>
            <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
              You still have <span className="num-xl font-bold">{formatINR(remaining)}</span> left this month. Keep it up!
            </p>
          </div>
        </div>
      )}

      {/* AI Insight */}
      <div className="mx-5 mt-6 rounded-3xl bg-primary-soft p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">AI Insight</p>
            <p className="mt-1 text-sm leading-relaxed text-accent-foreground">
              {insightLoading || !insight ? "Thinking... ✨" : insight}
            </p>
          </div>
        </div>
      </div>

      {/* Today list */}
      <div className="mx-5 mt-7 flex-1">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Today</h2>
        {todayExpenses.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No expenses today — tap + to add your first one 🎉</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todayExpenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg">
                  {categoryEmoji(e.category)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{e.note || e.category}</p>
                  <p className="text-xs text-muted-foreground">{e.category}</p>
                </div>
                <p className="num-xl text-base font-bold">{formatINR(Number(e.amount))}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* FAB */}
      <Link
        to="/add"
        aria-label="Add expense"
        className="fixed bottom-24 left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 translate-x-[calc(190px-1.75rem)] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </Link>
    </AppShell>
  );
}

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const size = 200;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--color-secondary)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        fill="none"
        style={{ transition: "stroke-dashoffset 700ms ease, stroke 300ms ease" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="rotate-90 fill-foreground"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        style={{ fontSize: 32, fontWeight: 800 }}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
