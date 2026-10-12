import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function runDatabaseDiagnostics() {
  console.log('=== LFG ONLINE INTERVIEW SYSTEM — DATABASE DIAGNOSTICS ===\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  console.log('1. Checking Environment Variables:');
  console.log('   SUPABASE_URL:', supabaseUrl ? `Found (${supabaseUrl})` : 'MISSING');
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? 'Found' : 'MISSING');
  console.log('   SUPABASE_ANON_KEY:', anonKey ? 'Found' : 'MISSING');

  if (!supabaseUrl || (!serviceKey && !anonKey)) {
    console.error('ERROR: Supabase credentials are not configured in environment!');
    process.exit(1);
  }

  const client = createClient(supabaseUrl, (serviceKey || anonKey)!, {
    auth: { persistSession: false },
  });

  console.log('\n2. Testing Connectivity to Supabase PostgreSQL...');

  // Test interview_questions
  try {
    const { data: questions, error: qErr } = await client
      .from('interview_questions')
      .select('*')
      .order('id');
    
    if (qErr) {
      console.error('   ❌ interview_questions table query failed:', qErr.message);
    } else {
      console.log(`   ✅ interview_questions table connected! Total questions: ${questions?.length}`);
      questions?.forEach((q: any) => {
        console.log(`      Q#${q.question_number || q.id}: "${(q.text_english || q.question_text || '').substring(0, 50)}..."`);
      });
    }
  } catch (err: any) {
    console.error('   ❌ Exception querying interview_questions:', err.message);
  }

  // Test member_roster
  try {
    const { data: members, count, error: mErr } = await client
      .from('member_roster')
      .select('id, email, full_name, role, sponsor_code, created_at', { count: 'exact' });
    
    if (mErr) {
      console.error('   ❌ member_roster table query failed:', mErr.message);
    } else {
      console.log(`\n   ✅ member_roster table connected! Total members: ${members?.length}`);
      members?.slice(0, 5).forEach((m: any) => {
        console.log(`      Member: ${m.full_name} (${m.email}) - Role: ${m.role}`);
      });
    }
  } catch (err: any) {
    console.error('   ❌ Exception querying member_roster:', err.message);
  }

  // Test interview_attempts
  try {
    const { data: attempts, error: attErr } = await client
      .from('interview_attempts')
      .select('*');
    
    if (attErr) {
      console.error('   ❌ interview_attempts table query failed:', attErr.message);
    } else {
      console.log(`\n   ✅ interview_attempts table connected! Total attempts: ${attempts?.length}`);
      attempts?.slice(0, 5).forEach((a: any) => {
        console.log(`      Attempt ID: ${a.id} - Member: ${a.member_id} - Result: ${a.result || (a.is_passed ? 'PASS' : 'FAIL')} - Score: ${a.total_score || a.score}`);
      });
    }
  } catch (err: any) {
    console.error('   ❌ Exception querying interview_attempts:', err.message);
  }

  // Test interview_answers
  try {
    const { data: answers, error: ansErr } = await client
      .from('interview_answers')
      .select('id, attempt_id, question_number, question_id, score, is_correct, evaluated_at');
    
    if (ansErr) {
      console.error('   ❌ interview_answers table query failed:', ansErr.message);
    } else {
      console.log(`\n   ✅ interview_answers table connected! Total answers stored: ${answers?.length}`);
    }
  } catch (err: any) {
    console.error('   ❌ Exception querying interview_answers:', err.message);
  }

  // Test audit_logs
  try {
    const { data: logs, error: logErr } = await client
      .from('audit_logs')
      .select('*');
    
    if (logErr) {
      console.log(`   ℹ️ audit_logs table query:`, logErr.message);
    } else {
      console.log(`\n   ✅ audit_logs table connected! Total logs: ${logs?.length}`);
    }
  } catch (err: any) {
    console.log('   ℹ️ audit_logs table note:', err.message);
  }

  console.log('\n=== DIAGNOSTICS COMPLETED ===');
}

runDatabaseDiagnostics();
