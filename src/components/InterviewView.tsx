import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { apiRequest } from '../api';
import { 
  Languages, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ShieldCheck,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface InterviewViewProps {
  questions: Question[];
  onSubmitSuccess: (attemptData: any) => void;
  onCancel: () => void;
}

export const InterviewView: React.FC<InterviewViewProps> = ({
  questions,
  onSubmitSuccess,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  // Per-question language view: 'ur' | 'en' (default: 'ur' or 'en')
  const [languageMode, setLanguageMode] = useState<'ur' | 'en'>('en');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Initialize or load draft answers from sessionStorage to prevent accidental loss
  useEffect(() => {
    const savedDraft = sessionStorage.getItem('lfg_interview_draft');
    if (savedDraft) {
      try {
        setAnswers(JSON.parse(savedDraft));
      } catch (e) {
        console.error('Error parsing draft:', e);
      }
    }
  }, []);

  const handleAnswerChange = (val: string) => {
    const currentQNum = questions[currentIndex]?.questionNumber;
    if (!currentQNum) return;
    const updated = { ...answers, [currentQNum]: val };
    setAnswers(updated);
    sessionStorage.setItem('lfg_interview_draft', JSON.stringify(updated));
  };

  const currentQ = questions[currentIndex];
  const currentAnswer = currentQ ? (answers[currentQ.questionNumber] || '') : '';

  // Calculate completion count
  const answeredCount = questions.filter(
    q => answers[q.questionNumber] && answers[q.questionNumber].trim().length > 0
  ).length;

  const progressPercent = Math.round((answeredCount / 10) * 100);

  const getUnansweredQuestions = (): number[] => {
    const missing: number[] = [];
    questions.forEach(q => {
      if (!answers[q.questionNumber] || !answers[q.questionNumber].trim()) {
        missing.push(q.questionNumber);
      }
    });
    return missing;
  };

  const handleAttemptSubmit = () => {
    setErrorMsg(null);
    const missing = getUnansweredQuestions();
    if (missing.length > 0) {
      setErrorMsg(`All 10 questions are required. Please answer Question(s): ${missing.join(', ')}.`);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMsg(null);

    const payload = questions.map(q => ({
      questionNumber: q.questionNumber,
      answerText: (answers[q.questionNumber] || '').trim(),
    }));

    try {
      const response = await apiRequest('/api/interview/submit', {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      });

      // Clear draft storage
      sessionStorage.removeItem('lfg_interview_draft');
      onSubmitSuccess(response.attempt);
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission failed. Please check your network connection.');
      setSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center text-slate-500">
        <div className="inline-block animate-spin text-2xl mb-3">⟳</div>
        <p>Loading the 10 official interview questions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar: Progress & Status */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0b2545] bg-blue-50 px-2.5 py-1 rounded-md">
              Question {currentIndex + 1} of 10
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({answeredCount} of 10 Completed)
            </span>
          </div>
          <div className="w-48 sm:w-64 bg-slate-100 rounded-full h-2 overflow-hidden mt-1.5">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Urdu / English Language Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setLanguageMode('en')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              languageMode === 'en'
                ? 'bg-white text-[#0b2545] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>English</span>
          </button>
          <button
            onClick={() => setLanguageMode('ur')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
              languageMode === 'ur'
                ? 'bg-[#0b2545] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="font-urdu text-sm">اردو</span>
          </button>
        </div>
      </div>

      {/* 10-Question Navigator Pills */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[500px] gap-2">
          {questions.map((q, idx) => {
            const hasAns = !!answers[q.questionNumber] && answers[q.questionNumber].trim().length > 0;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.questionNumber}
                onClick={() => setCurrentIndex(idx)}
                className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0b2545] text-white ring-2 ring-[#0b2545]/20 shadow-xs scale-105'
                    : hasAns
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>Q{q.questionNumber}</span>
                <span className="text-[10px] font-normal">
                  {hasAns ? '✓' : '—'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error notification if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Question Header & Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600">
              QUESTION {currentIndex + 1} OF 10
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Accepts Urdu, Roman Urdu, or English
            </span>
          </div>

          {/* Question Text in Selected Language */}
          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
            {languageMode === 'ur' ? (
              <p className="text-xl sm:text-2xl font-bold text-[#0b2545] leading-relaxed font-urdu text-right dir-rtl" dir="rtl">
                {currentQ.textUrdu}
              </p>
            ) : (
              <p className="text-lg sm:text-xl font-bold text-[#0b2545] leading-snug">
                {currentQ.textEnglish}
              </p>
            )}

            {/* Subtle secondary translation helper */}
            <div className="mt-3 pt-3 border-t border-blue-200/40 text-xs text-slate-500 flex items-center justify-between">
              <span>Alternative translation available via top toggle</span>
              <button
                onClick={() => setLanguageMode(languageMode === 'ur' ? 'en' : 'ur')}
                className="text-blue-700 font-bold hover:underline"
              >
                {languageMode === 'ur' ? 'View in English' : 'اردو میں دیکھیں'}
              </button>
            </div>
          </div>
        </div>

        {/* Answer Input Textarea */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Your Answer / آپ کا جواب <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={6}
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Write your answer honestly here in Urdu, Roman Urdu, or English... (اپنا جواب یہاں اپنی سمجھ کے مطابق لکھیں)"
            className="w-full p-4 text-sm sm:text-base rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              {currentAnswer.trim().length > 0 ? (
                <span className="text-emerald-600 font-semibold">✓ Answer entered ({currentAnswer.trim().split(/\s+/).length} words)</span>
              ) : (
                <span className="text-amber-600 font-medium">Answer required before final submission</span>
              )}
            </span>
            <span>Autosaved locally</span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            {currentIndex < 9 && (
              <button
                onClick={() => setCurrentIndex(Math.min(9, currentIndex + 1))}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0b2545] text-white hover:bg-[#133968] transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Submit Action */}
          <div className="w-full sm:w-auto">
            <button
              onClick={handleAttemptSubmit}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
                answeredCount === 10
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Submit Interview ({answeredCount}/10)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                Submit Official Interview?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You have completed all 10 questions. Once submitted, your answers will be evaluated by the Legend Flow Global AI Evaluation Engine against the official rubric.
              </p>
              <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">
                Important: Only one completed attempt is permitted per member.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Review Answers
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex-1 py-3 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Evaluating Your Interview</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluating your 10 answers with Gemini AI against official Legend Flow Global rubrics. Please do not close this window...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
