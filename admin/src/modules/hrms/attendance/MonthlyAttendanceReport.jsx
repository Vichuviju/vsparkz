import React, { useState, useMemo, useEffect } from "react";
import {
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  BarChart2,
} from "lucide-react";
import {
  useGetAllEmployeeAttendanceQuery,
  useLazyExportAttendancePdfQuery,
} from "@/services/hrms/attendance.api";
import { toast } from "react-hot-toast";
import { useGetHrSettingsQuery } from "@/services/hrms/hrSettings.api";
import { useGetHolidayQuery } from "@/services/hrms/holiday.api";
import { useGetShiftsQuery } from "@/services/hrms/shifts.api";
import { useGetWeeklyOffQuery } from "@/services/hrms/weeklyoff";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { useGetAllLeavesQuery } from "@/services/hrms/leaves.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAY_ABBR = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const STATUS_DOT = {
  "On time": { dot: "bg-emerald-500", abbr: "P",  title: "Present"  },
  "Present": { dot: "bg-emerald-500", abbr: "P",  title: "Present"  },
  "Late":    { dot: "bg-orange-500",  abbr: "L",  title: "Late"     },
  "Absent":  { dot: "bg-red-500",     abbr: "A",  title: "Absent"   },
  "Leave":   { dot: "bg-blue-500",    abbr: "LV", title: "Leave"    },
  "Half Day":{ dot: "bg-yellow-400",  abbr: "HD", title: "Half Day" },
  "Holiday": { dot: "bg-purple-500",  abbr: "HL", title: "Holiday"  },
  "Checked In": { dot: "bg-emerald-400 animate-pulse ring-2 ring-emerald-200", abbr: "CI", title: "Currently Checked In" },
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// ─── Legend ──────────────────────────────────────────────────────────────────
const Legend = () => (
  <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] items-center">
    {/* Status Dots */}
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[7px] font-bold text-white">P</div>
      <span className="text-gray-600 font-medium">Present</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[7px] font-bold text-white">L</div>
      <span className="text-gray-600 font-medium">Late</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[7px] font-bold text-white">A</div>
      <span className="text-gray-600 font-medium">Absent</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[7px] font-bold text-white">LV</div>
      <span className="text-gray-600 font-medium">Leave</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[7px] font-bold text-white text-shadow-sm">HD</div>
      <span className="text-gray-600 font-medium">Half Day</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[7px] font-bold text-white">HL</div>
      <span className="text-gray-600 font-medium">Holiday</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-[7px] font-bold text-white">WO</div>
      <span className="text-gray-600 font-medium">Week Off</span>
    </div>

    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-emerald-400 animate-pulse flex items-center justify-center text-[7px] font-bold text-white ring-1 ring-emerald-200">CI</div>
      <span className="text-gray-600 font-medium">Checked In</span>
    </div>

    {/* Separator */}
    <div className="h-4 w-[1px] bg-gray-200 mx-1" />

    {/* Summary Definitions */}
    <div className="flex items-center gap-1.5">
      <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center text-[7px] font-bold text-white">OT</div>
      <span className="text-gray-600 font-medium">Overtime</span>
    </div>
    <div className="flex items-center gap-1.5" title="Net Payable Days = P + L + LV + HL + WO + (HD * 0.5)">
      <div className="w-4 h-4 rounded-full bg-blue-600 shadow-sm flex items-center justify-center text-[7px] font-bold text-white">NET</div>
      <span className="text-blue-600 font-bold">Net Payable Days</span>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────
export const MonthlyAttendanceReport = () => {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("monthly"); // monthly | weekly
  const [shiftFilter, setShiftFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [weekIndex, setWeekIndex] = useState(0);

  const dateFrom = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const daysInMonth = getDaysInMonth(year, month);
  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: employeesData, isLoading: isEmployeesLoading } = useGetAllEmployeesQuery({
    shiftId: shiftFilter || undefined,
    deptId: deptFilter || undefined,
    dateFrom,
    dateTo,
    page: currentPage,
    limit: pageSize,
  });

  const { data: attendanceData, isLoading: isAttendanceLoading } = useGetAllEmployeeAttendanceQuery({
    dateFrom,
    dateTo,
    shiftId: shiftFilter || undefined,
    deptId: deptFilter || undefined,
    page: 1,
    limit: 2000, 
  });

  const { data: settingsData } = useGetHrSettingsQuery();
  const { data: holidayData } = useGetHolidayQuery({ limit: 100 });
  const { data: overridesData } = useGetWeeklyOffQuery({ 
    month: month + 1, 
    year,
    region: 'all',
    shiftId: 'all'
  });
  const { data: shiftsData } = useGetShiftsQuery();
  const { data: deptsData } = useGetAllDepartmentsQuery();
  const { data: leavesData } = useGetAllLeavesQuery({ 
    status: 'APPROVED',
    limit: 1000 
  });

  const employees = useMemo(() => {
    if (Array.isArray(employeesData)) return employeesData;
    if (Array.isArray(employeesData?.data)) return employeesData.data;
    return [];
  }, [employeesData]);

  const pagination = useMemo(() => employeesData?.pagination || {}, [employeesData]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [shiftFilter, deptFilter, month, year]);

  const weeklyOffSettings = settingsData?.data?.GLOBAL_WEEKLY_OFF;

  const weeklyOffDays = useMemo(() => {
    return weeklyOffSettings?.days || ["Sun"];
  }, [weeklyOffSettings]);


  const shiftsMap = useMemo(() => {
    const map = {};
    shiftsData?.data?.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [shiftsData]);

  const holidaysMap = useMemo(() => {
    const map = {};
    holidayData?.forEach(h => {
      if (h.date) {
        const d = h.date.split("T")[0];
        const rgn = (h.region || 'global').toUpperCase();
        const key = `${rgn}_${h.shiftId || 'global'}_${d}`;
        map[key] = h.holidayName;
      }
    });
    return map;
  }, [holidayData]);

  const overridesMap = useMemo(() => {
    const map = {};
    const list = overridesData?.result || [];

    list.forEach(o => {
      if (o.date) {
        // Safe mapping from backend date to local report date (no timezone shift)
        const dStr = o.date?.split("T")[0];
        if (!dStr) return;
        const [y, m, dNum] = dStr.split("-").map(Number);
        const dObj = new Date(y, m - 1, dNum);
        const dsY = dObj.getFullYear();
        const dsM = String(dObj.getMonth() + 1).padStart(2, '0');
        const dsD = String(dObj.getDate()).padStart(2, '0');
        const d = `${dsY}-${dsM}-${dsD}`;
        
        const rgn = (o.region || 'all').toUpperCase();
        const sId = o.shiftId ? String(o.shiftId) : 'global';
        const key = `${rgn}_${sId}_${d}`;
        map[key] = o.type; // "Full", "Partial", "Working"
      }
    });
    return map;
  }, [overridesData]);

  // Approved leaves map for checking leave dates
  const approvedLeavesMap = useMemo(() => {
    const map = {};
    const leaves = leavesData?.result || leavesData?.data || [];
    
    leaves.forEach(leave => {
      if (leave.status === 'APPROVED' && leave.fromDate && leave.toDate) {
        const userId = leave.userId || leave.employeeId;
        if (!userId) return;
        
        if (!map[userId]) {
          map[userId] = [];
        }
        
        const fStr = leave.fromDate?.split("T")[0];
        const tStr = leave.toDate?.split("T")[0];
        if (!fStr || !tStr) return;
        
        const [fy, fm, fd] = fStr.split("-").map(Number);
        const [ty, tm, td] = tStr.split("-").map(Number);
        
        const fromDate = new Date(fy, fm - 1, fd);
        const toDate = new Date(ty, tm - 1, td);
        
        // Add all dates in the leave range
        const current = new Date(fromDate);
        while (current <= toDate) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          const d = String(current.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          
          if (!map[userId].includes(dateStr)) {
            map[userId].push(dateStr);
          }
          current.setDate(current.getDate() + 1);
        }
      }
    });
    
    return map;
  }, [leavesData]);

  // Helper to check if date is within approved leave
  const isDateOnApprovedLeave = (userId, dateStr) => {
    if (!userId || !approvedLeavesMap[userId]) return false;
    return approvedLeavesMap[userId].includes(dateStr);
  };

  const records = attendanceData?.result?.data || [];

  // Build employee → date map
  const getDayInfo = (d) => {
    const date = new Date(year, month, d);
    return { dow: date.getDay(), abbr: DAY_ABBR[date.getDay()] };
  };

  const getNthDayOfMonth = (date) => {
    const d = date.getDate();
    return Math.ceil(d / 7);
  };

  const isWeeklyOffForEmployee = (d, shiftId, region) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const sId = shiftId ? Number(shiftId) : 'global';
    
    const rgn = (region || 'CHENNAI').toUpperCase();
    
    // 1. Check Shift-Specific Override (Priority 1)
    const shiftOverride = overridesMap[`${rgn}_${sId}_${ds}`] || overridesMap[`ALL_${sId}_${ds}`];
    if (shiftOverride === "Working") return { status: "NONE", source: "Manual Override (Working Day)" };
    if (shiftOverride === "Full") return { status: "FULL", source: "Manual Override (Shift-specific Off)" };
    if (shiftOverride === "Partial") return { status: "PARTIAL", source: "Manual Override (Partial Off)" };

    // 2. Fallback to Baseline Pattern (Shift or Global Settings)
    const selectedShift = shiftsData?.data?.find(s => Number(s.id) === Number(shiftId));
    let days = [];
    let alt = "None";

    if (selectedShift) {
        days = selectedShift.weeklyOffDays || [];
        alt  = selectedShift.altWeeklyOff || "None";
    } else {
        const global = settingsData?.data?.GLOBAL_WEEKLY_OFF || {};
        days = global.days || ["Sun"];
        alt  = global.alt || "All Saturdays";
    }

    const dayName = new Date(year, month, d).toLocaleDateString('en-US', { weekday: 'short' });

    // Check if current day is in the Weekly Off days list (General check for Mon-Sun)
    if (dayName !== 'Sat' && days.includes(dayName)) {
        return { status: "FULL", source: `Weekly Off (${dayName})` };
    }

    // Saturday logic (Special handling for 1st/2nd/4th patterns)
    if (dayName === 'Sat') {
      const isSatToggled = days.includes('Sat');
      const altOff = alt;
      
      if (isSatToggled || altOff === "All Saturdays") return { status: "FULL", source: "Weekly Off (Saturday)" };
      if (altOff !== "None") {
        const weekNum = Math.ceil(d / 7);
        const satSource = `Weekly Off (${altOff})`;
        if (altOff === "1st Saturday" && weekNum === 1) return { status: "FULL", source: satSource };
        if (altOff === "2nd Saturday" && weekNum === 2) return { status: "FULL", source: satSource };
        if (altOff === "4th Saturday" && weekNum === 4) return { status: "FULL", source: satSource };
        if (altOff === "2nd & 4th Saturday" && (weekNum === 2 || weekNum === 4)) return { status: "FULL", source: satSource };
        if (altOff === "1st & 3rd Saturday" && (weekNum === 1 || weekNum === 3)) return { status: "FULL", source: satSource };
      }
    }

    return { status: "NONE", source: "Working Day" };
  };

  const currentHoliday = (d, shiftId, region) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const rgn = (region || 'CHENNAI').toUpperCase();
    return holidaysMap[`${rgn}_${shiftId}_${ds}`] || 
           holidaysMap[`GLOBAL_${shiftId}_${ds}`] || 
           holidaysMap[`${rgn}_global_${ds}`] || 
           holidaysMap[`GLOBAL_global_${ds}`] ||
           holidaysMap[`INDIA_global_${ds}`];
  };

  const grouped = useMemo(() => {
    const map = {};

    // 1. Initialize map with all employees (if available)
    const employeesList = employeesData?.data || employeesData?.result || [];
    employeesList.forEach(emp => {
      const eid = emp.id;
      if (!eid) return;
      map[eid] = {
        eid,
        uid: emp.userId,
        name: emp.firstName ? `${emp.firstName} ${emp.lastName || ""}` : (emp.name || "Unknown"),
        code: emp.empCode || emp.employeeId || "—",
        dept: emp.department || "—",
        shiftId: emp.shiftId,
        region: emp.region || "CHENNAI",
        days: {},
        totals: { present: 0, absent: 0, late: 0, leave: 0, halfDay: 0, ot: 0, holiday: 0, weeklyOff: 0 },
      };
    });

    // 2. Overlay attendance records
    records.forEach((r) => {
      const att = r.attendance || r;
      const emp = r.employees  || r;
      const usr = r.users      || {};
      const eid = att.employeeId || emp.id;
      if (!eid) return;

      if (!map[eid]) {
        map[eid] = {
          eid,
          uid: usr.id || emp.userId,
          name: usr.firstName ? `${usr.firstName} ${usr.lastName || ""}` : (att.name || "Unknown"),
          code: emp.empCode || emp.employeeId || "—",
          dept: r.employee_departments?.name || "—",
          shiftId: emp.shiftId,
          region: emp.region || "CHENNAI",
          days: {},
          totals: { present: 0, absent: 0, late: 0, leave: 0, halfDay: 0, ot: 0, holiday: 0, weeklyOff: 0 },
        };
      }

      const d = att.date?.split("T")[0];
      if (d) {
        const status = att.status || "On time";
        // If it's today and checkout is missing, mark as 'Checked In' for visual feedback
        const isToday = new Date().toISOString().split('T')[0] === d;
        const displayStatus = (isToday && !att.lastOut && (status === "On time" || status === "Present" || status === "Late")) 
          ? "Checked In" 
          : status;

        map[eid].days[d] = { 
          status: displayStatus,
          originalStatus: status,
          firstIn: att.firstIn,
          lastOut: att.lastOut
        };

        const t = map[eid].totals;
        switch (status) {
          case "On time": t.present++; break;
          case "Present": t.present++; break;
          case "Absent":  t.absent++;  break;
          case "Late":    t.late++;    break;
          case "Leave":   t.leave++;   break;
          case "Half Day":t.halfDay++; break;
        }
        t.ot += Number(att.overtime || 0);
      }
    });

    // 3. Post-process: Add approved leaves and calculate final totals from unique dates
    Object.values(map).forEach(emp => {
      const t = emp.totals;
      // Reset totals to calculate from unique days map
      t.present = 0; t.absent = 0; t.late = 0; t.leave = 0; t.halfDay = 0; t.ot = 0; t.holiday = 0; t.weeklyOff = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        
        // If no attendance record for this day, check for approved leave
        if (!emp.days[ds]) {
          if (isDateOnApprovedLeave(emp.uid || emp.eid, ds)) {
            emp.days[ds] = "Leave"; 
          }
        }

        // Calculate totals based on the final status of each day
        const dayRecord = emp.days[ds];
        const status = typeof dayRecord === 'object' ? dayRecord.status : dayRecord;
        if (status) {
          const finalStatus = typeof dayRecord === 'object' ? dayRecord.originalStatus : status;
          switch (finalStatus) {
            case "On time": t.present++; break;
            case "Present": t.present++; break;
            case "Absent":  t.absent++;  break;
            case "Late":    t.late++;    break;
            case "Leave":   t.leave++;   break;
            case "Half Day":t.halfDay++; break;
            case "Holiday": t.holiday++; break;
            case "Weekly Off": t.weeklyOff++; break;
          }
        } else {
          // If no manual status, check if it's a holiday or weekly off for totals
          const holiday = currentHoliday(d, emp.shiftId, emp.region);
          if (holiday) {
              t.holiday++;
          } else {
              const woResult = isWeeklyOffForEmployee(d, emp.shiftId, emp.region);
              if (woResult.status === "FULL") {
                  t.weeklyOff++;
              } else if (woResult.status === "PARTIAL") {
                  t.halfDay += 0.5;
                  t.weeklyOff += 0.5;
              }
          }
        }
      }

      // Re-sum Overtime from unique records (if multiple records exist, we sum them)
      // Note: We still use the records loop for OT since OT can be additive
      records.forEach(r => {
        const att = r.attendance || r;
        const eid = att.employeeId || r.employeeId || r.id;
        if (String(eid) === String(emp.eid)) {
          t.ot += Number(att.overtime || 0);
        }
      });
    });

    return Object.values(map);
  }, [records, employeesData, approvedLeavesMap, year, month, daysInMonth]);

  const filtered = grouped.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.code.toLowerCase().includes(search.toLowerCase())
  );


  const changeMonth = (dir) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setMonth(m);
    setYear(y);
    setWeekIndex(0);
  };

  const handleNav = (dir) => {
    if (viewMode === "weekly") {
      const totalWeeks = Math.ceil(daysInMonth / 7);
      let nextW = weekIndex + dir;
      if (nextW < 0) {
        changeMonth(-1);
        setWeekIndex(3); // Start near the end of previous month
      } else if (nextW >= totalWeeks) {
        changeMonth(1);
        setWeekIndex(0);
      } else {
        setWeekIndex(nextW);
      }
    } else {
      changeMonth(dir);
    }
  };

  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const visibleDays = viewMode === "weekly" 
    ? dayNumbers.slice(weekIndex * 7, (weekIndex + 1) * 7)
    : dayNumbers;



  const handleExportCSV = () => {
    const header = ["Code", "Name", "Department", ...dayNumbers.map(String), "Present", "Absent", "Late", "Leave", "Half Day", "Net Payable"];
    const rows = filtered.map((emp) => {
      const dayRow = dayNumbers.map((d) => {
        const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayRec = emp.days[ds];
        const s = typeof dayRec === 'object' ? dayRec.status : dayRec;
        
        // 1. Attendance Data
        if (s) return STATUS_DOT[s]?.abbr || s[0];

        // 2. Holiday Data
        const holiday = currentHoliday(d, emp.shiftId, emp.region);
        if (holiday) return "HL";

        // 3. Weekly Off / Manual Override Data
        const woRes = isWeeklyOffForEmployee(d, emp.shiftId, emp.region);
        if (woRes.status === "FULL") return "WO";
        if (woRes.status === "PARTIAL") return "HD";
        if (woRes.status === "NONE" && woRes.source && woRes.source.includes("Manual")) return "WD";
        
        return "";
      });
      const net = emp.totals.present + emp.totals.late + (emp.totals.halfDay * 0.5);
      return [emp.code, emp.name, emp.dept, ...dayRow, emp.totals.present, emp.totals.absent, emp.totals.late, emp.totals.leave, emp.totals.halfDay, net.toFixed(1)];
    });
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${year}_${month + 1}.csv`;
    a.click();
  };

  const [triggerExportPdf, { isLoading: isExportingPdf }] = useLazyExportAttendancePdfQuery();

  const handleExportPDF = async () => {
    try {
      toast.loading(`Generating ${viewMode} PDF...`, { id: "pdf-export" });
      
      const startDay = visibleDays[0];
      const endDay = visibleDays[visibleDays.length - 1];
      
      const dateFrom = `${year}-${String(month + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
      const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
      
      const blob = await triggerExportPdf({
        dateFrom,
        dateTo,
        shiftId: shiftFilter || undefined,
        deptId: deptFilter || undefined,
        monthName: viewMode === "weekly" ? `${MONTH_NAMES[month]} - Week ${weekIndex + 1}` : MONTH_NAMES[month],
        year
      }).unwrap();

      if (!blob || blob.size < 500) {
        const text = await blob.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || "Failed to generate a valid PDF");
        } catch (e) {
          throw new Error("The server returned an invalid PDF file.");
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileName = viewMode === "weekly" 
        ? `attendance_weekly_${MONTH_NAMES[month]}_W${weekIndex+1}_${year}.pdf`
        : `attendance_monthly_${MONTH_NAMES[month]}_${year}.pdf`;
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("PDF Downloaded!", { id: "pdf-export" });
    } catch (error) {
      
      toast.error(error?.message || "Failed to export PDF", { id: "pdf-export" });
    }
  };

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <Download size={15} />
            Download XLS
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="flex items-center gap-2 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <FileText size={15} />
            {isExportingPdf ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 text-sm font-semibold">
            {["monthly", "weekly"].map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-1.5 rounded-lg capitalize transition-colors ${viewMode === v ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}
              >
                {v} View
              </button>
            ))}
          </div>
          {/* Month & Week navigation */}
          <div className="flex items-center bg-gray-50 border rounded-xl p-1 gap-1">
            <button onClick={() => handleNav(-1)} className="p-1.5 rounded-lg hover:bg-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="text-sm font-bold text-gray-700 min-w-[160px] text-center flex flex-col">
              <span>{MONTH_NAMES[month]} {year}</span>
              {viewMode === "weekly" && (
                <span className="text-[10px] text-blue-600 uppercase tracking-tighter">
                  Week {weekIndex + 1} ({visibleDays[0]} - {visibleDays[visibleDays.length - 1]})
                </span>
              )}
            </div>
            <button onClick={() => handleNav(1)} className="p-1.5 rounded-lg hover:bg-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-white border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-100 min-w-[110px]"
            >
              <option value="">All Shifts</option>
              {shiftsData?.data?.map(s => (
                <option key={s.id} value={s.id}>{s.shiftName}</option>
              ))}
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-white border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-100 min-w-[130px]"
            >
              <option value="">All Depts</option>
              {deptsData?.data?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-1.5">
              <Search size={14} className="text-gray-400" />
              <input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none bg-transparent text-xs w-28"
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          <Legend />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider">
                <th className="sticky left-0 bg-white px-4 py-3 text-left text-gray-500 font-bold border-r border-gray-100 min-w-[160px] z-10">
                  ID / Employee
                </th>
                <th className="px-3 py-3 text-left text-gray-500 font-bold border-r border-gray-100 min-w-[100px]">Dept</th>
                {visibleDays.map((d) => {
                  const { abbr, dow } = getDayInfo(d);
                  const holiday = currentHoliday(d, shiftFilter || 'global', 'all');
                  const isToday = new Date().getDate() === d &&
                    new Date().getMonth() === month && new Date().getFullYear() === year;
                  
                  return (
                    <th
                      key={d}
                      className={`px-1 py-1 text-center min-w-[40px] border-r border-gray-50 
                        ${holiday ? "bg-purple-50 text-purple-700" : "text-gray-500"} 
                        ${isToday ? "bg-blue-50 !text-blue-600 ring-1 ring-inset ring-blue-200" : ""} font-bold`}
                      title={holiday}
                    >
                      <div>{String(d).padStart(2, "0")}</div>
                      <div className="text-[8px] font-normal opacity-70">{holiday ? "HL" : abbr}</div>
                    </th>
                  );
                })}
                {[
                  { label: "Pres", color: "text-emerald-600" },
                  { label: "Abs",  color: "text-red-600" },
                  { label: "Late", color: "text-orange-600" },
                  { label: "Lv",   color: "text-blue-600" },
                  { label: "HD",   color: "text-yellow-600" },
                  { label: "OT",   color: "text-purple-600" },
                  { label: "Net",  color: "text-blue-700 font-black" },
                ].map((c) => (
                  <th key={c.label} className={`px-2 py-3 text-center min-w-[40px] border-l border-gray-100 ${c.color} font-bold uppercase bg-gray-50/80`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(isAttendanceLoading || isEmployeesLoading) && (
                <tr>
                  <td colSpan={dayNumbers.length + 10} className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              )}
              {!isAttendanceLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={dayNumbers.length + 10} className="text-center py-12 text-gray-400 italic">
                    No attendance records for {MONTH_NAMES[month]} {year}
                  </td>
                </tr>
              )}
              {!isAttendanceLoading && filtered.map((emp, idx) => {
                const net = emp.totals.present + emp.totals.late + emp.totals.leave + emp.totals.holiday + emp.totals.weeklyOff + (emp.totals.halfDay * 0.5);
                return (
                  <tr key={emp.eid} className="bg-white hover:bg-blue-50 transition-colors">
                    <td className="sticky left-0 bg-white px-4 py-2 border-r border-gray-100 z-10">
                      <div className="text-[10px] font-mono text-gray-400 leading-none">#{emp.code}</div>
                      <div className="font-bold text-gray-800 leading-tight mt-0.5 truncate max-w-[144px]">{emp.name}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-500 border-r border-gray-100 truncate max-w-[100px]">{emp.dept}</td>

                    {visibleDays.map((d) => {
                      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                      const dayRec = emp.days[ds];
                      const s = typeof dayRec === 'object' ? dayRec.status : dayRec;
                      const holiday = currentHoliday(d, emp.shiftId, emp.region);
                      const meta = s ? STATUS_DOT[s] : null;
                      const woResult = isWeeklyOffForEmployee(d, emp.shiftId, emp.region);
                      const isFullOff = woResult.status === "FULL";
                      const isPartialOff = woResult.status === "PARTIAL";

                      const isManual = woResult.source && woResult.source.includes("Manual");
                      const isOrgPolicy = woResult.source && woResult.source.includes("Organization");
                      const isWorkingOverride = woResult.status === "NONE" && (isManual || isOrgPolicy);
                      
                      // Check if date is on approved leave (only if no attendance status)
                      const isOnLeave = !s && isDateOnApprovedLeave(emp.uid || emp.eid, ds);

                      return (
                        <td 
                          key={d} 
                          className={`
                            px-0.5 py-2 text-center border-r border-gray-50 transition-all duration-200
                            ${holiday ? "bg-purple-50/50" : ""}
                            ${isFullOff && !s && isManual ? "bg-emerald-50/80 border-b-2 border-emerald-200" : ""}
                            ${isFullOff && !s && isOrgPolicy ? "bg-emerald-50/40" : ""}
                            ${isFullOff && !s && !isManual && !isOrgPolicy ? "bg-gray-100/60" : ""}
                            ${isPartialOff && !s && (isManual || isOrgPolicy) ? "bg-amber-50/80 border-b-2 border-amber-200" : ""}
                            ${isWorkingOverride && !s ? "bg-sky-50/60 border-b-2 border-sky-100" : ""}
                            ${isOnLeave ? "bg-blue-50/50" : ""}
                          `} 
                          title={holiday || woResult.source || (isOnLeave ? "Approved Leave" : "") || (typeof dayRec === 'object' ? `In: ${dayRec.firstIn ? new Date(dayRec.firstIn).toLocaleTimeString() : '—'} Out: ${dayRec.lastOut ? new Date(dayRec.lastOut).toLocaleTimeString() : '—'}` : '')}
                        >
                          {s ? (
                            <div className={`w-5 h-5 rounded-full ${meta?.dot || "bg-gray-300"} mx-auto shadow-sm transition-transform hover:scale-110 flex items-center justify-center text-[9px] font-bold text-white`} title={meta?.title || s}>
                              {meta?.abbr || s[0]}
                            </div>
                          ) : holiday ? (
                            <div className="w-5 h-5 rounded-full bg-purple-500 mx-auto shadow-sm flex items-center justify-center text-[9px] font-bold text-white" title={holiday}>
                              HL
                            </div>
                          ) : isOnLeave ? (
                            <div className="w-5 h-5 rounded-full bg-blue-500 mx-auto shadow-sm flex items-center justify-center text-[9px] font-bold text-white" title="Approved Leave">
                              LV
                            </div>
                          ) : isFullOff ? (
                            <span className={`text-[8px] font-bold uppercase ${isManual || isOrgPolicy ? "text-emerald-700" : "text-gray-400"}`}>wo</span>
                          ) : isPartialOff ? (
                            <span className={`text-[8px] font-bold uppercase ${isManual || isOrgPolicy ? "text-amber-700" : "text-amber-500"}`}>hd</span>
                          ) : isWorkingOverride ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mx-auto animate-pulse" title={woResult.source} />
                          ) : (
                            <span className="text-gray-200 text-[10px]">·</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Totals */}
                    <td className="px-2 py-2.5 text-center text-emerald-700 font-semibold border-l border-gray-100">{emp.totals.present}</td>
                    <td className="px-2 py-2.5 text-center text-red-600 font-semibold">{emp.totals.absent}</td>
                    <td className="px-2 py-2.5 text-center text-orange-600 font-semibold">{emp.totals.late}</td>
                    <td className="px-2 py-2.5 text-center text-blue-600 font-semibold">{emp.totals.leave}</td>
                    <td className="px-2 py-2.5 text-center text-yellow-600 font-semibold">{emp.totals.halfDay}</td>
                    <td className="px-2 py-2.5 text-center text-purple-600 font-semibold">{parseFloat(Number(emp.totals.ot).toFixed(2))}h</td>
                    <td className="px-2 py-2.5 text-center text-blue-700 font-extrabold">{net.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>

            {/* Footer row */}
            {!isAttendanceLoading && filtered.length > 0 && (() => {
              const sums = filtered.reduce((a, emp) => ({
                present: a.present + emp.totals.present,
                absent:  a.absent  + emp.totals.absent,
                late:    a.late    + emp.totals.late,
                leave:   a.leave   + emp.totals.leave,
                halfDay: a.halfDay + emp.totals.halfDay,
                ot:      a.ot      + emp.totals.ot,
                holiday: (a.holiday || 0) + (emp.totals.holiday || 0),
                weeklyOff: (a.weeklyOff || 0) + (emp.totals.weeklyOff || 0),
              }), { present: 0, absent: 0, late: 0, leave: 0, halfDay: 0, ot: 0, holiday: 0, weeklyOff: 0 });
              
              const netTotal = sums.present + sums.late + sums.halfDay * 0.5 + sums.leave + sums.holiday + sums.weeklyOff;
              return (
                <tfoot>
                  <tr className="bg-blue-50 font-bold border-t border-blue-100">
                    <td className="sticky left-0 bg-blue-50 px-4 py-3 text-blue-700 border-r border-blue-100 text-xs uppercase tracking-wider z-10" colSpan={1}>
                      Monthly Totals ({filtered.length})
                    </td>
                    <td className="border-r border-blue-100/50" />
                    {visibleDays.map((d) => <td key={d} className="border-r border-blue-100/50" />)}
                    <td className="px-2 py-3 text-center text-emerald-700">{sums.present}</td>
                    <td className="px-2 py-3 text-center text-red-600">{sums.absent}</td>
                    <td className="px-2 py-3 text-center text-orange-600">{sums.late}</td>
                    <td className="px-2 py-3 text-center text-blue-600">{sums.leave}</td>
                    <td className="px-2 py-3 text-center text-yellow-600">{sums.halfDay}</td>
                    <td className="px-2 py-3 text-center text-purple-600">{parseFloat(Number(sums.ot).toFixed(2))}h</td>
                    <td className="px-2 py-3 text-center text-blue-700">{netTotal.toFixed(1)}</td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>

        {/* Bottom info */}
        <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
          <span>Showing {filtered.length} employees · {MONTH_NAMES[month]} {year}</span>
          <div className="flex items-center gap-1">
            <BarChart2 size={12} />
            Net Payable = Present + Late + (Half Day × 0.5)
          </div>
        </div>

        {/* Pagination */}
        {employees.length > 0 && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100 mt-2 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.hasPrev}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg">
                  {pagination.page}
                </span>
                <span className="text-sm font-medium text-gray-400">
                  of {pagination.totalPages}
                </span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={!pagination.hasNext}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} employees
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
