import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import GeminiChatbot from './components/GeminiChatbot';

// Pages
import HomePage from './pages/HomePage';
import RaiseComplaintPage from './pages/RaiseComplaintPage';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerPortal from './pages/OfficerPortal';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import HelpPage from './pages/HelpPage';

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

export default function App() {
  // Navigation & Role Configuration States
  const [page, setPage] = useState<string>('home');
  const [role, setRole] = useState<'citizen' | 'officer' | 'dept_admin' | 'super_admin'>('citizen');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

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
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [selectedTrackedId, setSelectedTrackedId] = useState<string>('');

  // Notification center overlay toggle
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

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
  const navigateTo = (targetPage: string) => {
    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      
      {/* GLOBAL NAVBAR CONTRACT */}
      <Navbar
        currentPage={page}
        setPage={navigateTo}
        currentRole={role}
        setRole={setRole}
        language={language}
        setLanguage={setLanguage}
      />

      {/* FLOATING ACTION ALERTS / SIMULATOR BANNER */}
      <div className="bg-[#0F1B2D] text-white border-y border-white/5 py-2 px-4 flex justify-between items-center text-[11px] font-sans font-medium">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 px-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500 text-white animate-pulse font-mono text-[9px] font-bold">LIVE SIMULATOR</span>
            <span>Switch roles in the top-right menu to test citizen dashboards, officer resolution proofs, and admin SLA queues.</span>
          </div>
          <button
            onClick={() => setShowNotificationCenter(!showNotificationCenter)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1 rounded text-white font-bold relative transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-[#FF6A2A]" />
            <span>Alerts ({unreadNotifsCount})</span>
            {unreadNotifsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* NOTIFICATION SATELLITE DRAWER PANEL */}
      {showNotificationCenter && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-slate-200 shadow-2xl z-50 p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#0F1B2D] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#F4511E]" /> Alerts Hub
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
                <p className="text-xs text-slate-400 text-center py-8">No notifications active.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (n.complaintId) {
                        setTrackingInput(n.complaintId);
                        setSelectedTrackedId(n.complaintId);
                        navigateTo('track');
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
                        Track: {n.complaintId} →
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
              alert('✓ All alerts marked read!');
            }}
            className="w-full bg-[#0F1B2D] text-white py-2 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-slate-800 transition-colors"
          >
            Mark All Read
          </button>
        </div>
      )}

      {/* MAIN LAYOUT CANVAS VIEWPORT */}
      <main className="flex-grow">
        {page === 'home' && (
          <HomePage
            setPage={navigateTo}
            language={language}
            complaints={complaints}
            setTrackingInput={setTrackingInput}
            setSelectedTrackedId={setSelectedTrackedId}
          />
        )}

        {page === 'raise' && (
          <RaiseComplaintPage
            onAddComplaint={handleAddComplaint}
            setPage={navigateTo}
            setSelectedTrackedId={setSelectedTrackedId}
            setTrackingInput={setTrackingInput}
          />
        )}

        {page === 'track' && (
          <ComplaintDetailsPage
            complaintId={selectedTrackedId}
            complaints={complaints}
            updates={updates}
            onUpdateComplaint={handleUpdateComplaint}
            onAddUpdateLog={handleAddUpdateLog}
            onAddFeedback={handleAddFeedback}
            onBack={() => navigateTo('home')}
          />
        )}

        {page === 'how-it-works' && <HowItWorksPage />}

        {page === 'help' && <HelpPage />}

        {/* Dashboard views by current Role state */}
        {page === 'dashboard' && (
          <CitizenDashboard
            complaints={complaints}
            setPage={navigateTo}
            setSelectedTrackedId={setSelectedTrackedId}
            setTrackingInput={setTrackingInput}
          />
        )}

        {page === 'officer-portal' && (
          <OfficerPortal
            complaints={complaints}
            officerId="off_rajesh" // default simulated officer ID
            onUpdateComplaint={handleUpdateComplaint}
            onAddUpdateLog={handleAddUpdateLog}
            setPage={navigateTo}
            setSelectedTrackedId={setSelectedTrackedId}
            setTrackingInput={setTrackingInput}
          />
        )}

        {(page === 'dept-portal' || page === 'admin-portal') && (
          <AdminDashboard
            complaints={complaints}
            updates={updates}
            onUpdateComplaint={handleUpdateComplaint}
            onAddUpdateLog={handleAddUpdateLog}
            setPage={navigateTo}
            setSelectedTrackedId={setSelectedTrackedId}
            setTrackingInput={setTrackingInput}
          />
        )}
      </main>

      {/* FLOATING GEMINI CHATBOT HUB */}
      <GeminiChatbot />

      {/* GLOBAL FOOTER CONTRACT */}
      <Footer setPage={navigateTo} />

    </div>
  );
}
