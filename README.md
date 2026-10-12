# Legend Flow Global (LFG) Online Interview System

The **LFG Online Interview System** is a full-stack web application developed for **Legend Flow Global (Pvt) Ltd**. It provides an end-to-end platform for public member onboarding, a bilingual (Urdu & English) 10-question interview workflow, automated server-side evaluation via Gemini AI (`gemini-3.8-flash`), strict one-attempt enforcement, candidate result feedback, and an administrator review dashboard with audit logging.

---

## 🚀 Key Features

### 1. Official LFG Branding
- Authentic visual identity derived directly from the official Legend Flow Global logo (Navy Blue `#0b2545`, Globe Blue `#2563eb`, Accent Green `#22c55e`, and Crisp White `#ffffff`).
- Official vector SVG logo rendered at `/public/lfg-logo.svg`.
- Clean typography supporting English (Plus Jakarta Sans) and Urdu (Noto Nastaliq Urdu / Noto Sans Arabic).

### 2. Public Registration & Authentication
- Open public registration for any applicant via shareable link.
- Validated inputs: Full Name, Email, Password, Confirm Password.
- Optional Sponsor / Referral ID tracking (`?ref=...` or typed input; recorded as `"Not recorded"` if omitted).
- Secure password hashing with `bcryptjs`.
- Password reset flow with time-limited reset tokens.
- Strict Role-Based Access Control (RBAC): Public registration grants `member` role only; admin access requires authorized server-side assignment.

### 3. Bilingual 10-Question Interview Engine
- Exactly the 10 official LFG questions in one continuous sequence.
- Independent Urdu/English language switch for question text without breaking UI context.
- Multilingual answer input: Evaluates answers written in **Urdu**, **Roman Urdu**, or **English**.
- Answer persistence: Answers remain saved locally while jumping between questions using the 10-step navigator.
- Pre-submission validation: Verifies all 10 questions are answered before submission.
- Rubrics kept confidential prior to submission.

### 4. AI Evaluation Engine (Gemini 3.8 Flash)
- Server-side evaluation using `@google/genai` with model `gemini-3.8-flash`.
- Evaluates candidate understanding, mindset, and practical reasoning against defined rubrics rather than surface keywords.
- Per-Question Passing Rule: Score ≥ 40% = **PASS**; Score < 40% = **FAIL**.
- Final Interview Passing Rule: ≥ 7 passed questions = **PASS**; < 7 passed questions = **FAIL**.
- Returns question scores (0-100%), PASS/FAIL status, evaluation rationale, and constructive feedback.
- Network resilience: If AI evaluation is delayed, submitted answers are safely preserved with `evaluation_status: 'pending'` or `'failed'` for retry without losing answers.

### 5. Strict One-Attempt Enforcement
- One completed interview attempt per member, enforced server-side and in the database.
- Prevents duplicate submissions and tampering.
- Post-submission results display verified stats, confetti celebration on PASS, and honest dispatch status.

### 6. Administrator Review Dashboard
- Protected dashboard restricted to authorized administrators.
- 6 Live Summary Metrics:
  1. Total Registered Members
  2. Members Attempted
  3. Members Not Attempted
  4. Members Passed (≥ 7/10)
  5. Members Failed (< 7/10)
  6. Pending Evaluations
- Filterable, searchable, sortable candidate table (Timeframe, Attempt status, Result, Search by name/email/sponsor).
- Candidate Detail Modal: Full access to all 10 answers, AI scores, and feedback.
- Administrator Score Override tool with mandatory justification notes.
- Rubric Management Panel: Edit and approve rubrics for all 10 questions, with dedicated review flags for Questions 1 & 3.
- Immutable System Audit Trail logging all admin adjustments.

---

## 🗄️ Database Architecture & Migration

The system is architected to run seamlessly against **Supabase PostgreSQL** while maintaining a local fallback.

### Database Tables:
1. `public.member_roster` — User identities, hashed credentials, roles, and sponsor tracking.
2. `public.interview_questions` — Bilingual questions (Urdu & English) and approved rubrics.
3. `public.interview_attempts` — Unique candidate attempts, total scores, passed questions count, and status.
4. `public.interview_answers` — Candidate answers, scores (0-100%), pass status, rationale, and coaching feedback.
5. `public.audit_logs` — Immutable audit log of administrative overrides and rubric updates.

The complete SQL migration script is located at:
`migrations/001_initial_schema.sql`

To deploy to Supabase:
1. Open your Supabase Dashboard -> **SQL Editor**.
2. Paste the contents of `migrations/001_initial_schema.sql`.
3. Click **Run** to execute the migration and seed the 10 questions and rubrics.

---

## ⚙️ Environment Variables

Configure the following variables in your environment or hosting provider (e.g., Cloud Run, Vercel, Supabase):

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Required for Gemini AI answer evaluation (`gemini-3.8-flash`). |
| `ADMIN_EMAIL` | Email address of the primary LFG Administrator (e.g. `personalemailmaazqaimkhani@gmail.com`). |
| `JWT_SECRET` | Secret key for signing session tokens (32+ characters). |
| `SUPABASE_URL` | (Optional) Your Supabase project URL for cloud PostgreSQL. |
| `SUPABASE_ANON_KEY` | (Optional) Supabase anonymous client API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | (Optional) Supabase service role key for backend operations. |
| `PORT` | Listening port for the application server (default: `3000`). |

---

## 🛠️ Running the Application

### Development:
```bash
npm run dev
```

### Production Build & Start:
```bash
npm run build
npm start
```
