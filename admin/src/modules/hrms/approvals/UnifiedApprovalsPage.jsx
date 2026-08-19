import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  X,
  Clock,
  Calendar as CalendarIcon,
  AlertTriangle,
  Building2,
  Users2,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  Heart,
  Plane,
  Leaf,
  Info,
  RotateCcw,
  Scale,
  BellRing,
  CreditCard,
  Receipt,
  ArrowUpRight,
  ExternalLink,
  Filter,
  FileText,
  DollarSign,
  CalendarDays
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useGetAllRequestsQuery,
  useProcessActionMutation
} from "@/services/hrms/workflow.api.js";
import { 
  useGetSettlementPreviewQuery, 
  useFinalizeSettlementMutation 
} from "@/services/hrms/termination.api.js";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api.js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatDate } from '@/lib/utils';
import { cn } from "@/lib/utils";
import Pagination from "@/components/ui/pagination";

/* ─── Module Helpers ─────────────────────────────────────────── */

const getStatusBadge = (status = '') => {
  const s = status.toUpperCase();
  if (s === 'PENDING') return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: Clock, label: 'Pending' };
  if (s === 'APPROVED') return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2, label: 'Approved' };
  if (s === 'REJECTED') return { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle, label: 'Rejected' };
  return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200', icon: Info, label: s };
};

const getModuleIcon = (module = '') => {
  const icons = {
    'LEAVE': Plane,
    'PERMISSION': Clock,
    'LOAN': CreditCard,
    'EXPENSE': Receipt,
    'INCENTIVE': ArrowUpRight,
    'PAYROLL': LayoutGrid,
    'ATTENDANCE': CalendarDays,
    'TERMINATION': Users2,
  };
  return icons[module] || FileText;
};

const getModuleColors = (module = '') => {
  const colors = {
    'LEAVE': { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    'PERMISSION': { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    'LOAN': { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
    'EXPENSE': { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
    'INCENTIVE': { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' },
    'PAYROLL': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'ATTENDANCE': { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    'TERMINATION': { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  };
  return colors[module] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
};

const getModuleLabel = (module = '') => {
  const labels = {
    'LEAVE': 'Leave Request',
    'PERMISSION': 'Permission',
    'LOAN': 'Loan Request',
    'EXPENSE': 'Expense Reimbursement',
    'INCENTIVE': 'Bonus/Incentive',
    'PAYROLL': 'Monthly Payroll Run',
    'ATTENDANCE': 'Attendance Regularization',
    'TERMINATION': 'Exit / Termination',
  };
  return labels[module] || module;
};

const getVerificationLink = (module, entity) => {
  const links = {
    'PAYROLL': `/hrms/payroll/process?month=${entity?.period}`,
    'LEAVE': `/hrms/leave/requests`,
    'PERMISSION': `/hrms/leave/permission`,
    'EXPENSE': `/hrms/expense/dashboard`,
    'LOAN': `/hrms/payroll/loans`,
    'INCENTIVE': `/hrms/payroll/bonus`,
    'ATTENDANCE': `/hrms/attendance/reports`,
  };
  return links[module] || '#';
};

const ModuleBadge = ({ module }) => {
  const Icon = getModuleIcon(module);
  const { bg, text, border } = getModuleColors(module);
  const label = getModuleLabel(module);
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border', bg, text, border)}>
      <Icon size={12} />
      {label}
    </span>
  );
};

const WorkflowProgress = ({ currentLevel, totalLevels, levelName, status }) => {
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';
  const percentage = isApproved ? 100 : (currentLevel / totalLevels) * 100;
  
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 shadow-sm min-w-[150px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
          {isApproved ? 'Workflow Completed' : isRejected ? 'Rejected' : `Step ${currentLevel} of ${totalLevels}`}
        </span>
        <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-700",
              isApproved ? "bg-emerald-500" : isRejected ? "bg-rose-500" : "bg-blue-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <p className={cn(
        "text-[10px] font-extrabold flex items-center gap-1.5 leading-none",
        isApproved ? "text-emerald-700" : isRejected ? "text-rose-700" : "text-blue-700"
      )}>
        {!isApproved && !isRejected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
        {isApproved && <CheckCircle2 size={12} />}
        {isRejected && <XCircle size={12} />}
        <span className="truncate" title={isApproved ? 'Fully Approved' : isRejected ? 'Rejected' : levelName}>
          {isApproved ? 'Fully Approved' : isRejected ? 'Rejected' : `${levelName} Pending`}
        </span>
      </p>
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────────── */

export const UnifiedApprovalsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedReq, setSelectedReq] = useState(null);
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState(null);

  const { data: allRequestsData, isLoading: requestsLoading } = useGetAllRequestsQuery({
    page: currentPage,
    limit: pageSize,
    module: moduleFilter,
    search: searchQuery,
    deptId: deptFilter
  });
  const { data: deptsData } = useGetAllDepartmentsQuery();
  const [processAction, { isLoading: processing }] = useProcessActionMutation();
  const [finalizeSettlement, { isLoading: finalizing }] = useFinalizeSettlementMutation();

  const allRequests = useMemo(() => allRequestsData?.data || [], [allRequestsData]);
  const pagination = useMemo(() => allRequestsData?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }, [allRequestsData]);

  // Reset page when filters change
  const handleModuleChange = (module) => {
    setModuleFilter(module);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleDeptChange = (deptId) => {
    setDeptFilter(deptId);
    setCurrentPage(1);
  };
  const departments = useMemo(() => deptsData?.data || [], [deptsData]);

  // Module counts
  const moduleCounts = useMemo(() => {
    const counts = {};
    allRequests.forEach(req => {
      counts[req.module] = (counts[req.module] || 0) + 1;
    });
    return counts;
  }, [allRequests]);

  // Use allRequests directly since filtering is now server-side
  const requestsToDisplay = allRequests;

  // Action handler
  const handleAction = async (requestId, action) => {
    if (action === 'REJECTED' && !comment.trim())
      return toast.error('Comment is required for rejection');

    const idToUse = requestId || selectedReq?.requestId || selectedReq?.id;
    if (!idToUse) {
      
      return toast.error('Request ID not found. Please try again.');
    }

    try {
      await processAction({ id: idToUse, action, comments: comment }).unwrap();
      toast.success(`Request ${action.toLowerCase()} successfully`);
      setSelectedReq(null);
      setComment('');
    } catch (e) {
      const errorMessage = e?.data?.message || 'Failed to process request';
      toast.error(errorMessage);
    }
  };

  // Helper to get entity from row
  const entity = (req) => req?.entityDetails || req || {};

  // Module filter options
  const moduleOptions = [
    { value: 'all', label: 'All Modules', count: allRequests.length },
    { value: 'LEAVE', label: 'Leave', count: moduleCounts.LEAVE || 0 },
    { value: 'PERMISSION', label: 'Permission', count: moduleCounts.PERMISSION || 0 },
    { value: 'LOAN', label: 'Loan', count: moduleCounts.LOAN || 0 },
    { value: 'EXPENSE', label: 'Expense', count: moduleCounts.EXPENSE || 0 },
    { value: 'INCENTIVE', label: 'Incentive', count: moduleCounts.INCENTIVE || 0 },
    { value: 'PAYROLL', label: 'Payroll', count: moduleCounts.PAYROLL || 0 },
    { value: 'ATTENDANCE', label: 'Attendance', count: moduleCounts.ATTENDANCE || 0 },
  ];

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Review and take action on all pending requests across modules.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Count removed */}
          </div>
        </div>

        {/* ── Module Filter Tabs ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {moduleOptions.map(({ value, label }) => {
              const isActive = moduleFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => handleModuleChange(value)}
                  style={isActive ? { backgroundColor: '#4f46e5', color: '#ffffff' } : {}}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    !isActive && 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {label}
                </button>
              );
            })}
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
                  onChange={e => handleDeptChange(e.target.value)}
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
                  onChange={handleSearchChange}
                  placeholder="Search by name or employee ID..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-400 text-gray-700"
                />
              </div>
            </div>

            {/* Reset */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</label>
              <button
                onClick={() => { setSearchQuery(''); setDeptFilter('all'); setModuleFilter('all'); setCurrentPage(1); }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 whitespace-nowrap transition-colors"
              >
                <RotateCcw size={14} />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800">
              All Approvals
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Employee', 'Module', 'Details', 'Applied On', 'Status', 'Actions'].map(h => (
                    <th key={h} className={cn(
                      "px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-left",
                      h === 'Actions' && 'text-right'
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requestsLoading ? (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">Loading requests…</td></tr>
                ) : requestsToDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <Users2 size={48} />
                        <p className="text-sm font-semibold">No approvals found</p>
                      </div>
                    </td>
                  </tr>
                ) : requestsToDisplay.map((req, idx) => {
                  const r = entity(req);
                  const verificationLink = getVerificationLink(req.module, r);

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
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

                      {/* Module */}
                      <td className="px-5 py-4">
                        <ModuleBadge module={req.module} />
                      </td>

                      {/* Details */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {req.module === 'PERMISSION' ? (
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
                              <p className={cn(
                                "text-[10px] font-bold mt-1 uppercase tracking-tighter",
                                r.runType === 'INDIVIDUAL' ? "text-purple-600" : "text-blue-600"
                              )}>
                                {r.runType === 'INDIVIDUAL' ? 'Individual Settlement' : 'Bulk Approval Batch'}
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
                          ) : req.module === 'ATTENDANCE' ? (
                            <>
                              <p className="text-sm text-gray-700 font-medium whitespace-nowrap">
                                {formatDate(r.date)}
                              </p>
                              <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase">
                                Regularization Request
                              </p>
                            </>
                          ) : req.module === 'TERMINATION' ? (
                            <>
                              <p className="text-sm text-gray-700 font-medium whitespace-nowrap">
                                {formatDate(r.terminationDate)}
                              </p>
                              <p className="text-[10px] font-bold text-rose-600 mt-1 uppercase">
                                Last Working Day (LWD)
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
                        </div>
                      </td>

                      {/* Applied On */}
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-700 whitespace-nowrap font-medium">{formatDate(req.appliedAt || r.createdAt)}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Recorded System Entry</p>
                          </div>
                          
                          <WorkflowProgress 
                            currentLevel={req.currentLevel} 
                            totalLevels={req.totalLevels} 
                            levelName={req.levelName} 
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {(() => {
                            const { bg, text, border, icon: StatusIcon, label } = getStatusBadge(req.status);
                            return (
                              <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-tighter', bg, text, border)}>
                                <StatusIcon size={12} />
                                {label}
                              </span>
                            );
                          })()}
                          {req.module === 'TERMINATION' && req.status === 'APPROVED' && r.terminationStatus === 'SETTLEMENT_PENDING' && (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase tracking-widest animate-pulse">
                              Settlement Pending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Verification Link */}
                      <td className="px-5 py-4">
                        {verificationLink !== '#' && (
                          <Link
                            to={verificationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <ExternalLink size={12} />
                            Verify Details
                          </Link>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {req.status === 'PENDING' && req.isNaturalApprover ? (
                            <>
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
                            </>
                          ) : (
                            <button
                              onClick={() => setSelectedReq(req)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                              <Info size={12} /> Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer / Pagination */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/40">
            <Pagination 
              pagination={pagination}
              onPageChange={setCurrentPage}
              isLoading={requestsLoading}
            />
          </div>
        </div>

        {/* ── Info Banner ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex items-center gap-2 shrink-0">
            <Info size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-gray-800">Unified Approval System</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 flex-1">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                <Scale size={16} className="text-blue-600" />
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                All pending requests from different modules are aggregated here.<br />
                Use "Verify Details" to review source data before approval.
              </p>
            </div>

            <div className="flex items-start gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                <BellRing size={16} className="text-blue-600" />
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Post-approval actions are automatic.<br />
                Employees will be notified on their ESS Dashboard.
              </p>
            </div>
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
              <h2 className="text-base font-extrabold text-gray-900 tracking-tight">Approval Details</h2>
              <button
                onClick={() => { setSelectedReq(null); setComment(''); }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-rose-50 transition-all"
              >
                <span className="text-2xl font-bold text-rose-600 leading-none" style={{ fontFamily: 'sans-serif' }}>&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-6 space-y-8">
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

                {/* Module Badge */}
                <div>
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Module</label>
                  <ModuleBadge module={selectedReq.module} />
                </div>

                {/* Workflow Progress */}
                {selectedReq.workflowLevels?.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">Approval Hierarchy</p>
                    <div className="relative space-y-4 pl-3">
                      {/* Vertical connector line */}
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
                      
                      {selectedReq.workflowLevels.map((lvl, idx) => {
                        const levelNum = lvl.levelNumber || (idx + 1);
                        const isCompleted = selectedReq.status === 'APPROVED' || levelNum < selectedReq.currentLevel;
                        const isActive = selectedReq.status === 'PENDING' && levelNum === selectedReq.currentLevel;
                        const isPending = levelNum > selectedReq.currentLevel && selectedReq.status !== 'REJECTED';
                        const isRejected = selectedReq.status === 'REJECTED' && levelNum === selectedReq.currentLevel;

                        return (
                          <div key={idx} className="relative flex items-start gap-4">
                            {/* Connector dot */}
                            <div className={cn(
                              "relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0",
                              isCompleted ? "bg-emerald-500 text-white" :
                              isActive ? "bg-blue-600 text-white" :
                              isRejected ? "bg-rose-500 text-white" :
                              "bg-slate-200 text-slate-400"
                            )}>
                              {isCompleted ? <Check size={10} /> : 
                               isActive ? <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> :
                               isRejected ? <X size={10} /> :
                               <span className="text-[8px] font-bold">{levelNum}</span>
                              }
                            </div>

                            <div className="flex flex-col gap-0.5">
                              <span className={cn(
                                "text-[11px] font-black uppercase tracking-tight",
                                isActive ? "text-blue-600" : isCompleted ? "text-slate-600" : "text-slate-400"
                              )}>
                                {lvl.levelName}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {lvl.approverType === 'REPORTING_MANAGER' 
                                  ? (lvl.approverName ? `Reporting Manager (${lvl.approverName})` : 'Reporting Manager') 
                                  : (lvl.approverRole || 'System Administrator')}
                              </span>
                            </div>

                            {isActive && (
                              <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-50 text-[8px] font-black text-blue-600 border border-blue-100 uppercase tracking-tighter">
                                Active Stage
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Request Details */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Request Details</p>
                  
                  {selectedReq.module === 'PAYROLL' && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-500">Period</span>
                        <span className="text-xs font-bold text-slate-900">
                          {new Date(`${entity(selectedReq).period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-slate-500">Type</span>
                        <span className={cn(
                          "text-xs font-bold",
                          entity(selectedReq).runType === 'INDIVIDUAL' ? "text-purple-600" : "text-blue-600"
                        )}>
                          {entity(selectedReq).runType === 'INDIVIDUAL' ? 'Individual Settlement' : 'Bulk Payroll Run'}
                        </span>
                      </div>
                    </>
                  )}

                  {(selectedReq.module === 'LOAN' || selectedReq.module === 'EXPENSE' || selectedReq.module === 'INCENTIVE') && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-500">Amount</span>
                        <span className="text-sm font-black text-slate-900">₹{Number(entity(selectedReq).amount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-500">Category</span>
                        <span className="text-xs font-bold text-slate-700">{entity(selectedReq).category || '—'}</span>
                      </div>
                      {selectedReq.module === 'LOAN' && (
                        <div className="flex justify-between items-center py-2">
                          <span className="text-xs text-slate-500">Installments</span>
                          <span className="text-xs font-bold text-slate-700">{entity(selectedReq).installments} EMIs</span>
                        </div>
                      )}
                    </>
                  )}

                  {selectedReq.module === 'PERMISSION' && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-500">Date</span>
                        <span className="text-xs font-bold text-slate-900">{formatDate(entity(selectedReq).date)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-slate-500">Time Slot</span>
                        <span className="text-xs font-bold text-blue-600">{entity(selectedReq).startTime} - {entity(selectedReq).endTime}</span>
                      </div>
                    </>
                  )}

                  {selectedReq.module === 'LEAVE' && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-500">Leave Type</span>
                        <span className="text-xs font-bold text-slate-700">{entity(selectedReq).leaveType}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-500">Period</span>
                        <span className="text-xs font-bold text-slate-900">
                          {formatDate(entity(selectedReq).fromDate)} – {formatDate(entity(selectedReq).toDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-slate-500">Total Days</span>
                        <span className="text-xs font-bold text-blue-600">{entity(selectedReq).totalDays} Days</span>
                      </div>
                    </>
                  )}

                  {selectedReq.module === 'TERMINATION' && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-slate-50">
                        <span className="text-xs text-slate-500">Last Working Day</span>
                        <span className="text-xs font-bold text-rose-600">{formatDate(entity(selectedReq).terminationDate)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-slate-500">Reason Category</span>
                        <span className="text-xs font-bold text-slate-700">Employee Exit</span>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1.5">Reason</span>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {(() => {
                        const rawReason = entity(selectedReq).reason || 'No reason provided';
                        if (rawReason.startsWith('[')) {
                          const parts = rawReason.split('] ');
                          if (parts.length > 1) {
                            const status = parts[0].substring(1);
                            return (
                              <>
                                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 mr-2 uppercase">{status}</span>
                                {parts.slice(1).join('] ')}
                              </>
                            );
                          }
                        }
                        return rawReason;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Verification Link */}
                {getVerificationLink(selectedReq.module, entity(selectedReq)) !== '#' && (
                  <Link
                    to={getVerificationLink(selectedReq.module, entity(selectedReq))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <ExternalLink size={14} />
                    Verify Source Data
                  </Link>
                )}
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/30 space-y-3">
              {selectedReq.status === 'PENDING' ? (
                selectedReq.canApprove ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Comments (Required for Rejection)</label>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add your comments here..."
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none h-20"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleAction(selectedReq?.requestId || selectedReq?.id, 'APPROVED')}
                        disabled={processing}
                        style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                      >
                        <Check size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(selectedReq?.requestId || selectedReq?.id, 'REJECTED')}
                        disabled={processing}
                        style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm rounded-xl transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                      >
                        <X size={16} /> Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center gap-3 text-center">
                    <Clock size={24} className="text-amber-500" />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Awaiting Manager</p>
                      <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                        This request is currently at <b>{selectedReq.levelName}</b>.<br/> 
                        You can take action once it reaches your level.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-3">
                  <p className="text-xs font-bold text-slate-500 text-center uppercase tracking-widest">
                    This request is already {selectedReq.status.toLowerCase()}
                  </p>
                  
                  {/* Settlement Check for Terminations */}
                  {selectedReq.module === 'TERMINATION' && 
                   selectedReq.status === 'APPROVED' && 
                   entity(selectedReq).terminationStatus === 'SETTLEMENT_PENDING' && (
                    <button
                      onClick={() => {
                        setTargetEmployeeId(entity(selectedReq).id);
                        setShowSettlementModal(true);
                      }}
                      style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                      className="w-full flex items-center justify-center gap-2 py-3 font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-100"
                    >
                      <DollarSign size={16} /> Final Closing (Settlement)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Final Settlement Verification Modal ── */}
      {showSettlementModal && targetEmployeeId && (
        <SettlementModal 
          employeeId={targetEmployeeId} 
          onClose={() => {
            setShowSettlementModal(false);
            setTargetEmployeeId(null);
          }}
          onFinalize={async () => {
            try {
              await finalizeSettlement({ employeeId: targetEmployeeId }).unwrap();
              toast.success("Settlement finalized successfully!");
              setShowSettlementModal(false);
              setTargetEmployeeId(null);
              setSelectedReq(null);
            } catch (err) {
              toast.error(err?.data?.message || "Failed to finalize settlement");
            }
          }}
          isFinalizing={finalizing}
        />
      )}
    </div>
  );
};

/* ── Settlement Modal Component ───────────────────────────────── */

const SettlementModal = ({ employeeId, onClose, onFinalize, isFinalizing }) => {
  const navigate = useNavigate();
  const { data: previewData, isLoading } = useGetSettlementPreviewQuery(employeeId);
  
  if (isLoading) return null;
  const data = previewData?.data;

  const isProcessed = !!data?.payroll;
  const isPaid = data?.payroll?.paymentStatus === 'PAID';

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Final Settlement Check</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Verify details before closing termination</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Employee Summary */}
          <div className="flex items-center gap-6 p-6 rounded-3xl bg-blue-50 border border-blue-100">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-200">
              {data?.employee?.name?.[0] || 'E'}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">{data?.employee?.name}</h3>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-tighter mt-1">
                {data?.employee?.empCode} • LWD: {formatDate(data?.employee?.lwd)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Attendance Summary */}
            <div className="space-y-4 p-6 rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600">
                <CalendarIcon size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">Attendance Preview</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Present</p>
                  <p className="text-2xl font-black text-emerald-700">{data?.attendance?.present}</p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Absent</p>
                  <p className="text-2xl font-black text-rose-700">{data?.attendance?.absent}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold text-center">Month: {data?.period}</p>
            </div>

            {/* Payroll Status Quick View */}
            <div className="space-y-4 p-6 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 text-blue-600">
                <DollarSign size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">Payout Overview</h4>
              </div>
              
              {data?.payroll ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Net Final Pay</p>
                    <p className="text-3xl font-black text-blue-700">₹{Number(data.payroll.netPay).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                      data.payroll.paymentStatus === 'PAID' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                    )}>
                      {data.payroll.paymentStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 py-4 text-slate-300">
                  <AlertTriangle size={24} />
                  <p className="text-[9px] font-black uppercase tracking-widest">No Salary Record</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Financial Breakdown (If processed) */}
          {isProcessed && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800">
                <LayoutGrid size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">Financial Breakdown</h4>
              </div>
              
              <div className="bg-slate-900 rounded-[32px] p-8 text-white overflow-hidden relative shadow-2xl">
                {/* Header with Stats */}
                <div className="flex justify-between items-start mb-8">
                   <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Payable Days</p>
                      <p className="text-2xl font-black">{data.payroll.payableDays} <span className="text-sm font-medium text-slate-600">days</span></p>
                   </div>
                   <div className="flex flex-col gap-1 text-right">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Loss of Pay</p>
                      <p className="text-2xl font-black text-rose-500">{data.payroll.lopDays} <span className="text-sm font-medium text-slate-700 text-right">Days</span></p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-slate-800 pt-8">
                   {/* Earnings */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <ArrowUpRight size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Earnings & Add-ons</span>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(data.payroll.earningsBreakdown || {}).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-black text-slate-200">₹{Number(val).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Gross</span>
                        <span className="text-lg font-black text-white">₹{Number(data.payroll.grossSalary).toLocaleString()}</span>
                      </div>
                   </div>

                   {/* Deductions */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 text-rose-400 mb-2">
                        <ArrowUpRight size={14} className="rotate-90" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Deductions & LOP</span>
                      </div>
                      <div className="space-y-3">
                        {Object.entries(data.payroll.deductionsBreakdown || {})
                          .filter(([key, val]) => {
                            const k = key.toLowerCase();
                            // Filter out non-monetary items and employer-side contributions
                            if (k.includes('wages')) return false;
                            if (k.includes('days')) return false;
                            if (k.includes('dates')) return false;
                            if (k.includes('employer')) return false;
                            if (k.includes('charges')) return false;
                            if (k.includes('rawabsent')) return false;
                            // Only show if amount > 0
                            return Number(val) > 0;
                          })
                          .map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-black text-rose-400">₹{Number(val).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Total Deductions</span>
                        <span className="text-lg font-black text-rose-500">₹{Number(data.payroll.totalDeductions).toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                {/* Net Pay Highlight */}
                <div className="mt-8 p-6 rounded-[24px] bg-blue-600 flex justify-between items-center shadow-xl shadow-blue-900/40 border border-blue-400/20">
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Net Disbursed Amount</p>
                      <p className="text-3xl font-black text-white">₹{Number(data.payroll.netPay).toLocaleString()}</p>
                   </div>
                   <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase border backdrop-blur-md",
                      data.payroll.paymentStatus === 'PAID' ? "bg-emerald-400/20 text-emerald-400 border-emerald-400/30" : "bg-amber-400/20 text-amber-400 border-amber-400/30"
                   )}>
                      {data.payroll.paymentStatus}
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Guidance Banner */}
          {!isProcessed ? (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">Payroll Not Processed</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    You cannot finalize the termination because the employee's salary for <b>{data?.period}</b> has not been calculated yet.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/hrms/payroll/process?month=${data?.period}`)}
                className="w-full py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-100"
              >
                Go to Payroll Calculation
              </button>
            </div>
          ) : !isPaid ? (
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <Info size={20} className="text-blue-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">Payment Pending</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Salary is calculated but the disbursement is not yet marked as <b>Paid</b>. 
                    Please complete the payout before final closing.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/hrms/payroll/history`)}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                Go to Payouts & History
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-4 items-start">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                All settlements are verified. You can now officially close the termination process for this employee.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-3 px-6 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onFinalize}
            disabled={isFinalizing || !isPaid}
            style={isPaid ? { backgroundColor: '#10b981', color: '#ffffff' } : { backgroundColor: '#e2e8f0', color: '#94a3b8' }}
            className="flex-[2] py-3 px-6 rounded-2xl font-black text-sm shadow-xl transition-all disabled:cursor-not-allowed"
          >
            {isFinalizing ? "Finalizing..." : "Complete Termination"}
          </button>
        </div>
      </div>
    </div>
  );
};
