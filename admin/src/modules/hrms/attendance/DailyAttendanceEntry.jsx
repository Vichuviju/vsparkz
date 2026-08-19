import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { 
  useGetAllEmployeeAttendanceQuery,
  useCreateAttendanceMutation,
  useUpdateAttendanceMutation,
  useDeleteAttendanceMutation,
  useGetIndividualEmployeeAttendanceQuery,
  useCloseDailyAttendanceMutation,
} from "@/services/hrms/attendance.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useGetShiftsQuery } from "@/services/hrms/shifts.api";
import { useGetHrSettingsQuery } from "@/services/hrms/hrSettings.api";
import { useGetHolidayQuery } from "@/services/hrms/holiday.api.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// Combobox imports removed to fix selection issues inside dialogs
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────
const toDateInput = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const toTimeInput = (v) => {
  if (!v || v === "N/A" || String(v).includes("00:00:00")) return "";
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "";
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  } catch {
    return "";
  }
};

const format24toAMPM = (timeStr) => {
  if (!timeStr || timeStr === "—" || timeStr === "-") return "";
  const [hourStr, minuteStr] = timeStr.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return timeStr;
  
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
};

const STATUS_PILL = {
  "On time":   "bg-emerald-100 text-emerald-700 border-emerald-300",
  "Late":      "bg-orange-100  text-orange-700  border-orange-300",
  "Absent":    "bg-red-100     text-red-700     border-red-300",
  "Leave":     "bg-blue-100    text-blue-700    border-blue-300",
  "Half Day":  "bg-yellow-100  text-yellow-700  border-yellow-300",
  "Weekly Off":"bg-slate-100   text-slate-600   border-slate-200",
  "Checked In":"bg-emerald-100 text-emerald-700 border-emerald-300 animate-pulse ring-2 ring-emerald-100",
};
const STATUS_ABBR = {
  "On time":   "P",
  "Late":      "L",
  "Absent":    "AB",
  "Leave":     "LV",
  "Half Day":  "HD",
  "Weekly Off":"W",
  "Checked In":"CI",
};

const getDaysBetween = (from, to) => {
  const result = [];
  let cur = new Date(from);
  const end = new Date(to);
  while (cur <= end && result.length < 7) {
    result.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Correction Modal ────────────────────────────────────────────────────────
const CorrectionModal = ({ open, onClose, initialData, onSave, allEmployees, isLoadingEmployees, shifts = [] }) => {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    id:         initialData?.attendance?.id || initialData?.id || null,
    employeeId: initialData?.attendance?.employeeId || initialData?.employeeId || "",
    empCode:    "",
    date:       toDateInput(initialData?.attendance?.date || initialData?.date || today),
    checkIn:    toTimeInput(initialData?.attendance?.firstIn || ""),
    checkOut:   toTimeInput(initialData?.attendance?.lastOut || ""),
    reason:     "",
    note:       "",
  });

  // 📝 Fetch existing data when date or employee changes
  const { data: existingData, isFetching: isFetchingExisting } = useGetIndividualEmployeeAttendanceQuery(
    { employeeId: form.employeeId, dateFrom: form.date, dateTo: form.date },
    { skip: !open || !form.employeeId || !form.date }
  );

  const selectedEmp = useMemo(() => {
    if (!form.employeeId) return null;
    const searchId = String(form.employeeId);
    return allEmployees.find(e => String(e.id) === searchId) || null;
  }, [allEmployees, form.employeeId]);

  const selectedShift = useMemo(() => {
    if (!selectedEmp?.shiftId) return null;
    return shifts.find(s => String(s.id) === String(selectedEmp.shiftId)) || null;
  }, [selectedEmp, shifts]);

  React.useEffect(() => {
    if (initialData) {
      const att = initialData?.attendance || initialData;
      const searchId = String(att.employeeId);
      const emp = allEmployees.find(e => String(e.id) === searchId);
      setForm({
        id:         att.id || null,
        employeeId: att.employeeId || "",
        empCode:    emp?.empCode || "",
        date:       toDateInput(att.date || today),
        checkIn:    toTimeInput(att.firstIn || att.checkIn || ""),
        checkOut:   toTimeInput(att.lastOut || att.checkOut || ""),
        reason:     att.timingStatus || "",
        note:       att.note || "",
      });
      // Search term state no longer needed, Base UI Combobox handles it
    } else {
        setForm({
            id:         null,
            employeeId: "",
            empCode:    "",
            date:       today,
            checkIn:    "",
            checkOut:   "",
            reason:     "",
            note:       "",
        });
    }
  }, [initialData, open, allEmployees.length]);

  // 🚀 Pre-fill from shift baseline immediately upon employee selection
  // This provides instant feedback before the existing attendance check completes
  React.useEffect(() => {
    if (!open || initialData || !selectedShift) return;
    
    setForm(prev => ({
      ...prev,
      checkIn: selectedShift.firstPunch || "",
      checkOut: selectedShift.lastPunch || "",
    }));
  }, [selectedShift, initialData, open]);

  // 🔄 Auto-fill form when existing data is found
  React.useEffect(() => {
    if (!open || isFetchingExisting) return;
    
    // The backend returns { records: [], policyStatuses: {}, shift: {} }
    const record = existingData?.data?.records?.[0];

    if (record) {
        const isCorrectEmployee = String(record.employeeId) === String(form.employeeId);
        const isCorrectDate = toDateInput(record.date) === form.date;
        const isCurrentEditRecord = initialData?.attendance?.id === record.id;

        if (isCorrectEmployee && isCorrectDate && !isCurrentEditRecord) {
            setForm(prev => ({
                ...prev,
                id: record.id,
                checkIn: toTimeInput(record.firstIn || record.checkIn || ""),
                checkOut: toTimeInput(record.lastOut || record.checkOut || ""),
                reason: prev.reason || record.timingStatus || record.status || "",
                note: prev.note || record.note || "",
            }));
            toast.info(`Found existing record for ${form.date}. Pre-filling data.`);
        }
    } else if (existingData && (!existingData.data?.records || existingData.data.records.length === 0) && !isFetchingExisting) {
        // If no records found, the immediate shift-based pre-fill already handled the defaults.
        // We just ensure the ID is null for a fresh entry.
        if (!initialData) {
            setForm(prev => ({ ...prev, id: null }));
        }
    }
  }, [existingData, isFetchingExisting, open]);

  // 📝 Get the day's policy status (Holiday, Weekly Off) or existing Leave status
  const dayStatus = useMemo(() => {
    if (!open || !form.date || !form.employeeId || isFetchingExisting) return null;
    
    // 1. Check for Holiday or Weekly Off from policyStatuses
    const policy = existingData?.data?.policyStatuses?.[form.date];
    if (policy) {
      return { 
        status: policy.status, 
        label: policy.label, 
        detail: policy.timingStatus || policy.status,
        type: policy.status === "Holiday" ? "holiday" : 
              policy.status === "Weekly Off" ? "weekly-off" : "working"
      };
    }

    // 2. Check if there's an existing Leave record
    const record = existingData?.data?.records?.[0];
    if (record?.status === "Leave") {
      return { 
        status: "Leave", 
        label: "LV", 
        detail: "Approved Leave",
        type: "leave"
      };
    }

    return null;
  }, [existingData, isFetchingExisting, form.date, form.employeeId, open]);

  // Derived check for empCode if missing
  React.useEffect(() => {
    if (selectedEmp && !form.empCode) {
        setForm(prev => ({ ...prev, empCode: selectedEmp.empCode }));
    }
  }, [selectedEmp, form.empCode]);

  const [isOverriding, setIsOverriding] = useState(false);

  // Reset override state when date or employee changes
  useEffect(() => {
    setIsOverriding(false);
  }, [form.date, form.employeeId]);

  const handleSelectEmployee = (emp) => {
    if (!emp) return;
    setForm(prev => ({ 
        ...prev, 
        employeeId: emp.id,
        empCode: emp.empCode || ""
    }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!form.employeeId) {
        toast.error("Please select an employee");
        return;
    }

    // 🚩 Trigger confirmation for Non-Working Days (only for NEW entries)
    if (dayStatus && !initialData && !isOverriding) {
        setIsOverriding(true);
        return;
    }

    // Prepare timestamps for DB using traditional MySQL format (YYYY-MM-DD HH:mm:ss)
    const [y, mm, dd] = form.date.split("-");
    const firstIn = form.checkIn ? `${y}-${mm}-${dd} ${form.checkIn}:00` : null;
    const lastOut = form.checkOut ? `${y}-${mm}-${dd} ${form.checkOut}:00` : null;

    const submitData = {
        id: form.id,
        employeeId: Number(form.employeeId),
        date: form.date,
        firstIn,
        lastOut,
        timingStatus: form.reason || "Manual Entry",
        note: form.note,
    };

    onSave(submitData);
    setIsOverriding(false); // Reset for next use
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <>
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-base font-bold text-gray-900">
            {initialData ? "Correct Attendance Entry" : "Add Manual Entry"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Manually enter or correct check-in / check-out times
          </DialogDescription>
        </DialogHeader>

        {isOverriding ? (
          <div className="px-8 py-12 text-center animate-in fade-in zoom-in duration-300">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
              dayStatus.type === 'holiday' ? 'bg-purple-100 text-purple-600 shadow-purple-100' : 
              dayStatus.type === 'leave' ? 'bg-blue-100 text-blue-600 shadow-blue-100' :
              'bg-amber-100 text-amber-600 shadow-amber-100'
            }`}>
              <AlertCircle size={40} strokeWidth={2.5} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Override {dayStatus.status}?</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              The selected date (<strong>{new Date(form.date).toLocaleDateString()}</strong>) is identified as a 
              <span className="font-bold text-gray-700 mx-1">{dayStatus.status}</span> 
              due to <span className="italic text-gray-600">{dayStatus.detail}</span>.
              <br /><br />
              Are you sure you want to override this and add manual attendance?
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full rounded-xl py-3 text-sm font-bold shadow-md transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#4f46e5', color: 'white' }}
              >
                Yes, Override & Add Entry
              </button>
              <button
                type="button"
                onClick={() => setIsOverriding(false)}
                className="w-full border border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                No, Go Back
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date *</label>
                <input
                  type="date" required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Search Employee *</label>
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const emp = allEmployees.find(E => String(E.id) === String(id));
                    setForm(prev => ({ 
                      ...prev, 
                      employeeId: id,
                      empCode: emp?.empCode || "" 
                    }));
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">Select employee...</option>
                  {isLoadingEmployees ? (
                    <option disabled>Loading employees...</option>
                  ) : (
                    Array.isArray(allEmployees) && allEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.empCode} - {emp.firstName} {emp.lastName}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Employee Code (Preloaded)</label>
                <input
                  type="text" disabled
                  placeholder="e.g. EMP001"
                  value={form.empCode}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              {isFetchingExisting && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl animate-pulse">
                  <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                  <div className="text-[10px] font-bold text-gray-500 uppercase">Checking Policy...</div>
                </div>
              )}

              {dayStatus && !isFetchingExisting && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                  dayStatus.type === 'holiday' ? 'bg-purple-50 border-purple-100' : 
                  dayStatus.type === 'leave' ? 'bg-blue-50 border-blue-100' :
                  dayStatus.type === 'weekly-off' ? 'bg-amber-50 border-amber-100' :
                  'bg-slate-50 border-slate-100'
                }`}>
                  <div className={`p-1.5 rounded-lg font-bold text-[10px] ${
                    dayStatus.type === 'holiday' ? 'bg-purple-100 text-purple-600' : 
                    dayStatus.type === 'leave' ? 'bg-blue-100 text-blue-600' :
                    dayStatus.type === 'weekly-off' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {dayStatus.label}
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase leading-none ${
                      dayStatus.type === 'holiday' ? 'text-purple-500' : 
                      dayStatus.type === 'leave' ? 'text-blue-500' :
                      dayStatus.type === 'weekly-off' ? 'text-amber-500' :
                      'text-slate-500'
                    }`}>{dayStatus.status}</div>
                    <div className={`text-xs font-bold mt-0.5 ${
                      dayStatus.type === 'holiday' ? 'text-purple-700' : 
                      dayStatus.type === 'leave' ? 'text-blue-700' :
                      dayStatus.type === 'weekly-off' ? 'text-amber-700' :
                      'text-slate-700'
                    }`}>{dayStatus.detail}</div>
                  </div>
                </div>
              )}
              {selectedShift && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                    <AlertCircle size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase leading-none">Shift: {selectedShift.shiftName}</div>
                    <div className="text-xs font-bold text-blue-700 mt-0.5">
                      { (selectedShift.timings && !["-", "—"].includes(selectedShift.timings))
                        ? selectedShift.timings 
                        : (selectedShift.firstPunch && selectedShift.lastPunch)
                          ? `${format24toAMPM(selectedShift.firstPunch)} - ${format24toAMPM(selectedShift.lastPunch)}`
                          : "No timings set"
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600">Check-In Time *</label>
                  <button type="button" onClick={() => setForm({ ...form, checkIn: "" })} className="text-[10px] text-red-500 hover:underline font-bold">Clear</button>
                </div>
                <input
                  type="time" required
                  value={form.checkIn}
                  onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600">Check-Out Time</label>
                  <button type="button" onClick={() => setForm({ ...form, checkOut: "" })} className="text-[10px] text-red-500 hover:underline font-bold">Clear</button>
                </div>
                <input
                  type="time"
                  value={form.checkOut}
                  onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correction Reason *</label>
              <select
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">Select reason…</option>
                <option>Biometric device failure</option>
                <option>Forgot to punch</option>
                <option>System error</option>
                <option>Field work / Off-site duty</option>
                <option>Manual regularisation</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Note</label>
              <textarea
                rows={3} placeholder="Additional remarks…"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={onClose}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-blue-100"
                style={{ backgroundColor: '#4f46e5', color: 'white' }}
              >
                <Save size={16} strokeWidth={2.5} />
                {initialData ? "Apply Correction" : "Add Entry"}
              </button>
            </div>
          </form>
        )}
      </>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const DailyAttendanceEntry = () => {
  const today = new Date().toISOString().split("T")[0];
  
  // View context
  const [viewMode, setViewMode] = useState("daily"); // 'daily' | 'weekly'
  const [activeDate, setActiveDate] = useState(today);

  // Week navigation (always relative to activeDate)
  const currentMonday = useMemo(() => {
    const d = new Date(activeDate);
    // Adjust to Monday
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split("T")[0];
  }, [activeDate]);

  const weekEnd = useMemo(() => {
    const d = new Date(currentMonday);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  }, [currentMonday]);

  // Determine query range based on viewMode
  const dateFrom = viewMode === 'daily' ? activeDate : currentMonday;
  const dateTo   = viewMode === 'daily' ? activeDate : weekEnd;

  const days = useMemo(() => getDaysBetween(dateFrom, dateTo), [dateFrom, dateTo]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(activeDate);
    if (viewMode === 'daily') d.setDate(d.getDate() - 1);
    else d.setDate(d.getDate() - 7);
    setActiveDate(d.toISOString().split("T")[0]);
  };

  const handleNext = () => {
    const d = new Date(activeDate);
    if (viewMode === 'daily') d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() + 7);
    setActiveDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => setActiveDate(today);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);

  const { data, isLoading, refetch } = useGetAllEmployeeAttendanceQuery({
    dateFrom,
    dateTo,
    page: currentPage,
    limit: pageSize,
  });

  const [createAttendance] = useCreateAttendanceMutation();
  const [updateAttendance] = useUpdateAttendanceMutation();
  const [deleteAttendance] = useDeleteAttendanceMutation();
  const [closeAttendance, { isLoading: isClosing }] = useCloseDailyAttendanceMutation();

  const { data: shiftsData } = useGetShiftsQuery();
  const shifts = shiftsData?.data || [];

  const { data: hrSettingsData } = useGetHrSettingsQuery();
  const { data: holidayData } = useGetHolidayQuery({ page: 1, limit: 100 });

  const { data: employeesData, isLoading: isLoadingEmployees } = useGetAllEmployeesQuery();

  // Helper: Get status for a specific employee on a specific date (Holiday or Weekly Off)
  const checkIsNonWorkingDay = (employee, dateStr) => {
    if (!employee || !dateStr) return null;
    const d = new Date(dateStr);
    
    // Use UTC-safe Day of Week for consistency with "YYYY-MM-DD" parsing
    const dayName = DAY_LABELS[d.getUTCDay()]; 
    const nth = Math.ceil(d.getUTCDate() / 7);

    // 1. Check for Holidays
    const hData = holidayData?.data || (Array.isArray(holidayData) ? holidayData : []);
    const isHoliday = hData.some(h => toDateInput(h.date) === dateStr);
    if (isHoliday) return "Holiday";

    // 2. Check for Shift-specific Weekly Off
    const shift = shifts.find(s => String(s.id) === String(employee.shiftId));
    
    // Policy Fallback: Shift -> Global -> Sunday
    const gOff = hrSettingsData?.data?.GLOBAL_WEEKLY_OFF;
    const offDays = shift?.weeklyOffDays || gOff?.days || ["Sun"];
    const alt = shift?.altWeeklyOff || gOff?.alt || "All Saturdays";

    if (Array.isArray(offDays) && offDays.includes(dayName)) {
        if (dayName === "Sat") {
            if (alt.includes("2nd and 4th Saturday") && (nth === 2 || nth === 4)) return "Weekly Off";
            if (alt.includes("1st, 3rd & 5th Saturday") && (nth === 1 || nth === 3 || nth === 5)) return "Weekly Off";
            if (alt === "None") return null;
            return "Weekly Off"; // All Saturdays
        }
        return "Weekly Off";
    }
    return null;
  };

  const allEmployees = useMemo(() => {
    if (Array.isArray(employeesData)) return employeesData;
    if (Array.isArray(employeesData?.data)) return employeesData.data;
    return [];
  }, [employeesData]);

  const records = data?.result?.data || [];
  const pagination = data?.result?.pagination || {};
  const stats   = data?.result?.statistics || {};

  // Reset to page 1 when date filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleCloseAttendance = async () => {
    try {
      // Always close for the currently active/selected date, not the start of the week
      const date = activeDate;
      
      toast.promise(closeAttendance({ date }).unwrap(), {
        loading: `Closing attendance for ${date}...`,
        success: (res) => {
          refetch();
          return res.message || `Attendance for ${date} closed successfully`;
        },
        error: "Failed to close attendance. Manual mark might be already in progress.",
      });
    } catch (e) {
      
    }
  };

  // Group records by employeeId → date
  const grouped = useMemo(() => {
    const map = {};
    // Pre-create a lookup for full employee details from the comprehensive list
    const empLookup = {};
    if (Array.isArray(allEmployees)) {
      allEmployees.forEach(e => {
        if (e.id) empLookup[String(e.id)] = e;
      });
    }

    records.forEach((r) => {
      const att = r.attendance || r;
      // Get the stable ID
      const rawId = att.employeeId || r.employeeId || r.id;
      if (!rawId) return;
      const eid = String(rawId);
      
      // Attempt to get the richest employee data available
      const fullEmp = empLookup[eid] || r.employee || r.employees || {};

      let finalAtt = att;

      // Dynamic Hour Calculation for display fallback (Immutably)
      if (!att.totalHours && att.firstIn && att.lastOut) {
        const start = new Date(att.firstIn);
        const end = new Date(att.lastOut);
        let diff = (end - start) / (1000 * 60 * 60);
        if (diff < 0) diff += 24; // Handle midnight crossover
        finalAtt = { ...att, totalHours: diff.toFixed(2) };
      }

      if (!map[eid]) {
        map[eid] = {
          eid,
          name: fullEmp.firstName ? `${fullEmp.firstName} ${fullEmp.lastName || ""}` : (att.name || `Emp #${eid}`),
          code: fullEmp.empCode || fullEmp.employeeId || "—",
          dept: fullEmp.department?.name || fullEmp.department || "—",
          shiftId: fullEmp.shiftId,
          days: {},
        };
      }
      map[eid].days[toDateInput(finalAtt.date)] = finalAtt;
    });
    return Object.values(map);
  }, [records, allEmployees]);

  const filtered = grouped.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesShift = shiftFilter === "ALL" || String(g.shiftId) === String(shiftFilter);
    return matchesSearch && matchesShift;
  });

  const handleSave = async (formData) => {
    try {
      const { id, ...payload } = formData;
      if (id || editRecord?.attendance?.id) {
        const recordId = id || editRecord.attendance.id;
        await updateAttendance({ id: recordId, ...payload }).unwrap();
        toast.success("Attendance updated successfully");
      } else {
        await createAttendance(payload).unwrap();
        toast.success("Attendance entry added");
      }
      setModalOpen(false);
      setEditRecord(null);
      refetch();
    } catch (e) {
      toast.error(e?.data?.message || "Failed to save attendance");
    }
  };

  const handleDelete = (id) => {
    toast.error("Confirm Deletion", {
      description: "Are you sure you want to delete this attendance record?",
      duration: 5000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteAttendance(id).unwrap();
            toast.success("Record deleted");
            refetch();
          } catch {
            toast.error("Failed to delete record");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex gap-3">
          <button
            onClick={handleCloseAttendance}
            disabled={isClosing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${isClosing ? 'opacity-70' : ''}`}
            style={{ backgroundColor: '#f43f5e', color: 'white' }}
          >
            <X size={16} strokeWidth={2.5} />
            {isClosing ? "Closing..." : "Close Attendance"}
          </button>
          <button
            onClick={() => { setEditRecord(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#4f46e5', color: 'white' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Entry
          </button>
        </div>
      </div>

      {/* Stats chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Present Days", val: stats.ontime || 0, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
          { label: "Absent",       val: stats.absent || 0, color: "bg-red-50    text-red-700    border-red-200" },
          { label: "Late",         val: stats.late   || 0, color: "bg-orange-50 text-orange-700 border-orange-200" },
        ].map((c) => (
          <div key={c.label} className={`px-4 py-2 rounded-xl text-xs font-bold border ${c.color}`}>
            {c.label}: {c.val}
          </div>
        ))}
      </div>

      {/* Short Codes Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        <span className="font-semibold text-gray-400">Short Codes:</span>
        {[
          { code: "P",  label: "Present",    color: "bg-emerald-100 text-emerald-700" },
          { code: "L",  label: "Late",       color: "bg-orange-100  text-orange-700" },
          { code: "AB", label: "Absent",     color: "bg-red-100     text-red-700" },
          { code: "LV", label: "Leave",      color: "bg-blue-100    text-blue-700" },
          { code: "HD", label: "Half Day",   color: "bg-yellow-100  text-yellow-700" },
          { code: "W",  label: "Weekly Off", color: "bg-slate-100   text-slate-600" },
          { code: "CI", label: "Checked In", color: "bg-emerald-100 text-emerald-700 animate-pulse" },
        ].map((item) => (
          <div key={item.code} className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded font-bold ${item.color}`}>{item.code}</span>
            <span>= {item.label}</span>
          </div>
        ))}
      </div>

      {/* Week navigation + search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'daily' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'weekly' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Weekly
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-gray-700 min-w-[140px] text-center">
                {viewMode === 'daily' ? (
                  new Date(activeDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                ) : (
                  <>
                    {new Date(dateFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                    {new Date(dateTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </>
                )}
              </span>
              <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ChevronRight size={16} />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold hover:bg-gray-50 bg-white ml-2"
              >
                Today
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-10 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              >
                <option value="ALL">All Shifts</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.shiftName}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight size={14} className="rotate-90 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border rounded-xl px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                placeholder="Search employee…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none bg-transparent text-sm w-40"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3 text-left sticky left-0 bg-gray-50">EMP Code</th>
                <th className="px-5 py-3 text-left sticky left-20 bg-gray-50">Employee Name</th>
                <th className="px-5 py-3 text-left">Department</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className={`px-3 py-3 text-center min-w-[80px] ${toDateInput(d) === today ? "text-blue-600" : ""}`}>
                    <div>{DAY_LABELS[d.getDay()]}</div>
                    <div className={`text-[10px] font-normal mt-0.5 ${toDateInput(d) === today ? "bg-blue-600 text-white rounded-full px-1.5 py-0.5 inline-block" : "text-gray-400"}`}>
                      {d.getDate()}
                    </div>
                  </th>
                ))}
                <th className="px-5 py-3 text-center">Total Hrs</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={days.length + 5} className="text-center py-12 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Loading…
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={days.length + 5} className="text-center py-12 text-gray-400 italic">
                    No records found for this week
                  </td>
                </tr>
              )}
              {!isLoading && filtered.map((emp) => {
                let totalHrs = 0;
                return (
                  <tr key={emp.eid} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 sticky left-0 bg-white">{emp.code}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800 sticky left-20 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {emp.name[0]?.toUpperCase()}
                        </div>
                        <span className="truncate max-w-[120px]">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{emp.dept}</td>
                    {days.map((d) => {
                      const ds = toDateInput(d);
                      const att = emp.days[ds];
                      if (att) totalHrs += Number(att.totalHours || att.totalWorkingHours || 0);
                      
                      const s = att?.status || (att ? "On time" : null);
                      const isToday = new Date().toISOString().split('T')[0] === ds;
                      let displayStatus = s;
                      if (isToday && att && !att.lastOut && (s === "On time" || s === "Present" || s === "Late")) {
                          displayStatus = "Checked In";
                      }

                      // If no explicit attendance record, check for scheduled Weekly Off or Holiday
                      if (!displayStatus) {
                          const employeeInfo = allEmployees.find(e => String(e.id) === String(emp.eid));
                          displayStatus = checkIsNonWorkingDay(employeeInfo, ds);
                      }

                      const pillCls = displayStatus ? STATUS_PILL[displayStatus] || "bg-gray-100 text-gray-600 border-gray-200" : "";
                      const abbr    = displayStatus ? STATUS_ABBR[displayStatus] || displayStatus[0] : "";

                      return (
                        <td 
                          key={ds} 
                          className="px-3 py-3 text-center cursor-pointer hover:bg-blue-50/50 transition-colors group/cell"
                          onClick={() => {
                            setEditRecord({ 
                              attendance: att || { employeeId: emp.eid, date: ds }, 
                              employees: { firstName: emp.name } 
                            });
                            setModalOpen(true);
                          }}
                        >
                          {displayStatus ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border ${pillCls}`}>
                                {abbr}
                              </span>
                              {att && (
                                <span className="text-[9px] text-gray-400 font-medium group-hover/cell:text-blue-600">
                                  {att.firstIn ? toTimeInput(att.firstIn) : "—"}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-200 text-xs group-hover/cell:text-blue-300 italic">Add</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-5 py-3 text-center text-blue-600 font-bold text-sm">
                      {totalHrs > 0 ? `${totalHrs.toFixed(2)}h` : "0.00"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => {
                          const lastDay = Object.values(emp.days)[0];
                          setEditRecord({ attendance: lastDay, employees: { firstName: emp.name } });
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {records.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-gray-200">
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
                `Showing ${records.length} entries`
              }
            </div>
          </div>
        )}
      </div>

      <CorrectionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null); }}
        initialData={editRecord}
        onSave={handleSave}
        allEmployees={allEmployees}
        isLoadingEmployees={isLoadingEmployees}
        shifts={shifts}
      />
    </div>
  );
};
