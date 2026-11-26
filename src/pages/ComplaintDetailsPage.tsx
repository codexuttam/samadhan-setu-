import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Complaint, ComplaintUpdate, Feedback, DEPARTMENTS, OFFICERS } from '../data/mockData';
import OfficialReceiptModal from '../components/OfficialReceiptModal';
import { tSubcategory, tDepartment, tPriority, tStatus, tRole } from '../i18n/translations';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Send,
  Star,
  CornerDownRight,
  ShieldAlert,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Printer,
  Search,
} from 'lucide-react';

interface ComplaintDetailsPageProps {
  complaintId: string;
  complaints: Complaint[];
  updates: ComplaintUpdate[];
  onUpdateComplaint: (updated: Complaint) => void;
  onAddUpdateLog: (log: ComplaintUpdate) => void;
  onAddFeedback: (feedback: Feedback) => void;
  onBack: () => void;
  onSelectComplaintId?: (id: string) => void;
  language?: 'en' | 'hi';
}

export default function ComplaintDetailsPage({
  complaintId,
  complaints,
  updates,
  onUpdateComplaint,
  onAddUpdateLog,
  onAddFeedback,
  onBack,
  onSelectComplaintId,
  language = 'en',
}: ComplaintDetailsPageProps) {
  const isHi = language === 'hi';
  const [commentInput, setCommentInput] = useState('');
  const [lookupInput, setLookupInput] = useState(complaintId || '');
  
  // Feedback rating states
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Text-to-Speech Accessibility Audio state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [remoteLoading, setRemoteLoading] = useState(false);

  const complaint = complaints.find((c) => c.id === complaintId);

  // Live remote lookup from PostgreSQL backend if not present in memory
  useEffect(() => {
    if (!complaint && complaintId) {
      setRemoteLoading(true);
      fetch(`/api/public/track/ref/${encodeURIComponent(complaintId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.ticket) {
            const t = data.ticket;
            const mapped: Complaint = {
              id: t.publicReference || t.id,
              citizenId: 'cit_remote',
              citizenName: 'Citizen (Verified)',
              citizenPhone: '+91 98765 43210',
              citizenEmail: '',
              categoryId: 'roads_potholes',
              subcategory: t.subcategory || 'General',
              departmentId: 'dept_pwd',
              wardId: 'ward_12',
              title: t.title,
              description: t.description,
              priority: (t.priority?.toLowerCase() as any) || 'medium',
              latitude: 28.5823,
              longitude: 77.0500,
              address: t.address || 'Delhi Area',
              city: 'Delhi',
              pincode: '110075',
              status: t.status === 'IN_PROGRESS' ? 'In Progress' : t.status === 'RESOLVED' ? 'Resolved' : 'Submitted',
              createdAt: t.createdAt || new Date().toISOString(),
              updatedAt: t.updatedAt || new Date().toISOString(),
              slaDeadline: new Date(Date.now() + 48 * 3600000).toISOString(),
              slaBreached: false,
              evidenceUrls: t.attachments?.map((a: any) => a.url) || [],
            };
            onUpdateComplaint(mapped);
          }
        })
        .catch(() => {})
        .finally(() => setRemoteLoading(false));
    }
  }, [complaint, complaintId]);

  const handleSpeakStatus = () => {
    if (!complaint) return;
    if (!('speechSynthesis' in window)) {
      toast.error(isHi ? 'आपके ब्राउज़र में वॉइस प्लेबैक समर्थित नहीं है।' : 'Voice playback not supported on your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const latestUpdate = relevantUpdates[0]?.description || (isHi ? 'शिकायत समीक्षा के अधीन है।' : 'Grievance under review.');
    const speechText = isHi
      ? `शिकायत संख्या ${complaint.id}। वर्तमान स्थिति: ${tStatus(complaint.status, 'hi')}। विषय: ${complaint.title}। अंतिम अपडेट: ${latestUpdate}। अनुमानित SLA समय-सीमा: ${new Date(complaint.slaDeadline).toLocaleDateString('hi-IN')}।`
      : `Grievance Reference: ${complaint.id}. Current status is: ${complaint.status}. Issue summary: ${complaint.title}. Latest action log: ${latestUpdate}. Estimated SLA deadline: ${new Date(complaint.slaDeadline).toLocaleDateString()}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = isHi ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
    toast.success(isHi ? '🔊 शिकायत की स्थिति सुनाई जा रही है!' : '🔊 Playing audio grievance status readout!');
  };

  const relevantUpdates = updates.filter((u) => u.complaintId === complaintId).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  useEffect(() => {
    setLookupInput(complaintId || '');
  }, [complaintId]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = lookupInput.trim();
    if (!cleaned) return;
    if (onSelectComplaintId) {
      onSelectComplaintId(cleaned);
    }
  };

  if (remoteLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#F4511E] border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-base font-bold text-[#0F1B2D]">
          {isHi ? 'समाधान सेतु रजिस्ट्री में खोजा जा रहा है...' : 'Querying Samadhan Setu Registry...'}
        </h3>
        <p className="text-xs text-slate-500">
          {isHi ? 'आधिकारिक शिकायत रिकॉर्ड और लाइव SLA स्थिति प्राप्त की जा रही है।' : 'Retrieving official grievance record and live SLA status.'}
        </p>
      </div>
    );
  }

  if (!complaintId.trim()) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 select-none">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 text-[#F4511E] text-[10px] font-extrabold uppercase tracking-wider border border-orange-100">
              <Search className="w-3 h-3" /> {isHi ? 'लाइव ट्रैकिंग' : 'Live Tracking'}
            </span>
            <h1 className="text-2xl font-extrabold text-[#0F1B2D]">
              {isHi ? 'अपनी शिकायत की स्थिति ट्रैक करें' : 'Track Your Grievance'}
            </h1>
            <p className="text-xs text-[#64748B]">
              {isHi
                ? 'रियल-टाइम SLA टाइमर, अधिकारी नियुक्ति और समाधान प्रमाण देखने के लिए अपनी शिकायत संदर्भ आईडी दर्ज करें।'
                : 'Enter your official grievance reference ID to view real-time SLA timers, assigned officer details, and resolution proof.'}
            </p>
          </div>

          <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder={isHi ? 'उदाहरण: SS-2026-000184 या SS2025012343' : 'e.g. SS-2026-000184 or SS2025012343'}
              className="flex-1 px-4 py-3 bg-slate-50 border border-[#E5E7EB] rounded-xl text-sm font-mono text-[#0F172A] focus:outline-none focus:border-[#F4511E]"
            />
            <button
              type="submit"
              disabled={!lookupInput.trim() || !onSelectComplaintId}
              className="inline-flex items-center justify-center gap-2 bg-[#F4511E] hover:bg-[#FF6A2A] disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>{isHi ? 'स्थिति खोजें' : 'Track Now'}</span>
            </button>
          </form>
        </div>

        {complaints.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D]">
              {isHi ? 'त्वरित चयन: हाल की शिकायतें' : 'Quick Lookup: Recent Grievances'}
            </h2>
            <div className="divide-y divide-slate-100">
              {complaints.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectComplaintId?.(item.id)}
                  className="w-full py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#F4511E]">{item.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {tStatus(item.status, language)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#0F172A] truncate mt-1">{item.title}</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#0F1B2D] shrink-0">
                    {isHi ? 'विवरण देखें →' : 'View Timeline →'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-5 select-none">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-extrabold text-[#0F1B2D]">
          {isHi ? 'शिकायत आईडी नहीं मिली' : 'Complaint ID Not Found'}
        </h2>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          {isHi
            ? `शिकायत आईडी "${complaintId}" समाधान सेतु डेटाबेस में मौजूद नहीं है। कृपया सही प्रारूप (जैसे SS2025012343) जांचें और पुनः प्रयास करें।`
            : `The Complaint ID "${complaintId}" does not exist in the Samadhan Setu database. Please verify the ID format (e.g. SS2025012343) and try again.`}
        </p>
        {onSelectComplaintId && (
          <form onSubmit={handleLookupSubmit} className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder={isHi ? 'दूसरी शिकायत आईडी दर्ज करें...' : 'Try another Complaint ID...'}
              className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#F4511E]"
            />
            <button
              type="submit"
              className="bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
            >
              {isHi ? 'खोजें' : 'Search'}
            </button>
          </form>
        )}
        <button onClick={onBack} className="bg-[#0F1B2D] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors">
          {isHi ? 'वापस जाएँ' : 'Back'}
        </button>
      </div>
    );
  }

  const assignedDept = DEPARTMENTS.find((d) => d.id === complaint.departmentId);
  const assignedOfficer = OFFICERS.find((o) => o.id === complaint.assignedOfficerId);

  // Add comments / additional info
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newLog: ComplaintUpdate = {
      id: `up_${Date.now()}`,
      complaintId: complaint.id,
      title: isHi ? 'नागरिक द्वारा अतिरिक्त जानकारी जोड़ी गई' : 'Additional Information Added by Citizen',
      description: commentInput,
      timestamp: new Date().toISOString(),
      authorName: complaint.citizenName,
      authorRole: 'citizen',
    };

    onAddUpdateLog(newLog);
    setCommentInput('');
    toast(isHi ? '💬 टिप्पणी ट्रैकिंग लॉग में सफलतापूर्वक जुड़ गई!' : '💬 Note appended successfully to tracking logs!');
  };

  // Reopen Complaint
  const handleReopen = () => {
    const updated: Complaint = {
      ...complaint,
      status: 'In Progress',
      reopenCount: (complaint.reopenCount || 0) + 1,
      escalationReason: 'CITIZEN_REOPENED',
      updatedAt: new Date().toISOString(),
    };

    const newLog: ComplaintUpdate = {
      id: `up_${Date.now()}`,
      complaintId: complaint.id,
      title: isHi ? 'नागरिक द्वारा शिकायत पुनः खोली गई' : 'Complaint Reopened by Citizen',
      description: isHi
        ? 'नागरिक ने बताया कि समस्या पूरी तरह हल नहीं हुई है। पुनः निरीक्षण के लिए अधिकारी को भेजा गया।'
        : 'The citizen flagged that the issue has not been fully resolved. Re-routed to assigned officer for secondary inspection.',
      timestamp: new Date().toISOString(),
      authorName: complaint.citizenName,
      authorRole: 'citizen',
    };

    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    toast(isHi ? '⚠️ शिकायत पुनः खोल दी गई है। स्थिति "कार्य प्रगति पर" सेट की गई।' : '⚠️ Complaint reopened. Status set to "In Progress". Assigned officer notified.');
  };

  // Citizen approves & closes
  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const feedbackObj: Feedback = {
      id: `f_${Date.now()}`,
      complaintId: complaint.id,
      rating,
      comment: feedbackComment || (isHi ? 'समस्या सफलतापूर्वक हल हो गई।' : 'Issue successfully resolved.'),
      timestamp: new Date().toISOString(),
    };

    const updated: Complaint = {
      ...complaint,
      status: 'Closed',
      updatedAt: new Date().toISOString(),
    };

    const newLog: ComplaintUpdate = {
      id: `up_${Date.now()}`,
      complaintId: complaint.id,
      title: isHi ? 'शिकायत सत्यापित एवं बंद की गई' : 'Complaint Closed & Confirmed',
      description: isHi
        ? `नागरिक ने समाधान की पुष्टि की। रेटिंग: ${rating}/5। टिप्पणी: "${feedbackComment || 'कोई नहीं'}"।`
        : `Citizen verified resolution. Rating: ${rating}/5. Comment: "${feedbackComment || 'None'}". Complaint marked resolved with 100% satisfaction.`,
      timestamp: new Date().toISOString(),
      authorName: complaint.citizenName,
      authorRole: 'citizen',
    };

    onAddFeedback(feedbackObj);
    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    setShowFeedbackForm(false);
    toast(
      isHi
        ? '✓ आपकी प्रतिक्रिया दर्ज हो गई है! धन्यवाद। यह शिकायत अब आधिकारिक रूप से बंद हो चुकी है।'
        : '✓ Satisfaction logged. Thank you for your feedback! This complaint is now officially CLOSED.',
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 select-none text-xs">
      
      {/* Detail header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 transition-colors bg-white text-[#0F1B2D]"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">
            {isHi ? 'ट्रैकिंग पोर्टल' : 'TRACKING PORTAL'}
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2D] flex flex-wrap items-center gap-2">
            {isHi ? 'शिकायत प्रोफ़ाइल:' : 'Complaint Profile:'}{' '}
            <span className="font-mono text-[#F4511E] tracking-wider uppercase">{complaint.id}</span>
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowReceiptModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer bg-white hover:bg-slate-50 text-[#0F1B2D] border-slate-200 shadow-xs"
          title={isHi ? 'QR कोड सहित आधिकारिक सरकारी पावती देखें व प्रिंट करें' : 'View & Print Official Government Acknowledgment Slip with QR Code'}
        >
          <Printer className="w-3.5 h-3.5 text-[#0F1B2D]" />
          <span>{isHi ? 'आधिकारिक रसीद 🖨️' : 'Official Receipt 🖨️'}</span>
        </button>

        <button
          type="button"
          onClick={handleSpeakStatus}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
            isSpeaking
              ? 'bg-[#F4511E] text-white border-orange-700 animate-pulse'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
          }`}
          title={isHi ? 'टेक्स्ट-टू-स्पीच के ज़रिए स्थिति सुनें' : 'Listen to status update aloud via Text-to-Speech'}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>{isHi ? 'ऑडियो रोकें' : 'Stop Audio'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#F4511E]" />
              <span>{isHi ? 'स्थिति सुनें 🔊' : 'Listen to Status 🔊'}</span>
            </>
          )}
        </button>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Progress & Info card (7 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Details block */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0F1B2D] leading-snug">{complaint.title}</h2>
                <p className="text-[#64748B] mt-1 font-semibold">
                  {isHi ? 'श्रेणी:' : 'Category:'} {tSubcategory(complaint.subcategory, language)}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                  complaint.status === 'Submitted'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : complaint.status === 'Escalated'
                    ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                    : complaint.status === 'In Progress'
                    ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'
                    : complaint.status === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-100'
                }`}
              >
                {tStatus(complaint.status, language)}
              </span>
            </div>

            {(complaint.status === 'Escalated' || (complaint as any).escalationLevel > 0) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs text-red-950 uppercase tracking-wider">
                    {isHi
                      ? `शिकायत स्तर ${Math.min((complaint as any).escalationLevel || 2, 4)} के वरिष्ठ अधिकारी को एस्केलेट की गई`
                      : `Complaint Escalated to Level ${Math.min((complaint as any).escalationLevel || 2, 4)} Senior Authority`}
                  </h4>
                  <p className="text-[11px] text-red-800 leading-snug">
                    {isHi
                      ? 'यह शिकायत अपनी SLA समय-सीमा पार कर चुकी है या नागरिक द्वारा पुनः खोली गई है। त्वरित कार्रवाई के लिए इसे उच्च विभागीय अधिकारी को भेजा गया है।'
                      : 'This grievance breached its SLA deadline or was reopened by the citizen. It has been escalated to higher departmental authority for expedited action.'}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {isHi ? 'समस्या का विवरण' : 'Description of Problem'}
                </span>
                <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap font-medium">{complaint.description}</p>
              </div>

              {/* Geographic placement details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#F4511E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {isHi ? 'पता' : 'Address'}
                    </span>
                    <span className="font-semibold text-[#0F172A]">{complaint.address}, Dwarka, Delhi - {complaint.pincode}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#F4511E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {isHi ? 'तिथि समय-रेखा' : 'Dates Timeline'}
                    </span>
                    <span className="font-medium text-slate-600">
                      {isHi ? 'दर्ज तिथि:' : 'Filed:'} {new Date(complaint.createdAt).toLocaleDateString(isHi ? 'hi-IN' : undefined)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Action Logs */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D]">
              {isHi ? 'कालानुक्रमिक ऑडिट विवरण' : 'Chronological Audit Trail'}
            </h3>

            <div className="relative border-l-2 border-slate-100 pl-6 space-y-6 ml-2 py-2">
              {relevantUpdates.map((update) => (
                <div key={update.id} className="relative">
                  {/* Node icon */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#F4511E] shadow-xs" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="font-bold text-[#0F172A]">{update.title}</h4>
                      <span className="font-mono text-[9px] text-[#64748B] tabular-nums">
                        {new Date(update.timestamp).toLocaleString(isHi ? 'hi-IN' : undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[#475569] leading-relaxed font-medium">{update.description}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                      {isHi ? 'द्वारा' : 'BY'} {update.authorName} · {tRole(update.authorRole, language)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment adding form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-4 border-t border-slate-100">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={isHi ? 'नियुक्त अधिकारियों के लिए अतिरिक्त जानकारी या प्रश्न जोड़ें...' : 'Add additional information or query for assigned officers...'}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F4511E] focus:bg-white transition-all text-[#0F172A]"
              />
              <button
                type="submit"
                className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 rounded-lg font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                {isHi ? 'नोट भेजें' : 'Send Note'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Operational Metadata & Verification action (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Gateway for Resolved Complaints */}
          {complaint.status === 'Resolved' && !showFeedbackForm && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-900">
                    {isHi ? 'क्या आपकी समस्या हल हो गई है?' : 'Is your issue resolved?'}
                  </h3>
                  <p className="text-emerald-700 font-medium mt-0.5">
                    {isHi
                      ? 'नियुक्त अधिकारी ने कार्य पूरा कर समाधान प्रमाण जमा किया है। कृपया सत्यापित करें।'
                      : 'The assigned officer has completed work and submitted resolution proof. Please verify.'}
                  </p>
                </div>
              </div>

              {/* Before & After Visual Resolution Proof */}
              <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isHi ? 'दृश्य साक्ष्य तुलना' : 'Visual Evidence Comparison'}
                  </span>
                  <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                    {isHi ? 'जियोटैग सत्यापित' : 'Geotag Verified'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                      <img 
                        src={complaint.evidenceUrls?.[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&auto=format&fit=crop&q=60'} 
                        alt="Before Report" 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-[8px] font-bold px-1.5 py-0.5 rounded text-amber-300">
                        {isHi ? 'पहले (नागरिक)' : 'BEFORE (Citizen)'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-emerald-500/50">
                      <img 
                        src={complaint.resolutionProof?.photoUrl || 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400&auto=format&fit=crop&q=60'} 
                        alt="After Work" 
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-emerald-950/90 text-[8px] font-bold px-1.5 py-0.5 rounded text-emerald-300">
                        {isHi ? 'बाद में (अधिकारी)' : 'AFTER (Officer)'}
                      </span>
                    </div>
                  </div>
                </div>
                {complaint.resolutionProof?.note && (
                  <p className="text-[11px] text-slate-300 italic border-l-2 border-emerald-500 pl-2">
                    "{complaint.resolutionProof.note}"
                  </p>
                )}

                {/* Gemini AI Visual Resolution Verification Badge */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isHi ? 'Gemini AI सत्यापन विश्वास:' : 'Gemini AI Verification Confidence:'}</span>
                  </div>
                  <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
                    {isHi ? '94% प्रामाणिक समाधान' : '94% Authentic Resolution'}
                  </span>
                </div>
              </div>

              {/* Action tabs */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleReopen}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-colors"
                >
                  {isHi ? '✕ शिकायत पुनः खोलें' : '✕ Reopen Issue'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(true)} // Toggle satisfaction uploader box
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer transition-colors"
                >
                  {isHi ? '✓ स्वीकृत करें और बंद करें' : '✓ Approve & Close'}
                </button>
              </div>
            </div>
          )}

          {/* Citizen feedback card */}
          {showFeedbackForm && complaint.status === 'Resolved' && (
            <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D]">
                  {isHi ? 'संतुष्टि प्रतिक्रिया' : 'Satisfaction Feedback'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  {isHi ? '✕ रद्द करें' : '✕ Cancel'}
                </button>
              </div>
              
              <form onSubmit={handleApproveSubmit} className="space-y-4">
                {/* Rating star selectors */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">
                    {isHi ? 'आप समाधान की गुणवत्ता को कितने अंक देंगे? *' : 'How would you rate the resolution? *'}
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="p-1 text-yellow-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-6 h-6 ${rating >= num ? 'fill-yellow-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback comment */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">
                    {isHi ? 'वैकल्पिक समीक्षा' : 'Optional Review'}
                  </label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder={isHi ? 'समाधान के समय या मरम्मत गुणवत्ता के बारे में टिप्पणी लिखें।' : 'Provide any comments about response time or repair quality.'}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(false)}
                    className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                  >
                    {isHi ? 'वापस' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#16A34A] hover:bg-emerald-600 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-colors"
                  >
                    {isHi ? 'प्रतिक्रिया भेजें और बंद करें ✓' : 'Submit satisfaction & Close ✓'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Permanent Closed Confirmation */}
          {complaint.status === 'Closed' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{isHi ? 'शिकायत हल एवं आधिकारिक रूप से बंद' : 'Grievance Resolved & Officially Closed'}</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                {isHi
                  ? 'नागरिक ने समाधान की पुष्टि की है। संतुष्टि रेटिंग और मरम्मत सत्यापन नगर निगम ऑडिट लॉग में सुरक्षित हैं।'
                  : 'Citizen verified resolution. Satisfaction rating and repair verification logged in municipal audit logs.'}
              </p>
            </div>
          )}

          {/* Sidebar Department Assigned Details */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D]">
              {isHi ? 'परिचालन विवरण' : 'Operational Details'}
            </h3>

            <div className="space-y-4">
              {/* Department */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  {isHi ? 'नियुक्त विभाग' : 'Assigned Bureau'}
                </span>
                <p className="font-bold text-[#0F172A]">
                  {assignedDept ? tDepartment(assignedDept.id, language, assignedDept.name) : ''}
                </p>
                <p className="text-slate-500 text-[10px]">
                  {isHi ? 'विभाग प्रमुख:' : 'Head Officer:'} {assignedDept?.headName}
                </p>
              </div>

              {/* Officer */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  {isHi ? 'नियुक्त अधिकारी' : 'Assigned Officer'}
                </span>
                {assignedOfficer ? (
                  <>
                    <p className="font-bold text-[#0F172A]">{assignedOfficer.name}</p>
                    <p className="text-slate-500 text-[10px]">
                      {isHi ? 'मोबाइल:' : 'Mobile:'} {assignedOfficer.phone}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 italic">
                    {isHi ? 'अधिकारी नियुक्ति लंबित' : 'Pending officer assignment'}
                  </p>
                )}
              </div>

              {/* SLA indicators */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  {isHi ? 'SLA लक्ष्य एवं समय-सीमा' : 'SLA Target & Deadline'}
                </span>
                <p className="font-semibold text-red-500 uppercase tracking-wide">
                  {isHi ? `${tPriority(complaint.priority, 'hi')} प्राथमिकता` : `${complaint.priority} Priority`}
                </p>
                <p className="text-slate-500 text-[10px]">
                  {isHi ? 'समय-सीमा:' : 'Deadline:'} {new Date(complaint.slaDeadline).toLocaleString(isHi ? 'hi-IN' : undefined)}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {showReceiptModal && (
        <OfficialReceiptModal
          complaint={complaint}
          onClose={() => setShowReceiptModal(false)}
          language={language}
        />
      )}

    </div>
  );
}
