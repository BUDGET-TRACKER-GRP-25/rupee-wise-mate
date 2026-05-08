import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  type: z.enum(["insight", "tip"]),
  monthlyBudget: z.number(),
  totalSpent: z.number(),
  breakdown: z.record(z.string(), z.number()),
});

export const getAiSuggestion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { text: "Add a few expenses to unlock smart insights ✨" };
    }

    const breakdownStr = Object.entries(data.breakdown)
      .map(([k, v]) => `${k}: ₹${Math.round(v)}`)
      .join(", ") || "no spending yet";

    const systemMsg =
      data.type === "insight"
        ? "You are a friendly financial assistant for young Indian users. Always reply in 2 short sentences. No jargon. Warm and encouraging."
        : "You are a friendly financial coach for students and young earners in India. Reply with EXACTLY 1 specific actionable savings tip in under 30 words. Warm, not preachy.";

    const userMsg =
      data.type === "insight"
        ? `Monthly budget: ₹${data.monthlyBudget}. Spent so far: ₹${Math.round(
            data.totalSpent,
          )}. Breakdown: ${breakdownStr}. Write a 2-sentence friendly summary of this person's spending.`
        : `Spending breakdown this month: ${breakdownStr}. Budget: ₹${data.monthlyBudget}. Give exactly 1 specific actionable savings tip under 30 words.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: userMsg },
          ],
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return { text: "Catch your breath — too many AI requests right now. Try again soon." };
        if (res.status === 402) return { text: "AI credits ran out. Top up to keep insights flowing 💚" };
        return { text: "Couldn't fetch insight right now. Try again in a moment." };
      }

      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content?.trim() ?? "All good — keep going! 💚";
      return { text };
    } catch (e) {
      console.error("AI insight error:", e);
      return { text: "Couldn't reach the AI right now. Try again later." };
    }
  });
