import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/external-client";
import { useSession } from "@/hooks/use-session";
import { AppShell } from "@/components/AppShell";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { categoryEmoji, formatINR } from "@/lib/format";
import { Loader2, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "All expenses — SpendSmart" },
      { name: "description", content: "Browse, edit, and delete your past expenses." },
    ],
  }),
  component: History,
});

type Expense = { id: string; amount: number; category: string; note: string | null; date: string; created_at: string };

function History() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSession();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current
  const [selected, setSelected] = useState<Expense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = async () => {
    if (!user) return;
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const fmt = (x: Date) => x.toISOString().slice(0, 10);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .gte("date", fmt(start))
      .lte("date", fmt(end))
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setExpenses((data ?? []) as Expense[]);
  };

  useEffect(() => {
    if (authLoading || !user) return;
    setExpenses(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOffset, authLoading, user]);

  const monthLabel = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
  }, [monthOffset]);

  const tabs = [-2, -1, 0].map((o) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + o);
    return { offset: o, label: d.toLocaleString("en-IN", { month: "short" }) };
  });

  const onDelete = async () => {
    if (!selected) return;
    const { error } = await supabase.from("expenses").delete().eq("id", selected.id);
    if (error) {
      toast.error("Couldn't delete");
    } else {
      toast.success("Deleted");
      setSelected(null);
      setConfirmDelete(false);
      load();
    }
  };

  return (
    <AppShell>
      <header className="px-5 pt-8">
        <h1 className="text-2xl font-extrabold">All Expenses</h1>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
      </header>

      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-2">
        {tabs.map((t) => (
          <button
            key={t.offset}
            onClick={() => setMonthOffset(t.offset)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              monthOffset === t.offset
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex-1 px-5">
        {expenses === null ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="mt-10 rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No expenses this month yet</p>
          </div>
        ) : (
          <ul className="space-y-2 pb-4">
            {expenses.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setSelected(e)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-xl">
                    {categoryEmoji(e.category)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{e.note || e.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <p className="num-xl text-base font-bold">{formatINR(Number(e.amount))}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Drawer open={!!selected && !confirmDelete} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="mx-auto max-w-[480px]">
          <DrawerHeader>
            <DrawerTitle>
              {selected && (
                <span className="flex items-center gap-2">
                  <span className="text-2xl">{categoryEmoji(selected.category)}</span>
                  <span>{selected.note || selected.category}</span>
                </span>
              )}
            </DrawerTitle>
          </DrawerHeader>
          {selected && (
            <div className="px-4 pb-2">
              <p className="num-xl text-3xl font-extrabold">{formatINR(Number(selected.amount))}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(selected.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 p-4">
            <Button
              variant="outline"
              className="h-12 rounded-2xl"
              onClick={() => {
                if (selected) navigate({ to: "/add", search: { id: selected.id } });
              }}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button
              variant="destructive"
              className="h-12 rounded-2xl bg-coral hover:bg-coral/90"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-coral hover:bg-coral/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
