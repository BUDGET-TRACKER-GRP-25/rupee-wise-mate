import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up SpendSmart" },
      { name: "description", content: "Tell us your income and budget to get started." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [income, setIncome] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("user_settings").select("id").limit(1);
      if (data && data.length > 0) navigate({ to: "/" });
      else setChecking(false);
    })();
  }, [navigate]);

  const valid = Number(income) > 0 && Number(budget) > 0 && Number(budget) <= Number(income);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from("user_settings").insert({
      monthly_income: Number(income),
      monthly_budget: Number(budget),
      currency: "INR",
    });
    setLoading(false);
    if (error) {
      setError("Something went wrong, try again");
      return;
    }
    navigate({ to: "/" });
  };

  if (checking) {
    return (
      <AppShell hideNav>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <div className="flex flex-1 flex-col px-6 pt-12">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">SpendSmart</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight">
          Let's set up your money goals 💚
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A friendly nudge towards smarter spending. Takes 10 seconds.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <Label htmlFor="income" className="text-sm font-semibold">What's your monthly income?</Label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">₹</span>
              <Input
                id="income"
                type="number"
                inputMode="numeric"
                placeholder="25000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="h-14 rounded-2xl pl-9 text-lg font-semibold"
                min="1"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="budget" className="text-sm font-semibold">What's your monthly budget?</Label>
            <div className="relative mt-2">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">₹</span>
              <Input
                id="budget"
                type="number"
                inputMode="numeric"
                placeholder="15000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="h-14 rounded-2xl pl-9 text-lg font-semibold"
                min="1"
                required
              />
            </div>
            {Number(budget) > 0 && Number(income) > 0 && Number(budget) > Number(income) && (
              <p className="mt-2 text-xs text-coral">Budget can't be higher than income.</p>
            )}
          </div>

          {error && <p className="text-sm text-coral">{error}</p>}

          <Button
            type="submit"
            disabled={!valid || loading}
            className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Let's Go →"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
