import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  TrendingUp,
  Clock,
  BarChart2,
  Calendar,
  Users,
  LogOut,
  Bell,
  MoreVertical,
  Mail,
  Phone,
  User,
  CheckCircle,
  FileText,
  AlertCircle,
  Briefcase,
  LayoutDashboard,
  Plus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGetIndividualEmployeeAttendanceQuery } from "@/services/hrms/attendance.api";
import { useGetMyLeavesQuery } from "@/services/hrms/leaves.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/utils/formatDate";
import moment from "moment";
import { toast } from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

const STATUS_COLOR = {
  present: { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", badge: "Excellent" },
  late: { dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-600", badge: "On Track" },
  absent: { dot: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-600", badge: "Action Needed" },
  leave: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600", badge: "Approved Leave" },
  weekend: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600", badge: "Holiday" },
  unmarked: { dot: "bg-slate-300", bg: "bg-slate-50", text: "text-slate-400", badge: "Not Marked" },
};

const SummaryItem = ({ label, value, color, bg }) => (
  <div className="flex items-center gap-3 group">
    <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shadow-sm`}>
      {value}
    </div>
    <div className="flex flex-col">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</span>
      <span className={`text-[10px] font-bold ${color} uppercase tracking-tighter`}>{value > 1 ? "Days" : "Day"}</span>
    </div>
  </div>
);

const fmtTime = (v) => {
  if (!v || v === "N/A") return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return v; }
};

// ── Calendar Cell ─────────────────────────────────────────────────────────────
const CalCell = ({ day, status, isToday, onClick, isSelected, prevMonthDay = false }) => {
  if (!day) return <div />;
  const config = STATUS_COLOR[status] || STATUS_COLOR.unmarked;
  
  return (
    <button
      onClick={() => !prevMonthDay && onClick(day)}
      className={`relative flex flex-col items-center justify-between p-2 md:p-3 rounded-2xl transition-all cursor-pointer group border-none h-16 md:h-20
        ${isSelected ? "bg-blue-50 border-2 border-blue-500 shadow-lg shadow-blue-100" : "bg-white hover:bg-slate-50 border border-slate-100 shadow-sm"}
        ${prevMonthDay ? "opacity-30 grayscale cursor-default" : ""}
      `}
    >
      <span className={`text-xs font-bold ${isSelected ? "text-blue-600" : "text-slate-400"}`}>{day}</span>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot} shadow-sm group-hover:scale-125 transition-transform`} />
    </button>
  );
};

export const EssAttendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [activeTab, setActiveTab] = useState("calendar");

  const handleDownloadReport = () => {
    const list = records;
    if (!list || list.length === 0) {
      toast.error("No attendance data found for this period");
      return;
    }
    const headers = ["Date", "Day", "Status", "Check-In", "Check-Out", "Total Hours"];
    const rows = list.map(log => {
      const att = log.attendance || log;
      const d = moment(att.date || att.firstIn);
      return [d.format("YYYY-MM-DD"), d.format("dddd"), att.status || (Number(att.totalHours) > 0 ? "PRESENT" : "ABSENT"), att.firstIn ? moment(att.firstIn).format("hh:mm A") : "—", att.lastOut ? moment(att.lastOut).format("hh:mm A") : "—", att.totalHours || "0"];
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Report_${MONTH_NAMES[viewMonth]}_${viewYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report downloaded successfully");
  };

  const handleDownloadPDF = () => {
    const list = records;
    if (!list || list.length === 0) {
      toast.error("No attendance data found for this period");
      return;
    }
    const printWindow = document.createElement('iframe');
    printWindow.style.position = 'fixed'; printWindow.style.right = '0'; printWindow.style.bottom = '0'; printWindow.style.width = '0'; printWindow.style.height = '0'; printWindow.style.border = '0';
    document.body.appendChild(printWindow);
    const content = `<html><head><title>Attendance Report</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');body { font-family: 'Inter', sans-serif; padding: 50px; color: #0f172a; background: #fff; line-height: 1.5; }.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }.brand { display: flex; flex-direction: column; gap: 4px; }.logo { font-weight: 800; font-size: 18px; color: #4f46e5; letter-spacing: -0.5px; }.company { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }.info-grid { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #f1f5f9; }.summary-bar { display: flex; gap: 15px; margin-bottom: 30px; }.stat-card { flex: 1; background: #fff; border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; text-align: center; }table { width: 100%; border-collapse: collapse; margin-top: 10px; }th { text-align: left; padding: 12px 15px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }td { padding: 12px 15px; font-size: 12px; border-bottom: 1px solid #f1f5f9; color: #475569; font-weight: 500; }.badge { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: inline-block; }.present { background: #dcfce7; color: #166534; }.absent { background: #fee2e2; color: #991b1b; }.late { background: #fef3c7; color: #92400e; }</style></head><body><div class="header"><div class="brand"><span class="logo">LOGZE</span><span class="company">Official Attendance Record</span></div><div style="text-align:right"><h1>Monthly Report</h1><p>${MONTH_NAMES[viewMonth]} ${viewYear}</p></div></div><div class="info-grid"><div style="flex:1"><span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">Employee</span><br/><b>${employee?.firstName || user?.firstName} ${employee?.lastName || user?.lastName || ""}</b></div><div style="flex:1"><span style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase">Employee ID</span><br/><b>${employee?.empCode || "N/A"}</b></div></div><table><thead><tr><th>Date</th><th>Day</th><th>Status</th><th>In Time</th><th>Out Time</th><th>Duration</th></tr></thead><tbody>${list.map(log => {const att = log.attendance || log; const d = moment(att.date || att.firstIn); const rawStatus = (att.status || (Number(att.totalHours) > 0 ? "PRESENT" : "ABSENT")).toLowerCase(); let statusClass = 'present'; if (rawStatus.includes('absent')) statusClass = 'absent'; else if (rawStatus.includes('late')) statusClass = 'late'; return `<tr><td><b>${d.format("DD MMM YYYY")}</b></td><td>${d.format("dddd")}</td><td><span class="badge ${statusClass}">${rawStatus.toUpperCase()}</span></td><td>${att.firstIn ? moment(att.firstIn).format("hh:mm A") : "—"}</td><td>${att.lastOut ? moment(att.lastOut).format("hh:mm A") : "—"}</td><td><b>${att.totalHours || "0"}h</b></td></tr>`;}).join('')}</tbody></table><script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => { window.frameElement.parentNode.removeChild(window.frameElement); }, 500); }, 500); };</script></body></html>`;
    printWindow.contentDocument.write(content); printWindow.contentDocument.close(); toast.success("Preparing PDF Report...");
  };

  const { data: employeesList, isLoading: isEmpLoading } = useGetAllEmployeesQuery({ userId: user?.id }, { skip: !user?.id });
  const employee = employeesList?.data?.[0] || {};
  const realEmpId = employee?.id;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const monthFrom = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const monthTo = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${daysInMonth}`;

  const { data: attData, isLoading: isAttLoading } = useGetIndividualEmployeeAttendanceQuery({ employeeId: realEmpId, dateFrom: monthFrom, dateTo: monthTo }, { skip: !realEmpId });
  const { data: myLeaves } = useGetMyLeavesQuery({ status: 'APPROVED', limit: 100 });

  const { records, policyStatuses, shift } = useMemo(() => {
    const raw = attData?.data || {};
    return {
      records: Array.isArray(raw.records) ? raw.records : [],
      policyStatuses: raw.policyStatuses || {},
      shift: raw.shift || null
    };
  }, [attData]);

  const dayStatus = useMemo(() => {
    const map = {};
    const leavesList = myLeaves?.result || myLeaves?.data || [];

    records.forEach((r) => {
      const att = r.attendance || r;
      const dateVal = att.date || att.createdAt || att.firstIn;
      if (!dateVal) return;
      const dateKey = dateVal.split('T')[0];
      const day = new Date(dateKey).getDate();
      const s = (att.status || "").toLowerCase();
      if (s.includes("late")) map[day] = "late";
      else if (s.includes("absent")) map[day] = "absent";
      else if (s.includes("leave")) map[day] = "leave";
      else if (s.includes("present") || s.includes("on time")) map[day] = "present";
      else if (s) map[day] = "present";
    });

    // Overlay leaves
    leavesList.forEach(leave => {
        if (leave.fromDate && leave.toDate) {
            const start = new Date(leave.fromDate);
            const end = new Date(leave.toDate);
            const mStart = new Date(monthFrom);
            const mEnd = new Date(monthTo);
            
            const current = new Date(Math.max(start, mStart));
            while (current <= Math.min(end, mEnd)) {
                map[current.getDate()] = "leave";
                current.setDate(current.getDate() + 1);
            }
        }
    });

    return map;
  }, [records, myLeaves, monthFrom, monthTo]);

  const { 
    presentCount, 
    lateCount, 
    absentCount, 
    leaveCount, 
    holidayCount, 
    weekendCount,
    avgWorkHours, 
    punctuality, 
    attendanceScore,
    totalWorkingDays
  } = useMemo(() => {
    const stats = { 
        presentCount: 0, 
        lateCount: 0, 
        absentCount: 0, 
        leaveCount: 0,
        totalHours: 0, 
        pWH: 0, 
        oT: 0, 
        inTimes: [], 
        outTimes: [] 
    };

    const leavesList = myLeaves?.result || myLeaves?.data || [];

    records.forEach(r => {
      const att = r.attendance || r;
      const s = (att.status || "").toLowerCase();
      if (s.includes("late")) stats.lateCount++; 
      else if (s.includes("absent")) stats.absentCount++; 
      else if (s.includes("leave")) stats.leaveCount++;
      else if (s.includes("present") || s.includes("on time") || s.includes("half day")) stats.presentCount++;
      
      if (s.includes("on time")) stats.oT++;
      
      const inT = att.firstIn || att.checkIn; 
      const outT = att.lastOut || att.checkOut;
      if (inT) { 
        const d = new Date(inT); 
        if (!isNaN(d.getTime())) stats.inTimes.push(d.getHours() * 60 + d.getMinutes()); 
      }
      if (outT) { 
        const d = new Date(outT); 
        if (!isNaN(d.getTime())) stats.outTimes.push(d.getHours() * 60 + d.getMinutes()); 
      }
      if (att.totalHours && !isNaN(att.totalHours)) { 
        stats.totalHours += Number(att.totalHours); 
        stats.pWH++; 
      }
    });

    // Calculate Counts from Policy + My Leaves
    const counts = { leave: 0, holiday: 0, weekend: 0, working: 0 };
    Object.values(policyStatuses).forEach(p => {
      if (p.status === "Leave") counts.leave++;
      else if (p.status === "Holiday") counts.holiday++;
      else if (p.status === "Weekly Off") counts.weekend++;
      else if (p.status === "Working Day") counts.working++;
    });

    // Check myLeaves for the current month
    leavesList.forEach(leave => {
        if (leave.fromDate && leave.toDate) {
            const start = new Date(leave.fromDate);
            const end = new Date(leave.toDate);
            const mStart = new Date(monthFrom);
            const mEnd = new Date(monthTo);
            
            // Overlap check
            const overlapStart = new Date(Math.max(start, mStart));
            const overlapEnd = new Date(Math.min(end, mEnd));
            
            if (overlapStart <= overlapEnd) {
                const diffTime = Math.abs(overlapEnd - overlapStart);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                counts.leave += diffDays;
            }
        }
    });

    // Deduplicate leaves if they exist in both records and myLeaves
    // For simplicity, we trust myLeaves more for the summary
    const finalLeaveCount = Math.max(stats.leaveCount, counts.leave);

    const avg = stats.pWH > 0 ? (stats.totalHours / stats.pWH).toFixed(1) : 0;
    const punct = Math.round(((stats.oT + stats.presentCount) / Math.max(stats.presentCount + stats.lateCount + stats.oT, 1)) * 100);
    
    // Dynamic Attendance Score (0-10)
    const score = Math.min(10, ((stats.oT * 1.0 + stats.lateCount * 0.7 + stats.presentCount * 0.9) / Math.max(counts.working, 1)) * 10).toFixed(1);

    return { 
      presentCount: stats.presentCount, 
      lateCount: stats.lateCount, 
      absentCount: stats.absentCount, 
      leaveCount: finalLeaveCount,
      holidayCount: counts.holiday,
      weekendCount: counts.weekend,
      avgWorkHours: avg, 
      punctuality: punct, 
      attendanceScore: score,
      totalWorkingDays: counts.working
    };
  }, [records, policyStatuses, myLeaves, monthFrom, monthTo]);

  const todayRecord = useMemo(() => {
    const t = new Date();
    const dStr = t.toISOString().split('T')[0];
    const rec = records.find(r => {
      const att = r.attendance || r;
      return (att.date || "").startsWith(dStr);
    });
    return rec?.attendance || rec;
  }, [records]);

  const selectedAtt = useMemo(() => {
    const rec = records.find(r => {
      const att = r.attendance || r;
      const dateVal = att.date || att.createdAt || att.firstIn;
      if (!dateVal) return false;
      const [y, m, d] = dateVal.split('T')[0].split('-').map(Number);
      return d === selectedDay && m === viewMonth + 1 && y === viewYear;
    });
    return rec?.attendance || rec;
  }, [records, selectedDay, viewMonth, viewYear]);

  const monthlyReport = useMemo(() => {
    const report = [];
    const leavesList = myLeaves?.result || myLeaves?.data || [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let rec = records.find(r => (r.attendance || r).date?.startsWith(dateStr));
      const policy = policyStatuses[dateStr] || {};
      const isWeekend = policy.status === "Weekly Off" || policy.status === "Holiday";
      
      // Check for leave in leavesList if no record
      if (!rec) {
          const onLeave = leavesList.find(l => {
              const start = new Date(l.fromDate).toISOString().split('T')[0];
              const end = new Date(l.toDate).toISOString().split('T')[0];
              return dateStr >= start && dateStr <= end;
          });
          if (onLeave) {
              rec = { attendance: { status: "Leave", date: dateStr } };
          }
      }

      report.push({ 
        day: d, 
        date: dateStr, 
        dayName: DAY_NAMES[new Date(viewYear, viewMonth, d).getDay()], 
        isWeekend: isWeekend, 
        policyStatus: policy.status,
        record: rec?.attendance || rec 
      });
    }
    return report;
  }, [records, daysInMonth, viewYear, viewMonth, myLeaves]);

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 font-urbanist text-slate-900 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">
        
        {/* Welcome Banner */}
        <div className="relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden flex flex-wrap items-center justify-between gap-8">
           <div className="space-y-2 relative z-10">
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Employee Portal</p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                {user?.firstName} {user?.lastName} <span className="text-2xl md:text-3xl">👋</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm">Real-time attendance tracking and performance metrics.</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-6 relative z-10">
              {/* Today's Live Punch */}
              <div className="flex items-center gap-8 bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100 shadow-inner group hover:bg-white hover:shadow-md transition-all">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Check In
                  </span>
                  <span className="text-sm font-black text-slate-800 tracking-tight">{fmtTime(todayRecord?.firstIn) || "—"}</span>
                </div>
                
                <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />
                
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Check Out</span>
                  <span className="text-sm font-black text-slate-800 tracking-tight">{fmtTime(todayRecord?.lastOut) || "—"}</span>
                </div>

                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ml-2 ${
                  todayRecord?.status?.toLowerCase().includes('absent') ? 'bg-rose-50 text-rose-500' :
                  todayRecord?.status?.toLowerCase().includes('late') ? 'bg-orange-50 text-orange-500' :
                  todayRecord?.status ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
                }`}>
                  {todayRecord?.status || "Live"}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-5 shadow-inner">
                 <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{viewYear}</p>
                    <p className="text-base font-black text-slate-800 tracking-tight">{MONTH_NAMES[viewMonth]}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => { if(viewMonth===0){setViewYear(y=>y-1);setViewMonth(11)}else setViewMonth(m=>m-1) }} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-blue-600 outline-none"><ChevronLeft size={18}/></button>
                    <button onClick={() => { if(viewMonth===11){setViewYear(y=>y+1);setViewMonth(0)}else setViewMonth(m=>m+1) }} className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-blue-600 outline-none"><ChevronRight size={18}/></button>
                 </div>
              </div>
           </div>

           <div className="absolute right-[15%] top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none hidden xl:block scale-150">
              <Clock size={160} className="text-blue-600" />
           </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[
            { label: "Punctuality", value: `${punctuality}%`, sub: "On-time arrival rate", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", badge: punctuality > 90 ? "Excellent" : punctuality > 70 ? "Good" : "Action Needed" },
            { label: "Avg Work Hours", value: `${avgWorkHours}h`, sub: "Daily average", icon: Clock, color: "text-blue-500", bg: "bg-blue-50", badge: avgWorkHours > 8 ? "Good" : "Low" },
            { label: "Check-in Goal", value: shift?.firstPunch || "09:30 AM", sub: "Standard shift start", icon: LayoutDashboard, color: "text-blue-500", bg: "bg-blue-50", badge: "On Track" },
            { label: "Attendance Score", value: `${attendanceScore} / 10`, sub: "Based on last 30 days", icon: BarChart2, color: "text-orange-500", bg: "bg-orange-50", badge: attendanceScore > 8 ? "Great" : attendanceScore > 5 ? "Average" : "Poor" },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 group hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-6">
                 <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <kpi.icon size={24} />
                 </div>
                 <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${kpi.bg} ${kpi.color}`}>{kpi.badge}</span>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                 <p className="text-3xl font-black text-slate-800 tracking-tighter">{kpi.value}</p>
                 <p className="text-xs font-bold text-slate-400">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Summary Section */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex flex-col border-r border-slate-100 pr-8 hidden md:flex">
              <h3 className="text-sm font-black text-slate-800 tracking-tight">Monthly Summary</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{MONTH_NAMES[viewMonth]} {viewYear}</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-6 md:gap-10 flex-1 justify-between md:justify-start">
              <SummaryItem label="Present" value={presentCount} color="text-emerald-500" bg="bg-emerald-50" />
              <SummaryItem label="Absent" value={absentCount} color="text-rose-500" bg="bg-rose-50" />
              <SummaryItem label="Late" value={lateCount} color="text-orange-500" bg="bg-orange-50" />
              <SummaryItem label="Leave" value={leaveCount} color="text-blue-500" bg="bg-blue-50" />
              <SummaryItem label="Holiday" value={holidayCount} color="text-purple-500" bg="bg-purple-50" />
              <SummaryItem label="Weekend" value={weekendCount} color="text-blue-500" bg="bg-blue-50" />
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Main Calendar Area */}
          <div className="xl:col-span-8 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
             <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-[22px] border border-slate-100 shadow-inner">
                   {["calendar", "logs"].map(tab => (
                     <button
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-none ${
                         activeTab === tab ? "bg-white text-blue-600 shadow-lg shadow-blue-100/50" : "text-slate-400 hover:text-slate-600"
                       }`}
                     >
                       {tab === "calendar" ? "Visual Calendar" : "Log History"}
                     </button>
                   ))}
                </div>

                <div className="flex items-center gap-3">
                </div>
             </div>

             {activeTab === 'calendar' ? (
               <>
                 <div className="grid grid-cols-7 mb-6">
                    {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</div>)}
                 </div>

                 <div className="grid grid-cols-7 gap-3 md:gap-4">
                    {Array.from({ length: firstDay }).map((_, i) => <CalCell key={`p-${i}`} day={30 - firstDay + i + 1} prevMonthDay />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const policy = policyStatuses[dateKey] || {};
                      const isWeekend = policy.status === "Weekly Off" || policy.status === "Holiday";
                      const status = dayStatus[day] || (isWeekend ? "weekend" : "unmarked");
                      return (
                        <CalCell 
                          key={day} 
                          day={day} 
                          status={status} 
                          isToday={day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()} 
                          isSelected={selectedDay === day} 
                          onClick={setSelectedDay} 
                        />
                      );
                    })}
                    {Array.from({ length: (7 - (daysInMonth + firstDay) % 7) % 7 }).map((_, i) => <CalCell key={`n-${i}`} day={i + 1} prevMonthDay />)}
                 </div>

                 <div className="mt-10 flex flex-wrap items-center justify-between border-t border-slate-50 pt-8 gap-6">
                    <div className="flex flex-wrap items-center gap-6 md:gap-8">
                       {[
                         { label: "Present", color: "bg-emerald-500" },
                         { label: "Absent", color: "bg-rose-500" },
                         { label: "Late", color: "bg-orange-400" },
                         { label: "Weekly Off", color: "bg-blue-500" },
                         { label: "Not Marked", color: "bg-slate-300" },
                       ].map(item => (
                         <div key={item.label} className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${item.color} shadow-sm`} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               </>
             ) : (
               <div className="overflow-x-auto max-h-[500px] styled-scrollbar">
                 <table className="w-full text-left">
                   <thead className="sticky top-0 bg-white z-10">
                     <tr className="border-b border-slate-100">
                        <th className="pb-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="pb-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">In / Out</th>
                        <th className="pb-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Duration</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {monthlyReport.map((row, i) => (
                        <tr key={i} className={`group hover:bg-slate-50/50 transition-all ${row.isWeekend ? 'bg-slate-50/30' : ''}`}>
                          <td className="py-4 px-4 font-black text-xs text-slate-700">{row.day} {MONTH_NAMES[viewMonth].slice(0,3)}</td>
                          <td className="py-4 px-4">
                            {row.record?.status ? (
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                row.record.status.toLowerCase().includes('absent') ? 'bg-rose-50 text-rose-500' :
                                row.record.status.toLowerCase().includes('late') ? 'bg-orange-50 text-orange-500' :
                                'bg-emerald-50 text-emerald-500'
                              }`}>{row.record.status}</span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{row.isWeekend ? 'Holiday' : '—'}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center text-[12px] font-bold text-slate-500">
                             {fmtTime(row.record?.firstIn)} <span className="text-slate-200 mx-2">|</span> {fmtTime(row.record?.lastOut)}
                          </td>
                          <td className="py-4 px-4 text-right font-black text-slate-800 text-xs">{row.record?.totalHours ? `${row.record.totalHours}h` : '—'}</td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 space-y-8">
             
             {/* Profile Card */}
             <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="relative mb-8 group">
                   <Avatar className="w-24 h-24 ring-[10px] ring-slate-50 border-[4px] border-white shadow-2xl transition-all group-hover:scale-105">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=6366f1&color=fff&size=256`} />
                      <AvatarFallback className="bg-blue-600 text-white font-black text-2xl uppercase">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                   </Avatar>
                   <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-[4px] border-white rounded-full shadow-lg" />
                </div>
                
                <div className="mb-8">
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">{user?.firstName} {user?.lastName}</h3>
                   <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-1.5 px-4 py-1 bg-blue-50 rounded-full inline-block">System Administrator</p>
                </div>

                <div className="w-full space-y-5 text-left border-t border-slate-50 pt-8">
                   {[
                     { label: "Employee ID", value: employee?.empCode || "EMP-01KM", icon: User },
                     { label: "Department", value: employee?.departmentName || employee?.department || "Administration", icon: Briefcase },
                     { label: "Date of Joining", value: "01 Jan 2020", icon: Calendar },
                     { label: "Reporting Manager", value: "System Admin", icon: Users },
                     { label: "Email", value: user?.email || "ve@logz.com", icon: Mail },
                   ].map((item, i) => (
                     <div key={i} className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 text-slate-400">
                           <item.icon size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-800 text-right truncate max-w-[150px]">{item.value}</span>
                     </div>
                   ))}
                </div>

                <button 
                  onClick={() => navigate("/hrms/ess/profile")}
                  className="w-full mt-10 py-4 bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 text-blue-600 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-none shadow-sm"
                >
                   Full Profile <ChevronRight size={16} />
                </button>
             </div>

             {/* Quick Actions */}
             <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                   {[
                     { label: "Apply Leave", icon: Calendar, color: "text-emerald-500", bg: "bg-emerald-50", onClick: () => navigate("/hrms/leave/apply") },
                     { label: "View Logs", icon: FileText, color: "text-blue-500", bg: "bg-blue-50", onClick: () => { setActiveTab("logs"); window.scrollTo({ top: 500, behavior: 'smooth' }); } },
                     { label: "Request Permission", icon: Clock, color: "text-orange-500", bg: "bg-orange-50", onClick: () => navigate("/hrms/leave/permission") },
                     { label: "Export PDF", icon: BarChart2, color: "text-purple-500", bg: "bg-purple-50", onClick: handleDownloadPDF },
                   ].map((action, i) => (
                     <button key={i} onClick={action.onClick} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 border border-slate-50 hover:border-blue-200 hover:bg-blue-50 transition-all group border-none">
                        <div className={`w-12 h-12 ${action.bg} ${action.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform mb-3`}>
                           <action.icon size={22} />
                        </div>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center leading-tight">{action.label}</span>
                     </button>
                   ))}
                </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  );
};
