import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    GitBranch, 
    Plus, 
    Trash2, 
    ChevronRight, 
    Shield, 
    UserCheck, 
    Save, 
    Clock,
    CheckCircle2,
    Settings2,
    Layout,
    ChevronDown,
    Zap,
    ArrowLeft,
    CalendarDays,
    XCircle
} from 'lucide-react';
import { 
    useGetWorkflowsQuery, 
    useSaveWorkflowMutation 
} from "@/services/hrms/workflow.api.js";
import { useGetRBACRolesQuery } from "@/services/rbac/rbac.api.js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";

const CustomSelect = ({ value, onChange, options, placeholder }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative w-full">
            <div
                onClick={() => setOpen(!open)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${open ? 'border-blue-500 ring-2 ring-blue-50' : 'border-slate-200'} bg-white text-sm font-semibold cursor-pointer transition-all shadow-sm`}
            >
                <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </div>
            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-2xl z-[500] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-60 overflow-y-auto thin-scrollbar">
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`px-4 py-3 cursor-pointer text-sm font-semibold flex items-center gap-3 transition-colors ${value === opt.value ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {opt.icon}
                                <span>{opt.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomToggle = ({ checked, onChange }) => (
    <div 
        onClick={() => onChange(!checked)}
        className="w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 flex items-center shadow-inner"
        style={{ backgroundColor: checked ? '#2563eb' : '#e2e8f0' }}
    >
        <div 
            className="w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 transform"
            style={{ transform: checked ? 'translateX(24px)' : 'translateX(0)' }}
        />
    </div>
);

export const WorkflowSettingsPage = () => {
    const [selectedModule, setSelectedModule] = useState('LEAVE');
    const [levels, setLevels] = useState([]);
    const [isActive, setIsActive] = useState(true);

    const { checkPermission } = useHRMSPermissions();
    const canEdit = checkPermission('/hrms/admin/workflow', 'edit');

    const { data: workflowData, isLoading: wfLoading } = useGetWorkflowsQuery();
    const { data: roleData, isLoading: rolesLoading } = useGetRBACRolesQuery();
    const [saveWorkflow, { isLoading: isSaving }] = useSaveWorkflowMutation();

    const roles = useMemo(() => roleData?.data || [], [roleData]);
    const workflows = useMemo(() => workflowData?.data || [], [workflowData]);

    useEffect(() => {
        if (workflows.length > 0) {
            const wf = workflows.find(w => w.module === selectedModule);
            if (wf) {
                setLevels(wf.levels.map(l => ({
                    approverType: l.approverType,
                    roleId: l.roleId?.toString() || ''
                })));
                setIsActive(wf.isActive);
            } else {
                setLevels([{ approverType: 'REPORTING_MANAGER', roleId: '' }]);
                setIsActive(true);
            }
        } else if (!wfLoading) {
            setLevels([{ approverType: 'REPORTING_MANAGER', roleId: '' }]);
            setIsActive(true);
        }
    }, [selectedModule, workflows, wfLoading]);

    const addLevel = () => setLevels([...levels, { approverType: 'ROLE', roleId: '' }]);
    const removeLevel = (index) => setLevels(levels.filter((_, i) => i !== index));
    const updateLevel = (index, field, value) => {
        const newLevels = [...levels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        if (field === 'approverType' && value === 'REPORTING_MANAGER') newLevels[index].roleId = '';
        setLevels(newLevels);
    };

    const handleSave = async () => {
        const isValid = levels.every(l => l.approverType === 'REPORTING_MANAGER' || (l.approverType === 'ROLE' && l.roleId));
        if (!isValid) return toast.error("Please complete all approval steps");
        try {
            await saveWorkflow({
                module: selectedModule,
                name: `${selectedModule} Approval Workflow`,
                isActive: isActive,
                levels: levels
            }).unwrap();
            toast.success("Workflow configuration updated successfully");
        } catch (err) {
            toast.error(err?.data?.message || "Failed to save workflow");
        }
    };

    return (
        <div className=" bg-slate-50 dark:bg-slate-800 pt-12 p-6 md:p-10 font-sans text-slate-900 overflow-visible">
            {/* Inline CSS to kill overrides once and for all */}
            <style dangerouslySetInnerHTML={{ __html: `
                .wf-btn-reset { 
                    all: unset !important; 
                    display: flex !important;
                    align-items: center !important;
                    justify-content: space-between !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    padding: 16px 24px !important;
                    border-radius: 12px !important;
                    font-size: 11px !important;
                    font-weight: 800 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                }
                .wf-btn-active {
                    background-color: #2563eb !important;
                    color: #ffffff !important;
                    border: none !important;
                    box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.3) !important;
                }
                .wf-btn-inactive {
                    background-color: #ffffff !important;
                    color: #64748b !important;
                    border: 1px solid #f1f5f9 !important;
                }
                .wf-btn-inactive:hover {
                    border-color: #dbeafe !important;
                    color: #334155 !important;
                }
                .wf-delete-btn {
                    all: unset !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    width: 32px !important;
                    height: 32px !important;
                    border-radius: 8px !important;
                    background-color: #f1f5f9 !important;
                    color: #94a3b8 !important;
                    cursor: pointer !important;
                    transition: all 0.2s !important;
                    position: absolute !important;
                    top: 16px !important;
                    right: 16px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                .wf-delete-btn:hover {
                    background-color: #fff1f2 !important;
                    color: #f43f5e !important;
                    border-color: #fecdd3 !important;
                    box-shadow: 0 4px 6px -1px rgba(244, 63, 94, 0.1) !important;
                }
            `}} />

            <div className="max-w-6xl mx-auto space-y-8 overflow-visible">

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start overflow-visible">
                    
                    {/* Module Selection */}
                    <div className="xl:col-span-3 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Select Module</p>
                        <div className="space-y-2">
                            {['LEAVE', 'PERMISSION', 'EXPENSE', 'LOAN', 'INCENTIVE', 'PAYROLL', 'ATTENDANCE', 'TERMINATION'].map((mod) => {
                                const isActiveMod = selectedModule === mod;
                                return (
                                    <button
                                        key={mod}
                                        onClick={() => setSelectedModule(mod)}
                                        className={`wf-btn-reset ${isActiveMod ? 'wf-btn-active' : 'wf-btn-inactive'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {mod === 'LEAVE' && <Clock size={16}/>}
                                            {mod === 'PERMISSION' && <GitBranch size={16}/>}
                                            {mod === 'EXPENSE' && <Shield size={16}/>}
                                            {mod === 'LOAN' && <Layout size={16}/>}
                                            {mod === 'INCENTIVE' && <CheckCircle2 size={16}/>}
                                            {mod === 'PAYROLL' && <Settings2 size={16}/>}
                                            {mod === 'ATTENDANCE' && <CalendarDays size={16}/>}
                                            {mod === 'TERMINATION' && <XCircle size={16}/>}
                                            <span style={{ color: 'inherit' }}>{mod}</span>
                                        </div>
                                        {isActiveMod && <ChevronRight size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Workflow Editor */}
                    <div className="xl:col-span-9 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-10 min-h-[600px] overflow-visible">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                                    <GitBranch size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Approval Chain</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sequence of approvers for {selectedModule} requests</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Workflow Active</span>
                                <CustomToggle checked={isActive} onChange={setIsActive} />
                            </div>
                        </div>

                        <div className="space-y-8 relative overflow-visible">
                            {levels.map((level, index) => (
                                <div 
                                    key={index} 
                                    className="flex gap-6 items-start relative pl-4 overflow-visible"
                                    style={{ zIndex: 100 - index }}
                                >
                                    {/* Connector Line */}
                                    {index < levels.length - 1 && (
                                        <div className="absolute left-[35px] top-12 bottom-[-32px] w-0.5 bg-slate-100 z-0" />
                                    )}

                                    {/* Step Circle */}
                                    <div className="w-10 h-10 rounded-full border-2 border-slate-100 bg-white flex items-center justify-center text-xs font-black text-slate-400 shrink-0 shadow-sm z-10">
                                        {index + 1}
                                    </div>
                                    
                                    <div className="flex-1 bg-slate-50/50 rounded-2xl p-8 border border-slate-50 flex flex-col md:flex-row gap-6 relative group transition-all hover:bg-white hover:border-blue-100 hover:shadow-md z-10 overflow-visible">
                                        {/* Delete Button - Forced CSS */}
                                        <button 
                                            onClick={() => removeLevel(index)}
                                            className="wf-delete-btn"
                                            title="Delete Step"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        
                                        <div className="flex-1 space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Approver Type</label>
                                            <CustomSelect
                                                value={level.approverType}
                                                onChange={(v) => updateLevel(index, 'approverType', v)}
                                                placeholder="Select type..."
                                                options={[
                                                    { value: 'REPORTING_MANAGER', label: 'Reporting Manager', icon: <UserCheck size={16} className="text-blue-500" /> },
                                                    { value: 'ROLE', label: 'Specific Role', icon: <Shield size={16} className="text-amber-500" /> }
                                                ]}
                                            />
                                        </div>

                                        {level.approverType === 'ROLE' && (
                                            <div className="flex-1 space-y-3 animate-in fade-in duration-300">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Personnel Role</label>
                                                <CustomSelect
                                                    value={level.roleId}
                                                    onChange={(v) => updateLevel(index, 'roleId', v)}
                                                    placeholder="Select role..."
                                                    options={roles.map(r => ({ value: r.id.toString(), label: r.name || r.roleName }))}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {canEdit && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 overflow-visible">
                                    <button 
                                        onClick={addLevel}
                                        className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-all bg-transparent border-none uppercase tracking-widest group outline-none"
                                    >
                                        <Plus size={18} className="group-hover:scale-125 transition-transform" /> 
                                        Add Approval Step
                                    </button>
                                    <Button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 h-12 rounded-xl shadow-lg shadow-blue-100 border-none text-xs uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        Save {selectedModule} Workflow
                                    </Button>
                                </div>
                            )}

                            <div className="mt-12 bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 flex gap-6 animate-in slide-in-from-bottom-4 duration-700">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-50 shrink-0">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight">Post-Workflow Actions</h4>
                                    <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                                        Once the final level approves, the request is marked as <span className="font-black underline">FINAL</span>. Balance deduction and attendance marking will happen automatically.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
