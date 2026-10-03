import React, { useState } from 'react';
import { Complaint, ComplaintUpdate, Feedback, DEPARTMENTS, OFFICERS } from '../data/mockData';
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
} from 'lucide-react';

interface ComplaintDetailsPageProps {
  complaintId: string;
  complaints: Complaint[];
  updates: ComplaintUpdate[];
  onUpdateComplaint: (updated: Complaint) => void;
  onAddUpdateLog: (log: ComplaintUpdate) => void;
  onAddFeedback: (feedback: Feedback) => void;
  onBack: () => void;
}

export default function ComplaintDetailsPage({
  complaintId,
  complaints,
  updates,
  onUpdateComplaint,
  onAddUpdateLog,
  onAddFeedback,
  onBack,
}: ComplaintDetailsPageProps) {
  const [commentInput, setCommentInput] = useState('');
  
  // Feedback rating states
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const complaint = complaints.find((c) => c.id === complaintId);
  const relevantUpdates = updates.filter((u) => u.complaintId === complaintId).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 select-none">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-extrabold text-[#0F1B2D]">Complaint ID Not Found</h2>
        <p className="text-xs text-slate-500">The Complaint ID "{complaintId}" does not exist in the Samadhan Setu database. Please verify the ID format (e.g. SS2025012343) and try again.</p>
        <button onClick={onBack} className="bg-[#0F1B2D] text-white px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors">
          Back
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
      title: 'Additional Information Added by Citizen',
      description: commentInput,
      timestamp: new Date().toISOString(),
      authorName: complaint.citizenName,
      authorRole: 'citizen',
    };

    onAddUpdateLog(newLog);
    setCommentInput('');
    alert('💬 Note appended successfully to tracking logs!');
  };

  // Reopen Complaint
  const handleReopen = () => {
    const updated: Complaint = {
      ...complaint,
      status: 'In Progress',
      updatedAt: new Date().toISOString(),
    };

    const newLog: ComplaintUpdate = {
      id: `up_${Date.now()}`,
      complaintId: complaint.id,
      title: 'Complaint Reopened by Citizen',
      description: 'The citizen flagged that the issue has not been fully resolved. Re-routed to assigned officer for secondary inspection.',
      timestamp: new Date().toISOString(),
      authorName: complaint.citizenName,
      authorRole: 'citizen',
    };

    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    alert('⚠️ Complaint reopened. Status set to "In Progress". Assigned officer notified.');
  };

  // Citizen approves & closes
  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const feedbackObj: Feedback = {
      id: `f_${Date.now()}`,
      complaintId: complaint.id,
      rating,
      comment: feedbackComment || 'Issue successfully resolved.',
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
      title: 'Complaint Closed & Confirmed',
      description: `Citizen verified resolution. Rating: ${rating}/5. Comment: "${feedbackComment || 'None'}". Complaint marked resolved with 100% satisfaction.`,
      timestamp: new Date().toISOString(),
      authorName: complaint.citizenName,
      authorRole: 'citizen',
    };

    onAddFeedback(feedbackObj);
    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    setFeedbackSubmitted(true);
    alert('✓ Satisfaction logged. Thank you for your feedback! This complaint is now officially CLOSED.');
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
          <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">TRACKING PORTAL</p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F1B2D] flex flex-wrap items-center gap-2">
            Complaint Profile: <span className="font-mono text-[#F4511E] tracking-wider uppercase">{complaint.id}</span>
          </h1>
        </div>
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
                  Category: {complaint.subcategory}
                </p>
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
                  complaint.status === 'Submitted'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : complaint.status === 'In Progress'
                    ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse'
                    : complaint.status === 'Resolved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-100'
                }`}
              >
                {complaint.status === 'Submitted' ? 'Pending Routing' : complaint.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description of Problem</span>
                <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap font-medium">{complaint.description}</p>
              </div>

              {/* Geographic placement details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#F4511E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Address</span>
                    <span className="font-semibold text-[#0F172A]">{complaint.address}, Amravati - {complaint.pincode}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#F4511E] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Dates Timeline</span>
                    <span className="font-medium text-slate-600">Filed: {new Date(complaint.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Action Logs */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D]">
              Chronological Audit Trail
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
                        {new Date(update.timestamp).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[#475569] leading-relaxed font-medium">{update.description}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#64748B]">
                      BY {update.authorName} · {update.authorRole.replace('_', ' ')}
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
                placeholder="Add additional information or query for assigned officers..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F4511E] focus:bg-white transition-all text-[#0F172A]"
              />
              <button
                type="submit"
                className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-4 rounded-lg font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                Send Note
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Operational Metadata & Verification action (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Gateway for Resolved Complaints */}
          {complaint.status === 'Resolved' && !feedbackSubmitted && (
            <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 shadow-xs space-y-5 animate-pulse">
              <div className="flex gap-2.5 items-start">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-900">Is your issue resolved?</h3>
                  <p className="text-emerald-700 font-medium mt-0.5">The assigned officer has completed work and submitted resolution proof. Please verify.</p>
                </div>
              </div>

              {/* Proof details */}
              {complaint.resolutionProof && (
                <div className="bg-white/90 p-3 rounded-lg border border-emerald-100 space-y-1">
                  <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-bold">Proof note from officer:</span>
                  <p className="text-slate-700 italic font-medium">"{complaint.resolutionProof.note}"</p>
                </div>
              )}

              {/* Action tabs */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleReopen}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                >
                  ✕ Reopen Issue
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackSubmitted(true)} // Toggle satisfaction uploader box
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                >
                  ✓ Approve & Close
                </button>
              </div>
            </div>
          )}

          {/* Citizen feedback card */}
          {feedbackSubmitted && complaint.status === 'Resolved' && (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D]">
                Satisfaction Feedback
              </h3>
              
              <form onSubmit={handleApproveSubmit} className="space-y-4">
                {/* Rating star selectors */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">How would you rate the resolution? *</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="p-1 text-yellow-400 hover:scale-110 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${rating >= num ? 'fill-yellow-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback comment */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Optional Review</label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Provide any comments about response time or repair quality."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#16A34A] hover:bg-emerald-600 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                >
                  Submit satisfaction & Close ✓
                </button>
              </form>
            </div>
          )}

          {/* Sidebar Department Assigned Details */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F1B2D]">
              Operational Details
            </h3>

            <div className="space-y-4">
              {/* Department */}
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Bureau</span>
                <p className="font-bold text-[#0F172A]">{assignedDept?.name}</p>
                <p className="text-slate-500 text-[10px]">Head Officer: {assignedDept?.headName}</p>
              </div>

              {/* Officer */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Officer</span>
                {assignedOfficer ? (
                  <>
                    <p className="font-bold text-[#0F172A]">{assignedOfficer.name}</p>
                    <p className="text-slate-500 text-[10px]">Mobile: {assignedOfficer.phone}</p>
                  </>
                ) : (
                  <p className="text-slate-500 italic">Pending officer assignment</p>
                )}
              </div>

              {/* SLA indicators */}
              <div className="space-y-1 border-t border-slate-100 pt-3">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">SLA Target & Deadline</span>
                <p className="font-semibold text-red-500 uppercase tracking-wide">
                  {complaint.priority} Priority
                </p>
                <p className="text-slate-500 text-[10px]">Deadline: {new Date(complaint.slaDeadline).toLocaleString()}</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
