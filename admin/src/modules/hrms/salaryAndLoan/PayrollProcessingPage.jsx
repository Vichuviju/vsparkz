import React, { useState, useMemo, useEffect } from "react";
import { AlertCircle, Download, Check, ChevronRight, ChevronDown, Search, AlertTriangle, PlayCircle, Shield, X, ChevronLeft, Users, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useGetPayrollRunsQuery,
    useProcessPayrollMutation,
    useGetPayrollRecordsQuery,
    useLockPayrollRunMutation,
    useDeletePayrollRunMutation,
    useSubmitPayrollRunMutation,
    useOverridePayrollRecordMutation
} from "@/services/hrms/salaryManagement.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import {
    useGetWorkflowsQuery,
    useGetPendingRequestsQuery,
    useProcessActionMutation
} from "@/services/hrms/workflow.api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";

export const PayrollProcessingPage = () => {
    return (
        <TooltipProvider>
            <PayrollProcessingContent />
        </TooltipProvider>
    );
};

const PayrollProcessingContent = () => {
    const { user } = useAuth();
    const { checkPermission } = useHRMSPermissions();
    const canCalculate = checkPermission('/hrms/payroll/process', 'calculate');
    const canApprove = checkPermission('/hrms/payroll/process', 'approve');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [processPayroll, { isLoading: isProcessing }] = useProcessPayrollMutation();
    const { data: runs = [], refetch: refetchRuns } = useGetPayrollRunsQuery();
    
    // Tab State
    const [activeTab, setActiveTab] = useState("BULK"); // "BULK" or "INDIVIDUAL"

    // Refetch runs when month or tab changes to ensure fresh data
    useEffect(() => {
        refetchRuns();
        setSelectedRecordIds([]); // Clear selection when switching context
    }, [activeTab, selectedMonth, refetchRuns]);

    // Filter runs based on tab and month
    const activeRunIds = useMemo(() => {
        if (activeTab === "BULK") {
            const run = runs.find(r => r.period === selectedMonth && r.runType === "MONTHLY");
            return run ? [run.id] : [];
        } else {
            return runs
                .filter(r => r.period === selectedMonth && r.runType === "INDIVIDUAL")
                .map(r => r.id);
        }
    }, [runs, selectedMonth, activeTab]);

    const currentRun = useMemo(() => {
        if (activeTab === "BULK") {
            return runs.find(r => r.period === selectedMonth && r.runType === "MONTHLY");
        }
        // For individual settlements, we treat all of them as part of the current month's view
        // We'll use the most recent individual run for status/header purposes
        const individualRuns = runs.filter(r => r.period === selectedMonth && r.runType === "INDIVIDUAL");
        return individualRuns[0] || null;
    }, [runs, selectedMonth, activeTab]);

    const runIdParam = activeRunIds.length > 0 ? activeRunIds.join(',') : null;
    const { data: rawRecords = [], isLoading: isLoadingRecords, refetch } = useGetPayrollRecordsQuery(runIdParam, {
        skip: !runIdParam
    });

    const records = useMemo(() => {
        if (!runIdParam) return [];
        return rawRecords;
    }, [rawRecords, runIdParam]);

    const [lockRun, { isLoading: isLocking }] = useLockPayrollRunMutation();
    const [submitRun, { isLoading: isSubmitting }] = useSubmitPayrollRunMutation();
    const [deleteRun, { isLoading: isDeleting }] = useDeletePayrollRunMutation();
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [approvalComment, setApprovalComment] = useState("");
    
    // Override States
    const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
    const [activeOverrideRecord, setActiveOverrideRecord] = useState(null);
    const [overridePayrollRecord, { isLoading: isOverriding }] = useOverridePayrollRecordMutation();
    
    // Selection state
    const [selectedRecordIds, setSelectedRecordIds] = useState([]);
    
    // Individual Selection States
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const { data: allEmployeesRes } = useGetAllEmployeesQuery({ limit: 1000 });
    const allEmployees = allEmployeesRes?.data || [];

    // Workflow Actions
    // Decision Modal State
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [decisionAction, setDecisionAction] = useState(null); // "APPROVED" or "REJECTED"

    const { data: pendingRequests = [], refetch: refetchPending } = useGetPendingRequestsQuery();
    const [processAction, { isLoading: isStatusChanging }] = useProcessActionMutation();

    // For BULK: find the approval request for the current run
    const currentApprovalRequest = useMemo(() => {
        if (!activeRunIds.length || !pendingRequests.length) return null;
        return pendingRequests.find(req =>
            (req.module === "PAYROLL" || req.moduleName === "PAYROLL") &&
            activeRunIds.map(String).includes(req.entityId?.toString())
        );
    }, [activeRunIds, pendingRequests]);

    // For INDIVIDUAL: build a map of runId -> approval request
    const individualApprovalMap = useMemo(() => {
        const map = {};
        pendingRequests.forEach(req => {
            if (req.module === "PAYROLL" || req.moduleName === "PAYROLL") {
                map[req.entityId?.toString()] = req;
            }
        });
        return map;
    }, [pendingRequests]);

    const handleWorkflowActionForRun = async (requestId, action, comment) => {
        if (action === "REJECTED" && !comment?.trim()) {
            return toast.error("Please provide a reason for rejection.");
        }
        toast.promise(processAction({
            id: requestId,
            action,
            comments: comment
        }).unwrap(), {
            loading: `Processing ${action.toLowerCase()}...`,
            success: () => {
                setApprovalComment("");
                setIsApprovalModalOpen(false);
                refetchRuns();
                refetchPending();
                return `Payroll run ${action.toLowerCase()} successfully.`;
            },
            error: (e) => `Error: ${e?.data?.message || "Action failed"}`
        });
    };

    const handleRunCalculation = async () => {
        const [year, month] = selectedMonth.split("-");
        toast.promise(processPayroll({ month, year, runType: 'MONTHLY' }).unwrap(), {
            loading: "Running Payroll Engine...",
            success: "Calculations Refreshed!",
            error: (e) => `Error: ${e?.data?.message || "Failed to calculate"}`
        });
    };

    const handleRecalculateIndividual = async () => {
        const idsToRecalculate = selectedRecordIds.length > 0 
            ? records.filter(r => selectedRecordIds.includes(r.id)).map(r => r.employeeId)
            : records.map(r => r.employeeId);

        if (idsToRecalculate.length === 0) return toast.error("No records selected to recalculate.");

        const [year, month] = selectedMonth.split("-");
        toast.promise(processPayroll({
            month,
            year,
            employeeIds: idsToRecalculate,
            runType: "INDIVIDUAL"
        }).unwrap(), {
            loading: `Recalculating ${idsToRecalculate.length} Individual(s)...`,
            success: "Calculations refreshed!",
            error: "Recalculation failed"
        });
    };

    const handleIndividualProcess = async () => {
        if (selectedEmployeeIds.length === 0) {
            return toast.error("Please select at least one employee.");
        }
        
        const [year, month] = selectedMonth.split("-");
        toast.promise(processPayroll({ 
            month, 
            year, 
            employeeIds: selectedEmployeeIds, // This now contains userIds as expected by backend
            runType: 'INDIVIDUAL' 
        }).unwrap(), {
            loading: `Processing ${selectedEmployeeIds.length} Individual Payrolls...`,
            success: () => {
                setIsIndividualModalOpen(false);
                setSelectedEmployeeIds([]);
                refetch();
                setActiveTab("INDIVIDUAL"); // Switch to individual tab to see results
                return "Individual calculations generated!";
            },
            error: (e) => `Error: ${e?.data?.message || "Process failed"}`
        });
    };

    const handleSubmit = async () => {
        if (activeRunIds.length === 0) return;
        
        let runsToSubmit = [];
        if (selectedRecordIds.length > 0) {
            // Submit only selected individuals
            runsToSubmit = records
                .filter(r => selectedRecordIds.includes(r.id))
                .map(r => r.payrollRunId);
        } else {
            // Default: Submit all eligible runs in the current view
            runsToSubmit = activeTab === "BULK" 
                ? [currentRun?.id].filter(Boolean)
                : runs.filter(r => r.period === selectedMonth && r.runType === "INDIVIDUAL" && (r.status === "DRAFT" || r.status === "REJECTED")).map(r => r.id);
        }

        if (runsToSubmit.length === 0) return toast.error("No eligible runs to submit.");

        toast.promise(Promise.all(runsToSubmit.map(id => submitRun(id).unwrap())), {
            loading: `Submitting ${runsToSubmit.length} Run(s)...`,
            success: () => {
                setSelectedRecordIds([]);
                return "Payroll submitted successfully!";
            },
            error: (e) => `Submission failed: ${e?.data?.message || "Internal error"}`
        });
    };

    const handleDeleteRun = async (runId) => {
        if (!window.confirm("Are you sure you want to delete this individual settlement? This will also cancel any active approval workflow. This cannot be undone.")) return;
        
        toast.promise(deleteRun(runId).unwrap(), {
            loading: "Deleting settlement...",
            success: () => {
                refetch();
                refetchRuns();
                return "Record deleted successfully";
            },
            error: "Failed to delete record"
        });
    };

    const handleLock = async () => {
        let runsToLock = [];
        
        if (activeTab === "BULK") {
            if (currentRun?.id) runsToLock = [currentRun.id];
        } else {
            // For individual tab, lock selected or all approved in view
            if (selectedRecordIds.length > 0) {
                runsToLock = records
                    .filter(r => selectedRecordIds.includes(r.id) && r.runStatus === "APPROVED")
                    .map(r => r.payrollRunId);
            } else {
                runsToLock = records
                    .filter(r => r.runStatus === "APPROVED")
                    .map(r => r.payrollRunId);
            }
        }

        if (runsToLock.length === 0) return toast.error("No approved runs found to lock.");

        if (!window.confirm(`Lock and finalize ${runsToLock.length} payroll run(s)? This will freeze all data and generate payslips.`)) return;

        toast.promise(Promise.all(runsToLock.map(id => lockRun(id).unwrap())), {
            loading: `Locking ${runsToLock.length} Run(s)...`,
            success: () => {
                setSelectedRecordIds([]);
                refetchRuns();
                return "Payroll locked and finalized!";
            },
            error: "Failed to lock payroll"
        });
    };

    const handleWorkflowAction = async (action) => {
        if (!currentApprovalRequest) return;
        await handleWorkflowActionForRun(currentApprovalRequest.requestId, action);
    };

    const handleDownloadPayslips = () => {
        const targetRecords = selectedRecordIds.length > 0 
            ? records.filter(r => selectedRecordIds.includes(r.id))
            : records.filter(r => r.runStatus === "LOCKED");

        if (targetRecords.length === 0) {
            toast.error("No locked records available to generate payslips.");
            return;
        }

        const monthLabel = new Date(`${selectedMonth}-01`).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

        const payslipHTML = targetRecords.map(rec => {
            const earnings = rec.earningsBreakdown || {};
            const deductions = rec.deductionsBreakdown || {};

            const earningRows = Object.entries(earnings)
                .filter(([, v]) => Number(v) > 0)
                .map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right">₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`)
                .join('');

            const deductionRows = [
                deductions.lopAmount > 0 && `<tr><td>Loss of Pay (${rec.lopDays} days)</td><td style="text-align:right;color:#dc2626">₹${Number(deductions.lopAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`,
                deductions.totalEmi > 0 && `<tr><td>Loan EMI</td><td style="text-align:right;color:#dc2626">₹${Number(deductions.totalEmi).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>`,
                deductions.latePenaltyDays > 0 && `<tr><td>Late Penalty (${deductions.rawLates} lates → ${deductions.latePenaltyDays} days LOP)</td><td style="text-align:right;color:#dc2626">₹0.00</td></tr>`,
            ].filter(Boolean).join('');

            return `
            <div style="page-break-after:always;padding:40px;font-family:Arial,sans-serif;max-width:800px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #4f46e5">
                    <div><h1 style="margin:0;color:#1e1b4b;font-size:22px">LOGZE HRMS</h1><p style="margin:4px 0 0;color:#6b7280;font-size:12px">Salary Payslip — ${monthLabel}</p></div>
                    <div style="text-align:right"><span style="background:#f0fdf4;color:#15803d;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:bold">LOCKED</span></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;background:#f9fafb;padding:16px;border-radius:8px">
                    <div><p style="margin:0;font-size:11px;color:#6b7280">EMPLOYEE</p><p style="margin:4px 0 0;font-weight:600;color:#111827">${rec.employeeName || 'N/A'}</p></div>
                    <div><p style="margin:0;font-size:11px;color:#6b7280">EMP CODE</p><p style="margin:4px 0 0;font-weight:600;color:#111827">${rec.empCode || 'N/A'}</p></div>
                    <div><p style="margin:0;font-size:11px;color:#6b7280">PAYABLE DAYS</p><p style="margin:4px 0 0;font-weight:600;color:#111827">${rec.payableDays} of ${rec.totalDays}</p></div>
                    <div><p style="margin:0;font-size:11px;color:#6b7280">PERIOD</p><p style="margin:4px 0 0;font-weight:600;color:#111827">${monthLabel}</p></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
                    <div>
                        <h3 style="margin:0 0 12px;font-size:13px;color:#4f46e5;border-bottom:1px solid #e5e7eb;padding-bottom:6px">EARNINGS</h3>
                        <table style="width:100%;font-size:13px;border-collapse:collapse">${earningRows || '<tr><td colspan="2" style="color:#9ca3af">No earnings data</td></tr>'}</table>
                    </div>
                    <div>
                        <h3 style="margin:0 0 12px;font-size:13px;color:#dc2626;border-bottom:1px solid #e5e7eb;padding-bottom:6px">DEDUCTIONS</h3>
                        <table style="width:100%;font-size:13px;border-collapse:collapse">${deductionRows || '<tr><td>No deductions</td></tr>'}</table>
                    </div>
                </div>
                <div style="background:#4f46e5;color:white;padding:16px 24px;border-radius:10px;display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:14px;font-weight:600">NET PAY</span>
                    <span style="font-size:22px;font-weight:800">₹${Number(rec.netPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <p style="text-align:center;font-size:10px;color:#9ca3af;margin-top:20px">This is a computer-generated payslip and does not require a signature.</p>
            </div>`;
        }).join('');

        const win = window.open('', '_blank');
        win.document.write(`<!DOCTYPE html><html><head><title>Payslips — ${monthLabel}</title><style>body{margin:0;background:#f3f4f6;padding:20px} @media print{body{background:white}}</style></head><body>${payslipHTML}<script>window.onload=()=>{window.print()}<\/script></body></html>`);
        win.document.close();
    };

    const filteredRecords = useMemo(() => {
        let result = records;
        if (searchQuery) {
            result = records.filter(r => 
                r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                r.empCode?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return result;
    }, [records, searchQuery]);

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    const paginatedRecords = useMemo(() => {
        return filteredRecords.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredRecords, currentPage]);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMonth]);

    const discrepanciesCount = useMemo(() => 
        records.filter(r => r.hasDiscrepancy === "YES").length,
    [records]);
    const isLocked = currentRun?.status === "LOCKED";

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        {activeTab === "BULK" && (
                            <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                                currentRun?.status === "LOCKED" ? "bg-emerald-100 text-emerald-700" :
                                    currentRun?.status === "PENDING_APPROVAL" ? "bg-amber-100 text-amber-700 animate-pulse" :
                                        currentRun?.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
                                        currentRun?.status === "DRAFT" ? "bg-gray-100 text-gray-600" :
                                            "bg-gray-100 text-gray-500"
                            )}>
                                {currentRun?.status || "NO RUN"}
                            </span>
                        )}
                        <p className="text-xs text-gray-500 font-medium">Period: {new Date(`${selectedMonth}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">

                    {/* BULK TAB ACTIONS */}
                    {activeTab === "BULK" && (
                        <>
                            {/* Step 1: Show calculation and submission actions */}
                            {(!currentRun || currentRun.status === "DRAFT" || currentRun.status === "REJECTED") && (
                                <>
                                    {canCalculate && (
                                        <button
                                            type="button"
                                            onClick={handleRunCalculation}
                                            disabled={isProcessing}
                                            className="relative z-10 flex items-center gap-2 px-4 py-2 border border-blue-100 !bg-blue-50/50 !text-blue-700 rounded-xl hover:!bg-blue-50 font-semibold transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            {isProcessing ? <span className="animate-spin text-lg">⏳</span> : <PlayCircle size={18} />}
                                            {currentRun ? "Recalculate Bulk" : "Run Bulk Calculation"}
                                        </button>
                                    )}
                                    {canApprove && currentRun && records.length > 0 && (currentRun.status === "DRAFT" || currentRun.status === "REJECTED") && (
                                        <button
                                            type="button"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="relative z-10 flex items-center gap-2 px-4 py-2 !bg-blue-600 !text-white rounded-xl hover:!bg-blue-700 font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                                        >
                                            {isSubmitting ? "⏳..." : <Check size={18} />} Send for Approval
                                        </button>
                                    )}
                                    {canApprove && currentRun && (

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!window.confirm("Delete this payroll run? This will also cancel any active approval workflow. This cannot be undone.")) return;
                                                toast.promise(deleteRun(currentRun.id).unwrap(), {
                                                    loading: "Deleting draft...",
                                                    success: () => { refetchRuns(); return "Draft deleted successfully"; },
                                                    error: "Failed to delete draft"
                                                });
                                            }}
                                            disabled={isDeleting}
                                            className="relative z-10 flex items-center gap-2 px-4 py-2 border border-rose-200 !bg-rose-50 !text-rose-600 rounded-xl hover:!bg-rose-100 font-semibold transition-all disabled:opacity-50 cursor-pointer"
                                            title="Delete Draft"
                                        >
                                            <Trash2 size={18} /> Delete Draft
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Step 3: APPROVED → Lock */}
                            {canApprove && currentRun?.status === "APPROVED" && (
                                <button
                                    onClick={handleLock}
                                    disabled={isLocking}
                                    className="flex items-center gap-2 px-4 py-2 !bg-emerald-600 !text-white font-semibold rounded-xl hover:!bg-emerald-700 shadow-sm transition-all shadow-emerald-200"
                                >
                                    <Check size={18} /> Lock &amp; Finalize
                                </button>
                            )}
                            {/* Step 4: LOCKED → Download */}
                            {currentRun?.status === "LOCKED" && (
                                <button
                                    onClick={handleDownloadPayslips}
                                    disabled={filteredRecords.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                                >
                                    <Download size={18} /> Download Payslips
                                </button>
                            )}
                        </>
                    )}

                    {/* INDIVIDUAL TAB ACTIONS */}
                    {activeTab === "INDIVIDUAL" && (
                        <div className="flex gap-2">
                            {canCalculate && (
                                <button
                                    onClick={() => setIsIndividualModalOpen(true)}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-4 py-2 border border-purple-600 !bg-purple-600 !text-white rounded-xl hover:!bg-purple-700 font-semibold shadow-sm transition-all disabled:opacity-50"
                                >
                                    <Users size={18} />
                                    Individual Processing
                                </button>
                            )}
                            {canCalculate && records.some(r => r.runStatus === "DRAFT" || r.runStatus === "REJECTED") && (
                                <button
                                    onClick={handleRecalculateIndividual}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-4 py-2 border border-purple-100 !bg-purple-50/50 !text-purple-700 rounded-xl hover:!bg-purple-50 font-semibold transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? <span className="animate-spin text-lg">⏳</span> : <PlayCircle size={18} />}
                                    {selectedRecordIds.length > 0 ? "Recalculate Selected" : "Recalculate All"}
                                </button>
                            )}
                            
                            {/* Submit Selected - only show if any of the selected are in DRAFT or REJECTED */}
                            {selectedRecordIds.length > 0 && records.some(r => selectedRecordIds.includes(r.id) && (r.runStatus === "DRAFT" || r.runStatus === "REJECTED")) && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-4 py-2 !bg-blue-600 !text-white rounded-xl hover:!bg-blue-700 font-semibold shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "⏳..." : <Check size={18} />}
                                    Submit Selected ({records.filter(r => selectedRecordIds.includes(r.id) && (r.runStatus === "DRAFT" || r.runStatus === "REJECTED")).length})
                                </button>
                            )}

                            {/* Lock Selected/All Approved */}
                            {canApprove && records.some(r => (selectedRecordIds.length === 0 || selectedRecordIds.includes(r.id)) && r.runStatus === "APPROVED") && (
                                <button
                                    onClick={handleLock}
                                    disabled={isLocking}
                                    className="flex items-center gap-2 px-4 py-2 !bg-emerald-600 !text-white font-semibold rounded-xl hover:!bg-emerald-700 shadow-sm transition-all shadow-emerald-200"
                                >
                                    <Check size={18} /> 
                                    {selectedRecordIds.length > 0 ? `Lock Selected (${records.filter(r => selectedRecordIds.includes(r.id) && r.runStatus === "APPROVED").length})` : "Lock All Approved"}
                                </button>
                            )}

                            {/* Download Payslips for Locked runs */}
                            {records.some(r => (selectedRecordIds.length === 0 || selectedRecordIds.includes(r.id)) && r.runStatus === "LOCKED") && (
                                <button
                                    onClick={handleDownloadPayslips}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                                >
                                    <Download size={18} /> 
                                    {selectedRecordIds.length > 0 ? "Download Selected Payslips" : "Download All Payslips"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Approver Workbench */}
            {canApprove && currentApprovalRequest && activeTab === "BULK" && (
                <div className="bg-blue-600 rounded-2xl p-6 shadow-xl shadow-blue-100 border border-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                        <Shield size={120} className="text-white" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="p-2 bg-blue-500/30 rounded-lg backdrop-blur-md text-white">
                                    <Shield size={20} />
                                </span>
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-black text-white tracking-tight">Approver Workbench</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] font-black bg-blue-500/50 text-white px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-widest">
                                            {currentApprovalRequest.levelName || 'Current Stage'}
                                        </span>
                                        <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest opacity-60">
                                            Step {currentApprovalRequest.currentLevel || 1} of {currentApprovalRequest.totalLevels || 1}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-blue-100/80 text-sm font-medium leading-relaxed">
                                You are the designated approver for this payroll batch. Please review the audit discrepancies below before finalizing your decision.
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setDecisionAction("APPROVED");
                                    setIsApprovalModalOpen(true);
                                }}
                                className="px-8 py-3.5 bg-white text-blue-700 font-black text-sm rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95"
                            >
                                <Check size={18} /> Approve Batch
                            </button>
                            <button
                                onClick={() => {
                                    setDecisionAction("REJECTED");
                                    setIsApprovalModalOpen(true);
                                }}
                                className="px-8 py-3.5 !bg-rose-600 !text-white font-black text-sm rounded-xl hover:!bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-black/10 active:scale-95"
                            >
                                <X size={18} /> Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-8 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab("BULK")}
                    className={cn(
                        "pb-4 text-sm font-black transition-all relative",
                        activeTab === "BULK" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    Monthly Bulk Payroll
                    {activeTab === "BULK" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full animate-in slide-in-from-bottom-1" />}
                </button>
                <button
                    onClick={() => setActiveTab("INDIVIDUAL")}
                    className={cn(
                        "pb-4 text-sm font-black transition-all relative",
                        activeTab === "INDIVIDUAL" ? "text-purple-600" : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    Individual Settlements
                    {activeTab === "INDIVIDUAL" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-full animate-in slide-in-from-bottom-1" />}
                </button>
            </div>

            {/* Alert Banner */}
            {discrepanciesCount > 0 && (
                <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle size={18} className="text-amber-500" />
                        Pending Actions: {discrepanciesCount} Discrepancies Detected
                    </div>
                    <ChevronRight size={18} className="text-amber-500" />
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="border px-4 py-2 rounded-lg text-sm text-gray-700"
                    />
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                        All Departments <ChevronDown size={14} />
                    </button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search employee..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 border rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input 
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedRecordIds.length === records.length && records.length > 0}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedRecordIds(records.map(r => r.id));
                                        } else {
                                            setSelectedRecordIds([]);
                                        }
                                    }}
                                />
                            </th>
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Attendance Stats</th>
                            <th className="px-6 py-4 text-center">Earnings</th>
                            <th className="px-6 py-4 text-center">Deductions</th>
                            <th className="px-6 py-4">Net Pay</th>
                            <th className="px-6 py-4">Workflow Status</th>
                            <th className="px-6 py-4 text-right">Action/Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y relative">
                        {isLoadingRecords ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Records...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedRecords.length > 0 ? paginatedRecords.map((rec) => (
                            <React.Fragment key={rec.id}>
                                <tr className={cn(
                                    "hover:bg-gray-50/50 transition-colors",
                                    selectedRecordIds.includes(rec.id) ? "bg-blue-50/30" : ""
                                )}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={selectedRecordIds.includes(rec.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRecordIds([...selectedRecordIds, rec.id]);
                                                } else {
                                                    setSelectedRecordIds(selectedRecordIds.filter(id => id !== rec.id));
                                                }
                                            }}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-gray-100 shadow-sm shrink-0">
                                                <AvatarImage src={`https://avatar.vercel.sh/${rec.employeeName}`} />
                                                <AvatarFallback className="bg-blue-50 text-blue-600 text-[10px] font-bold">
                                                    {(rec.employeeName || '??').substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-gray-900 leading-tight">{rec.employeeName}</p>
                                                    {(rec.runStatus === "APPROVED" || rec.runStatus === "LOCKED") && (
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-tighter border",
                                                            rec.runStatus === "LOCKED" ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"
                                                        )}>
                                                            {rec.runStatus === "LOCKED" ? "LOCKED" : "APPROVED"}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{rec.empCode}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black text-emerald-600">{rec.presentDays}D</span>
                                                <span className="text-gray-300">/</span>
                                                <span className="text-[10px] font-bold text-gray-400">{rec.totalDays}D Total</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Tooltip>
                                                    <TooltipTrigger className="flex gap-1 items-center">
                                                        {rec.deductionsBreakdown?.holidayDays > 0 && <span className="w-5 h-5 flex items-center justify-center bg-sky-50 text-sky-600 text-[9px] font-black rounded border border-sky-100">🏖️</span>}
                                                        {rec.deductionsBreakdown?.paidLeaveDays > 0 && <span className="w-5 h-5 flex items-center justify-center bg-violet-50 text-violet-600 text-[9px] font-black rounded border border-violet-100">📝</span>}
                                                        {rec.deductionsBreakdown?.unmarkedDays > 0 && <span className="w-5 h-5 flex items-center justify-center bg-amber-50 text-amber-600 text-[9px] font-black rounded border border-amber-100">❓</span>}
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-white border p-2 rounded-lg shadow-xl text-[10px] font-bold">
                                                        <div className="space-y-1">
                                                            <p className="text-sky-600">🏖️ Holidays: {rec.deductionsBreakdown?.holidayDays || 0}</p>
                                                            <p className="text-violet-600">📝 Paid Leaves: {rec.deductionsBreakdown?.paidLeaveDays || 0}</p>
                                                            <p className="text-amber-600">❓ Unmarked (LOP): {rec.deductionsBreakdown?.unmarkedDays || 0}</p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-sm font-black text-gray-900">₹{Number(rec.grossSalary).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                        <div className="text-[10px] text-gray-400 font-bold">BASE GROSS</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <div className="space-y-0.5 group">
                                                        <div className={`text-sm font-black transition-all ${Number(rec.totalDeductions) > 0 ? "text-rose-600 group-hover:scale-110" : "text-gray-400"}`}>
                                                            ₹{Number(rec.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Total Audit</div>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="p-4 bg-white border border-gray-100 shadow-2xl rounded-2xl min-w-[200px]">
                                                    <div className="space-y-3">
                                                        <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b pb-2">Deduction Audit</h5>
                                                        <div className="space-y-2 text-[11px] font-bold">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Unmarked/Lops:</span>
                                                                <span className="text-rose-600">₹{Number(rec.deductionsBreakdown?.lopAmount || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Advance Salary:</span>
                                                                <span className="text-rose-600">₹{Number(rec.deductionsBreakdown?.advanceSalaryDeduction || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Loan EMI:</span>
                                                                <span className="text-rose-600">₹{Number(rec.deductionsBreakdown?.loanDeduction || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="pt-1 border-t flex justify-between font-black text-gray-900">
                                                                <span>Total Audit:</span>
                                                                <span>₹{Number(rec.totalDeductions).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-3 py-1 font-bold rounded-lg text-sm border",
                                            rec.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-100"
                                        )}>
                                            ₹{Number(rec.netPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    
                                    {/* NEW WORKFLOW COLUMN */}
                                    <td className="px-6 py-4">
                                        {rec.runStatus === 'PENDING_APPROVAL' && individualApprovalMap[rec.payrollRunId?.toString()] ? (
                                            <div className="flex flex-col gap-1.5 px-2.5 py-2 rounded-xl bg-gray-50/50 border border-gray-100/50 min-w-[140px] shadow-sm">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                                                        {individualApprovalMap[rec.payrollRunId.toString()].levelName || 'Awaiting Approval'}
                                                    </span>
                                                    <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100/50">
                                                        Step {individualApprovalMap[rec.payrollRunId.toString()].currentLevel || 1}/{individualApprovalMap[rec.payrollRunId.toString()].totalLevels || 1}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 ease-in-out" 
                                                        style={{ width: `${(individualApprovalMap[rec.payrollRunId.toString()].currentLevel / individualApprovalMap[rec.payrollRunId.toString()].totalLevels) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest italic",
                                                rec.runStatus === 'LOCKED' ? "text-slate-500" : (rec.runStatus === 'APPROVED' ? "text-emerald-500" : "text-gray-300")
                                            )}>
                                                {rec.runStatus === 'LOCKED' ? 'Locked' : (rec.runStatus === 'APPROVED' ? 'Finalized' : '—')}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {activeTab === "INDIVIDUAL" && rec.runStatus !== "LOCKED" && (
                                                <div className="flex items-center gap-2">
                                                    {(rec.runStatus === "DRAFT" || rec.runStatus === "REJECTED") && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toast.promise(submitRun(rec.payrollRunId).unwrap(), {
                                                                    loading: "Submitting for approval...",
                                                                    success: () => { refetchRuns(); refetchPending(); return "Sent for approval!"; },
                                                                    error: "Submission failed"
                                                                });
                                                            }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm whitespace-nowrap !bg-blue-600 !text-white hover:!bg-blue-700"
                                                            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                                                        >
                                                            <Check size={13} /> Send for Approval
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRun(rec.payrollRunId);
                                                        }}
                                                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer bg-rose-50 shadow-sm border border-rose-100"
                                                        title="Delete Settlement"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}

                                            {activeTab === "INDIVIDUAL" && rec.runStatus === "PENDING_APPROVAL" && individualApprovalMap[rec.payrollRunId?.toString()]?.canApprove && (
                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleWorkflowActionForRun(individualApprovalMap[rec.payrollRunId.toString()].requestId, "APPROVED")}
                                                        disabled={isStatusChanging}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                                                        style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                                                        title="Approve"
                                                    >
                                                        <Check size={13} /> Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleWorkflowActionForRun(individualApprovalMap[rec.payrollRunId.toString()].requestId, "REJECTED")}
                                                        disabled={isStatusChanging}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-all disabled:opacity-50"
                                                        style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                                                        title="Reject"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedRowId(expandedRowId === rec.id ? null : rec.id);
                                                }}
                                                className={cn(
                                                    "p-2 rounded-lg transition-all",
                                                    expandedRowId === rec.id ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-50"
                                                )}
                                            >
                                                <ChevronRight size={18} className={cn("transition-transform", expandedRowId === rec.id ? "rotate-90" : "")} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* 🛠️ DETAILED AUDIT VIEW (Expanded Row) */}
                                {expandedRowId === rec.id && (
                                    <tr className="bg-blue-50/20 border-l-4 border-l-indigo-600">
                                        <td colSpan={7} className="px-8 py-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                                {/* 1. Earnings Breakdown */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Earnings Master
                                                    </h4>
                                                    <div className="space-y-2 bg-white/50 p-4 rounded-xl border border-blue-100/50">
                                                        {Object.entries(rec.earningsBreakdown || {})
                                                            .filter(([k, v]) => Number(v) > 0)
                                                            .map(([k, v]) => (
                                                                <div key={k} className="flex justify-between text-sm">
                                                                    <span className={cn(
                                                                        "text-gray-500",
                                                                        (k === "Arrears/Incentives" || k === "Expense Reimbursement") && "text-blue-600 font-bold"
                                                                    )}>{k}</span>
                                                                    <span className={cn(
                                                                        "font-bold text-gray-900",
                                                                        (k === "Arrears/Incentives" || k === "Expense Reimbursement") && "text-blue-700"
                                                                    )}>₹{Number(v).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        <div className="pt-2 mt-2 border-t border-blue-100 flex justify-between text-sm font-black text-blue-600">
                                                            <span>Total Payable Gross</span>
                                                            <span>₹{Object.values(rec.earningsBreakdown || {}).reduce((sum, v) => sum + Number(v), 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1">
                                                            <span>Base Monthly Gross</span>
                                                            <span>₹{Number(rec.grossSalary).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Attendance Audit
                                                        </h4>
                                                        {rec.status !== 'LOCKED' && (
                                                            <button 
                                                                onClick={() => {
                                                                    setActiveOverrideRecord(rec);
                                                                    setIsOverrideModalOpen(true);
                                                                }}
                                                                className="p-1 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors"
                                                                title="Manual Override"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="space-y-3 bg-white/50 p-4 rounded-xl border border-amber-100/50">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
                                                            <div className="p-2 bg-white rounded-lg text-center border border-gray-100 shadow-sm">
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mb-2">Present Days</p>
                                                                <div className="flex justify-center items-center gap-2">
                                                                    <span className="text-xl font-black text-emerald-600">{Number(rec.presentDays || 0)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 bg-white rounded-lg text-center border border-gray-100 shadow-sm">
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mb-2">Absents & Unmarked</p>
                                                                <div className="flex justify-center items-center gap-2">
                                                                    <span className="text-xl font-black text-rose-600" title="Explicitly Marked Absent">{Number(rec.deductionsBreakdown?.rawAbsent || 0)}</span>
                                                                    <span className="text-gray-300 font-bold text-xs">+</span>
                                                                    <span className="text-xl font-black text-amber-500" title="Unmarked / Missing Punches">{Number(rec.deductionsBreakdown?.unmarkedDays || 0)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 bg-white rounded-lg text-center border border-gray-100 shadow-sm">
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight mb-2">Holidays & Leaves</p>
                                                                <div className="flex justify-center items-center gap-2">
                                                                    <span className="text-xl font-black text-emerald-600" title="Scheduled Holidays">{Number(rec.deductionsBreakdown?.holidayDays || 0)}</span>
                                                                    <span className="text-gray-300 font-bold text-xs">+</span>
                                                                    <span className="text-xl font-black text-blue-500" title="Paid Leaves">{Number(rec.deductionsBreakdown?.paidLeaveDays || 0)}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5 p-1">
                                                            <div className="flex justify-between text-[11px] font-bold">
                                                                <span className="text-gray-400">Scheduled Weekends</span>
                                                                <span className="text-gray-600">{rec.deductionsBreakdown?.weeklyOffDays || 0} days</span>
                                                            </div>
                                                            <div className="flex justify-between text-[11px] font-bold border-t pt-2 mt-2 border-amber-50 border-dashed">
                                                                <span className="text-gray-500">Half Day Deduction (0.5)</span>
                                                                <span className="text-amber-600">+{rec.deductionsBreakdown?.halfDayPenalty || 0} day</span>
                                                            </div>
                                                            <div className="flex justify-between text-[11px] font-bold">
                                                                <span className="text-gray-500">Penalty for Lates (3:1)</span>
                                                                <span className="text-amber-600">+{rec.deductionsBreakdown?.latePenaltyDays || 0} day</span>
                                                            </div>
                                                            <div className="flex justify-between text-[11px] font-bold">
                                                                <span className="text-gray-500">Excess Permission Penalty</span>
                                                                <span className="text-amber-600">+{rec.deductionsBreakdown?.permissionPenaltyDays || 0} day</span>
                                                            </div>
                                                        </div>

                                                        {Number(rec.lopDays || 0) > 0 && (
                                                            <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-100/50 mt-2">
                                                                <p className="text-[9px] font-black text-rose-800/50 uppercase tracking-widest mb-2">Calculation Formula</p>
                                                                <div className="flex justify-between text-[10px] font-bold text-gray-600 mb-1.5">
                                                                    <span>Total Deductible (LOP) Days</span>
                                                                    <span className="text-rose-700">{rec.lopDays} Days</span>
                                                                </div>
                                                                <div className="flex justify-between text-[10px] font-bold text-gray-600">
                                                                    {/* LOP is calculated on Base Gross (Excluding Incentives/Arrears) */}
                                                                    {(() => {
                                                                        const baseGrossForLOP = Number(rec.grossSalary) - Number(rec.earningsBreakdown?.["Arrears/Incentives"] || 0) - Number(rec.earningsBreakdown?.["Expense Reimbursement"] || 0);
                                                                        const perDay = baseGrossForLOP / Number(rec.totalDays);
                                                                        return (
                                                                            <>
                                                                                <span>Per Day Salary <span className="text-[9px] font-medium opacity-75 ml-1">(₹{baseGrossForLOP.toLocaleString()} ÷ {rec.totalDays})</span></span>
                                                                                <span className="text-rose-700">₹{perDay.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                                                            </>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="pt-3 mt-3 border-t border-amber-200 flex justify-between items-center">
                                                            <span className="text-sm text-gray-900 font-black">Total LOP Amount</span>
                                                            <span className="text-[17px] font-black text-rose-600">-₹{Number(rec.deductionsBreakdown?.lopAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 3. Statutory & Loans */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Statutory & Loans
                                                    </h4>
                                                    <div className="space-y-2 bg-white/50 p-4 rounded-xl border border-rose-100/50">
                                                        <div className="flex justify-between text-sm font-bold">
                                                            <span className="text-gray-400">PF (Employee 12%)</span>
                                                            <span className="text-gray-900">₹{Number(rec.deductionsBreakdown?.pfEmployee || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm font-bold">
                                                            <span className="text-gray-400">ESI (Employee 0.75%)</span>
                                                            <span className="text-gray-900">₹{Number(rec.deductionsBreakdown?.esiEmployee || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-sm font-bold">
                                                            <span className="text-gray-400">Professional Tax</span>
                                                            <span className="text-gray-900">₹{Number(rec.deductionsBreakdown?.professionalTax || 0).toLocaleString()}</span>
                                                        </div>
                                                        {Number(rec.deductionsBreakdown?.totalEmi || 0) > 0 && (
                                                            <div className="flex justify-between text-sm pt-2 mt-2 border-t border-rose-100 border-dashed">
                                                                <span className="text-gray-500 flex items-center gap-2 font-black italic">
                                                                    <AlertCircle size={14} className="text-rose-500" /> Loan EMI
                                                                </span>
                                                                <span className="font-black text-rose-600">₹{Number(rec.deductionsBreakdown?.totalEmi).toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 🛠️ ACTIONABLE APPROVAL FOOTER IN EXPANDED VIEW */}
                                            {activeTab === "INDIVIDUAL" && rec.runStatus === "PENDING_APPROVAL" && individualApprovalMap[rec.payrollRunId?.toString()]?.canApprove && (
                                                <div className="mt-8 pt-6 border-t border-blue-100 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                                                            <Shield size={24} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                                                Pending Functional Approval
                                                            </h4>
                                                            <p className="text-xs text-gray-500 font-medium">Verify the calculations above before finalizing this settlement.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleWorkflowActionForRun(individualApprovalMap[rec.payrollRunId.toString()].requestId, "APPROVED")}
                                                            disabled={isStatusChanging}
                                                            style={{ backgroundColor: '#10b981', color: '#ffffff' }}
                                                            className="px-6 py-3 bg-emerald-600 !text-white font-black rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                                                        >
                                                            <Check size={18} /> Approve Settlement
                                                        </button>
                                                        <button
                                                            onClick={() => handleWorkflowActionForRun(individualApprovalMap[rec.payrollRunId.toString()].requestId, "REJECTED")}
                                                            disabled={isStatusChanging}
                                                            style={{ backgroundColor: '#ef4444', color: '#ffffff' }}
                                                            className="px-6 py-3 bg-rose-600 !text-white font-black rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all flex items-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                                                        >
                                                            <X size={18} /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {activeTab === "INDIVIDUAL" && rec.runStatus === "PENDING_APPROVAL" && (
                                                !individualApprovalMap[rec.payrollRunId?.toString()] || 
                                                !individualApprovalMap[rec.payrollRunId?.toString()].canApprove
                                            ) && (
                                                 <div className="mt-8 pt-6 border-t border-amber-100 flex items-center justify-between bg-amber-50/50 p-4 rounded-xl border border-dashed border-amber-200">
                                                    <div className="flex items-center gap-3">
                                                        <AlertTriangle className="text-amber-500" size={20} />
                                                        <p className="text-xs text-amber-800 font-medium italic">
                                                            Workflow request detected but not actionable by your current session. Please check your role permissions or Reporting Manager status.
                                                        </p>
                                                    </div>
                                                 </div>
                                            )}
                                        </td>
                                    </tr>
                                )}

                                {/* Discrepancy Sub-row if exists */}
                                {rec.hasDiscrepancy === "YES" && (
                                    <tr className="bg-amber-50/30">
                                        <td colSpan={5} className="px-6 py-3 border-l-2 border-l-amber-500">
                                            <div className="flex items-center justify-between pl-8">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="font-semibold text-gray-900">Discrepancy Detected |</span>
                                                    <span className="text-gray-600">{rec.discrepancyReason}</span>
                                                </div>
                                                <button
                                                    onClick={() => setExpandedRowId(expandedRowId === rec.id ? null : rec.id)}
                                                    className="px-4 py-1.5 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700"
                                                >
                                                    {expandedRowId === rec.id ? "Close Audit" : "Audit This"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    {isLoadingRecords ? "Loading records..." : currentRun ? "No records found for this criteria." : "No payroll calculated for this month yet. Click 'Run Calculation' to get started."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            {filteredRecords.length > itemsPerPage && (
                <div className="flex items-center justify-between px-2">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Showing <span className="text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of <span className="text-gray-900">{filteredRecords.length}</span> Employees
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                                            : "bg-white text-gray-400 border hover:bg-gray-50 hover:text-gray-600"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Totals Summary Card */}
            {filteredRecords.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex gap-12">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Gross</p>
                                <p className="text-xl font-black text-gray-900">₹{filteredRecords.reduce((acc, r) => acc + Number(r.grossSalary), 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Deductions</p>
                                <p className="text-xl font-black text-rose-600">₹{filteredRecords.reduce((acc, r) => acc + Number(r.totalDeductions), 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Net Disbursement</p>
                                <p className="text-xl font-black text-emerald-600">₹{filteredRecords.reduce((acc, r) => acc + Number(r.netPay), 0).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Count</p>
                             <p className="text-2xl font-black text-blue-600">{filteredRecords.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Individual Payroll Modal */}
            {isIndividualModalOpen && (
                <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Process Individual</h3>
                                    <p className="text-sm text-slate-500 font-medium italic">Select one or more employees for mid-month settlement</p>
                                </div>
                                <button 
                                    onClick={() => setIsIndividualModalOpen(false)}
                                    className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or employee code..."
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="max-h-72 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                    {allEmployees
                                        .filter(emp => {
                                            const fullName = `${emp.firstName} ${emp.lastName || ""}`.toLowerCase();
                                            return !searchQuery || 
                                                fullName.includes(searchQuery.toLowerCase()) || 
                                                emp.empCode?.toLowerCase().includes(searchQuery.toLowerCase())
                                        })
                                        .map(emp => {
                                            const fullName = `${emp.firstName} ${emp.lastName || ""}`;
                                            const isSelected = selectedEmployeeIds.includes(emp.userId);
                                            
                                            return (
                                                <div 
                                                    key={emp.userId}
                                                    onClick={() => {
                                                        setSelectedEmployeeIds(prev => 
                                                            isSelected 
                                                                ? prev.filter(id => id !== emp.userId)
                                                                : [...prev, emp.userId]
                                                        )
                                                    }}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2",
                                                        isSelected
                                                            ? "bg-blue-50 border-blue-200"
                                                            : "bg-white border-transparent hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm shadow-sm">
                                                            {emp.firstName?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800">{fullName}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emp.empCode}</p>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                        isSelected
                                                            ? "bg-blue-600 border-blue-600 text-white"
                                                            : "border-slate-200"
                                                    )}>
                                                        {isSelected && <Check size={14} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2">
                                <button 
                                    onClick={() => setIsIndividualModalOpen(false)}
                                    className="flex-1 px-6 py-4 border border-slate-100 !bg-white !text-slate-600 font-black text-sm rounded-2xl hover:!bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleIndividualProcess}
                                    disabled={selectedEmployeeIds.length === 0 || isProcessing}
                                    className="flex-[2] px-6 py-4 !bg-blue-600 !text-white font-black text-sm rounded-2xl hover:!bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? "Processing..." : (
                                        <>
                                            <PlayCircle size={18} />
                                            Generate for {selectedEmployeeIds.length} Employees
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Manual Override Modal */}
            {isOverrideModalOpen && activeOverrideRecord && (
                <ManualOverrideModal 
                    isOpen={isOverrideModalOpen}
                    onClose={() => {
                        setIsOverrideModalOpen(false);
                        setActiveOverrideRecord(null);
                    }}
                    record={activeOverrideRecord}
                    onSave={async (data) => {
                        try {
                            await overridePayrollRecord({ 
                                recordId: activeOverrideRecord.id,
                                ...data 
                            }).unwrap();
                            toast.success("Manual override applied successfully!");
                            setIsOverrideModalOpen(false);
                            setActiveOverrideRecord(null);
                            refetch();
                        } catch (e) {
                            toast.error(e?.data?.message || "Failed to apply override");
                        }
                    }}
                    isLoading={isOverriding}
                />
            )}
            {/* Payroll Approval Modal */}
            {isApprovalModalOpen && currentApprovalRequest && (
                <PayrollApprovalModal
                    isOpen={isApprovalModalOpen}
                    onClose={() => setIsApprovalModalOpen(false)}
                    action={decisionAction}
                    request={currentApprovalRequest}
                    onConfirm={(comment) => handleWorkflowActionForRun(currentApprovalRequest.requestId, decisionAction, comment)}
                    isLoading={isStatusChanging}
                />
            )}
        </div>
    );
};

const ManualOverrideModal = ({ isOpen, onClose, record, onSave, isLoading }) => {
    const [formData, setFormData] = useState({
        payableDays: record.payableDays,
        lopDays: record.lopDays,
        rawAbsent: record.deductionsBreakdown?.rawAbsent || 0,
        unmarkedDays: record.deductionsBreakdown?.unmarkedDays || 0,
        latePenaltyDays: record.deductionsBreakdown?.latePenaltyDays || 0,
        halfDayPenalty: record.deductionsBreakdown?.halfDayPenalty || 0,
        permissionPenaltyDays: record.deductionsBreakdown?.permissionPenaltyDays || 0,
        reason: record.discrepancyReason?.replace("Manual Override: ", "") || ""
    });

    const perDaySalary = Number(record.grossSalary) / Number(record.totalDays);
    
    // Recalculate LOP Days based on components if they are edited
    const calculateTotalLOP = (data) => {
        return Number(data.rawAbsent || 0) + 
               Number(data.unmarkedDays || 0) + 
               Number(data.latePenaltyDays || 0) + 
               Number(data.halfDayPenalty || 0) + 
               Number(data.permissionPenaltyDays || 0);
    };

    const estimatedLOP = Number(formData.lopDays) * perDaySalary;

    return (
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-300">
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Manual Override</h3>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Adjust Attendance for {record.employeeName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Absent Days</label>
                            <input 
                                type="number" step="0.5"
                                value={formData.rawAbsent}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => {
                                        const next = { ...prev, rawAbsent: val };
                                        const totalLOP = calculateTotalLOP(next);
                                        return { 
                                            ...next, 
                                            lopDays: totalLOP,
                                            payableDays: Math.max(0, Number(record.totalDays) - totalLOP)
                                        };
                                    });
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-bold text-rose-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Unmarked Days</label>
                            <input 
                                type="number" step="0.5"
                                value={formData.unmarkedDays}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => {
                                        const next = { ...prev, unmarkedDays: val };
                                        const totalLOP = calculateTotalLOP(next);
                                        return { 
                                            ...next, 
                                            lopDays: totalLOP,
                                            payableDays: Math.max(0, Number(record.totalDays) - totalLOP)
                                        };
                                    });
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-bold text-amber-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Late Penalty (Days)</label>
                            <input 
                                type="number" step="0.25"
                                value={formData.latePenaltyDays}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => {
                                        const next = { ...prev, latePenaltyDays: val };
                                        const totalLOP = calculateTotalLOP(next);
                                        return { 
                                            ...next, 
                                            lopDays: totalLOP,
                                            payableDays: Math.max(0, Number(record.totalDays) - totalLOP)
                                        };
                                    });
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-bold text-amber-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Half Day Penalty (Days)</label>
                            <input 
                                type="number" step="0.5"
                                value={formData.halfDayPenalty}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => {
                                        const next = { ...prev, halfDayPenalty: val };
                                        const totalLOP = calculateTotalLOP(next);
                                        return { 
                                            ...next, 
                                            lopDays: totalLOP,
                                            payableDays: Math.max(0, Number(record.totalDays) - totalLOP)
                                        };
                                    });
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-bold text-orange-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Perm. Penalty (Days)</label>
                            <input 
                                type="number" step="0.25"
                                value={formData.permissionPenaltyDays}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => {
                                        const next = { ...prev, permissionPenaltyDays: val };
                                        const totalLOP = calculateTotalLOP(next);
                                        return { 
                                            ...next, 
                                            lopDays: totalLOP,
                                            payableDays: Math.max(0, Number(record.totalDays) - totalLOP)
                                        };
                                    });
                                }}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-bold text-amber-600"
                            />
                        </div>

                        <div className="col-span-2 pt-2 border-t border-slate-100 flex gap-4">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">Total LOP Days</label>
                                <input 
                                    type="number" step="0.5"
                                    value={formData.lopDays}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            lopDays: val,
                                            payableDays: Math.max(0, Number(record.totalDays) - Number(val))
                                        }));
                                    }}
                                    className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-100 rounded-xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-black text-blue-600"
                                />
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Final Payable Days</label>
                                <input 
                                    type="number" step="0.5"
                                    value={formData.payableDays}
                                    readOnly
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm font-bold text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Override Reason / Remarks</label>
                            <input 
                                type="text"
                                placeholder="e.g. Special approval for emergency leave"
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Final LOP Amount</p>
                            <p className="text-xl font-black text-rose-600">₹{estimatedLOP.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] font-bold text-slate-400 uppercase">Per Day: ₹{perDaySalary.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 !bg-slate-100 !text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:!bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => onSave(formData)}
                            disabled={isLoading || record.status === 'LOCKED'}
                            className="flex-[2] px-6 py-3.5 !bg-blue-600 !text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:!bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? "Saving..." : record.status === 'LOCKED' ? "Record Locked" : "Apply Adjustments"}
                        </button>
                    </div>
                    {record.status === 'LOCKED' && (
                        <p className="text-[10px] text-rose-500 font-black text-center uppercase tracking-widest mt-2 animate-pulse">
                            ⚠️ Changes cannot be saved to a locked payroll record
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const PayrollApprovalModal = ({ isOpen, onClose, action, request, onConfirm, isLoading }) => {
    const [comment, setComment] = useState("");
    const isReject = action === "REJECTED";

    return (
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                                isReject ? "bg-rose-100 text-rose-600 shadow-rose-100" : "bg-emerald-100 text-emerald-600 shadow-emerald-100"
                            )}>
                                {isReject ? <AlertTriangle size={24} /> : <Shield size={24} />}
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                    {isReject ? "Reject Payroll Run" : "Approve Payroll Run"}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirming Workflow Decision</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-500 uppercase text-[10px] tracking-widest">Period</span>
                            <span className="text-slate-900">{new Date(`${request.period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-slate-500 uppercase text-[10px] tracking-widest">Workflow Stage</span>
                            <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-xs">{request.levelName}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                            Decision Notes {isReject && <span className="text-rose-500 font-bold">*</span>}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={isReject ? "Please state the reason for rejection..." : "Any notes regarding this approval..."}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-3xl text-sm focus:border-blue-500/20 focus:bg-white transition-all font-medium min-h-[120px] outline-none"
                        />
                        {isReject && !comment.trim() && (
                            <p className="text-[10px] text-rose-500 font-bold pl-1 italic">Rejection requires a reason</p>
                        )}
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 !bg-slate-100 !text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:!bg-slate-200 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(comment)}
                            disabled={isLoading || (isReject && !comment.trim())}
                            className={cn(
                                "flex-[2] px-6 py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2",
                                isReject 
                                    ? "!bg-rose-600 !text-white hover:!bg-rose-700 shadow-rose-100" 
                                    : "!bg-emerald-600 !text-white hover:!bg-emerald-700 shadow-emerald-100"
                            )}
                        >
                            {isLoading ? "Processing..." : (
                                <>
                                    {isReject ? <X size={16} /> : <Check size={16} />}
                                    Confirm {action === "APPROVED" ? "Approval" : "Rejection"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
