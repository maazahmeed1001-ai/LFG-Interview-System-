import React, { useState } from 'react';
import { User } from '../types';
import { Shield, User as UserIcon, LogOut, FileText } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  currentView: 'member' | 'interview' | 'admin';
  onViewChange: (view: 'member' | 'admin') => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onViewChange,
  onLogout,
  onOpenAuth,
  logoUrl = '/lfg-original-logo.jpg',
}) => {
  const [imgSrc, setImgSrc] = useState(logoUrl);

  const handleImageError = () => {
    if (imgSrc !== '/lfg-logo.svg') {
      setImgSrc('/lfg-logo.svg');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
        {/* Brand identity with official LFG Logo */}
        <div 
          className="flex items-center space-x-2.5 sm:space-x-3.5 cursor-pointer min-w-0" 
          onClick={() => user ? onViewChange(user.role === 'admin' && currentView === 'admin' ? 'admin' : 'member') : null}
        >
          {/* Logo container preserving exact 1:1 aspect ratio without distorting or clipping */}
          <div className="relative w-11 h-11 sm:w-13 sm:h-13 flex-shrink-0 flex items-center justify-center">
            <img
              src={imgSrc}
              onError={handleImageError}
              alt="Legend Flow Global Official Logo"
              className="w-full h-full object-contain aspect-square select-none drop-shadow-2xs"
            />
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-sm sm:text-lg lg:text-xl font-black tracking-tight text-[#0b2545] truncate">
                LEGEND FLOW GLOBAL
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full flex-shrink-0">
                PVT. LTD.
              </span>
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wide truncate">
              Online Interview Assessment System
            </span>
          </div>
        </div>

        {/* Navigation actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Role badge */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-xs font-medium text-slate-600">Signed in as:</span>
                <span className="text-xs font-bold text-slate-900 max-w-[130px] truncate">
                  {user.fullName}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    user.role === 'admin'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>

              {/* View Switcher for Administrators */}
              {user.role === 'admin' && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => onViewChange('member')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      currentView === 'member'
                        ? 'bg-white text-[#0b2545] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Member View</span>
                    <span className="sm:hidden">Member</span>
                  </button>
                  <button
                    onClick={() => onViewChange('admin')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-[#0b2545] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Admin Portal</span>
                    <span className="sm:hidden">Admin</span>
                  </button>
                </div>
              )}

              {/* Logout button */}
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenAuth}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#0b2545] text-white hover:bg-[#133968] active:scale-[0.99] transition-all shadow-xs flex items-center space-x-1.5 sm:space-x-2 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Member Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
