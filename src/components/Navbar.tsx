import React, { useState } from 'react';
import Logo from './Logo';
import { Menu, X, ChevronDown, User, ShieldAlert, Globe } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  setPage: (page: string) => void;
  currentRole: 'citizen' | 'officer' | 'dept_admin' | 'super_admin';
  setRole: (role: 'citizen' | 'officer' | 'dept_admin' | 'super_admin') => void;
  language: 'en' | 'hi' | 'mr';
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;
}

export default function Navbar({
  currentPage,
  setPage,
  currentRole,
  setRole,
  language,
  setLanguage,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const navLinks = [
    { id: 'home', label: { en: 'Home', hi: 'मुख्य पृष्ठ', mr: 'मुख्य पृष्ठ' } },
    { id: 'raise', label: { en: 'Raise a Complaint', hi: 'शिकायत दर्ज करें', mr: 'तक्रार नोंदवा' } },
    { id: 'track', label: { en: 'Track Complaint', hi: 'ट्रैक शिकायत', mr: 'तक्रार ट्रॅक करा' } },
    { id: 'how-it-works', label: { en: 'How It Works', hi: 'यह कैसे काम करता है', mr: 'हे कसे कार्य करते' } },
    { id: 'help', label: { en: 'Help', hi: 'सहायता', mr: 'मदत' } },
  ];

  const roleLabels = {
    citizen: 'Citizen (Uttamraj)',
    officer: 'Field Officer (Rajesh Patil)',
    dept_admin: 'Dept Admin (Roads)',
    super_admin: 'Super Admin (All Wards)',
  };

  const langNames = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
    mr: 'मराठी (Marathi)',
  };

  const handleNavClick = (pageId: string) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  const handleRoleSelect = (role: 'citizen' | 'officer' | 'dept_admin' | 'super_admin') => {
    setRole(role);
    setShowRoleDropdown(false);
    // Auto redirect based on selected role
    if (role === 'citizen') {
      setPage('dashboard');
    } else if (role === 'officer') {
      setPage('officer-portal');
    } else if (role === 'dept_admin') {
      setPage('dept-portal');
    } else if (role === 'super_admin') {
      setPage('admin-portal');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* ZONE 1: BRAND LOGO */}
          <div className="flex-1 md:flex-initial flex items-center">
            <button onClick={() => handleNavClick('home')} className="focus:outline-none">
              <Logo className="h-10 md:h-12" />
            </button>
          </div>

          {/* ZONE 2: NAVIGATION LINKS (4-6 single-line links) */}
          <nav className="hidden lg:flex items-center justify-center space-x-8 font-sans font-semibold text-[#0F172A] text-sm shrink-0">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative py-2 px-1 transition-all duration-150 hover:text-[#F4511E] uppercase text-xs tracking-wider font-bold ${
                    isActive ? 'text-[#F4511E]' : 'text-[#64748B]'
                  }`}
                >
                  {link.label[language]}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4511E] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: ACTIONS (Language selector + Multi-Role switcher CTA) */}
          <div className="hidden lg:flex items-center space-x-4">
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowLangDropdown(!showLangDropdown);
                  setShowRoleDropdown(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition-colors text-xs font-semibold text-[#64748B]"
              >
                <Globe className="w-3.5 h-3.5 text-[#F4511E]" />
                <span className="text-[#0F172A]">{langNames[language].split(' (')[0]}</span>
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50 text-xs">
                  {(Object.keys(langNames) as Array<'en' | 'hi' | 'mr'>).map((l) => (
                    <button
                      key={l}
                      onClick={() => {
                        setLanguage(l);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors ${
                        language === l ? 'font-bold text-[#F4511E] bg-orange-50/50' : 'text-[#475569]'
                      }`}
                    >
                      {langNames[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Portal Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowLangDropdown(false);
                }}
                className="flex items-center gap-2 bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-[#FF6A2A]" />
                <span>{currentRole === 'citizen' ? 'Sign In / Portal' : 'Viewing: ' + currentRole.replace('_', ' ')}</span>
                <ChevronDown className="w-3 h-3 text-[#FF6A2A]" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-xl py-1.5 z-50">
                  <div className="px-4 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulate Stakeholder Login</p>
                  </div>
                  {(Object.keys(roleLabels) as Array<'citizen' | 'officer' | 'dept_admin' | 'super_admin'>).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors text-xs flex flex-col ${
                        currentRole === r ? 'bg-orange-50 text-[#F4511E] font-semibold' : 'text-[#334155]'
                      }`}
                    >
                      <span>{roleLabels[r]}</span>
                      <span className="text-[9px] text-[#64748B] font-normal font-mono uppercase">
                        {r === 'citizen' && 'Report & Track Complaints'}
                        {r === 'officer' && 'Resolve work assignments with proof'}
                        {r === 'dept_admin' && 'Manage Department Officers & SLA'}
                        {r === 'super_admin' && 'Analyze metrics & override escalations'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger menu trigger */}
          <div className="flex items-center lg:hidden gap-3">
            {/* Direct Language select shortcut */}
            <button
              onClick={() => {
                const next: Record<'en' | 'hi' | 'mr', 'en' | 'hi' | 'mr'> = { en: 'hi', hi: 'mr', mr: 'en' };
                setLanguage(next[language]);
              }}
              className="px-2 py-1 border border-slate-200 rounded text-xs font-bold uppercase text-slate-700 bg-white"
            >
              {language}
            </button>

            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#0F1B2D] p-2 hover:bg-slate-100 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#E5E7EB] px-4 pt-3 pb-6 space-y-4 shadow-inner">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-left py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  currentPage === link.id
                    ? 'bg-orange-50 text-[#F4511E]'
                    : 'text-[#475569] hover:bg-slate-50'
                }`}
              >
                {link.label[language]}
              </button>
            ))}
          </nav>

          <hr className="border-slate-100" />

          {/* Quick Portal Selection in Mobile */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Stakeholder Portals</p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-xl">
              {(Object.keys(roleLabels) as Array<'citizen' | 'officer' | 'dept_admin' | 'super_admin'>).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    handleRoleSelect(r);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-2 px-2 rounded-lg text-left text-[11px] font-bold ${
                    currentRole === r
                      ? 'bg-[#0F1B2D] text-white'
                      : 'text-slate-700 bg-white border border-slate-100'
                  }`}
                >
                  {r === 'citizen' && 'Citizen'}
                  {r === 'officer' && 'Officer'}
                  {r === 'dept_admin' && 'Dept Admin'}
                  {r === 'super_admin' && 'Super Admin'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
