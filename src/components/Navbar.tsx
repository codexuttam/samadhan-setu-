import React, { useState } from 'react';
import Logo from './Logo';
import { Menu, X, ChevronDown, User, ShieldAlert, Globe, KeyRound, LogOut } from 'lucide-react';
import type { AuthorityProfile } from '../lib/api';

interface NavbarProps {
  currentPage: string;
  setPage: (page: string) => void;
  currentRole: 'citizen' | 'officer' | 'dept_admin' | 'super_admin';
  setRole: (role: 'citizen' | 'officer' | 'dept_admin' | 'super_admin') => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  authUser?: AuthorityProfile | null;
  onLogout?: () => void;
}

export default function Navbar({
  currentPage,
  setPage,
  currentRole,
  setRole,
  language,
  setLanguage,
  authUser,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const navLinks = [
    { id: 'home', label: { en: 'Home', hi: 'मुख्य पृष्ठ' } },
    { id: 'raise', label: { en: 'Raise a Complaint', hi: 'शिकायत दर्ज करें' } },
    { id: 'track', label: { en: 'Track Complaint', hi: 'ट्रैक शिकायत' } },
    { id: 'how-it-works', label: { en: 'How It Works', hi: 'यह कैसे काम करता है' } },
    { id: 'help', label: { en: 'Help', hi: 'सहायता' } },
  ];

  const roleLabels: Record<'citizen' | 'officer' | 'dept_admin' | 'super_admin', { en: string; hi: string; shortEn: string; shortHi: string }> = {
    citizen: {
      en: 'Citizen Portal (My Grievances)',
      hi: 'नागरिक पोर्टल (मेरी शिकायतें)',
      shortEn: 'Citizen',
      shortHi: 'नागरिक',
    },
    officer: {
      en: 'Field Officer (Rajesh Patil)',
      hi: 'क्षेत्रीय अधिकारी (राजेश पाटिल)',
      shortEn: 'Officer',
      shortHi: 'अधिकारी',
    },
    dept_admin: {
      en: 'Dept Admin (Roads & PWD)',
      hi: 'विभाग एडमिन (सड़क व PWD)',
      shortEn: 'Dept Admin',
      shortHi: 'विभाग एडमिन',
    },
    super_admin: {
      en: 'Super Admin (All Wards)',
      hi: 'सुपर एडमिन (सभी वार्ड)',
      shortEn: 'Super Admin',
      shortHi: 'सुपर एडमिन',
    },
  };

  const langNames: Record<'en' | 'hi', string> = {
    en: 'English',
    hi: 'हिंदी (Hindi)',
  };

  const handleNavClick = (pageId: string) => {
    setPage(pageId);
    setMobileMenuOpen(false);
  };

  const handleRoleSelect = (role: 'citizen' | 'officer' | 'dept_admin' | 'super_admin') => {
    setRole(role);
    setShowRoleDropdown(false);
    setMobileMenuOpen(false);
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
              <Logo className="h-10 md:h-12" language={language} />
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
                  {(Object.keys(langNames) as Array<'en' | 'hi'>).map((l) => (
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

            {/* Role / Portal Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRoleDropdown(!showRoleDropdown);
                  setShowLangDropdown(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1B2D] hover:bg-slate-800 text-white transition-colors text-xs font-bold shadow-xs"
              >
                {currentRole === 'citizen' ? (
                  <User className="w-3.5 h-3.5 text-[#FF6A2A]" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF6A2A]" />
                )}
                <span>{language === 'hi' ? roleLabels[currentRole].shortHi : roleLabels[currentRole].shortEn}</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    {language === 'hi' ? 'भूमिका / पोर्टल चुनें' : 'Switch Role / Portal'}
                  </div>
                  {(['citizen', 'officer', 'dept_admin', 'super_admin'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        currentRole === r ? 'font-bold text-[#F4511E] bg-orange-50/50' : 'text-[#334155]'
                      }`}
                    >
                      <span>{roleLabels[r][language]}</span>
                      {currentRole === r && <span className="w-1.5 h-1.5 rounded-full bg-[#F4511E]" />}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setPage('authority-login');
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 text-[#0F1B2D] font-bold flex items-center gap-2"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#F4511E]" />
                      <span>
                        {authUser
                          ? language === 'hi'
                            ? `सत्र व 2FA (${authUser.name})`
                            : `Session & 2FA (${authUser.name})`
                          : language === 'hi'
                          ? 'अधिकारी लॉगिन / 2FA'
                          : 'Authority Sign-In / 2FA'}
                      </span>
                    </button>
                    {authUser && onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleDropdown(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-50 text-red-600 font-bold flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'सत्र समाप्त करें' : 'Sign Out'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Mobile hamburger menu trigger */}
          <div className="flex items-center lg:hidden gap-3">
            {/* Direct Language select shortcut */}
            <button
              onClick={() => {
                setLanguage(language === 'en' ? 'hi' : 'en');
              }}
              className="px-2.5 py-1 border border-slate-200 rounded text-xs font-bold uppercase text-slate-700 bg-white"
            >
              {language === 'en' ? 'हिंदी' : 'EN'}
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

          <div className="space-y-2">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {language === 'hi' ? 'पोर्टल / भूमिका बदलें' : 'Switch Role / Portal'}
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {(['citizen', 'officer', 'dept_admin', 'super_admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`text-left py-2 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${
                    currentRole === r
                      ? 'bg-[#0F1B2D] text-white'
                      : 'bg-slate-50 text-[#334155] hover:bg-slate-100'
                  }`}
                >
                  <span>{roleLabels[r][language]}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPage('authority-login');
                }}
                className="text-left py-2 px-3 rounded-lg text-xs font-bold bg-orange-50 text-[#F4511E] flex items-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'अधिकारी लॉगिन / 2FA' : 'Authority Sign-In / 2FA'}</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </header>
  );
}
