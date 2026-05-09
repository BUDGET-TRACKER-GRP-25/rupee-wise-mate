import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/external-client";
import { AppShell } from "@/components/AppShell";
import { categoryEmoji, formatINR, monthRange } from "@/lib/format";
import { Bot, Loader2 } from "lucide-react";
import { getAiSuggestion } from "@/lib/ai.functions";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — SpendSmart" },
      { name: "description", content: "See where your money goes with friendly, AI-powered savings tips." },
    ],
  }),
  component: Insights,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
];

type Expense = { id: string; amount: number; category: string };
type Settings = { id: string; monthly_budget: number };

function Insights() {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const fetchAi = useServerFn(getAiSuggestion);

  useEffect(() => {
    (async () => {
      const { start, end } = monthRange();
      const [{ data: e }, { data: s }] = await Promise.all([
        supabase.from("expenses").select("id, amount, category").gte("date", start).lte("date", end),
        supabase.from("user_settings").select("id, monthly_budget").order("created_at", { ascending: false }).limit(1),
      ]);
      setExpenses((e ?? []) as Expense[]);
      setSettings((s?.[0] ?? null) as Settings | null);
    })();
  }, []);

  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses ?? []) map[e.category] = (map[e.category] ?? 0) + Number(e.amount);
    return map;
  }, [expenses]);

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const data = Object.entries(breakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  useEffect(() => {
    if (!settings || !expenses) return;
    if (expenses.length === 0) return;
    const cacheKey = `ss-tip-${settings.id}-${monthRange().label}-${expenses.length}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setTip(cached);
      return;
    }
    setTipLoading(true);
    fetchAi({
      data: {
        type: "tip",
        monthlyBudget: Number(settings.monthly_budget),
        totalSpent: total,
        breakdown,
      },
    })
      .then((r) => {
        setTip(r.text);
        sessionStorage.setItem(cacheKey, r.text);
      })
      .finally(() => setTipLoading(false));
  }, [settings, expenses, breakdown, total, fetchAi]);

  if (!expenses || !settings) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const budget = Number(settings.monthly_budget);
  const usedPct = budget > 0 ? Math.round((total / budget) * 100) : 0;

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <h1 className="text-2xl font-extrabold">Your Spending Insights</h1>
        <p className="text-sm text-muted-foreground">{monthRange().label}</p>
      </header>

      {data.length === 0 ? (
        <div className="mx-5 mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Add some expenses to see your insights</p>
        </div>
      ) : (
        <>
          <div className="mx-5 mt-6 rounded-3xl bg-card p-4 shadow-sm">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ul className="mt-2 space-y-2">
              {data.map((d, i) => {
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <li key={d.name} className="flex items-center gap-3">
                    <span className="flex h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-lg">{categoryEmoji(d.name)}</span>
                    <span className="flex-1 text-sm font-semibold">{d.name}</span>
                    <span className="num-xl text-sm font-bold">{formatINR(d.value)}</span>
                    <span className="w-10 text-right text-xs font-medium text-muted-foreground">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mx-5 mt-5 rounded-3xl bg-coral-soft p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral text-coral-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-coral">Savings Tip</p>
                <p className="mt-1 text-sm leading-relaxed">
                  {tipLoading || !tip ? "Cooking up a tip... 🍳" : tip}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-5 mt-5 rounded-3xl bg-card p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total this month</p>
            <p className="num-xl mt-1 text-3xl font-extrabold">{formatINR(total)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You've used <span className="font-semibold text-foreground">{usedPct}%</span> of your{" "}
              {formatINR(budget)} budget
            </p>
          </div>
        </>
      )}
    </AppShell>
  );
}
