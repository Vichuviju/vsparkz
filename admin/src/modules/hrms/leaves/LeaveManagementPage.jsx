import React, { useState, useMemo } from 'react';
import { 
    Users, 
    Search, 
    Plus, 
    Minus, 
    History, 
    ArrowUpDown,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    Info,
    Layout
} from 'lucide-react';
import { 
    useGetAllLeaveBalancesQuery, 
    useAdjustLeaveBalanceMutation 
} from "@/services/hrms/leaves.api.js";
import { useGetLeaveConfigsQuery } from "@/services/hrms/leaveConfig.api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-inputs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Card = ({ children, className = "" }) => (
    <div className={cn("bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden", className)}>
        {children}
    </div>
);

const Badge = ({ children, variant = "default" }) => {
    const styles = {
        default: "bg-slate-100 text-slate-700",
        emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
        orange: "bg-orange-50 text-orange-700 border-orange-100",
        indigo: "bg-blue-50 text-blue-700 border-blue-100",
    };
    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border", styles[variant])}>
            {children}
        </span>
    );
};

export const LeaveManagementPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({
        leaveCode: "",
        amount: "",
        action: "ADD", // ADD or SUBTRACT
        reason: ""
    });

    const { data: balanceData, isLoading: isBalancesLoading, refetch } = useGetAllLeaveBalancesQuery();
    const { data: configData } = useGetLeaveConfigsQuery();
    const [adjustBalance, { isLoading: isAdjusting }] = useAdjustLeaveBalanceMutation();

    const employees = useMemo(() => balanceData?.data || [], [balanceData]);
    const leaveTypes = useMemo(() => configData?.data || [], [configData]);

    const filteredEmployees = employees.filter(emp => 
        (emp.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.empCode || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAdjust = async () => {
        if (!selectedEmployee) return;
        if (!adjustmentData.leaveCode || !adjustmentData.amount) {
            return toast.error("Please fill all adjustment details");
        }

        try {
            await adjustBalance({
                userId: selectedEmployee.userId,
                leaveCode: adjustmentData.leaveCode,
                amount: Number(adjustmentData.amount),
                action: adjustmentData.action
            }).unwrap();

            toast.success(`Successfully ${adjustmentData.action === 'ADD' ? 'credited' : 'debited'} leaves`);
            setSelectedEmployee(null);
            setAdjustmentData({ leaveCode: "", amount: "", action: "ADD", reason: "" });
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || "Failed to adjust balance");
        }
    };

    return (
        <div className="p-4 md:p-8  bg-slate-50 dark:bg-slate-800 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                                <Users size={24} />
                            </div>
                            Leave Balance Management
                        </h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Manual credit/debit overrides for individual employees.</p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            placeholder="Search employee..." 
                            className="pl-10 rounded-xl bg-white border-slate-200 shadow-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Employee List */}
                    <Card className="lg:col-span-2 flex flex-col min-h-[600px] border-none shadow-xl bg-white">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Employees & Balances</span>
                            <span className="bg-white px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 text-slate-500 shadow-sm">
                                {filteredEmployees.length} RECORDS
                            </span>
                        </div>

                        <div className="flex-grow overflow-auto p-2">
                            {isBalancesLoading ? (
                                <div className="p-8 text-center text-slate-400 italic">Loading employee records...</div>
                            ) : filteredEmployees.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 opacity-50 flex flex-col items-center gap-3">
                                    <Search size={48} />
                                    <p className="font-bold text-sm tracking-widest uppercase">No employees found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredEmployees.map((emp) => (
                                        <div 
                                            key={emp.userId}
                                            onClick={() => setSelectedEmployee(emp)}
                                            className={cn(
                                                "p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-md",
                                                selectedEmployee?.userId === emp.userId 
                                                    ? "bg-blue-50 border-blue-200 ring-2 ring-blue-600/10" 
                                                    : "bg-white border-slate-100 hover:border-blue-100"
                                            )}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 uppercase text-xs">
                                                        {emp.employeeName?.substring(0,2)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 leading-none">{emp.employeeName}</h4>
                                                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{emp.empCode || 'NO CODE'}</p>
                                                    </div>
                                                </div>
                                                <Layout size={14} className={cn("transition-colors", selectedEmployee?.userId === emp.userId ? "text-blue-600" : "text-slate-300")} />
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {Object.entries(emp.balances || {}).map(([code, bal]) => (
                                                    <div key={code} className="flex flex-col items-center px-3 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{code}</span>
                                                        <span className="text-xs font-black text-slate-700">{bal.remaining}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Adjustment Sidebar */}
                    <div className="space-y-6">
                        <Card className="p-6 border-none shadow-2xl bg-white sticky top-8">
                            {selectedEmployee ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                                        <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-200">
                                            <ArrowUpDown size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 leading-tight">Adjust Balance</h3>
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Employee: {selectedEmployee?.employeeName}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Leave Type</label>
                                            <CustomSelect 
                                                value={adjustmentData.leaveCode}
                                                onChange={(v) => setAdjustmentData(prev => ({ ...prev, leaveCode: v }))}
                                                placeholder="Select leave type..."
                                                options={Object.keys(selectedEmployee.balances || {}).map(code => ({ 
                                                    value: code, 
                                                    label: code 
                                                }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Adjustment Type</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => setAdjustmentData(prev => ({ ...prev, action: 'ADD' }))}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-black transition-all",
                                                        adjustmentData.action === 'ADD' 
                                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                                                            : "bg-white border-slate-100 text-slate-400 grayscale opacity-70"
                                                    )}
                                                >
                                                    <Plus size={14} /> CREDIT
                                                </button>
                                                <button 
                                                    onClick={() => setAdjustmentData(prev => ({ ...prev, action: 'SUBTRACT' }))}
                                                    className={cn(
                                                        "flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-black transition-all",
                                                        adjustmentData.action === 'SUBTRACT' 
                                                            ? "bg-rose-50 border-rose-200 text-rose-700 shadow-sm" 
                                                            : "bg-white border-slate-100 text-slate-400 grayscale opacity-70"
                                                    )}
                                                >
                                                    <Minus size={14} /> DEBIT
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Amount (Days)</label>
                                            <Input 
                                                type="number" 
                                                placeholder="Enter number of days..." 
                                                className="rounded-xl border-slate-200 focus:ring-blue-500 font-bold"
                                                value={adjustmentData.amount}
                                                onChange={(e) => setAdjustmentData(prev => ({ ...prev, amount: e.target.value }))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Reason (Internal Note)</label>
                                            <textarea 
                                                placeholder="Enter reason for adjustment..." 
                                                className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                                value={adjustmentData.reason}
                                                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                                            />
                                        </div>

                                        <div className="pt-4 space-y-3">
                                            <Button 
                                                onClick={handleAdjust}
                                                disabled={isAdjusting}
                                                className={cn(
                                                    "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg transition-all",
                                                    adjustmentData.action === 'ADD' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                                                )}
                                            >
                                                {isAdjusting ? 'Processing...' : `Confirm ${adjustmentData.action === 'ADD' ? 'Credit' : 'Debit'}`}
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                className="w-full font-bold text-slate-400 hover:text-slate-600"
                                                onClick={() => setSelectedEmployee(null)}
                                            >
                                                Cancel Selection
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                                        <Plus size={32} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">No Employee Selected</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">Select an employee from the list to adjust their leave balance.</p>
                                    </div>
                                </div>
                            )}
                        </Card>

                        <Card className="p-6 bg-blue-900 text-white border-none shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <h4 className="font-black uppercase tracking-widest text-[11px] text-blue-300 flex items-center gap-2 mb-4">
                                <Info size={14} /> Audit Notice
                            </h4>
                            <p className="text-xs font-medium text-blue-100/80 leading-relaxed">
                                Manual balance adjustments are applied immediately. All changes are logged for financial audit and compliance tracking.
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
