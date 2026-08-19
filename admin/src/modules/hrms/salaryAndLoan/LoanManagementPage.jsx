import React, { useState, useMemo } from "react";
import { Plus, Users, Landmark, Banknote, CreditCard, ChevronDown, X, Building, CheckCircle2, AlertCircle, History, Check, XCircle } from "lucide-react";
import { useGetAllLoansQuery, useCreateLoanMutation } from "@/services/hrms/loan.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { useGetPendingRequestsQuery, useProcessActionMutation, useProcessBulkActionMutation } from "@/services/hrms/workflow.api";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const LoanManagementPage = () => {
    const { data: loansResponse, isLoading: loansLoading } = useGetAllLoansQuery();
    const loans = loansResponse?.data || loansResponse || [];

    const { data: employeesResponse, isLoading: employeesLoading } = useGetAllEmployeesQuery();
    const employees = employeesResponse?.data || employeesResponse || [];

    const { data: deptsData } = useGetAllDepartmentsQuery();
    const departments = useMemo(() => deptsData?.data || [], [deptsData]);

    // Workflow pending requests for loans
    const { data: pendingData } = useGetPendingRequestsQuery();
    const [processAction, { isLoading: processingAction }] = useProcessActionMutation();
    const [processBulkAction, { isLoading: processingBulk }] = useProcessBulkActionMutation();

    const [selectedRequestIds, setSelectedRequestIds] = useState([]);
    
    const pendingLoanRequests = useMemo(() => (pendingData || []).filter(r => r.module === 'LOAN'), [pendingData]);
    
    const loanApprovalMap = useMemo(() => {
        const map = {};
        (pendingData || []).forEach(req => {
            if (req.module === 'LOAN') {
                map[req.entityId] = req;
            }
        });
        return map;
    }, [pendingData]);

    const handleBulkWorkflowAction = async (action) => {
        if (selectedRequestIds.length === 0) return;
        try {
            await processBulkAction({
                ids: selectedRequestIds,
                action,
                comments: `Bulk ${action.toLowerCase()} from loan dashboard`
            }).unwrap();
            setSelectedRequestIds([]);
            toast.success(`Bulk ${action.toLowerCase()} successful`);
        } catch (error) {
            toast.error("Bulk action failed");
        }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [createLoan, { isLoading: isCreating }] = useCreateLoanMutation();
    const [formData, setFormData] = useState({ userId: "", loanType: "Advance", amount: "", installments: "" });
    const [deptFilter, setDeptFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [selectedLoanReq, setSelectedLoanReq] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const handleApproveLoan = async (requestId) => {
        try {
            await processAction({ id: requestId, action: 'APPROVED', comments: '' }).unwrap();
            toast.success("Loan approved successfully");
        } catch (e) {
            toast.error(e?.data?.message || "Failed to approve loan");
        }
    };

    const handleRejectLoan = async (requestId) => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }
        try {
            await processAction({ id: requestId, action: 'REJECTED', comments: rejectionReason }).unwrap();
            toast.success("Loan rejected");
            setSelectedLoanReq(null);
            setRejectionReason("");
        } catch (e) {
            toast.error(e?.data?.message || "Failed to reject loan");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createLoan(formData).unwrap();
            setIsModalOpen(false);
            setFormData({ userId: "", loanType: "Advance", amount: "", installments: "" });
        } catch (error) {
            
        }
    };

    // The backend now provides enriched workflow data directly in the loans response
    const allLoansWithEnrichedData = useMemo(() => {
        return [...loans].sort((a, b) => {
            const aIsPending = a.status?.toLowerCase().includes('pending') || a.status?.toLowerCase().includes('submitted');
            const bIsPending = b.status?.toLowerCase().includes('pending') || b.status?.toLowerCase().includes('submitted');
            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [loans]);

    const filteredLoans = useMemo(() => {
        let result = allLoansWithEnrichedData;

        // Department filter
        if (deptFilter !== "all") {
            result = result.filter(loan => {
                const emp = employees.find(e => e.userId === loan.userId || e.empCode === loan.empCode);
                return emp && String(emp.departmentId) === String(deptFilter);
            });
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter(loan => {
                const status = loan.status?.toLowerCase();
                if (statusFilter === "pending") {
                    return status?.includes('pending') || status?.includes('submitted');
                } else if (statusFilter === "active") {
                    return status === 'approved' || status === 'active';
                } else if (statusFilter === "completed") {
                    return status === 'completed' || status === 'done';
                } else if (statusFilter === "rejected") {
                    return status === 'rejected' || status === 'declined';
                }
                return true;
            });
        }

        return result;
    }, [allLoansWithEnrichedData, deptFilter, statusFilter, employees]);

    const actionableLoansInTable = useMemo(() => {
        return (filteredLoans || []).filter(loan => {
            const req = loanApprovalMap[loan.loanId || loan.id];
            return req && req.requestId && req.canApprove;
        });
    }, [filteredLoans, loanApprovalMap]);

    if (loansLoading || employeesLoading) {
        return <div className="p-10 text-center text-gray-500">Loading loan records...</div>;
    }

    const activeLoans = filteredLoans.filter(l => {
        const status = l.status?.toLowerCase();
        return status === "approved" || status === "active";
    });
    const completedLoans = filteredLoans.filter(l => {
        const status = l.status?.toLowerCase();
        return status === "completed" || status === "done";
    });
    const pendingLoans = filteredLoans.filter(l => {
        const status = l.status?.toLowerCase();
        return status === "submitted" || status === "pending";
    });

    const totalDisbursed = activeLoans.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) + completedLoans.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalRecovered = activeLoans.reduce((acc, curr) => acc + Number(curr.totalRepaidAmount || 0), 0) + completedLoans.reduce((acc, curr) => acc + Number(curr.totalRepaidAmount || 0), 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    {/* <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Landmark className="text-blue-600" size={32} />
                        Loans & Advances
                    </h1> */}
                    <p className="text-sm text-gray-500">Manage salary advances and loan EMIs with automated payroll deduction.</p>
                </div>
                <div className="flex gap-3 items-center">
                    {/* Department Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 outline-none transition-all">
                                <Building size={14} />
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

                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-bold outline-none transition-all",
                                statusFilter === "pending" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white text-gray-700 hover:bg-gray-50"
                            )}>
                                <CheckCircle2 size={14} />
                                {statusFilter === "all" ? "All Status" :
                                    statusFilter === "pending" ? "Pending" :
                                        statusFilter === "active" ? "Active" :
                                            statusFilter === "completed" ? "Completed" : "Rejected"}
                                <ChevronDown size={14} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48">
                            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span> Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                                <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span> Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                                <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span> Rejected
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {selectedRequestIds.length > 0 && (
                        <div className="flex gap-2 mr-2 border-r pr-4 border-gray-200 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                {selectedRequestIds.length} Selected
                            </div>
                            <button
                                onClick={() => handleBulkWorkflowAction('APPROVED')}
                                disabled={processingBulk}
                                style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                                className="flex items-center gap-2 px-4 py-2 !bg-emerald-600 !text-white font-bold rounded-xl hover:!bg-emerald-700 shadow-sm transition-all text-xs uppercase disabled:opacity-50"
                            >
                                <Check size={16} /> Bulk Approve
                            </button>
                            <button
                                onClick={() => handleBulkWorkflowAction('REJECTED')}
                                disabled={processingBulk}
                                style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                                className="flex items-center gap-2 px-4 py-2 !bg-rose-600 !text-white font-bold rounded-xl hover:!bg-rose-700 shadow-sm transition-all text-xs uppercase disabled:opacity-50"
                            >
                                <XCircle size={16} /> Bulk Reject
                            </button>
                        </div>
                    )}

                    <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 !bg-blue-600 !text-white rounded-xl hover:!bg-blue-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all shadow-blue-100">
                        <Plus size={16} /> New Request
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                        <Landmark size={120} />
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fund Health (Recovered / Disbursed)</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-emerald-600 tracking-tight">₹{totalRecovered.toLocaleString('en-IN')}</p>
                                <p className="text-xl font-bold text-gray-400 mb-1">/ ₹{totalDisbursed.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${totalDisbursed > 0 ? (totalRecovered / totalDisbursed) * 100 : 0}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Loans</p>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Banknote size={20} /></div>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{activeLoans.length}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pending Requests</p>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><AlertCircle size={20} /></div>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{pendingLoans.length}</p>
                    </div>
                </div>
            </div>

            {/* Table -- Combined with Pending Approvals */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/20">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <History size={16} className="text-gray-400" />
                        Loan Records
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={actionableLoansInTable.length > 0 && selectedRequestIds.length === actionableLoansInTable.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRequestIds(actionableLoansInTable.map(loan => loanApprovalMap[loan.loanId || loan.id].requestId));
                                            } else {
                                                setSelectedRequestIds([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Loan Details</th>
                                <th className="px-6 py-4 text-center">Amount</th>
                                <th className="px-6 py-4 text-center">EMI Progress</th>
                                <th className="px-6 py-4">Workflow</th>
                                <th className="px-6 py-4 text-right">Action/Status</th>
                                <th className="px-6 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-[13px]">
                            {filteredLoans.map(loan => {
                                const monthlyEmi = Number(loan.amount) / Number(loan.installments);
                                const paid = Number(loan.installmentsPaid || 0);
                                const total = Number(loan.installments || 1);
                                const progress = (paid / total) * 100;
                                const isExpanded = expandedRowId === loan.id;
                                const isPending = loan.status?.toLowerCase().includes('pending') || loan.status?.toLowerCase().includes('submitted');

                                return (
                                    <React.Fragment key={loan.loanId || loan.id}>
                                        <tr
                                            className={cn(
                                                "hover:bg-gray-50/50 cursor-pointer group",
                                                isPending && "bg-amber-50/50 border-l-4 border-l-amber-400",
                                                selectedRequestIds.includes(loan.requestId) && "bg-blue-50/40"
                                            )}
                                            onClick={() => setExpandedRowId(isExpanded ? null : loan.id)}
                                        >
                                            <td className="px-6 py-4">
                                                {isPending && loan.canApprove ? (
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={selectedRequestIds.includes(loan.requestId)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedRequestIds(prev => [...prev, loan.requestId]);
                                                            } else {
                                                                setSelectedRequestIds(prev => prev.filter(id => id !== loan.requestId));
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-4 h-4" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[10px]",
                                                        isPending ? "bg-amber-500" : "bg-gradient-to-br from-blue-500 to-purple-600"
                                                    )}>
                                                        {loan.firstName?.[0] || loan.employeeName?.[0] || 'U'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 tracking-tight">{loan.firstName || loan.employeeName?.split(' ')[0]} {loan.lastName || loan.employeeName?.split(' ')[1]}</p>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{loan.empCode || loan.employeeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-700">{loan.loanType}</p>
                                                <p className="text-[10px] font-bold text-gray-400">EMI: ₹{monthlyEmi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black text-gray-900">
                                                ₹{Number(loan.amount).toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                                                    <div className="flex items-center gap-1">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                            isPending ? "text-amber-600 bg-amber-50" : "text-blue-600 bg-blue-50"
                                                        )}>{paid}</span>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="text-[10px] font-bold text-gray-400">{total} Mths</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                                                        <div className={cn(
                                                            "h-1 rounded-full transition-all duration-500",
                                                            isPending ? "bg-amber-400" : "bg-blue-500"
                                                        )} style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* Workflow progress indicator */}
                                                {loanApprovalMap[loan.loanId || loan.id] && isPending ? (
                                                    <div className="flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-gray-50/50 border border-gray-100/50 min-w-[140px] shadow-sm">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                                                                {loanApprovalMap[loan.loanId || loan.id].approverName || loanApprovalMap[loan.loanId || loan.id].levelName || 'Awaiting Approval'}
                                                            </span>
                                                            <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50">
                                                                Step {loanApprovalMap[loan.loanId || loan.id].currentLevel || 1}/{loanApprovalMap[loan.loanId || loan.id].totalLevels || 1}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700" 
                                                                style={{ width: `${(loanApprovalMap[loan.loanId || loan.id].currentLevel / loanApprovalMap[loan.loanId || loan.id].totalLevels) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            loan.status?.toLowerCase() === 'approved' ? "bg-emerald-500" :
                                                            loan.status?.toLowerCase() === 'completed' ? "bg-blue-500" : "bg-gray-300"
                                                        )} />
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {loan.status || 'Finalized'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {isPending && loan.requestId && loan.canApprove ? (
                                                    <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                        {selectedLoanReq?.requestId === loan.requestId ? (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Rejection reason (required)"
                                                                    value={rejectionReason}
                                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                                    className="px-2 py-1 text-xs border border-gray-300 rounded w-40 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                                />
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => handleRejectLoan(loan.requestId)}
                                                                        disabled={processingAction}
                                                                        className="px-3 py-1.5 bg-rose-600 text-white rounded-md text-[10px] font-bold hover:bg-rose-700 disabled:opacity-50 shadow-sm"
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setSelectedLoanReq(null); setRejectionReason(""); }}
                                                                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-[10px] font-bold hover:bg-gray-300 shadow-sm"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex gap-2" style={{ minWidth: '140px' }}>
                                                                <button
                                                                    onClick={() => handleApproveLoan(loan.requestId)}
                                                                    disabled={processingAction}
                                                                    style={{
                                                                        backgroundColor: '#16a34a',
                                                                        color: '#ffffff',
                                                                        padding: '8px 12px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        border: 'none',
                                                                        cursor: processingAction ? 'not-allowed' : 'pointer',
                                                                        opacity: processingAction ? 0.5 : 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    <Check size={12} /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedLoanReq(loan)}
                                                                    disabled={processingAction}
                                                                    style={{
                                                                        backgroundColor: '#dc2626',
                                                                        color: '#ffffff',
                                                                        padding: '8px 12px',
                                                                        borderRadius: '6px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 'bold',
                                                                        border: 'none',
                                                                        cursor: processingAction ? 'not-allowed' : 'pointer',
                                                                        opacity: processingAction ? 0.5 : 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    <XCircle size={12} /> Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className={cn(
                                                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                        loan.status?.toLowerCase() === 'approved' ? "bg-blue-100 text-blue-700" :
                                                            loan.status?.toLowerCase() === 'completed' ? "bg-emerald-100 text-emerald-700" :
                                                                loan.status?.toLowerCase() === 'rejected' ? "bg-rose-100 text-rose-700" :
                                                                    "bg-amber-100 text-amber-700"
                                                    )}>
                                                        {isPending && loan.levelName ? `${loan.levelName} Pending` : (loan.status?.toUpperCase() || 'PENDING')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <ChevronDown size={16} className={cn("text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-blue-50/20 border-l-4 border-l-indigo-600">
                                                <td colSpan={6} className="px-8 py-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Repayment Audit
                                                            </h4>
                                                            <div className="space-y-3 bg-white/50 p-4 rounded-xl border border-blue-100/50">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500 font-bold">Total Principal</span>
                                                                    <span className="font-black text-gray-900">₹{Number(loan.amount).toLocaleString('en-IN')}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-gray-500 font-bold">Cumulative Repaid</span>
                                                                    <span className="font-black text-emerald-600">₹{Number(loan.totalRepaidAmount || 0).toLocaleString('en-IN')}</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm border-t border-blue-100/50 pt-3">
                                                                    <span className="text-gray-900 font-black">Outstanding Balance</span>
                                                                    <span className="font-black text-rose-600">₹{Math.max(0, Number(loan.amount) - Number(loan.totalRepaidAmount || 0)).toLocaleString('en-IN')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Payment Invoices
                                                            </h4>
                                                            <div className="space-y-2 bg-white/50 p-4 rounded-xl border border-emerald-100/60">
                                                                {(loan.repaymentInvoices || []).length > 0 ? (
                                                                    (loan.repaymentInvoices || []).map((inv, idx) => (
                                                                        <div key={`${loan.loanId || loan.id}-inv-${idx}`} className="grid grid-cols-3 gap-2 text-[11px] border-b last:border-b-0 border-emerald-50 pb-2 last:pb-0">
                                                                            <div className="font-bold text-gray-700">{inv.month || "-"}</div>
                                                                            <div className="text-gray-500">{inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}</div>
                                                                            <div className="font-black text-emerald-700 text-right">₹{Number(inv.amount || 0).toLocaleString('en-IN')}</div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-xs text-gray-400">No paid invoice entries yet.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Loan Metadata
                                                            </h4>
                                                            <div className="space-y-3 bg-white/50 p-4 rounded-xl border border-gray-100/50 text-xs font-medium">
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Created At</span>
                                                                    <span className="text-gray-900">{new Date(loan.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-400">Payment Mode</span>
                                                                    <span className="text-gray-900 uppercase">{loan.paymentMode?.replace('_', ' ') || 'WITH SALARY'}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-100">
                                                                    <span className="text-gray-400">Reason</span>
                                                                    <span className="text-gray-700 italic">"{loan.reason || 'No reason provided'}"</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {filteredLoans.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-black text-xs uppercase tracking-widest">No loan records available for this filter.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Application Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="fixed inset-0 bg-gray-900/60 z-[9999] bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                        <div className="mb-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Request New Loan</h2>
                            <p className="text-xs text-gray-400 font-medium">Create a salary advance or loan deduction schedule.</p>
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
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loan Type</label>
                                <select value={formData.loanType} onChange={(e) => setFormData({ ...formData, loanType: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all">
                                    <option value="Advance">Salary Advance</option>
                                    <option value="Personal">Personal Loan</option>
                                    <option value="Emergency">Emergency Loan</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount (₹)</label>
                                <input required type="number" min="1" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all" placeholder="e.g. 50000" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tenure (Installments)</label>
                                <input required type="number" min="1" max="60" value={formData.installments} onChange={(e) => setFormData({ ...formData, installments: e.target.value })} className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all" placeholder="e.g. 6 Months" />
                            </div>

                            {formData.amount && formData.installments && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Est. EMI</span>
                                    <span className="font-black text-blue-700">₹{Math.round(Number(formData.amount) / Number(formData.installments)).toLocaleString()} <span className="text-xs font-bold opacity-60">/mo</span></span>
                                </div>
                            )}

                            <button disabled={isCreating} type="submit" className="w-full py-4 !bg-blue-600 !text-white rounded-xl font-black text-xs uppercase tracking-widest hover:!bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100 mt-2">
                                {isCreating ? "Submitting..." : "Submit Application"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
