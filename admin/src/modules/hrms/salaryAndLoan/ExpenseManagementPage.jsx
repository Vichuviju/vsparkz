import React, { useState, useMemo } from "react";
import { 
    Plus, 
    Wallet, 
    Clock, 
    CheckCircle2, 
    TrendingUp, 
    Filter, 
    Search, 
    FileText,
    Receipt,
    ArrowUpRight
} from "lucide-react";
import { 
    useGetExpensesQuery, 
    useCreateExpensesMutation,
    useUpdateExpensesMutation
} from "@/services/hrms/expense.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useGetPendingRequestsQuery, useProcessBulkActionMutation } from "@/services/hrms/workflow.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExpenseTable } from "./ExpenseTable";
import { cn } from "@/lib/utils";
import { AddExpenseModal } from "@/components/modals/hrms/salaryAndLoan/AddExpenseModal";
import { ExpenseApprovalModal } from "@/components/modals/hrms/salaryAndLoan/ExpenseApprovalModal";
import { RejectExpenseModal } from "@/components/modals/hrms/salaryAndLoan/RejectExpenseModal";
import { ExpenseAuditModal } from "@/components/modals/hrms/salaryAndLoan/ExpenseAuditModal";

export const ExpenseManagementPage = ({ mode = 'dashboard' }) => {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const { data: expensesData = { data: [], total: 0, page: 1, limit: 10 }, isLoading } = useGetExpensesQuery({ page, limit });
    const allExpenses = expensesData.data || [];
    const totalRecords = expensesData.total || 0;
    const { data: pendingData } = useGetPendingRequestsQuery();
    const pendingRequests = useMemo(() => pendingData || [], [pendingData]);
    const pendingExpenseList = useMemo(() => pendingRequests.filter(req => req.module === 'EXPENSE'), [pendingRequests]);
    
    const [processBulkAction, { isLoading: processingBulk }] = useProcessBulkActionMutation();
    const [selectedRequestIds, setSelectedRequestIds] = useState([]);



    const handleBulkWorkflowAction = async (action) => {
        if (selectedRequestIds.length === 0) return;
        try {
            await processBulkAction({
                ids: selectedRequestIds,
                action,
                comments: `Bulk ${action.toLowerCase()} from expense dashboard`
            }).unwrap();
            setSelectedRequestIds([]);
        } catch (error) {
        }
    };

    const [createExpense] = useCreateExpensesMutation();
    const { data: employeesResponse } = useGetAllEmployeesQuery();
    const employees = employeesResponse?.data || [];

    const [isAddModalOpen, setIsAddModalOpen] = useState(mode === 'add');
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [auditOpen, setAuditOpen] = useState(false);

    // Filter expenses based on mode
    const expenses = useMemo(() => {
        if (mode === 'reimbursement') {
            return allExpenses.filter(e => e.status === 'HR_APPROVED' || e.status === 'PAID' || e.status === 'APPROVED');
        }
        return allExpenses;
    }, [allExpenses, mode]);

    const filteredTotal = mode === 'reimbursement' ? expenses.length : totalRecords;
    const totalPages = Math.ceil(filteredTotal / limit);
    const startRecord = (page - 1) * limit + 1;
    const endRecord = Math.min(page * limit, filteredTotal);

    // Map pending requests for easy lookup in table rows
    const expenseApprovalMap = useMemo(() => {
        const map = {};
        pendingRequests.forEach(req => {
            if (req.module === 'EXPENSE') {
                map[req.entityId] = req;
            }
        });
        return map;
    }, [pendingRequests]);

    const actionableExpensesInTable = useMemo(() => {
        return allExpenses.filter(exp => {
            const req = expenseApprovalMap[exp.id];
            return req && req.requestId && req.canApprove;
        });
    }, [allExpenses, expenseApprovalMap]);



    const stats = useMemo(() => {
        const total = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const pending = expenses.filter(e => e.status === 'SUBMITTED' || e.status === 'PENDING').length;
        const approved = expenses.filter(e => e.status === 'HR_APPROVED' || e.status === 'APPROVED').length;
        const paid = expenses.filter(e => e.status === 'PAID').length;

        return { total, pending, approved, paid };
    }, [expenses]);

    const filteredExpenses = expenses.filter(e => 
        e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    {/* <h1 className="text-2xl font-bold text-gray-900">
                        {mode === 'add' ? 'Add Expense Claim' : 
                         mode === 'reimbursement' ? 'Expense Reimbursement' : 
                         'Expense Management'}
                    </h1> */}
                    <p className="text-sm text-gray-500">
                        {mode === 'add' ? 'Submit a new expense claim for approval.' : 
                         mode === 'reimbursement' ? 'View approved and paid expense reimbursements.' : 
                         'Track reimbursements, travel claims, and office expenses.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
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
                                <Clock size={16} /> Bulk Reject
                            </button>
                        </div>
                    )}
                    {mode !== 'reimbursement' && (
                        <Button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all font-semibold"
                        >
                            <Plus size={18} /> New Expense Claim
                        </Button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            {mode === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border shadow-sm col-span-1 md:col-span-2 flex items-center justify-between group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={120} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Volume</p>
                        <h2 className="text-3xl font-black text-gray-900">₹{stats.total.toLocaleString()}</h2>
                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-600">
                            <ArrowUpRight size={14} />
                            <span>Monthly Aggregate</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border shadow-sm group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</p>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">{stats.pending}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Awaiting Workflow Steps</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border shadow-sm group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CheckCircle2 size={20} />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approved</p>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900">{stats.approved}</h3>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">Ready for Payout</p>
                </div>
            </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Find claims..." 
                            className="pl-10 rounded-xl bg-gray-50/50 border-transparent focus:bg-white focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest px-3 py-1 bg-gray-100 rounded-lg">
                        <Filter size={14} /> Total Records: {totalRecords}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-tighter">
                            <tr>
                                <th className="px-6 py-4 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={actionableExpensesInTable.length > 0 && selectedRequestIds.length === actionableExpensesInTable.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedRequestIds(actionableExpensesInTable.map(exp => expenseApprovalMap[exp.id].requestId));
                                            } else {
                                                setSelectedRequestIds([]);
                                            }
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4">Employee & Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-center">Amount</th>
                                <th className="px-6 py-4">Payout Period</th>
                                <th className="px-6 py-4">Submitted Date</th>
                                <th className="px-6 py-4 text-right">Documents</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50">
                            {filteredExpenses.map((expense) => {
                                const req = expenseApprovalMap[expense.id];
                                return (
                                <tr key={expense.id} className={cn(
                                    "hover:bg-blue-50/30 transition-all cursor-pointer group",
                                    selectedRequestIds.includes(req?.requestId) && "bg-blue-50/50"
                                )}>
                                    <td className="px-6 py-5 text-center">
                                        {req && req.canApprove ? (
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedRequestIds.includes(req.requestId)}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedRequestIds(prev => [...prev, req.requestId]);
                                                    } else {
                                                        setSelectedRequestIds(prev => prev.filter(id => id !== req.requestId));
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="w-4 h-4 mx-auto" />
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600">
                                                <Receipt size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 leading-tight mb-1">{expense.employeeName}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-white border text-[10px] font-black uppercase text-gray-500 shadow-sm">
                                                        {expense.category}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400 font-medium truncate max-w-[150px]">{expense.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                                                    expense.status === 'PAID' ? 'bg-emerald-500' :
                                                    (expense.status === 'APPROVED' || expense.status === 'HR_APPROVED') ? 'bg-blue-500' :
                                                    (expense.status === 'REJECTED' || expense.status === 'HR_REJECTED' || expense.status === 'MANAGER_REJECTED') ? 'bg-rose-500' : 
                                                    'bg-amber-500'
                                                )} />
                                                <span className="text-[10px] font-black uppercase tracking-tight text-gray-500">
                                                    {expense.status.replace(/_/g, ' ')}
                                                </span>
                                            </div>

                                            {/* Workflow progress indicator */}
                                            {expenseApprovalMap[expense.id] && expense.status === 'SUBMITTED' && (
                                                <div className="flex flex-col gap-1.5 px-2 py-1.5 rounded-lg bg-gray-50/80 border border-gray-100/50 min-w-[120px] shadow-sm">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                                                            {req?.approverName || req?.levelName || 'Awaiting Approval'}
                                                        </span>
                                                        <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1 py-0.5 rounded-md border border-amber-100/50">
                                                            Step {expenseApprovalMap[expense.id].currentLevel || 1}/{expenseApprovalMap[expense.id].totalLevels || 1}
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700" 
                                                            style={{ width: `${(expenseApprovalMap[expense.id].currentLevel / expenseApprovalMap[expense.id].totalLevels) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Workflow progress badge */}
                                            {expense.currentLevel && (
                                                <div 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedExpense(expense);
                                                        setAuditOpen(true);
                                                    }}
                                                    className="flex flex-col gap-1 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100 min-w-[120px] cursor-pointer hover:bg-white hover:shadow-sm transition-all"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                                            {['APPROVED', 'HR_APPROVED', 'PAID', 'REJECTED', 'HR_REJECTED', 'MANAGER_REJECTED'].includes(expense.status) ? 'Workflow Finalized' : `Step ${expense.currentLevel} of ${expense.totalLevels || 2}`}
                                                        </span>
                                                        <div className="h-0.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                                            <div 
                                                                className={cn(
                                                                    "h-full transition-all duration-500",
                                                                    (expense.status === 'APPROVED' || expense.status === 'HR_APPROVED' || expense.status === 'PAID') ? "bg-emerald-500" :
                                                                    (expense.status === 'REJECTED' || expense.status === 'HR_REJECTED' || expense.status === 'MANAGER_REJECTED') ? "bg-rose-500" :
                                                                    "bg-blue-500"
                                                                )} 
                                                                style={{ width: `${['APPROVED', 'HR_APPROVED', 'PAID', 'REJECTED', 'HR_REJECTED', 'MANAGER_REJECTED'].includes(expense.status) ? 100 : (expense.currentLevel / (expense.totalLevels || 2)) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className={cn(
                                                        "text-[9px] font-extrabold truncate",
                                                        (expense.status === 'APPROVED' || expense.status === 'HR_APPROVED' || expense.status === 'PAID') ? "text-emerald-600" :
                                                        (expense.status === 'REJECTED' || expense.status === 'HR_REJECTED' || expense.status === 'MANAGER_REJECTED') ? "text-rose-600" :
                                                        "text-blue-600"
                                                    )}>
                                                        {expense.status === 'APPROVED' || expense.status === 'HR_APPROVED' ? 'Fully Approved' :
                                                         expense.status === 'PAID' ? 'Reimbursement Paid' :
                                                         (expense.status === 'REJECTED' || expense.status === 'HR_REJECTED' || expense.status === 'MANAGER_REJECTED') ? 'Request Rejected' :
                                                         expense.levelName ? `${expense.levelName} Pending` : `Level ${expense.currentLevel} Pending`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm font-black text-gray-900">₹{Number(expense.amount).toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <p className="text-xs font-bold text-gray-700">
                                                {expense.payrollMonth ? (() => {
                                                    const [y, m] = expense.payrollMonth.split('-').map(Number);
                                                    return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                                                })() : 'Next Payroll'}
                                            </p>
                                            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">
                                                {expense.payrollMonth ? 'Scheduled Payout' : 'Provisioning'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Clock size={12} className="text-gray-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Sub: {new Date(expense.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                            {expense.status === 'PAID' && expense.paidAt && (
                                                <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-bottom-1 duration-500">
                                                    <CheckCircle2 size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">Paid: {new Date(expense.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        {expense.billUrl ? (
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => window.open(expense.billUrl, '_blank')}
                                                className="h-8 px-2 rounded-lg !bg-emerald-50 !text-emerald-700 hover:!bg-emerald-100 transition-all border border-emerald-100 shadow-sm flex items-center gap-2 group"
                                            >
                                                <Receipt size={14} className="group-hover:scale-110 transition-transform" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">View Invoice</span>
                                            </Button>
                                        ) : (
                                            <div className="flex justify-end pr-2">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 border border-gray-100 border-dashed" title="No Invoice Uploaded">
                                                    <FileText size={14} />
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        {(expense.status === 'SUBMITTED' || expense.status === 'PENDING') && expenseApprovalMap[expense.id] && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => {
                                                        setSelectedExpense(expense);
                                                        setApproveOpen(true);
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
                                                >
                                                    Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedExpense(expense);
                                                        setRejectOpen(true);
                                                    }}
                                                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs rounded-lg"
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Showing {startRecord} to {endRecord} of {filteredTotal} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="text-xs"
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <Button
                                        key={p}
                                        variant={p === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 text-xs ${p === page ? 'bg-blue-600' : ''}`}
                                    >
                                        {p}
                                    </Button>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="text-xs"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <AddExpenseModal 
                open={isAddModalOpen} 
                setOpen={setIsAddModalOpen}
                employees={employees}
                onSubmitExpense={async (data) => {
                    try {
                        const expenseData = {
                            ...data,
                            userId: data.employeeName,
                        };
                        await createExpense(expenseData).unwrap();
                        setIsAddModalOpen(false);
                    } catch (error) {
                    }
                }}
            />

            <ExpenseApprovalModal 
                open={approveOpen} 
                setOpen={setApproveOpen} 
                expense={selectedExpense} 
            />

            <RejectExpenseModal
                open={rejectOpen}
                setOpen={setRejectOpen}
                expense={selectedExpense}
            />

            <ExpenseAuditModal
                open={auditOpen}
                setOpen={setAuditOpen}
                expense={selectedExpense}
            />
        </div>
    );
};
