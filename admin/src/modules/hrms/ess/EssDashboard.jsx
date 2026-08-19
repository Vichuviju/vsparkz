import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  FileText,
  CalendarDays,
  Bell,
  X,
  ChevronRight,
  Download,
  TrendingUp,
  LogOut,
  Cloud,
  MousePointer2,
  Calendar,
  AlertCircle,
  Plus,
  ArrowUpRight,
  User,
  Mail,
  Phone,
  Briefcase,
  Users,
  Settings,
  HelpCircle,
  PlayCircle,
  Banknote,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyLeaveBalanceQuery, useGetMyLeavesQuery } from "@/services/hrms/leaves.api";
import { useGetPayoutsQuery } from "@/services/hrms/salaryManagement.api";
import { useGetIndividualEmployeeAttendanceQuery } from "@/services/hrms/attendance.api";
import { useGetEmployeeByIdQuery, useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateLoanMutation, useGetMyLoansQuery } from "@/services/hrms/loan.api";
import { useCreateExpensesMutation, useGetMyExpensesQuery } from "@/services/hrms/expense.api";
import { useGetHolidayQuery } from "@/services/hrms/holiday.api";
import { toast } from "react-hot-toast";


// ── Helpers ─────────────────────────────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const fmtDate = (d) => {
    return new Date(d).toLocaleDateString("en-US", { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
    });
};

const fmtTime = (d) => {
    if (!d) return "--:--";
    const date = new Date(d);
    return date.toLocaleTimeString("en-IN", { 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true 
    });
};

// ── Quick Action Card ────────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, title, subtitle, color, onClick, value }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-all cursor-pointer group"
  >
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-current/10 transition-transform group-hover:scale-110`}>
      <Icon size={24} className="text-white" />
    </div>
    <div className="text-center">
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
      {value && <p className="text-xs font-bold mt-1 text-green-600">{value}</p>}
    </div>
  </div>
);

// ── KPI Mini Card ────────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, title, value, subtitle, trend, color, linkTo }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-xl font-black text-slate-800">{value}</h3>
          {trend && <span className="text-[10px] font-bold text-green-500">{trend}</span>}
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    <Link to={linkTo} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors mt-auto">
      View Details <ChevronRight size={10} />
    </Link>
  </div>
);

// ── Progress Circle ──────────────────────────────────────────────────────────
const ProgressCircle = ({ percentage, label, sublabel }) => {
    const size = 100;
    const stroke = 8;
    const radius = (size / 2) - stroke;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative w-28 h-28">
            <svg height="100%" width="100%" viewBox="0 0 100 100" className="-rotate-90">
                <circle
                    stroke="#f1f5f9"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={radius}
                    cx={50}
                    cy={50}
                />
                <circle
                    stroke="#6366f1"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={radius}
                    cx={50}
                    cy={50}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-slate-800 leading-none">{percentage}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{label}</span>
            </div>
        </div>
    );
};

// ── Notification Item ────────────────────────────────────────────────────────
const NotificationItem = ({ icon: Icon, color, text, time }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0 text-white shadow-sm`}>
      <Icon size={18} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-700 font-medium leading-relaxed group-hover:text-blue-600 transition-colors">{text}</p>
      <p className="text-[10px] text-slate-400 mt-1">{time}</p>
    </div>
    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 mt-1" />
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export const EssDashboard = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [attendanceRange, setAttendanceRange] = useState(7); // 7 or 30
  
  // Widget Persistence State
  const [visibleWidgets, setVisibleWidgets] = useState(() => {
    const saved = localStorage.getItem(`ess_dashboard_widgets_${user?.id}`);
    return saved ? JSON.parse(saved) : {
      actions: { checkIn: true, leave: true, payslip: true, request: true },
      kpis: { attendance: true, balance: true, lates: true, salary: true },
      charts: { timeline: true, overview: true },
      bottom: { leaveSummary: true, events: true }
    };
  });

  useEffect(() => {
    localStorage.setItem(`ess_dashboard_widgets_${user?.id}`, JSON.stringify(visibleWidgets));
  }, [visibleWidgets, user?.id]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleWidget = (category, key) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: !prev[category][key] }
    }));
  };

  // 1. Fetch Employee Record by User ID
  const { data: employeesList, isLoading: isEmpLoading } = useGetAllEmployeesQuery({ userId: user?.id }, { skip: !user?.id });
  // Handle transformResponse (returns array) or raw response
  const employee = Array.isArray(employeesList) ? employeesList[0] : (employeesList?.data?.[0] || {});
  const realEmpId = employee?.id;
  
  // 2. Fetch Detailed Employee Profile (for manager info etc)
  const { data: empDetails } = useGetEmployeeByIdQuery(realEmpId, { skip: !realEmpId });
  const detailedEmployee = empDetails?.data || employee;

  // 3. Fetch Leave Balance
  const { data: leaveBalance } = useGetMyLeaveBalanceQuery();

  // 4. Fetch Payouts
  const { data: payouts } = useGetPayoutsQuery();

  // 5. Attendance Range Data (Fetch last 30 days to cover both filters)
  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(now.getDate() - 29); // 30 days including today
  const dateFrom = rangeStart.toISOString().split('T')[0];
  const dateTo = now.toISOString().split('T')[0];
  
  const { data: attendanceData } = useGetIndividualEmployeeAttendanceQuery({
    employeeId: realEmpId,
    dateFrom,
    dateTo
  }, { skip: !realEmpId });

  // 6. Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestType, setRequestType] = useState(null); // 'LOAN', 'EXPENSE', 'SUPPORT'
  const [requestStep, setRequestStep] = useState(1);
  const [createLoan, { isLoading: isCreatingLoan }] = useCreateLoanMutation();
  const [createExpense, { isLoading: isCreatingExpense }] = useCreateExpensesMutation();

  const [loanForm, setLoanForm] = useState({ loanType: "Advance", amount: "", installments: "", reason: "" });
  const [expenseForm, setExpenseForm] = useState({ category: "Travel", amount: "", description: "", date: new Date().toISOString().split('T')[0] });

  // 7. Fetch Real Requests
  const { data: myLeavesData } = useGetMyLeavesQuery({ limit: 5 });
  const { data: myLoansData } = useGetMyLoansQuery({ limit: 5 });
  const { data: myExpensesData } = useGetMyExpensesQuery({ limit: 5 });

  const allRequests = useMemo(() => {
    const leaves = (myLeavesData?.data || []).map(l => ({
      id: l.id,
      type: 'Leave',
      title: `${l.leaveName || 'Leave'} Request`,
      date: l.createdAt,
      status: l.status,
      icon: LogOut,
      color: l.status === 'APPROVED' ? 'text-emerald-500 bg-emerald-50' : l.status === 'REJECTED' ? 'text-rose-500 bg-rose-50' : 'text-orange-500 bg-orange-50'
    }));
    const loans = (myLoansData?.data || []).map(l => ({
      id: l.id,
      type: 'Loan',
      title: `${l.loanType || 'Loan'} Request`,
      date: l.createdAt,
      status: l.status,
      icon: Banknote,
      color: l.status === 'APPROVED' ? 'text-emerald-500 bg-emerald-50' : l.status === 'REJECTED' ? 'text-rose-500 bg-rose-50' : 'text-orange-500 bg-orange-50'
    }));
    const expenses = (myExpensesData?.data || []).map(e => ({
      id: e.id,
      type: 'Expense',
      title: `${e.category || 'Expense'} Claim`,
      date: e.createdAt,
      status: e.status,
      icon: CreditCard,
      color: e.status === 'APPROVED' ? 'text-emerald-500 bg-emerald-50' : e.status === 'REJECTED' ? 'text-rose-500 bg-rose-50' : 'text-orange-500 bg-orange-50'
    }));

    return [...leaves, ...loans, ...expenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
  }, [myLeavesData, myLoansData, myExpensesData]);

  const { records, policyStatuses } = useMemo(() => {
    const raw = attendanceData?.data || attendanceData || {};
    return {
      records: Array.isArray(raw.records) ? raw.records : (Array.isArray(raw) ? raw : []),
      policyStatuses: raw.policyStatuses || {}
    };
  }, [attendanceData]);

  const attendanceLogs = records;

  // Dynamic Working Days Calculation from Policy
  const totalWorkingDaysInMonth = useMemo(() => {
    const policyList = Object.values(policyStatuses);
    if (policyList.length > 0) {
      return policyList.filter(p => p.status === "Working Day").length;
    }
    
    // Fallback to basic weekday count
    const year = now.getFullYear();
    const month = now.getMonth();
    let count = 0;
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const day = new Date(year, month, d).getDay();
      if (day !== 0 && day !== 6) count++; 
    }
    return count;
  }, [policyStatuses, now]);

  // Derived Stats
  const presentDays = useMemo(() => {
    return attendanceLogs.filter(a => {
      const att = a.attendance || a;
      const status = (att.status || "").toLowerCase();
      return status.includes('present') || status.includes('on time') || status.includes('late') || status.includes('half day');
    }).length;
  }, [attendanceLogs]);
  
  const lateDays = useMemo(() => {
    return attendanceLogs.filter(a => {
      const att = a.attendance || a;
      const status = (att.status || "").toLowerCase();
      return status.includes('late');
    }).length;
  }, [attendanceLogs]);

  const clBalance = leaveBalance?.data?.find(b => 
    b.leaveCode?.toUpperCase() === "CASUAL" || 
    b.leaveCode?.toUpperCase() === "CL" ||
    b.leaveName?.toUpperCase().includes("CASUAL")
  )?.remaining ?? 0;

  const latestPayout = Array.isArray(payouts) ? [...payouts].sort((a, b) => b.id - a.id)[0] : null;
  const rawStatus = latestPayout?.status?.toUpperCase() || 'PENDING';
  const salaryStatus = rawStatus === "PAID" ? "DISBURSED" : rawStatus;
  const salaryAmount = latestPayout?.netPay || 0;

  const payoutMonthLabel = useMemo(() => {
    if (!latestPayout?.month) return "No Payslips";
    // Handle "2026-05" or just "05" or "5"
    let date;
    if (latestPayout.month.includes('-')) {
        date = new Date(latestPayout.month + "-01");
    } else {
        // Fallback to current year if only month is provided
        date = new Date(new Date().getFullYear(), parseInt(latestPayout.month) - 1, 1);
    }
    return date.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
  }, [latestPayout]);

  // Find Today's Log
  const todayStr = now.toISOString().split('T')[0];
  const todayLog = useMemo(() => {
    return attendanceLogs.find(l => {
      const att = l.attendance || l;
      const d = att.date ? new Date(att.date).toISOString().split('T')[0] : null;
      return d === todayStr;
    })?.attendance || attendanceLogs.find(l => {
      const att = l.attendance || l;
      const d = att.date ? new Date(att.date).toISOString().split('T')[0] : null;
      return d === todayStr;
    });
  }, [attendanceLogs, todayStr]);

  const firstName = employee?.firstName || user?.firstName || "Employee";

  // Fetch Real Holidays
  const { data: holidaysData } = useGetHolidayQuery();
  const upcomingHolidays = useMemo(() => {
    const list = holidaysData?.data || [];
    return list
      .filter(h => new Date(h.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  }, [holidaysData]);

  if (isEmpLoading) return <div className="min-h-screen flex items-center justify-center">Loading Dashboard...</div>;

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6 font-urbanist">
      
      {/* Top Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-800">
              {getGreeting()}, {firstName} 👋
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-medium">
            {todayLog ? (
                <>You checked in at <span className="text-blue-600 font-bold">{fmtTime(todayLog.firstIn)}</span></>
            ) : (
                "You haven't checked in yet today."
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm">
            <Calendar size={18} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-700">{fmtDate(currentTime)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Left 3 Columns: Main Content */}
        <div className="xl:col-span-3 flex flex-col gap-8">
          
          {/* Quick Actions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
              <button 
                onClick={() => setIsCustomizing(true)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                Customize <Settings size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {visibleWidgets.actions.checkIn && (
                <QuickAction 
                    icon={Clock} 
                    title="Check In / Out" 
                    subtitle={todayLog ? "Checked in at" : "Start your day"} 
                    value={todayLog ? fmtTime(todayLog.firstIn) : ""}
                    color="bg-blue-600"
                />
              )}
              {visibleWidgets.actions.leave && (
                <QuickAction 
                    icon={CalendarDays} 
                    title="Apply Leave" 
                    subtitle="Available Balance" 
                    value={`${clBalance} CL`}
                    color="bg-emerald-500"
                />
              )}
              {visibleWidgets.actions.payslip && (
                <QuickAction 
                    icon={Download} 
                    title="Download Payslip" 
                    subtitle={payoutMonthLabel} 
                    color="bg-blue-600"
                    onClick={() => {
                        if (latestPayout) {
                            window.location.href = `/hrms/ess/payslips`;
                            toast.success("Redirecting to payslips for download");
                        } else {
                            toast.error("No payslips available for download");
                        }
                    }}
                />
              )}
              {visibleWidgets.actions.request && (
                <QuickAction 
                    icon={Plus} 
                    title="Raise Request" 
                    subtitle="Loan, Expense, etc." 
                    color="bg-orange-500"
                    onClick={() => {
                        setRequestType(null);
                        setRequestStep(1);
                        setIsRequestModalOpen(true);
                    }}
                />
              )}
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleWidgets.kpis.attendance && (
                <KpiCard 
                    icon={Users} 
                    title="Attendance (This Month)" 
                    value={`${presentDays} / ${totalWorkingDaysInMonth} Days`} 
                    subtitle={`${Math.round((presentDays / totalWorkingDaysInMonth) * 100)}% on-track`}
                    color="bg-blue-500"
                    linkTo="/hrms/ess/attendance"
                />
            )}
            {visibleWidgets.kpis.balance && (
                <KpiCard 
                    icon={TrendingUp} 
                    title="Leave Balance" 
                    value={`${clBalance} CL`} 
                    subtitle="Casual Leave"
                    color="bg-emerald-500"
                    linkTo="/hrms/leave/dashboard"
                />
            )}
            {visibleWidgets.kpis.lates && (
                <KpiCard 
                    icon={AlertCircle} 
                    title="Late Days" 
                    value={`${lateDays} Days`} 
                    subtitle="This Month"
                    color="bg-rose-500"
                    linkTo="/hrms/ess/attendance"
                />
            )}
            {visibleWidgets.kpis.salary && (
                <KpiCard 
                    icon={FileText} 
                    title="Salary Status" 
                    value={salaryStatus} 
                    subtitle={`₹ ${salaryAmount.toLocaleString()}`}
                    color="bg-blue-500"
                    linkTo="/hrms/ess/payslips"
                />
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Timeline */}
            {visibleWidgets.charts.timeline && (
                <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
                    <h3 className="font-bold text-slate-800">Today's Timeline</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ProgressCircle percentage={presentDays > 0 ? 62 : 0} label="Day Progress" />
                    </div>
                    <div className="space-y-4">
                        {[
                            { icon: CheckCircle, time: todayLog ? fmtTime(todayLog.firstIn) : "--:--", label: "Checked In", color: "text-emerald-500" },
                            { icon: Clock, time: "01:00 PM - 01:30 PM", label: "Break", color: "text-blue-500" },
                            { icon: PlayCircle, time: todayLog?.totalHours ? `${todayLog.totalHours}h` : "0h 0m", label: "Working", color: "text-orange-500" },
                            { icon: LogOut, time: "06:30 PM", label: "Expected Check Out", color: "text-slate-400" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center ${item.color}`}>
                                    <item.icon size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                                    <p className="text-xs font-bold text-slate-700">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {presentDays > 0 && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-2xl flex items-center gap-3">
                            <ArrowUpRight size={18} className="text-blue-600" />
                            <p className="text-[11px] font-medium text-blue-700 leading-snug">Great! You're on track for a productive day.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Overview Chart */}
            {visibleWidgets.charts.overview && (
                <div className={`${visibleWidgets.charts.timeline ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6`}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800">Attendance Overview</h3>
                        <select 
                            value={attendanceRange}
                            onChange={(e) => setAttendanceRange(Number(e.target.value))}
                            className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                        </select>
                    </div>
                    <div className={`flex-1 flex items-end justify-between ${attendanceRange === 30 ? 'gap-1' : 'gap-4'} pt-4 overflow-hidden`}>
                        {Array.from({ length: attendanceRange }).map((_, i) => {
                            // Indexing: we want the most recent days at the right
                            // attendanceLogs is usually sorted by date ascending from the API
                            // So last element is today.
                            const index = attendanceLogs.length - 1 - (attendanceRange - 1 - i);
                            const log = index >= 0 ? attendanceLogs[index] : null;
                            
                            const val = log?.attendance?.totalHours || log?.totalHours || 0;
                            const status = (log?.attendance?.status || log?.status || "").toLowerCase();
                            const isAbsent = status.includes('absent');
                            const isLate = status.includes('late');
                            const isHoliday = status.includes('holiday');
                            
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full bg-slate-50 rounded-full relative overflow-hidden" style={{ height: 160 }}>
                                        <div 
                                            className={`absolute bottom-0 w-full rounded-full transition-all duration-1000 ${isLate ? 'bg-orange-400' : isAbsent ? 'bg-rose-400' : isHoliday ? 'bg-blue-300' : val > 0 ? 'bg-emerald-400' : 'bg-slate-200'}`} 
                                            style={{ height: `${Math.min((Number(val) / 9) * 100, 100)}%` }}
                                        />
                                    </div>
                                    {attendanceRange === 7 && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            {log ? new Date(log.attendance?.date || log.date).toLocaleDateString("en-US", { weekday: 'short' }) : '---'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-[11px] font-bold text-slate-500">On Time</span></div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /><span className="text-[11px] font-bold text-slate-500">Late</span></div>
                        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="text-[11px] font-bold text-slate-500">Absent</span></div>
                    </div>
                </div>
            )}
          </div>

          {/* Bottom Row: Leave Summary & Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {visibleWidgets.bottom.leaveSummary && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Leave Balance Summary</h3>
                        <Link to="/hrms/leave/dashboard" className="text-xs font-bold text-blue-600">View All</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-3">
                        {leaveBalance?.data?.slice(0, 4).map((l, i) => (
                            <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                                <span className={`text-[9px] font-black text-white px-1.5 py-0.5 rounded w-fit ${i % 4 === 0 ? 'bg-blue-500' : i % 4 === 1 ? 'bg-blue-500' : i % 4 === 2 ? 'bg-orange-500' : 'bg-emerald-500'}`}>{l.leaveCode || l.leaveType?.code || "LT"}</span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{l.leaveName || l.leaveType?.name || "Leave Type"}</p>
                                <p className="text-lg font-black text-slate-800">{l.remaining} <span className="text-[9px] text-slate-400 font-bold uppercase">Available</span></p>
                                <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${i % 4 === 0 ? 'bg-blue-500' : i % 4 === 1 ? 'bg-blue-500' : i % 4 === 2 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${(l.remaining / l.totalAllocated) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                        {(!leaveBalance?.data || leaveBalance.data.length === 0) && (
                            <p className="col-span-4 text-center text-slate-400 text-xs py-4">No leave balances found.</p>
                        )}
                    </div>
                </div>
              )}

              {visibleWidgets.bottom.events && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Upcoming Events</h3>
                        <Link to="/hrms/attendance/holiday" className="text-xs font-bold text-blue-600">View Calendar</Link>
                    </div>
                    <div className="space-y-4">
                        {upcomingHolidays.map((ev, i) => {
                            const d = new Date(ev.date);
                            const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                            const day = d.getDate().toString().padStart(2, '0');
                            return (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex flex-col items-center justify-center text-rose-500">
                                        <span className="text-[8px] font-black">{month}</span>
                                        <span className="text-lg font-black leading-none">{day}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-slate-800">{ev.holidayName}</h4>
                                        <p className="text-[11px] text-slate-400 font-medium">{ev.type || 'Public Holiday'}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">Upcoming</span>
                                </div>
                            );
                        })}
                        {upcomingHolidays.length === 0 && (
                            <p className="text-center text-slate-400 text-xs py-8">No upcoming holidays found.</p>
                        )}
                    </div>
                </div>
              )}
          </div>

        </div>

        {/* Right Column: Profile & Sidebar */}
        <div className="flex flex-col gap-8">
          
          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
                  <AvatarImage src={detailedEmployee?.profilePicture || employee?.profilePicture || user?.profilePicture} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-3xl font-black">
                    {firstName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <Bell size={16} className="text-slate-400" />
                    <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-800">{employee?.firstName || user?.firstName} {employee?.lastName || user?.lastName || ""}</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Employee ID: {detailedEmployee?.empCode || employee?.empCode || "EMP----"}</p>
                <p className="text-xs font-bold text-blue-600 mt-2">{detailedEmployee?.designation || employee?.designation || "Employee"}</p>
                <p className="text-[11px] text-slate-400 font-medium">{detailedEmployee?.departmentName || employee?.department || "Team Name"}</p>
              </div>
            </div>

            <Link to="/hrms/ess/profile" className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
              <User size={14} /> View Profile
            </Link>

            <div className="space-y-4 pt-2 border-t border-slate-50">
                {[
                    { icon: Briefcase, label: "Department", val: detailedEmployee?.departmentName || employee?.department || "—" },
                    { icon: MousePointer2, label: "Reporting Manager", val: detailedEmployee?.managerName || employee?.managerName || "Not Assigned" },
                    { icon: Mail, label: "Email", val: detailedEmployee?.email || employee?.email || user?.email || "—" },
                    { icon: Phone, label: "Phone", val: detailedEmployee?.phone || detailedEmployee?.phoneNumber || employee?.phoneNumber || "+91 98765 43210" },
                ].map((info, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                            <info.icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-0.5">{info.label}</p>
                            <p className="text-[11px] font-bold text-slate-700 truncate">{info.val}</p>
                        </div>
                    </div>
                ))}
            </div>
          </div>

          {/* Notifications Side Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Notifications</h3>
                <Link to="#" className="text-[10px] font-bold text-blue-600 uppercase">View All</Link>
            </div>
            <div className="flex flex-col gap-2">
                {latestPayout && (
                    <NotificationItem 
                        icon={TrendingUp} 
                        color="bg-emerald-500" 
                        text={`Salary Credited for ${payoutMonthLabel}: ₹${salaryAmount.toLocaleString('en-IN')}`} 
                        time={latestPayout.paidAt ? `Paid on ${new Date(latestPayout.paidAt).toLocaleDateString()}` : "Processed"} 
                    />
                )}
                {upcomingHolidays[0] && (
                    <NotificationItem 
                        icon={Calendar} 
                        color="bg-blue-500" 
                        text={`Upcoming Holiday: ${upcomingHolidays[0].holidayName}`} 
                        time={new Date(upcomingHolidays[0].date).toLocaleDateString()} 
                    />
                )}
                {allRequests[0] && (
                    <NotificationItem 
                        icon={CheckCircle} 
                        color={allRequests[0].status === 'APPROVED' ? 'bg-emerald-500' : 'bg-orange-500'} 
                        text={`Update on your ${allRequests[0].type} request: ${allRequests[0].status}`} 
                        time="Recent" 
                    />
                )}
                {!latestPayout && !upcomingHolidays[0] && !allRequests[0] && (
                    <p className="text-center text-slate-400 text-[11px] py-4">No new notifications.</p>
                )}
            </div>
          </div>

          {/* My Requests Side Section */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">My Requests</h3>
                <Link to="/hrms/approvals/unified" className="text-[10px] font-bold text-blue-600 uppercase">View All</Link>
            </div>
            <div className="space-y-4">
                {allRequests.map((req, i) => (
                    <Link 
                        key={i} 
                        to={req.type === 'Leave' ? '/hrms/leave/dashboard' : '/hrms/approvals/unified'}
                        className="flex items-center gap-4 group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <req.icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{req.title}</h4>
                            <p className="text-[10px] text-slate-400 font-medium">Requested on {new Date(req.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${req.color}`}>{req.status}</span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                    </Link>
                ))}
                {allRequests.length === 0 && (
                    <p className="text-center text-slate-400 text-[11px] py-4">No recent requests.</p>
                )}
            </div>
          </div>

        </div>

      </div>

      {/* Customization Modal */}
      {isCustomizing && (
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 transition-all z-[9999] bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Customize Dashboard</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personalize your workspace</p>
                    </div>
                    <button 
                        onClick={() => setIsCustomizing(false)}
                        className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Quick Actions Group */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider">Quick Actions</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'checkIn', label: 'Check In / Out', icon: Clock },
                                    { key: 'leave', label: 'Apply Leave', icon: CalendarDays },
                                    { key: 'payslip', label: 'Download Payslip', icon: Download },
                                    { key: 'request', label: 'Raise Request', icon: Plus },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={visibleWidgets.actions[item.key]}
                                            onChange={() => toggleWidget('actions', item.key)}
                                            className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* KPI Cards Group */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider">KPI Widgets</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'attendance', label: 'Monthly Attendance', icon: Users },
                                    { key: 'balance', label: 'Leave Balance', icon: TrendingUp },
                                    { key: 'lates', label: 'Late Day Tracker', icon: AlertCircle },
                                    { key: 'salary', label: 'Salary Status', icon: FileText },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={visibleWidgets.kpis[item.key]}
                                            onChange={() => toggleWidget('kpis', item.key)}
                                            className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Visuals Group */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider">Visual Charts</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'timeline', label: "Today's Timeline", icon: Clock },
                                    { key: 'overview', label: 'Attendance History', icon: TrendingUp },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={visibleWidgets.charts[item.key]}
                                            onChange={() => toggleWidget('charts', item.key)}
                                            className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Others Group */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider">Other Sections</h3>
                            <div className="space-y-3">
                                {[
                                    { key: 'leaveSummary', label: 'Leave Summary List', icon: CalendarDays },
                                    { key: 'events', label: 'Upcoming Events', icon: Calendar },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-blue-100 transition-all cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={visibleWidgets.bottom[item.key]}
                                            onChange={() => toggleWidget('bottom', item.key)}
                                            className="w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 transition-all"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-4">
                    <button 
                        onClick={() => setVisibleWidgets({
                            actions: { checkIn: true, leave: true, payslip: true, request: true },
                            kpis: { attendance: true, balance: true, lates: true, salary: true },
                            charts: { timeline: true, overview: true },
                            bottom: { leaveSummary: true, events: true }
                        })}
                        className="px-6 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Reset Defaults
                    </button>
                    <button 
                        onClick={() => setIsCustomizing(false)}
                        className="px-8 py-2.5 rounded-2xl bg-blue-600 text-white text-xs font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="mt-12 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} Secure Code Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
              <span className="flex items-center gap-1"><Cloud size={12} className="text-blue-400" /> 32°C Sunny</span>
              <span>Version 2.0.1</span>
          </div>
      </div>

      {/* Request Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="fixed inset-0 backdrop-blur-md z-[9999] bg-slate-900/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl relative z-10 border border-slate-100"
            >
              {/* Header */}
              <div className="p-8 pb-0 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                    {requestStep === 1 ? "What can we help with?" : 
                     requestType === 'LOAN' ? "Loan Application" : 
                     requestType === 'EXPENSE' ? "Expense Claim" : "Raise Request"}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium mt-1">
                    {requestStep === 1 ? "Select a request type to continue" : "Fill in the details below"}
                  </p>
                </div>
                <button 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                {requestStep === 1 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'LOAN', title: 'Loan / Advance', icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Salary advance or loan' },
                      { id: 'EXPENSE', title: 'Expense Claim', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Travel, food, bills' },
                      { id: 'SUPPORT', title: 'IT / HR Support', icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Hardware or query' },
                      { id: 'DOC', title: 'Documents', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Letters, certs, IDs' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setRequestType(item.id);
                          setRequestStep(2);
                        }}
                        className="p-6 rounded-[24px] border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-left transition-all group"
                      >
                        <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <item.icon size={24} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm">{item.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {requestType === 'LOAN' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Type</label>
                            <select 
                              value={loanForm.loanType}
                              onChange={(e) => setLoanForm({...loanForm, loanType: e.target.value})}
                              className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all outline-none"
                            >
                              <option value="Advance">Salary Advance</option>
                              <option value="Personal">Personal Loan</option>
                              <option value="Emergency">Emergency Loan</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                            <input 
                              type="number"
                              value={loanForm.amount}
                              onChange={(e) => setLoanForm({...loanForm, amount: e.target.value})}
                              placeholder="e.g. 10000"
                              className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tenure (Installments)</label>
                          <input 
                            type="number"
                            value={loanForm.installments}
                            onChange={(e) => setLoanForm({...loanForm, installments: e.target.value})}
                            placeholder="e.g. 6 Months"
                            className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label>
                          <textarea 
                            value={loanForm.reason}
                            onChange={(e) => setLoanForm({...loanForm, reason: e.target.value})}
                            placeholder="Briefly explain the requirement..."
                            rows={3}
                            className="w-full bg-slate-50 border-none px-4 py-4 rounded-2xl font-bold text-sm focus:ring-2 ring-blue-500 transition-all outline-none resize-none"
                          />
                        </div>
                      </>
                    )}

                    {requestType === 'EXPENSE' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                            <select 
                              value={expenseForm.category}
                              onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                              className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl font-bold text-sm focus:ring-2 ring-emerald-500 transition-all outline-none"
                            >
                              <option value="Travel">Travel</option>
                              <option value="Food">Food / Meals</option>
                              <option value="Internet">Internet / Phone</option>
                              <option value="Other">Other Office Expense</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label>
                            <input 
                              type="number"
                              value={expenseForm.amount}
                              onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                              placeholder="e.g. 500"
                              className="w-full bg-slate-50 border-none px-4 py-3 rounded-2xl font-bold text-sm focus:ring-2 ring-emerald-500 transition-all outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                          <textarea 
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                            placeholder="What was this expense for?"
                            rows={3}
                            className="w-full bg-slate-50 border-none px-4 py-4 rounded-2xl font-bold text-sm focus:ring-2 ring-emerald-500 transition-all outline-none resize-none"
                          />
                        </div>
                      </>
                    )}

                    {(requestType === 'SUPPORT' || requestType === 'DOC') && (
                      <div className="py-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                          <HelpCircle size={40} className="text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">This module is coming soon!</p>
                        <button 
                          onClick={() => setRequestStep(1)}
                          className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Go Back
                        </button>
                      </div>
                    )}

                    {['LOAN', 'EXPENSE'].includes(requestType) && (
                      <div className="flex gap-4 pt-4">
                        <button 
                          onClick={() => setRequestStep(1)}
                          className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                          Back
                        </button>
                        <button 
                          disabled={isCreatingLoan || isCreatingExpense}
                          onClick={async () => {
                            try {
                              if (requestType === 'LOAN') {
                                await createLoan({ ...loanForm, userId: user.id }).unwrap();
                                toast.success("Loan request submitted successfully");
                              } else {
                                await createExpense({ ...expenseForm, userId: user.id }).unwrap();
                                toast.success("Expense claim submitted");
                              }
                              setIsRequestModalOpen(false);
                            } catch (e) {
                              toast.error(e?.data?.message || "Failed to submit request");
                            }
                          }}
                          className={`flex-[2] py-4 ${requestType === 'LOAN' ? 'bg-blue-600' : 'bg-emerald-600'} text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50`}
                        >
                          {isCreatingLoan || isCreatingExpense ? "Submitting..." : "Submit Request"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EssDashboard;
