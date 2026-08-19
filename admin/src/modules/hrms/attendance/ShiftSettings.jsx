import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Save,
  X,
  Users,
  Sun,
  Moon,
  Zap,
  RefreshCw,
  Search,
  Check,
  Info,
} from "lucide-react";
import {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
} from "@/services/hrms/shifts.api";
import { useGetWeeklyOffQuery } from "@/services/hrms/weeklyoff";
import { useGetHrSettingsQuery, useSaveHrSettingsMutation } from "@/services/hrms/hrSettings.api";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useBulkAssignShiftMutation } from "@/services/hrms/shifts.api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" },
];

const SHIFT_TYPES = ["Regular", "Night", "Flexi", "Rotational"];

const TYPE_META = {
  Regular:    { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", Icon: Sun },
  Night:      { cls: "bg-blue-100  text-blue-700  border-blue-200",  Icon: Moon },
  Flexi:      { cls: "bg-teal-100    text-teal-700    border-teal-200",    Icon: Zap },
  Rotational: { cls: "bg-orange-100  text-orange-700  border-orange-200",  Icon: RefreshCw },
};

const ALT_OFF_OPTIONS = [
  "None",
  "1st Saturday",
  "2nd Saturday",
  "4th Saturday",
  "2nd & 4th Saturday",
  "1st & 3rd Saturday",
  "All Saturdays",
];

// ─── Shift Modal ─────────────────────────────────────────────────────────────
const ShiftModal = ({ open, onClose, initial, onSave }) => {
  const empty = {
    timings: "", gracePeriod: 15, minFullDayHours: 8, minHalfDayHours: 4, type: "Regular",
    weeklyOffDays: [], altWeeklyOff: "None"
  };
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(initial ? { ...initial } : empty);
  }, [initial, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const toggleDay = (day) => {
    const current = form.weeklyOffDays || [];
    const isCurrentlyIn = current.includes(day);
    const next = isCurrentlyIn ? current.filter(d => d !== day) : [...current, day];
    
    let updatedAlt = form.altWeeklyOff || "None";
    // Smart Sync: If turning Saturday OFF, reset dropdown to None
    if (day === "Sat" && isCurrentlyIn) {
        updatedAlt = "None";
    }
    
    setForm(f => ({ ...f, weeklyOffDays: next, altWeeklyOff: updatedAlt }));
  };

  const handleAltOffChange = (val) => {
    let nextDays = form.weeklyOffDays || [];
    // Smart Sync: If selecting All Saturdays, force toggle ON
    if (val === "All Saturdays") {
        nextDays = nextDays.includes("Sat") ? nextDays : [...nextDays, "Sat"];
    } 
    // Smart Sync: If specific pattern, make sure main toggle is OFF to avoid overlap
    else if (val !== "None") {
        nextDays = nextDays.filter(d => d !== "Sat");
    }
    setForm(f => ({ ...f, altWeeklyOff: val, weeklyOffDays: nextDays }));
  };

  const calculateDuration = () => {
    if (!form.firstPunch || !form.lastPunch) return null;
    const [h1, m1] = form.firstPunch.split(":").map(Number);
    const [h2, m2] = form.lastPunch.split(":").map(Number);
    
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) diff += 24 * 60; // Handle overnight shifts
    
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return { hours, mins, totalH: (diff / 60).toFixed(2) };
  };

  const duration = calculateDuration();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-base font-bold text-gray-900">
            {initial ? "Edit Shift" : "Add New Shift"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">Shift Name *</label>
              <input
                required value={form.shiftName} placeholder="e.g. Morning Shift"
                onChange={(e) => set("shiftName", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30"
              />
            </div>

            <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-3 relative group">
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Time</label>
                    <input
                        type="time" value={form.firstPunch}
                        onChange={(e) => set("firstPunch", e.target.value)}
                        className="w-full bg-transparent text-sm font-bold outline-none focus:text-blue-600"
                    />
                </div>
            </div>
            
            <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex items-center gap-3 relative group">
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Time</label>
                    <input
                        type="time" value={form.lastPunch}
                        onChange={(e) => set("lastPunch", e.target.value)}
                        className="w-full bg-transparent text-sm font-bold outline-none focus:text-blue-600"
                    />
                </div>
                {duration && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-[9px] font-black text-white px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10 border border-white">
                    {duration.hours}H {duration.mins > 0 ? `${duration.mins}M` : ""}
                  </div>
                )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-wider">Shift Timing Description *</label>
                <button
                  type="button"
                  onClick={() => {
                    const format = (t) => {
                      if (!t) return "";
                      const [h, m] = t.split(":").map(Number);
                      const ampm = h >= 12 ? "PM" : "AM";
                      const hh = h % 12 || 12;
                      return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
                    };
                    if (form.firstPunch && form.lastPunch) {
                      set("timings", `${format(form.firstPunch)} - ${format(form.lastPunch)}`);
                    } else {
                      toast.error("Set start and end times first");
                    }
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Generate from times
                </button>
              </div>
              <input
                required value={form.timings || ""} placeholder="e.g. 09:00 AM - 06:00 PM"
                onChange={(e) => set("timings", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/30 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Grace (mins)</label>
              <input
                type="number" min={0} max={60} value={form.gracePeriod}
                onChange={(e) => set("gracePeriod", Number(e.target.value))}
                className="w-full border border-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Shift Category</label>
              <select
                required value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full border border-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                {SHIFT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Day Req (h)</label>
              <input
                type="number" min={1} max={12} value={form.minFullDayHours}
                onChange={(e) => set("minFullDayHours", Number(e.target.value))}
                className="w-full border border-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Half Day Req (h)</label>
              <input
                type="number" min={1} max={8} value={form.minHalfDayHours}
                onChange={(e) => set("minHalfDayHours", Number(e.target.value))}
                className="w-full border border-gray-100 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Shift-Specific Weekly Offs */}
            <div className="col-span-2 space-y-2 pt-1">
              <Separator className="bg-gray-50" />
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Sun size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">Shift Weekend Pattern</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map((d) => {
                    const isToggled = (form.weeklyOffDays || []).includes(d.key);
                    const isAltSat = d.key === "Sat" && (form.altWeeklyOff && form.altWeeklyOff !== "None");
                    const active = isToggled || isAltSat;
                    const subLabel = isToggled ? "" : (isAltSat ? "ALT" : "");

                    return (
                        <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleDay(d.key)}
                        title={subLabel ? `Alternate Pattern: ${form.altWeeklyOff}` : ""}
                        className={`w-8 h-8 rounded-xl text-[11px] font-black border transition-all outline-none flex flex-col items-center justify-center ${
                            active
                            ? "shadow-md scale-105 border-transparent"
                            : "bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200 hover:bg-white"
                        }`}
                        style={active ? { backgroundColor: '#4f46e5', color: 'white' } : {}}
                        >
                        <span>{d.key[0]}</span>
                        {subLabel && <span className="text-[6px] -mt-1 opacity-70">{subLabel}</span>}
                        </button>
                    );
                    })}
                  </div>

                  <div>
                     <select
                        value={form.altWeeklyOff || "None"}
                        onChange={(e) => handleAltOffChange(e.target.value)}
                        className="w-full border border-gray-100 rounded-xl px-2 py-1.5 text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50/50"
                     >
                        {ALT_OFF_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                     </select>
                  </div>
              </div>
            </div>
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
              <Save size={15} />
              {initial ? "Save Changes" : "Add Shift"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Bulk Assign Modal ──────────────────────────────────────────────────────
const BulkAssignModal = ({ open, onClose, shift }) => {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  
  const { data: employeesData, isLoading: isLoadingEmps } = useGetAllEmployeesQuery();
  const { data: shiftsData } = useGetShiftsQuery();
  const [bulkAssign, { isLoading: isAssigning }] = useBulkAssignShiftMutation();
  
  const employees = useMemo(() => {
    return employeesData?.data || employeesData || [];
  }, [employeesData]);

  const shiftsList = useMemo(() => {
    return shiftsData?.data || shiftsData || [];
  }, [shiftsData]);
  
  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
      const code = (emp.empCode || "").toLowerCase();
      const query = search.toLowerCase();
      return name.includes(query) || code.includes(query);
    });
  }, [employees, search]);

  useEffect(() => {
      if (open && shift && employees.length > 0) {
          // Auto-select employees already in this shift
          const alreadyIn = employees
            .filter(e => String(e.shiftId) === String(shift.id))
            .map(e => e.id);
          setSelectedIds(alreadyIn);
      }
      if (!open) {
          setSearch("");
          setSelectedIds([]);
      }
  }, [open, shift, employees.length]);

  const handleToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      await bulkAssign({ id: shift.id, employeeIds: selectedIds }).unwrap();
      toast.success(`Successfully assigned ${selectedIds.length} employees to ${shift.shiftName}`);
      onClose();
    } catch (error) {
      toast.error("Failed to assign employees");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-base font-bold text-gray-900">
            Assign Employees – {shift?.shiftName}
          </DialogTitle>
          <p className="text-[11px] text-gray-500 mt-1 uppercase font-bold tracking-wider">
            Select employees to move into this shift
          </p>
        </DialogHeader>

        <div className="px-6 py-4 flex-1 flex flex-col min-h-0">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              placeholder="Search by name or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 font-medium"
            />
          </div>

          {/* Employee list */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {isLoadingEmps ? (
              <div className="text-center py-10 text-gray-400 text-xs">Loading employees...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">No employees found</div>
            ) : (
              filtered.map((emp) => {
                const isSelected = selectedIds.includes(emp.id);
                return (
                  <div 
                    key={emp.id}
                    onClick={() => handleToggle(emp.id)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected 
                        ? "bg-blue-50/50 border-blue-100" 
                        : "hover:bg-gray-50 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-500"
                        }`}>
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 leading-tight">
                                {emp.firstName} {emp.lastName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">{emp.empCode || "No Code"}</p>
                                <Separator orientation="vertical" className="h-2 bg-gray-200" />
                                <p className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                                    String(emp.shiftId) === String(shift?.id)
                                        ? "bg-blue-50 text-blue-600 border-blue-100"
                                        : "bg-gray-50 text-gray-400 border-gray-100"
                                }`}>
                                    {shiftsList.find(s => String(s.id) === String(emp.shiftId))?.shiftName || "No Shift"}
                                </p>
                            </div>
                        </div>
                    </div>
                    {isSelected && (
                      <div className="bg-blue-600 p-1 rounded-full text-white">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {selectedIds.length} Selected
            </span>
            <div className="flex gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isAssigning}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#4f46e5' }}
                >
                    {isAssigning ? "Saving..." : "Apply Assignment"}
                </button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const ShiftSettings = () => {
  const [weeklyOff, setWeeklyOff]  = useState(["Sun"]);
  const [altOff,    setAltOff]     = useState("2nd & 4th Saturday");
  const [modalOpen, setModalOpen]  = useState(false);
  const [editShift, setEditShift]  = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [targetShift, setTargetShift] = useState(null);
  const [targetGlobalShiftId, setTargetGlobalShiftId] = useState("global");
  const [overrideShiftId, setOverrideShiftId] = useState("all");
  const [district,  setDistrict]   = useState("CHENNAI");
  const [currentDate]              = useState(new Date());

  const { data: hrSettingsData, isLoading: isSettingsLoading } = useGetHrSettingsQuery();
  const [saveHrSettings, { isLoading: isSavingSettings }] = useSaveHrSettingsMutation();

  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);
  const [autoCloseTime, setAutoCloseTime] = useState("10:00");

  const { data: shiftsData, isLoading } = useGetShiftsQuery();
  const shifts = shiftsData?.data || [];

  useEffect(() => {
    if (hrSettingsData?.data) {
        if (hrSettingsData.data.ATTENDANCE_AUTO_CLOSE_ENABLED) {
            setAutoCloseEnabled(hrSettingsData.data.ATTENDANCE_AUTO_CLOSE_ENABLED.value);
        }
        if (hrSettingsData.data.ATTENDANCE_AUTO_CLOSE_TIME) {
            setAutoCloseTime(hrSettingsData.data.ATTENDANCE_AUTO_CLOSE_TIME.value);
        }
    }
  }, [hrSettingsData]);

  useEffect(() => {
    // If Global is selected
    if (targetGlobalShiftId === "global") {
        if (hrSettingsData?.data?.GLOBAL_WEEKLY_OFF) {
            const dbSettings = hrSettingsData.data.GLOBAL_WEEKLY_OFF;
            if (dbSettings.days) setWeeklyOff(dbSettings.days);
            if (dbSettings.alt) setAltOff(dbSettings.alt);
        }
    } else {
        // If a specific shift is selected
        const selectedShift = shifts.find(s => String(s.id) === String(targetGlobalShiftId));
        if (selectedShift) {
            setWeeklyOff(selectedShift.weeklyOffDays || []);
            setAltOff(selectedShift.altWeeklyOff || "None");
        }
    }
  }, [hrSettingsData, targetGlobalShiftId, shifts]);

  const { data: weeklyData } = useGetWeeklyOffQuery({
    region: district,
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    shiftId: overrideShiftId === "all" ? null : overrideShiftId
  });

  const [createShift] = useCreateShiftMutation();
  const [updateShift] = useUpdateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  const toggleDay = (day) => {
    setWeeklyOff((prev) => {
      const isCurrentlyIn = prev.includes(day);
      const next = isCurrentlyIn ? prev.filter((d) => d !== day) : [...prev, day];
      
      // Smart Sync: If turning Saturday OFF, reset dropdown to None
      if (day === "Sat" && isCurrentlyIn) {
          setAltOff("None");
      }
      return next;
    });
  };

  const handleAltOffChange = (val) => {
      setAltOff(val);
      // Smart Sync: If selecting All Saturdays, force the Saturday toggle ON
      if (val === "All Saturdays") {
          setWeeklyOff(prev => prev.includes("Sat") ? prev : [...prev, "Sat"]);
      } 
      // Smart Sync: If selecting a specific pattern (2nd, 4th etc), make sure main Saturday toggle is OFF 
      // so it doesn't overlap and show "Full Off" on all Saturdays
      else if (val !== "None") {
          setWeeklyOff(prev => prev.filter(d => d !== "Sat"));
      }
  };

  const handleSaveShift = async (form) => {
    try {
      // 🔹 Sanitize form: Remove internal metadata that can't be updated
      const { id, createdAt, updatedAt, ...cleanForm } = form;

      if (editShift?.id) {
        await updateShift({ id: editShift.id, ...cleanForm }).unwrap();
        toast.success("Shift updated");
      } else {
        await createShift(cleanForm).unwrap();
        toast.success("Shift created");
      }
      setModalOpen(false);
      setEditShift(null);
    } catch {
      toast.error("Failed to save shift");
    }
  };

  const handleDelete = (id) => {
    toast.error("Confirm Deletion", {
      description: "Are you sure you want to delete this shift? This action cannot be undone.",
      duration: 5000,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteShift(id).unwrap();
            toast.success("Shift deleted");
          } catch {
            toast.error("Failed to delete shift");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  const handleSaveGlobalSettings = async () => {
    try {
      if (targetGlobalShiftId === "global") {
        await saveHrSettings({
          GLOBAL_WEEKLY_OFF: { days: weeklyOff, alt: altOff }
        }).unwrap();
        toast.success("Global Weekly Off Settings saved successfully!");
      } else {
        await updateShift({ 
          id: Number(targetGlobalShiftId), 
          weeklyOffDays: weeklyOff, 
          altWeeklyOff: altOff 
        }).unwrap();
        toast.success("Shift-specific Weekly Off saved successfully!");
      }
    } catch (e) {
      toast.error("Failed to save settings");
    }
  };

  const handleSaveAutomationSettings = async () => {
    try {
      await saveHrSettings({
        ATTENDANCE_AUTO_CLOSE_ENABLED: { value: autoCloseEnabled },
        ATTENDANCE_AUTO_CLOSE_TIME: { value: autoCloseTime }
      }).unwrap();
      toast.success("Attendance Automation settings saved!");
    } catch (e) {
      toast.error("Failed to save automation settings");
    }
  };


  return (
    <div className=" bg-slate-50 dark:bg-slate-800 from-slate-50 to-indigo-50/30 p-6 space-y-6">



      {/* ── Card 1: Global Weekly Off ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Weekly Off Pattern Manager</h2>
            <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configure For:</label>
                <select 
                    value={targetGlobalShiftId}
                    onChange={(e) => setTargetGlobalShiftId(e.target.value)}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/30 text-blue-600"
                >
                    <option value="global">🌍 Global Default</option>
                    {shifts.map(s => (
                        <option key={s.id} value={s.id}>✨ {s.shiftName}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {DAYS.map((d) => {
            const active = weeklyOff.includes(d.key);
            return (
              <button
                key={d.key}
                onClick={() => toggleDay(d.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  active
                    ? "shadow-md shadow-blue-200"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
                style={active ? { backgroundColor: '#4f46e5', color: 'white', borderColor: '#4f46e5' } : {}}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alternate Weekly Off</label>
            <select
              value={altOff}
              onChange={(e) => handleAltOffChange(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[200px]"
            >
              {ALT_OFF_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <button 
            onClick={handleSaveGlobalSettings}
            disabled={isSavingSettings}
            className={`mt-5 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-md ${isSavingSettings ? 'opacity-70' : ''}`}
            style={{ backgroundColor: '#4f46e5', color: 'white' }}
          >
            <Save size={16} />
            {isSavingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="mt-5 flex gap-1.5">
          {DAYS.map((d) => {
            const isToggled = weeklyOff.includes(d.key);
            const isAltSat = d.key === "Sat" && altOff !== "None";
            const active = isToggled || isAltSat;
            const subLabel = isToggled ? "OFF" : (isAltSat ? (altOff === "All Saturdays" ? "OFF" : "ALT") : "");

            return (
              <div
                key={d.key}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-bold transition-all ${
                  active ? "" : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}
                style={active ? { backgroundColor: '#4f46e5', color: 'white' } : {}}
              >
                {d.key}
                {active && <div className="text-[8px] font-normal mt-0.5 opacity-80">{subLabel}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Card 1.1: Attendance Automation ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                    <Zap className="text-blue-600" size={18} />
                </div>
                <div>
                    <h2 className="text-base font-bold text-gray-800">Attendance Automation</h2>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                        Configure automatic daily closure (absence marking)
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${autoCloseEnabled ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"}`}>
                    {autoCloseEnabled ? "Auto-Close Active" : "Disabled"}
                </span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Enable JIT Automation</label>
                <div 
                    onClick={() => setAutoCloseEnabled(!autoCloseEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${autoCloseEnabled ? "bg-blue-600 shadow-inner" : "bg-gray-200"}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${autoCloseEnabled ? "left-7" : "left-1"}`} />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Daily Cutoff Time</label>
                <div className="relative group">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input 
                        type="time"
                        value={autoCloseTime}
                        onChange={(e) => setAutoCloseTime(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                    />
                </div>
            </div>

            <div className="flex gap-3">
                <button 
                    onClick={handleSaveAutomationSettings}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                    style={{ backgroundColor: '#4f46e5' }}
                >
                    <Save size={14} /> Save Configuration
                </button>
            </div>
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <div className="p-1 px-2 bg-amber-100 text-amber-700 rounded-lg flex items-center h-fit mt-0.5">
                <Info size={14} />
            </div>
            <p className="text-[11px] font-medium text-amber-800/80 leading-relaxed">
                <strong className="block text-amber-900 mb-0.5 font-bold uppercase tracking-tighter">Just-In-Time Automation</strong>
                If enabled, the system will automatically mark absences for the previous day when the first user loads the attendance list after the specified "Cutoff Time". 
                This ensures biometric data from overnight shifts has sufficient time to synchronize.
            </p>
        </div>
      </div>

      {/* ── Card 1.5: Regional Overrides & Alerts ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-orange-50 rounded-xl">
                    <Sun className="text-orange-500" size={18} />
                 </div>
                 <div>
                    <h2 className="text-base font-bold text-gray-800">Calendar Overrides</h2>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                        {overrideShiftId === "all" ? "Global" : shifts.find(s => String(s.id) === String(overrideShiftId))?.shiftName} • {currentDate.toLocaleString('default', { month: 'long' })}
                    </p>
                 </div>
             </div>
             
             <div className="flex gap-2">
                <select 
                    value={overrideShiftId} 
                    onChange={(e) => setOverrideShiftId(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                    <option value="all">🌍 All Shifts</option>
                    {shifts.map(s => (
                        <option key={s.id} value={s.id}>{s.shiftName}</option>
                    ))}
                </select>

                <select 
                    value={district} 
                    onChange={(e) => setDistrict(e.target.value)}
                    className="hidden border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                    <option value="CHENNAI">Chennai</option>
                    <option value="BANGALORE">Bangalore</option>
                    <option value="COIMBATORE">Coimbatore</option>
                </select>
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {weeklyData?.result?.length > 0 ? (
                weeklyData.result.map((off, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between shadow-sm transition-all hover:translate-y-[-2px]
                        ${off.type === 'Partial' ? 'bg-amber-50/50 border-amber-100' : 
                          off.type === 'Working' ? 'bg-blue-50/50 border-blue-100' : 
                          'bg-emerald-50/50 border-emerald-100'}
                    `}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center
                                ${off.type === 'Partial' ? 'bg-amber-100 text-amber-700' : 
                                  off.type === 'Working' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-emerald-100 text-emerald-700'}
                            `}>
                                <span className="text-[9px] font-black uppercase">{new Date(off.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-sm font-bold leading-none">{new Date(off.date).getDate()}</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 uppercase tracking-tighter">
                                    {off.type === 'Partial' ? 'Partial Off' : 
                                     off.type === 'Working' ? 'Full Working' : 'Full Off'}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium">{new Date(off.date).toLocaleString('default', { weekday: 'long' })}</p>
                            </div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                            off.type === 'Partial' ? 'bg-amber-400' : 
                            off.type === 'Working' ? 'bg-blue-400' : 'bg-emerald-400'
                        } animate-pulse`} />
                    </div>
                ))
            ) : (
                <div className="col-span-full py-6 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center gap-2">
                    <Zap className="text-gray-300" size={24} />
                    <p className="text-xs text-gray-400 font-medium italic">No calendar overrides configured for this month.</p>
                </div>
            )}
        </div>
      </div>

      {/* ── Card 2: Shift Management ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div>
            <h2 className="text-base font-bold text-gray-800">Shift Management</h2>
            <p className="text-xs text-gray-400 mt-0.5">{shifts.length} shifts configured</p>
          </div>
          <button
            onClick={() => { setEditShift(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#4f46e5', color: 'white' }}
          >
            <Plus size={16} />
            Add Shift
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Shift Name</th>
                <th className="px-5 py-3 text-left">Timings</th>
                <th className="px-5 py-3 text-center">Weekend Pattern</th>
                <th className="px-5 py-3 text-center">Grace</th>
                <th className="px-5 py-3 text-center">Full/Half</th>
                <th className="px-5 py-3 text-center">Type</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Loading shifts…
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && shifts.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-gray-400 italic">
                    No shifts configured yet. Click "+ Add Shift" to get started.
                  </td>
                </tr>
              )}
              {!isLoading && shifts.map((shift) => {
                const meta = TYPE_META[shift.type] || TYPE_META.Regular;
                const TypeIcon = meta.Icon;
                return (
                  <tr key={shift.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <Clock size={14} className="text-blue-500" />
                        </div>
                        <div>
                           <p className="font-semibold text-gray-800 leading-none">{shift.shiftName}</p>
                           <p className="text-[10px] text-gray-400 mt-1.5 font-mono">{shift.firstPunch} - {shift.lastPunch}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{shift.timings || "—"}</td>
                    <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                            <div className="flex gap-0.5">
                                {DAYS.map(d => (
                                    <div key={d.key} className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black
                                        ${(shift.weeklyOffDays || []).includes(d.key) ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}
                                    `}>
                                        {d.key[0]}
                                    </div>
                                ))}
                            </div>
                            {shift.altWeeklyOff && shift.altWeeklyOff !== "None" && (
                                <span className="text-[9px] text-blue-500 font-bold mt-1 px-1.5 py-0.5 bg-blue-50 rounded border border-blue-100 lowercase">
                                    {shift.altWeeklyOff}
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-5 py-4 text-center text-gray-600 font-medium">{shift.gracePeriod}m</td>
                    <td className="px-5 py-4 text-center text-gray-600 font-medium">{shift.minFullDayHours}/{shift.minHalfDayHours}h</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${meta.cls}`}>
                        <TypeIcon size={10} />
                        {shift.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditShift(shift); setModalOpen(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(shift.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                          <button 
                            onClick={() => { setTargetShift(shift); setBulkModalOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors" 
                            title="Assign to employees"
                          >
                            <Users size={14} />
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculation Reference */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Status Calculation Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {[
            { icon: "✅", label: "Present",  rule: "Worked ≥ Full Day Hours", cls: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { icon: "🟡", label: "Half Day", rule: "Full Day > Worked ≥ Half Day Hours", cls: "bg-yellow-50 border-yellow-200 text-yellow-700" },
            { icon: "❌", label: "Absent",   rule: "No check-in recorded", cls: "bg-red-50 border-red-200 text-red-700" },
          ].map((r) => (
            <div key={r.label} className={`border rounded-xl px-4 py-3 ${r.cls}`}>
              <div className="font-bold mb-1">{r.icon} {r.label}</div>
              <div className="opacity-80">{r.rule}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-500 bg-gray-50 rounded-xl p-4">
          <div><span className="font-semibold text-gray-700">Work Hours:</span> Total Hours = Check-out − Check-in</div>
          <div><span className="font-semibold text-gray-700">Late Arrival:</span> Late Mins = Check-in − (Shift Start + Grace Period)</div>
        </div>
      </div>

      <ShiftModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditShift(null); }}
        initial={editShift}
        onSave={handleSaveShift}
      />

      <BulkAssignModal
        open={bulkModalOpen}
        onClose={() => { setBulkModalOpen(false); setTargetShift(null); }}
        shift={targetShift}
      />
    </div>
  );
};
