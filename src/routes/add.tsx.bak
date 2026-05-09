import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/external-client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Loader2 } from "lucide-react";
import { CATEGORIES } from "@/lib/format";
import { cn } from "@/lib/utils";

const search = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/add")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Add expense — SpendSmart" },
      { name: "description", content: "Log a new expense in seconds." },
    ],
  }),
  component: AddExpense,
});

function AddExpense() {
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/add" });
  const editing = Boolean(id);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(editing);

  useEffect(() => {
    if (!editing || !id) return;
    (async () => {
      const { data } = await supabase.from("expenses").select("*").eq("id", id).maybeSingle();
      if (data) {
        setAmount(String(data.amount));
        setCategory(data.category);
        setNote(data.note ?? "");
        setDate(data.date);
      }
      setHydrating(false);
    })();
  }, [editing, id]);

  const valid = Number(amount) > 0 && category.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    const payload = { amount: Number(amount), category, note: note.trim() || null, date };
    const { error } = editing && id
      ? await supabase.from("expenses").update(payload).eq("id", id)
      : await supabase.from("expenses").insert(payload);
    setLoading(false);
    if (error) {
      toast.error("Couldn't save expense — try again");
      return;
    }
    toast.success(editing ? "Expense updated 💚" : "Expense saved! 💚");
    navigate({ to: editing ? "/history" : "/" });
  };

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-3 pt-4">
        <button onClick={() => history.back()} className="rounded-full p-2 hover:bg-secondary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{editing ? "Edit Expense" : "Add Expense"}</h1>
      </header>

      {hydrating ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-1 flex-col px-5 pt-6">
          <div className="flex items-end justify-center gap-1">
            <span className="pb-3 text-3xl font-bold text-muted-foreground">₹</span>
            <input
              autoFocus={!editing}
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="num-xl w-full max-w-[260px] bg-transparent text-center text-6xl font-extrabold text-foreground outline-none placeholder:text-muted-foreground/40"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Category</p>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "flex shrink-0 flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 transition-all",
                    category === c.key
                      ? "border-primary bg-primary-soft scale-105"
                      : "border-border bg-card",
                  )}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-semibold">{c.key}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Note</label>
              <Input
                placeholder="What was this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12 rounded-2xl"
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-2xl"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>

          <div className="mt-auto pb-2 pt-6">
            <Button
              type="submit"
              disabled={!valid || loading}
              className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Expense"}
            </Button>
          </div>
        </form>
      )}
    </AppShell>
  );
}
