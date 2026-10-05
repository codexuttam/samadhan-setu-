import React, { useState } from 'react';
import toast from 'react-hot-toast';
import ChartCard from '../components/ChartCard';
import {
  Complaint,
  DEPARTMENTS,
  OFFICERS,
  WARDS,
  CATEGORIES,
  ComplaintUpdate,
  computeSLADeadline,
} from '../data/mockData';
import {
  TrendingUp,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Filter,
  Eye,
  UserCheck,
  AlertTriangle,
  FileText,
  BarChart4,
  Briefcase,
  Users,
  Settings,
  X,
} from 'lucide-react';

interface AdminDashboardProps {
  complaints: Complaint[];
  updates: ComplaintUpdate[];
  onUpdateComplaint: (updated: Complaint) => void;
  onAddUpdateLog: (log: ComplaintUpdate) => void;
  setPage: (page: string) => void;
  setSelectedTrackedId: (id: string) => void;
  setTrackingInput: (id: string) => void;
}

export default function AdminDashboard({
  complaints,
  updates,
  onUpdateComplaint,
  onAddUpdateLog,
  setPage,
  setSelectedTrackedId,
  setTrackingInput,
}: AdminDashboardProps) {
  // Navigation subtabs inside admin
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'escalated'>('overview');

  // Filters for complaints list
  const [filterCategory, setFilterCategory] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterEscalationReason, setFilterEscalationReason] = useState('');

  // Selected complaint for administrative action overlay
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [assignDeptId, setAssignDeptId] = useState('');
  const [assignOfficerId, setAssignOfficerId] = useState('');
  const [overridePriority, setOverridePriority] = useState<'low' | 'medium' | 'high' | 'critical' | ''>('');
  const [internalNote, setInternalNote] = useState('');

  // Compute metrics
  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === 'Submitted').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  
  // Rule-based SLA Breached calculation:
  // Breach is true if status is not resolved/closed AND current time is past SLA deadline,
  // or if resolved/closed and resolvedAt was past deadline.
  const slaBreachedCount = complaints.filter((c) => {
    const now = new Date('2026-10-03T13:20:00Z').getTime(); // mocked current date
    const deadline = new Date(c.slaDeadline).getTime();
    if (c.status !== 'Resolved' && c.status !== 'Closed') {
      return now > deadline;
    }
    if (c.resolutionProof) {
      return new Date(c.resolutionProof.resolvedAt).getTime() > deadline;
    }
    return false;
  }).length;

  // Chart Data preparation
  const categoryCounts = CATEGORIES.map((cat) => {
    const count = complaints.filter((c) => c.categoryId === cat.id).length;
    let color = '#2563EB'; // default
    if (cat.id === 'roads_potholes') color = '#F4511E';
    else if (cat.id === 'street_lights') color = '#F59E0B';
    else if (cat.id === 'water_drainage') color = '#3B82F6';
    else if (cat.id === 'garbage_sanitation') color = '#10B981';
    else if (cat.id === 'public_safety') color = '#EF4444';
    return { label: cat.name, value: count, color };
  });

  const wardCounts = WARDS.map((w) => {
    const count = complaints.filter((c) => c.wardId === w.id).length;
    return { label: w.name, value: count, color: '#3B82F6' };
  });

  // Filter logic
  const filteredComplaints = complaints.filter((c) => {
    const matchCat = !filterCategory || c.categoryId === filterCategory;
    const matchWard = !filterWard || c.wardId === filterWard;
    const matchStatus = !filterStatus || c.status === filterStatus;
    const matchPriority = !filterPriority || c.priority === filterPriority;
    return matchCat && matchWard && matchStatus && matchPriority;
  });

  const handleApplyAdminActions = (e: React.FormEvent, complaint: Complaint) => {
    e.preventDefault();

    let updated: Complaint = { ...complaint };
    let logsAdded: ComplaintUpdate[] = [];

    // Department Change
    if (assignDeptId && assignDeptId !== complaint.departmentId) {
      updated.departmentId = assignDeptId;
      const deptName = DEPARTMENTS.find((d) => d.id === assignDeptId)?.name || 'New Dept';
      logsAdded.push({
        id: `up_dept_${Date.now()}`,
        complaintId: complaint.id,
        title: 'Department Reallocated',
        description: `Admins updated routed bureau of the complaint to: "${deptName}".`,
        timestamp: new Date().toISOString(),
        authorName: 'System Admin',
        authorRole: 'super_admin',
        isInternal: true,
      });
    }

    // Officer Allocation
    if (assignOfficerId && assignOfficerId !== complaint.assignedOfficerId) {
      updated.assignedOfficerId = assignOfficerId;
      updated.status = 'Assigned'; // advance status
      const offName = OFFICERS.find((o) => o.id === assignOfficerId)?.name || 'New Officer';
      logsAdded.push({
        id: `up_off_${Date.now()}`,
        complaintId: complaint.id,
        title: 'Field Officer Assigned',
        description: `Admins designated field engineer "${offName}" to investigate and repair the issue.`,
        timestamp: new Date().toISOString(),
        authorName: 'System Admin',
        authorRole: 'super_admin',
      });
    }

    // Priority Change Override
    if (overridePriority && overridePriority !== complaint.priority) {
      updated.priority = overridePriority;
      // Recompute SLA Deadline
      updated.slaDeadline = computeSLADeadline(complaint.createdAt, overridePriority);
      logsAdded.push({
        id: `up_pri_${Date.now()}`,
        complaintId: complaint.id,
        title: 'Priority Tier Overridden',
        description: `Admins overrode grievance priority to: "${overridePriority.toUpperCase()}". SLA target recomputed.`,
        timestamp: new Date().toISOString(),
        authorName: 'System Admin',
        authorRole: 'super_admin',
      });
    }

    // Internal Note
    if (internalNote.trim()) {
      logsAdded.push({
        id: `up_note_${Date.now()}`,
        complaintId: complaint.id,
        title: 'Internal Audit Log Note',
        description: `Admin Note: "${internalNote}"`,
        timestamp: new Date().toISOString(),
        authorName: 'System Admin',
        authorRole: 'super_admin',
        isInternal: true,
      });
    }

    if (logsAdded.length > 0) {
      updated.updatedAt = new Date().toISOString();
      onUpdateComplaint(updated);
      logsAdded.forEach((log) => onAddUpdateLog(log));
      toast(`⚙️ Administrative overrides successfully committed for complaint ${complaint.id}!`);
    }

    // Reset overlay
    setSelectedAdminId(null);
    setAssignDeptId('');
    setAssignOfficerId('');
    setOverridePriority('');
    setInternalNote('');
  };

  const handleDirectDetails = (id: string) => {
    setTrackingInput(id);
    setSelectedTrackedId(id);
    setPage('track');
  };

  const currentAdminSelectedComplaint = complaints.find((c) => c.id === selectedAdminId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none text-xs">
      
      {/* Admin dashboard header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-[#F4511E] bg-orange-50 px-2.5 py-1 rounded-md border border-orange-100 uppercase">
            SUPERIOR ADMINISTRATIVE COMMAND
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D] mt-2">
            Operations & Escalation Command
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Global monitoring, assignment queues, and rule-based SLA breach analytics.
          </p>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 font-bold rounded-md transition-all ${
              activeTab === 'overview' ? 'bg-white text-[#0F1B2D] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-3 py-1.5 font-bold rounded-md transition-all ${
              activeTab === 'complaints' ? 'bg-white text-[#0F1B2D] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Complaints Directory
          </button>
          <button
            onClick={() => setActiveTab('escalated')}
            className={`px-3 py-1.5 font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'escalated' ? 'bg-[#F4511E] text-white shadow-xs' : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Escalated Complaints ({complaints.filter((c) => c.status === 'Escalated' || (c as any).escalationLevel > 0 || (c as any).reopenCount > 0).length})
          </button>
        </div>
      </div>

      {/* OVERVIEW SECTION (CHARTS & COUNTERS) */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Filed</span>
              <p className="text-2xl font-extrabold font-mono text-[#0F1B2D] mt-2">{totalComplaints}</p>
            </div>

            {/* Metric 2 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Pending Assignment</span>
              <p className="text-2xl font-extrabold font-mono text-amber-500 mt-2">{pendingCount}</p>
            </div>

            {/* Metric 3 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">In Investigation</span>
              <p className="text-2xl font-extrabold font-mono text-blue-500 mt-2">{inProgressCount}</p>
            </div>

            {/* Metric 4 */}
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Resolved Cases</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-500 mt-2">{resolvedCount}</p>
            </div>

            {/* Metric 5: SLA Breaches */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider">SLA Overdue/Breached</span>
              <p className="text-2xl font-extrabold font-mono text-red-600 mt-2">{slaBreachedCount}</p>
            </div>

          </div>

          {/* Visual representations charts panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Complaints Over Time Trend" type="line" data={[]} />
            <ChartCard title="Complaints by Ward Load" type="bar" data={wardCounts} />
            <ChartCard title="Distribution Share by Bureau" type="donut" data={categoryCounts} />
          </div>

          {/* SLA Escalation rules card info */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex gap-4 text-[#B45309]">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-amber-800">Automatic SLA Breach Dispatch Mode Active</h3>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                The platform monitors submitted issues. Tickets that exceed their allotted resolution timelines (Critical: 6h, High: 24h, Medium: 48h, Low: 72h) are automatically tagged as "SLA Breached". Overdue tickets highlight in red and appear in priority queues for immediate supervisor overrides.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* COMPLAINTS DIRECTORY LISTING */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Filters Column (3 columns) */}
          <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="font-bold text-[#0F1B2D] uppercase tracking-wider text-xs border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-[#F4511E]" /> Filter Directory
            </h3>

            {/* Category Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Ward Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Ward Area</label>
              <select
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">All Wards</option>
                {WARDS.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Pending Routing</option>
                <option value="Assigned">Officer Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Priority Level</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Data Table Column (9 columns) */}
          <div className="lg:col-span-9 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Grievance / Citizen</th>
                    <th className="py-3 px-4">Ward</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredComplaints.map((c) => {
                    const isSlaBreached = new Date('2026-10-03T13:20:00Z').getTime() > new Date(c.slaDeadline).getTime() && c.status !== 'Resolved' && c.status !== 'Closed';
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-slate-50/50 transition-colors ${
                          isSlaBreached ? 'bg-red-50/25' : ''
                        }`}
                      >
                        {/* ID & Date */}
                        <td className="py-4 px-4 font-mono font-bold text-[#0F1B2D]">
                          <div className="space-y-0.5">
                            <span className="tracking-wider">{c.id}</span>
                            <span className="block text-[9px] text-[#64748B] font-sans font-normal">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>

                        {/* Title & Citizen name */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-[#0F172A] truncate">{c.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Filed by {c.citizenName} · {c.citizenPhone}
                            </p>
                          </div>
                        </td>

                        {/* Ward */}
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {WARDS.find((w) => w.id === c.wardId)?.name.split(' - ')[1] || 'Ward 12'}
                        </td>

                        {/* Bureau */}
                        <td className="py-4 px-4 font-medium text-slate-500">
                          {DEPARTMENTS.find((d) => d.id === c.departmentId)?.name || 'General'}
                        </td>

                        {/* Priority with red warning if SLA breached */}
                        <td className="py-4 px-4 font-semibold">
                          <div className="space-y-1">
                            <span
                              className={`uppercase text-[10px] ${
                                c.priority === 'critical'
                                  ? 'text-red-600'
                                  : c.priority === 'high'
                                  ? 'text-orange-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              {c.priority}
                            </span>
                            {isSlaBreached && (
                              <span className="block text-[9px] font-extrabold text-red-600 uppercase tracking-widest leading-none bg-red-100 px-1 rounded">
                                SLA Breached
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`font-semibold ${
                              c.status === 'Submitted'
                                ? 'text-amber-600'
                                : c.status === 'In Progress'
                                ? 'text-blue-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {c.status === 'Submitted' ? 'Pending' : c.status}
                          </span>
                        </td>

                        {/* Actions buttons */}
                        <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleDirectDetails(c.id)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-[#0F172A]"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAdminId(c.id);
                              setAssignDeptId(c.departmentId);
                              setAssignOfficerId(c.assignedOfficerId || '');
                              setOverridePriority(c.priority);
                            }}
                            className="p-1.5 border border-slate-200 bg-slate-50 hover:bg-[#F4511E] hover:text-white hover:border-[#F4511E] rounded text-[#0F172A]"
                            title="Admin Controls Override"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ESCALATED COMPLAINTS MANAGEMENT SECTION */}
      {activeTab === 'escalated' && (
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex gap-3 items-center">
              <div className="p-3 bg-red-600 text-white rounded-xl shadow-xs">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-red-950">Escalated Grievance Management Hub</h2>
                <p className="text-xs text-red-800 font-medium">
                  Review grievances escalated due to SLA breaches, citizen re-openings, or supervisory manual triggers.
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-xs font-bold">
              <span className="bg-white px-3 py-1.5 rounded-lg border border-red-200 text-red-700">
                Level 1-4 Hierarchy Active
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-extrabold text-[#0F1B2D] uppercase tracking-wider text-xs flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#F4511E]" /> Escalated Complaints Directory
              </h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs"
                >
                  <option value="">All Departments</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={filterEscalationReason}
                  onChange={(e) => setFilterEscalationReason(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value="">All Escalation Triggers</option>
                  <option value="SLA_BREACHED">SLA Breach</option>
                  <option value="CITIZEN_REOPENED">Citizen Reopened</option>
                  <option value="MANUAL">Manual Escalation</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Title / Department</th>
                    <th className="py-3 px-4">Current Authority</th>
                    <th className="py-3 px-4">Escalation Level</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">SLA Status</th>
                    <th className="py-3 px-4">Escalated At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {complaints
                    .filter((c) => c.status === 'Escalated' || (c as any).escalationLevel > 0 || (c as any).reopenCount > 0)
                    .filter((c) => !filterCategory || c.categoryId === filterCategory)
                    .map((c) => {
                      const escLevel = (c as any).escalationLevel || ((c as any).reopenCount ? (c as any).reopenCount + 1 : 1);
                      const escReason = (c as any).escalationReason || ((c as any).reopenCount > 0 ? 'CITIZEN_REOPENED' : 'SLA_BREACHED');
                      const currentOfficer = OFFICERS.find((o) => o.id === c.assignedOfficerId)?.name || 'Ward Officer / Admin';
                      const isBreached = new Date('2026-10-06T00:45:00Z').getTime() > new Date(c.slaDeadline).getTime();

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-[#0F1B2D]">
                            {c.id}
                          </td>
                          <td className="py-4 px-4 max-w-xs">
                            <p className="font-semibold text-[#0F172A] truncate">{c.title}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {DEPARTMENTS.find((d) => d.id === c.departmentId)?.name || 'Public Works'}
                            </p>
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {currentOfficer}
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-md font-bold text-[10px] uppercase">
                              Level {Math.min(escLevel, 4)} {escLevel >= 4 ? '(Max Admin)' : ''}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                                escReason === 'SLA_BREACHED'
                                  ? 'bg-red-100 text-red-700'
                                  : escReason === 'CITIZEN_REOPENED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {escReason.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {isBreached ? (
                              <span className="flex items-center gap-1 font-bold text-red-600">
                                🔴 BREACHED
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-bold text-amber-600">
                                🟡 WARNING
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(c.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleDirectDetails(c.id)}
                              className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-[#0F172A]"
                              title="View Full Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAdminId(c.id);
                                setAssignDeptId(c.departmentId);
                                setAssignOfficerId(c.assignedOfficerId || '');
                                setOverridePriority(c.priority);
                              }}
                              className="px-2.5 py-1 bg-[#F4511E] hover:bg-[#FF6A2A] text-white rounded text-[10px] font-bold uppercase tracking-wider"
                            >
                              Escalate / Reassign
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADMINISTRATIVE OVERRIDES DIALOG DIALOG OVERLAY */}
      {selectedAdminId && currentAdminSelectedComplaint && (
        <div className="fixed inset-0 z-50 bg-[#0F1B2D]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-6">
            
            {/* Modal header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase tracking-wider">
                  ADMIN OVERRIDE DISPATCH PANEL
                </span>
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  Overriding Ticket {currentAdminSelectedComplaint.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAdminId(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-[#0F1B2D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => handleApplyAdminActions(e, currentAdminSelectedComplaint)} className="space-y-4 text-xs">
              
              {/* Dept assignment */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Route to Bureau / Department</label>
                <select
                  value={assignDeptId}
                  onChange={(e) => setAssignDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#0F172A]"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Officer Allocation selection based on matching department */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Designated Field Engineer</label>
                <select
                  value={assignOfficerId}
                  onChange={(e) => setAssignOfficerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#0F172A]"
                >
                  <option value="">-- Assign Available Field Engineer --</option>
                  {OFFICERS.filter((o) => o.departmentId === assignDeptId).map((o) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.status})</option>
                  ))}
                </select>
              </div>

              {/* Priority override */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Priority Override</label>
                <select
                  value={overridePriority}
                  onChange={(e) => setOverridePriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#0F172A]"
                >
                  <option value="">Keep current priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Internal Auditor notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-[#0F1B2D] uppercase tracking-wider">Internal Note / Escalation Reason</label>
                <textarea
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Explain why override was applied (e.g. Citizen requested priority escalation, wrong automatic category routing corrected)."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-xs text-[#0F172A]"
                />
              </div>

              {/* Actions footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAdminId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0F1B2D] rounded-lg font-bold uppercase tracking-wider text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F4511E] hover:bg-[#FF6A2A] text-white rounded-lg font-bold uppercase tracking-wider text-[10px] transition-colors"
                >
                  Save Override Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
