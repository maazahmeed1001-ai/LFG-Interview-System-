-- =========================================================================
-- LFG ONLINE INTERVIEW SYSTEM — SUPABASE POSTGRESQL INITIAL SCHEMA MIGRATION
-- Legend Flow Global (LFG) Database Schema
-- Version: 001_initial_schema.sql
-- =========================================================================

-- 1. Create member_roster table
CREATE TABLE IF NOT EXISTS public.member_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    sponsor_id TEXT NOT NULL DEFAULT 'Not recorded',
    reset_token TEXT,
    reset_token_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_member_roster_email ON public.member_roster (email);
CREATE INDEX IF NOT EXISTS idx_member_roster_role ON public.member_roster (role);

-- 2. Create interview_questions table
CREATE TABLE IF NOT EXISTS public.interview_questions (
    id SERIAL PRIMARY KEY,
    question_number INT UNIQUE NOT NULL CHECK (question_number BETWEEN 1 AND 10),
    text_urdu TEXT NOT NULL,
    text_english TEXT NOT NULL,
    default_rubric TEXT NOT NULL,
    admin_approved_rubric TEXT NOT NULL,
    requires_custom_review BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create interview_attempts table (Enforces exactly one attempt per member via UNIQUE constraint)
CREATE TABLE IF NOT EXISTS public.interview_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.member_roster(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('not_attempted', 'submitted', 'completed')),
    total_score INT NOT NULL DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
    passed_questions INT NOT NULL DEFAULT 0 CHECK (passed_questions BETWEEN 0 AND 10),
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    submission_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    evaluation_status TEXT NOT NULL DEFAULT 'pending' CHECK (evaluation_status IN ('pending', 'completed', 'failed')),
    notification_status TEXT NOT NULL DEFAULT 'Saved to central database and accessible to authorized LFG Seniors and Admins.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_member_single_attempt UNIQUE (member_id)
);

CREATE INDEX IF NOT EXISTS idx_interview_attempts_member_id ON public.interview_attempts (member_id);
CREATE INDEX IF NOT EXISTS idx_interview_attempts_is_passed ON public.interview_attempts (is_passed);
CREATE INDEX IF NOT EXISTS idx_interview_attempts_submission_time ON public.interview_attempts (submission_time);

-- 4. Create interview_answers table
CREATE TABLE IF NOT EXISTS public.interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.interview_attempts(id) ON DELETE CASCADE,
    question_number INT NOT NULL CHECK (question_number BETWEEN 1 AND 10),
    question_text_en TEXT NOT NULL,
    question_text_ur TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    explanation TEXT NOT NULL,
    feedback TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_interview_answers_attempt ON public.interview_answers (attempt_id);

-- 5. Create audit_logs table for administrative accountability
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- =========================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE public.member_roster ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Member Roster: Users can view their own profile; admins can view all.
CREATE POLICY "Members view own profile"
    ON public.member_roster FOR SELECT
    USING (auth.uid() = id);

-- Interview Questions: All authenticated members can view question text.
CREATE POLICY "Authenticated members view interview questions"
    ON public.interview_questions FOR SELECT
    TO authenticated
    USING (true);

-- Interview Attempts: Members can only view their own attempt.
CREATE POLICY "Members view own interview attempt"
    ON public.interview_attempts FOR SELECT
    USING (auth.uid() = member_id);

-- Interview Answers: Members can only view their own answers.
CREATE POLICY "Members view own answers"
    ON public.interview_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.interview_attempts
            WHERE public.interview_attempts.id = public.interview_answers.attempt_id
            AND public.interview_attempts.member_id = auth.uid()
        )
    );

-- Backend Service Role / Admins bypass RLS for administrative scoring and audits.
-- =========================================================================
-- SEED DATA: 10 EXACT QUESTIONS IN URDU & ENGLISH WITH DRAFT RUBRICS
-- =========================================================================
INSERT INTO public.interview_questions (question_number, text_urdu, text_english, default_rubric, admin_approved_rubric, requires_custom_review, is_approved)
VALUES
(
    1,
    'آج کی پریزنٹیشن میں آپ نے سب سے اہم کیا سیکھا؟',
    'What was the most important thing you learned in today''s presentation?',
    'Evaluates understanding of key themes from the LFG business presentation (e.g. digital business opportunity, global networking, personal growth, e-commerce systems). Partial credit for genuine takeaways or learning mindset. Irrelevant answers fail.',
    'Evaluates understanding of key themes from the LFG business presentation (e.g. digital business opportunity, global networking, personal growth, e-commerce systems). Partial credit for genuine takeaways or learning mindset. Irrelevant answers fail.',
    TRUE,
    TRUE
),
(
    2,
    'آپ کے خیال میں آن لائن بزنس شروع کرنے کے لیے کون سی مہارتیں ضروری ہیں؟',
    'In your opinion, what skills are necessary to start an online business?',
    'Evaluates awareness of practical skills such as communication, digital literacy, customer interaction, consistency, willingness to learn, discipline, or marketing fundamentals.',
    'Evaluates awareness of practical skills such as communication, digital literacy, customer interaction, consistency, willingness to learn, discipline, or marketing fundamentals.',
    FALSE,
    TRUE
),
(
    3,
    'آپ کو Legend Flow Global کے بزنس ماڈل میں کون سی بات سب سے زیادہ سمجھ آئی، اور کون سی بات مزید سمجھنا چاہتے ہیں؟',
    'What part of Legend Flow Global''s business model did you understand best, and what would you like to understand better?',
    'Assesses clarity on LFG model components (team building, mentoring, product/services distribution) and honest identification of areas for deeper training. Demonstrates sincerity and curiosity.',
    'Assesses clarity on LFG model components (team building, mentoring, product/services distribution) and honest identification of areas for deeper training. Demonstrates sincerity and curiosity.',
    TRUE,
    TRUE
),
(
    4,
    'اگر آپ کو کوئی شخص پہلی مرتبہ انکار کر دے تو آپ کیا کریں گے؟',
    'If someone says no to you for the first time, what would you do?',
    'Assesses emotional resilience, professionalism, patience, respecting the prospect''s decision, analyzing what to improve, and maintaining relationships without getting discouraged or aggressive.',
    'Assesses emotional resilience, professionalism, patience, respecting the prospect''s decision, analyzing what to improve, and maintaining relationships without getting discouraged or aggressive.',
    FALSE,
    TRUE
),
(
    5,
    'اگر آپ کو کسی کام میں فوری کامیابی نہ ملے تو کیا آپ سیکھنا جاری رکھیں گے؟ کیوں؟',
    'If you do not achieve immediate success at a task, will you continue learning? Why?',
    'Evaluates long-term growth mindset, understanding that business success requires patience, perseverance, adapting techniques, and consistent effort rather than get-rich-quick expectations.',
    'Evaluates long-term growth mindset, understanding that business success requires patience, perseverance, adapting techniques, and consistent effort rather than get-rich-quick expectations.',
    FALSE,
    TRUE
),
(
    6,
    'آپ اس موقع سے کیا حاصل کرنا چاہتے ہیں — نئی مہارتیں، تجربہ، ٹیم ورک یا کاروباری آمدنی؟',
    'What do you want to gain from this opportunity—new skills, experience, teamwork, or business income?',
    'Evaluates candidate motivation, career/personal goals, clarity of purpose, alignment with team values, and realistic aspirations for skill mastery and income generation.',
    'Evaluates candidate motivation, career/personal goals, clarity of purpose, alignment with team values, and realistic aspirations for skill mastery and income generation.',
    FALSE,
    TRUE
),
(
    7,
    'اگر آپ کو کوئی کام سمجھ نہ آئے تو آپ مدد کیسے حاصل کریں گے؟',
    'If you do not understand a task, how would you get help?',
    'Evaluates coachability, proactive inquiry, consulting seniors/mentors, reviewing training modules, collaborating with teammates, and willingness to ask guidance politely.',
    'Evaluates coachability, proactive inquiry, consulting seniors/mentors, reviewing training modules, collaborating with teammates, and willingness to ask guidance politely.',
    FALSE,
    TRUE
),
(
    8,
    'آپ روزانہ سیکھنے اور کام کرنے کے لیے حقیقتاً کتنا وقت دے سکتے ہیں؟',
    'How much time can you realistically dedicate to learning and working each day?',
    'Evaluates honesty, time management, and commitment level (e.g. 2+ hours daily, part-time or full-time focus) with practical schedule awareness.',
    'Evaluates honesty, time management, and commitment level (e.g. 2+ hours daily, part-time or full-time focus) with practical schedule awareness.',
    FALSE,
    TRUE
),
(
    9,
    'فرض کریں آپ کو کسی نئے شخص کو آن لائن کورس یا بزنس پریزنٹیشن کے بارے میں بتانا ہے۔ آپ گفتگو کیسے شروع کریں گے؟',
    'Suppose you need to tell a new person about an online course or business presentation. How would you start the conversation?',
    'Assesses natural communication skills, respectful opening, asking about the person''s goals or needs, introducing the opportunity professionally without pressure or misleading claims.',
    'Assesses natural communication skills, respectful opening, asking about the person''s goals or needs, introducing the opportunity professionally without pressure or misleading claims.',
    FALSE,
    TRUE
),
(
    10,
    'ہم آپ کو اپنی ٹیم میں کیوں شامل کریں؟ آپ کی کون سی خوبی ٹیم کے لیے فائدہ مند ہوگی؟',
    'Why should we include you in our team? What quality of yours would benefit the team?',
    'Assesses self-awareness, positive attitude, personal strengths (e.g. integrity, hard work, teamwork, enthusiasm, fast learning), and how those qualities add value to Legend Flow Global.',
    'Assesses self-awareness, positive attitude, personal strengths (e.g. integrity, hard work, teamwork, enthusiasm, fast learning), and how those qualities add value to Legend Flow Global.',
    FALSE,
    TRUE
)
ON CONFLICT (question_number) DO NOTHING;
