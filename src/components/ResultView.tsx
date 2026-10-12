import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { InterviewAttempt } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowLeft, 
  Calendar, 
  ShieldAlert, 
  FileText,
  Printer
} from 'lucide-react';

interface ResultViewProps {
  attempt: InterviewAttempt;
  onBackToDashboard: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  attempt,
  onBackToDashboard,
}) => {
  useEffect(() => {
    if (attempt.isPassed) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#3b82f6', '#0b2545', '#f59e0b'],
        });
      } catch (e) {
        console.error('Confetti error:', e);
      }
    }
  }, [attempt.isPassed]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center space-x-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Member Dashboard</span>
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save Summary</span>
        </button>
      </div>

      {/* Main Result Card */}
      <div
        className={`rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden ${
          attempt.isPassed
            ? 'bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 border-2 border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 border-2 border-rose-400/40'
        }`}
      >
        <div className="relative z-10 space-y-5">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              Legend Flow Global Official Result
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/20 pb-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                {attempt.isPassed ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-300" />
                ) : (
                  <XCircle className="w-10 h-10 text-rose-300" />
                )}
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                    {attempt.isPassed ? 'PASS' : 'FAIL'}
                  </h1>
                  <span className="text-xs text-white/80 font-medium">
                    {attempt.isPassed
                      ? 'Congratulations! You have satisfied the LFG evaluation criteria.'
                      : 'Candidate did not meet the 7/10 passed questions benchmark.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
              <div className="text-center px-3 border-r border-white/20">
                <span className="text-3xl font-black">{attempt.passedQuestions} / 10</span>
                <span className="block text-[11px] text-white/80 uppercase font-semibold">Passed Questions</span>
              </div>
              <div className="text-center px-3">
                <span className="text-3xl font-black">{attempt.totalScore}%</span>
                <span className="block text-[11px] text-white/80 uppercase font-semibold">Average Score</span>
              </div>
            </div>
          </div>

          {/* Submission and Notification Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="flex items-center space-x-2 text-white/90">
              <Calendar className="w-4 h-4 text-white/70" />
              <span>
                Submitted on: {new Date(attempt.submissionTime).toLocaleDateString()} at{' '}
                {new Date(attempt.submissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-start space-x-2 text-white/90">
              <ShieldAlert className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <span>
                <strong>System Notification Status:</strong> {attempt.notificationStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Question-Wise Scores & Feedback */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Question-by-Question Evaluation</h2>
            <p className="text-xs text-slate-500">
              Assessed by AI against the Legend Flow Global official rubrics
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg">
            Rule: Score ≥ 40% = PASS
          </span>
        </div>

        <div className="space-y-4">
          {attempt.answers.map((ans) => (
            <div
              key={ans.questionNumber}
              className={`p-5 rounded-2xl border transition-all ${
                ans.isPassed
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : 'bg-rose-50/40 border-rose-200'
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

                <span
                  className={`text-xs font-black px-3 py-1 rounded-full flex-shrink-0 ${
                    ans.isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {ans.score}% • {ans.isPassed ? 'PASS' : 'FAIL'}
                </span>
              </div>

              {/* Submitted Answer */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 mb-3">
                <span className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
                  Your Answer:
                </span>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                  {ans.answerText}
                </p>
              </div>

              {/* Rationale & Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-slate-700 block mb-1">AI Evaluation Rationale:</span>
                  <p className="text-slate-600 leading-relaxed">{ans.explanation}</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-slate-700 block mb-1">Constructive Feedback:</span>
                  <p className="text-slate-600 leading-relaxed">{ans.feedback}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
