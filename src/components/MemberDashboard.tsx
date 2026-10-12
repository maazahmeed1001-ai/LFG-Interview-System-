import React from 'react';
import { User, InterviewAttempt } from '../types';
import { 
  FileCheck, 
  Clock, 
  Award, 
  HelpCircle, 
  Languages, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  Users
} from 'lucide-react';

interface MemberDashboardProps {
  user: User;
  attempt: InterviewAttempt | null;
  loadingAttempt: boolean;
  onStartInterview: () => void;
  onRetryEvaluation?: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  user,
  attempt,
  loadingAttempt,
  onStartInterview,
  onRetryEvaluation,
}) => {
  const hasAttempted = !!attempt && attempt.evaluationStatus !== 'pending';
  const isPending = !!attempt && (attempt.evaluationStatus === 'pending' || attempt.evaluationStatus === 'failed');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0b2545] via-[#10335e] to-[#1d4ed8] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Candidate Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user.fullName}!
            </h1>
            <p className="text-sm text-blue-100/90 max-w-xl">
              Welcome to the Legend Flow Global Online Interview Assessment. This evaluation determines your fit for our team, leadership opportunities, and business programs.
            </p>
          </div>

          {/* Member Metadata Pills */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2 text-xs flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-200">Email:</span>
              <span className="font-semibold">{user.email}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-200">Sponsor / Senior:</span>
              <span className="font-semibold px-2 py-0.5 bg-white/20 rounded-md">
                {user.sponsorId || 'Not recorded'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-200">Attempt Policy:</span>
              <span className="font-bold text-amber-300">1 Completed Attempt Only</span>
            </div>
          </div>
        </div>

        {/* Background decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Loading State */}
      {loadingAttempt && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
          <div className="inline-block animate-spin text-2xl mb-2">⟳</div>
          <p className="text-sm">Loading your interview records...</p>
        </div>
      )}

      {/* CASE 1: Not Attempted Yet */}
      {!loadingAttempt && !attempt && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-[#0b2545]">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Official Interview is Ready</h2>
                <p className="text-xs text-slate-500">Please read the instructions carefully before starting</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-700 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Important Instructions:</h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Answer honestly and in your own words:</strong> There is no need for rote memorization. Express your genuine mindset, thoughts, and understanding.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                  <span><strong>Urdu & English Question Switch:</strong> You can switch the displayed language for each of the 10 questions at any time.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Language Flexibility:</strong> You may write your answers in <strong>Urdu</strong>, <strong>Roman Urdu</strong>, or <strong>English</strong>.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">4</span>
                  <span><strong>Continuous Format:</strong> All 10 questions appear in one continuous interview. You can move back and forth to review your answers.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">!</span>
                  <span><strong>One-Attempt Rule:</strong> Once you submit, your interview is final and cannot be retaken.</span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={onStartInterview}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-600/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-3 cursor-pointer"
              >
                <span>Start Official Interview (10 Questions)</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Evaluation Criteria Info Card */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 space-y-5">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span>Passing Criteria</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-600">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-900 block mb-1">Per-Question Passing Mark</span>
                <span className="text-emerald-700 font-bold text-sm block">40% or higher = PASS</span>
                <span className="text-slate-500">Each question is evaluated by AI against our official rubric based on genuine understanding.</span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-900 block mb-1">Final Interview Passing Mark</span>
                <span className="text-emerald-700 font-bold text-sm block">7 or more Passed Questions = PASS</span>
                <span className="text-slate-500">Passing 7 out of 10 questions (70%) earns a full PASS on your profile. 6 or fewer results in FAIL.</span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <span className="font-bold text-slate-900 block mb-1">Languages Supported</span>
                <div className="flex gap-1.5 mt-1">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">Urdu (اردو)</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">Roman Urdu</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: Evaluation Pending or Failed */}
      {!loadingAttempt && isPending && (
        <div className="bg-white rounded-3xl p-8 border border-amber-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Answers Are Safely Saved</h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Your 10 interview answers have been securely recorded in the central database. The AI evaluation is currently queued or finalizing against the rubric.
          </p>
          {onRetryEvaluation && (
            <button
              onClick={onRetryEvaluation}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#0b2545] text-white hover:bg-[#133968] transition-all"
            >
              Check / Finalize Evaluation
            </button>
          )}
        </div>
      )}

      {/* CASE 3: Completed Attempt with Verified Result */}
      {!loadingAttempt && hasAttempted && attempt && (
        <div className="space-y-6">
          {/* Result Highlight Card */}
          <div
            className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl ${
              attempt.isPassed
                ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 border-2 border-emerald-500/30'
                : 'bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 border-2 border-rose-500/30'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide">
                  {attempt.isPassed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-300" />
                  )}
                  <span>OFFICIAL INTERVIEW RESULT</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {attempt.isPassed ? 'PASS' : 'FAIL'}
                  </span>
                  <div className="h-10 w-px bg-white/30" />
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold">
                      {attempt.passedQuestions} / 10
                    </span>
                    <span className="block text-xs text-white/80 font-medium">Questions Passed</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-white/90">
                  {attempt.isPassed
                    ? 'Congratulations! You have satisfied Legend Flow Global\'s interview benchmark (7 or more passed questions).'
                    : 'You did not achieve the minimum 7 passed questions required. Your answers and evaluation have been archived for review.'}
                </p>
              </div>

              {/* Score Badges */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2 text-xs flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/80">Average Score:</span>
                  <span className="font-extrabold text-sm">{attempt.totalScore}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/80">Submitted On:</span>
                  <span className="font-medium">
                    {new Date(attempt.submissionTime).toLocaleDateString()} at{' '}
                    {new Date(attempt.submissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/80">Attempt Status:</span>
                  <span className="font-bold text-emerald-300">Locked (One attempt used)</span>
                </div>
              </div>
            </div>

            {/* Notification Status (Honest statement) */}
            <div className="mt-6 pt-4 border-t border-white/20 text-xs text-white/80 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-300" />
              <span>
                <strong>System Dispatch Status:</strong> {attempt.notificationStatus}
              </span>
            </div>
          </div>

          {/* Question-by-Question Review Breakdown */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your Question-Wise Breakdown</h2>
                <p className="text-xs text-slate-500">Detailed AI evaluation against the official rubric for all 10 questions</p>
              </div>
              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                Passing Mark: ≥ 40%
              </div>
            </div>

            <div className="space-y-4">
              {attempt.answers.map((ans) => (
                <div
                  key={ans.questionNumber}
                  className={`p-5 rounded-2xl border transition-all ${
                    ans.isPassed
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : 'bg-rose-50/40 border-rose-200/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                        Question {ans.questionNumber} of 10
                      </span>
                      <p className="text-sm font-bold text-slate-900">{ans.questionTextEn}</p>
                      <p className="text-xs text-slate-600 font-urdu dir-rtl text-right font-medium" dir="rtl">
                        {ans.questionTextUr}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          ans.isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {ans.score}% — {ans.isPassed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Answer */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-3">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
                      Your Submitted Answer:
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                      {ans.answerText}
                    </p>
                  </div>

                  {/* AI Evaluation & Feedback */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white/70 rounded-xl border border-slate-200/70">
                      <span className="font-bold text-slate-700 block mb-1">Evaluation Rationale:</span>
                      <p className="text-slate-600 leading-relaxed">{ans.explanation}</p>
                    </div>
                    <div className="p-3 bg-white/70 rounded-xl border border-slate-200/70">
                      <span className="font-bold text-slate-700 block mb-1">Constructive Feedback:</span>
                      <p className="text-slate-600 leading-relaxed">{ans.feedback}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
