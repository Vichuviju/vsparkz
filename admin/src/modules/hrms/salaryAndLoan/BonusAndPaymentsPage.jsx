import React, { useState } from "react";
import { Plus, Gift, CreditCard, ChevronDown, CheckCircle2, TrendingUp, AlertCircle, X, Users, Search, Filter, ChevronLeft, ChevronRight, History } from "lucide-react";
import { useGetIncentivesQuery, useCreateIncentiveMutation, useCreateBulkIncentiveMutation } from "@/services/hrms/incentive.api";
import { useGetPendingRequestsQuery, useProcessActionMutation, useProcessBulkActionMutation } from "@/services/hrms/workflow.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const BonusAndPaymentsPage = () => {
    const { data: incentives = [], isLoading } = useGetIncentivesQuery();
    const { data: employeesResponse } = useGetAllEmployeesQuery();
    const employees = employeesResponse?.data || employeesResponse || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [createIncentive, { isLoading: isCreating }] = useCreateIncentiveMutation();
    const [createBulkIncentive, { isLoading: isBulkCreating }] = useCreateBulkIncentiveMutation();

    // Workflow integration - fetch pending requests for current user
    const { data: pendingRequestsData } = useGetPendingRequestsQuery();
    const [processAction, { isLoading: processingAction }] = useProcessActionMutation();
    const [processBulkAction, { isLoading: processingBulk }] = useProcessBulkActionMutation();

    // State for bulk approval selection
    const [selectedRequestIds, setSelectedRequestIds] = useState([]);

    // Build a map of incentive IDs that have pending workflow requests
    const pendingIncentiveRequests = React.useMemo(() => {
        const requests = pendingRequestsData?.data || [];
        return requests
            .filter(req => req.module === 'INCENTIVE')
            .reduce((acc, req) => {
                acc[Number(req.entityId)] = req;
                return acc;
            }, {});
    }, [pendingRequestsData]);

    const pendingIncentiveList = React.useMemo(() => {
        return (pendingRequestsData?.data || []).filter(req => req.module === 'INCENTIVE');
    }, [pendingRequestsData]);



    const handleBulkWorkflowAction = async (action) => {
        if (selectedRequestIds.length === 0) return;
        try {
            await processBulkAction({
                ids: selectedRequestIds,
                action,
                comments: `Bulk ${action.toLowerCase()} from dashboard`
            }).unwrap();
            setSelectedRequestIds([]);
        } catch (error) {
            
        }
    };

    const [formData, setFormData] = useState({ userId: "", type: "Bonus", amount: "", period: "" });
    const [bulkData, setBulkData] = useState({ userIds: [], type: "Bonus", amount: "", period: "" });
    const [bulkSearch, setBulkSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [historyMonth, setHistoryMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [deptFilter, setDeptFilter] = useState("all");
    const { data: deptsData } = useGetAllDepartmentsQuery();
    const departments = React.useMemo(() => deptsData?.data || [], [deptsData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createIncentive(formData).unwrap();
            setIsModalOpen(false);
            setFormData({ userId: "", type: "Bonus", amount: "", period: "" });
        } catch (error) {
            
        }
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (bulkData.userIds.length === 0) return alert("Select at least one employee");
        try {
            await createBulkIncentive(bulkData).unwrap();
            setIsBulkModalOpen(false);
            setBulkData({ userIds: [], type: "Bonus", amount: "", period: "" });
        } catch (error) {
            
        }
    };

    const filteredIncentives = React.useMemo(() => {
        let result = incentives;
        if (historyMonth) {
            result = result.filter(inc => inc.period === historyMonth);
        }
        if (deptFilter !== "all") {
             result = result.filter(inc => {
                 const emp = employees.find(e => e.userId === inc.userId);
                 return emp && String(emp.departmentId) === String(deptFilter);
             });
        }
        return result;
    }, [incentives, historyMonth, deptFilter, employees]);

    const actionableIncentivesInTable = React.useMemo(() => {
        return filteredIncentives.filter(inc => inc.requestId && inc.canApprove);
    }, [filteredIncentives]);

    const totalIncentives = filteredIncentives.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const approvedPayments = filteredIncentives.filter(i => i.status?.toLowerCase() === 'approved').length;

    // Pagination Logic
    const totalPages = Math.ceil(filteredIncentives.length / itemsPerPage);
    const paginatedIncentives = filteredIncentives.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [historyMonth, deptFilter]);

    if (isLoading) {
        return <div className="p-10 text-center text-gray-500">Loading payment records...</div>;
    }

    const filteredEmployeesForBulk = employees.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(bulkSearch.toLowerCase()) ||
        emp.empCode?.toLowerCase().includes(bulkSearch.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm text-gray-500">Manage performance bonuses, festive incentives, and one-time distributions.</p>
                </div>
                <div className="flex gap-3">
                    {selectedRequestIds.length > 0 && (
                        <div className="flex gap-2 mr-2 border-r pr-4 border-gray-200 animate-in slide-in-from-right duration-300">
                             <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                {selectedRequestIds.length} Selected
                            </div>
                            <button
                                onClick={() => handleBulkWorkflowAction('APPROVED')}
                                disabled={processingBulk}
                                style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                                className="flex items-center gap-2 px-4 py-2 !bg-emerald-600 !text-white font-bold rounded-xl hover:!bg-emerald-700 shadow-sm transition-all text-[10px] uppercase disabled:opacity-50"
                            >
                                <CheckCircle2 size={16} /> Bulk Approve
                            </button>
                            <button
                                onClick={() => handleBulkWorkflowAction('REJECTED')}
                                disabled={processingBulk}
                                style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                                className="flex items-center gap-2 px-4 py-2 !bg-rose-600 !text-white font-bold rounded-xl hover:!bg-rose-700 shadow-sm transition-all text-[10px] uppercase disabled:opacity-50"
                            >
                                <X size={16} /> Bulk Reject
                            </button>
                        </div>
                    )}
                    <button className="px-5 py-2 border rounded-xl hover:bg-white text-gray-700 font-bold text-xs uppercase tracking-widest transition-all">History</button>
                    <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 !bg-blue-600 !text-white rounded-xl hover:!bg-blue-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all shadow-blue-100">
                        <Plus size={16} /> New Distribution
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                        <Gift size={120} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Distributed ({historyMonth ? new Date(historyMonth + "-01").toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'All Time'})</p>
                            <p className="text-3xl font-black text-gray-900 tracking-tight">₹{totalIncentives.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Approvals</p>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><AlertCircle size={20} /></div>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{incentives.filter(i => i.status?.toLowerCase() === 'pending').length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Processed successfully</p>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><CheckCircle2 size={20} /></div>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{approvedPayments}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <History size={16} className="text-gray-400" />
                            Recent Distributions
                        </h2>
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 outline-none transition-all">
                                        {deptFilter === "all" ? "All Departments" : departments.find(d => String(d.id) === String(deptFilter))?.name || "Select Dept"}
                                        <ChevronDown size={14} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuItem onClick={() => setDeptFilter("all")}>
                                        All Departments
                                    </DropdownMenuItem>
                                    {departments.map(dept => (
                                        <DropdownMenuItem key={dept.id} onClick={() => setDeptFilter(dept.id)}>
                                            {dept.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <input
                                type="month"
                                value={historyMonth}
                                onChange={(e) => setHistoryMonth(e.target.value)}
                                className="bg-white border rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 focus:ring-2 ring-blue-500 outline-none"
                            />
                            {historyMonth && (
                                <button onClick={() => setHistoryMonth("")} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            checked={actionableIncentivesInTable.length > 0 && selectedRequestIds.length === actionableIncentivesInTable.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRequestIds(actionableIncentivesInTable.map(i => i.requestId));
                                                } else {
                                                    setSelectedRequestIds([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Bonus Type</th>
                                    <th className="px-6 py-4 text-center">Amount</th>
                                    <th className="px-6 py-4 text-center">Month</th>
                                    <th className="px-6 py-4">Created By</th>
                                    <th className="px-6 py-4">Workflow</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-[13px]">
                                {paginatedIncentives.map(inc => (
                                    <tr key={inc.id} className={cn(
                                        "hover:bg-gray-50/50 transition-colors group",
                                        selectedRequestIds.includes(inc.requestId) && "bg-blue-50/30"
                                    )}>
                                        <td className="px-6 py-4">
                                            {inc.requestId && inc.canApprove ? (
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                    checked={selectedRequestIds.includes(inc.requestId)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedRequestIds(prev => [...prev, inc.requestId]);
                                                        } else {
                                                            setSelectedRequestIds(prev => prev.filter(id => id !== inc.requestId));
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-4 h-4" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-[10px]">
                                                    {inc.employeeName?.[0] || 'U'}
                                                </div>
                                                <p className="font-bold text-gray-900 tracking-tight">{inc.employeeName || 'Unknown'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 font-medium">{inc.type}</td>
                                        <td className="px-6 py-4 font-black text-gray-900 text-center">₹{Number(inc.amount).toLocaleString('en-IN')}</td>
                                        <td className="px-6 py-4 text-center">
                                            <p className="text-xs font-bold text-gray-600 tracking-tight">
                                                {inc.period ? new Date(inc.period).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-gray-400 tracking-tight">{inc.creatorName || 'System'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Workflow progress indicator */}
                                            {inc.requestId && inc.status?.toLowerCase() === 'pending' ? (
                                                <div className="flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-gray-50/50 border border-gray-100/50 min-w-[140px] shadow-sm">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                                                            {inc.approverName || inc.levelName || 'Awaiting Approval'}
                                                        </span>
                                                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50">
                                                            Step {inc.currentLevel || 1}/{inc.totalLevels || 1}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 ease-in-out" 
                                                            style={{ width: `${(inc.currentLevel / inc.totalLevels) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Finalized</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex flex-col items-end gap-1.5 justify-center">
                                                <div className="flex items-center gap-2">
                                                    {/* Show workflow approval buttons when current user can approve */}
                                                    {inc.requestId && inc.canApprove && (
                                                        <div className="flex items-center gap-1.5 mr-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    processAction({ id: inc.requestId, action: 'APPROVED' });
                                                                }}
                                                                disabled={processingAction}
                                                                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-50 border border-emerald-100/50"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    processAction({ id: inc.requestId, action: 'REJECTED' });
                                                                }}
                                                                disabled={processingAction}
                                                                className="px-2.5 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all disabled:opacity-50 border border-rose-100/50"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    <span className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex items-center justify-center min-w-[80px]",
                                                        inc.status?.toLowerCase() === 'approved' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                            inc.status?.toLowerCase() === 'rejected' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                                "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse shadow-sm shadow-amber-50"
                                                    )}>
                                                        {inc.status?.toUpperCase() || 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredIncentives.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-20">
                                                <Gift size={48} />
                                                <p className="text-xs font-black uppercase tracking-widest">No recent distributions</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {filteredIncentives.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50/30 border-t flex items-center justify-between">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Showing <span className="text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredIncentives.length)}</span> of <span className="text-gray-900">{filteredIncentives.length}</span> entries
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border !bg-white hover:!bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                                                currentPage === i + 1
                                                    ? "!bg-blue-600 !text-white shadow-lg shadow-blue-100"
                                                    : "!bg-white !text-gray-400 border hover:!bg-gray-50 hover:!text-gray-600"
                                            )}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border !bg-white hover:!bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar: Bulk Distribution Action */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-100 flex flex-col gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <Users size={120} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-black tracking-tight mb-2">Bulk Distribution</h2>
                        <p className="text-blue-100/70 text-sm font-medium leading-relaxed">Instantly reward entire departments or selected teams with a single action.</p>
                    </div>

                    <div className="mt-auto space-y-4 relative z-10">
                        <div className="p-4 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                            <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Efficiency Boost</p>
                            <p className="text-xs font-semibold leading-relaxed text-blue-50">Select multiple employees and assign bonuses in one go.</p>
                        </div>
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="w-full py-4 !bg-white !text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest hover:!bg-blue-50 transition-all shadow-lg active:scale-95"
                        >
                            Distribute in Bulk
                        </button>
                        <p className="text-[9px] text-center text-blue-300 font-bold uppercase tracking-[0.2em]">Scale your Payroll workflow</p>
                    </div>
                </div>
            </div>

            {/* Standard Distribution Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="fixed inset-0 bg-gray-900/60 z-[9999] bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">New Distribution</h2>
                            <p className="text-xs text-gray-400 font-medium">Add a one-time payment for an employee</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Employee</label>
                                <select required value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all">
                                    <option value="">Select Employee...</option>
                                    {employees.map(emp => (
                                        <option key={emp.userId} value={emp.userId}>{emp.firstName} {emp.lastName} ({emp.empCode})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl font-bold text-sm">
                                        <option value="Bonus">Bonus</option>
                                        <option value="Incentive">Incentive</option>
                                        <option value="Arrears">Arrears</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Period</label>
                                    <input required type="month" value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-2.5 rounded-xl font-bold text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bonus Amount (₹)</label>
                                <input required type="number" min="1" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm" placeholder="e.g. 5000" />
                            </div>
                            <button disabled={isCreating} type="submit" className="w-full py-4 !bg-blue-600 !text-white rounded-xl font-black text-xs uppercase tracking-widest hover:!bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100">
                                {isCreating ? "Processing..." : "Submit for Approval"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Distribution Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="fixed inset-0 bg-gray-900/60 z-[9999] bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBulkModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
                        <button onClick={() => setIsBulkModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={20} /></div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">Bulk Distribution</h2>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">Reward multiple employees with the same bonus amount</p>
                        </div>

                        <form onSubmit={handleBulkSubmit} className="space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selection Type</label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border-2 border-blue-500/20">
                                        <Users className="text-blue-600" size={16} />
                                        <span className="text-xs font-black uppercase tracking-widest">Multi-Select</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bonus Type</label>
                                    <select value={bulkData.type} onChange={(e) => setBulkData({ ...bulkData, type: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm">
                                        <option value="Bonus">Performance Bonus</option>
                                        <option value="Festival">Festival Bonus</option>
                                        <option value="Retention">Retention Bonus</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Period</label>
                                    <input required type="month" value={bulkData.period} onChange={(e) => setBulkData({ ...bulkData, period: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Employees ({bulkData.userIds.length} selected)</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by name or code..."
                                            value={bulkSearch}
                                            onChange={(e) => setBulkSearch(e.target.value)}
                                            className="pl-8 pr-4 py-1.5 bg-gray-50 border-none rounded-lg text-xs font-bold w-48 placeholder:font-bold focus:ring-1 ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-100 scrollbar-hide">
                                    {filteredEmployeesForBulk.map(emp => (
                                        <label key={emp.userId} className={cn(
                                            "flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all",
                                            bulkData.userIds.includes(emp.userId)
                                                ? "bg-blue-50 border-blue-200"
                                                : "bg-white border-transparent hover:border-gray-100"
                                        )}>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                checked={bulkData.userIds.includes(emp.userId)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked
                                                        ? [...bulkData.userIds, emp.userId]
                                                        : bulkData.userIds.filter(id => id !== emp.userId);
                                                    setBulkData({ ...bulkData, userIds: ids });
                                                }}
                                            />
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-gray-900 tracking-tight">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{emp.empCode}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount per Employee (₹)</label>
                                <input required type="number" min="1" value={bulkData.amount} onChange={(e) => setBulkData({ ...bulkData, amount: e.target.value })} className="w-full bg-gray-50 border-none px-5 py-4 rounded-2xl font-black text-lg focus:ring-2 ring-blue-500" placeholder="e.g. 5000" />
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-4 border-2 border-gray-100 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">Cancel</button>
                                <button disabled={isBulkCreating || bulkData.userIds.length === 0} type="submit" className="flex-[2] py-4 !bg-blue-600 !text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:!bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100">
                                    {isBulkCreating ? "Processing Bulk..." : `Confirm Distribution (₹${(bulkData.amount * bulkData.userIds.length).toLocaleString('en-IN')})`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

