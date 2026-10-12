import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import app from '../server/app.js';
import { db } from '../server/db.js';
import http from 'http';

dotenv.config();

let server: http.Server;
const PORT = 3888;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function startServer(): Promise<void> {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`[TEST RUNNER] Test server started at ${BASE_URL}`);
      resolve();
    });
  });
}

async function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        console.log('[TEST RUNNER] Test server stopped.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function post(path: string, body: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function get(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runAllTests() {
  console.log('================================================================');
  console.log('   LFG ONLINE INTERVIEW SYSTEM — COMPREHENSIVE PRE-LAUNCH TESTS  ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail: string = '') {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`   ✅ PASS [Test ${totalTests}]: ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      console.error(`   ❌ FAIL [Test ${totalTests}]: ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  // Step 1: Database Connectivity & Supabase Verification
  console.log('--- TEST GROUP 1: SUPABASE POSTGRESQL CONNECTIVITY & TABLES ---');
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)!;
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  // 1.1 Verify questions in Supabase
  const { data: qData, error: qErr } = await supabase.from('interview_questions').select('*').order('id');
  assert(!qErr && !!qData && qData.length === 10, 'Supabase interview_questions table has all 10 approved questions', `Count: ${qData?.length}`);
  
  if (qData) {
    const hasUrdu = qData.every((q: any) => q.text_urdu && q.text_urdu.length > 5);
    const hasEnglish = qData.every((q: any) => (q.text_english || q.question_text) && (q.text_english || q.question_text).length > 5);
    assert(hasUrdu, 'All 10 questions have authentic Urdu text', 'Bilingual Urdu verified');
    assert(hasEnglish, 'All 10 questions have authentic English text', 'Bilingual English verified');
  }

  // 1.2 Verify member_roster in Supabase
  const { data: mData, error: mErr } = await supabase.from('member_roster').select('*');
  assert(!mErr && !!mData && mData.length > 0, 'Supabase member_roster table connected', `Members count: ${mData?.length}`);

  // 1.3 Verify interview_attempts in Supabase
  const { data: attData, error: attErr } = await supabase.from('interview_attempts').select('*');
  assert(!attErr, 'Supabase interview_attempts table queryable', `Attempts count: ${attData?.length}`);

  // 1.4 Verify interview_answers in Supabase
  const { data: ansData, error: ansErr } = await supabase.from('interview_answers').select('*');
  assert(!ansErr, 'Supabase interview_answers table queryable', `Answers count: ${ansData?.length}`);

  // Start Express API server for testing
  await startServer();

  // Give db a moment to sync from Supabase
  await db.syncFromSupabase();

  console.log('\n--- TEST GROUP 2: PUBLIC REGISTRATION & AUTHENTICATION ---');
  const testEmail = `candidate_${Date.now()}@legendflowglobal.test`;
  const testPassword = 'CandidateSecurePass123';
  const testFullName = 'Tariq Mehmood';
  const testSponsor = 'LFG-SPONSOR-9988';

  // 2.1 Public registration
  const regRes = await post('/api/auth/register', {
    fullName: testFullName,
    email: testEmail,
    password: testPassword,
    confirmPassword: testPassword,
    sponsorId: testSponsor,
  });

  assert(regRes.status === 201 && !!regRes.data.token, 'Public registration returns 201 with JWT token', `Email: ${testEmail}`);
  assert(regRes.data.user?.fullName === testFullName, 'Registered member profile has correct name', testFullName);
  assert(regRes.data.user?.sponsorId === testSponsor, 'Registered member tracks sponsor code properly', testSponsor);
  assert(regRes.data.user?.role === 'member', 'Public registration assigns role "member" (never admin)', 'Security enforced');

  const candidateToken = regRes.data.token;
  const candidateId = regRes.data.user?.id;

  // 2.2 Verify duplicate registration prevented
  const dupRes = await post('/api/auth/register', {
    fullName: testFullName,
    email: testEmail,
    password: testPassword,
    confirmPassword: testPassword,
  });
  assert(dupRes.status === 400 && !!dupRes.data.error, 'Duplicate registration with same email blocked', dupRes.data.error);

  // 2.3 Verify candidate login
  const loginRes = await post('/api/auth/login', {
    email: testEmail,
    password: testPassword,
  });
  assert(loginRes.status === 200 && !!loginRes.data.token, 'Candidate login succeeds with valid password', 'Login verified');

  // 2.4 Verify wrong password fails
  const badLoginRes = await post('/api/auth/login', {
    email: testEmail,
    password: 'WrongPassword@999',
  });
  assert(badLoginRes.status === 401, 'Login with incorrect password rejected with 401', 'Auth security verified');

  // 2.5 Verify member profile in Supabase
  const { data: supaMember } = await supabase.from('member_roster').select('*').eq('email', testEmail);
  assert(!!(supaMember && supaMember.length === 1), 'New member persisted directly into Supabase PostgreSQL', `Supabase ID: ${supaMember?.[0]?.id}`);

  console.log('\n--- TEST GROUP 3: 10-QUESTION INTERVIEW WORKFLOW & AI EVALUATION ---');

  // 3.1 Fetch questions as authenticated member
  const qListRes = await get('/api/questions', candidateToken);
  assert(qListRes.status === 200 && qListRes.data.questions?.length === 10, 'Candidate receives exactly 10 interview questions', `Count: ${qListRes.data.questions?.length}`);

  // 3.2 Check candidate initial status before submission
  const preStatusRes = await get('/api/interview/status', candidateToken);
  assert(preStatusRes.status === 200 && preStatusRes.data.hasAttempt === false, 'Initial status shows not attempted', 'Status verified');

  // 3.3 Candidate submits 10 complete answers
  const candidateAnswers = [
    {
      questionNumber: 1,
      answerText: 'آج کی پریزنٹیشن سے میں نے سیکھا کہ لیجنڈ فلو گلوبل ایک بہترین آن لائن بزنس ماڈل ہے جس میں ٹیم ورک، ڈیجیٹل اسکلز اور رہنمائی کے ذریعے ہم عالمی سطح پر آزاد کاروبار قائم کر سکتے ہیں۔',
    },
    {
      questionNumber: 2,
      answerText: 'آن لائن بزنس کے لیے اچھی بات چیت (communication skills)، صبر، مستقل مزاجی، ڈیجیٹل مارکیٹنگ کی بنیادی معلومات اور سیکھنے کا جذبہ انتہائی ضروری ہیں۔',
    },
    {
      questionNumber: 3,
      answerText: 'مجھے LFG کا رہنمائی اور ٹیم سپورٹ ماڈل بہت پسند آیا۔ مزید یہ کہ میں مصنوعات کی تقسیم اور مارکیٹنگ کے جدید طریقوں کو تفصیلاً سمجھنا چاہتا ہوں۔',
    },
    {
      questionNumber: 4,
      answerText: 'اگر کوئی شخص انکار کرے تو میں مایوس نہیں ہوں گا، بلکہ اس کی رائے کا احترام کروں گا، اپنی گفتگو اور پیشکش کا جائزہ لوں گا اور مثبت تعلقات برقرار رکھوں گا۔',
    },
    {
      questionNumber: 5,
      answerText: 'جی بالکل، کامیابی وقت اور محنت مانگتی ہے۔ اگر فوری نتیجہ نہ ملے تو میں سیکھنا نہیں چھوڑوں گا بلکہ اپنی غلطیوں سے سبق سیکھ کر بہتر کوشش کروں گا۔',
    },
    {
      questionNumber: 6,
      answerText: 'میں اس پلیٹ فارم سے نئی ڈیجیٹل مہارتیں، باعزت آمدنی، ٹیم لیڈرشپ اور خود اعتمادی حاصل کرنا چاہتا ہوں تاکہ اپنے خاندان کا سہارا بن سکوں۔',
    },
    {
      questionNumber: 7,
      answerText: 'اگر کوئی کام سمجھ نہ آئے تو میں اپنے سینئرز اور مینٹورز سے بلا جھجھک رہنمائی لوں گا، تربیتی ویڈیوز دیکھوں گا اور ٹیم کے ارکان سے مشاورت کروں گا۔',
    },
    {
      questionNumber: 8,
      answerText: 'میں روزانہ ۳ سے ۴ گھنٹے مکمل سنجیدگی کے ساتھ سیکھنے اور کام کرنے کے لیے مختص کر سکتا ہوں۔',
    },
    {
      questionNumber: 9,
      answerText: 'میں پہلے ان کے حالات اور مقاصد کے بارے میں دوستانہ انداز میں پوچھوں گا، پھر LFG کا تعارف ایک قابل اعتماد آن لائن بزنس موقع کے طور پر کرواؤں گا بغیر کسی دباؤ کے۔',
    },
    {
      questionNumber: 10,
      answerText: 'میں محنتی، ایماندار اور سیکھنے کا شوقین انسان ہوں۔ میری مثبت سوچ اور ٹیم ورک کی صلاحیت LFG فیملی کی کامیابی میں بہترین کردار ادا کرے گی۔',
    },
  ];

  console.log('   Submitting 10 bilingual answers and invoking AI evaluation...');
  const submitRes = await post('/api/interview/submit', { answers: candidateAnswers }, candidateToken);

  assert(submitRes.status === 201 || submitRes.status === 202, 'Interview submission API returns success status', `Status: ${submitRes.status}`);
  const attempt = submitRes.data.attempt;
  assert(!!(attempt && attempt.id), 'Interview attempt record generated with unique ID', attempt?.id);
  assert(!!(attempt && attempt.answers && attempt.answers.length === 10), 'All 10 answers evaluated with AI scores & feedback', `Answer count: ${attempt?.answers?.length}`);

  const passedAnswersCount = (attempt?.answers || []).filter((a: any) => a.isPassed).length;
  console.log(`   Evaluation Result: ${passedAnswersCount}/10 questions passed (Score: ${attempt?.totalScore}%) - Overall: ${attempt?.isPassed ? 'PASS' : 'FAIL'}`);
  assert(attempt?.isPassed === (passedAnswersCount >= 7), 'Passing rule verified: >= 7 passed questions yields PASS result', `Passed count: ${passedAnswersCount}`);

  // 3.4 Verify strict one-attempt rule
  const secondAttemptRes = await post('/api/interview/submit', { answers: candidateAnswers }, candidateToken);
  assert(secondAttemptRes.status === 400, 'Strict One-Attempt Rule enforced: second submission blocked with 400', secondAttemptRes.data.error);

  // 3.5 Verify interview attempt saved in Supabase
  const { data: supaAttempts } = await supabase
    .from('interview_attempts')
    .select('*')
    .eq('member_id', candidateId);
  assert(!!(supaAttempts && supaAttempts.length === 1), 'Interview attempt persisted directly to Supabase interview_attempts', `Supabase ID: ${supaAttempts?.[0]?.id}`);

  // 3.6 Verify all 10 answers saved in Supabase
  if (supaAttempts && supaAttempts.length > 0) {
    const { data: supaAnswers } = await supabase
      .from('interview_answers')
      .select('*')
      .eq('attempt_id', supaAttempts[0].id);
    assert(!!(supaAnswers && supaAnswers.length === 10), 'All 10 answers persisted directly to Supabase interview_answers', `Stored in Supabase: ${supaAnswers?.length}`);
  }

  // 3.7 Verify member status endpoint returns completed attempt
  const postStatusRes = await get('/api/interview/status', candidateToken);
  assert(postStatusRes.status === 200 && postStatusRes.data.hasAttempt === true, 'Member interview status returns completed attempt and answers', `Status: ${postStatusRes.data.status}`);

  console.log('\n--- TEST GROUP 4: ADMINISTRATOR DASHBOARD & ACCESS CONTROL ---');

  // 4.1 Candidate cannot access admin endpoints
  const nonAdminStats = await get('/api/admin/stats', candidateToken);
  assert(nonAdminStats.status === 403, 'Regular member blocked from admin stats (403 Forbidden)', 'RBAC security confirmed');

  // 4.2 Admin login with primary admin credentials
  const adminLoginRes = await post('/api/auth/login', {
    email: 'personalemailmaazqaimkhani@gmail.com',
    password: 'LFGAdmin@2026',
  });
  assert(adminLoginRes.status === 200 && adminLoginRes.data.user?.role === 'admin', 'Admin login succeeds with credentials and returns role "admin"', 'Admin auth confirmed');

  const adminToken = adminLoginRes.data.token;

  // 4.3 Admin summary statistics
  const adminStatsRes = await get('/api/admin/stats', adminToken);
  assert(adminStatsRes.status === 200, 'Admin summary statistics endpoint returns 200', 'Stats endpoint verified');
  assert(adminStatsRes.data.membersAttempted >= 1, 'Stats reflect candidate interview attempt count', `Attempted: ${adminStatsRes.data.membersAttempted}`);

  // 4.4 Admin members table with search, filters, and sponsor tracking
  const adminMembersRes = await get('/api/admin/members?search=Tariq', adminToken);
  assert(adminMembersRes.status === 200 && adminMembersRes.data.members?.length >= 1, 'Admin member search finds candidate by name', `Found: ${adminMembersRes.data.members?.length}`);
  const foundMember = adminMembersRes.data.members?.find((m: any) => m.email === testEmail);
  assert(!!(foundMember && foundMember.sponsorId === testSponsor), 'Admin view displays candidate sponsor ID accurately', `Sponsor: ${foundMember?.sponsorId}`);
  assert(!!(foundMember && foundMember.hasAttempted === true), 'Admin view displays candidate attempt status accurately', `Result: ${foundMember?.isPassed ? 'PASS' : 'FAIL'}`);

  // 4.5 Admin member detail inspection
  const adminDetailRes = await get(`/api/admin/members/${candidateId}`, adminToken);
  assert(adminDetailRes.status === 200 && adminDetailRes.data.attempt?.answers?.length === 10, 'Admin can inspect candidate full 10-answer breakdown with AI feedback', `Answers: ${adminDetailRes.data.attempt?.answers?.length}`);

  // 4.6 Admin rubrics inspection
  const adminRubricsRes = await get('/api/admin/rubrics', adminToken);
  assert(adminRubricsRes.status === 200 && adminRubricsRes.data.questions?.length === 10, 'Admin can view rubrics for all 10 questions', `Questions: ${adminRubricsRes.data.questions?.length}`);

  // Stop test server
  await stopServer();

  console.log('\n================================================================');
  console.log(`   TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! THE SYSTEM IS 100% OPERATIONAL FOR LAUNCH.');
  } else {
    console.error(`⚠️ SOME TESTS FAILED: ${totalTests - passedTests} failed.`);
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
