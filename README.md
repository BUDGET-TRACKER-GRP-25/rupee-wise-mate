# 💸 SpendSmart — AI-Powered Budget Tracker

> A simple, engaging budget tracker built for students, new earners, and housewives in India who want to understand where their money goes — without the complexity of traditional finance apps.

---

## 🚀 Live App
👉 [Click here to open SpendSmart](#) *(paste your Lovable published link here)*

---

## 🧠 What It Does

| Feature | Description |
|---|---|
| 📊 Dashboard | See your budget ring, spent vs remaining, and health score |
| ➕ Add Expense | Log any expense in under 3 taps |
| 🤖 AI Insights | Get a plain-English summary of your spending habits |
| 💡 Savings Tips | AI-generated personalised tip based on your patterns |
| 📜 History | View, edit, and delete all past expenses |
| 🥧 Pie Chart | Visual breakdown of spend by category |

---

## 👥 Team — Budget Tracker Group 25

| GitHub Username | Role |
|---|---|
| amrinzikra-eng | Admin / Project Lead |
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

## 📬 Contact
Built as part of the **Outskill AI Accelerator Program — May 2026**  
Project Lead: Zikra Amrin
