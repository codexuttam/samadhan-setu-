import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  Sparkles,
  QrCode,
} from 'lucide-react';
import {
  ApiError,
  AuthorityProfile,
  authorityActivate,
  authorityCompleteMfa,
  authorityConfirmMfa,
  authorityLogin,
  authorityLogout,
  authorityMe,
  authoritySetupMfa,
} from '../lib/api';

interface AuthorityAuthPageProps {
  language: 'en' | 'hi';
  authUser: AuthorityProfile | null;
  onAuthChange: (user: AuthorityProfile | null) => void;
  setPage: (page: string) => void;
}

export default function AuthorityAuthPage({
  language,
  authUser,
  onAuthChange,
  setPage,
}: AuthorityAuthPageProps) {
  const isHi = language === 'hi';
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const initialToken = routeToken || searchParams.get('token') || '';

  const [mode, setMode] = useState<'login' | 'activate'>(initialToken ? 'activate' : 'login');

  // Login & MFA challenge state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Account activation state
  const [activationToken, setActivationToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activatedOk, setActivatedOk] = useState(false);

  // TOTP Setup state (for signed-in users)
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [totpConfirmCode, setTotpConfirmCode] = useState('');

  useEffect(() => {
    if (initialToken) {
      setMode('activate');
      setActivationToken(initialToken);
    }
  }, [initialToken]);

  const redirectAfterLogin = (profile: AuthorityProfile) => {
    if (profile.role === 'SUPER_ADMIN' || profile.role === 'DEPT_ADMIN') {
      setPage('admin-portal');
    } else {
      setPage('officer-portal');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const res = await authorityLogin(email.trim(), password);
      if (res.mfaRequired) {
        setMfaToken(res.mfaToken);
        toast(isHi ? '🔐 कृपया 6-अंकीय TOTP कोड दर्ज करें।' : '🔐 Enter your 6-digit authenticator code.');
      } else {
        const profile = await authorityMe();
        onAuthChange(profile);
        toast.success(isHi ? `✓ स्वागत है, ${profile.name}` : `✓ Signed in as ${profile.name}`);
        redirectAfterLogin(profile);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : isHi
          ? 'सर्वर से कनेक्ट करने में असमर्थ। डेमो पोर्टल अभी भी उपलब्ध हैं।'
          : 'Unable to reach auth server. Interactive demo portals remain available.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaToken) return;
    setErrorMsg('');
    setSubmitting(true);
    try {
      await authorityCompleteMfa(mfaToken, mfaCode.trim());
      const profile = await authorityMe();
      onAuthChange(profile);
      toast.success(isHi ? `✓ 2FA सत्यापित! स्वागत है ${profile.name}` : `✓ 2FA verified! Welcome ${profile.name}`);
      redirectAfterLogin(profile);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : isHi
          ? 'अमान्य प्रमाणीकरण कोड।'
          : 'Invalid authentication code.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 12 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setErrorMsg(
        isHi
          ? 'पासवर्ड कम से कम 12 अक्षरों का होना चाहिए और इसमें अक्षर व अंक दोनों होने चाहिए।'
          : 'Password must be at least 12 characters and include both letters and numbers.',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(isHi ? 'पासवर्ड मेल नहीं खा रहे हैं।' : 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authorityActivate(activationToken.trim(), newPassword);
      setActivatedOk(true);
      toast.success(isHi ? '✓ खाता सक्रिय हो गया! अब साइन इन करें।' : '✓ Account activated! You can now sign in.');
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : isHi
          ? 'सक्रियण टोकन अमान्य या समाप्त हो गया है।'
          : 'Activation link is invalid or expired.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleBeginTotp = async () => {
    setErrorMsg('');
    try {
      const data = await authoritySetupMfa();
      setTotpSetup(data);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? '2FA सेटअप विफल रहा' : 'Failed to start 2FA setup');
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authorityConfirmMfa(totpConfirmCode.trim());
      const updated = await authorityMe();
      onAuthChange(updated);
      setTotpSetup(null);
      setTotpConfirmCode('');
      toast.success(isHi ? '✓ दो-चरणीय प्रमाणीकरण (2FA) सक्रिय हो गया!' : '✓ Two-Factor Authentication (2FA) enabled!');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : isHi ? 'कोड सत्यापित नहीं हुआ' : 'Could not verify code');
    }
  };

  const handleLogout = async () => {
    await authorityLogout();
    onAuthChange(null);
    setTotpSetup(null);
    toast.success(isHi ? 'सत्र समाप्त हो गया।' : 'Signed out.');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 select-none">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F1B2D] text-white text-[10px] font-extrabold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF6A2A]" />
          {isHi ? 'अधिकारी एवं प्रशासक प्रमाणीकरण' : 'Authority & Admin Authentication'}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D]">
          {authUser
            ? isHi
              ? 'अधिकारी सुरक्षा और सत्र'
              : 'Authority Session & Security'
            : mode === 'activate'
            ? isHi
              ? 'अधिकारी खाता सक्रिय करें'
              : 'Activate Authority Account'
            : isHi
            ? 'अधिकारी पोर्टल साइन इन'
            : 'Authority Portal Sign In'}
        </h1>
        <p className="text-xs text-[#64748B]">
          {isHi
            ? 'Argon2id पासवर्ड, CSRF सुरक्षा और TOTP 2FA द्वारा सुरक्षित आधिकारिक लॉगिन।'
            : 'Secured with Argon2id passwords, strict session cookies, CSRF protection, and optional TOTP 2FA.'}
        </p>
      </div>

      {/* Signed-in Session & 2FA Panel */}
      {authUser ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {isHi ? 'सक्रिय सत्र' : 'Active Session'}
              </span>
              <h2 className="text-lg font-extrabold text-[#0F1B2D] mt-1">{authUser.name}</h2>
              <p className="text-[#64748B]">
                {authUser.email} · <span className="font-semibold text-[#0F172A]">{authUser.roleName}</span> ({authUser.scope})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => redirectAfterLogin(authUser)}
                className="inline-flex items-center gap-1.5 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-4 py-2 rounded-lg font-bold uppercase tracking-wider"
              >
                <span>{isHi ? 'पोर्टल खोलें' : 'Open Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{isHi ? 'लॉग आउट' : 'Sign Out'}</span>
              </button>
            </div>
          </div>

          {/* TOTP 2FA Status */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[#0F1B2D] flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#F4511E]" />
                  {isHi ? 'दो-चरणीय प्रमाणीकरण (TOTP 2FA)' : 'Two-Factor Authentication (TOTP 2FA)'}
                </h3>
                <p className="text-[#64748B]">
                  {authUser.totpEnabled
                    ? isHi
                      ? 'आपका खाता Google/Microsoft Authenticator के साथ सुरक्षित है।'
                      : 'Your account is protected with an Authenticator app.'
                    : isHi
                    ? 'अतिरिक्त सुरक्षा के लिए अपना Authenticator ऐप लिंक करें।'
                    : 'Link Google/Microsoft Authenticator for strong 2FA login verification.'}
                </p>
              </div>
              {authUser.totpEnabled ? (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {isHi ? 'सक्रिय' : 'Enabled'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleBeginTotp}
                  className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold shrink-0"
                >
                  {isHi ? '2FA सेट अप करें' : 'Enable 2FA'}
                </button>
              )}
            </div>

            {totpSetup && (
              <form onSubmit={handleConfirmTotp} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(totpSetup.otpauthUrl)}`}
                    alt="TOTP QR Code"
                    className="w-32 h-32 rounded-lg border border-slate-200 p-1 bg-white shrink-0"
                  />
                  <div className="space-y-2 flex-1 min-w-0">
                    <p className="font-bold text-[#0F1B2D] flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#F4511E]" />
                      {isHi ? 'Authenticator ऐप से QR कोड स्कैन करें' : 'Scan QR with your Authenticator app'}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {isHi ? 'या मैन्युअल गुप्त कुंजी दर्ज करें:' : 'Or enter this secret key manually:'}
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="px-2.5 py-1 bg-slate-100 rounded font-mono text-[11px] text-[#0F1B2D] break-all">
                        {totpSetup.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(totpSetup.secret);
                          toast.success(isHi ? 'कुंजी कॉपी हो गई!' : 'Secret copied!');
                        }}
                        className="p-1.5 border border-slate-200 rounded hover:bg-slate-50"
                        title={isHi ? 'कॉपी करें' : 'Copy secret'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpConfirmCode}
                    onChange={(e) => setTotpConfirmCode(e.target.value.replace(/\D/g, ''))}
                    placeholder={isHi ? '6-अंकीय कोड दर्ज करें' : 'Enter 6-digit code'}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg font-mono text-sm tracking-widest"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-[#16A34A] hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold uppercase tracking-wider"
                  >
                    {isHi ? 'सत्यापित करें और चालू करें' : 'Verify & Enable'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-xs">
          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                mode === 'login' ? 'bg-white text-[#0F1B2D] shadow-xs' : 'text-slate-600'
              }`}
            >
              {isHi ? 'अधिकारी साइन इन' : 'Authority Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('activate');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                mode === 'activate' ? 'bg-white text-[#0F1B2D] shadow-xs' : 'text-slate-600'
              }`}
            >
              {isHi ? 'खाता सक्रियण' : 'Activate Account'}
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' && !mfaToken && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider block">
                  {isHi ? 'आधिकारिक ईमेल' : 'Official Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@samadhan.gov.in"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider block">
                  {isHi ? 'पासवर्ड' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#0F1B2D] hover:bg-slate-800 disabled:opacity-60 text-white py-3 rounded-xl font-bold uppercase tracking-wider transition-colors"
              >
                <Lock className="w-4 h-4 text-[#FF6A2A]" />
                <span>
                  {submitting
                    ? isHi
                      ? 'सत्यापन हो रहा है...'
                      : 'Signing in...'
                    : isHi
                    ? 'सुरक्षित साइन इन'
                    : 'Secure Sign In'}
                </span>
              </button>
            </form>
          )}

          {mode === 'login' && mfaToken && (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
                {isHi
                  ? 'इस खाते पर 2FA सक्षम है। कृपया अपने Authenticator ऐप से 6-अंकीय कोड दर्ज करें।'
                  : '2FA is enabled on this account. Enter the 6-digit code from your Authenticator app.'}
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider block">
                  {isHi ? '6-अंकीय TOTP कोड' : '6-Digit TOTP Code'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg font-mono text-base tracking-[0.35em] text-center focus:outline-none focus:border-[#F4511E]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMfaToken(null);
                    setMfaCode('');
                  }}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || mfaCode.length !== 6}
                  className="flex-1 bg-[#F4511E] hover:bg-[#FF6A2A] disabled:opacity-50 text-white py-2.5 rounded-xl font-bold uppercase tracking-wider"
                >
                  {isHi ? 'सत्यापित करें और प्रवेश करें' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}

          {mode === 'activate' && (
            activatedOk ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="text-base font-extrabold text-[#0F1B2D]">
                  {isHi ? 'खाता सफलतापूर्वक सक्रिय हो गया!' : 'Account Activated Successfully!'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setActivatedOk(false);
                  }}
                  className="bg-[#0F1B2D] text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider"
                >
                  {isHi ? 'अब साइन इन करें' : 'Proceed to Sign In'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleActivateSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider block">
                    {isHi ? 'सक्रियण टोकन' : 'Activation Token'}
                  </label>
                  <input
                    type="text"
                    value={activationToken}
                    onChange={(e) => setActivationToken(e.target.value)}
                    placeholder={isHi ? 'एडमिन द्वारा दिया गया टोकन पेस्ट करें' : 'Paste activation token from invite URL'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg font-mono text-xs focus:outline-none focus:border-[#F4511E]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider block">
                    {isHi ? 'नया पासवर्ड (न्यूनतम 12 अक्षर + अंक)' : 'New Password (min 12 chars + digits)'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider block">
                    {isHi ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#F4511E] hover:bg-[#FF6A2A] disabled:opacity-60 text-white py-3 rounded-xl font-bold uppercase tracking-wider"
                >
                  {submitting
                    ? isHi
                      ? 'सक्रिय हो रहा है...'
                      : 'Activating...'
                    : isHi
                    ? 'पासवर्ड सेट करें और सक्रिय करें'
                    : 'Set Password & Activate'}
                </button>
              </form>
            )
          )}
        </div>
      )}

      {/* Demo Simulator Fallback Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            {isHi
              ? 'डेटाबेस ऑफ़लाइन है या केवल मूल्यांकन कर रहे हैं? आप बिना लॉगिन के भी लाइव सिम्युलेटर एडमिन और अधिकारी पोर्टल आज़मा सकते हैं।'
              : 'Database paused or evaluating locally? You can explore the interactive Demo Simulator portals anytime without signing in.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPage('admin-portal')}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-bold shrink-0 text-[11px]"
        >
          {isHi ? 'डेमो एडमिन पोर्टल खोलें' : 'Open Demo Admin Portal'}
        </button>
      </div>
    </div>
  );
}
