import React, { useState } from 'react';
import { 
  Users, UserCheck, Clock, 
  Calendar, Briefcase, TrendingUp,
  Activity, ChevronLeft, ChevronRight,
  DollarSign, BarChart3, PieChart as PieIcon,
  CheckCircle2, AlertCircle, UserX,
  FileText, ShieldCheck, Settings,
  ArrowUpRight, Play, CheckSquare, Mail
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import { Link } from 'react-router-dom';
import { useGetHrmsSummaryQuery, useNudgeEmployeeMutation } from '@/services/hrms/dashboard.api';
import { toast } from 'react-hot-toast';

export function HrmsAdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data, isLoading } = useGetHrmsSummaryQuery(selectedDate);
  const [nudgeEmployee] = useNudgeEmployeeMutation();
  const [nudgingId, setNudgingId] = useState(null);
  const [nudgedIds, setNudgedIds] = useState(new Set());
  const summary = data?.data;

  const handleNudge = async (empId, empName) => {
    if (nudgedIds.has(empId)) return;
    setNudgingId(empId);
    try {
      await nudgeEmployee(empId).unwrap();
      setNudgedIds(prev => new Set([...prev, empId]));
      toast.success(`Nudge sent to ${empName}`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send nudge");
    } finally {
      setNudgingId(null);
    }
  };

  const handleDateChange = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center  bg-slate-50 dark:bg-slate-800">
        <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-indigo-600"></div>
            <div className="mt-4 text-slate-500 font-bold text-center animate-pulse">Syncing Command Center...</div>
        </div>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const statsCards = [
    { label: 'Total Strength', value: summary?.employeeStats?.total || 0, icon: Users, color: 'from-blue-600 to-indigo-700', trend: 'Live' },
    { label: 'Active Employees', value: summary?.employeeStats?.active || 0, icon: UserCheck, color: 'from-emerald-500 to-teal-600', trend: 'Live' },
    { label: 'Today\'s Attendance', value: summary?.attendanceSummary?.find(s => s.status !== 'Absent')?.count || 0, icon: Activity, color: 'from-blue-500 to-purple-600', sub: 'Present + Late' },
    { label: 'Pending Actions', value: summary?.approvalBreakdown?.reduce((acc, b) => acc + b.count, 0) || 0, icon: Clock, color: 'from-amber-400 to-orange-600', sub: 'Across all modules' },
  ];

  const quickActions = [
    { label: 'Process Payroll', icon: Play, path: '/hrms/payroll/process', color: 'bg-emerald-500' },
    { label: 'Approve Leaves', icon: CheckSquare, path: '/hrms/approvals/unified', color: 'bg-blue-500' },
    { label: 'View Audit Logs', icon: FileText, path: '/hrms/admin/audit', color: 'bg-slate-700' },
    { label: 'HR Settings', icon: Settings, path: '/hrms/admin/settings', color: 'bg-rose-500' },
  ];

  return (
    <div className="p-8 space-y-10 bg-[#f8fafc] min-h-screen font-urbanist">
      {/* Filters Area */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Operational Intelligence</p>
            <h2 className="text-xl font-black text-slate-800">{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center bg-slate-50 rounded-[1.5rem] border border-slate-100 shadow-inner overflow-hidden p-1">
                  <button onClick={() => handleDateChange(-1)} className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"><ChevronLeft size={18} /></button>
                  <div className="px-4 flex items-center gap-3 border-x border-slate-200/50 group/date">
                      <Calendar size={14} className="text-slate-300 group-hover/date:text-blue-500 transition-colors" />
                      <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="bg-transparent border-none text-[13px] font-black text-slate-700 focus:ring-0 cursor-pointer p-0" 
                      />
                  </div>
                  <button onClick={() => handleDateChange(1)} className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-blue-600"><ChevronRight size={18} /></button>
              </div>
              <button 
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-8 py-4 !bg-blue-600 !text-white text-[11px] font-black rounded-2xl hover:!bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 uppercase tracking-[0.2em] border-none"
              >
                  Today
              </button>
          </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, i) => (
          <div key={i} className="relative group overflow-hidden bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-5 rounded-bl-full`}></div>
            <div className="flex items-start justify-between mb-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.color} text-white shadow-xl shadow-blue-100`}>
                <card.icon size={28} />
              </div>
              <div className="flex flex-col items-end">
                 <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                    <ArrowUpRight size={14} />
                    {card.trend || 'Live'}
                 </div>
              </div>
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{card.label}</p>
            <h3 className="text-4xl font-black text-slate-900 mb-1">{card.value}</h3>
            {card.sub && <p className="text-[10px] text-blue-500 font-black uppercase tracking-tighter">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Attendance Intelligence */}
        <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Workforce Presence Trend</h3>
                        <p className="text-slate-400 text-sm font-bold">Historical data for the last 10 operational days</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            Present
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase">
                            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            Absent
                        </div>
                    </div>
                </div>
                <div className="h-[350px] flex items-center justify-center">
                    {summary?.attendanceTrend?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary.attendanceTrend}>
                                <defs>
                                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorPresent)" />
                                <Area type="monotone" dataKey="absent" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                            <BarChart3 size={64} className="text-slate-300" />
                            <div className="space-y-1">
                                <p className="text-slate-900 font-black text-lg">No Trend Data Available</p>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Attendance records needed for visualization</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Critical Exceptions Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Late Arrivals */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Clock size={20} className="text-orange-500" />
                            Late Arrivals
                        </h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase">{summary?.lateEmployees?.length || 0} Flagged</span>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 styled-scrollbar">
                        {summary?.lateEmployees?.length > 0 ? (
                            summary.lateEmployees.map((emp, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-orange-50/50 border border-orange-100 hover:bg-white hover:shadow-lg hover:border-white transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-orange-600 font-black">
                                            {emp.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Login: {emp.checkIn ? new Date(emp.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-black rounded-lg uppercase tracking-wider border border-orange-100">
                                        Late Entry
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={32} />
                                <p className="text-slate-400 text-sm font-bold italic">Perfect Punctuality!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Absents */}
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                                <UserX size={20} />
                            </div>
                            Critical Absents
                        </h4>
                        <div className="px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{summary?.absentEmployees?.length || 0} Missing</span>
                        </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 styled-scrollbar">
                        {summary?.absentEmployees?.length > 0 ? (
                            summary.absentEmployees.map((emp, i) => (
                                <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100 hover:shadow-xl hover:shadow-rose-100/20 hover:border-rose-100 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 font-black text-lg shadow-sm border border-rose-100/50">
                                            {emp.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-base mb-0.5">{emp.name}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded-md uppercase tracking-wider">
                                                    {emp.dept || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleNudge(emp.id, emp.name)}
                                        disabled={nudgingId === emp.id || nudgedIds.has(emp.id)}
                                        className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all border uppercase tracking-[0.1em] flex items-center gap-2 ${
                                            nudgedIds.has(emp.id) 
                                            ? '!bg-emerald-50 !text-emerald-600 border-emerald-100 cursor-default' 
                                            : '!bg-rose-600 !text-white border-transparent hover:!bg-rose-700 shadow-sm hover:shadow-md active:scale-95'
                                        } disabled:opacity-50`}
                                    >
                                        {nudgingId === emp.id ? (
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : nudgedIds.has(emp.id) ? (
                                            <CheckCircle2 size={12} />
                                        ) : (
                                            <Mail size={12} />
                                        )}
                                        {nudgingId === emp.id ? 'Sending...' : nudgedIds.has(emp.id) ? 'Notified' : 'Notify'}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={32} />
                                <p className="text-slate-400 text-sm font-bold italic">Full Attendance Today!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Sidebar - Controls & Financials */}
        <div className="lg:col-span-4 space-y-8">
            {/* Quick Controls */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-slate-400">Control Panel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quickActions.map((action, i) => (
                        <Link key={i} to={action.path} className={`${action.color} p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-lg group shadow-slate-200/50`}>
                            <action.icon size={28} className="text-white stroke-[2.5px] group-hover:animate-bounce transition-transform" />
                            <span className="text-[11px] font-black uppercase text-center leading-tight tracking-[0.15em] text-white drop-shadow-sm">
                                {action.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Payroll Deep Dive */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900">Payroll Cycle</h3>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <DollarSign size={20} />
                    </div>
                </div>
                
                {summary?.payrollSummary ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</p>
                                <p className="font-black text-slate-900 text-lg flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${summary.payrollSummary.status === 'APPROVED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                    {summary.payrollSummary.status}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Processed</p>
                                <p className="font-black text-slate-900 text-lg">{summary.payrollSummary.totalEmployeesProcessed} <span className="text-xs text-slate-400">Staff</span></p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Net Payable</p>
                                    <h4 className="text-3xl font-black text-slate-900">₹ {Number(summary.payrollSummary.totalNetPay).toLocaleString()}</h4>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(summary.payrollSummary.totalNetPay / summary.payrollSummary.totalGrossSalary) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Gross</p>
                                <p className="font-black text-slate-800">
                                    ₹ {( (Number(summary.payrollSummary.totalNetPay) + Number(summary.payrollSummary.totalDeductions)) / 1000 ).toFixed(1)}k
                                </p>
                             </div>
                             <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Deduction</p>
                                <p className="font-black text-rose-500">
                                    ₹ {(Number(summary.payrollSummary.totalDeductions) / 1000).toFixed(1)}k
                                </p>
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <AlertCircle className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-400 text-sm font-bold">No active payroll run</p>
                        <Link to="/hrms/payroll/process" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-100">Initialize Cycle</Link>
                    </div>
                )}
            </div>

            {/* Approval Breakdown */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8">Approval Backlog</h3>
                <div className="space-y-4">
                    {summary?.approvalBreakdown?.length > 0 ? (
                        summary.approvalBreakdown.map((b, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`}></div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">{b.module}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900">{b.count}</span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${COLORS[i % COLORS.length]}`} style={{ width: `${(b.count / 20) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8 text-slate-300 font-bold italic">Inbox is clear!</p>
                    )}
                </div>
                <Link to="/hrms/approvals/unified" className="mt-8 flex items-center justify-center w-full py-4 bg-slate-50 text-blue-600 text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-blue-50 transition-colors border border-dashed border-blue-200">
                    Enter Approval Center
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
