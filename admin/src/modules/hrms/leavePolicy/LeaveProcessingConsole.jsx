import React, { useEffect, useState } from "react";
import {
  Calendar,
  RotateCcw,
  Play,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Settings2,
  ChevronRight,
  Loader2,
  Trash2,
  Bot,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  useGetLeaveCycleQuery,
  useSetLeaveCycleMutation,
  useGetLeaveProcessingHistoryQuery,
  useLazyPreviewMonthlyAccrualQuery,
  useApplyMonthlyAccrualMutation,
  useLazyPreviewYearlyRolloverQuery,
  useApplyYearlyRolloverMutation,
  useDeleteProcessingHistoryMutation,
  useGetAutomationSettingsQuery,
  useUpdateAutomationSettingsMutation,
  useGetAutomationStatusQuery,
  useEnableAutomationMutation,
  useDisableAutomationMutation,
  useGetLeaveProcessingLocksQuery,
} from "@/services/hrms/leaveProcessor.api";

const CYCLE_OPTIONS = [
  {
    value: "CALENDAR",
    label: "Calendar Year",
    sub: "January 1 – December 31",
    icon: "📅",
  },
  {
    value: "FINANCIAL",
    label: "Financial Year",
    sub: "April 1 – March 31",
    icon: "💼",
  },
];

const Badge = ({ label, color }) => {
  const colors = {
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    info: "bg-blue-100 text-blue-700",
    muted: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[color] ?? colors.muted}`}
    >
      {label}
    </span>
  );
};

const AutomationSegmentToggle = ({ enabled, onChange, disabled, name, globalPaused }) => {
  const isDisabled = disabled || globalPaused;
  return (
    <div className="inline-flex items-center gap-2">
      <label
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${isDisabled ? "" : "cursor-pointer"}`}
        style={{
          backgroundColor: enabled && !globalPaused ? "#059669" : "#e2e8f0",
          color: enabled && !globalPaused ? "#ffffff" : "#334155",
          border: enabled && !globalPaused ? "1px solid #047857" : "1px solid #94a3b8",
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <input
          type="radio"
          name={name}
          checked={enabled === true}
          onChange={() => !isDisabled && onChange(true)}
          disabled={isDisabled}
          className="h-3.5 w-3.5 accent-emerald-700"
        />
        <span className="text-[11px] font-bold">ON</span>
      </label>

      <label
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${isDisabled ? "" : "cursor-pointer"}`}
        style={{
          backgroundColor: !enabled && !globalPaused ? "#e11d48" : "#e2e8f0",
          color: !enabled && !globalPaused ? "#ffffff" : "#334155",
          border: !enabled && !globalPaused ? "1px solid #be123c" : "1px solid #94a3b8",
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <input
          type="radio"
          name={name}
          checked={enabled === false}
          onChange={() => !isDisabled && onChange(false)}
          disabled={isDisabled}
          className="h-3.5 w-3.5 accent-rose-700"
        />
        <span className="text-[11px] font-bold">OFF</span>
      </label>
    </div>
  );
};

const PreviewTable = ({ rows = [], type }) => {
  if (!rows.length)
    return (
      <p className="text-xs text-slate-400 italic py-4 text-center">
        No data to preview
      </p>
    );
  const cols =
    type === "accrual"
      ? ["Employee", "Leave", "Current", "Grant", "New Balance"]
      : ["Employee", "Leave", "Rule", "Remaining", "CF Amount", "Lapsed", "New Balance"];

  return (
    <div className="overflow-x-auto mt-3 rounded-xl border border-slate-100">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-400 uppercase font-bold tracking-widest text-[9px] border-b border-slate-100">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-4 py-2 text-left">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50/50">
          {rows.map((r, i) =>
            type === "accrual" ? (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2 font-bold text-slate-700">{r.employeeName}</td>
                <td className="px-4 py-2">
                  <span className="font-black text-blue-600">{r.leaveCode}</span>
                </td>
                <td className="px-4 py-2 text-slate-600">{r.currentBalance}</td>
                <td className="px-4 py-2 text-emerald-600 font-bold">+{r.accrualAmount}</td>
                <td className="px-4 py-2 font-bold text-slate-900">
                  {r.newBalance}
                  {r.capped && (
                    <span className="ml-1 text-[9px] text-amber-500 font-bold">(Capped)</span>
                  )}
                </td>
              </tr>
            ) : (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2 font-bold text-slate-700">{r.employeeName}</td>
                <td className="px-4 py-2 font-black text-blue-600">{r.leaveCode}</td>
                <td className="px-4 py-2">
                  <Badge
                    label={r.cfType}
                    color={
                      r.cfType === "FULL"
                        ? "success"
                        : r.cfType === "PARTIAL"
                        ? "warn"
                        : "muted"
                    }
                  />
                </td>
                <td className="px-4 py-2 text-slate-600">{r.remainingInOldYear}</td>
                <td className="px-4 py-2 text-emerald-600 font-bold">{r.carryForwardAmount}</td>
                <td className="px-4 py-2 text-rose-500 font-bold">{r.lapsedAmount}</td>
                <td className="px-4 py-2 font-bold text-slate-900">{r.newYearStartBalance}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};

export const LeaveProcessingConsole = () => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [rolloverFromYear, setRolloverFromYear] = useState(currentYear - 1);

  const [cycleConfirmOpen, setCycleConfirmOpen] = useState(false);
  const [pendingCycleValue, setPendingCycleValue] = useState(null);

  const [showAccrualPreview, setShowAccrualPreview] = useState(false);
  const [showRolloverPreview, setShowRolloverPreview] = useState(false);
  const [confirmAccrual, setConfirmAccrual] = useState(false);
  const [confirmRollover, setConfirmRollover] = useState(false);
  const [historyDeleteTarget, setHistoryDeleteTarget] = useState(null);
  const [manualDisableHours, setManualDisableHours] = useState(48);
  const [monthlyScheduleDay, setMonthlyScheduleDay] = useState(1);
  const [monthlyScheduleTime, setMonthlyScheduleTime] = useState("00:00");
  const [yearlyScheduleTime, setYearlyScheduleTime] = useState("00:00");
  const [permissionMonthlyLimit, setPermissionMonthlyLimit] = useState(4);

  const { data: cycleData } = useGetLeaveCycleQuery();
  const [setCycle, { isLoading: isSettingCycle }] = useSetLeaveCycleMutation();
  const { data: historyData, isLoading: isHistoryLoading } =
    useGetLeaveProcessingHistoryQuery();
  const [deleteHistory, { isLoading: isDeletingHistory }] = useDeleteProcessingHistoryMutation();

  const [triggerAccrualPreview, { data: accrualPreview, isFetching: isPreviewing }] =
    useLazyPreviewMonthlyAccrualQuery();
  const [applyAccrual, { isLoading: isApplyingAccrual }] = useApplyMonthlyAccrualMutation();

  const [triggerRolloverPreview, { data: rolloverPreview, isFetching: isPreviewingRollover }] =
    useLazyPreviewYearlyRolloverQuery();
  const [applyRollover, { isLoading: isApplyingRollover }] = useApplyYearlyRolloverMutation();
  const { data: automationSettingsData } = useGetAutomationSettingsQuery();
  const { data: automationStatusData, isFetching: isAutomationStatusFetching } =
    useGetAutomationStatusQuery(undefined, { pollingInterval: 30000 });
  const { data: lockStatusData } = useGetLeaveProcessingLocksQuery(undefined, {
    pollingInterval: 30000,
  });
  const [updateAutomationSettings, { isLoading: isUpdatingAutomation }] =
    useUpdateAutomationSettingsMutation();
  const [enableAutomation, { isLoading: isEnablingAutomation }] = useEnableAutomationMutation();
  const [disableAutomation, { isLoading: isDisablingAutomation }] = useDisableAutomationMutation();

  const cycleType = cycleData?.data?.cycleType || "CALENDAR";
  const history = historyData?.data || [];
  const automationSettings = automationSettingsData?.data || {};
  const automationStatus = automationStatusData?.data || {};
  const activeLocks = lockStatusData?.data || automationStatus.activeLocks || [];
  const disableUntilDate = automationStatus.disabledUntil
    ? new Date(automationStatus.disabledUntil)
    : null;
  const monthlyAutoEnabled =
    automationSettings.AUTO_MONTHLY_ACCRUAL_ENABLED?.value ??
    automationStatus.monthlyAccrual?.enabled ??
    false;
  const yearlyAutoEnabled =
    automationSettings.AUTO_YEARLY_ROLLOVER_ENABLED?.value ??
    automationStatus.yearlyRollover?.enabled ??
    false;

  useEffect(() => {
    const dayFromSettings =
      automationSettings.AUTO_MONTHLY_ACCRUAL_DAY?.value ??
      automationStatus.monthlyAccrual?.day ??
      1;
    const monthlyTimeFromSettings =
      automationSettings.AUTO_MONTHLY_ACCRUAL_TIME?.value ??
      automationStatus.monthlyAccrual?.time ??
      "00:00";
    const yearlyTimeFromSettings =
      automationSettings.AUTO_YEARLY_ROLLOVER_TIME?.value ??
      automationStatus.yearlyRollover?.time ??
      "00:00";

    setMonthlyScheduleDay(Number(dayFromSettings) || 1);
    setMonthlyScheduleTime(monthlyTimeFromSettings || "00:00");
    setYearlyScheduleTime(yearlyTimeFromSettings || "00:00");
    setPermissionMonthlyLimit(Number(automationSettings.PERMISSION_MONTHLY_LIMIT?.value ?? 4));
  }, [automationSettingsData, automationStatusData]);

  const handleToggleMonthlyAuto = async (enabled) => {
    try {
      await updateAutomationSettings({ AUTO_MONTHLY_ACCRUAL_ENABLED: { value: enabled } }).unwrap();
      toast.success(`Monthly automatic accrual ${enabled ? "enabled" : "disabled"}`);
    } catch (e) {
      toast.error("Failed to update monthly automation");
    }
  };

  const handleToggleYearlyAuto = async (enabled) => {
    try {
      await updateAutomationSettings({ AUTO_YEARLY_ROLLOVER_ENABLED: { value: enabled } }).unwrap();
      toast.success(`Yearly automatic rollover ${enabled ? "enabled" : "disabled"}`);
    } catch (e) {
      toast.error("Failed to update yearly automation");
    }
  };

  const handleSaveMonthlySchedule = async () => {
    const normalizedDay = Math.min(31, Math.max(1, Number(monthlyScheduleDay) || 1));
    if (!monthlyScheduleTime) {
      toast.error("Select monthly run time");
      return;
    }
    try {
      await updateAutomationSettings({
        AUTO_MONTHLY_ACCRUAL_DAY: { value: normalizedDay },
        AUTO_MONTHLY_ACCRUAL_TIME: { value: monthlyScheduleTime },
      }).unwrap();
      setMonthlyScheduleDay(normalizedDay);
      toast.success(`Monthly schedule saved: Day ${normalizedDay} at ${monthlyScheduleTime}`);
    } catch (e) {
      toast.error("Failed to save monthly schedule");
    }
  };

  const handleSaveYearlySchedule = async () => {
    if (!yearlyScheduleTime) {
      toast.error("Select yearly run time");
      return;
    }
    try {
      await updateAutomationSettings({
        AUTO_YEARLY_ROLLOVER_TIME: { value: yearlyScheduleTime },
      }).unwrap();
      toast.success(`Yearly schedule time saved: ${yearlyScheduleTime}`);
    } catch (e) {
      toast.error("Failed to save yearly schedule");
    }
  };

  const handleSavePermissionLimit = async () => {
    const limit = Math.max(1, Number(permissionMonthlyLimit) || 1);
    try {
      await updateAutomationSettings({
        PERMISSION_MONTHLY_LIMIT: { value: limit },
      }).unwrap();
      setPermissionMonthlyLimit(limit);
      toast.success(`Permission monthly limit updated to ${limit}h`);
    } catch (e) {
      toast.error("Failed to update permission limit");
    }
  };

  const handleEnableAllAutomation = async () => {
    try {
      await enableAutomation().unwrap();
      toast.success("Automatic processing enabled");
    } catch (e) {
      toast.error(e?.data?.message || "Failed to enable automation");
    }
  };

  const handleDisableAllAutomation = async () => {
    try {
      await disableAutomation({ hours: Number(manualDisableHours) || 48 }).unwrap();
      toast.success(`Automation disabled for ${manualDisableHours} hours`);
    } catch (e) {
      toast.error(e?.data?.message || "Failed to disable automation");
    }
  };

  const handleCycleChange = (val) => {
    if (val === cycleType) return;
    setPendingCycleValue(val);
    setCycleConfirmOpen(true);
  };

  const executeCycleChange = async () => {
    try {
      await setCycle({ cycleType: pendingCycleValue }).unwrap();
      toast.success(
        `Leave cycle changed to ${pendingCycleValue === "CALENDAR" ? "Calendar Year" : "Financial Year"}`
      );
      setCycleConfirmOpen(false);
    } catch (e) {
      toast.error("Failed to update cycle");
      setCycleConfirmOpen(false);
    }
  };

  const handlePreviewAccrual = async () => {
    await triggerAccrualPreview({ month: selectedMonth, year: selectedYear });
    setShowAccrualPreview(true);
  };

  const handleApplyAccrual = async () => {
    try {
      const result = await applyAccrual({ month: selectedMonth, year: selectedYear }).unwrap();
      toast.success(
        `✅ Accrual applied for ${selectedYear}-${String(selectedMonth).padStart(2, "0")}. 
         ${result.data?.employeesAffected} employees updated with ${result.data?.totalLeavesGranted} total days.`
      );
      setShowAccrualPreview(false);
      setConfirmAccrual(false);
    } catch (e) {
      toast.error(e?.data?.message || "Accrual failed");
      setConfirmAccrual(false);
    }
  };

  const handlePreviewRollover = async () => {
    await triggerRolloverPreview({ fromYear: rolloverFromYear });
    setShowRolloverPreview(true);
  };

  const handleApplyRollover = async () => {
    try {
      const result = await applyRollover({ fromYear: rolloverFromYear }).unwrap();
      toast.success(
        `✅ Year-end rollover applied: ${result.data?.totalCarriedForward} days carried forward, ${result.data?.totalLapsedLeaves} days lapsed.`
      );
      setShowRolloverPreview(false);
      setConfirmRollover(false);
    } catch (e) {
      toast.error(e?.data?.message || "Rollover failed");
      setConfirmRollover(false);
    }
  };

  const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="space-y-6">

      {/* ── Section 1: Leave Cycle Setting ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
          <Settings2 size={16} className="text-blue-500" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
            Leave Year Cycle
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CYCLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleCycleChange(opt.value)}
              disabled={isSettingCycle}
              className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                cycleType === opt.value
                  ? "border-blue-500 bg-blue-50/40 shadow-md"
                  : "border-slate-100 hover:border-blue-200 hover:bg-slate-50/50"
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1">
                <p className={`font-bold text-sm ${cycleType === opt.value ? "text-blue-700" : "text-slate-700"}`}>
                  {opt.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{opt.sub}</p>
              </div>
              {cycleType === opt.value && (
                <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 2: Automation Controls ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-violet-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
              Automatic Processing
            </h3>
          </div>
          <Badge
            label={automationStatus.enabled ? "Automation Active" : "Automation Paused"}
            color={automationStatus.enabled ? "success" : "warn"}
          />
        </div>
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Configure monthly accrual and yearly rollover automation. Manual runs still work and
            can temporarily pause automatic processing based on backend rules.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Monthly Accrual Auto-Run</p>
                <p className="text-[11px] text-slate-400">
                  Day {automationStatus.monthlyAccrual?.day || 1} at{" "}
                  {automationStatus.monthlyAccrual?.time || "00:00"}
                </p>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Day
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={monthlyScheduleDay}
                      onChange={(e) => setMonthlyScheduleDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-400 w-16"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={monthlyScheduleTime}
                      onChange={(e) => setMonthlyScheduleTime(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-[10px] font-bold"
                    onClick={handleSaveMonthlySchedule}
                    disabled={isUpdatingAutomation}
                  >
                    Save
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AutomationSegmentToggle
                  enabled={monthlyAutoEnabled}
                  onChange={handleToggleMonthlyAuto}
                  disabled={isUpdatingAutomation}
                  globalPaused={!automationStatus.enabled}
                  name="monthly-automation-toggle"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-[10px] font-bold"
                  onClick={() => handleToggleMonthlyAuto(!monthlyAutoEnabled)}
                  disabled={isUpdatingAutomation}
                >
                  {monthlyAutoEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>

            <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Year-End Rollover Auto-Run</p>
                <p className="text-[11px] text-slate-400">
                  At {automationStatus.yearlyRollover?.time || "00:00"} on cycle year boundary
                </p>
                <div className="flex items-end gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={yearlyScheduleTime}
                      onChange={(e) => setYearlyScheduleTime(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-[10px] font-bold"
                    onClick={handleSaveYearlySchedule}
                    disabled={isUpdatingAutomation}
                  >
                    Save
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AutomationSegmentToggle
                  enabled={yearlyAutoEnabled}
                  onChange={handleToggleYearlyAuto}
                  disabled={isUpdatingAutomation}
                  globalPaused={!automationStatus.enabled}
                  name="yearly-automation-toggle"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-[10px] font-bold"
                  onClick={() => handleToggleYearlyAuto(!yearlyAutoEnabled)}
                  disabled={isUpdatingAutomation}
                >
                  {yearlyAutoEnabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Pause Hours
              </label>
              <input
                type="number"
                min={1}
                value={manualDisableHours}
                onChange={(e) => setManualDisableHours(Math.max(1, Number(e.target.value) || 1))}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/30 w-28"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Permission Limit (Monthly)
              </label>
              <div className="flex gap-1.5">
                <input
                    type="number"
                    min={1}
                    value={permissionMonthlyLimit}
                    onChange={(e) => setPermissionMonthlyLimit(Math.max(1, Number(e.target.value) || 1))}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50/30 w-24"
                />
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSavePermissionLimit}
                    disabled={isUpdatingAutomation}
                    className="h-10 px-3 text-[10px] font-bold rounded-xl"
                >
                    Save
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleDisableAllAutomation}
              disabled={isDisablingAutomation || !automationStatus.enabled}
              className={`gap-1.5 rounded-xl text-xs font-bold ${
                automationStatus.enabled
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isDisablingAutomation ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
              Pause Automation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableAllAutomation}
              disabled={isEnablingAutomation || automationStatus.enabled}
              className={`gap-1.5 rounded-xl text-xs font-bold ${
                !automationStatus.enabled
                  ? ""
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isEnablingAutomation ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
              Re-Enable
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/30">
              <p className="text-slate-400">Consecutive Failures</p>
              <p className="font-black text-slate-700">{automationStatus.consecutiveFailures ?? 0}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/30">
              <p className="text-slate-400">Temporarily Disabled Until</p>
              <p className="font-black text-slate-700">
                {disableUntilDate ? disableUntilDate.toLocaleString() : "Not disabled"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/30">
              <p className="text-slate-400">Status Refresh</p>
              <p className="font-black text-slate-700">
                {isAutomationStatusFetching ? "Refreshing..." : "Every 30s"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Lock size={13} className="text-slate-500" />
              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Active Processing Locks
              </p>
            </div>
            {activeLocks.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No active locks</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {activeLocks.map((lock, index) => (
                  <div key={`${lock.lockType}-${lock.period}-${index}`} className="px-4 py-3 text-xs">
                    <p className="font-bold text-slate-700">
                      {lock.lockType} - {lock.period}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      {lock.lockedBy} | {lock.isAutomatic ? "Automatic" : "Manual"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 2: Monthly Accrual ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-emerald-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
              Monthly Accrual
            </h3>
          </div>
          <Badge label="Manual Trigger Required" color="warn" />
        </div>
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Run this each month to grant leave accruals to all employees based on their
            leave policy settings. Each period can only be run once.
          </p>

          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(Number(e.target.value)); setShowAccrualPreview(false); }}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/30"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); setShowAccrualPreview(false); }}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50/30"
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            {/* ✅ Last Run Indicator */}
            {(() => {
                const lastRun = history.find(h => 
                    h.processType === "MONTHLY_ACCRUAL" && 
                    h.period === `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`
                );
                if (!lastRun) return null;
                return (
                    <div className="bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl flex items-center gap-2 mb-0.5">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <div>
                            <p className="text-[9px] font-extrabold uppercase text-emerald-600 leading-none">Last Run Completed</p>
                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">{new Date(lastRun.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                );
            })()}

            <div className="flex gap-2 items-end pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewAccrual}
                disabled={isPreviewing}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                {isPreviewing ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                Preview
              </Button>
              {showAccrualPreview && !confirmAccrual && (
                <Button
                  size="sm"
                  onClick={() => setConfirmAccrual(true)}
                  className="gap-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play size={12} /> Run Accrual
                </Button>
              )}
            </div>
          </div>

          {/* Accrual Preview Result */}
          {showAccrualPreview && accrualPreview?.data && (
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-xs">
                  <span><span className="font-bold text-slate-700">{accrualPreview.data.employeeCount}</span> <span className="text-slate-400">Employees</span></span>
                  <span><span className="font-bold text-slate-700">{accrualPreview.data.leaveTypeCount}</span> <span className="text-slate-400">Leave Types</span></span>
                  <span className="text-slate-400">Cycle: <span className="font-bold text-blue-600">{accrualPreview.data.cycleType}</span></span>
                </div>
              </div>
              <PreviewTable rows={accrualPreview.data.preview?.slice(0, 20)} type="accrual" />
            </div>
          )}

          {/* Confirmation */}
          {confirmAccrual && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">Confirm Accrual Run</p>
                <p className="text-[11px] text-amber-600 mt-0.5">
                  This will grant leave accruals to all employees for{" "}
                  <strong>{MONTHS[selectedMonth - 1]} {selectedYear}</strong>. This action cannot be undone.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setConfirmAccrual(false)} className="text-xs rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyAccrual}
                    disabled={isApplyingAccrual}
                    className="text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {isApplyingAccrual ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Yes, Run Accrual
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Year-End Rollover ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw size={16} className="text-rose-500" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
              Year-End Rollover
            </h3>
          </div>
          <Badge label="Admin Only" color="info" />
        </div>
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-400 leading-relaxed">
            Run this at the end of the leave cycle year to reset balances. Balances will be
            carried forward or lapsed according to each leave type's policy settings.
          </p>

          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From Year</label>
              <select
                value={rolloverFromYear}
                onChange={(e) => { setRolloverFromYear(Number(e.target.value)); setShowRolloverPreview(false); }}
                className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-400 bg-slate-50/30"
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            {/* ✅ Last Run Indicator */}
            {(() => {
                const lastRun = history.find(h => 
                    h.processType === "YEARLY_ROLLOVER" && 
                    h.period === rolloverFromYear.toString()
                );
                if (!lastRun) return null;
                return (
                    <div className="bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl flex items-center gap-2 mb-0.5">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <div>
                            <p className="text-[9px] font-extrabold uppercase text-emerald-600 leading-none">Last Run Completed</p>
                            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">{new Date(lastRun.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                );
            })()}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewRollover}
                disabled={isPreviewingRollover}
                className="gap-1.5 rounded-xl text-xs font-bold"
              >
                {isPreviewingRollover ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                Preview
              </Button>
              {showRolloverPreview && !confirmRollover && (
                <Button
                  size="sm"
                  onClick={() => setConfirmRollover(true)}
                  className="gap-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Play size={12} /> Run Rollover
                </Button>
              )}
            </div>
          </div>

          {showRolloverPreview && rolloverPreview?.data && (
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex gap-5 text-xs">
                <span><span className="font-bold text-emerald-600">{rolloverPreview.data.totalCarriedForward}</span> <span className="text-slate-400">days to carry forward</span></span>
                <span><span className="font-bold text-rose-500">{rolloverPreview.data.totalLapsed}</span> <span className="text-slate-400">days to lapse</span></span>
                <span className="text-slate-400">To Year: <span className="font-bold text-blue-600">{rolloverFromYear + 1}</span></span>
              </div>
              <PreviewTable rows={rolloverPreview.data.preview?.slice(0, 20)} type="rollover" />
            </div>
          )}

          {confirmRollover && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-200 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-800">Confirm Year-End Rollover</p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  This will close the <strong>{rolloverFromYear}</strong> leave year and set new
                  starting balances for <strong>{rolloverFromYear + 1}</strong>. This cannot be undone.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setConfirmRollover(false)} className="text-xs rounded-xl">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApplyRollover}
                    disabled={isApplyingRollover}
                    className="text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                  >
                    {isApplyingRollover ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Yes, Run Rollover
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: Processing History ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
          <History size={16} className="text-slate-400" />
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
            Processing History
          </h3>
        </div>
        <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
          {isHistoryLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <Clock size={20} className="mx-auto mb-2 opacity-30" />
              No processing runs recorded yet.
            </div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  h.processType === "MONTHLY_ACCRUAL" ? "bg-emerald-100" : "bg-rose-100"
                }`}>
                  {h.processType === "MONTHLY_ACCRUAL"
                    ? <Calendar size={14} className="text-emerald-600" />
                    : <RotateCcw size={14} className="text-rose-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700">
                    {h.processType === "MONTHLY_ACCRUAL" ? "Monthly Accrual" : "Year-End Rollover"} — {h.period}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {h.employeesAffected} employees &middot; By: {h.performedByName || "System"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {h.processType === "MONTHLY_ACCRUAL" ? (
                    <span className="text-[11px] font-bold text-emerald-600">+{h.totalLeavesGranted} days</span>
                  ) : (
                    <span className="text-[11px] font-bold text-rose-500">{h.totalLapsedLeaves} lapsed</span>
                  )}
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-xl"
                    onClick={() => setHistoryDeleteTarget(h)}
                >
                    <Trash2 size={14} />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Cycle Change Confirmation Modal ── */}
      {cycleConfirmOpen && (
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 animate-in fade-in duration-300 z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
                <AlertTriangle size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Confirm Cycle Change
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  Changing the Leave Year Cycle will immediately re-map all employee balances 
                  to the new year boundaries. This affects dashboards, reports, and future accruals for all staff.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                    variant="outline" 
                    className="flex-1 rounded-2xl font-bold text-xs py-5"
                    onClick={() => setCycleConfirmOpen(false)}
                >
                  No, Cancel
                </Button>
                <Button 
                    className="flex-1 rounded-2xl font-bold text-xs py-5 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
                    onClick={executeCycleChange}
                    disabled={isSettingCycle}
                >
                  {isSettingCycle ? "Processing..." : "Yes, Proceed"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyDeleteTarget && (
        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4 animate-in fade-in duration-300 z-[9999] bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 tracking-tight">
                  Delete History Record
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  This will remove the selected processing entry and allow re-running that period.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl font-bold text-xs py-5"
                  onClick={() => setHistoryDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-2xl font-bold text-xs py-5 bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={isDeletingHistory}
                  onClick={async () => {
                    try {
                      await deleteHistory(historyDeleteTarget.id).unwrap();
                      toast.success("History record removed");
                      setHistoryDeleteTarget(null);
                    } catch (e) {
                      toast.error("Failed to delete record");
                    }
                  }}
                >
                  {isDeletingHistory ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
