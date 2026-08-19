import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Users,
  CheckCircle,
  UserMinus,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useGetAllEmployeeAttendanceQuery, useGetDashboardStatsQuery, useCloseDailyAttendanceMutation } from "@/services/hrms/attendance.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useGetShiftsQuery } from "@/services/hrms/shifts.api";
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

// Custom Confirmation Component
const CustomConfirmModal = ({ isOpen, onClose, onConfirm, date }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto bg-white bg-opacity-30 flex items-center justify-center animate-fade-in z-[9999] bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-scale-in border border-gray-200 max-h-[min(92dvh,44rem)] overflow-y-auto mx-3 sm:mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <CheckCircle size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Close Attendance</h3>
            <p className="text-sm text-gray-500">Confirm attendance closing</p>
          </div>
        </div>

        {/* Message */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 mb-2">
            Are you sure you want to close attendance for:
          </p>
          <div className="bg-white rounded px-3 py-2 inline-block">
            <span className="font-semibold text-blue-600">{date}</span>
          </div>
          <p className="text-sm text-orange-600 mt-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            This will mark all employees without attendance as absent
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <CheckCircle size={18} />
              Close Attendance
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
const fmtTime = (v) => {
  if (!v || v === "N/A" || String(v).includes("00:00:00")) return "—";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return v;
  }
};

const getStatusMeta = (status) => {
  switch ((status || "").toLowerCase()) {
    case "on time": return { label: "On Time", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "late": return { label: "Late", cls: "bg-orange-100 text-orange-700 border-orange-200" };
    case "absent": return { label: "Absent", cls: "bg-red-100 text-red-700 border-red-200" };
    default: return { label: status || "—", cls: "bg-gray-100 text-gray-600 border-gray-200" };
  }
};

// ─── DonutChart ─────────────────────────────────────────────────────────────
const DonutChart = ({ present, late, absent, total }) => {
  if (!total) return (
    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No data yet</div>
  );
  const pctPresent = Math.round((present / total) * 100);
  const pctLate = Math.round((late / total) * 100);
  const pctAbsent = Math.round((absent / total) * 100);

  const r = 48, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  let cumulative = 0;
  const segments = [
    { val: present, color: "#10b981", label: "Present" },
    { val: late, color: "#f97316", label: "Late" },
    { val: absent, color: "#ef4444", label: "Absent" },
  ];

  return (
    <div className="flex items-center gap-6">
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="transparent" stroke="#f3f4f6" strokeWidth={16} />
        {segments.map((seg, i) => {
          const dash = (seg.val / total) * circ;
          const offset = circ - cumulative * (circ / total);
          cumulative += seg.val;
          return (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="transparent"
              stroke={seg.color} strokeWidth={16}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset} strokeLinecap="butt"
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="700" fill="#111827">{pctPresent}%</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#6b7280">Present</text>
      </svg>
      <div className="space-y-2">
        {[
          { label: "Present", val: present, pct: pctPresent, color: "bg-emerald-500" },
          { label: "Late", val: late, pct: pctLate, color: "bg-orange-400" },
          { label: "Absent", val: absent, pct: pctAbsent, color: "bg-red-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-gray-600 w-14">{s.label}</span>
            <span className="font-bold text-gray-800">{s.val}</span>
            <span className="text-gray-400">({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── TimelineChart (Reusable SVG area chart) ──────────────────────────────────
const TimelineChart = ({ data, type = "in", color = "#6366f1", gradId }) => {
  // Hours range: In (06:00–18:00), Out (10:00–22:00)
  const hours = type === "in"
    ? Array.from({ length: 13 }, (_, i) => i + 6)
    : Array.from({ length: 13 }, (_, i) => i + 10);

  const buckets = hours.map((h) => ({
    hour: h,
    count: data.filter((r) => {
      const att = r.attendance || r;
      const t = type === "in" ? (att.firstIn || att.checkIn) : (att.lastOut || att.checkOut);
      if (!t || t === "N/A") return false;
      try { return new Date(t).getHours() === h; } catch { return false; }
    }).length,
  }));

  const max = Math.max(...buckets.map((b) => b.count), 1);
  const W = 340, H = 80;
  const pts = buckets.map((b, i) => {
    const x = 10 + (i / (buckets.length - 1)) * (W - 20);
    const y = H - 10 - ((b.count / max) * (H - 20));
    return [x, y];
  });
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaD = `${pathD} L${pts[pts.length - 1][0]},${H - 10} L${pts[0][0]},${H - 10} Z`;

  return (
    <div className="w-full h-24">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height: 60 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[8px] text-gray-400 mt-1 px-1 font-mono">
        {hours.filter((_, i) => i % 3 === 0).map((h) => (
          <span key={h}>{h > 12 ? `${h - 12}PM` : `${h}AM`}</span>
        ))}
      </div>
    </div>
  );
};

// ─── StatCard ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, sub, onClick, isActive }) => (
  <div
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg cursor-pointer transition-all duration-300 transform ${isActive ? "ring-4 ring-white/30 scale-[1.02] shadow-2xl" : "hover:scale-[1.01] hover:shadow-xl"
      } ${color}`}
  >
    <div className="absolute -right-4 -top-4 opacity-10">
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <div className="p-2 bg-white/20 rounded-xl w-fit mb-3">
        <Icon size={20} />
      </div>
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm text-white/80 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/60 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const AttendanceDashboard = () => {
  const today = new Date().toISOString().split("T")[0];
  const tableRef = useRef(null);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("All");

  const { data: shiftsData } = useGetShiftsQuery();
  const { data, isLoading, refetch, isFetching } = useGetDashboardStatsQuery({
    dateFrom,
    dateTo,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const { data: listData, isLoading: isListLoading } = useGetAllEmployeeAttendanceQuery({
    dateFrom,
    dateTo,
    page: currentPage,
    limit: pageSize,
  });

  const [closeAttendance, { isLoading: isClosingAttendance }] = useCloseDailyAttendanceMutation();

  const attendanceList = listData?.result?.data || [];
  const pagination = listData?.result?.pagination || {};

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Reset to page 1 when date filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo]);

  const { data: employeesData } = useGetAllEmployeesQuery();
  const allEmployees = useMemo(() => {
    if (Array.isArray(employeesData)) return employeesData;
    if (Array.isArray(employeesData?.data)) return employeesData.data;
    return [];
  }, [employeesData]);

  const empLookup = useMemo(() => {
    const map = {};
    if (Array.isArray(allEmployees)) {
      allEmployees.forEach(e => {
        if (e.id) map[String(e.id)] = e;
      });
    }
    return map;
  }, [allEmployees]);

  const [statusFilter, setStatusFilter] = useState(null); // 'Present', 'Late', 'Absent'

  const handleFilterClick = (filter) => {
    setStatusFilter(statusFilter === filter ? null : filter);
    // Smooth scroll to table
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const filtered = useMemo(() => {
    if (!attendanceList) return [];

    // 1. Deduplicate and merge records for the same employee on the same date
    const uniqueMap = new Map();

    attendanceList.forEach((r) => {
      const att = r.attendance || r;
      const empId = att.employeeId || r.employeeId;
      if (!empId) return;

      // Use employeeId and date as the unique key
      const dateKey = att.date ? new Date(att.date).toISOString().split('T')[0] : 'no-date';
      const key = `${empId}_${dateKey}`;

      if (!uniqueMap.has(key)) {
        // Deep copy to avoid mutating original data
        uniqueMap.set(key, JSON.parse(JSON.stringify(r)));
      } else {
        const existing = uniqueMap.get(key);
        const eAtt = existing.attendance || existing;
        const cAtt = r.attendance || r;

        // Merge punches: Earliest In, Latest Out
        if (cAtt.firstIn && (!eAtt.firstIn || new Date(cAtt.firstIn) < new Date(eAtt.firstIn))) {
          eAtt.firstIn = cAtt.firstIn;
        }
        if (cAtt.lastOut && (!eAtt.lastOut || new Date(cAtt.lastOut) > new Date(eAtt.lastOut))) {
          eAtt.lastOut = cAtt.lastOut;
        }
        
        // If one record has a more 'meaningful' status than the other, prefer it
        const priority = { "on time": 3, "late": 2, "half day": 1, "absent": 0 };
        const s1 = (eAtt.status || "").toLowerCase();
        const s2 = (cAtt.status || "").toLowerCase();
        if ((priority[s2] || 0) > (priority[s1] || 0)) {
          eAtt.status = cAtt.status;
        }
      }
    });

    const deduplicated = Array.from(uniqueMap.values());

    // 2. Apply search and status filters
    return deduplicated.filter((r) => {
      const att = r.attendance || r;
      const empId = att.employeeId || r.employeeId;
      const fullEmp = empLookup[String(empId)] || r.employees || r.employee || {};

      const name = (fullEmp.firstName ? `${fullEmp.firstName} ${fullEmp.lastName || ""}` : (att.name || "")).toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());

      let matchesStatus = true;
      if (statusFilter) {
        const statusStr = (att.status || (att.firstIn ? "On time" : "Absent")).toLowerCase();
        if (statusFilter === "Late") matchesStatus = statusStr === "late";
        else if (statusFilter === "Absent") matchesStatus = statusStr === "absent";
        else if (statusFilter === "Present") matchesStatus = statusStr !== "late" && statusStr !== "absent";
      }

      const matchesShift = shiftFilter === "All" || String(fullEmp.shiftId) === String(shiftFilter);

      return matchesSearch && matchesStatus && matchesShift;
    });
  }, [attendanceList, search, statusFilter, shiftFilter, empLookup]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCloseAttendance = async () => {
    if (!dateFrom) {
      toast.error("Please select a date to close attendance");
      return;
    }

    // Show simple modal
    setShowConfirmModal(true);
  };

  const executeCloseAttendance = async () => {
    setShowConfirmModal(false);

    try {
      const result = await closeAttendance(dateFrom).unwrap();

      if (result.status) {
        toast.success(`Attendance closed successfully for ${dateFrom}`);
        refetch(); // Refresh the data
      } else {
        toast.error(`Failed to close attendance: ${result.message}`);
      }
    } catch (error) {
      toast.error(`Failed to close attendance: ${error.message}`);
    }
  };

  const present = data?.result?.statistics?.ontime || 0;
  const late = data?.result?.statistics?.late || 0;
  const absent = data?.result?.statistics?.absent || 0;
  const total = data?.result?.statistics?.totalemployee || (present + late + absent);

  return (
    <>
      <Toaster position="top-right" />

      {/* Custom Confirmation Modal */}
      <CustomConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeCloseAttendance}
        date={dateFrom}
      />

      <div className=" bg-slate-50 dark:bg-slate-800 p-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-end gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2 text-sm shadow-sm">
              <Calendar size={14} className="text-gray-400" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="outline-none text-sm bg-transparent" />
              <span className="text-gray-300">–</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="outline-none text-sm bg-transparent" />
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm !important"
              style={{ backgroundColor: 'rgb(37, 99, 235)', color: 'white' }}
            >
              {isFetching ? (
                <><RefreshCw size={14} className="animate-spin" /> Refreshing...</>
              ) : (
                <><RefreshCw size={14} /> Refresh</>
              )}
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Strength"
            value={total}
            color="bg-gradient-to-br from-blue-500 to-indigo-700"
            sub="enrolled employees"
            onClick={() => setStatusFilter(null)}
            isActive={statusFilter === null}
          />
          <StatCard
            icon={CheckCircle}
            label="Present Today"
            value={present}
            color="bg-gradient-to-br from-emerald-500 to-emerald-700"
            sub="on time arrivals"
            onClick={() => handleFilterClick("Present")}
            isActive={statusFilter === "Present"}
          />
          <StatCard
            icon={Clock}
            label="Late Arrivals"
            value={late}
            color="bg-gradient-to-br from-orange-400 to-orange-600"
            sub="past grace period"
            onClick={() => handleFilterClick("Late")}
            isActive={statusFilter === "Late"}
          />
          <StatCard
            icon={UserMinus}
            label="Absent Today"
            value={absent}
            color="bg-gradient-to-br from-red-500 to-red-700"
            sub="no check-in"
            onClick={() => handleFilterClick("Absent")}
            isActive={statusFilter === "Absent"}
          />
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Attendance Mix - Donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-1 lg:col-span-1">
            <p className="text-xs font-bold uppercase text-gray-400 mb-3 tracking-widest">Attendance Mix</p>
            <DonutChart present={present} late={late} absent={absent} total={total} />
          </div>

          {/* Check-in Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-3 lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">Check-in Timeline</p>
              {attendanceList.length > 0 ? (
                <TimelineChart data={filtered} type="in" color="#6366f1" gradId="gradIn" />
              ) : (
                <div className="h-16 flex items-center text-xs text-gray-400 italic">No data</div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-4 tracking-widest">Check-out Timeline</p>
              {attendanceList.length > 0 ? (
                <TimelineChart data={filtered} type="out" color="#f59e0b" gradId="gradOut" />
              ) : (
                <div className="h-16 flex items-center text-xs text-gray-400 italic">No data</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Employee Table ── */}
        <div ref={tableRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-800">Employee Attendance Log</h2>
                <p className="text-xs text-gray-400">{filtered.length} records found</p>
              </div>
              {statusFilter && (
                <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold animate-fade-in border border-blue-100">
                  <span>Filtering: {statusFilter}</span>
                  <button onClick={() => setStatusFilter(null)} className="hover:text-blue-900 ml-1">✕</button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2">
                <Search size={14} className="text-gray-400" />
                <input
                  placeholder="Search employee…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="outline-none bg-transparent text-sm w-44"
                />
              </div>

              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="bg-gray-50 border rounded-xl px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="All">All Shifts</option>
                {shiftsData?.data?.map(s => (
                  <option key={s.id} value={s.id}>{s.shiftName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  {["#", "Employee", "Emp Code", "Department", "Shift", "First In", "Last Out", "Total Hrs", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Loading attendance…
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400 italic">No attendance records for this period</td>
                  </tr>
                )}
                {!isLoading && filtered.map((rec, idx) => {
                  const att = rec.attendance || rec;
                  const empId = att.employeeId || rec.employeeId;
                  const fullEmp = empLookup[String(empId)] || rec.employees || rec.employee || {};

                  const name = fullEmp.firstName
                    ? `${fullEmp.firstName} ${fullEmp.lastName || ""}`
                    : (att.name || `Employee #${empId || idx + 1}`);

                  const code = fullEmp.empCode || fullEmp.employeeId || "—";
                  const dept = fullEmp.department?.name || fullEmp.department || fullEmp.departmentId || "—";
                  const statusStr = att.status || (att.firstIn ? "On time" : "Absent");
                  const statusMeta = getStatusMeta(statusStr);

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {name[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="font-semibold text-gray-800 truncate max-w-[140px] text-xs lg:text-sm">{name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 font-mono text-xs">{code}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{dept}</td>
                      <td className="px-5 py-4">
                        {fullEmp.shiftId ? (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
                                {shiftsData?.data?.find(s => String(s.id) === String(fullEmp.shiftId))?.shiftName || "—"}
                            </span>
                        ) : (
                            <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-600 font-medium text-xs font-mono">{fmtTime(att.firstIn || att.checkIn)}</td>
                      <td className="px-5 py-4 text-gray-600 font-medium text-xs font-mono">{fmtTime(att.lastOut || att.checkOut)}</td>
                      <td className="px-5 py-4 text-blue-600 font-bold text-xs">
                        {(() => {
                          if (att.totalHours && att.totalHours !== "0.00") return `${att.totalHours}h`;
                          if (att.firstIn && att.lastOut) {
                            const start = new Date(att.firstIn);
                            const end = new Date(att.lastOut);
                            const diff = (end - start) / (1000 * 60 * 60);
                            return diff > 0 ? `${diff.toFixed(2)}h` : "0.00";
                          }
                          return "0.00";
                        })()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase ${statusMeta.cls}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {attendanceList.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2">
                {pagination.totalPages > 1 && (
                  <>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      {pagination.totalPages ?
                        `Page ${pagination.page} of ${pagination.totalPages}` :
                        `Page ${currentPage}`
                      }
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>

              <div className="text-sm text-gray-500">
                {pagination.total ?
                  `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} entries` :
                  `Showing ${attendanceList.length} entries`
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
