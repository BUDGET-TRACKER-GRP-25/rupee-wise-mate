export const formatINR = (n: number) => {
  const v = Math.round(Number(n) || 0);
  return "₹" + v.toLocaleString("en-IN");
};

export const CATEGORIES = [
  { key: "Food", emoji: "🍔" },
  { key: "Travel", emoji: "🚗" },
  { key: "Shopping", emoji: "🛍️" },
  { key: "Bills", emoji: "💡" },
  { key: "Fun", emoji: "🎮" },
  { key: "Health", emoji: "💊" },
  { key: "Other", emoji: "📦" },
] as const;

export const categoryEmoji = (cat: string) =>
  CATEGORIES.find((c) => c.key === cat)?.emoji ?? "📦";

export const monthRange = (d = new Date()) => {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
      x.getDate(),
    ).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end), label: start.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
};
