import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'lfg_database.json');

// Interface definitions mirroring Supabase schema
export interface MemberRoster {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: 'member' | 'admin';
  sponsor_id: string; // Sponsor referral code or "Not recorded"
  reset_token?: string | null;
  reset_token_expiry?: number | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: number;
  question_number: number;
  text_urdu: string;
  text_english: string;
  default_rubric: string;
  admin_approved_rubric: string;
  requires_custom_review: boolean;
  is_approved: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InterviewAnswer {
  id: string;
  attempt_id: string;
  question_number: number;
  question_text_en: string;
  question_text_ur: string;
  answer_text: string;
  score: number; // 0 - 100
  is_passed: boolean; // score >= 40
  explanation: string;
  feedback: string;
  evaluated_at: string;
}

export interface InterviewAttempt {
  id: string;
  member_id: string;
  status: 'submitted' | 'completed';
  total_score: number; // average percentage
  passed_questions: number; // count out of 10
  is_passed: boolean; // passed_questions >= 7
  submission_time: string;
  evaluation_status: 'pending' | 'completed' | 'failed';
  notification_status: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}

interface DatabaseSchema {
  member_roster: MemberRoster[];
  interview_questions: InterviewQuestion[];
  interview_attempts: InterviewAttempt[];
  interview_answers: InterviewAnswer[];
  audit_logs: AuditLog[];
}

export const INITIAL_QUESTIONS: Omit<InterviewQuestion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    question_number: 1,
    text_urdu: 'آج کی پریزنٹیشن میں آپ نے سب سے اہم کیا سیکھا؟',
    text_english: 'What was the most important thing you learned in today\'s presentation?',
    default_rubric: 'Evaluates understanding of key themes from the LFG business presentation (e.g. digital business opportunity, global networking, personal growth, e-commerce systems). Partial credit for genuine takeaways or learning mindset. Irrelevant answers fail.',
    admin_approved_rubric: 'Evaluates understanding of key themes from the LFG business presentation (e.g. digital business opportunity, global networking, personal growth, e-commerce systems). Partial credit for genuine takeaways or learning mindset. Irrelevant answers fail.',
    requires_custom_review: true,
    is_approved: true,
  },
  {
    question_number: 2,
    text_urdu: 'آپ کے خیال میں آن لائن بزنس شروع کرنے کے لیے کون سی مہارتیں ضروری ہیں؟',
    text_english: 'In your opinion, what skills are necessary to start an online business?',
    default_rubric: 'Evaluates awareness of practical skills such as communication, digital literacy, customer interaction, consistency, willingness to learn, discipline, or marketing fundamentals.',
    admin_approved_rubric: 'Evaluates awareness of practical skills such as communication, digital literacy, customer interaction, consistency, willingness to learn, discipline, or marketing fundamentals.',
    requires_custom_review: false,
    is_approved: true,
  },
  {
    question_number: 3,
    text_urdu: 'آپ کو Legend Flow Global کے بزنس ماڈل میں کون سی بات سب سے زیادہ سمجھ آئی، اور کون سی بات مزید سمجھنا چاہتے ہیں؟',
    text_english: 'What part of Legend Flow Global\'s business model did you understand best, and what would you like to understand better?',
    default_rubric: 'Assesses clarity on LFG model components (team building, mentoring, product/services distribution) and honest identification of areas for deeper training. Demonstrates sincerity and curiosity.',
    admin_approved_rubric: 'Assesses clarity on LFG model components (team building, mentoring, product/services distribution) and honest identification of areas for deeper training. Demonstrates sincerity and curiosity.',
    requires_custom_review: true,
    is_approved: true,
  },
  {
    question_number: 4,
    text_urdu: 'اگر آپ کو کوئی شخص پہلی مرتبہ انکار کر دے تو آپ کیا کریں گے؟',
    text_english: 'If someone says no to you for the first time, what would you do?',
    default_rubric: 'Assesses emotional resilience, professionalism, patience, respecting the prospect\'s decision, analyzing what to improve, and maintaining relationships without getting discouraged or aggressive.',
    admin_approved_rubric: 'Assesses emotional resilience, professionalism, patience, respecting the prospect\'s decision, analyzing what to improve, and maintaining relationships without getting discouraged or aggressive.',
    requires_custom_review: false,
    is_approved: true,
  },
  {
    question_number: 5,
    text_urdu: 'اگر آپ کو کسی کام میں فوری کامیابی نہ ملے تو کیا آپ سیکھنا جاری رکھیں گے؟ کیوں؟',
    text_english: 'If you do not achieve immediate success at a task, will you continue learning? Why?',
    default_rubric: 'Evaluates long-term growth mindset, understanding that business success requires patience, perseverance, adapting techniques, and consistent effort rather than get-rich-quick expectations.',
    admin_approved_rubric: 'Evaluates long-term growth mindset, understanding that business success requires patience, perseverance, adapting techniques, and consistent effort rather than get-rich-quick expectations.',
    requires_custom_review: false,
    is_approved: true,
  },
  {
    question_number: 6,
    text_urdu: 'آپ اس موقع سے کیا حاصل کرنا چاہتے ہیں — نئی مہارتیں، تجربہ، ٹیم ورک یا کاروباری آمدنی؟',
    text_english: 'What do you want to gain from this opportunity—new skills, experience, teamwork, or business income?',
    default_rubric: 'Evaluates candidate motivation, career/personal goals, clarity of purpose, alignment with team values, and realistic aspirations for skill mastery and income generation.',
    admin_approved_rubric: 'Evaluates candidate motivation, career/personal goals, clarity of purpose, alignment with team values, and realistic aspirations for skill mastery and income generation.',
    requires_custom_review: false,
    is_approved: true,
  },
  {
    question_number: 7,
    text_urdu: 'اگر آپ کو کوئی کام سمجھ نہ آئے تو آپ مدد کیسے حاصل کریں گے؟',
    text_english: 'If you do not understand a task, how would you get help?',
    default_rubric: 'Evaluates coachability, proactive inquiry, consulting seniors/mentors, reviewing training modules, collaborating with teammates, and willingness to ask guidance politely.',
    admin_approved_rubric: 'Evaluates coachability, proactive inquiry, consulting seniors/mentors, reviewing training modules, collaborating with teammates, and willingness to ask guidance politely.',
    requires_custom_review: false,
    is_approved: true,
  },
  {
    question_number: 8,
    text_urdu: 'آپ روزانہ سیکھنے اور کام کرنے کے لیے حقیقتاً کتنا وقت دے سکتے ہیں؟',
    text_english: 'How much time can you realistically dedicate to learning and working each day?',
    default_rubric: 'Evaluates honesty, time management, and commitment level (e.g. 2+ hours daily, part-time or full-time focus) with practical schedule awareness.',
    admin_approved_rubric: 'Evaluates honesty, time management, and commitment level (e.g. 2+ hours daily, part-time or full-time focus) with practical schedule awareness.',
    requires_custom_review: false,
    is_approved: true,
  },
  {
    question_number: 9,
    text_urdu: 'فرض کریں آپ کو کسی نئے شخص کو آن لائن کورس یا بزنس پریزنٹیشن کے بارے میں بتانا ہے۔ آپ گفتگو کیسے شروع کریں گے؟',
    text_english: 'Suppose you need to tell a new person about an online course or business presentation. How would you start the conversation?',
    default_rubric: 'Assesses natural communication skills, respectful opening, asking about the person\'s goals or needs, introducing the opportunity professionally without pressure or misleading claims.',
    admin_approved_rubric: 'Assesses natural communication skills, respectful opening, asking about the person\'s goals or needs, introducing the opportunity professionally without pressure or misleading claims.',
    requires_custom_review: false,
    is_approved: true,
  },
  {
    question_number: 10,
    text_urdu: 'ہم آپ کو اپنی ٹیم میں کیوں شامل کریں؟ آپ کی کون سی خوبی ٹیم کے لیے فائدہ مند ہوگی؟',
    text_english: 'Why should we include you in our team? What quality of yours would benefit the team?',
    default_rubric: 'Assesses self-awareness, positive attitude, personal strengths (e.g. integrity, hard work, teamwork, enthusiasm, fast learning), and how those qualities add value to Legend Flow Global.',
    admin_approved_rubric: 'Assesses self-awareness, positive attitude, personal strengths (e.g. integrity, hard work, teamwork, enthusiasm, fast learning), and how those qualities add value to Legend Flow Global.',
    requires_custom_review: false,
    is_approved: true,
  },
];

class Database {
  private data: DatabaseSchema = {
    member_roster: [],
    interview_questions: [],
    interview_attempts: [],
    interview_answers: [],
    audit_logs: [],
  };

  public supabase: SupabaseClient | null = null;

  constructor() {
    this.initSupabase();
    this.initLocalFallback();
    this.syncFromSupabase();
  }

  private initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
        });
        console.log(`[LFG DB] Connected directly to Supabase PostgreSQL at: ${supabaseUrl}`);
      } catch (err) {
        console.error('[LFG DB] Failed to initialize Supabase client:', err);
      }
    }
  }

  private initLocalFallback() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (err) {
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }
  }

  private seedDefaults() {
    const now = new Date().toISOString();
    this.data = {
      member_roster: [],
      interview_questions: INITIAL_QUESTIONS.map((q, idx) => ({
        ...q,
        id: idx + 1,
        created_at: now,
        updated_at: now,
      })),
      interview_attempts: [],
      interview_answers: [],
      audit_logs: [],
    };
    this.saveLocal();
  }

  private saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving local cache:', err);
    }
  }

  public async syncFromSupabase() {
    if (!this.supabase) return;

    try {
      // 1. Sync Questions
      const { data: qData, error: qErr } = await this.supabase
        .from('interview_questions')
        .select('*')
        .order('id');
      if (!qErr && qData && qData.length > 0) {
        this.data.interview_questions = qData.map(q => ({
          id: q.id,
          question_number: q.question_number || q.id,
          text_urdu: q.text_urdu || '',
          text_english: q.text_english || q.question_text || '',
          default_rubric: q.default_rubric || q.answer_rubric || '',
          admin_approved_rubric: q.admin_approved_rubric || q.answer_rubric || '',
          requires_custom_review: Boolean(q.requires_custom_review),
          is_approved: q.is_active !== false,
        }));
      }

      // 2. Sync Members
      const { data: mData, error: mErr } = await this.supabase
        .from('member_roster')
        .select('*');
      if (!mErr && mData) {
        this.data.member_roster = mData.map(m => ({
          id: m.id,
          email: m.email,
          password_hash: m.password_hash || '',
          full_name: m.full_name,
          role: m.role || 'member',
          sponsor_id: m.sponsor_code || m.sponsor_id || 'Not recorded',
          created_at: m.created_at,
          updated_at: m.updated_at || m.created_at,
        }));
      }

      // 3. Ensure primary admin password in Supabase
      await this.ensurePrimaryAdmin();

      // 4. Sync Attempts
      const { data: attData, error: attErr } = await this.supabase
        .from('interview_attempts')
        .select('*');
      if (!attErr && attData) {
        this.data.interview_attempts = attData.map(a => ({
          id: a.id,
          member_id: a.member_id,
          status: a.status || 'completed',
          total_score: a.total_score !== undefined && a.total_score !== null ? a.total_score : (a.score !== null ? a.score * 10 : 0),
          passed_questions: a.passed_questions !== undefined && a.passed_questions !== null ? a.passed_questions : (a.is_passed ? 8 : 0),
          is_passed: Boolean(a.is_passed || a.result === 'PASS'),
          submission_time: a.submitted_at || a.created_at || new Date().toISOString(),
          evaluation_status: a.evaluation_status || 'completed',
          notification_status: a.notification_status || 'Saved to central database and accessible to authorized LFG Seniors and Admins.',
          created_at: a.submitted_at || new Date().toISOString(),
          updated_at: a.evaluated_at || a.submitted_at || new Date().toISOString(),
        }));
      }

      // 5. Sync Answers
      const { data: ansData, error: ansErr } = await this.supabase
        .from('interview_answers')
        .select('*');
      if (!ansErr && ansData) {
        this.data.interview_answers = ansData.map(a => ({
          id: a.id,
          attempt_id: a.attempt_id,
          question_number: a.question_number || a.question_id || 1,
          question_text_en: a.question_text_en || '',
          question_text_ur: a.question_text_ur || '',
          answer_text: a.answer_text,
          score: a.score !== undefined && a.score !== null ? a.score : (a.is_correct ? 80 : 20),
          is_passed: Boolean(a.is_correct || (a.score && a.score >= 40)),
          explanation: a.explanation || a.evaluation_note || '',
          feedback: a.feedback || 'Keep learning and improving.',
          evaluated_at: a.evaluated_at || new Date().toISOString(),
        }));
      }

      this.saveLocal();
      console.log('[LFG DB] Successfully synced data from Supabase PostgreSQL.');
    } catch (err) {
      console.error('[LFG DB] Sync error with Supabase:', err);
    }
  }

  public async ensurePrimaryAdmin() {
    const defaultAdminEmail = (process.env.ADMIN_EMAIL || 'personalemailmaazqaimkhani@gmail.com').toLowerCase().trim();
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('LFGAdmin@2026', salt);

    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('member_roster')
          .select('*')
          .eq('email', defaultAdminEmail);

        if (data && data.length > 0) {
          const adminRow = data[0];
          // If password_hash is missing or role is not admin, update in Supabase
          if (!adminRow.password_hash || adminRow.role !== 'admin') {
            await this.supabase
              .from('member_roster')
              .update({
                role: 'admin',
                password_hash: adminRow.password_hash || hash,
                updated_at: new Date().toISOString(),
              })
              .eq('id', adminRow.id);
            console.log(`[LFG DB] Updated administrator record in Supabase for: ${defaultAdminEmail}`);
          }
        } else {
          // Insert admin in Supabase
          const adminId = crypto.randomUUID();
          await this.supabase.from('member_roster').insert({
            id: adminId,
            full_name: 'LFG Senior Administrator',
            email: defaultAdminEmail,
            role: 'admin',
            password_hash: hash,
            sponsor_code: 'SYSTEM_HQ',
            is_verified: true,
            created_at: new Date().toISOString(),
          });
          console.log(`[LFG DB] Seeded primary administrator in Supabase for: ${defaultAdminEmail}`);
        }
      } catch (err) {
        console.error('[LFG DB] Error ensuring admin in Supabase:', err);
      }
    }

    // Local fallback check
    const localExisting = this.data.member_roster.find(m => m.email.toLowerCase() === defaultAdminEmail);
    if (!localExisting) {
      this.data.member_roster.push({
        id: crypto.randomUUID(),
        email: defaultAdminEmail,
        password_hash: hash,
        full_name: 'LFG Senior Administrator',
        role: 'admin',
        sponsor_id: 'SYSTEM_HQ',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      this.saveLocal();
    } else if (!localExisting.password_hash || localExisting.role !== 'admin') {
      localExisting.role = 'admin';
      if (!localExisting.password_hash) localExisting.password_hash = hash;
      this.saveLocal();
    }
  }

  // --- Member Operations ---
  public getMembers(): MemberRoster[] {
    return this.data.member_roster;
  }

  public getMemberById(id: string): MemberRoster | undefined {
    return this.data.member_roster.find(m => m.id === id);
  }

  public getMemberByEmail(email: string): MemberRoster | undefined {
    return this.data.member_roster.find(m => m.email.toLowerCase() === email.toLowerCase().trim());
  }

  public async createMember(member: Omit<MemberRoster, 'created_at' | 'updated_at'>): Promise<MemberRoster> {
    const now = new Date().toISOString();
    const newMember: MemberRoster = {
      ...member,
      created_at: now,
      updated_at: now,
    };

    // 1. Insert into Supabase
    if (this.supabase) {
      try {
        const { error } = await this.supabase.from('member_roster').insert({
          id: newMember.id,
          full_name: newMember.full_name,
          email: newMember.email,
          role: newMember.role,
          password_hash: newMember.password_hash,
          sponsor_code: newMember.sponsor_id,
          is_verified: true,
          created_at: now,
        });
        if (error) {
          console.error('[LFG DB] Supabase createMember error:', error);
        } else {
          console.log(`[LFG DB] Successfully persisted member to Supabase: ${newMember.email}`);
        }
      } catch (err) {
        console.error('[LFG DB] Supabase createMember exception:', err);
      }
    }

    // 2. Update local state
    this.data.member_roster.push(newMember);
    this.saveLocal();
    return newMember;
  }

  public async updateMember(id: string, updates: Partial<MemberRoster>): Promise<MemberRoster | null> {
    const member = this.getMemberById(id);
    if (!member) return null;

    const now = new Date().toISOString();
    Object.assign(member, updates, { updated_at: now });

    if (this.supabase) {
      try {
        const payload: Record<string, any> = { updated_at: now };
        if (updates.password_hash) payload.password_hash = updates.password_hash;
        if (updates.role) payload.role = updates.role;
        if (updates.full_name) payload.full_name = updates.full_name;
        if (updates.sponsor_id) payload.sponsor_code = updates.sponsor_id;

        await this.supabase.from('member_roster').update(payload).eq('id', id);
      } catch (err) {
        console.error('[LFG DB] Supabase updateMember error:', err);
      }
    }

    this.saveLocal();
    return member;
  }

  // --- Questions & Rubrics ---
  public getQuestions(): InterviewQuestion[] {
    return this.data.interview_questions;
  }

  public getQuestionByNumber(qNum: number): InterviewQuestion | undefined {
    return this.data.interview_questions.find(q => q.question_number === qNum);
  }

  public async updateRubric(qNum: number, rubric: string, adminApproved: boolean = true): Promise<InterviewQuestion | null> {
    const q = this.getQuestionByNumber(qNum);
    if (!q) return null;
    q.admin_approved_rubric = rubric;
    q.is_approved = adminApproved;

    if (this.supabase) {
      try {
        await this.supabase
          .from('interview_questions')
          .update({
            admin_approved_rubric: rubric,
            default_rubric: rubric,
            answer_rubric: rubric,
          })
          .eq('id', q.id);
      } catch (err) {
        console.error('[LFG DB] Supabase updateRubric error:', err);
      }
    }

    this.saveLocal();
    return q;
  }

  // --- Interview Attempts (Strict One-Attempt Enforcement) ---
  public getAttemptByMemberId(memberId: string): InterviewAttempt | undefined {
    return this.data.interview_attempts.find(a => a.member_id === memberId);
  }

  public getAttemptById(attemptId: string): InterviewAttempt | undefined {
    return this.data.interview_attempts.find(a => a.id === attemptId);
  }

  public getAllAttempts(): InterviewAttempt[] {
    return this.data.interview_attempts;
  }

  public async createAttempt(attempt: Omit<InterviewAttempt, 'created_at' | 'updated_at'>): Promise<InterviewAttempt> {
    const existing = this.getAttemptByMemberId(attempt.member_id);
    if (existing) {
      throw new Error('Interview has already been submitted for this member. Only one attempt is permitted.');
    }

    const now = new Date().toISOString();
    const newAttempt: InterviewAttempt = {
      ...attempt,
      created_at: now,
      updated_at: now,
    };

    if (this.supabase) {
      try {
        const { error } = await this.supabase.from('interview_attempts').insert({
          id: newAttempt.id,
          member_id: newAttempt.member_id,
          status: 'completed',
          score: Math.min(5, Math.round(newAttempt.passed_questions / 2)),
          total_score: newAttempt.total_score,
          passed_questions: newAttempt.passed_questions,
          is_passed: newAttempt.is_passed,
          result: newAttempt.is_passed ? 'PASS' : 'FAIL',
          ai_model: 'gemini-3.8-flash',
          submitted_at: newAttempt.submission_time,
          evaluation_status: newAttempt.evaluation_status,
          notification_status: newAttempt.notification_status,
        });
        if (error) {
          console.error('[LFG DB] Supabase createAttempt error:', error);
        } else {
          console.log(`[LFG DB] Successfully persisted attempt to Supabase: ${newAttempt.id}`);
        }
      } catch (err) {
        console.error('[LFG DB] Supabase createAttempt exception:', err);
      }
    }

    this.data.interview_attempts.push(newAttempt);
    this.saveLocal();
    return newAttempt;
  }

  public async updateAttempt(id: string, updates: Partial<InterviewAttempt>): Promise<InterviewAttempt | null> {
    const attempt = this.getAttemptById(id);
    if (!attempt) return null;

    const now = new Date().toISOString();
    Object.assign(attempt, updates, { updated_at: now });

    if (this.supabase) {
      try {
        const payload: Record<string, any> = {
          status: 'completed',
          evaluated_at: now,
        };
        if (updates.total_score !== undefined) {
          payload.total_score = updates.total_score;
          payload.score = Math.min(5, Math.round((updates.passed_questions || attempt.passed_questions) / 2));
        }
        if (updates.passed_questions !== undefined) payload.passed_questions = updates.passed_questions;
        if (updates.is_passed !== undefined) {
          payload.is_passed = updates.is_passed;
          payload.result = updates.is_passed ? 'PASS' : 'FAIL';
        }
        if (updates.evaluation_status !== undefined) payload.evaluation_status = updates.evaluation_status;

        await this.supabase.from('interview_attempts').update(payload).eq('id', id);
        console.log(`[LFG DB] Updated attempt ${id} in Supabase.`);
      } catch (err) {
        console.error('[LFG DB] Supabase updateAttempt error:', err);
      }
    }

    this.saveLocal();
    return attempt;
  }

  // --- Interview Answers ---
  public getAnswersByAttemptId(attemptId: string): InterviewAnswer[] {
    return this.data.interview_answers.filter(a => a.attempt_id === attemptId);
  }

  public async saveAnswers(answers: InterviewAnswer[]) {
    // 1. Persist to Supabase
    if (this.supabase && answers.length > 0) {
      try {
        const rows = answers.map(a => ({
          id: a.id,
          attempt_id: a.attempt_id,
          question_id: a.question_number,
          question_number: a.question_number,
          answer_text: a.answer_text,
          score: a.score,
          is_correct: a.is_passed,
          evaluation_note: a.explanation,
          explanation: a.explanation,
          feedback: a.feedback,
          evaluated_at: a.evaluated_at,
        }));

        const { error } = await this.supabase
          .from('interview_answers')
          .insert(rows);

        if (error) {
          console.error('[LFG DB] Supabase saveAnswers error:', error);
        } else {
          console.log(`[LFG DB] Successfully persisted ${rows.length} answers to Supabase for attempt: ${answers[0].attempt_id}`);
        }
      } catch (err) {
        console.error('[LFG DB] Supabase saveAnswers exception:', err);
      }
    }

    // 2. Persist locally
    const incomingIds = new Set(answers.map(a => a.id));
    this.data.interview_answers = this.data.interview_answers.filter(a => !incomingIds.has(a.id));
    this.data.interview_answers.push(...answers);
    this.saveLocal();
  }

  public async updateAnswerScore(
    answerId: string,
    newScore: number,
    adminNote: string
  ): Promise<InterviewAnswer | null> {
    const answer = this.data.interview_answers.find(a => a.id === answerId);
    if (!answer) return null;

    answer.score = Math.min(100, Math.max(0, newScore));
    answer.is_passed = answer.score >= 40;
    answer.explanation = `${answer.explanation} [Admin Override: ${adminNote}]`;
    answer.evaluated_at = new Date().toISOString();

    if (this.supabase) {
      try {
        await this.supabase
          .from('interview_answers')
          .update({
            score: answer.score,
            is_correct: answer.is_passed,
            evaluation_note: answer.explanation,
            explanation: answer.explanation,
            evaluated_at: answer.evaluated_at,
          })
          .eq('id', answerId);
      } catch (err) {
        console.error('[LFG DB] Supabase updateAnswerScore error:', err);
      }
    }

    // Recalculate attempt score & pass status
    const allAnswers = this.getAnswersByAttemptId(answer.attempt_id);
    const passedCount = allAnswers.filter(a => a.is_passed).length;
    const avgScore = Math.round(
      allAnswers.reduce((sum, a) => sum + a.score, 0) / (allAnswers.length || 1)
    );

    await this.updateAttempt(answer.attempt_id, {
      passed_questions: passedCount,
      total_score: avgScore,
      is_passed: passedCount >= 7,
    });

    this.saveLocal();
    return answer;
  }

  // --- Audit Logs ---
  public async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      try {
        await this.supabase.from('audit_logs').insert({
          id: newLog.id,
          admin_id: newLog.admin_id,
          admin_email: newLog.admin_email,
          action: newLog.action,
          target_type: newLog.target_type,
          target_id: newLog.target_id,
          details: newLog.details,
          created_at: newLog.created_at,
        });
      } catch (err) {
        console.error('[LFG DB] Supabase addAuditLog error:', err);
      }
    }

    this.data.audit_logs.unshift(newLog);
    this.saveLocal();
    return newLog;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.audit_logs;
  }
}

export const db = new Database();
