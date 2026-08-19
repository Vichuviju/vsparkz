import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  X,
  Clock,
  Calendar as CalendarIcon,
  AlertTriangle,
  RefreshCw,
  Info,
  RotateCcw,
  Building2,
  Users2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  Heart,
  Plane,
  Leaf,
  CreditCard,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import {
  useGetPendingRequestsQuery,
  useProcessActionMutation,
  useProcessBulkActionMutation
} from "@/services/hrms/workflow.api.js";
import {
  useGetAllLeavesQuery
} from "@/services/hrms/leaves.api.js";
import { useGetAllPermissionsQuery } from "@/services/hrms/permission.api.js";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDate } from '@/lib/utils';
import { cn } from "@/lib/utils";

/* ─── Tiny helpers ─────────────────────────────────────────── */

const getLeaveIcon = (type = '', mod = 'LEAVE') => {
  if (mod === 'PERMISSION') return Clock;
  if (mod === 'LOAN') return CreditCard;
  if (mod === 'EXPENSE') return Receipt;
  if (mod === 'INCENTIVE') return ArrowUpRight;
  if (mod === 'PAYROLL') return LayoutGrid;
  if (type.includes('Sick') || type.includes('SL')) return Heart;
  if (type.includes('Casual') || type.includes('CL')) return Leaf;
  return Plane;
};

const getLeaveColors = (type = '', mod = 'LEAVE') => {
  if (mod === 'PERMISSION')
    return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' };
  if (mod === 'LOAN')
    return { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' };
  if (mod === 'EXPENSE')
    return { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' };
  if (mod === 'INCENTIVE')
    return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' };
  if (mod === 'PAYROLL')
    return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
  if (type.includes('Sick') || type.includes('SL'))
    return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' };
  if (type.includes('Casual') || type.includes('CL'))
    return { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' };
  return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' };
};

const LeaveTypeBadge = ({ type, mod }) => {
  const Icon = getLeaveIcon(type, mod);
  const { bg, text, border } = getLeaveColors(type, mod);
  const label = mod === 'PERMISSION' ? 'Permission' : (mod === 'LOAN' ? 'Loan Request' : (mod === 'EXPENSE' ? 'Expense Reimbursement' : (mod === 'INCENTIVE' ? 'Bonus/Incentive' : (mod === 'PAYROLL' ? 'Monthly Payroll Run' : type))));
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border', bg, text, border)}>
      <Icon size={12} />
      {label}
    </span>
  );
};

const StatusPill = ({ status }) => {
  const s = (status || 'PENDING').toUpperCase();
  const map = {
    APPROVED: 'bg-green-100 text-green-700 border border-green-200',
    REJECTED: 'bg-red-100 text-red-600 border border-red-200',
    PENDING:  'bg-orange-100 text-orange-600 border border-orange-200',
    'PARTIALLY APPROVED': 'bg-blue-100 text-blue-600 border border-blue-200',
  };
  return (
    <span className={cn('inline-block px-3 py-1 rounded-md text-xs font-semibold', map[s] || map.PENDING)}>
      {s.charAt(0) + s.slice(1).toLowerCase()}
    </span>
  );
};

/* ─── Main Component ────────────────────────────────────────── */

export const LeaveRequestsPage = () => {
  const [activeTab, setActiveTab]       = useState('pending');
  const [selectedReq, setSelectedReq]   = useState(null);
  const [comment, setComment]           = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [deptFilter, setDeptFilter]     = useState('all');
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');

  const { data: pendingData, isLoading: pendingLoading } = useGetPendingRequestsQuery();
  const { data: allLeavesResult }                         = useGetAllLeavesQuery({ page: 1, limit: 100 });
  const { data: allPermsResult }                          = useGetAllPermissionsQuery({ page: 1, limit: 100 });
  const { data: deptsData }                               = useGetAllDepartmentsQuery();
  const [processAction, { isLoading: processing }]        = useProcessActionMutation();
  const [processBulkAction, { isLoading: processingBulk }] = useProcessBulkActionMutation();

  const [selectedRequestIds, setSelectedRequestIds] = useState([]);

  // Only show LEAVE and PERMISSION requests on this page
  const pendingRequests = useMemo(() => (pendingData || []).filter(r => r.module === 'LEAVE' || r.module === 'PERMISSION'), [pendingData]);
  
  const allLeaves       = useMemo(() => (allLeavesResult?.data || []), [allLeavesResult]);
  const allPerms        = useMemo(() => (allPermsResult?.data || []), [allPermsResult]);
  const departments     = useMemo(() => deptsData?.data    || [], [deptsData]);

  // Combined approved/rejected/all data for display
  const combinedProcessed = useMemo(() => {
    const leaves = allLeaves.map(l => ({ ...l, module: 'LEAVE' }));
    const perms  = allPerms.map(p => ({ ...p, module: 'PERMISSION', leaveType: 'Permission' }));
    return [...leaves, ...perms];
  }, [allLeaves, allPerms]);

  /* counts */
  const stats = useMemo(() => {
    const approved  = combinedProcessed.filter(l => l?.status === 'APPROVED').length;
    const rejected  = combinedProcessed.filter(l => l?.status === 'REJECTED').length;
    const pending   = pendingRequests.length;
    return { pending, approved, rejected, all: combinedProcessed.length };
  }, [pendingRequests, combinedProcessed]);

  /* filtered rows */
  const rows = useMemo(() => {
    let base = [];
    if (activeTab === 'pending') {
      // Only show workflow-managed pending requests (respects workflow rules)
      base = pendingRequests;
    } else if (activeTab === 'all') {
      const norm = pendingRequests
        .filter(r => r?.entityDetails)
        .map(r => ({ 
          ...r.entityDetails, 
          module: r.module,
          requestId: r.requestId, 
          entityId: r.entityId, // Link original leave ID for deduplication
          _isPending: true 
        }));
      
      // Deduplicate by comparing original IDs (entityId) 
      const nIds = new Set(norm.map(p => Number(p.entityId)));
      base = [...norm, ...combinedProcessed.filter(l => !nIds.has(Number(l.id)))];
    } else {
      base = combinedProcessed.filter(l => l?.status === activeTab.toUpperCase());
    }

    return base.filter(req => {
      if (!req) return false;
      const r    = req.entityDetails || req;
      
      // 1. Employee Name/ID Search
      const name = String(r.employeeName || r.employee?.name || '').toLowerCase();
      const id   = String(r.employeeId   || r.userId || '').toLowerCase();
      let matches = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
      
      // 2. Department Filter
      if (deptFilter !== 'all') {
        const dId = String(r.departmentId || r.employee?.departmentId || r.department?.id || '');
        matches = matches && dId === String(deptFilter);
      }

      // 3. Date Range Filter
      if (startDate || endDate) {
        // For leaves, check if the leave period overlaps with the range
        // For permissions, check if the date is within the range
        const reqDateStart = new Date(r.fromDate || r.date || r.createdAt);
        const reqDateEnd = new Date(r.toDate || r.date || r.createdAt);
        
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0,0,0,0);
          matches = matches && reqDateEnd >= s;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23,59,59,999);
          matches = matches && reqDateStart <= e;
        }
      }

      return matches;
    });
  }, [activeTab, pendingRequests, combinedProcessed, searchQuery, deptFilter, startDate, endDate]);


  /* action handler */
  const handleAction = async (requestId, action) => {
    if (action === 'REJECTED' && !comment.trim())
      return toast.error('Comment is required for rejection');
    try {
      await processAction({ id: requestId, action, comments: comment }).unwrap();
      toast.success(`Request ${action.toLowerCase()} successfully`);
      setSelectedReq(null);
      setComment('');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to process request');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedRequestIds.length === 0) return;
    try {
      await processBulkAction({
        ids: selectedRequestIds,
        action,
        comments: `Bulk ${action.toLowerCase()} from unified dashboard`
      }).unwrap();
      toast.success(`Bulk ${action.toLowerCase()} successful`);
      setSelectedRequestIds([]);
    } catch (e) {
      toast.error('Bulk action failed');
    }
  };

  /* helper to get entity from row */
  const entity = (req) => req?.entityDetails || req || {};

  /* ─── TAB CONFIG ─── */
  const tabs = [
    { id: 'pending',  label: 'Pending',  count: stats.pending,  Icon: XCircle,       activeBg: '#ea580c', badgeBg: '#c2410c' },
    { id: 'approved', label: 'Approved', count: stats.approved, Icon: CheckCircle2,  activeBg: '#16a34a', badgeBg: '#15803d' },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, Icon: XCircle,       activeBg: '#dc2626', badgeBg: '#b91c1c' },
    { id: 'all',      label: 'All',      count: stats.all,      Icon: LayoutGrid,    activeBg: '#475569', badgeBg: '#334155' },
  ];

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 font-sans">
      <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-6">
        {/* ── Page Subtitle ── */}
        <div>
          <h2 className="text-lg font-bold text-gray-900">Leave Requests</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and take action on employee leave applications.</p>
        </div>

        {/* ── Status Tabs ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              {tabs.map(({ id, label, count, Icon, activeBg, badgeBg }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                        setActiveTab(id);
                        setSelectedRequestIds([]);
                    }}
                    style={isActive ? { backgroundColor: activeBg, color: '#ffffff' } : {}}
                    className={cn(
                      'flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all',
                      !isActive && 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    <Icon size={16} />
                    {label}
                    <span
                      style={isActive ? { backgroundColor: badgeBg } : {}}
                      className={cn('text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center',
                        isActive ? 'text-white' : 'bg-gray-300 text-gray-600'
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedRequestIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right duration-300">
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 mr-2">
                        {selectedRequestIds.length} Selected
                    </span>
                    <button
                        onClick={() => handleBulkAction('APPROVED')}
                        disabled={processingBulk}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
                    >
                        <Check size={16} /> Bulk Approve
                    </button>
                    <button
                        onClick={() => handleBulkAction('REJECTED')}
                        disabled={processingBulk}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 shadow-sm transition-all disabled:opacity-50"
                    >
                        <X size={16} /> Bulk Reject
                    </button>
                    <button
                        onClick={() => setSelectedRequestIds([])}
                        className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
          </div>
        </div>

        {/* ── Filters Row ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-700"
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">▾</div>
              </div>
            </div>

            {/* Employee Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or employee ID..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-400 text-gray-700"
                />
              </div>
            </div>

            {/* Date Range + Reset */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Range</label>
              <div className="flex gap-2">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-3 pr-2 py-2.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-3 pr-2 py-2.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <button
                  onClick={() => { 
                    setSearchQuery(''); 
                    setDeptFilter('all'); 
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="flex items-center justify-center p-2.5 text-gray-400 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                  title="Reset Filters"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Leave Requests ({rows.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 w-10">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={rows.filter(r => r.canApprove).length > 0 && selectedRequestIds.length === rows.filter(r => r.canApprove).length}
                        onChange={(e) => {
                            if (e.target.checked) {
                                setSelectedRequestIds(rows.filter(r => r.canApprove).map(r => r.requestId));
                            } else {
                                setSelectedRequestIds([]);
                            }
                        }}
                    />
                  </th>
                  {['Employee', 'Type', 'Period & Days', 'Applied On', 'Reason', 'Actions'].map(h => (
                    <th key={h} className={cn(
                      "px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-left",
                      h === 'Actions' && 'text-right'
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingLoading ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">Loading requests…</td></tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <Users2 size={48} />
                        <p className="text-sm font-semibold">No requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : rows.map((req, idx) => {
                  const r          = entity(req);
                  const isPending  = req._isPending || activeTab === 'pending';

                  return (
                    <tr key={idx} className={cn(
                        "hover:bg-gray-50/50 transition-colors",
                        selectedRequestIds.includes(req.requestId) && "bg-blue-50/30"
                    )}>
                      {/* Checkbox */}
                      <td className="px-5 py-4">
                        {isPending && req.canApprove ? (
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                checked={selectedRequestIds.includes(req.requestId)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setSelectedRequestIds(prev => [...prev, req.requestId]);
                                    } else {
                                        setSelectedRequestIds(prev => prev.filter(id => id !== req.requestId));
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-4 h-4" />
                        )}
                      </td>
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-gray-100 shadow-sm shrink-0">
                            <AvatarImage src={`https://avatar.vercel.sh/${r.employeeName}`} />
                            <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
                              {(r.employeeName || '??').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{r.employeeName || r.employee?.name}</p>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{r.employeeId || r.userId?.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-4">
                        <LeaveTypeBadge type={r.leaveType || '—'} mod={req.module || (r.leaveType ? 'LEAVE' : 'PERMISSION')} />
                      </td>

                      {/* Period & Days / Slot / Amount */}
                      <td className="px-5 py-4">
                        { (req.module === 'PERMISSION' || r.date) ? (
                          <>
                            <p className="text-sm text-gray-700 font-medium whitespace-nowrap">
                              {formatDate(r.date)} 
                            </p>
                            <p className="text-[11px] font-bold text-blue-600 mt-1 uppercase">
                              Slot: {r.startTime} - {r.endTime}
                            </p>
                          </>
                        ) : req.module === 'PAYROLL' ? (
                            <>
                                <p className="text-sm text-gray-900 font-black whitespace-nowrap">
                                    {new Date(`${r.period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tighter">
                                    Bulk Approval Batch
                                </p>
                            </>
                        ) : (req.module === 'LOAN' || req.module === 'EXPENSE' || req.module === 'INCENTIVE') ? (
                          <>
                            <p className="text-sm text-gray-900 font-black whitespace-nowrap">
                              ₹{Number(r.amount).toLocaleString()}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-tighter">
                              {req.module === 'LOAN' ? `${r.installments} EMIs` : (req.module === 'INCENTIVE' ? r.period : r.category)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700 font-medium whitespace-nowrap">
                              {formatDate(r.fromDate)} – {formatDate(r.toDate)}
                            </p>
                            <p className="text-xs font-semibold text-blue-600 mt-0.5">{r.totalDays || '1.0'} Days</p>
                          </>
                        )}
                      </td>

                      {/* Applied On & Workflow Stage */}
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-700 whitespace-nowrap font-medium">{formatDate(req.appliedAt || r.createdAt)}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Recorded System Entry</p>
                          </div>
                          
                          {/* Workflow Badge - Enhanced for multi-level status */}
                          {isPending && req.totalLevels > 0 && (
                            <div className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 shadow-sm min-w-[150px]">
                              {/* Past Levels Status */}
                              {req.currentLevel > 1 && (
                                <div className="flex items-center gap-2 text-[9px] font-bold text-green-600 uppercase tracking-tight bg-green-50 px-1.5 py-0.5 rounded border border-green-100 w-fit">
                                  <Check size={10} className="stroke-[3]" />
                                  Level {req.currentLevel - 1} Approved
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Step {req.currentLevel} of {req.totalLevels}</span>
                                <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-500 transition-all duration-700" 
                                    style={{ width: `${(req.currentLevel / req.totalLevels) * 100}%` }}
                                  />
                                </div>
                              </div>
                              
                              <p className="text-[10px] font-extrabold text-blue-700 flex items-center gap-1.5 leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="truncate" title={req.approverName || req.levelName}>{req.approverName || req.levelName} Pending</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="text-sm text-gray-500 truncate" title={r.reason}>{r.reason || '—'}</p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {isPending ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedReq(req)}
                              style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shadow-sm hover:opacity-90"
                            >
                              <Check size={12} /> Approve
                            </button>
                            <button
                              onClick={() => setSelectedReq(req)}
                              style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shadow-sm hover:opacity-90"
                            >
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <StatusPill status={r.status} />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/40">
            <p className="text-xs text-gray-400">
              Showing 1 to {rows.length} of {rows.length} {activeTab} requests
            </p>
          </div>
        </div>

      </div>

      {/* ── Approval Decision Sidebar ── */}
      {selectedReq && (
        <div
          className="fixed inset-0 flex items-start justify-end z-[9999] bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) { setSelectedReq(null); setComment(''); } }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Sidebar Panel */}
          <div className="relative z-10 w-full max-w-[400px] h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Requirement Details</h2>
              <button
                onClick={() => { setSelectedReq(null); setComment(''); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-6 space-y-8">
              {/* ... existing body content ... (keeping same as before) */}
              
              {/* Request Summary Section */}
              <div className="space-y-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Request Summary</p>

                {/* Employee Info Card */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                    <AvatarImage src={`https://avatar.vercel.sh/${entity(selectedReq).employeeName}`} />
                    <AvatarFallback className="bg-blue-50 text-blue-600 font-black text-sm">
                      {(entity(selectedReq).employeeName || '??').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-black text-slate-900 leading-tight">{entity(selectedReq).employeeName}</p>
                    <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-tight">
                      {entity(selectedReq).employeeId || entity(selectedReq).userId?.substring(0, 8)} • {entity(selectedReq).department || 'Engineering'}
                    </p>
                  </div>
                </div>

                {/* Workflow Progress (only if multi-level) */}
                {selectedReq.totalLevels > 1 && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Level {selectedReq.currentLevel} of {selectedReq.totalLevels}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[9px] font-black text-blue-700 uppercase tracking-tighter">Active Stage</span>
                    </div>
                    <div className="h-1.5 w-full bg-blue-100/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
                        style={{ width: `${(selectedReq.currentLevel / selectedReq.totalLevels) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-blue-900 font-extrabold mt-3 flex items-center gap-2">
                       <Clock size={12} className="text-blue-500" />
                       Pending: {selectedReq.levelName}
                    </p>
                  </div>
                )}

                {/* Grid Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-1">
                  <div>
                    <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Type</label>
                    {(() => { 
                      const isPerm = selectedReq.module === 'PERMISSION';
                      const { bg, text } = getLeaveColors(entity(selectedReq).leaveType, selectedReq.module); 
                      const Icon = getLeaveIcon(entity(selectedReq).leaveType, selectedReq.module); 
                      return <span className={cn('inline-flex items-center gap-2 text-xs font-black px-3 py-1 rounded-lg border', bg, text, 'border-current/10')}>
                        <Icon size={12} />
                        {isPerm ? 'PERMISSION' : entity(selectedReq).leaveType?.toUpperCase()}
                      </span>; 
                    })()}
                  </div>

                  {selectedReq.module === 'PERMISSION' ? (
                    <>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Date</label>
                        <p className="text-xs font-black text-slate-800 tracking-tight">{formatDate(entity(selectedReq).date)}</p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Time Slot</label>
                        <p className="text-xs font-black text-blue-600 tracking-tight">{entity(selectedReq).startTime} - {entity(selectedReq).endTime}</p>
                      </div>
                    </>
                  ) : (selectedReq.module === 'LOAN' || selectedReq.module === 'EXPENSE' || selectedReq.module === 'INCENTIVE') ? (
                    <>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Amount</label>
                        <p className="text-sm font-black text-slate-900 tracking-tight">₹{Number(entity(selectedReq).amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">
                          {selectedReq.module === 'LOAN' ? 'Installments' : 'Period/Category'}
                        </label>
                        <p className="text-xs font-black text-slate-800 tracking-tight">
                          {selectedReq.module === 'LOAN' ? `${entity(selectedReq).installments} Months` : (entity(selectedReq).period || entity(selectedReq).category)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Date Range</label>
                        <p className="text-xs font-black text-slate-800 tracking-tight">{formatDate(entity(selectedReq).fromDate)} – {formatDate(entity(selectedReq).toDate)}</p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Total Days</label>
                        <p className="text-xs font-black text-slate-800 tracking-tight">{entity(selectedReq).totalDays || '1.0'} Days</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Reason */}
                <div className="pt-2">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">Detailed Reason</label>
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs font-bold text-slate-600 leading-relaxed italic">
                    "{entity(selectedReq).reason || 'No specific reason provided.'}"
                  </div>
                </div>
              </div>

              {/* Internal Comment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    Internal Response Comment
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold italic">Required for Rejection</span>
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Type your feedback for the employee here..."
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Footer Buttons - REDESIGNED STACK */}
            <div className="px-6 py-6 border-t border-gray-100 bg-white/80 backdrop-blur-md space-y-3">
              <button
                onClick={() => handleAction(selectedReq.requestId || selectedReq.id, 'APPROVED')}
                disabled={processing}
                style={{
                  backgroundColor: processing ? '#10b981' : '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px'
                }}
                className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl !bg-emerald-600 !text-white text-sm font-black transition-all hover:!bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98] disabled:opacity-70"
              >
                <Check size={18} strokeWidth={3} /> Approve Request
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(selectedReq.requestId || selectedReq.id, 'REJECTED')}
                  disabled={processing}
                  className="flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-[13px] font-extrabold transition-all hover:bg-rose-100 active:scale-[0.98]"
                >
                  <X size={16} strokeWidth={2.5} /> Reject
                </button>
                <button
                  onClick={() => { setSelectedReq(null); setComment(''); }}
                  className="flex-1 h-11 h-11 rounded-xl bg-slate-100 text-slate-500 text-[13px] font-extrabold transition-all hover:bg-slate-200 active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
