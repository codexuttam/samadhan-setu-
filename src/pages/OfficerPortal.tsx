import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Complaint, Officer, OFFICERS, ComplaintUpdate } from '../data/mockData';
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
} from 'lucide-react';

interface OfficerPortalProps {
  complaints: Complaint[];
  officerId: string; // default e.g. 'off_rajesh'
  onUpdateComplaint: (updated: Complaint) => void;
  onAddUpdateLog: (log: ComplaintUpdate) => void;
  setPage: (page: string) => void;
  setSelectedTrackedId: (id: string) => void;
  setTrackingInput: (id: string) => void;
}

export default function OfficerPortal({
  complaints,
  officerId = 'off_rajesh',
  onUpdateComplaint,
  onAddUpdateLog,
  setPage,
  setSelectedTrackedId,
  setTrackingInput,
}: OfficerPortalProps) {
  const currentOfficer = OFFICERS.find((o) => o.id === officerId) || OFFICERS[0];
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  // Proof states
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionProofPhotoSimulated, setResolutionProofPhotoSimulated] = useState(false);

  // Filter complaints assigned to this officer
  const assignedJobs = complaints.filter((c) => c.assignedOfficerId === officerId);

  // Subsections counts
  const totalJobs = assignedJobs.length;
  const pendingAcceptance = assignedJobs.filter((c) => c.status === 'Assigned').length;
  const inProgressJobs = assignedJobs.filter((c) => c.status === 'In Progress').length;
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
      title: 'Work Order Accepted & In Progress',
      description: `Field Officer ${currentOfficer.name} has accepted the assignment and started repairs.`,
      timestamp: new Date().toISOString(),
      authorName: currentOfficer.name,
      authorRole: 'officer',
    };

    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    toast(`💼 Job ${complaint.id} accepted! Status changed to "In Progress".`);
  };

  const handleResolveJobSubmit = (e: React.FormEvent, complaint: Complaint) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      toast('Please provide a resolution note detailing the repairs done!');
      return;
    }

    const updated: Complaint = {
      ...complaint,
      status: 'Resolved',
      updatedAt: new Date().toISOString(),
      resolutionProof: {
        photoUrl: '', // simulated empty
        note: resolutionNote,
        resolvedAt: new Date().toISOString(),
      },
    };

    const newLog: ComplaintUpdate = {
      id: `up_${Date.now()}`,
      complaintId: complaint.id,
      title: 'Complaint Marked Resolved',
      description: `Grievance has been fixed. Resolution details: "${resolutionNote}". Awaiting citizen verification.`,
      timestamp: new Date().toISOString(),
      authorName: currentOfficer.name,
      authorRole: 'officer',
    };

    onUpdateComplaint(updated);
    onAddUpdateLog(newLog);
    setSelectedJobId(null);
    setResolutionNote('');
    setResolutionProofPhotoSimulated(false);
    toast(`✓ Job ${complaint.id} marked as RESOLVED. Citizen has been notified to verify.`);
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
            MUNICIPAL OPERATIONS BOARD
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D] mt-2">
            Welcome back, {currentOfficer.name}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Department: <strong className="text-[#0F1B2D]">Roads & Infrastructure</strong> · Field Engineer ID: <strong className="text-slate-700 font-mono">{currentOfficer.id}</strong>
          </p>
        </div>

        {/* Short stats summary strip */}
        <div className="flex gap-4 text-xs">
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">My Workload</p>
            <p className="text-lg font-extrabold font-mono text-[#0F1B2D] mt-0.5">{totalJobs}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-amber-500 uppercase">New</p>
            <p className="text-lg font-extrabold font-mono text-amber-600 mt-0.5">{pendingAcceptance}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-2 text-center">
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Resolved</p>
            <p className="text-lg font-extrabold font-mono text-emerald-600 mt-0.5">{resolvedJobs}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Work Orders List (6 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-extrabold uppercase tracking-widest text-[#0F1B2D] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F4511E]" /> Active Field Work Orders ({assignedJobs.filter(j => j.status !== 'Closed').length})
          </h2>

          {assignedJobs.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-[#0F1B2D] text-sm">No active jobs assigned</p>
              <p className="text-xs text-[#64748B]">You are currently caught up with all maintenance requests.</p>
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
                          {job.id} · {job.subcategory}
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
                        {job.status === 'Assigned' ? 'Awaiting Acceptance' : job.status}
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
                          Details
                        </button>

                        {job.status === 'Assigned' && (
                          <button
                            onClick={() => handleAcceptJob(job)}
                            className="bg-[#0F1B2D] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Accept Work Order
                          </button>
                        )}

                        {job.status === 'In Progress' && (
                          <button
                            onClick={() => {
                              setSelectedJobId(isSelected ? null : job.id);
                              setResolutionNote('');
                              setResolutionProofPhotoSimulated(false);
                            }}
                            className="bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors"
                          >
                            Resolve Job
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
                  SUBMIT RESOLUTION PROOF
                </span>
                <h2 className="text-base font-extrabold text-[#0F1B2D] mt-1 truncate">
                  Job {selectedJobObj.id}
                </h2>
                <p className="text-xs text-slate-500 mt-1">{selectedJobObj.subcategory}</p>
              </div>

              <form onSubmit={(e) => handleResolveJobSubmit(e, selectedJobObj)} className="space-y-4 text-xs">
                
                {/* Simulated resolution text proof */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Resolution Work Summary *</label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Write a clear report of repairs made (e.g. Swapped two relays, patched potholes using 3 bags of asphalt mix, verified light poles active)."
                    rows={4}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
                    required
                  />
                </div>

                {/* Simulated photo proof uploader */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Upload Verification Photo *</label>
                  {resolutionProofPhotoSimulated ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between font-bold text-emerald-800">
                      <span>✓ repair_proof_photo.jpg uploaded</span>
                      <button
                        type="button"
                        onClick={() => setResolutionProofPhotoSimulated(false)}
                        className="text-red-500 hover:underline font-normal text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionProofPhotoSimulated(true);
                        toast('📸 Photo proof simulated! A high-resolution post-repair photo is attached.');
                      }}
                      className="border-2 border-dashed border-slate-200 hover:border-[#F4511E] bg-slate-50 rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-[#64748B]"
                    >
                      <Upload className="w-5 h-5 text-[#F4511E]" />
                      <span className="font-bold text-slate-700">Attach Post-Repair Photo</span>
                      <span className="text-[10px] text-slate-400">Click to attach high-quality visual evidence of completion.</span>
                    </button>
                  )}
                </div>

                {/* SLA alert check */}
                <div className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl flex gap-3 text-[#B45309]">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                  <div className="space-y-0.5 leading-snug">
                    <p className="font-bold text-xs text-amber-800">Operational Notice</p>
                    <p className="text-[10px] text-amber-700 font-medium">Resolving this job triggers an instant notification to the citizen to verify. If the citizen is not satisfied, the complaint can be reopened within 48 hours.</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedJobId(null)}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#16A34A] hover:bg-emerald-600 text-white py-2.5 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-colors"
                  >
                    Submit Proof & Resolve
                  </button>
                </div>

              </form>
            </div>
          ) : (
            <div className="bg-slate-100/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <Calendar className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-bold text-[#64748B] text-xs uppercase tracking-wider">No Job Selected</p>
              <p className="text-[11px] text-slate-400">Select an in-progress complaint and click "Resolve Job" to upload post-repair notes and photos.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
