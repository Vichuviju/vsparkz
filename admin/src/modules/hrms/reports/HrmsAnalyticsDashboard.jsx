import React, { useMemo } from "react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    LineChart, 
    Line, 
    AreaChart, 
    Area 
} from "recharts";
import { 
    TrendingUp, 
    Users, 
    DollarSign, 
    Clock, 
    ArrowUpRight, 
    ArrowDownRight,
    PieChart as PieChartIcon,
    Activity,
    BarChart3
} from "lucide-react";
import { useGetPayoutsQuery } from "@/services/hrms/salaryManagement.api";
import { useGetAttendanceStatsQuery } from "@/services/hrms/attendance.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { formatIndianCurrency } from "@/utils/formatIndianCurrency";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const StatCard = ({ label, value, trend, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl ${colorClass}`}>
                <Icon size={24} />
            </div>
            <div className={`flex items-center gap-1 text-xs font-black ${trend > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(trend)}%
            </div>
        </div>
        <div className="mt-4 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
    </div>
);

export const HrmsAnalyticsDashboard = () => {
    const { data: payouts = [] } = useGetPayoutsQuery();
    const { data: employeesRes } = useGetAllEmployeesQuery();
    
    const today = new Date();
    const dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];
    const { data: attendanceStats } = useGetAttendanceStatsQuery({ dateFrom, dateTo });

    const salaryTrendData = useMemo(() => {
        return payouts.slice(-6).map(p => ({
            name: p.period ? new Date(p.period + "-01").toLocaleDateString('en-IN', { month: 'short' }) : p.month,
            amount: Number(p.totalNetPay || 0)
        }));
    }, [payouts]);

    const deptDistributionData = useMemo(() => {
        const employees = employeesRes?.data || [];
        const distribution = {};
        employees.forEach(emp => {
            const dept = emp.departmentName || "Others";
            distribution[dept] = (distribution[dept] || 0) + 1;
        });
        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    }, [employeesRes]);

    const attendanceTrendData = useMemo(() => {
        if (!attendanceStats?.trend) return [];
        return attendanceStats.trend.slice(-7).map(t => ({
            name: new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' }),
            rate: t.total > 0 ? Math.round((t.ontime / t.total) * 100) : 0
        }));
    }, [attendanceStats]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">HR Management Analytics</h1>
                <p className="text-sm text-slate-500 font-medium">Visualizing organizational performance and financial health</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    label="Total Workforce" 
                    value={employeesRes?.data?.length || 0} 
                    trend={0} 
                    icon={Users} 
                    colorClass="bg-blue-50 text-blue-600" 
                />
                <StatCard 
                    label="Monthly Payroll" 
                    value={formatIndianCurrency(payouts[payouts.length - 1]?.totalNetPay || 0)} 
                    trend={0} 
                    icon={DollarSign} 
                    colorClass="bg-emerald-50 text-emerald-600" 
                />
                <StatCard 
                    label="Avg. Attendance" 
                    value={attendanceStats?.kpis?.onTimeRate || "0%"} 
                    trend={0} 
                    icon={Activity} 
                    colorClass="bg-amber-50 text-amber-600" 
                />
                <StatCard 
                    label="OT Hours (MTD)" 
                    value={`${attendanceStats?.kpis?.overtimeTotal || 0}h`} 
                    trend={0} 
                    icon={Clock} 
                    colorClass="bg-rose-50 text-rose-600" 
                />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Salary Trend */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-800">Salary Payout Trend</h2>
                        <TrendingUp size={20} className="text-slate-300" />
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salaryTrendData}>
                                <defs>
                                    <linearGradient id="colorSal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                    tickFormatter={(value) => `₹${value/100000}L`}
                                />
                                <Tooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800}}
                                    formatter={(value) => formatIndianCurrency(value)}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Attendance Rate */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-800">Attendance Performance (%)</h2>
                        <Activity size={20} className="text-slate-300" />
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={attendanceTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                                    domain={[80, 100]}
                                />
                                <Tooltip 
                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800}}
                                />
                                <Line type="stepAfter" dataKey="rate" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Dept Distribution */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 md:col-span-1">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-800">Headcount by Dept</h2>
                        <PieChartIcon size={20} className="text-slate-300" />
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deptDistributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {deptDistributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                        {deptDistributionData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                                <span className="text-[10px] font-black text-slate-500 uppercase">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Statutory Distribution (Mock) */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-800">Statutory Liability Distribution</h2>
                        <BarChart3 size={20} className="text-slate-300" />
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'PF', employee: 45000, employer: 48000 },
                                { name: 'ESI', employee: 12000, employer: 32000 },
                                { name: 'PT', employee: 8000, employer: 0 },
                                { name: 'LWF', employee: 200, employer: 400 },
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                <Tooltip />
                                <Bar dataKey="employee" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={20} />
                                <Bar dataKey="employer" fill="#10b981" radius={[10, 10, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase">Employee Share</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase">Employer Share</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
