# 💸 SpendSmart — AI-Powered Budget Tracker

> A simple, engaging budget tracker built for students, new earners, and housewives in India who want to understand where their money goes — without the complexity of traditional finance apps.

---

## 🚀 Live App
👉  https://github.com/BUDGET-TRACKER-GRP-25/rupee-wise-mate.git

---

## 🧠 What It Does

| Feature | Description |
|---|---|
| 📊 Dashboard | See your budget ring, spent vs remaining, and health score |
| ➕ Add Expense | Log any expense in under 3 taps |
| ➕ Add Expense | Using Voice Input |
| 🤖 AI Insights | Get a plain-English summary of your spending habits |
| 💡 Savings Tips | AI-generated personalised tip based on your patterns |
| 📜 History | View, edit, and delete all past expenses |
| 🥧 Pie Chart | Visual breakdown of spend by category |

---

## 👥 Team — Budget Tracker Group 25

| GitHub Username | Role |
|---|---|
| amrinzikra-eng | Admin / Project Lead |
|varghesemohan1@gmail.com
| anugrahaman | Collaborator |
| bhikpersonal-coder | Collaborator |
| chahalgurkiran-gif | Collaborator |
| IMCEZU | Collaborator |
| sanjchaudhuri-dev | Collaborator |

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React + Tailwind CSS (via Lovable) |
| Backend / Database | Supabase |
| AI | Claude API (Anthropic) |
| Hosting | Lovable |
| Version Control | GitHub |

---

## 🗃️ Data Model

**`user_settings` table**
- monthly_income
- monthly_budget
- currency (default: INR)

**`expenses` table**
- amount
- category (Food / Travel / Shopping / Bills / Fun / Health / Other)
- note (optional)
- date

---

## 🏃 How to Run This Project

### Option 1 — Open in Lovable (Recommended)
1. Go to [lovable.dev](https://lovable.dev)
2. Click **"Import from GitHub"**
3. Paste this repo URL: `https://github.com/BUDGET-TRACKER-GRP-25/rupee-wise-mate`
4. Lovable will load the full project
5. Connect your own Supabase project in Settings

### Option 2 — Run Locally
```bash
# Clone the repo
git clone https://github.com/BUDGET-TRACKER-GRP-25/rupee-wise-mate.git

# Go into the folder
cd rupee-wise-mate

# Install dependencies
npm install

# Start the app
npm run dev
```
Then open `http://localhost:5173` in your browser.

---

## 🤝 How to Contribute (For Team Members)

1. Accept the GitHub collaborator invite from your email
2. Import the repo into your Lovable account
3. Make your changes in Lovable
4. Click the GitHub icon in Lovable → **"Commit and Push"**
5. Add a clear commit message like: `"Added edit expense feature"`
6. Never push directly to `main` — create a new branch for your changes

---

## 📌 Current Build Status

- [x] Onboarding flow
- [x] Add expense
- [x] Dashboard with budget ring
- [x] AI insight card
- [x] Budget health badge
- [x] Expense history
- [x] Pie chart on Insights
- [ ] WhatsApp budget alert (n8n — coming soon)
- [ ] Hard budget lock
- [ ] Daily spending summary

---
## Voice Input Features Added
# Intelligent Voice-to-Expense Feature Documentation

This document outlines the major additions and technical implementations made during the session to enhance the `rupee-wise-mate` budget tracker with advanced voice capabilities.

## 1. Project Localization & Environment
- **Portable Node Setup**: Successfully migrated the project to run locally (`C:\Users\anugr\Desktop\antigravity_projects\budgetg25`). Configured a portable `bin/node` environment to bypass Windows system-wide execution policy restrictions, allowing the Vite dev server to run smoothly.

## 2. Advanced Voice UI (`src/routes/add.tsx`)
- **Web Speech API**: Integrated native browser speech recognition.
- **Sensory Feedback**: Added audio cues (using the Web Audio API oscillator) and haptic feedback (`navigator.vibrate`) to signal when listening starts and stops.
- **Visual States**: Implemented a ✨ Sparkles loading state and a responsive UI that adapts based on the parsing result.

## 3. The "Local Brain" Fallback Engine
To ensure the app remains fast and functional even without an internet connection or API key, a robust local parsing engine was built:
- **Smart Brand Dictionary**: Hardcoded recognition for popular Indian brands (Zomato, Swiggy, Uber, Ola, Amazon, Myntra, Flipkart, Zepto, Blinkit, PVR, Netflix, Hotstar, Jio, Airtel).
- **Instant Categorization**: Automatically maps recognized brands to their respective categories (e.g., "Food", "Travel", "Shopping").
- **Offline Date Parsing**: Recognizes the word "yesterday" and automatically adjusts the calendar input without needing AI.
- **Transcription Auto-Correction**: Added regex cleaners to intercept and fix common Web Speech API mistakes (e.g., automatically correcting "504 food" or "500 4 food" to "500 for food").

## 4. High-Speed AI Integration (Groq)
- **API Swap**: Upgraded the backend server functions (`src/lib/ai.functions.ts`) to prioritize the **Groq API** (`GROQ_API_KEY`) for lightning-fast processing, while keeping the Lovable gateway as a fallback.
- **Model Upgrade**: Handled the real-time deprecation of older models by upgrading the system to use Groq's recommended **llama-3.3-70b-versatile** model.
- **Robust Error Handling**: Removed strict API-level JSON mode requirements to prevent 400 Bad Request errors, relying instead on a custom regex extractor (`/\{[\s\S]*\}/`) to safely pull JSON data even if the AI adds conversational text.

## 5. Multi-Expense Parsing & Bulk Review
- **Few-Shot Prompting**: Upgraded the AI system prompt with strict rules and an explicit `EXAMPLE INPUT / EXAMPLE OUTPUT` block. This guarantees the AI returns multiple distinct objects rather than merging them.
- **Smart Routing**: The local parser was updated to detect multiple numbers or the word "and" (`hasMultiplePotential`). When detected, it intentionally defers to the AI to handle the complex sentence.
- **Bulk Review UI**: Added a completely new view in `add.tsx`. When multiple expenses are detected, the standard form is hidden, and a "Bulk Review" list is displayed. This allows the user to review all detected items and insert them into the Supabase database simultaneously with a single "Save All" action.

---

## 📬 Contact
Built as part of the **Outskill AI Accelerator Program — May 2026**  
Project Lead: Zikra Amrin
