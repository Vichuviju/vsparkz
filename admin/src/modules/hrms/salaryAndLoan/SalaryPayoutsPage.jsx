import React, { useState, useMemo, useEffect } from 'react';
import { 
    Calendar, 
    Download, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Search, 
    ChevronRight,
    ChevronLeft, 
    Filter, 
    ArrowRight, 
    CreditCard,
    Building,
    User,
    FileText,
    History,
    Check,
    Eye,
    TrendingUp,
    TrendingDown,
    X
} from 'lucide-react';
import { 
    useGetPayoutsQuery, 
    useUpdatePayoutStatusMutation,
    useUpdateIndividualPayoutStatusMutation,
    useGetPayrollRecordsQuery 
} from '@/services/hrms/salaryManagement.api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useHRMSPermissions } from '@/hooks/useHRMSPermissions';
import { exportToCSV } from '@/lib/exportUtils';

const StatusBadge = ({ status, onClick, clickable }) => {
    const configs = {
        PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200', icon: Clock, label: 'Pending Payout' },
        PROCESSING: { color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200', icon: ArrowRight, label: 'In Progress' },
        PAID: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200', icon: CheckCircle2, label: 'Disbursed' },
        FAILED: { color: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200', icon: AlertCircle, label: 'Payment Failed' }
    };

    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;

    return (
        <div 
            onClick={(e) => {
                if (clickable && onClick) {
                    e.stopPropagation();
                    onClick(e);
                }
            }}
            className={cn(
                "px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all", 
                clickable && "cursor-pointer",
                config.color
            )}
        >
            <Icon size={12} />
            {config.label}
        </div>
    );
};

const TypeBadge = ({ type }) => {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm",
            type === "INDIVIDUAL" 
                ? "bg-purple-50 text-purple-700 border-purple-100" 
                : "bg-blue-50 text-blue-700 border-blue-100"
        )}>
            {type === "INDIVIDUAL" ? "Individual" : "Monthly"}
        </span>
    );
};

export const SalaryPayoutsPage = () => {
    const { checkPermission } = useHRMSPermissions();
    const canProcess = checkPermission('/hrms/payroll/process', 'calculate');
    const canApprove = checkPermission('/hrms/payroll/process', 'approve');
    const canView = checkPermission('/hrms/payroll/process', 'view');

    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedRunId, setSelectedRunId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    // Batch Modal State
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [payoutForm, setPayoutForm] = useState({ status: 'PAID', reference: '', paidAt: new Date().toISOString().split('T')[0] });

    // Individual Modal State
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
    const [individualForm, setIndividualForm] = useState({ status: 'PAID', reference: '', paidAt: new Date().toISOString().split('T')[0] });

    // Breakdown Modal State
    const [selectedBreakdown, setSelectedBreakdown] = useState(null);
    const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);

    const { data: runs = [], isLoading: runsLoading } = useGetPayoutsQuery();
    
    // Auto-select latest run on load
    useEffect(() => {
        if (runs.length > 0 && !selectedRunId) {
            setSelectedRunId(runs[0].id);
            setSelectedMonth(runs[0].period);
        }
    }, [runs, selectedRunId]);

    // Derive selectedRun from runs array using the ID
    const selectedRun = useMemo(() => runs.find(r => r.id === selectedRunId), [runs, selectedRunId]);

    const { data: records = [], isLoading: recordsLoading } = useGetPayrollRecordsQuery(selectedRun?.id, { skip: !selectedRun?.id });
    const [updatePayoutStatus, { isLoading: isUpdating }] = useUpdatePayoutStatusMutation();
    const [updateIndividualStatus, { isLoading: isUpdatingIndividual }] = useUpdateIndividualPayoutStatusMutation();

    // Group runs by year for scalability
    const groupedRuns = useMemo(() => {
        const groups = {};
        runs.forEach(run => {
            const year = run.period.split('-')[0];
            if (!groups[year]) groups[year] = [];
            groups[year].push(run);
        });
        // Sort years descending
        return Object.entries(groups).sort((a, b) => b[0] - a[0]);
    }, [runs]);

    // Stats - Prioritize selected run context
    const effectivePeriod = selectedRun?.period || selectedMonth;
    
    const totalToPay = useMemo(() => runs.filter(r => r.paymentStatus !== 'PAID').reduce((sum, r) => sum + Number(r.totalNetPay), 0), [runs]);
    const paidThisMonth = useMemo(() => {
        const monthRuns = runs.filter(r => r.period === effectivePeriod);
        return monthRuns.filter(r => r.paymentStatus === 'PAID').reduce((sum, r) => sum + Number(r.totalNetPay), 0);
    }, [runs, effectivePeriod]);

    const filteredRecords = useMemo(() => {
        if (!searchQuery) return records;
        return records.filter(r => 
            r.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            r.empCode?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [records, searchQuery]);

    // Reset pagination when selection or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedRunId, searchQuery]);

    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredRecords, currentPage]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        try {
            await updatePayoutStatus({
                runId: selectedRun.id,
                ...payoutForm
            }).unwrap();
            toast.success("Batch status updated and cascaded to all employees!");
            setIsPayoutModalOpen(false);
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update payout status");
        }
    };

    const handleIndividualUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateIndividualStatus({
                recordId: selectedRecord.id,
                ...individualForm
            }).unwrap();
            toast.success("Individual payment status updated!");
            setIsIndividualModalOpen(false);
            setSelectedRecord(null);
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update status");
        }
    };

    const openIndividualModal = (rec) => {
        setSelectedRecord(rec);
        setIndividualForm({
            status: rec.paymentStatus || 'PAID',
            reference: rec.paymentReference || '',
            paidAt: rec.paidAt ? rec.paidAt.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setIsIndividualModalOpen(true);
    };

    const handleDownloadIndividual = (rec) => {
        const monthLabel = new Date(`${selectedRun.period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
        const payslipHTML = generatePayslipHTML([rec], monthLabel);
        printPayslips(payslipHTML, monthLabel);
    };

    const handleDownloadAll = () => {
        const monthLabel = new Date(`${selectedRun.period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' });
        const payslipHTML = generatePayslipHTML(records, monthLabel);
        printPayslips(payslipHTML, monthLabel);
    };

    const handleExportReports = () => {
        if (!selectedRun || records.length === 0) {
            toast.error("No records found to export");
            return;
        }

        const reportData = records.map(rec => {
            const earnings = typeof rec.earningsBreakdown === 'string' ? JSON.parse(rec.earningsBreakdown) : (rec.earningsBreakdown || {});
            const deductions = typeof rec.deductionsBreakdown === 'string' ? JSON.parse(rec.deductionsBreakdown) : (rec.deductionsBreakdown || {});
            
            return {
                "Employee Name": rec.employeeName,
                "Employee Code": rec.empCode,
                "Period": selectedRun.period,
                "Payable Days": rec.payableDays,
                "LOP Days": rec.lopDays,
                "Gross Salary": Number(rec.grossSalary).toFixed(2),
                "Earnings Total": Number(rec.totalEarnings).toFixed(2),
                "LOP Amount": Number(deductions.lopAmount || 0).toFixed(2),
                "PF (Employee)": Number(deductions.pfEmployee || 0).toFixed(2),
                "ESI (Employee)": Number(deductions.esiEmployee || 0).toFixed(2),
                "Professional Tax": Number(deductions.professionalTax || 0).toFixed(2),
                "Loan EMI": Number(deductions.totalEmi || 0).toFixed(2),
                "Total Deductions": Number(rec.totalDeductions).toFixed(2),
                "Net Payable": Number(rec.netPay).toFixed(2),
                "Payment Status": rec.paymentStatus || selectedRun.paymentStatus,
                "Reference": rec.paymentReference || selectedRun.paymentReference || 'N/A',
                "Paid Date": rec.paidAt ? rec.paidAt.split('T')[0] : 'N/A'
            };
        });

        const fileName = `Payout_Report_${selectedRun.period}_${selectedRun.runType}`;
        exportToCSV(reportData, fileName);
        toast.success("Payout report exported successfully!");
    };

    const generatePayslipHTML = (recs, monthLabel) => {
        return recs.map(rec => {
            const earnings = typeof rec.earningsBreakdown === 'string' ? JSON.parse(rec.earningsBreakdown) : (rec.earningsBreakdown || {});
            const deductions = typeof rec.deductionsBreakdown === 'string' ? JSON.parse(rec.deductionsBreakdown) : (rec.deductionsBreakdown || {});
            
            const earningRows = Object.entries(earnings)
                .filter(([, v]) => Number(v) > 0)
                .map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right">₹${Number(v).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>`)
                .join('');

            const deductionRows = [
                deductions.lopAmount > 0 && `<tr><td>Loss of Pay (${rec.lopDays} days)</td><td style="text-align:right;color:#dc2626">₹${Number(deductions.lopAmount).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>`,
                deductions.totalEmi > 0 && `<tr><td>Loan EMI</td><td style="text-align:right;color:#dc2626">₹${Number(deductions.totalEmi).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>`,
                deductions.pfEmployee > 0 && `<tr><td>PF Contribution</td><td style="text-align:right;color:#dc2626">₹${Number(deductions.pfEmployee).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>`,
                deductions.esiEmployee > 0 && `<tr><td>ESI Contribution</td><td style="text-align:right;color:#dc2626">₹${Number(deductions.esiEmployee).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>`,
                deductions.professionalTax > 0 && `<tr><td>Professional Tax</td><td style="text-align:right;color:#dc2626">₹${Number(deductions.professionalTax).toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>`,
            ].filter(Boolean).join('');

            return `
            <div style="page-break-after:always;padding:40px;font-family:Arial,sans-serif;max-width:800px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;background:white;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #4f46e5">
                    <div><h1 style="margin:0;color:#1e1b4b;font-size:22px">LOGZE HRMS</h1><p style="margin:4px 0 0;color:#6b7280;font-size:12px">Salary Slip — ${monthLabel}</p></div>
                    <div style="text-align:right"><span style="background:#f0fdf4;color:#15803d;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:bold">VERIFIED PAYOUT</span></div>
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
                    <span style="font-size:14px;font-weight:600">NET DISBURSED</span>
                    <span style="font-size:22px;font-weight:800">₹${Number(rec.netPay).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
                </div>
                <p style="text-align:center;font-size:10px;color:#9ca3af;margin-top:20px">This is a computer-generated payout advice and does not require a physical signature.</p>
            </div>`;
        }).join('');
    };

    const printPayslips = (html, label) => {
        const win = window.open('', '_blank');
        if (!win) {
            toast.error("Popup blocked! Please allow popups to download payslips.");
            return;
        }
        win.document.write(`<!DOCTYPE html><html><head><title>Payslips — ${label}</title><style>body{margin:0;background:#f3f4f6;padding:20px} @media print{body{background:white;padding:0}}</style></head><body>${html}<script>window.onload=()=>{window.print()}<\/script></body></html>`);
        win.document.close();
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-gray-50/50 min-h-screen max-h-screen flex flex-col font-urbanist overflow-hidden">
            
            {/* Header Section */}
            <div className="flex-none flex items-center justify-between">
                <div>
                    {/* <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <History className="text-blue-600" size={32} />
                        Payouts & History
                    </h1> */}
                    <p className="text-gray-500 mt-1 font-medium text-xs">Manage salary disbursements and historical financial records</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 !bg-white border border-gray-200 !text-gray-700 rounded-xl hover:!bg-gray-50 font-semibold shadow-sm transition-all text-sm">
                        <Filter size={16} /> Filters
                    </button>
                    <button 
                        onClick={handleExportReports}
                        className="flex items-center gap-2 px-4 py-2 !bg-blue-700 !text-white rounded-xl hover:!bg-blue-800 font-bold shadow-lg shadow-blue-200/50 transition-all text-sm"
                    >
                        <Download size={16} /> Export Reports
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="flex-none grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <div className="flex items-center gap-2 text-blue-600">
                        <CreditCard size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pending Payout</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">₹{totalToPay.toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-bold">
                        <Clock size={12} /> ACTION REQUIRED
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Disbursed (Month)</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">₹{paidThisMonth.toLocaleString('en-IN')}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                        <ArrowRight size={12} /> SUCCESSFUL
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-1">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Building size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Batches</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{runs.length}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                        System Capacity
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-4">
                {/* Left Side: Run List */}
                <div className="lg:col-span-4 flex flex-col min-h-0">
                    <div className="flex-none flex items-center justify-between px-2 mb-4">
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={16} /> Locked History
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                        {runsLoading ? (
                            [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse mb-3" />)
                        ) : groupedRuns.map(([year, yearRuns]) => (
                            <div key={year} className="space-y-3">
                                <div className="flex items-center gap-3 px-2">
                                    <span className="text-lg font-black text-gray-300">{year}</span>
                                    <div className="flex-1 h-px bg-gray-100" />
                                </div>
                                {yearRuns.map(run => (
                                    <div 
                                        key={run.id}
                                        onClick={() => {
                                            setSelectedRunId(run.id);
                                            setSelectedMonth(run.period);
                                        }}
                                        className={cn(
                                            "p-5 rounded-2xl border transition-all cursor-pointer group",
                                            selectedRunId === run.id 
                                                ? "bg-white border-blue-200 shadow-lg ring-2 ring-blue-50/50" 
                                                : "bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-lg font-black text-gray-900 leading-none">
                                                        {new Date(`${run.period}-01`).toLocaleString('default', { month: 'long' })}
                                                    </p>
                                                    <TypeBadge type={run.runType} />
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold">
                                                    <User size={12} /> {run.totalEmployeesProcessed} Employees
                                                </div>
                                            </div>
                                            <StatusBadge status={run.paymentStatus} />
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <p className="text-sm font-black text-blue-700">₹{Number(run.totalNetPay).toLocaleString('en-IN')}</p>
                                            <ChevronRight className={cn("text-gray-300 transition-transform", selectedRun?.id === run.id && "translate-x-1 text-blue-400")} size={18} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Employee Details */}
                <div className="lg:col-span-8 flex flex-col min-h-0 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {!selectedRun ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-white border-dashed">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-300 mb-6">
                                <FileText size={40} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">Select a month</h2>
                            <p className="text-gray-400 mt-2 font-medium">Choose a locked payroll run from the history sidebar</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Run Detail Header */}
                            <div className="flex-none p-6 border-b border-gray-100 bg-gray-50/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    {/* <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">
                                        Details for {new Date(`${selectedRun.period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </h2> */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative group flex-none">
                                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input 
                                                type="text" 
                                                placeholder="Search by name or employee ID..." 
                                                className="h-10 w-72 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm group-hover:border-slate-300"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        {selectedRun.paymentReference && (
                                            <div className="h-10 px-4 bg-blue-50/50 text-blue-700 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-blue-100 flex items-center gap-2 shadow-sm transition-all hover:bg-blue-50">
                                                <div className="size-5 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                                <span className="text-blue-400 font-medium mr-1">REF:</span> 
                                                {selectedRun.paymentReference}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {canView && (
                                        <button 
                                            onClick={handleDownloadAll}
                                            className="h-10 px-4 !bg-white border border-gray-200 !text-gray-700 rounded-xl hover:!bg-gray-50 font-bold transition-all text-sm flex items-center gap-2"
                                        >
                                            <Download size={16} /> Bulk Advice
                                        </button>
                                    )}
                                    {canApprove && selectedRun.paymentStatus !== "PAID" && (
                                        <button 
                                            onClick={() => setIsPayoutModalOpen(true)}
                                            className="h-10 px-6 !bg-emerald-700 !text-white rounded-xl hover:!bg-emerald-800 font-black shadow-lg shadow-emerald-200/50 transition-all text-sm uppercase tracking-widest flex items-center gap-2"
                                        >
                                            <Check size={18} /> Mark as Paid
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Employee List Table */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-0">
                                    <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm border-b">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Employee</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Period Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">Net Payable</th>
                                            <th className="px-6 py-4 border-b"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {recordsLoading ? (
                                            [1,2,3,4,5,6,7].map(i => <tr key={i}><td colSpan={4} className="px-6 py-6 h-20 bg-white animate-pulse" /></tr>)
                                        ) : filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <p className="text-gray-400 font-medium">No results found matching your search</p>
                                                </td>
                                            </tr>
                                        ) : paginatedRecords.map(rec => (
                                            <tr 
                                                key={rec.id} 
                                                onClick={() => {
                                                    setSelectedBreakdown(rec);
                                                    setIsBreakdownModalOpen(true);
                                                }}
                                                className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-sm shadow-blue-100 group-hover:scale-105 transition-transform duration-300">
                                                            {rec.employeeName?.[0] || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-black text-sm text-gray-900 tracking-tight">{rec.employeeName}</p>
                                                                {(rec.employeeStatus?.toUpperCase() === 'TERMINATED' || rec.employeeStatus?.toUpperCase() === 'RESIGNED') && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black uppercase tracking-widest">
                                                                        {rec.employeeStatus}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{rec.empCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge 
                                                            status={rec.paymentStatus || selectedRun.paymentStatus} 
                                                            clickable={canApprove}
                                                            onClick={() => canApprove && openIndividualModal(rec)}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-black text-sm text-blue-700 tracking-tight">₹{Number(rec.netPay).toLocaleString('en-IN')}</p>
                                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Final Amount</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {canView && (
                                                            <>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedBreakdown(rec);
                                                                        setIsBreakdownModalOpen(true);
                                                                    }}
                                                                    className="p-2 !text-gray-400 hover:!text-blue-600 hover:!bg-blue-50 rounded-lg transition-all"
                                                                    title="View Breakdown"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDownloadIndividual(rec);
                                                                    }}
                                                                    className="p-2 !text-gray-400 hover:!text-blue-600 hover:!bg-blue-50 rounded-lg transition-all"
                                                                    title="Download Advice"
                                                                >
                                                                    <Download size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Footer */}
                            {filteredRecords.length > ITEMS_PER_PAGE && (
                                <div className="flex-none px-8 py-6 border-t border-gray-100 bg-white flex items-center justify-between rounded-b-3xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                        Showing <span className="text-gray-900 font-black">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-gray-900 font-black">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)}</span> of <span className="text-gray-900 font-black">{filteredRecords.length}</span> Employees
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <button 
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                            className="h-10 px-6 rounded-2xl border border-gray-100 !bg-white !text-slate-400 text-[11px] font-black uppercase tracking-widest hover:!bg-slate-50 hover:!text-blue-600 disabled:!opacity-20 disabled:!cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <ChevronLeft size={14} strokeWidth={3} />
                                            Previous
                                        </button>
                                        <div className="flex items-center gap-2 px-1">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={cn(
                                                        "w-10 h-10 !p-0 rounded-xl text-[12px] font-black transition-all flex items-center justify-center border",
                                                        currentPage === i + 1 
                                                            ? "!bg-blue-600 !text-white !border-blue-600 shadow-lg shadow-blue-100 scale-110 z-10" 
                                                            : "!bg-white !text-slate-400 border-slate-100 hover:border-blue-200 hover:!text-blue-600"
                                                    )}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button 
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                            className="h-10 px-6 rounded-2xl border border-gray-100 !bg-white !text-slate-400 text-[11px] font-black uppercase tracking-widest hover:!bg-slate-50 hover:!text-blue-600 disabled:!opacity-20 disabled:!cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
                                        >
                                            Next
                                            <ChevronRight size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Styles for custom scrollbar */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}} />

            {/* Payout Confirmation Modal (Batch) */}
            {isPayoutModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight uppercase tracking-widest">Confirm Batch Payment</h3>
                            <p className="text-white/80 text-sm mt-2 font-medium">Verify bank transfer details before finalizing the run</p>
                            <CreditCard className="absolute top-8 right-8 text-white/20" size={48} />
                        </div>
                        <form onSubmit={handleUpdateStatus} className="p-8 space-y-6 bg-white">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Payment Status</label>
                                    <select 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-100 outline-none"
                                        value={payoutForm.status}
                                        onChange={e => setPayoutForm({...payoutForm, status: e.target.value})}
                                    >
                                        <option value="PAID">Disbursed (Success)</option>
                                        <option value="PROCESSING">Processing (In Transfer)</option>
                                        <option value="FAILED">Payment Failed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Bank Reference Number</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="e.g. TXN982341..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-100 outline-none"
                                        value={payoutForm.reference}
                                        onChange={e => setPayoutForm({...payoutForm, reference: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Payment Date</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-100 outline-none"
                                        value={payoutForm.paidAt}
                                        onChange={e => setPayoutForm({...payoutForm, paidAt: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsPayoutModalOpen(false)}
                                    className="flex-1 py-3 !text-gray-500 font-black uppercase tracking-widest text-xs hover:!bg-gray-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-3 py-3 !bg-emerald-700 !text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-emerald-200/50 hover:!bg-emerald-800 transition-all flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? "Finalizing..." : <><Check size={16} /> Finalize Payment</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Individual Payout Modal */}
            {isIndividualModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 bg-gradient-to-br from-blue-600 to-purple-700 text-white relative">
                            <h3 className="text-2xl font-black tracking-tight uppercase tracking-widest">Individual Payout</h3>
                            <p className="text-white/80 text-sm mt-2 font-medium">Update status for {selectedRecord?.employeeName}</p>
                            <User className="absolute top-8 right-8 text-white/20" size={48} />
                        </div>
                        <form onSubmit={handleIndividualUpdate} className="p-8 space-y-6 bg-white">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Employee Payment Status</label>
                                    <select 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={individualForm.status}
                                        onChange={e => setIndividualForm({...individualForm, status: e.target.value})}
                                    >
                                        <option value="PAID">Disbursed (Success)</option>
                                        <option value="PENDING">Pending (Draft)</option>
                                        <option value="PROCESSING">Processing (In Transfer)</option>
                                        <option value="FAILED">Payment Failed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Bank Ref (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. TXN982341..."
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={individualForm.reference}
                                        onChange={e => setIndividualForm({...individualForm, reference: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Payment Date</label>
                                    <input 
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none"
                                        value={individualForm.paidAt}
                                        onChange={e => setIndividualForm({...individualForm, paidAt: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setIsIndividualModalOpen(false);
                                        setSelectedRecord(null);
                                    }}
                                    className="flex-1 py-3 !text-gray-500 font-black uppercase tracking-widest text-xs hover:!bg-gray-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isUpdatingIndividual}
                                    className="flex-3 py-3 !bg-blue-700 !text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-blue-200/50 hover:!bg-blue-800 transition-all flex items-center justify-center gap-2"
                                >
                                    {isUpdatingIndividual ? "Updating..." : <><Check size={16} /> Update Status</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Salary Breakdown Modal */}
            {isBreakdownModalOpen && selectedBreakdown && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-900/60 p-4 overflow-hidden z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header (Fixed) */}
                        <div className="p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white relative flex-none">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight uppercase tracking-widest leading-none">Salary Breakdown</h3>
                                    <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">{selectedBreakdown.employeeName} — {new Date(`${selectedRun.period}-01`).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                                </div>
                                <button 
                                    onClick={() => setIsBreakdownModalOpen(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 outline-none border border-white/10"
                                    title="Close"
                                >
                                    <X size={20} strokeWidth={3} />
                                </button>
                            </div>
                            
                            {/* Attendance Scorecard */}
                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Days</p>
                                        <p className="text-xl font-black">{selectedBreakdown.payableDays} <span className="text-xs text-slate-500 italic">of {selectedBreakdown.totalDays}</span></p>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loss of Pay</p>
                                        <p className="text-xl font-black">{selectedBreakdown.lopDays} <span className="text-xs text-slate-500 italic">Days</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white custom-scrollbar">
                            {/* Earnings Column */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <TrendingUp size={18} />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Earnings & Add-ons</h4>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(selectedBreakdown.earningsBreakdown || {}).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50">
                                            <span className="text-xs font-bold text-gray-500">{key}</span>
                                            <span className="text-sm font-black text-gray-900">₹{Number(val).toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Deductions Column */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 text-rose-600">
                                    <TrendingDown size={18} />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Detections & Deductions</h4>
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(selectedBreakdown.deductionsBreakdown || {}).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50">
                                            <span className="text-xs font-bold text-gray-500">
                                                {key === 'lopAmount' ? 'Loss of Pay' : 
                                                 key === 'totalEmi' ? 'Loan EMI' :
                                                 key === 'pfEmployee' ? 'PF (Employee)' :
                                                 key === 'esiEmployee' ? 'ESI (Employee)' :
                                                 key === 'professionalTax' ? 'Prof. Tax' : key}
                                            </span>
                                            <span className="text-sm font-black text-rose-600">₹{Number(val).toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer (Fixed) */}
                        <div className="p-8 bg-gray-50 flex-none border-t border-gray-100 flex flex-col gap-4">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Gross Salary</p>
                                    <p className="text-lg font-black text-gray-900">₹{Number(selectedBreakdown.grossSalary).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Deductions</p>
                                    <p className="text-lg font-black text-rose-600">₹{Number(selectedBreakdown.totalDeductions).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Net Disbursed Amount</p>
                                    <p className="text-3xl font-black text-gray-900 tracking-tighter">₹{Number(selectedBreakdown.netPay).toLocaleString('en-IN')}</p>
                                </div>
                                <button 
                                    onClick={() => setIsBreakdownModalOpen(false)}
                                    className="px-8 py-3 !bg-gray-900 !text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:!bg-gray-800 transition-all shadow-xl shadow-gray-200"
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryPayoutsPage;
