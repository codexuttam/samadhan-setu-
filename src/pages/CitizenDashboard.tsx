import React, { useState } from 'react';
import { Complaint } from '../data/mockData';
import {
  Search,
  Filter,
  Eye,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ListFilter,
  RefreshCw,
} from 'lucide-react';

interface CitizenDashboardProps {
  complaints: Complaint[];
  setPage: (page: string) => void;
  setSelectedTrackedId: (id: string) => void;
  setTrackingInput: (id: string) => void;
}

export default function CitizenDashboard({
  complaints,
  setPage,
  setSelectedTrackedId,
  setTrackingInput,
}: CitizenDashboardProps) {
  const [filterStatus, setFilterStatus] = useState<'All' | 'Submitted' | 'In Progress' | 'Resolved' | 'Closed'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter complaints by citizen 'cit_uttam' (the currently logged in demo citizen)
  const myComplaints = complaints.filter(c => c.citizenId === 'cit_uttam');

  // Compute stats
  const totalCount = myComplaints.length;
  const pendingCount = myComplaints.filter(c => c.status === 'Submitted').length;
  const progressCount = myComplaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  // Filter & Search Logic
  const filteredComplaints = myComplaints.filter(c => {
    const matchesFilter = filterStatus === 'All' || c.status === filterStatus;
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleViewDetails = (id: string) => {
    setTrackingInput(id);
    setSelectedTrackedId(id);
    setPage('track');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Submitted':
        return 'text-amber-600 font-bold';
      case 'In Progress':
        return 'text-blue-600 font-bold';
      case 'Resolved':
        return 'text-emerald-600 font-bold';
      case 'Closed':
        return 'text-slate-500 font-bold';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1B2D]">Good morning, Uttamraj.</h1>
          <p className="text-xs sm:text-sm text-[#64748B]">Here is the operational status of your filed community reports.</p>
        </div>
        <button
          onClick={() => setPage('raise')}
          className="flex items-center gap-1.5 bg-[#F4511E] hover:bg-[#FF6A2A] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Raise New Complaint
        </button>
      </div>

      {/* Overview Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Total Filed</p>
            <p className="text-2xl font-extrabold font-mono text-[#0F1B2D] tabular-nums mt-1">{totalCount}</p>
          </div>
          <div className="p-3 bg-slate-50 text-[#0F1B2D] rounded-lg border border-slate-100">
            <ListFilter className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Pending Routing</p>
            <p className="text-2xl font-extrabold font-mono text-amber-500 tabular-nums mt-1">{pendingCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">In Investigation</p>
            <p className="text-2xl font-extrabold font-mono text-blue-500 tabular-nums mt-1">{progressCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">Action Completed</p>
            <p className="text-2xl font-extrabold font-mono text-emerald-500 tabular-nums mt-1">{resolvedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
        
        {/* Table Filters & Search */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Segmented active filters (Interative Buttons allowed) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start">
            {(['All', 'Submitted', 'In Progress', 'Resolved', 'Closed'] as const).map((status) => {
              const isActive = filterStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-[#0F1B2D] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {status === 'Submitted' ? 'Pending' : status}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:max-w-xs text-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, address..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F4511E] text-[#0F172A]"
            />
          </div>
        </div>

        {/* Complaints Data Grid */}
        <div className="overflow-x-auto">
          {filteredComplaints.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-full inline-block border border-slate-100">
                <AlertTriangle className="w-8 h-8 mx-auto" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#0F1B2D]">No complaints found</p>
                <p className="text-xs text-[#64748B]">Try updating your status filters or inputting a different search keyword.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3 px-5">Complaint ID</th>
                  <th className="py-3 px-5">Issue Details</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Date Filed</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Complaint ID */}
                    <td className="py-4 px-5 font-mono font-bold text-[#0F1B2D] tracking-wider">
                      {complaint.id}
                    </td>

                    {/* Issue Subcategory & Title */}
                    <td className="py-4 px-5 max-w-xs">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#0F172A] truncate">{complaint.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Category: {complaint.subcategory}</p>
                      </div>
                    </td>

                    {/* Location Address */}
                    <td className="py-4 px-5">
                      <div className="space-y-0.5">
                        <p className="font-medium text-[#475569] truncate max-w-[180px]">{complaint.address}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Dwarka, Delhi</p>
                      </div>
                    </td>

                    {/* Submission Date */}
                    <td className="py-4 px-5 font-mono text-[#64748B] tabular-nums">
                      {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-5 font-semibold">
                      <span className={getStatusStyle(complaint.status)}>
                        {complaint.status === 'Submitted' ? 'Pending Routing' : complaint.status}
                      </span>
                    </td>

                    {/* Actions button */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleViewDetails(complaint.id)}
                        className="inline-flex items-center gap-1.5 bg-white border border-[#E5E7EB] hover:bg-[#0F1B2D] hover:text-white hover:border-[#0F1B2D] px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#0F172A] transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
