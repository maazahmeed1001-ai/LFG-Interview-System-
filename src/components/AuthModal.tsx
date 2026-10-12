import React, { useState, useEffect } from 'react';
import { apiRequest, setStoredToken } from '../api';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, Users, KeyRound, AlertCircle, CheckCircle, ArrowRight, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  defaultSponsor?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  defaultSponsor = '',
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sponsorId, setSponsorId] = useState(defaultSponsor);
  
  // Reset fields
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSponsor) {
      setSponsorId(defaultSponsor);
    }
  }, [defaultSponsor]);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword,
          sponsorId: sponsorId.trim() || undefined,
        }),
      });

      setStoredToken(data.token);
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setStoredToken(data.token);
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const data = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setSuccessMsg(`Reset token created: ${data.resetToken}. You can now set your new password.`);
        setMode('reset');
      } else {
        setSuccessMsg(data.message || 'Password reset request generated.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process forgot password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          token: resetToken,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      setSuccessMsg(data.message || 'Password successfully updated! Please log in.');
      setMode('login');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className="bg-[#0b2545] p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto flex items-center justify-center mb-3">
            <img
              src="/lfg-original-logo.jpg"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/lfg-logo.svg')) {
                  target.src = '/lfg-logo.svg';
                }
              }}
              alt="Legend Flow Global Logo"
              className="w-full h-full object-contain aspect-square drop-shadow-sm"
            />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">LEGEND FLOW GLOBAL</h2>
          <p className="text-xs text-blue-200 font-medium mt-1">Official Member & Interview Portal</p>
        </div>

        {/* Tab Selector */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                mode === 'login'
                  ? 'border-[#0b2545] text-[#0b2545] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
                mode === 'register'
                  ? 'border-[#0b2545] text-[#0b2545] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Register New Member
            </button>
          </div>
        )}

        <div className="p-6">
          {/* Notification Banners */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0b2545] text-white hover:bg-[#133968] active:scale-[0.99] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block animate-spin mr-2">⟳</span>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Sign In to Member Portal</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="text-xs font-bold text-[#0b2545] hover:underline"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* Form: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Sponsor / Referral ID
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Optional</span>
                </div>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={sponsorId}
                    onChange={(e) => setSponsorId(e.target.value)}
                    placeholder="e.g. LFG-REF-1092 (or leave blank)"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  If you joined directly without a referring senior, leave blank (will record as "Not recorded").
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer mt-2"
              >
                {loading ? (
                  <span className="inline-block animate-spin mr-2">⟳</span>
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Complete Free Registration</span>
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already an LFG member? </span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-xs font-bold text-[#0b2545] hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Form: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="text-center mb-2">
                <KeyRound className="w-10 h-10 mx-auto text-[#0b2545] mb-2" />
                <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered email address to receive password reset authorization.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#0b2545] text-white hover:bg-[#133968] transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? <span className="inline-block animate-spin">⟳</span> : <KeyRound className="w-4 h-4" />}
                <span>Generate Reset Code</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Form: RESET WITH TOKEN */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-base font-bold text-slate-900">Enter New Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Create a secure new password for your LFG account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                {loading ? <span className="inline-block animate-spin">⟳</span> : <CheckCircle className="w-4 h-4" />}
                <span>Update Password</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
