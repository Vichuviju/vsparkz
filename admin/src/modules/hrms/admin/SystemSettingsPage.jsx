import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
    Settings, 
    ShieldCheck, 
    Clock, 
    Calculator, 
    Save, 
    Info, 
    Bell, 
    ArrowRight,
    LayoutDashboard,
    Users,
    GitBranch,
    Plus,
    Trash2,
    CheckCircle2,
    Layout,
    ChevronDown,
    ChevronRight,
    Shield,
    UserCheck,
    CreditCard,
    ArrowLeft,
    CalendarCheck,
    FileType
} from "lucide-react";
import { 
    useGetHrSettingsQuery, 
    useSaveHrSettingsMutation 
} from "@/services/hrms/hrSettings.api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";
import ReactQuill from "react-quill-new";
import 'react-quill-new/dist/quill.snow.css';

const Toggle = ({ checked, onChange }) => (
    <div 
        onClick={() => onChange(!checked)}
        className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-300 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
        <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
);

const defaultTemplate = `
            <!-- PAGE 1: OFFICIAL OFFER -->
            <div style="text-align: right; margin-bottom: 20px;">
                <strong>Date:</strong> {{current_date}}
            </div>
            
            <div style="margin-bottom: 30px;">
                <strong>To:</strong><br/>
                <strong>{{full_name}}</strong><br/>
                {{address}}
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="text-decoration: underline; color: #1e40af;">Subject: Employment Offer Letter</h2>
            </div>

            <p>Dear <strong>{{first_name}}</strong>,</p>

            <p>We are pleased to offer you the position of <strong>{{designation}}</strong> with <strong>Secure Code Systems</strong>. Based on your experience and qualifications, we are confident that you will be a valuable addition to our organization.</p>

            <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">1. Position Details</h3>
            <p>
                <strong>Job Title:</strong> {{designation}}<br/>
                <strong>Department:</strong> {{department}}<br/>
                <strong>Reporting To:</strong> {{manager}}<br/>
                <strong>Employment Type:</strong> {{emp_type}}<br/>
                <strong>Work Location:</strong> {{location}}<br/>
                <strong>Start Date:</strong> {{joining_date}}
            </p>

            <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">2. Role & Responsibilities</h3>
            <p>In your role as {{designation}}, you will be responsible for executing project requirements, collaborating with the technical team, and ensuring high-quality delivery of software solutions. A detailed job description will be provided upon joining.</p>

            <p>We look forward to your contribution and success with us.</p>

            <div style="margin-top: 40px;">
                Sincerely,<br/><br/><br/>
                <strong>Authorized Signatory</strong><br/>
                Secure Code Systems
            </div>

            <!-- pagebreak -->
            <!-- PAGE 2: SALARY ANNEXURE -->
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="text-decoration: underline; color: #1e40af;">ANNEXURE - A: COMPENSATION DETAILS</h2>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tbody>
                    <tr>
                        <td><strong>Component</strong></td>
                        <td><strong>Monthly (₹)</strong></td>
                        <td><strong>Annual (₹)</strong></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 10px;">Basic Salary</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{basic_monthly}}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{basic_annual}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 10px;">Dearness Allowance (DA)</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{da_monthly}}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{da_annual}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 10px;">House Rent Allowance (HRA)</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{hra_monthly}}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{hra_annual}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 10px;">Travel Allowance</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{travel_monthly}}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{travel_annual}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 10px;">Special Allowance</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{special_monthly}}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{special_annual}}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 10px;">Other Allowance</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{other_monthly}}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{other_annual}}</td>
                    </tr>
                    <tr style="font-weight: bold; background-color: #f8fafc;">
                        <td style="border: 1px solid #cbd5e1; padding: 10px;">Gross Salary</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{gross_monthly}}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 10px; text-align: right;">{{gross_annual}}</td>
                    </tr>
                </tbody>
            </table>

            <p><strong>Note:</strong> Statutory deductions like PF, ESI, and Professional Tax will be applicable as per government regulations.</p>

            <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Benefits & Perks</h3>
            <ul>
                <li>Group Health Insurance coverage up to ₹3,00,000 per annum.</li>
                <li>Annual Performance Bonus based on organizational and individual goals.</li>
                <li>Paid Leaves: 18 days per calendar year (pro-rated).</li>
            </ul>

            <!-- pagebreak -->
            <!-- PAGE 3: TERMS & ACCEPTANCE -->
            <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">3. Terms and Conditions</h3>
            <ol>
                <li><strong>Probation:</strong> You will be on probation for a period of six months. Successful completion will lead to confirmation of your employment.</li>
                <li><strong>Notice Period:</strong> Post-confirmation, the notice period for resignation or termination shall be 60 days.</li>
                <li><strong>Confidentiality:</strong> You shall not disclose any sensitive company information to third parties during or after your tenure.</li>
                <li><strong>Exclusivity:</strong> You will engage yourself exclusively in the work of the company and shall not take up any other assignment.</li>
            </ol>

            <h3 style="color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">4. Conditions of Employment</h3>
            <p>This offer is valid subject to successful background verification and submission of original documents (ID, Education, Relieving Letters).</p>

            <div style="margin-top: 60px; border: 2px solid #e2e8f0; padding: 30px; border-radius: 15px; background-color: #f8fafc;">
                <h3 style="margin-top: 0; color: #1e40af;">Candidate Acceptance</h3>
                <p>I, <strong>{{full_name}}</strong>, have read and understood the terms and conditions of employment and hereby accept this offer.</p>
                <br/><br/>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; pt-4">
                    <p>Signature: ____________________</p>
                    <p>Date: ____________________</p>
                </div>
            </div>
        `;

export const SystemSettingsPage = () => {
    const [activeTab, setActiveTab] = useState("attendance");
    const { checkPermission } = useHRMSPermissions();
    const canEdit = checkPermission('/hrms/admin/settings', 'edit');
    
    const { data: settingsRes, isLoading } = useGetHrSettingsQuery();
    const [saveSettings, { isLoading: isSaving }] = useSaveHrSettingsMutation();
    
    const [settings, setSettings] = useState({
        attendanceAutoClose: "20:00",
        attendanceGracePeriod: 15,
        pfWageCeiling: 15000,
        esiWageCeiling: 21000,
        enableEmailAlerts: true,
        permissionMonthlyLimit: 4,
        offerLetterTemplate: defaultTemplate,
        statutoryDeadlines: {
            pf: 15,
            esi: 15,
            pt: 30
        }
    });

    useEffect(() => {
        if (settingsRes?.data) {
            setSettings(prev => ({
                ...prev,
                ...settingsRes.data,
                offerLetterTemplate: settingsRes.data.offerLetterTemplate || prev.offerLetterTemplate || defaultTemplate
            }));
        }
    }, [settingsRes]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['attendance', 'payroll', 'templates'].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    const handleSaveGeneral = async () => {
        try {
            await saveSettings(settings).unwrap();
            toast.success("System configurations updated");
        } catch (error) {
            toast.error("Failed to save settings");
        }
    };

    const tabs = [
        { id: "attendance", label: "Attendance Policy", sub: "Global shift & punctuality control", icon: Clock },
        { id: "payroll", label: "Payroll & Statutory", sub: "Payroll rules & compliance", icon: Calculator },
        { id: "compliance", label: "Statutory Deadlines", sub: "Compliance filing dates", icon: ShieldCheck },
        { id: "leave", label: "Leave & Permission", sub: "Leave and access management", icon: CalendarCheck },
        { id: "templates", label: "Templates", sub: "Documents & formats", icon: FileType },
    ];

    // --- Template Management Logic ---
    const templatePages = useMemo(() => {
        return settings.offerLetterTemplate?.split('<!-- pagebreak -->') || [""];
    }, [settings.offerLetterTemplate]);

    const updatePage = (val, idx) => {
        // CRITICAL: Prevent infinite loop by checking if value actually changed
        if (templatePages[idx] === val) return;
        
        const newPages = [...templatePages];
        newPages[idx] = val;
        setSettings(prev => ({ 
            ...prev, 
            offerLetterTemplate: newPages.join('<!-- pagebreak -->') 
        }));
    };

    const addPage = () => {
        setSettings(prev => ({ 
            ...prev, 
            offerLetterTemplate: (prev.offerLetterTemplate || "") + '<!-- pagebreak --><p>New Page Content...</p>' 
        }));
    };

    const deletePage = (idx) => {
        if (templatePages.length <= 1) return;
        const newPages = templatePages.filter((_, i) => i !== idx);
        setSettings(prev => ({ 
            ...prev, 
            offerLetterTemplate: newPages.join('<!-- pagebreak -->') 
        }));
    };
    // ---------------------------------

    return (
        <div className="p-4 md:p-8 pt-20 max-w-[1400px] mx-auto space-y-6 bg-[#f8fafc] min-h-screen">
            
            <div className="mb-8">
                {/* <h1 className="text-2xl font-bold text-slate-900">System Settings</h1> */}
                <p className="text-sm text-slate-500">Manage your organization's configuration and policies</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Sidebar Navigation */}
                <div className="xl:col-span-3 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Configuration Hub</p>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all relative ${
                                    activeTab === tab.id 
                                        ? "bg-blue-50/50 text-blue-600" 
                                        : "bg-transparent text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                {activeTab === tab.id && (
                                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-600 rounded-full" />
                                )}
                                <div className={`p-2 rounded-lg ${activeTab === tab.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                                    <tab.icon size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold leading-none">{tab.label}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">{tab.sub}</p>
                                </div>
                            </button>
                        ))}
                        
                        <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">External Tools</p>
                            <Link 
                                to="/hrms/admin/workflow" 
                                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-lg transition-colors">
                                        <GitBranch size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold leading-none">Workflow Architect</p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1">Design and automate workflows</p>
                                    </div>
                                </div>
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Help Card */}
                    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 flex flex-col gap-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                            <Info size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">Need help?</p>
                            <p className="text-xs text-slate-500 mt-1">Visit our help center or contact support.</p>
                        </div>
                        <a href="#" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                            Go to Help Center <ArrowRight size={14} />
                        </a>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="xl:col-span-9 bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[650px] flex flex-col">
                    
                    <div className="p-8 md:p-12 flex-grow">
                        {activeTab === "attendance" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Header Section */}
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="space-y-4 max-w-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                                                <Clock size={24}/>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900">Attendance Policy</h2>
                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Global Shift & Punctuality Control</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Define global rules for auto close shifts and late grace period to ensure consistency and compliance across the organization.
                                        </p>
                                    </div>
                                    <div className="hidden lg:block relative w-48 h-32">
                                        {/* Placeholder for Illustration */}
                                        <div className="absolute inset-0 bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-100">
                                            <CalendarCheck size={48} className="text-blue-200" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white rounded-full shadow-lg border border-slate-50 flex items-center justify-center">
                                            <Clock size={32} className="text-blue-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-4">
                                        Policy Configuration
                                        <div className="h-[1px] bg-slate-100 flex-grow" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Setting Card 1 */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">Auto-Close Unmarked Shift</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Set the time when unmarked shifts are automatically closed.</p>
                                            </div>
                                            
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors">
                                                    <Clock size={18} />
                                                </div>
                                                <input 
                                                    type="time" 
                                                    value={settings.attendanceAutoClose}
                                                    onChange={(e) => setSettings({...settings, attendanceAutoClose: e.target.value})}
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex items-start gap-3">
                                                <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    Employees without a clock-out will be marked 'Absent' automatically after this time.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Setting Card 2 */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">Late Grace Period (mins)</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Define the grace period allowed before a late check-in is penalized or flagged.</p>
                                            </div>
                                            
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors">
                                                    <Clock size={18} />
                                                </div>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                                    mins
                                                </div>
                                                <input 
                                                    type="number" 
                                                    value={settings.attendanceGracePeriod}
                                                    onChange={(e) => setSettings({...settings, attendanceGracePeriod: Number(e.target.value)})}
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-16 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex items-start gap-3">
                                                <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    Margin allowed before a late check-in is penalized or flagged.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "payroll" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Header Section */}
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="space-y-4 max-w-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100">
                                                <Calculator size={24}/>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900">Payroll & Statutory</h2>
                                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Payroll rules & compliance</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Configure statutory wage ceilings and compliance parameters to ensure accurate payroll processing.
                                        </p>
                                    </div>
                                    <div className="hidden lg:block relative w-48 h-32">
                                        <div className="absolute inset-0 bg-emerald-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-100">
                                            <Shield size={48} className="text-emerald-200" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white rounded-full shadow-lg border border-slate-50 flex items-center justify-center">
                                            <Calculator size={32} className="text-emerald-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-4">
                                        Compliance Configuration
                                        <div className="h-[1px] bg-slate-100 flex-grow" />
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                        {/* PF Card */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">PF Wage Ceiling (₹)</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Max component for statutory PF deduction.</p>
                                            </div>
                                            
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                                                    <span className="font-bold text-sm">₹</span>
                                                </div>
                                                <input 
                                                    type="number" 
                                                    value={settings.pfWageCeiling}
                                                    onChange={(e) => setSettings({...settings, pfWageCeiling: Number(e.target.value)})}
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 flex items-start gap-3">
                                                <Info size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    Standard statutory limit is ₹15,000. Changes affect only future cycles.
                                                </p>
                                            </div>
                                        </div>

                                        {/* ESI Card */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">ESI Wage Ceiling (₹)</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Gross salary threshold for ESI mandatory enrollment.</p>
                                            </div>
                                            
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                                                    <span className="font-bold text-sm">₹</span>
                                                </div>
                                                <input 
                                                    type="number" 
                                                    value={settings.esiWageCeiling}
                                                    onChange={(e) => setSettings({...settings, esiWageCeiling: Number(e.target.value)})}
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 flex items-start gap-3">
                                                <Info size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                    Current statutory limit is ₹21,000. Employees above this will not have ESI deductions.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "compliance" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="space-y-4 max-w-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                                                <ShieldCheck size={24}/>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900">Statutory Deadlines</h2>
                                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Compliance Filing Dates</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Configure the monthly due dates for statutory remittances. These dates control the compliance timers and alerts on the PF/ESI dashboard.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-4">
                                        Due Dates (Day of next month)
                                        <div className="h-[1px] bg-slate-100 flex-grow" />
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {/* PF Deadline */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">PF Deadline</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Due day for PF ECR filing.</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                min="1" max="31"
                                                value={settings.statutoryDeadlines?.pf}
                                                onChange={(e) => setSettings({
                                                    ...settings, 
                                                    statutoryDeadlines: { ...settings.statutoryDeadlines, pf: Number(e.target.value) }
                                                })}
                                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                            />
                                        </div>

                                        {/* ESI Deadline */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">ESI Deadline</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Due day for ESI contributions.</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                min="1" max="31"
                                                value={settings.statutoryDeadlines?.esi}
                                                onChange={(e) => setSettings({
                                                    ...settings, 
                                                    statutoryDeadlines: { ...settings.statutoryDeadlines, esi: Number(e.target.value) }
                                                })}
                                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                            />
                                        </div>

                                        {/* PT Deadline */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">PT Deadline</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Due day for Professional Tax.</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                min="1" max="31"
                                                value={settings.statutoryDeadlines?.pt}
                                                onChange={(e) => setSettings({
                                                    ...settings, 
                                                    statutoryDeadlines: { ...settings.statutoryDeadlines, pt: Number(e.target.value) }
                                                })}
                                                className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "leave" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                {/* Header Section */}
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="space-y-4 max-w-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-100">
                                                <CalendarCheck size={24}/>
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900">Leave & Permission</h2>
                                                <p className="text-[10px] text-violet-600 font-bold uppercase tracking-widest">Leave and access management</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed">
                                            Manage monthly entitlements and constraints for short-leave and permission requests.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-900">Monthly Permission Limit (Hrs)</h3>
                                                <p className="text-xs text-slate-500 leading-none mt-1">Total hours allowed for short-leave per month.</p>
                                            </div>
                                            
                                            <div className="relative group/input">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-violet-600 transition-colors">
                                                    <Clock size={18} />
                                                </div>
                                                <input 
                                                    type="number" 
                                                    value={settings.permissionMonthlyLimit}
                                                    onChange={(e) => setSettings({...settings, permissionMonthlyLimit: Number(e.target.value)})}
                                                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-sm font-bold text-slate-800 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/5 transition-all outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}



                        {activeTab === "templates" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><FileType size={24}/></div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">Document Templates</h2>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Documents & formats</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                if(window.confirm("Reset template?")) {
                                                    setSettings({ ...settings, offerLetterTemplate: defaultTemplate });
                                                }
                                            }}
                                            className="rounded-xl border-amber-200 text-amber-600 font-bold hover:bg-amber-50"
                                        >
                                            Reset
                                        </Button>
                                        <Button onClick={addPage} variant="outline" size="sm" className="rounded-xl border-blue-200 text-blue-600 font-bold gap-2">
                                            <Plus size={16} /> Add Page
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-8 pt-6 border-t border-slate-100">
                                    {templatePages.map((page, idx) => (
                                        <div key={idx} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center text-[10px]">{idx + 1}</span>
                                                    Page Content
                                                </h3>
                                                {templatePages.length > 1 && (
                                                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600" onClick={() => deletePage(idx)}>
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                                                <ReactQuill theme="snow" value={page} onChange={(val) => updatePage(val, idx)} className="min-h-[200px]" />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Info size={14} /> Available Tokens
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                '{{full_name}}', '{{first_name}}', '{{last_name}}', '{{emp_code}}', 
                                                '{{designation}}', '{{department}}', '{{manager}}', '{{emp_type}}', 
                                                '{{joining_date}}', '{{location}}', '{{address}}', '{{current_date}}',
                                                '{{basic_monthly}}', '{{basic_annual}}',
                                                '{{da_monthly}}', '{{da_annual}}',
                                                '{{hra_monthly}}', '{{hra_annual}}',
                                                '{{travel_monthly}}', '{{travel_annual}}',
                                                '{{special_monthly}}', '{{special_annual}}',
                                                '{{other_monthly}}', '{{other_annual}}',
                                                '{{gross_monthly}}', '{{gross_annual}}'
                                            ].map(tag => (
                                                <code key={tag} className="px-2 py-1 bg-white border border-blue-100 rounded-md text-[11px] font-medium text-blue-600">{tag}</code>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings Footer */}
                    <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 rounded-b-3xl">
                        {canEdit && (
                            <Button 
                                onClick={handleSaveGeneral} 
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-blue-100 transition-all flex flex-col items-center justify-center gap-0 min-w-[220px]"
                            >
                                <div className="flex items-center gap-2">
                                    <Save size={18} />
                                    <span>Synchronize Policy</span>
                                </div>
                                <span className="text-[10px] opacity-70 font-medium">Apply changes across the system</span>
                            </Button>
                        )}

                        <div className="flex items-center gap-3 text-slate-400">
                            <div className="p-2 bg-white rounded-lg border border-slate-100">
                                <Clock size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Last synchronized on</p>
                                <p className="text-xs font-bold text-slate-600 mt-1">May 24, 2024 • 10:30 AM</p>
                            </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
};
