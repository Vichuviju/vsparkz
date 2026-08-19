import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Settings, Calendar, Save, Info, AlertCircle,
  Clock, ArrowRightLeft, Plus, Pencil, Trash2, X,
  CheckCircle2, ChevronLeft, AlertTriangle, User, History
} from 'lucide-react';
import { Button } from "@/components/ui/button"
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useCreateLeaveConfigMutation, useGetLeaveConfigsQuery, useUpdateLeaveConfigMutation, useDeleteLeaveConfigMutation } from "@/services/hrms/leaveConfig.api"
import { useGetAllLeaveBalancesQuery, useAdjustLeaveBalanceMutation } from "@/services/hrms/leaves.api";
import { LeaveProcessingConsole } from "./LeaveProcessingConsole";
import {
    Dialog,

    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input as UiInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── helpers ─── */
const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_POLICY = {
  leaveName: '', leaveCode: '', isPaid: true,
  annualAllocation: 0, accrualRate: 0, enableAccrual: false,
  monthlyCarryForward: false, monthlyLapse: false,
  cfType: 'NONE', cfLimit: 0, maxAccumulation: 0,
  allowNegative: false, lopAfterLimit: true,
  effectiveDate: new Date().toISOString().split('T')[0],
};

/* ─── sub-components ─── */
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const Toggle = ({ on, onChange, accent = '#6366f1' }) => (
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={onChange}
  className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:ring-2 focus:ring-offset-1 ${
    on ? "" : "bg-slate-200"
  }`}
  style={{ background: on ? accent : undefined }}
>
  <span
    style={{ transform: on ? 'translateX(1.375rem)' : 'translateX(0.125rem)' }}
    className="inline-block w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
  />
</Button>

);

const Chip = ({ on, label }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${on ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-500'}`}>
    {label}
  </span>
);

const CodeBadge = ({ code }) => {
  const colors = {
    EL: ['#eef2ff','#4f46e5'], SL: ['#ecfdf5','#059669'], CL: ['#fffbeb','#d97706'],
  };
  const [bg, fg] = colors[code] ?? ['#f1f5f9','#475569'];
  return (
    <span style={{ background: bg, color: fg }} className="inline-flex items-center justify-center h-11 w-11 rounded-xl text-sm font-extrabold tracking-tight shrink-0">
      {code}
    </span>
  );
};

const Toast = ({ show }) => (
  <div
    style={{
      opacity: show ? 1 : 0,
      transform: show ? 'translateY(0)' : 'translateY(1.5rem)',
      pointerEvents: show ? 'all' : 'none',
      transition: 'all 0.3s cubic-bezier(.22,1,.36,1)',
    }}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold"
  >
    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
    Policy saved successfully
  </div>
);

const ConfirmDialog = ({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
}) => (
  <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-slate-900/60 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-100 rounded-xl"><AlertTriangle size={20} className="text-rose-600" /></div>
        <p className="text-sm text-slate-700 font-medium pt-1.5">{message}</p>
      </div>
      <div className="flex gap-3 justify-end">
        <Button
            variant="ghost"
            onClick={onCancel}
            >
            {cancelLabel}
        </Button>
        <Button
            variant={confirmVariant}
            onClick={onConfirm}
            >
            {confirmLabel}
        </Button>
      </div>
    </div>
  </div>
);

/* ─── field wrappers ─── */
const Field = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-400 italic">{hint}</p>}
  </div>
);

const TextInput = ({ name, value, onChange, placeholder, className = '', ...rest }) => (
  <input
    name={name} value={value} onChange={onChange} placeholder={placeholder}
    {...rest}
    className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder:text-slate-300 ${className}`}
  />
);

const NumericInput = ({ name, value, onChange, suffix, disabled, step }) => (
  <div className="relative">
    <input
      type="number" name={name} value={value} onChange={onChange}
      step={step ?? 1} disabled={disabled}
      className="w-full pl-4 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    />
    {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-300 uppercase">{suffix}</span>}
  </div>
);

const DarkSelect = ({ name, value, onChange, children }) => (
  <select
    name={name} value={value} onChange={onChange}
    className="w-full bg-slate-800 text-slate-100 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer"
  >
    {children}
  </select>
);

const DarkInput = ({ name, value, onChange, type = 'number' }) => (
  <input
    type={type} name={name} value={value} onChange={onChange}
    className="w-full bg-slate-800 text-slate-100 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-400 outline-none"
  />
);

/* ─── main app ─── */
export const LeavePolicyScreen = () =>{
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // id to delete
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const [createLeaveConfig, { isLoading }] = useCreateLeaveConfigMutation();
  const [updateLeaveConfig] = useUpdateLeaveConfigMutation();
  const [deleteLeaveConfig] = useDeleteLeaveConfigMutation();

  const [adjustBalance, { isLoading: isAdjusting }] = useAdjustLeaveBalanceMutation();

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedAdjustEmp, setSelectedAdjustEmp] = useState(null);
  const [adjustFormData, setAdjustFormData] = useState({
      leaveCode: '',
      amount: 0,
      action: 'ADD'
  });

  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState("balances"); // "balances" | "processing"

  // Debounce search
  useEffect(() => {
      const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
      return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: balanceData, isLoading: balancesLoading } = useGetAllLeaveBalancesQuery({
      page,
      limit: 10,
      search: debouncedSearch
  });

  const handleAdjustSubmit = async () => {
      if (!adjustFormData.leaveCode || adjustFormData.amount === "") {
          return toast.error("Please enter a valid amount");
      }
      try {
          await adjustBalance({
              userId: selectedAdjustEmp.userId,
              ...adjustFormData
          }).unwrap();
          toast.success("Balance adjusted successfully");
          setIsAdjustModalOpen(false);
      } catch (err) {
          toast.error(err?.data?.message || "Adjustment failed");
      }
  };

    const {
        data: leaveConfigData,
        isLoading: isFetching,
        isError,
    } = useGetLeaveConfigsQuery();

   useEffect(() => {
  if (leaveConfigData?.data) {
    const formatted = leaveConfigData.data.map((item) => ({
      id: item.leaveType.id,

      leaveName: item.leaveType.name,
      leaveCode: item.leaveType.code,
      isPaid: item.leaveType.isPaid,

      annualAllocation: Number(item.policy?.annualAllocation || 0),
      enableAccrual: item.policy?.enableMonthlyAccrual || false,
      accrualRate: Number(item.policy?.monthlyAccrualRate || 0),

      monthlyCarryForward: item.policy?.enableMonthlyCarryForward || false,
      monthlyLapse: item.policy?.monthlyLapseEnabled || false,

      cfType: item.policy?.yearlyCarryForwardType || "NONE",
      cfLimit: Number(item.policy?.yearlyCarryForwardLimit || 0),
      maxAccumulation: Number(item.policy?.maxAccumulationLimit || 0),

      allowNegative: false, // if not from DB
      lopAfterLimit: item.policy?.lopAfterLimit || false,
      effectiveDate: item.policy?.effectiveFrom
  ? item.policy.effectiveFrom.split("T")[0]
  : "",
    }));

    setLeaveTypes(formatted);
  }
}, [leaveConfigData]);




  const isEditing = !!currentPolicy;
  const isNew = currentPolicy && !leaveTypes.find(t => t.id === currentPolicy.id);

  const openNew = () => {
    setCurrentPolicy({ id: uid(), ...DEFAULT_POLICY });
    setIsDirty(false);
  };

  const openEdit = (policy) => {
    setCurrentPolicy({ ...policy });
    setIsDirty(false);
  };

  const closeForm = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }
    setCurrentPolicy(null);
  };

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setCurrentPolicy(prev => ({
      ...prev,
      // ✅ Allow empty string so user can clear the input to type a new number
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
    setIsDirty(true);
  }, []);

  const handleToggle = useCallback((field) => {
    setCurrentPolicy(prev => {
      const next = { ...prev, [field]: !prev[field] };
      // Guard: CF and lapse are mutually exclusive
      if (field === 'monthlyCarryForward' && next.monthlyCarryForward) next.monthlyLapse = false;
      if (field === 'monthlyLapse' && next.monthlyLapse) next.monthlyCarryForward = false;
      return next;
    });
    setIsDirty(true);
  }, []);

const savePolicy = async () => {
  if (!currentPolicy?.leaveName?.trim()) {
    toast.error("Leave name is required");
    return;
  }

  if (!currentPolicy?.leaveCode?.trim()) {
    toast.error("Leave code is required");
    return;
  }

  try {
    setIsSaving(true);

    const payload = {
      leaveName: currentPolicy.leaveName,
      leaveCode: currentPolicy.leaveCode,
      isPaid: !!currentPolicy.isPaid,
      // ✅ Sanitize string/empty values back to numbers before submission
      annualAllocation: Number(currentPolicy.annualAllocation) || 0,
      enableAccrual: !!currentPolicy.enableAccrual,
      accrualRate: Number(currentPolicy.accrualRate) || 0,
      monthlyCarryForward: !!currentPolicy.monthlyCarryForward,
      monthlyLapse: !!currentPolicy.monthlyLapse,
      cfType: currentPolicy.cfType,
      cfLimit: Number(currentPolicy.cfLimit) || 0,
      maxAccumulation: Number(currentPolicy.maxAccumulation) || 0,
      allowNegative: !!currentPolicy.allowNegative,
      lopAfterLimit: !!currentPolicy.lopAfterLimit,
      effectiveDate: currentPolicy.effectiveDate
  ? new Date(currentPolicy.effectiveDate).toISOString()
  : null,
    };
    
    // ✅ Logic Guard: Prevent conflicting configurations
    if (payload.maxAccumulation > 0) {
      if (payload.annualAllocation > payload.maxAccumulation) {
        toast.error(`Annual Grant (${payload.annualAllocation}) cannot be greater than the Balance Cap (${payload.maxAccumulation})`);
        return;
      }
      if (payload.cfType === 'PARTIAL' && payload.cfLimit > payload.maxAccumulation) {
        toast.error(`Carry Forward Limit (${payload.cfLimit}) cannot be greater than the Balance Cap (${payload.maxAccumulation})`);
        return;
      }
    }

    if (currentPolicy.id && !isNew) {
      // UPDATE
      await updateLeaveConfig({
        id: currentPolicy.id,
        ...payload,
      }).unwrap();

      toast.success("Leave Config Updated");
    } else {
      // CREATE
      await createLeaveConfig(payload).unwrap();
      toast.success("Leave Config Created");
    }

    setCurrentPolicy(null);
    setIsDirty(false);

  } catch (err) {
    toast.error(err?.data?.message || "Operation failed");
  } finally {
    setIsSaving(false);
  }
};



const confirmDeletePolicy = (id) => setConfirmDelete(id);

 const executeDelete = async () => {
  try {
    await deleteLeaveConfig(confirmDelete).unwrap();
    toast.success("Leave Config Deleted");
  } catch (err) {
    toast.error("Failed to delete");
  } finally {
    setConfirmDelete(null);
  }
};


  return (
    <div className=" bg-slate-50 dark:bg-slate-800 font-sans antialiased text-slate-900 [color-scheme:light]">
      <Toast show={showToast} />
      {confirmDelete && (
        <ConfirmDialog
          message="This leave type will be permanently removed from your organization's policy."
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {confirmDiscardOpen && (
        <ConfirmDialog
          message="You have unsaved changes. Discard them?"
          confirmLabel="Discard"
          cancelLabel="Keep Editing"
          confirmVariant="default"
          onConfirm={() => {
            setConfirmDiscardOpen(false);
            setCurrentPolicy(null);
            setIsDirty(false);
          }}
          onCancel={() => setConfirmDiscardOpen(false)}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">

        {/* ════ LIST VIEW ════ */}
        {!isEditing && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                {/* <h2 className="text-2xl font-bold">Leave Balance & Policy</h2> */}
                <p className="text-sm text-slate-500">Manage employee balances and organization leave rules.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mr-2">
                    <button 
                        onClick={() => setActiveTab("balances")}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "balances" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Balances & Policy
                    </button>
                    <button 
                        onClick={() => setActiveTab("processing")}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "processing" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        Processing Console
                    </button>
                </div>
                <Button
                    onClick={openNew}
                    className="gap-2"
                >
                    <Plus size={16} />
                    New Leave Type
                </Button>
              </div>
            </div>

            {activeTab === "balances" ? (
              <>
                {/* Leave Balances Table */}
                <Card className="overflow-hidden">

                <div className="px-6 py-4 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-slate-700 whitespace-nowrap">Employee Leave Balances</h3>
                    <div className="relative w-full md:w-64">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <UiInput 
                            placeholder="Search employee..." 
                            className="pl-9 h-9 text-xs rounded-xl"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b">
                            <tr>
                                <th className="px-6 py-3">Employee Name</th>
                                {leaveTypes.map(t => (
                                    <th key={t.id} className="px-6 py-3 text-center">{t.leaveCode} Balance</th>
                                ))}
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {balancesLoading ? (
                                <tr><td colSpan={leaveTypes.length + 2} className="px-6 py-10 text-center text-slate-400">Loading balances...</td></tr>
                            ) : balanceData?.data?.length === 0 ? (
                                <tr><td colSpan={leaveTypes.length + 2} className="px-6 py-10 text-center text-slate-400">No balance records found.</td></tr>
                            ) : balanceData?.data?.map((emp) => (
                                <tr key={emp.userId} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{emp.employeeName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{emp.empCode}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {leaveTypes.map(t => {
                                        const bal = emp.balances[t.leaveCode];
                                        return (
                                            <td key={t.id} className="px-6 py-4 text-center">
                                                {bal ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-slate-700">{bal.remaining}</span>
                                                        <span className="text-[9px] text-slate-400 uppercase font-medium">/{bal.total}</span>
                                                    </div>
                                                ) : '—'}
                                            </td>
                                        );
                                    })}
                                    <td className="px-6 py-4 text-right">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="text-xs h-7 gap-1"
                                            onClick={() => {
                                                setSelectedAdjustEmp(emp);
                                                setIsAdjustModalOpen(true);
                                            }}
                                        >
                                            <History size={12} /> Adjust
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t bg-slate-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Page {balanceData?.currentPage || 1} of {balanceData?.totalPages || 1}
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest"
                            disabled={page <= 1}
                            onClick={() => setPage(prev => prev - 1)}
                        >
                            <ChevronLeft size={14} className="mr-1" /> Prev
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest"
                            disabled={page >= (balanceData?.totalPages || 1)}
                            onClick={() => setPage(prev => prev + 1)}
                        >
                            Next <ChevronLeft size={14} className="ml-1 rotate-180" />
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="pt-4 border-t border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4">Leave Policy & Rules</h3>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {isFetching && (
                <div className="col-span-full text-center py-20">
                    <Clock size={20} className="animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Loading leave policies...</p>
                </div>
                )}
              {!isFetching && leaveTypes.length === 0 && (
                <div className="col-span-full text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-blue-400" />
                  </div>
                  <p className="font-bold text-slate-600">No leave types configured</p>
                  <p className="text-sm text-slate-400 mt-1">Click "New Leave Type" to get started.</p>
                </div>
              )}

              {leaveTypes.map((type) => (
                <div
                  key={type.id}
                  className="group relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200"
                >
                  {/* actions */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(type)}
                        >
                        <Pencil size={15} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDeletePolicy(type.id)}
                        >
                        <Trash2 size={15} />
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 mb-5">
                    <CodeBadge code={type.leaveCode} />
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">{type.leaveName}</h3>
                      <div className="mt-1">
                        <Chip on={type.isPaid} label={type.isPaid ? 'Paid' : 'Unpaid'} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Annual', value: type.annualAllocation, unit: 'days' },
                      { label: 'Accrual', value: type.enableAccrual ? type.accrualRate : '—', unit: type.enableAccrual ? '/mo' : '' },
                      { label: 'Carry Fwd', value: type.cfType, unit: '' },
                    ].map(({ label, value, unit }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-2.5">
                        <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
                        <p className="text-sm font-extrabold text-slate-700 mt-0.5 truncate">{value} <span className="text-[10px] font-medium text-slate-400">{unit}</span></p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 flex-wrap">
                    {type.monthlyCarryForward && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-500">CF Monthly</span>}
                    {type.monthlyLapse && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-600">Monthly Lapse</span>}
                    {type.allowNegative && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-50 text-violet-500">Overdraft</span>}
                    {type.lopAfterLimit && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">Auto LOP</span>}
                    <span className="ml-auto text-[9px] text-slate-300 font-medium">from {type.effectiveDate}</span>
                  </div>
                </div>
              ))}

              {leaveTypes.length > 0 && (
                <Button
                    variant="outline"
                    onClick={openNew}
                    className="flex flex-col items-center justify-center h-full gap-2 border-dashed"
                    >
                    <Plus size={28} />
                    Add type
                </Button>
              )}
            </div>
          </>
        ) : (
          <LeaveProcessingConsole />
        )}
      </div>
    )}

        {/* ════ EDIT VIEW ════ */}
        {isEditing && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                variant="ghost"
                size="icon"
                onClick={closeForm}
                >
                <ChevronLeft size={20} />
                </Button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {isNew ? 'New Leave Type' : `Editing: ${currentPolicy.leaveName || '…'}`}
                    </h3>
                    {isDirty && <span className="h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isNew ? 'Define the rules for a new leave entitlement.' : 'Modify policy rules — changes apply on next cycle.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                    variant="ghost"
                    onClick={closeForm}
                    >
                    Cancel
                </Button>
                <Button
                    onClick={savePolicy}
                    disabled={isSaving || isLoading}
                    className="gap-2"
                    >
                    {isSaving || isLoading ? (
                        <Clock size={16} className="animate-spin" />
                        ) : (
                        <Save size={16} />
                    )}
                    Save Policy
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left col (main form) ── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Identity */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <Settings size={14} className="text-slate-400" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Identity</span>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Leave Name">
                        <TextInput
                          name="leaveName"
                          value={currentPolicy.leaveName}
                          onChange={handleInputChange}
                          placeholder="e.g. Vacation Leave"
                        />
                      </Field>
                      <Field label="Leave Code">
                        <TextInput
                          name="leaveCode"
                          value={currentPolicy.leaveCode}
                          onChange={handleInputChange}
                          placeholder="e.g. VL"
                          className="uppercase font-extrabold"
                          maxLength={4}
                        />
                      </Field>
                    </div>

                    {/* Paid toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Mark as Paid Leave</p>
                        <p className="text-xs text-slate-400 mt-0.5">Unpaid leave automatically triggers LOP calculation.</p>
                      </div>
                      <Toggle on={currentPolicy.isPaid} onChange={() => handleToggle('isPaid')} />
                    </div>
                  </div>
                </section>

                {/* Accrual */}
                <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Accrual Strategy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Enable</span>
                      <Toggle on={currentPolicy.enableAccrual} onChange={() => handleToggle('enableAccrual')} accent="#10b981" />
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                      <Field label="Annual Grant" hint="Total days granted per year">
                        <NumericInput name="annualAllocation" value={currentPolicy.annualAllocation} onChange={handleInputChange} suffix="days" />
                      </Field>
                      <Field label="Monthly Rate" hint="Days accrued each calendar month">
                        <NumericInput name="accrualRate" value={currentPolicy.accrualRate} onChange={handleInputChange} suffix="/mo" step={0.5} disabled={!currentPolicy.enableAccrual} />
                      </Field>
                    </div>

                    <div className="space-y-3">
                      {/* CF row */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${currentPolicy.monthlyCarryForward ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <div className="flex gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0"><ArrowRightLeft size={15} /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">Monthly Carry Forward</p>
                            <p className="text-xs text-slate-400">Unused balance rolls into next month's bucket.</p>
                          </div>
                        </div>
                        <Toggle on={currentPolicy.monthlyCarryForward} onChange={() => handleToggle('monthlyCarryForward')} />
                      </div>

                      {/* Lapse row */}
                      <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${currentPolicy.monthlyLapse ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <div className="flex gap-3">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0"><AlertCircle size={15} /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">Monthly Lapse Rule</p>
                            <p className="text-xs text-slate-400">Unused quota expires at end of each month.</p>
                            {currentPolicy.monthlyCarryForward && (
                              <p className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1"><AlertTriangle size={10} /> Cannot be enabled with Carry Forward.</p>
                            )}
                          </div>
                        </div>
                        <Toggle
                          on={currentPolicy.monthlyLapse}
                          onChange={() => handleToggle('monthlyLapse')}
                          accent="#d97706"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* ── Right col (sidebar) ── */}
              <div className="space-y-5">

                {/* Year-end processing */}
                <div className="bg-slate-900 rounded-2xl p-5 shadow-xl space-y-5">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-400" />
                    <h3 className="font-bold text-white text-sm tracking-tight">Year-End Processing</h3>
                  </div>

                  <Field label={<span className="text-slate-500">Forward Method</span>}>
                    <DarkSelect name="cfType" value={currentPolicy.cfType} onChange={handleInputChange}>
                      <option value="NONE">Lapse All (None)</option>
                      <option value="PARTIAL">Limited (Partial)</option>
                      <option value="FULL">Unlimited (Full)</option>
                    </DarkSelect>
                  </Field>

                  {currentPolicy.cfType === 'PARTIAL' && (
                    <Field label={<span className="text-slate-500">Max Carry Limit</span>} hint={<span className="text-slate-600">Days that can roll to new year</span>}>
                      <DarkInput name="cfLimit" value={currentPolicy.cfLimit} onChange={handleInputChange} />
                    </Field>
                  )}

                  <Field label={<span className="text-slate-500">Balance Cap</span>} hint={<span className="text-slate-600">Wallet can never exceed this value</span>}>
                    <DarkInput name="maxAccumulation" value={currentPolicy.maxAccumulation} onChange={handleInputChange} />
                  </Field>
                </div>

                {/* Usage & Overdraft */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm" style={{ borderTop: '4px solid #6366f1' }}>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-5">
                    <AlertCircle size={16} className="text-blue-500" />
                    Usage & Overdraft
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Negative Balance</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Allow employees to 'borrow' leave days</p>
                      </div>
                      <Toggle on={currentPolicy.allowNegative} onChange={() => handleToggle('allowNegative')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-700">Auto LOP Conversion</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Overflow converted to salary deduction</p>
                      </div>
                      <Toggle on={currentPolicy.lopAfterLimit} onChange={() => handleToggle('lopAfterLimit')} />
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                      <Field label="Activation Date">
                        <TextInput
                          type="date"
                          name="effectiveDate"
                          value={currentPolicy.effectiveDate}
                          onChange={handleInputChange}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-3">
                  <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Annual allocation changes apply immediately. Accrual rate updates take effect on the next scheduled cron cycle.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Adjust Balance Modal */}
      <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                  <DialogTitle>Adjust Leave Balance</DialogTitle>
              </DialogHeader>
              {selectedAdjustEmp && (
                  <div className="space-y-4 py-2">
                      <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                          <User className="text-slate-400" />
                          <div>
                              <p className="text-sm font-bold">{selectedAdjustEmp.employeeName}</p>
                              <p className="text-xs text-slate-500">{selectedAdjustEmp.empCode}</p>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">Leave Type</label>
                          <Select 
                            value={adjustFormData.leaveCode} 
                            onValueChange={(v) => setAdjustFormData({...adjustFormData, leaveCode: v})}
                          >
                              <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                  {leaveTypes.map(t => (
                                      <SelectItem key={t.id} value={t.leaveCode}>{t.leaveName} ({t.leaveCode})</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Action</label>
                              <Select 
                                value={adjustFormData.action} 
                                onValueChange={(v) => setAdjustFormData({...adjustFormData, action: v})}
                              >
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="ADD">Add (+)</SelectItem>
                                      <SelectItem value="SUBTRACT">Subtract (-)</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-500 uppercase">Amount (Days)</label>
                              <UiInput 
                                type="number" 
                                value={adjustFormData.amount} 
                                onChange={(e) => setAdjustFormData({...adjustFormData, amount: e.target.value})}
                              />
                          </div>
                      </div>
                  </div>
              )}
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdjustSubmit} disabled={isAdjusting}>Save Changes</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}