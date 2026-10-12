/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Question, InterviewAttempt } from './types';
import { apiRequest, getStoredToken, removeStoredToken } from './api';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { MemberDashboard } from './components/MemberDashboard';
import { InterviewView } from './components/InterviewView';
import { ResultView } from './components/ResultView';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Languages
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'member' | 'interview' | 'admin'>('member');
  
  // Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [sponsorParam, setSponsorParam] = useState('');

  // Branding & Logo state (prioritizes original logo file with fallback)
  const [logoUrl, setLogoUrl] = useState('/lfg-original-logo.jpg');

  // Interview state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<InterviewAttempt | null>(null);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  const [showingResultScreen, setShowingResultScreen] = useState(false);

  // Check URL params for referral code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref') || urlParams.get('sponsor');
    if (refCode) {
      setSponsorParam(refCode);
    }
  }, []);

  // Fetch current user if token exists
  const checkAuth = async () => {
    const token = getStoredToken();
    if (!token) return;

    try {
      const data = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(data.user);
      if (data.user.role === 'admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('member');
      }
    } catch (err) {
      removeStoredToken();
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch branding status to check active logo
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const data = await apiRequest('/api/branding');
        if (data.activeLogo) {
          setLogoUrl(data.activeLogo);
        }
      } catch (err) {
        // Default to fallback
      }
    };
    fetchBranding();
  }, []);

  const handleLogoError = () => {
    if (logoUrl !== '/lfg-logo.svg') {
      setLogoUrl('/lfg-logo.svg');
    }
  };

  // Fetch member's attempt status
  const fetchInterviewStatus = async () => {
    if (!user || user.role === 'admin') return;
    setLoadingAttempt(true);
    try {
      const data = await apiRequest('/api/interview/status');
      if (data.hasAttempt && data.attempt) {
        setAttempt(data.attempt);
      } else {
        setAttempt(null);
      }
    } catch (err) {
      console.error('Error fetching interview status:', err);
    } finally {
      setLoadingAttempt(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInterviewStatus();
    }
  }, [user]);

  // Fetch questions when needed
  const fetchQuestions = async () => {
    try {
      const data = await apiRequest<{ questions: Question[] }>('/api/questions');
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  };

  const handleStartInterview = async () => {
    await fetchQuestions();
    setCurrentView('interview');
  };

  const handleInterviewSubmitSuccess = (newAttempt: InterviewAttempt) => {
    setAttempt(newAttempt);
    setShowingResultScreen(true);
    setCurrentView('member');
    fetchInterviewStatus();
  };

  const handleLogout = () => {
    removeStoredToken();
    setUser(null);
    setAttempt(null);
    setCurrentView('member');
    setShowingResultScreen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Global Navbar */}
      <Navbar
        user={user}
        currentView={currentView}
        logoUrl={logoUrl}
        onViewChange={(view) => {
          setCurrentView(view);
          setShowingResultScreen(false);
        }}
        onLogout={handleLogout}
        onOpenAuth={() => {
          setAuthInitialMode('login');
          setAuthModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: Non-authenticated Public Landing Hero */}
        {!user && (
          <div className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
            {/* Background decorative soft glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/50 via-slate-50/20 to-transparent pointer-events-none rounded-b-[40px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-3xl mx-auto space-y-6 sm:space-y-7">
                {/* Official Badge */}
                <div className="inline-flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-[11px] sm:text-xs font-bold text-[#0b2545] mx-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span>Legend Flow Global (Pvt) Ltd • Official Assessment Portal</span>
                </div>

                {/* Hero Logo Display — Preserves exact 1:1 original logo aspect ratio */}
                <div className="flex items-center justify-center pt-1 pb-1">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex items-center justify-center p-2 rounded-full bg-white shadow-xl border border-slate-200/80 hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={logoUrl}
                      onError={handleLogoError}
                      alt="Legend Flow Global Official Logo"
                      className="w-full h-full object-contain aspect-square select-none"
                    />
                  </div>
                </div>

                {/* Main Heading & Brand Hierarchy */}
                <div className="space-y-1.5 sm:space-y-2">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[#0b2545] leading-tight">
                    LEGEND FLOW GLOBAL
                  </h1>
                  <p className="text-lg sm:text-2xl md:text-3xl font-extrabold text-blue-700 tracking-tight">
                    Online Interview Assessment System
                  </p>
                </div>

                {/* Subtitle / Description */}
                <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed px-2">
                  Welcome to the official assessment platform of <strong>Legend Flow Global</strong>. 
                  Designed to evaluate vision, practical communication, problem-solving mindset, and business readiness across 10 structured bilingual questions.
                </p>

                {/* CTAs — Responsive, perfectly centered, equal touch targets */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4 w-full max-w-md mx-auto">
                  <button
                    onClick={() => {
                      setAuthInitialMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Register as New Member</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={() => {
                      setAuthInitialMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base bg-white border-2 border-[#0b2545] text-[#0b2545] hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Member Login</span>
                  </button>
                </div>

                {sponsorParam && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 inline-block font-medium">
                    Sponsor Referral Invitation: <strong>{sponsorParam}</strong>
                  </div>
                )}
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mt-12 sm:mt-16 max-w-5xl mx-auto">
                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Languages className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">Bilingual &amp; Multilingual</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Toggle questions between Urdu and English. Answer freely in Urdu, Roman Urdu, or English without language barriers.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">Fair AI Meaning Evaluation</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Evaluates understanding and sincere intent against official rubrics, rather than rigid keyword memorization.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0b2545] flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="font-extrabold text-base text-slate-900">Strict One-Attempt Integrity</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Each candidate completes 1 authenticated attempt. Real results are stored directly in the central database.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Authenticated Member Dashboard & Results */}
        {user && currentView === 'member' && !showingResultScreen && (
          <MemberDashboard
            user={user}
            attempt={attempt}
            loadingAttempt={loadingAttempt}
            onStartInterview={handleStartInterview}
            onRetryEvaluation={fetchInterviewStatus}
          />
        )}

        {/* VIEW 3: Active Interview View (10 Questions continuous) */}
        {user && currentView === 'interview' && (
          <InterviewView
            questions={questions}
            onSubmitSuccess={handleInterviewSubmitSuccess}
            onCancel={() => setCurrentView('member')}
          />
        )}

        {/* VIEW 4: Result Screen with Confetti and detailed breakdown */}
        {user && currentView === 'member' && showingResultScreen && attempt && (
          <ResultView
            attempt={attempt}
            onBackToDashboard={() => setShowingResultScreen(false)}
          />
        )}

        {/* VIEW 5: Admin Dashboard */}
        {user && currentView === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
          <p className="font-semibold text-slate-700">
            Legend Flow Global (Pvt) Ltd. All Rights Reserved.
          </p>
          <p className="text-[11px] text-slate-400">
            LFG Online Interview System • Secure AI Evaluation Engine • Version 1.0.0
          </p>
        </div>
      </footer>

      {/* Auth Modal (Login / Register / Forgot Password) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        defaultSponsor={sponsorParam}
        onSuccess={(newUser) => {
          setUser(newUser);
          if (newUser.role === 'admin') {
            setCurrentView('admin');
          } else {
            setCurrentView('member');
          }
        }}
      />
    </div>
  );
}
