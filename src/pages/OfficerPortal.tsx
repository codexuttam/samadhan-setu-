import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Complaint, OFFICERS, ComplaintUpdate } from '../data/mockData';
import { tSubcategory, tStatus, tDepartment } from '../i18n/translations';
import { getCsrfToken } from '../lib/api';
import {
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  Eye,
  AlertTriangle,
  Send,
  Upload,
  Calendar,
  Layers,
  Crosshair,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface OfficerPortalProps {
  complaints: Complaint[];
  officerId: string; // default e.g. 'off_rajesh'
  onUpdateComplaint: (updated: Complaint) => void;
  onAddUpdateLog: (log: ComplaintUpdate) => void;
  setPage: (page: string) => void;
  setSelectedTrackedId: (id: string) => void;
  setTrackingInput: (id: string) => void;
  language?: 'en' | 'hi';
}

export default function OfficerPortal({
  complaints,
  officerId = 'off_rajesh',
  onUpdateComplaint,
  onAddUpdateLog,
  setPage,
  setSelectedTrackedId,
  setTrackingInput,
  language = 'en',
}: OfficerPortalProps) {
  const isHi = language === 'hi';
  const currentOfficer = OFFICERS.find((o) => o.id === officerId) || OFFICERS[0];
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  // Proof states
  const [resolutionNote, setResolutionNote] = useState('');
  const [proofFile, setProofFile] = useState<{ file: File; previewUrl: string; name: string } | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);

  // Anti-fraud geofencing states
  const [isCheckingGps, setIsCheckingGps] = useState(false);
  const [geofenceStatus, setGeofenceStatus] = useState<{
    verified: boolean;
    distanceMeters: number;
    lat: number;
    lng: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState('');

  const clearProofFile = () => {
    setProofFile((prev) => {
      if (prev?.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return null;
    });
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (proofFile?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(proofFile.previewUrl);
    }
    setProofFile({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    });
    e.target.value = '';
  };

  const verifyOnSiteGps = (job: Complaint) => {
    setIsCheckingGps(true);
    setGpsError('');
    if (!navigator.geolocation) {
      setIsCheckingGps(false);
      setGeofenceStatus(null);
      const msg = isHi
        ? 'इस डिवाइस/ब्राउज़र में GPS जियोलोकेशन उपलब्ध नहीं है। कृपया लोकेशन-सक्षम डिवाइस से प्रयास करें।'
        : 'GPS geolocation is unavailable in this browser. Please verify from a location-enabled device.';
      setGpsError(msg);
      toast.error(msg);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCheckingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const dLat = ((job.latitude - lat) * Math.PI) / 180;
        const dLng = ((job.longitude - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((job.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceMeters = Math.round(6371000 * c);

        const verified = distanceMeters <= 250;
        setGeofenceStatus({ verified, distanceMeters, lat, lng });

        if (verified) {
          toast.success(
            isHi
              ? `📍 जियोफेंस सत्यापित: स्थल से ${distanceMeters} मी (250 मी सीमा के भीतर)`
              : `📍 Geofence Verified: ${distanceMeters}m from site (within 250m perimeter)`,
          );
        } else {
          toast(
            isHi
              ? `⚠️ जियोफेंस चेतावनी: अधिकारी दर्ज स्थान से ${distanceMeters} मी दूर हैं।`
              : `⚠️ Geofence Warning: Officer is ${distanceMeters}m from the recorded complaint location.`,
          );
        }
      },
      (err) => {
        setIsCheckingGps(false);
        setGeofenceStatus(null);
        const msg = isHi
          ? `GPS लोकेशन प्राप्त नहीं हो सकी (${err.message || 'अनुमति अस्वीकृत'})। कृपया स्थान अनुमति दें और पुनः प्रयास करें।`
          : `Unable to acquire GPS location (${err.message || 'permission denied'}). Please allow location access and retry.`;
        setGpsError(msg);
        toast(msg, { icon: '⚠️' });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Filter complaints assigned to this officer
  const assignedJobs = complaints.filter((c) => c.assignedOfficerId === officerId);

  // Subsections counts
  const totalJobs = assignedJobs.length;
  const pendingAcceptance = assignedJobs.filter((c) => c.status === 'Assigned').length;
  const inProgressJobs = assignedJobs.filter((c) => c.status === 'In Progress').length;
  const nearSlaJobs = assignedJobs.filter((c) => c.status === 'Escalated' || (c as any).escalationLevel > 0).length;
  const resolvedJobs = assignedJobs.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;

  const handleAcceptJob = (complaint: Complaint) => {
    const updated: Complaint = {
      ...complaint,
      status: 'In Progress',
      updatedAt: new Date().toISOString(),
    };

    const newLog: ComplaintUpdate = {
      id: `up_${Date.now()}`,
      complaintId: complaint.id,
      title: isHi ? 'कार्य आदेश स्वीकृत एवं प्रगति पर' : 'Work Order Accepted & In Progress',
      description: isHi
        ? `फील्ड अधिकारी ${currentOfficer.name} ने कार्य स्वीकार कर लिया है और मरम्मत शुरू कर दी है।`
        : `Field Officer ${currentOfficer.name} has accepted the assignment and started repairs.`,
      timestamp: new Date().toISOString(),
      authorName: currentOfficer.name,
      authorRole: 'officer',
    };

    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    toast(
      isHi
        ? `💼 कार्य ${complaint.id} स्वीकार किया गया! स्थिति "कार्य प्रगति पर" सेट की गई।`
        : `💼 Job ${complaint.id} accepted! Status changed to "In Progress".`,
    );
  };

  const handleResolveJobSubmit = async (e: React.FormEvent, complaint: Complaint) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      toast(isHi ? 'कृपया की गई मरम्मत का विवरण दर्ज करें!' : 'Please provide a resolution note detailing the repairs done!');
      return;
    }

    setIsSubmittingProof(true);
    const csrf = getCsrfToken();
    if (csrf) {
      try {
        const formData = new FormData();
        formData.append('toStatus', 'WORK_COMPLETED');
        formData.append('resolutionNote', resolutionNote.trim());
        if (geofenceStatus) {
          formData.append('officerLat', String(geofenceStatus.lat));
          formData.append('officerLng', String(geofenceStatus.lng));
        }
        if (proofFile?.file) {
          formData.append('evidence', proofFile.file);
        }
        await fetch(`/api/authority/complaints/${encodeURIComponent(complaint.id)}/transition`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRF-Token': csrf },
          body: formData,
        });
      } catch {
        // Keep local simulator update working seamlessly even when backend/DB is offline
      }
    }

    const geoSummary = geofenceStatus
      ? isHi
        ? ` (जियोफेंस: ${geofenceStatus.distanceMeters} मी ${geofenceStatus.verified ? 'सत्यापित' : 'सीमा से बाहर'})`
        : ` (Geofence: ${geofenceStatus.distanceMeters}m ${geofenceStatus.verified ? 'verified' : 'outside 250m'})`
      : '';

    const updated: Complaint = {
      ...complaint,
      status: 'Resolved',
      updatedAt: new Date().toISOString(),
      resolutionProof: {
        photoUrl: proofFile?.previewUrl || '',
        note: resolutionNote.trim(),
        resolvedAt: new Date().toISOString(),
      },
    };

    const newLog: ComplaintUpdate = {
      id: `up_${Date.now()}`,
      complaintId: complaint.id,
      title: isHi ? 'शिकायत का समाधान दर्ज किया गया' : 'Complaint Marked Resolved',
      description: isHi
        ? `समस्या ठीक कर दी गई है। विवरण: "${resolutionNote.trim()}"${geoSummary}। नागरिक सत्यापन प्रतीक्षित है।`
        : `Grievance has been fixed. Resolution details: "${resolutionNote.trim()}"${geoSummary}. Awaiting citizen verification.`,
      timestamp: new Date().toISOString(),
      authorName: currentOfficer.name,
      authorRole: 'officer',
    };

    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    setSelectedJobId(null);
    setResolutionNote('');
    setProofFile(null);
    setGeofenceStatus(null);
    setGpsError('');
    setIsSubmittingProof(false);
    toast(
      isHi
        ? `✓ कार्य ${complaint.id} हल चिह्नित किया गया। नागरिक को सत्यापन के लिए सूचित कर दिया गया है।`
        : `✓ Job ${complaint.id} marked as RESOLVED. Citizen has been notified to verify.`,
    );
  };

  const handleTrackDirect = (id: string) => {
    setTrackingInput(id);
    setSelectedTrackedId(id);
    setPage('track');
  };

  const selectedJobObj = assignedJobs.find((j) => j.id === selectedJobId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
      
      {/* Officer welcome header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-[#F4511E] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 uppercase">
            {isHi ? 'नगर निगम संचालन बोर्ड' : 'MUNICIPAL OPERATIONS BOARD'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D] mt-2">
            {isHi ? `स्वागत है, ${currentOfficer.name}` : `Welcome back, ${currentOfficer.name}`}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {isHi ? 'विभाग:' : 'Department:'}{' '}
            <strong className="text-[#0F1B2D]">{tDepartment('dept_roads', language, 'Roads & Infrastructure')}</strong> ·{' '}
            {isHi ? 'फील्ड इंजीनियर आईडी:' : 'Field Engineer ID:'}{' '}
            <strong className="text-slate-700 font-mono">{currentOfficer.id}</strong>
          </p>
        </div>

        {/* Short stats summary strip */}
        <div className="flex gap-4 text-xs flex-wrap">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{isHi ? 'मेरा कार्यभार' : 'My Workload'}</p>
            <p className="text-lg font-extrabold font-mono text-[#0F1B2D] mt-0.5">{totalJobs}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase">{isHi ? 'नए कार्य' : 'New'}</p>
            <p className="text-lg font-extrabold font-mono text-amber-600 mt-0.5">{pendingAcceptance}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-red-500 uppercase">{isHi ? 'SLA निकट / एस्केलेटेड' : 'Near SLA / Escalated'}</p>
            <p className="text-lg font-extrabold font-mono text-red-600 mt-0.5">{nearSlaJobs}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">{isHi ? 'समाधान पूर्ण' : 'Resolved'}</p>
            <p className="text-lg font-extrabold font-mono text-emerald-600 mt-0.5">{resolvedJobs}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Work Orders List (6 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold uppercase tracking-widest text-[#0F1B2D] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F4511E]" />
            {isHi
              ? `सक्रिय फील्ड कार्य आदेश (${assignedJobs.filter(j => j.status !== 'Closed').length})`
              : `Active Field Work Orders (${assignedJobs.filter(j => j.status !== 'Closed').length})`}
          </h2>

          {assignedJobs.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-[#0F1B2D] text-sm">
                {isHi ? 'कोई सक्रिय कार्य लंबित नहीं है' : 'No active jobs assigned'}
              </p>
              <p className="text-xs text-[#64748B]">
                {isHi ? 'वर्तमान में सभी रखरखाव अनुरोध पूरे हो चुके हैं।' : 'You are currently caught up with all maintenance requests.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedJobs.map((job) => {
                const isSelected = selectedJobId === job.id;
                return (
                  <div
                    key={job.id}
                    className={`bg-white border rounded-xl p-5 transition-all shadow-xs ${
                      isSelected ? 'border-[#F4511E] ring-1 ring-[#F4511E]' : 'border-[#E5E7EB] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold block tracking-wider uppercase">
                          {job.id} · {tSubcategory(job.subcategory, language)}
                        </span>
                        <h3 className="font-bold text-sm text-[#0F1B2D] mt-1 leading-snug">
                          {job.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border ${
                          job.status === 'Assigned'
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : job.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}
                      >
                        {job.status === 'Assigned'
                          ? isHi ? 'स्वीकृति लंबित' : 'Awaiting Acceptance'
                          : tStatus(job.status, language)}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed mb-4">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100 pt-3">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-[#F4511E]" /> {job.address}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTrackDirect(job.id)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-[11px] font-bold text-slate-700 transition-colors"
                        >
                          {isHi ? 'विवरण' : 'Details'}
                        </button>

                        {job.status === 'Assigned' && (
                          <button
                            onClick={() => handleAcceptJob(job)}
                            className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                          >
                            {isHi ? 'कार्य आदेश स्वीकार करें' : 'Accept Work Order'}
                          </button>
                        )}

                        {job.status === 'In Progress' && (
                          <button
                            onClick={() => {
                              setSelectedJobId(isSelected ? null : job.id);
                              setResolutionNote('');
                              clearProofFile();
                              setGeofenceStatus(null);
                              setGpsError('');
                            }}
                            className="bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                          >
                            {isHi ? 'समाधान दर्ज करें' : 'Resolve Job'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Action details context panel (5 columns) */}
        <div className="lg:col-span-5">
          {selectedJobObj ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                  {isHi ? 'समाधान प्रमाण जमा करें' : 'SUBMIT RESOLUTION PROOF'}
                </span>
                <h2 className="text-base font-extrabold text-[#0F1B2D] mt-1 truncate">
                  {isHi ? `कार्य ${selectedJobObj.id}` : `Job ${selectedJobObj.id}`}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{tSubcategory(selectedJobObj.subcategory, language)}</p>
              </div>

              <form onSubmit={(e) => handleResolveJobSubmit(e, selectedJobObj)} className="space-y-4 text-xs">
                
                {/* Anti-Fraud On-Site Geofence Verification */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F1B2D] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#F4511E]" />
                      {isHi ? 'स्थल जियोफेंस जांच (250 मी)' : 'Field Geofence Check (250m)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => verifyOnSiteGps(selectedJobObj)}
                      disabled={isCheckingGps}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-[10px] font-bold text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {isCheckingGps ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#F4511E]" />
                          <span>{isHi ? 'GPS जांचा जा रहा है...' : 'Checking GPS...'}</span>
                        </>
                      ) : (
                        <>
                          <Crosshair className="w-3 h-3 text-[#F4511E]" />
                          <span>{isHi ? 'मेरा स्थान सत्यापित करें' : 'Verify My Location'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {geofenceStatus ? (
                    geofenceStatus.verified ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {isHi
                            ? `✓ जियोफेंस सत्यापित: स्थल से ${geofenceStatus.distanceMeters} मी दूर। ऑन-साइट उपस्थिति प्रमाणित।`
                            : `✓ Geofence Verified: ${geofenceStatus.distanceMeters}m from site. Official on-site inspection confirmed.`}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {isHi
                            ? `⚠️ दूरी चेतावनी: डिवाइस स्थल से ${geofenceStatus.distanceMeters} मी दूर है। समीक्षा के लिए चिह्नित किया जाएगा।`
                            : `⚠️ Distance Warning: Device is ${geofenceStatus.distanceMeters}m from site. Resolution will be flagged for review.`}
                        </span>
                      </div>
                    )
                  ) : gpsError ? (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{gpsError}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">
                      {isHi
                        ? 'यह प्रमाणित करने के लिए "मेरा स्थान सत्यापित करें" पर टैप करें कि आप मरम्मत स्थल पर मौजूद हैं।'
                        : 'Tap "Verify My Location" to certify that you are physically present at the repair site.'}
                    </p>
                  )}
                </div>

                {/* Simulated resolution text proof */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">
                    {isHi ? 'समाधान कार्य सारांश *' : 'Resolution Work Summary *'}
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder={
                      isHi
                        ? 'की गई मरम्मत का स्पष्ट विवरण लिखें (जैसे: दो रिले बदले गए, 3 बैग डामर मिश्रण से गड्ढा भरा गया, स्ट्रीट लाइट चालू की गई)।'
                        : 'Write a clear report of repairs made (e.g. Swapped two relays, patched potholes using 3 bags of asphalt mix, verified light poles active).'
                    }
                    rows={4}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                    required
                  />
                </div>

                {/* Real post-repair photo proof uploader */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">
                    {isHi ? 'सत्यापन फ़ोटो अपलोड करें *' : 'Upload Verification Photo *'}
                  </label>
                  {proofFile ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between font-bold text-emerald-800">
                        <span className="truncate">✓ {proofFile.name}</span>
                        <button
                          type="button"
                          onClick={clearProofFile}
                          className="text-red-600 hover:underline font-normal text-xs shrink-0 ml-2"
                        >
                          {isHi ? 'हटाएँ' : 'Remove'}
                        </button>
                      </div>
                      <img
                        src={proofFile.previewUrl}
                        alt={isHi ? 'समाधान प्रमाण पूर्वावलोकन' : 'Resolution proof preview'}
                        className="w-full max-h-44 object-cover rounded-lg border border-emerald-200 bg-white"
                      />
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-200 hover:border-[#F4511E] bg-slate-50 rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-[#64748B]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofFileChange}
                        className="hidden"
                      />
                      <Upload className="w-5 h-5 text-[#F4511E]" />
                      <span className="font-bold text-slate-700">
                        {isHi ? 'मरम्मत के बाद की फ़ोटो संलग्न करें' : 'Attach Post-Repair Photo'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isHi ? 'कार्य पूर्ण होने का स्पष्ट दृश्य प्रमाण अपलोड करने के लिए क्लिक करें (JPEG/PNG/WebP)।' : 'Click to upload visual evidence of completed work (JPEG/PNG/WebP).'}
                      </span>
                    </label>
                  )}
                </div>

                {/* SLA alert check */}
                <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3 text-[#B45309]">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                  <div className="space-y-0.5 leading-snug">
                    <p className="font-bold text-xs text-amber-800">{isHi ? 'परिचालन सूचना' : 'Operational Notice'}</p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      {isHi
                        ? 'इस कार्य को हल करने पर नागरिक को तुरंत सत्यापन सूचना भेजी जाएगी। असंतुष्ट होने पर नागरिक 48 घंटे में शिकायत पुनः खोल सकते हैं।'
                        : 'Resolving this job triggers an instant notification to the citizen to verify. If the citizen is not satisfied, the complaint can be reopened within 48 hours.'}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearProofFile();
                      setSelectedJobId(null);
                    }}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                  >
                    {isHi ? 'रद्द करें' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProof}
                    className="flex-1 bg-[#16A34A] hover:bg-emerald-600 disabled:opacity-60 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-colors"
                  >
                    {isSubmittingProof
                      ? isHi
                        ? 'जमा हो रहा है...'
                        : 'Submitting...'
                      : isHi
                      ? 'प्रमाण जमा करें और हल करें'
                      : 'Submit Proof & Resolve'}
                  </button>
                </div>

              </form>
            </div>
          ) : (
            <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <Calendar className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-bold text-[#64748B] text-xs uppercase tracking-wider">
                {isHi ? 'कोई कार्य चयनित नहीं' : 'No Job Selected'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isHi
                  ? 'मरम्मत नोट्स और फ़ोटो अपलोड करने के लिए किसी प्रगतिरत शिकायत पर "समाधान दर्ज करें" चुनें।'
                  : 'Select an in-progress complaint and click "Resolve Job" to upload post-repair notes and photos.'}
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
