import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/external-client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/format";
import { cn } from "@/lib/utils";
import { parseVoiceExpense } from "@/lib/ai.functions";

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
  const [isListening, setIsListening] = useState(false);
  const [wasVoiceParsed, setWasVoiceParsed] = useState(false);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const fetchVoice = useServerFn(parseVoiceExpense);

  const playFeedback = (type: "start" | "success") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === "start") {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      }
    } catch (e) {
      console.warn("Audio feedback failed:", e);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      playFeedback("start");
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = async (event: any) => {
      let text = event.results[0][0].transcript;
      
      // Clean up common Speech-to-Text mistakes (like hearing "for" as "4")
      text = text.replace(/(\d+)\s*4\s+/g, "$1 for "); // "500 4 food" -> "500 for food"
      text = text.replace(/(\d+)4\s+/g, "$1 for ");   // "504 food" -> "500 for food" (common bunching)
      text = text.replace(/\s+4\s+/g, " for ");        // "spent 4 food" -> "spent for food"

      toast.info(`Heard: "${text}"`);
      
      // --- NEW: Local Parsing First (Instant & Offline) ---
      const amountMatches = text.match(/(\d+)/g);
      const amount = amountMatches?.[0] || null;
      const hasMultiplePotential = (amountMatches && amountMatches.length > 1) || text.toLowerCase().includes(" and ") || text.includes("&");
      
      let category = null;
      let brand = "";
      const lowerText = text.toLowerCase();
      if (lowerText.includes("food") || lowerText.includes("eat") || lowerText.includes("dinner") || lowerText.includes("lunch") || lowerText.includes("zomato") || lowerText.includes("swiggy") || lowerText.includes("restaurant")) category = "Food";
      else if (lowerText.includes("travel") || lowerText.includes("cab") || lowerText.includes("bus") || lowerText.includes("auto") || lowerText.includes("uber") || lowerText.includes("ola") || lowerText.includes("rapido")) category = "Travel";
      else if (lowerText.includes("shopping") || lowerText.includes("buy") || lowerText.includes("amazon") || lowerText.includes("myntra") || lowerText.includes("flipkart") || lowerText.includes("zepto") || lowerText.includes("blinkit")) category = "Shopping";
      else if (lowerText.includes("bill") || lowerText.includes("recharge") || lowerText.includes("rent") || lowerText.includes("electricity") || lowerText.includes("jio") || lowerText.includes("airtel")) category = "Bills";
      else if (lowerText.includes("fun") || lowerText.includes("movie") || lowerText.includes("party") || lowerText.includes("pvr") || lowerText.includes("netflix") || lowerText.includes("hotstar")) category = "Fun";

      if (category) {
        const brands = ["zomato", "swiggy", "uber", "ola", "amazon", "myntra", "flipkart", "zepto", "blinkit", "pvr", "netflix", "hotstar", "jio", "airtel"];
        for (const b of brands) {
          if (lowerText.includes(b)) {
            brand = b.charAt(0).toUpperCase() + b.slice(1);
            break;
          }
        }
      }

      if (amount && category && !hasMultiplePotential) {
        setAmount(amount);
        setCategory(category);
        setNote(brand ? `${category} - ${brand}` : category);
        
        if (lowerText.includes("yesterday")) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          setDate(yesterday.toISOString().slice(0, 10));
        }

        setWasVoiceParsed(true);
        playFeedback("success");
        toast.success("Parsed instantly! ✨");
        return;
      }
      // ----------------------------------------------------

      setLoading(true);
      try {
        const result = await fetchVoice({ 
          data: {
            text, 
            currentDate: new Date().toISOString().slice(0, 10) 
          }
        });
        console.log("VOICE PARSE RESULT:", result);
        
        if (result.error) {
          window.alert("AI ERROR: " + result.error);
          if (amount) {
            setAmount(amount);
            if (category) setCategory(category);
            setNote(brand ? `${category} - ${brand}` : category);
            setWasVoiceParsed(true);
            playFeedback("success");
            toast.success("Parsed locally! ✨");
          } else {
            toast.error("Couldn't find an amount. Try saying '500 for coffee'");
          }
          return;
        }

        if (result.expenses && result.expenses.length > 0) {
          if (result.expenses.length === 1) {
            const e = result.expenses[0];
            if (e.amount) setAmount(String(e.amount));
            if (e.category) setCategory(e.category);
            if (e.note) setNote(e.note);
            if (e.date) setDate(e.date);
            setWasVoiceParsed(true);
            toast.success("Parsed by AI! ✨");
          } else {
            setPendingExpenses(result.expenses);
            setWasVoiceParsed(true);
            toast.success(`Found ${result.expenses.length} expenses! ✨`);
          }
          playFeedback("success");
        } else {
          window.alert("AI returned NO expenses. Check console.");
        }
      } catch (err) {
        console.error("Voice parse error:", err);
        if (amount) {
          setAmount(amount);
          setWasVoiceParsed(true);
          playFeedback("success");
          toast.success("Parsed amount locally! ✨");
        } else {
          toast.error("Network issue. Try manual entry.");
        }
      } finally {
        setLoading(false);
      }
    };

    recognition.start();
  };

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

  const saveAll = async () => {
    if (loading || pendingExpenses.length === 0) return;
    setLoading(true);
    const { error } = await supabase.from("expenses").insert(pendingExpenses);
    setLoading(false);
    if (error) {
      toast.error("Couldn't save multiple — try manual entry");
      return;
    }
    toast.success(`${pendingExpenses.length} expenses saved! 💚`);
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-3 pt-4">
        <button onClick={() => history.back()} className="rounded-full p-2 hover:bg-secondary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{editing ? "Edit Expense" : "Add Expense"}</h1>
      </header>

      {wasVoiceParsed && (
        <div className="mx-5 mt-4 flex items-center justify-between rounded-xl bg-primary-soft p-3 text-[11px] font-semibold text-primary animate-in fade-in slide-in-from-top-2">
          <span>✨ Voice entries filled. Please review.</span>
          <button onClick={() => setWasVoiceParsed(false)} className="underline">Dismiss</button>
        </div>
      )}

      {pendingExpenses.length > 0 ? (
        <div className="flex flex-1 flex-col px-5 pt-6 animate-in fade-in zoom-in-95">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Bulk Review ({pendingExpenses.length})</h2>
          <div className="space-y-3">
            {pendingExpenses.map((e, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-2xl border bg-card p-4">
                <div>
                  <p className="text-lg font-bold text-foreground">₹{e.amount}</p>
                  <p className="text-xs text-muted-foreground">{e.note}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold uppercase">{e.category}</span>
                  <p className="mt-1 text-[10px] text-muted-foreground">{e.date}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-3 pb-2 pt-6">
            <Button onClick={saveAll} disabled={loading} className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Save all ${pendingExpenses.length} expenses`}
            </Button>
            <Button variant="secondary" onClick={() => setPendingExpenses([])} className="h-12 w-full rounded-2xl text-sm font-semibold">
              Cancel & Start Over
            </Button>
          </div>
        </div>
      ) : hydrating ? (
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
            <button
              type="button"
              onClick={startListening}
              disabled={loading}
              className={cn(
                "mb-2 rounded-full p-3 transition-all",
                isListening ? "bg-red-100 text-red-500 animate-pulse" : "bg-secondary text-muted-foreground hover:bg-secondary/80",
                loading && "bg-primary-soft text-primary animate-bounce"
              )}
            >
              {loading ? <Sparkles className="h-6 w-6" /> : isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] font-medium text-muted-foreground/60">
            Try saying <span className="text-muted-foreground">"500 for lunch"</span> or <span className="text-muted-foreground">"100 for travel"</span>
          </p>

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
