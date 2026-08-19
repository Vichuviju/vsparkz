import React, { useMemo } from "react";
import { useGetPayrollRunsQuery, useGetPayrollRecordsQuery } from "@/services/hrms/salaryManagement.api";
import { CheckCircle2, TrendingUp, TrendingDown, Users, Wallet, Check, AlertTriangle, FileText, BarChart3, PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export const PayrollDashboard = () => {
    const { data: runs = [], isLoading } = useGetPayrollRunsQuery();
    
    // Stats based on latest run
    const latestRun = runs[0]; 
    const { data: records = [] } = useGetPayrollRecordsQuery(latestRun?.id, { skip: !latestRun?.id });

    // 🔹 Aggregate Salary Composition (Earnings)
    const salaryCompositionData = useMemo(() => {
        if (!records.length) return [];
        const totals = {};
        records.forEach(rec => {
            const breakdown = typeof rec.earningsBreakdown === 'string' ? JSON.parse(rec.earningsBreakdown) : (rec.earningsBreakdown || {});
            Object.entries(breakdown).forEach(([key, val]) => {
                if (Number(val) > 0 && !["Arrears/Incentives", "Expense Reimbursement"].includes(key)) {
                    totals[key] = (totals[key] || 0) + Number(val);
                }
            });
        });
        return Object.entries(totals).map(([name, value]) => ({ name, value }));
    }, [records]);

    // 🔹 Aggregate Departmental Costing
    const departmentalData = useMemo(() => {
        if (!records.length) return [];
        const deptMap = {};
        records.forEach(rec => {
            const dept = rec.departmentName || "General";
            deptMap[dept] = (deptMap[dept] || 0) + Number(rec.netPay);
        });
        return Object.entries(deptMap).map(([name, total]) => ({ name, total }));
    }, [records]);

    if (isLoading) {
        return <div className="p-10 text-center text-gray-500">Loading payroll overview...</div>;
    }

    const totalGross = latestRun?.totalGrossSalary || 0;
    const totalDeductions = latestRun?.totalDeductions || 0;
    const totalNetPay = latestRun?.totalNetPay || 0;
    const totalEmployees = latestRun?.totalEmployeesProcessed || 0;

    // 🔹 Robust Workflow Status Logic
    const runStatus = latestRun?.status?.toUpperCase();
    const payStatus = latestRun?.paymentStatus?.toUpperCase();

    const isCompleted = runStatus === "LOCKED" || payStatus === "PAID";
    const isCalculated = isCompleted || ["APPROVED", "PENDING_APPROVAL"].includes(runStatus);
    const isStarted = !!latestRun;

    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                     {/* <h1 className="text-2xl font-bold text-gray-800">Payroll Dashboard</h1> */}
                     <p className="text-sm text-gray-500">Overview of salary distributions and recent processing cycles.</p>
                </div>
                <div className="px-4 py-2 bg-white border rounded-lg text-sm font-medium text-gray-700 shadow-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Last Updated: {latestRun ? new Date(latestRun.updatedAt).toLocaleDateString() : 'N/A'}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-gray-500 mb-2">Total Gross Salary</p>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-gray-900">₹{Number(totalGross).toLocaleString('en-IN')}</p>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={18} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-gray-500 mb-2">Total Deductions</p>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-gray-900">₹{Number(totalDeductions).toLocaleString('en-IN')}</p>
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><TrendingDown size={18} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-gray-500 mb-2">Total Net Pay</p>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-gray-900">₹{Number(totalNetPay).toLocaleString('en-IN')}</p>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={18} /></div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-gray-500 mb-2">Processed Employees</p>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18} /></div>
                    </div>
                </div>
            </div>

            {/* Standard Payroll Workflow */}

             {/* Dynamic Insights */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <PieIcon size={18} className="text-blue-600" />
                            Salary Composition
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Earnings Breakdown</span>
                    </div>
                    
                    <div className="h-[250px] w-full">
                        {salaryCompositionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={salaryCompositionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {salaryCompositionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        formatter={(val) => `₹${Number(val).toLocaleString()}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <PieIcon size={32} className="text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400 font-medium">No component data available for this run</p>
                            </div>
                        )}
                    </div>
                    
                    {salaryCompositionData.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {salaryCompositionData.slice(0, 4).map((item, i) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase truncate">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <BarChart3 size={18} className="text-emerald-600" />
                            Departmental Costing
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Distribution</span>
                    </div>

                    <div className="h-[250px] w-full">
                        {departmentalData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={departmentalData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }} 
                                    />
                                    <YAxis hide />
                                    <RechartsTooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        formatter={(val) => `₹${Number(val).toLocaleString()}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <BarChart3 size={32} className="text-gray-200 mb-2" />
                                <p className="text-xs text-gray-400 font-medium">Departmental data will appear after locking</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>

             {/* Recent Runs Table */}
             <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Payroll Cycle History</h2>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="px-6 py-4 font-medium">Period</th>
                            <th className="px-6 py-4 font-medium">Employees</th>
                            <th className="px-6 py-4 font-medium">Total Net Distribution</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                        {runs.map(run => (
                            <tr key={run.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{run.month}/{run.year}</td>
                                <td className="px-6 py-4 text-gray-600">{run.totalEmployeesProcessed} People</td>
                                <td className="px-6 py-4 text-gray-900 font-semibold">₹{Number(run.totalNetPay).toLocaleString('en-IN')}</td>
                                <td className="px-6 py-4">
                                     {run.status === "LOCKED" ? (
                                         <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold text-xs uppercase">
                                            <CheckCircle2 size={12} /> Finalized
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-bold text-xs uppercase">
                                            <AlertTriangle size={12} /> {run.status}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {runs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-medium">No payroll cycles have been initiated yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
};
