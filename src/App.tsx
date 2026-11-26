import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CivicConciergeChat, { ConciergePrefill } from './components/CivicConciergeChat';
import LanguagePreferenceModal from './components/LanguagePreferenceModal';
import { authorityLogout, authorityMe, type AuthorityProfile } from './lib/api';
import { flushOfflineQueue, getPendingCount } from './lib/offlineQueue';

// Pages (HomePage eager for immediate first paint, secondary routes lazy-loaded)
import HomePage from './pages/HomePage';
const RaiseComplaintPage = lazy(() => import('./pages/RaiseComplaintPage'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));
const OfficerPortal = lazy(() => import('./pages/OfficerPortal'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ComplaintDetailsPage = lazy(() => import('./pages/ComplaintDetailsPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const AuthorityAuthPage = lazy(() => import('./pages/AuthorityAuthPage'));

// Data Layer
import {
  Complaint,
  ComplaintUpdate,
  Feedback,
  Notification,
  INITIAL_COMPLAINTS,
  INITIAL_UPDATES,
  INITIAL_FEEDBACKS,
  INITIAL_NOTIFICATIONS,
  loadState,
  saveState,
} from './data/mockData';

import { Bell, ShieldAlert, Sparkles, X } from 'lucide-react';

const PAGE_PATHS: Record<string, string> = {
  home: '/',
  raise: '/raise',
  track: '/track',
  'how-it-works': '/how-it-works',
  help: '/help',
  dashboard: '/dashboard',
  'officer-portal': '/officer',
  'dept-portal': '/dept',
  'admin-portal': '/admin',
  'authority-login': '/authority/login',
};

function pathToPage(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname.startsWith('/raise')) return 'raise';
  if (pathname.startsWith('/track')) return 'track';
  if (pathname.startsWith('/how-it-works')) return 'how-it-works';
  if (pathname.startsWith('/help')) return 'help';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/officer')) return 'officer-portal';
  if (pathname.startsWith('/dept')) return 'dept-portal';
  if (pathname.startsWith('/admin')) return 'admin-portal';
  if (pathname.startsWith('/authority')) return 'authority-login';
  return 'home';
}

function TrackRouteView(props: {
  selectedTrackedId: string;
  complaints: Complaint[];
  updates: ComplaintUpdate[];
  onUpdateComplaint: (updated: Complaint) => void;
  onAddUpdateLog: (log: ComplaintUpdate) => void;
  onAddFeedback: (feedback: Feedback) => void;
  onBack: () => void;
  onSelectComplaintId: (id: string) => void;
  language: 'en' | 'hi';
}) {
  const { ref } = useParams<{ ref?: string }>();
  const activeId = ref ? decodeURIComponent(ref) : props.selectedTrackedId;
  return (
    <ComplaintDetailsPage
      complaintId={activeId}
      complaints={props.complaints}
      updates={props.updates}
      onUpdateComplaint={props.onUpdateComplaint}
      onAddUpdateLog={props.onAddUpdateLog}
      onAddFeedback={props.onAddFeedback}
      onBack={props.onBack}
      onSelectComplaintId={props.onSelectComplaintId}
      language={props.language}
    />
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation & Role Configuration States
  const initialTrackRef = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('track')?.trim() || '';
  })();

  const page = pathToPage(location.pathname);
  const [role, setRole] = useState<'citizen' | 'officer' | 'dept_admin' | 'super_admin'>('citizen');
  const [authUser, setAuthUser] = useState<AuthorityProfile | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>(() => {
    const saved = localStorage.getItem('preferred_language');
    return saved === 'hi' || saved === 'en' ? saved : 'en';
  });
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(
    () => !localStorage.getItem('has_selected_language_preference')
  );

  const handleSelectLanguage = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);
    localStorage.setItem('has_selected_language_preference', 'true');
    if (lang === 'hi') {
      toast.success('✓ भाषा सेट: हिंदी (Hindi)');
    } else {
      toast.success('✓ Language set: English');
    }
  };

  // Interactive Live Database state (synced with localStorage)
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    loadState<Complaint[]>('complaints', INITIAL_COMPLAINTS)
  );
  const [updates, setUpdates] = useState<ComplaintUpdate[]>(() =>
    loadState<ComplaintUpdate[]>('updates', INITIAL_UPDATES)
  );
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() =>
    loadState<Feedback[]>('feedbacks', INITIAL_FEEDBACKS)
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadState<Notification[]>('notifications', INITIAL_NOTIFICATIONS)
  );

  // Search context
  const [trackingInput, setTrackingInput] = useState<string>(initialTrackRef);
  const [selectedTrackedId, setSelectedTrackedId] = useState<string>(initialTrackRef);
  const [conciergePrefill, setConciergePrefill] = useState<ConciergePrefill | null>(null);

  // Sync `?track=<ID>` deep links into canonical `/track/<ID>` route on first mount
  useEffect(() => {
    if (initialTrackRef && !location.pathname.startsWith('/track')) {
      navigate(`/track/${encodeURIComponent(initialTrackRef)}`, { replace: true });
    }
  }, [initialTrackRef, location.pathname, navigate]);

  // Quietly hydrate live authority session if cookie is present
  useEffect(() => {
    authorityMe()
      .then((profile) => {
        setAuthUser(profile);
        if (profile.role === 'SUPER_ADMIN') setRole('super_admin');
        else if (profile.role === 'DEPT_ADMIN') setRole('dept_admin');
        else setRole('officer');
      })
      .catch(() => {
        // Expected when browsing as citizen or when DB is offline
      });
  }, []);

  const handleAuthorityLogout = async () => {
    await authorityLogout();
    setAuthUser(null);
    setRole('citizen');
    toast.success(language === 'hi' ? 'अधिकारी सत्र समाप्त हो गया।' : 'Signed out from authority session.');
  };

  // Notification center overlay toggle
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Network Connectivity State (PWA Offline Resilience)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);

  const refreshOfflineCount = () => {
    getPendingCount().then(setPendingOfflineCount).catch(() => {});
  };

  const syncOfflineSubmissions = async () => {
    const result = await flushOfflineQueue();
    refreshOfflineCount();
    if (result.synced.length > 0) {
      const refMap = new Map(result.synced.map((s) => [s.localId, s.publicReference]));
      setComplaints((prev) =>
        prev.map((c) => {
          const syncedRef = refMap.get(c.id);
          return syncedRef ? { ...c, id: syncedRef } : c;
        }),
      );
      toast.success(
        language === 'hi'
          ? `✓ ${result.synced.length} ऑफ़लाइन शिकायत(ें) सफलतापूर्वक सिंक हो गईं!`
          : `✓ Synced ${result.synced.length} queued offline complaint(s)!`,
      );
    }
  };

  useEffect(() => {
    refreshOfflineCount();
    if (navigator.onLine) {
      void syncOfflineSubmissions();
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success(
        language === 'hi'
          ? '🌐 इंटरनेट पुनः कनेक्ट हो गया! लाइव सिंक सक्रिय है।'
          : '🌐 Reconnected to internet! Real-time sync active.',
      );
      void syncOfflineSubmissions();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast(
        language === 'hi'
          ? '📶 ऑफ़लाइन मोड। ड्राफ़्ट स्थानीय रूप से सुरक्षित हैं।'
          : '📶 Working Offline. Local cache and drafts will auto-sync.',
        { icon: '⚠️' },
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  // Sync state to localStorage on every change
  useEffect(() => {
    saveState('complaints', complaints);
  }, [complaints]);

  useEffect(() => {
    saveState('updates', updates);
  }, [updates]);

  useEffect(() => {
    saveState('feedbacks', feedbacks);
  }, [feedbacks]);

  useEffect(() => {
    saveState('notifications', notifications);
  }, [notifications]);

  // Operations CRUD Handlers
  const handleAddComplaint = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);

    // Automatically trigger system logs
    const systemLog: ComplaintUpdate = {
      id: `up_sys_${Date.now()}`,
      complaintId: newComplaint.id,
      title: 'Complaint Registered',
      description: `Grievance registered. Automatic ward routing computed priority: "${newComplaint.priority.toUpperCase()}". SLA target is active.`,
      timestamp: newComplaint.createdAt,
      authorName: 'System',
      authorRole: 'system',
    };
    setUpdates((prev) => [systemLog, ...prev]);

    // Automatically trigger Citizen Notification
    const newNotif: Notification = {
      id: `not_${Date.now()}`,
      title: 'Complaint Registered',
      message: `Your grievance with ID ${newComplaint.id} has been securely logged. Click to check progress.`,
      type: 'success',
      isRead: false,
      timestamp: newComplaint.createdAt,
      recipientRole: 'citizen',
      complaintId: newComplaint.id,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleUpdateComplaint = (updatedComplaint: Complaint) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === updatedComplaint.id ? updatedComplaint : c))
    );
  };

  const handleAddUpdateLog = (newLog: ComplaintUpdate) => {
    setUpdates((prev) => [newLog, ...prev]);

    // Also push a notification whenever a status log is added!
    const isCitizenAuthor = newLog.authorRole === 'citizen';
    const notifObj: Notification = {
      id: `not_update_${Date.now()}`,
      title: newLog.title,
      message: newLog.description,
      type: newLog.title.toLowerCase().includes('resolved') ? 'success' : 'info',
      isRead: false,
      timestamp: newLog.timestamp,
      recipientRole: isCitizenAuthor ? 'super_admin' : 'citizen',
      complaintId: newLog.complaintId,
    };
    setNotifications((prev) => [notifObj, ...prev]);
  };

  const handleAddFeedback = (newFeedback: Feedback) => {
    setFeedbacks((prev) => [newFeedback, ...prev]);
  };

  // Helper to trigger active route navigation
  const navigateTo = (targetPage: string, overrideTrackId?: string) => {
    if (targetPage === 'track') {
      const targetId = (overrideTrackId ?? selectedTrackedId).trim();
      navigate(targetId ? `/track/${encodeURIComponent(targetId)}` : '/track');
    } else {
      navigate(PAGE_PATHS[targetPage] || '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTracked = (id: string) => {
    setTrackingInput(id);
    setSelectedTrackedId(id);
    navigate(id ? `/track/${encodeURIComponent(id)}` : '/track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      <Toaster position="bottom-center" toastOptions={{ className: 'text-sm font-semibold' }} />
      
      {/* GLOBAL NAVBAR CONTRACT */}
      <Navbar
        currentPage={page}
        setPage={navigateTo}
        currentRole={role}
        setRole={setRole}
        language={language}
        setLanguage={handleSelectLanguage}
        authUser={authUser}
        onLogout={handleAuthorityLogout}
      />

      {/* FLOATING ACTION ALERTS / SIMULATOR BANNER */}
      <div className="bg-[#0F1B2D] text-white border-y border-white/5 py-2 px-4 flex justify-between items-center text-[11px] font-sans font-medium">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500 text-white animate-pulse font-mono text-[9px] font-bold">
              {language === 'hi' ? 'लाइव सिम्युलेटर' : 'LIVE SIMULATOR'}
            </span>
            <span>
              {language === 'hi'
                ? 'नागरिक डैशबोर्ड, अधिकारी कार्य-प्रमाण और एडमिन SLA कतार देखने के लिए भूमिका या पृष्ठ बदलें।'
                : 'Switch roles in the top-right menu to test citizen dashboards, officer resolution proofs, and admin SLA queues.'}
            </span>
          </div>
          <button
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1 rounded text-white font-bold relative transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-[#FF6A2A]" />
            <span>{language === 'hi' ? `अलर्ट्स (${unreadNotifsCount})` : `Alerts (${unreadNotifsCount})`}</span>
            {unreadNotifsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* OFFLINE STATUS PWA BANNER */}
      {(!isOnline || pendingOfflineCount > 0) && (
        <div
          className={`${
            !isOnline ? 'bg-amber-600' : 'bg-blue-700'
          } text-white text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-3 shadow-inner flex-wrap`}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>
            {!isOnline
              ? language === 'hi'
                ? 'ऑफ़लाइन मोड: आप अभी इंटरनेट से डिस्कनेक्ट हैं। शिकायतें और ड्राफ़्ट स्थानीय रूप से सुरक्षित हैं और नेटवर्क आने पर सिंक हो जाएंगे।'
                : 'OFFLINE MODE: You are currently disconnected. Grievances and drafts are safely stored locally and will sync when network is restored.'
              : language === 'hi'
              ? `${pendingOfflineCount} ऑफ़लाइन शिकायत(ें) सिंक के लिए लंबित हैं।`
              : `${pendingOfflineCount} queued offline complaint(s) waiting to sync.`}
          </span>
          {pendingOfflineCount > 0 && (
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-mono">
              {language === 'hi' ? `कतार: ${pendingOfflineCount}` : `Queued: ${pendingOfflineCount}`}
            </span>
          )}
          {isOnline && pendingOfflineCount > 0 && (
            <button
              type="button"
              onClick={() => void syncOfflineSubmissions()}
              className="bg-white text-[#0F1B2D] px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider hover:bg-slate-100"
            >
              {language === 'hi' ? 'अभी सिंक करें' : 'Sync Now'}
            </button>
          )}
        </div>
      )}

      {/* NOTIFICATION SATELLITE DRAWER PANEL */}
      {showNotificationCenter && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-50 p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#0F1B2D] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#F4511E]" /> {language === 'hi' ? 'अलर्ट्स हब' : 'Alerts Hub'}
              </h3>
              <button
                onClick={() => setShowNotificationCenter(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto max-h-[75vh] pr-1">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  {language === 'hi' ? 'कोई सक्रिय सूचना नहीं है।' : 'No notifications active.'}
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.complaintId) {
                        handleSelectTracked(n.complaintId);
                        setShowNotificationCenter(false);
                      }
                      // Mark as read
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
                      );
                    }}
                    className={`p-3 rounded-lg border text-xs cursor-pointer hover:bg-slate-50/50 transition-colors ${
                      n.isRead ? 'border-slate-100 bg-white opacity-70' : 'border-[#F4511E]/20 bg-orange-50/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[#0F172A] leading-tight">{n.title}</span>
                      <span className="text-[9px] text-[#64748B] font-mono">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#475569] leading-relaxed mb-1.5 font-medium">{n.message}</p>
                    {n.complaintId && (
                      <span className="text-[9px] font-mono text-[#F4511E] font-bold uppercase">
                        {language === 'hi' ? 'ट्रैक करें:' : 'Track:'} {n.complaintId} →
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => {
              setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
              setShowNotificationCenter(false);
              toast(language === 'hi' ? '✓ सभी अलर्ट पढ़े हुए चिह्नित किए गए!' : '✓ All alerts marked read!');
            }}
            className="w-full bg-[#0F1B2D] text-white py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-slate-800 transition-colors"
          >
            {language === 'hi' ? 'सभी को पढ़ा हुआ चिह्नित करें' : 'Mark All Read'}
          </button>
        </div>
      )}

      {/* MAIN LAYOUT CANVAS VIEWPORT */}
      <main className="flex-grow">
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-3 select-none">
              <div className="w-9 h-9 border-4 border-[#F4511E] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#64748B]">
                {language === 'hi' ? 'पृष्ठ लोड हो रहा है...' : 'Loading view...'}
              </p>
            </div>
          }
        >
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  setPage={navigateTo}
                  language={language}
                  complaints={complaints}
                  setTrackingInput={setTrackingInput}
                  setSelectedTrackedId={setSelectedTrackedId}
                />
              }
            />
            <Route
              path="/raise"
              element={
                <RaiseComplaintPage
                  onAddComplaint={handleAddComplaint}
                  setPage={navigateTo}
                  setSelectedTrackedId={setSelectedTrackedId}
                  setTrackingInput={setTrackingInput}
                  onOfflineQueueChange={refreshOfflineCount}
                  prefillData={conciergePrefill}
                  language={language}
                />
              }
            />
            <Route
              path="/track"
              element={
                <TrackRouteView
                  selectedTrackedId={selectedTrackedId}
                  complaints={complaints}
                  updates={updates}
                  onUpdateComplaint={handleUpdateComplaint}
                  onAddUpdateLog={handleAddUpdateLog}
                  onAddFeedback={handleAddFeedback}
                  onBack={() => navigateTo('home')}
                  onSelectComplaintId={handleSelectTracked}
                  language={language}
                />
              }
            />
            <Route
              path="/track/:ref"
              element={
                <TrackRouteView
                  selectedTrackedId={selectedTrackedId}
                  complaints={complaints}
                  updates={updates}
                  onUpdateComplaint={handleUpdateComplaint}
                  onAddUpdateLog={handleAddUpdateLog}
                  onAddFeedback={handleAddFeedback}
                  onBack={() => navigateTo('home')}
                  onSelectComplaintId={handleSelectTracked}
                  language={language}
                />
              }
            />
            <Route path="/how-it-works" element={<HowItWorksPage language={language} setPage={navigateTo} />} />
            <Route path="/help" element={<HelpPage language={language} />} />
            <Route
              path="/dashboard"
              element={
                <CitizenDashboard
                  complaints={complaints}
                  setPage={navigateTo}
                  setSelectedTrackedId={setSelectedTrackedId}
                  setTrackingInput={setTrackingInput}
                  language={language}
                />
              }
            />
            <Route
              path="/officer"
              element={
                <OfficerPortal
                  complaints={complaints}
                  officerId="off_rajesh"
                  onUpdateComplaint={handleUpdateComplaint}
                  onAddUpdateLog={handleAddUpdateLog}
                  setPage={navigateTo}
                  setSelectedTrackedId={setSelectedTrackedId}
                  setTrackingInput={setTrackingInput}
                  language={language}
                />
              }
            />
            <Route
              path="/dept"
              element={
                <AdminDashboard
                  complaints={complaints}
                  updates={updates}
                  onUpdateComplaint={handleUpdateComplaint}
                  onAddUpdateLog={handleAddUpdateLog}
                  setPage={navigateTo}
                  setSelectedTrackedId={setSelectedTrackedId}
                  setTrackingInput={setTrackingInput}
                  authUser={authUser}
                  language={language}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminDashboard
                  complaints={complaints}
                  updates={updates}
                  onUpdateComplaint={handleUpdateComplaint}
                  onAddUpdateLog={handleAddUpdateLog}
                  setPage={navigateTo}
                  setSelectedTrackedId={setSelectedTrackedId}
                  setTrackingInput={setTrackingInput}
                  authUser={authUser}
                  language={language}
                />
              }
            />
            <Route
              path="/authority/login"
              element={
                <AuthorityAuthPage
                  language={language}
                  authUser={authUser}
                  onAuthChange={setAuthUser}
                  setPage={navigateTo}
                />
              }
            />
            <Route
              path="/authority/activate/:token"
              element={
                <AuthorityAuthPage
                  language={language}
                  authUser={authUser}
                  onAuthChange={setAuthUser}
                  setPage={navigateTo}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* GLOBAL FOOTER CONTRACT */}
      <Footer setPage={navigateTo} language={language} />

      {/* AI CIVIC CONCIERGE WIDGET ("SAMADHAN SAHAYAK") */}
      <CivicConciergeChat
        onPrefillGrievance={(prefill) => {
          setConciergePrefill(prefill);
          navigateTo('raise');
        }}
        currentLanguage={language}
      />

      {/* LANGUAGE PREFERENCE WELCOME DIALOG */}
      {showLanguageModal && (
        <LanguagePreferenceModal
          currentLanguage={language}
          onSelectLanguage={handleSelectLanguage}
          onClose={() => setShowLanguageModal(false)}
        />
      )}

    </div>
  );
}
