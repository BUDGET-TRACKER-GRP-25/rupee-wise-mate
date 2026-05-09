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
    const groqKey = process.env.GROQ_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    const apiKey = groqKey || lovableKey;

    if (!apiKey) {
      return { text: "Add a few expenses to unlock smart insights ✨" };
    }

    const baseUrl = groqKey 
      ? "https://api.groq.com/openai/v1/chat/completions" 
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    
    const model = groqKey ? "llama-3.3-70b-versatile" : "google/gemini-2.0-flash-exp";

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
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
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

const voiceInputSchema = z.object({
  text: z.string(),
  currentDate: z.string().optional(),
  budgetRemaining: z.number().optional(),
});

export const parseVoiceExpense = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => voiceInputSchema.parse(data))
  .handler(async ({ data }) => {
    const groqKey = process.env.GROQ_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    const apiKey = groqKey || lovableKey;

    if (!apiKey) {
      return { error: "AI key missing" };
    }

    const baseUrl = groqKey 
      ? "https://api.groq.com/openai/v1/chat/completions" 
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    
    const model = groqKey ? "llama-3.3-70b-versatile" : "google/gemini-2.0-flash-exp";

    const systemMsg = `You are an expert financial assistant. Parse the user's voice input into one or more structured expenses.
Today's date is ${data.currentDate || new Date().toISOString().slice(0, 10)}.

RULES:
1. MULTI-ITEM: If the user lists multiple items, you MUST return EACH item as a separate, distinct object in the 'expenses' array. Do NOT merge them. If the user says "500 for X and 200 for Y", the array MUST have length 2.
2. SEMANTIC MAPPING: Map brands to categories (Uber -> Travel, Zomato -> Food, etc.).
3. NOTE FORMAT: Each 'note' must ONLY be "Category - Service" (e.g. "Food - Zomato"). Do not add anything else.

EXAMPLE INPUT: "I spent 500 on zomato and 200 for a cab yesterday"
EXAMPLE OUTPUT:
{
  "expenses": [
    { "amount": 500, "category": "Food", "note": "Food - Zomato", "date": "2023-10-26" },
    { "amount": 200, "category": "Travel", "note": "Travel - Cab", "date": "2023-10-26" }
  ]
}

Return ONLY a JSON object matching the format above.`;

    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: `Input: "${data.text}"` },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Groq API Error:", errText);
        throw new Error("AI failed");
      }

      const json = await res.json();
      const rawContent = json?.choices?.[0]?.message?.content ?? "{}";
      console.log("GROQ RAW RESPONSE:", rawContent);
      
      // Extract JSON block if AI added conversational text
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      const cleanContent = jsonMatch ? jsonMatch[0] : rawContent;
      
      const content = JSON.parse(cleanContent);
      console.log("PARSED CONTENT:", content);
      return { expenses: content.expenses || content.items || [] };
    } catch (e) {
      console.error("AI voice parse error:", e);
      return { error: "Failed to parse voice" };
    }
  });
