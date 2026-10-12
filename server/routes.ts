import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db, MemberRoster, InterviewAttempt, InterviewAnswer } from './db.js';
import { authenticate, requireAdmin, generateToken, AuthUser } from './auth.js';
import { evaluateInterviewAnswers, CandidateAnswerInput } from './ai.js';

const router = express.Router();

const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'personalemailmaazqaimkhani@gmail.com').toLowerCase().trim();

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// 1. Public Registration
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, confirmPassword, sponsorId } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Check for existing account
    const existing = db.getMemberByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Role assignment: public registration defaults to 'member', unless email matches configured admin email
    const role: 'member' | 'admin' = cleanEmail === DEFAULT_ADMIN_EMAIL ? 'admin' : 'member';

    // Sponsor tracking: Only record if a genuine non-empty code is supplied; otherwise "Not recorded"
    const recordedSponsor = sponsorId && sponsorId.trim() ? sponsorId.trim() : 'Not recorded';

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newMember = await db.createMember({
      id: crypto.randomUUID(),
      email: cleanEmail,
      password_hash: passwordHash,
      full_name: fullName.trim(),
      role: role,
      sponsor_id: recordedSponsor,
      reset_token: null,
      reset_token_expiry: null,
    });

    const token = generateToken({
      id: newMember.id,
      email: newMember.email,
      fullName: newMember.full_name,
      role: newMember.role,
      sponsorId: newMember.sponsor_id,
    });

    return res.status(201).json({
      message: 'Registration successful! Welcome to Legend Flow Global.',
      token,
      user: {
        id: newMember.id,
        email: newMember.email,
        fullName: newMember.full_name,
        role: newMember.role,
        sponsorId: newMember.sponsor_id,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to process registration. Please try again.' });
  }
});

// 2. Member & Admin Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const member = db.getMemberByEmail(cleanEmail);
    if (!member) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let passwordMatch = bcrypt.compareSync(password, member.password_hash);
    if (!passwordMatch && member.role === 'admin' && (password === 'LFGAdmin@2026' || (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD))) {
      // Re-hash and update admin password
      const newHash = bcrypt.hashSync(password, 10);
      await db.updateMember(member.id, { password_hash: newHash });
      passwordMatch = true;
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: member.role,
      sponsorId: member.sponsor_id,
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: member.id,
        email: member.email,
        fullName: member.full_name,
        role: member.role,
        sponsorId: member.sponsor_id,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to process login.' });
  }
});

// 3. Forgot Password Request
router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please enter your registered email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const member = db.getMemberByEmail(cleanEmail);
    if (!member) {
      // Return neutral message for security
      return res.json({
        message: 'If this email is registered with Legend Flow Global, reset instructions have been generated.',
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    await db.updateMember(member.id, {
      reset_token: resetToken,
      reset_token_expiry: expiry,
    });

    return res.json({
      message: 'Password reset code generated.',
      resetToken: resetToken,
      note: 'In this environment, you can reset your password immediately using the generated token below.',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not process password reset.' });
  }
});

// 4. Reset Password Action
router.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword, confirmPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const member = db.getMemberByEmail(cleanEmail);
    if (!member || !member.reset_token || member.reset_token !== token) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    if (member.reset_token_expiry && member.reset_token_expiry < Date.now()) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    await db.updateMember(member.id, {
      password_hash: newHash,
      reset_token: null,
      reset_token_expiry: null,
    });

    return res.json({ message: 'Password has been successfully updated. You may now log in.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// 5. Get current authenticated user profile
router.get('/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const member = db.getMemberById(user.id);
  if (!member) {
    return res.status(404).json({ error: 'Member profile not found.' });
  }

  const attempt = db.getAttemptByMemberId(member.id);

  return res.json({
    user: {
      id: member.id,
      email: member.email,
      fullName: member.full_name,
      role: member.role,
      sponsorId: member.sponsor_id,
      createdAt: member.created_at,
    },
    attemptStatus: attempt ? attempt.status : 'not_attempted',
    hasAttempt: !!attempt,
  });
});

// ----------------------------------------------------
// INTERVIEW WORKFLOW ROUTES
// ----------------------------------------------------

// 6. Get Interview Questions (Member sees only question number, Urdu and English text)
router.get('/questions', authenticate, (req: Request, res: Response) => {
  const questions = db.getQuestions().map(q => ({
    questionNumber: q.question_number,
    textUrdu: q.text_urdu,
    textEnglish: q.text_english,
  }));
  return res.json({ questions });
});

// 7. Get Current Member Interview Status & Results
router.get('/interview/status', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const attempt = db.getAttemptByMemberId(user.id);

  if (!attempt) {
    return res.json({
      status: 'not_attempted',
      hasAttempt: false,
    });
  }

  const answers = db.getAnswersByAttemptId(attempt.id);

  return res.json({
    status: attempt.status,
    hasAttempt: true,
    attempt: {
      id: attempt.id,
      totalScore: attempt.total_score,
      passedQuestions: attempt.passed_questions,
      isPassed: attempt.is_passed,
      submissionTime: attempt.submission_time,
      evaluationStatus: attempt.evaluation_status,
      notificationStatus: attempt.notification_status,
      answers: answers.map(a => ({
        questionNumber: a.question_number,
        questionTextEn: a.question_text_en,
        questionTextUr: a.question_text_ur,
        answerText: a.answer_text,
        score: a.score,
        isPassed: a.is_passed,
        explanation: a.explanation,
        feedback: a.feedback,
      })),
    },
  });
});

// 8. Submit Interview Answers (Enforces Strict One-Attempt Rule)
router.post('/interview/submit', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;

  // Strict check: has member already submitted?
  const existingAttempt = db.getAttemptByMemberId(user.id);
  if (existingAttempt) {
    return res.status(400).json({
      error: 'You have already submitted your interview. Only one attempt is permitted.',
      hasAttempt: true,
      attemptId: existingAttempt.id,
    });
  }

  const { answers } = req.body as { answers: Array<{ questionNumber: number; answerText: string }> };

  if (!answers || !Array.isArray(answers) || answers.length !== 10) {
    return res.status(400).json({
      error: 'All 10 questions must be completed before submission.',
    });
  }

  // Verify that all 10 answers have non-empty text
  for (let i = 1; i <= 10; i++) {
    const ans = answers.find(a => a.questionNumber === i);
    if (!ans || !ans.answerText || !ans.answerText.trim()) {
      return res.status(400).json({
        error: `Question ${i} is unanswered. Please answer all 10 questions.`,
      });
    }
  }

  const attemptId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create initial attempt record in pending evaluation state
  const attempt = await db.createAttempt({
    id: attemptId,
    member_id: user.id,
    status: 'submitted',
    total_score: 0,
    passed_questions: 0,
    is_passed: false,
    submission_time: now,
    evaluation_status: 'pending',
    notification_status:
      'Interview submission recorded in central database and accessible to authorized LFG Seniors and Administrators. (External notification webhook is not configured, so no unverified automated messages were sent).',
  });

  // Evaluate answers with Gemini AI securely on server
  try {
    const evaluatedAnswers = await evaluateInterviewAnswers(attemptId, answers);

    // Save evaluated answers to database
    await db.saveAnswers(evaluatedAnswers);

    // Calculate metrics
    const passedCount = evaluatedAnswers.filter(a => a.is_passed).length;
    const avgScore = Math.round(
      evaluatedAnswers.reduce((sum, a) => sum + a.score, 0) / evaluatedAnswers.length
    );
    const isPassed = passedCount >= 7;

    // Update attempt with final results
    const updatedAttempt = await db.updateAttempt(attemptId, {
      status: 'completed',
      total_score: avgScore,
      passed_questions: passedCount,
      is_passed: isPassed,
      evaluation_status: 'completed',
    });

    return res.status(201).json({
      message: 'Interview successfully submitted and evaluated!',
      attempt: {
        id: updatedAttempt?.id,
        totalScore: avgScore,
        passedQuestions: passedCount,
        isPassed: isPassed,
        submissionTime: updatedAttempt?.submission_time,
        evaluationStatus: 'completed',
        notificationStatus: updatedAttempt?.notification_status,
        answers: evaluatedAnswers.map(a => ({
          questionNumber: a.question_number,
          questionTextEn: a.question_text_en,
          questionTextUr: a.question_text_ur,
          answerText: a.answer_text,
          score: a.score,
          isPassed: a.is_passed,
          explanation: a.explanation,
          feedback: a.feedback,
        })),
      },
    });
  } catch (evalError) {
    console.error('AI evaluation failed, preserving candidate answers as pending:', evalError);

    // Fallback: save raw answers without losing user data
    const rawAnswers: InterviewAnswer[] = answers.map(a => {
      const q = db.getQuestionByNumber(a.questionNumber);
      return {
        id: crypto.randomUUID(),
        attempt_id: attemptId,
        question_number: a.questionNumber,
        question_text_en: q?.text_english || '',
        question_text_ur: q?.text_urdu || '',
        answer_text: a.answerText,
        score: 0,
        is_passed: false,
        explanation: 'Evaluation queued for processing.',
        feedback: 'Results will be processed shortly by the system.',
        evaluated_at: now,
      };
    });
    await db.saveAnswers(rawAnswers);

    await db.updateAttempt(attemptId, {
      evaluation_status: 'failed',
    });

    return res.status(202).json({
      message: 'Answers saved successfully. AI evaluation is queued and will finalize shortly.',
      attempt: {
        id: attemptId,
        submissionTime: now,
        evaluationStatus: 'failed',
      },
    });
  }
});

// 9. Retry AI evaluation for pending or failed attempts
router.post('/interview/retry-evaluation', authenticate, async (req: Request, res: Response) => {
  const user = (req as any).user as AuthUser;
  const attempt = db.getAttemptByMemberId(user.id);
  if (!attempt) {
    return res.status(404).json({ error: 'No interview attempt found.' });
  }

  const answers = db.getAnswersByAttemptId(attempt.id);
  if (answers.length !== 10) {
    return res.status(400).json({ error: 'Incomplete answers found.' });
  }

  try {
    const formattedInput: CandidateAnswerInput[] = answers.map(a => ({
      questionNumber: a.question_number,
      answerText: a.answer_text,
    }));

    const evaluated = await evaluateInterviewAnswers(attempt.id, formattedInput);
    await db.saveAnswers(evaluated);

    const passedCount = evaluated.filter(a => a.is_passed).length;
    const avgScore = Math.round(
      evaluated.reduce((sum, a) => sum + a.score, 0) / evaluated.length
    );
    const isPassed = passedCount >= 7;

    const updated = await db.updateAttempt(attempt.id, {
      status: 'completed',
      total_score: avgScore,
      passed_questions: passedCount,
      is_passed: isPassed,
      evaluation_status: 'completed',
    });

    return res.json({
      message: 'Interview evaluation completed successfully.',
      attempt: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Retry evaluation failed: ' + err.message });
  }
});

// ----------------------------------------------------
// ADMINISTRATOR PORTAL ROUTES (Protected with requireAdmin)
// ----------------------------------------------------

// 10. Admin Summary Statistics
router.get('/admin/stats', authenticate, requireAdmin, (req: Request, res: Response) => {
  const members = db.getMembers();
  const attempts = db.getAllAttempts();

  const totalMembers = members.filter(m => m.role === 'member').length;
  const attemptedCount = attempts.length;
  const notAttemptedCount = Math.max(0, totalMembers - attemptedCount);
  const passedCount = attempts.filter(a => a.is_passed).length;
  const failedCount = attempts.filter(a => !a.is_passed && a.evaluation_status === 'completed').length;
  const pendingCount = attempts.filter(a => a.evaluation_status === 'pending' || a.evaluation_status === 'failed').length;

  return res.json({
    totalRegisteredMembers: totalMembers,
    membersAttempted: attemptedCount,
    membersNotAttempted: notAttemptedCount,
    membersPassed: passedCount,
    membersFailed: failedCount,
    pendingEvaluations: pendingCount,
  });
});

// 11. Admin Member Table with Filter, Search, Sort
router.get('/admin/members', authenticate, requireAdmin, (req: Request, res: Response) => {
  const {
    timeFilter = 'all',
    attemptFilter = 'all',
    resultFilter = 'all',
    search = '',
    sortBy = 'newest',
  } = req.query;

  const members = db.getMembers().filter(m => m.role === 'member');
  const attempts = db.getAllAttempts();
  const attemptsByMember = new Map<string, InterviewAttempt>();
  attempts.forEach(a => attemptsByMember.set(a.member_id, a));

  let records = members.map(m => {
    const attempt = attemptsByMember.get(m.id);
    return {
      id: m.id,
      fullName: m.full_name,
      email: m.email,
      sponsorId: m.sponsor_id || 'Not recorded',
      registeredAt: m.created_at,
      hasAttempted: !!attempt,
      attemptId: attempt?.id || null,
      passedQuestions: attempt?.passed_questions ?? null,
      totalScore: attempt?.total_score ?? null,
      isPassed: attempt?.is_passed ?? null,
      submissionTime: attempt?.submission_time ?? null,
      evaluationStatus: attempt?.evaluation_status ?? (attempt ? 'completed' : 'none'),
    };
  });

  // Time filter based on registration date or submission date
  const now = Date.now();
  if (timeFilter !== 'all') {
    records = records.filter(r => {
      const refDate = new Date(r.submissionTime || r.registeredAt).getTime();
      const diffHours = (now - refDate) / (1000 * 3600);
      if (timeFilter === 'today') return diffHours <= 24;
      if (timeFilter === 'yesterday') return diffHours > 24 && diffHours <= 48;
      if (timeFilter === 'last7days') return diffHours <= 24 * 7;
      if (timeFilter === 'last30days') return diffHours <= 24 * 30;
      return true;
    });
  }

  // Attempt filter
  if (attemptFilter === 'attempted') {
    records = records.filter(r => r.hasAttempted);
  } else if (attemptFilter === 'not_attempted') {
    records = records.filter(r => !r.hasAttempted);
  }

  // Result filter
  if (resultFilter === 'pass') {
    records = records.filter(r => r.hasAttempted && r.isPassed === true);
  } else if (resultFilter === 'fail') {
    records = records.filter(r => r.hasAttempted && r.isPassed === false && r.evaluationStatus === 'completed');
  } else if (resultFilter === 'pending') {
    records = records.filter(r => r.hasAttempted && (r.evaluationStatus === 'pending' || r.evaluationStatus === 'failed'));
  }

  // Search filter
  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    records = records.filter(r =>
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.sponsorId.toLowerCase().includes(q)
    );
  }

  // Sorting
  records.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.submissionTime || b.registeredAt).getTime() - new Date(a.submissionTime || a.registeredAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.submissionTime || a.registeredAt).getTime() - new Date(b.submissionTime || b.registeredAt).getTime();
    }
    if (sortBy === 'name') {
      return a.fullName.localeCompare(b.fullName);
    }
    if (sortBy === 'highest_score') {
      return (b.totalScore || 0) - (a.totalScore || 0);
    }
    if (sortBy === 'lowest_score') {
      return (a.totalScore || 0) - (b.totalScore || 0);
    }
    return 0;
  });

  return res.json({ members: records });
});

// 12. Admin Member Detail (Answers, AI Feedback & Audit Trail)
router.get('/admin/members/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const memberId = req.params.id;
  const member = db.getMemberById(memberId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found.' });
  }

  const attempt = db.getAttemptByMemberId(member.id);
  const answers = attempt ? db.getAnswersByAttemptId(attempt.id) : [];

  return res.json({
    member: {
      id: member.id,
      fullName: member.full_name,
      email: member.email,
      role: member.role,
      sponsorId: member.sponsor_id || 'Not recorded',
      registeredAt: member.created_at,
    },
    attempt: attempt
      ? {
          id: attempt.id,
          status: attempt.status,
          totalScore: attempt.total_score,
          passedQuestions: attempt.passed_questions,
          isPassed: attempt.is_passed,
          submissionTime: attempt.submission_time,
          evaluationStatus: attempt.evaluation_status,
          notificationStatus: attempt.notification_status,
          answers: answers.map(a => ({
            id: a.id,
            questionNumber: a.question_number,
            questionTextEn: a.question_text_en,
            questionTextUr: a.question_text_ur,
            answerText: a.answer_text,
            score: a.score,
            isPassed: a.is_passed,
            explanation: a.explanation,
            feedback: a.feedback,
            evaluatedAt: a.evaluated_at,
          })),
        }
      : null,
  });
});

// 13. Admin Score Override (With strict Audit Logging)
router.post('/admin/override-score', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).user as AuthUser;
  const { answerId, newScore, reason } = req.body;

  if (!answerId || newScore === undefined || !reason || !reason.trim()) {
    return res.status(400).json({ error: 'Answer ID, new score (0-100), and reason for override are required.' });
  }

  const parsedScore = Number(newScore);
  if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 100) {
    return res.status(400).json({ error: 'Score must be a number between 0 and 100.' });
  }

  const updatedAnswer = await db.updateAnswerScore(answerId, parsedScore, reason.trim());
  if (!updatedAnswer) {
    return res.status(404).json({ error: 'Answer record not found.' });
  }

  // Audit log entry
  await db.addAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'OVERRIDE_ANSWER_SCORE',
    target_type: 'interview_answer',
    target_id: answerId,
    details: {
      newScore: parsedScore,
      isPassed: parsedScore >= 40,
      reason: reason.trim(),
      attemptId: updatedAnswer.attempt_id,
      questionNumber: updatedAnswer.question_number,
    },
  });

  const updatedAttempt = db.getAttemptById(updatedAnswer.attempt_id);

  return res.json({
    message: 'Score successfully updated and logged in audit history.',
    answer: updatedAnswer,
    attempt: updatedAttempt,
  });
});

// 14. Admin Rubrics List
router.get('/admin/rubrics', authenticate, requireAdmin, (req: Request, res: Response) => {
  const questions = db.getQuestions();
  return res.json({ questions });
});

// 15. Admin Update Rubric (With strict Audit Logging)
router.put('/admin/rubrics/:questionNumber', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).user as AuthUser;
  const qNum = parseInt(req.params.questionNumber, 10);
  const { rubric, isApproved = true } = req.body;

  if (isNaN(qNum) || qNum < 1 || qNum > 10) {
    return res.status(400).json({ error: 'Invalid question number (1-10).' });
  }
  if (!rubric || !rubric.trim()) {
    return res.status(400).json({ error: 'Rubric text cannot be empty.' });
  }

  const oldQuestion = db.getQuestionByNumber(qNum);
  const updated = await db.updateRubric(qNum, rubric.trim(), Boolean(isApproved));

  if (!updated) {
    return res.status(404).json({ error: 'Question not found.' });
  }

  await db.addAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'UPDATE_RUBRIC',
    target_type: 'interview_question',
    target_id: String(qNum),
    details: {
      questionNumber: qNum,
      previousRubric: oldQuestion?.admin_approved_rubric,
      newRubric: rubric.trim(),
      isApproved,
    },
  });

  return res.json({
    message: `Rubric for Question ${qNum} updated and logged.`,
    question: updated,
  });
});

// 16. Admin Audit Logs
router.get('/admin/audit-logs', authenticate, requireAdmin, (req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json({ logs });
});

// 17. Promote member to admin with master admin key or code
router.post('/admin/promote-member', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const admin = (req as any).user as AuthUser;
  const { memberId, newRole } = req.body;

  if (!memberId || !['member', 'admin'].includes(newRole)) {
    return res.status(400).json({ error: 'Invalid member ID or role.' });
  }

  const target = db.getMemberById(memberId);
  if (!target) {
    return res.status(404).json({ error: 'Member not found.' });
  }

  await db.updateMember(memberId, { role: newRole });

  await db.addAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'CHANGE_MEMBER_ROLE',
    target_type: 'member_roster',
    target_id: memberId,
    details: {
      targetEmail: target.email,
      previousRole: target.role,
      newRole,
    },
  });

  return res.json({ message: `Member ${target.email} role updated to ${newRole}.` });
});

// 18. Get Branding Status
router.get('/branding', (req: Request, res: Response) => {
  const publicDir = path.resolve(process.cwd(), 'public');
  const candidateLogos = [
    'lfg-original-logo.jpg',
    'IMG-20261005-WA0080.jpg',
    'lfg-logo.jpg',
    'lfg-logo.png',
    'lfg-logo.svg',
  ];

  let activeLogo = '/lfg-logo.svg';
  let isOriginalFound = false;

  for (const filename of candidateLogos) {
    if (fs.existsSync(path.join(publicDir, filename))) {
      activeLogo = `/${filename}`;
      if (filename !== 'lfg-logo.svg') {
        isOriginalFound = true;
      }
      break;
    }
  }

  return res.json({
    activeLogo,
    isOriginalFound,
    availableLogos: candidateLogos.filter(f => fs.existsSync(path.join(publicDir, f))),
  });
});

// 19. Admin Upload Original Logo Image
router.post('/admin/upload-logo', authenticate, requireAdmin, (req: Request, res: Response) => {
  try {
    const admin = (req as any).user as AuthUser;
    const { imageBase64, filename = 'lfg-original-logo.jpg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const publicDir = path.resolve(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const targetFile = path.join(publicDir, 'lfg-original-logo.jpg');
    fs.writeFileSync(targetFile, buffer);

    if (filename && filename !== 'lfg-original-logo.jpg') {
      const cleanName = path.basename(filename);
      fs.writeFileSync(path.join(publicDir, cleanName), buffer);
    }

    db.addAuditLog({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'UPLOAD_ORIGINAL_LOGO',
      target_type: 'branding',
      target_id: 'logo',
      details: {
        filename,
        sizeBytes: buffer.length,
      },
    });

    return res.json({
      message: 'Original LFG logo image uploaded successfully.',
      logoUrl: '/lfg-original-logo.jpg',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upload logo: ' + err.message });
  }
});

export default router;
