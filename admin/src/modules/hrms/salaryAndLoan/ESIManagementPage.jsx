import React, { useState, useMemo, useEffect } from "react";
import { 
    Download, 
    Search, 
    Filter, 
    Users, 
    CreditCard, 
    Activity,
    Settings,
    Info,
    TrendingUp,
    Wallet,
    HeartPulse,
    Edit2,
    Save,
    ShieldCheck,
    FileText,
    ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetAllEmployeesQuery, useUpdateEmployeeMutation } from "@/services/hrms/employee.api";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { useGetStatutorySettingsQuery, useCreateStatutorySettingsMutation, useUpdateStatutorySettingsMutation } from "@/services/hrms/statutory.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const ESIManagementPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all"); // all, eligible, above_ceiling
    const [filterDept, setFilterDept] = useState("all");
    
    const [page, setPage] = useState(1);
    const limit = 10;
    
    // Fetch ESI settings from backend
    const { data: settingsResponse, isLoading: isSettingsLoading, refetch: refetchSettings } = useGetStatutorySettingsQuery({ type: 'ESI' });
    const [createStatutorySettings, { isLoading: isCreatingSettings }] = useCreateStatutorySettingsMutation();
    const [updateStatutorySettings, { isLoading: isUpdatingSettings }] = useUpdateStatutorySettingsMutation();
    
    const esiSettings = settingsResponse || {
        employeeRate: 0.75,
        employerRate: 3.25,
        wageCeiling: 21000
    };
    
    // Local state for editing settings - initialize when dialog opens
    const [localSettings, setLocalSettings] = useState(esiSettings);
    
    // Update local settings when dialog opens
    useMemo(() => {
        if (isSettingsOpen) {
            setLocalSettings(esiSettings);
        }
    }, [isSettingsOpen, esiSettings]);

    const { data: employeesResponse, isLoading } = useGetAllEmployeesQuery({ page, limit, deptId: filterDept, search: searchTerm });
    const { data: deptsResponse } = useGetAllDepartmentsQuery();
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [filterDept, searchTerm]);
    const [updateEmployee] = useUpdateEmployeeMutation();

    const employees = employeesResponse?.data || [];
    const pagination = employeesResponse?.pagination || { total: 0, totalPages: 1 };

    // Calculate ESI details for each employee
    const employeesWithEsi = useMemo(() => {
        return employees.map(emp => {
            // Calculate Gross Salary = Basic + all allowances
            const basic = parseFloat(emp.basicSalary) || 0;
            const da = parseFloat(emp.da) || 0;
            const hra = parseFloat(emp.hraAllowance) || 0;
            const special = parseFloat(emp.specialAllowance) || 0;
            const other = parseFloat(emp.otherAllowance) || 0;
            const travel = parseFloat(emp.travelAllowance) || 0;
            const grossSalary = basic + da + hra + special + other + travel;
            const finalGross = parseFloat(emp.totalSalary) || grossSalary;
            const wageCeiling = parseFloat(esiSettings.wageCeiling) || 21000;
            const isEligible = finalGross > 0 && finalGross <= wageCeiling && (emp.esiEligible !== false);
            
            if (!isEligible) {
                return {
                    ...emp,
                    grossSalary: finalGross,
                    esiWages: 0,
                    esiEmployee: 0,
                    esiEmployer: 0,
                    totalEsi: 0,
                    isEsiEligible: false,
                    esiNumber: emp.esiNumber || '',
                    ineligibilityReason: finalGross > wageCeiling ? 'Above ceiling' : 'Not eligible'
                };
            }
            
            const employeeRate = parseFloat(esiSettings.employeeRate) || 0.75;
            const employerRate = parseFloat(esiSettings.employerRate) || 3.25;
            
            const esiWages = finalGross;
            const esiEmployee = Math.ceil((esiWages * employeeRate) / 100);
            const esiEmployer = Math.ceil((esiWages * employerRate) / 100);
            const totalEsi = esiEmployee + esiEmployer;
            
            return {
                ...emp,
                grossSalary: finalGross,
                esiWages,
                esiEmployee,
                esiEmployer,
                totalEsi,
                isEsiEligible: true,
                esiNumber: emp.esiNumber || ''
            };
        });
    }, [employees, esiSettings]);

    const filteredEmployees = employeesWithEsi.filter(emp => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (
            (emp.firstName || '').toLowerCase().includes(query) ||
            (emp.lastName || '').toLowerCase().includes(query) ||
            (emp.empCode || '').toLowerCase().includes(query) ||
            (emp.esiNumber || '').toLowerCase().includes(query)
        );

        if (!matchesSearch) return false;
        if (filterStatus === "eligible" && !emp.isEsiEligible) return false;
        if (filterStatus === "above_ceiling" && emp.isEsiEligible) return false;
        
        return true;
    });

    const departments = useMemo(() => deptsResponse?.data || [], [deptsResponse]);

    const stats = useMemo(() => {
        const eligible = employeesWithEsi.filter(e => e.isEsiEligible);
        const ineligible = employeesWithEsi.filter(e => !e.isEsiEligible && e.esiWages === 0);
        const totals = eligible.reduce((acc, curr) => ({
            count: acc.count + 1,
            totalGross: acc.totalGross + curr.esiWages,
            totalEE: acc.totalEE + curr.esiEmployee,
            totalER: acc.totalER + curr.esiEmployer,
            totalLiability: acc.totalLiability + curr.totalEsi
        }), { count: 0, totalGross: 0, totalEE: 0, totalER: 0, totalLiability: 0 });

        return {
            ...totals,
            avgContribution: totals.count > 0 ? Math.round(totals.totalLiability / totals.count) : 0,
            totalCount: employeesWithEsi.length,
            eligibleCount: eligible.length,
            ineligibleCount: ineligible.length
        };
    }, [employeesWithEsi]);

    const handleSaveSettings = async () => {
        try {
            if (settingsResponse) {
                await updateStatutorySettings({
                    id: settingsResponse.id,
                    type: 'ESI',
                    employeeRate: localSettings.employeeRate,
                    employerRate: localSettings.employerRate,
                    wageCeiling: localSettings.wageCeiling,
                    effectiveFrom: new Date().toISOString().split('T')[0],
                    description: 'ESI Configuration'
                }).unwrap();
            } else {
                await createStatutorySettings({
                    type: 'ESI',
                    employeeRate: localSettings.employeeRate,
                    employerRate: localSettings.employerRate,
                    wageCeiling: localSettings.wageCeiling,
                    effectiveFrom: new Date().toISOString().split('T')[0],
                    description: 'ESI Configuration'
                }).unwrap();
            }
            toast.success("ESI settings saved successfully");
            refetchSettings();
            setIsSettingsOpen(false);
        } catch (error) {
            toast.error("Failed to save ESI settings");
            
        }
    };

    const handleSaveEmployeeEsi = async (employeeId, esiData) => {
        try {
            await updateEmployee({
                id: employeeId,
                payload: {
                    employee: {
                        esiNumber: esiData.esiNumber,
                        esiEligible: esiData.esiEligible
                    }
                }
            }).unwrap();
            toast.success("ESI details updated successfully");
            setEditingEmployee(null);
        } catch (error) {
            toast.error("Failed to update ESI details");
            
        }
    };

    const handleExport = () => {
        if (!filteredEmployees.length) {
            return toast.error("No data available to export");
        }
        const exportData = filteredEmployees.map(emp => ({
            EmployeeCode: emp.empCode,
            Name: `${emp.firstName} ${emp.lastName}`,
            ESINumber: emp.esiNumber,
            GrossSalary: emp.totalSalary || emp.basicSalary,
            ESIWages: emp.esiWages,
            EEContribution: emp.esiEmployee,
            ERContribution: emp.esiEmployer,
            TotalESI: emp.totalEsi,
            IsEligible: emp.isEsiEligible ? 'Yes' : 'No'
        }));
        exportToCSV(exportData, `ESI_Employee_Master_${new Date().toISOString().split('T')[0]}`);
        toast.success("ESI Master data exported");
    };


    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                    >
                        <ChevronLeft size={20} className="text-gray-500" />
                    </button>
                    <p className="text-xs text-gray-400 font-medium">Manage employee ESI eligibility and contributions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsSettingsOpen(true)}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Settings size={16} /> Configure %
                    </Button>
                    <Button 
                        onClick={handleExport}
                        variant="outline" 
                        className="flex items-center gap-2"
                    >
                        <Download size={16} /> Export Master
                    </Button>
                </div>
            </div>

            {/* KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} className="text-rose-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Employees</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalCount}</h3>
                    <p className="text-xs text-gray-400 mt-2">{stats.eligibleCount} ESI eligible, {stats.ineligibleCount} above limit</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={64} className="text-blue-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total ESI Wages</p>
                    <h3 className="text-3xl font-bold text-blue-600">₹{stats.totalGross.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Subject to ceiling ₹{esiSettings.wageCeiling?.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard size={64} className="text-emerald-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">EE ({esiSettings.employeeRate}%)</p>
                    <h3 className="text-3xl font-bold text-emerald-600">₹{stats.totalEE.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Employee contribution</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <HeartPulse size={64} className="text-rose-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">ER ({esiSettings.employerRate}%)</p>
                    <h3 className="text-3xl font-bold text-rose-600">₹{stats.totalER.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Employer contribution</p>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-white/80">Projected Monthly ESI Liability</p>
                            <h3 className="text-2xl font-bold">₹{stats.totalLiability.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                            <p className="text-white/70">Avg. per Eligible</p>
                            <p className="font-bold">₹{stats.avgContribution.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/70">Eligible / Total</p>
                            <p className="font-bold">{stats.eligibleCount} / {stats.totalCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, code, or ESI number..." 
                            className="pl-10 rounded-xl"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("text-gray-500", filterStatus !== 'all' && "text-rose-600 border-rose-200 bg-rose-50")}>
                                    <Filter size={16} className="mr-2" /> 
                                    {filterStatus === 'all' ? 'More Filters' : 
                                     filterStatus === 'eligible' ? 'Eligible Only' : 'Above Ceiling'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                                    All Employees
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus('eligible')}>
                                    ESI Eligible Only
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus('above_ceiling')}>
                                    Above Ceiling (&gt;₹21k)
                                </DropdownMenuItem>
                                {departments.length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-100 my-1" />
                                        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Departments</div>
                                        <DropdownMenuItem onClick={() => setFilterDept('all')} className={cn(filterDept === 'all' && "bg-rose-50 text-rose-600")}>
                                            All Departments
                                        </DropdownMenuItem>
                                        {departments.map(dept => (
                                            <DropdownMenuItem 
                                                key={dept.id} 
                                                onClick={() => setFilterDept(dept.id)}
                                                className={cn(filterDept === dept.id && "bg-rose-50 text-rose-600")}
                                            >
                                                {dept.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="px-4 py-4">Employee</th>
                                <th className="px-4 py-4">ESI Details</th>
                                <th className="px-4 py-4 text-right">
                                    <span className="block">Gross Salary</span>
                                    <span className="block text-[10px] font-normal text-gray-400">Basic + Allowances</span>
                                </th>
                                <th className="px-4 py-4 text-right">ESI Wages</th>
                                <th className="px-4 py-4 text-right text-emerald-700">EE ({esiSettings.employeeRate}%)</th>
                                <th className="px-4 py-4 text-right text-rose-700">ER ({esiSettings.employerRate}%)</th>
                                <th className="px-4 py-4 text-right font-bold text-gray-900">Total</th>
                                <th className="px-4 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-4 h-12 bg-gray-50/50"></td>
                                    </tr>
                                ))
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                                                    <p className="text-xs text-gray-500">{emp.empCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="space-y-1">
                                                <p className="text-xs text-gray-500">ESI No: <span className="font-medium text-gray-700">{emp.esiNumber || 'Not set'}</span></p>
                                                <span className={cn(
                                                    "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    emp.isEsiEligible 
                                                        ? "bg-emerald-50 text-emerald-700" 
                                                        : "bg-gray-100 text-gray-500"
                                                )}>
                                                    {emp.isEsiEligible ? 'ESI Eligible' : emp.ineligibilityReason}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-gray-700">₹{(emp.totalSalary || emp.basicSalary || 0).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right font-medium text-blue-600">₹{emp.esiWages.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right text-emerald-600 font-semibold">₹{emp.esiEmployee.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right text-rose-600 font-semibold">₹{emp.esiEmployer.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right font-bold text-gray-900">₹{emp.totalEsi.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                onClick={() => setEditingEmployee(emp)}
                                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No employees found. Add employees to manage their ESI details.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                    <p className="text-xs text-gray-500">Showing {employees.length} of {pagination.total} employees</p>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white"
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Employee ESI Edit Dialog */}
            {editingEmployee && (
                <EmployeeEsiEditDialog 
                    employee={editingEmployee}
                    onClose={() => setEditingEmployee(null)}
                    onSave={handleSaveEmployeeEsi}
                    esiSettings={esiSettings}
                />
            )}

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings size={20} />
                            ESI Configuration Settings
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Employee Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localSettings.employeeRate}
                                    onChange={(e) => setLocalSettings({...localSettings, employeeRate: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Employer Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={localSettings.employerRate}
                                    onChange={(e) => setLocalSettings({...localSettings, employerRate: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Wage Ceiling / Eligibility Limit (₹)</label>
                            <input
                                type="number"
                                value={localSettings.wageCeiling}
                                onChange={(e) => setLocalSettings({
                                    ...localSettings, 
                                    wageCeiling: Number(e.target.value),
                                    eligibilityThreshold: Number(e.target.value)
                                })}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                            <p className="text-xs text-gray-500">Employees earning above this limit are not eligible for ESI</p>
                        </div>
                        <div className="pt-4 border-t">
                            <Button 
                                onClick={handleSaveSettings} 
                                disabled={isCreatingSettings || isUpdatingSettings}
                                className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                            >
                                {isCreatingSettings || isUpdatingSettings ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                            <Info size={14} className="mt-0.5 flex-shrink-0" />
                            <p>These settings are saved to the backend and will be used for payroll processing. Changes take effect immediately for new payroll runs.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Employee ESI Edit Dialog Component
const EmployeeEsiEditDialog = ({ employee, onClose, onSave, esiSettings }) => {
    const [formData, setFormData] = useState({
        esiNumber: '',
        esiEligible: false,
        grossSalary: 0
    });
    const [errors, setErrors] = useState({});
    
    // Reset form data when employee changes (dialog opens for different employee)
    useEffect(() => {
        setFormData({
            esiNumber: employee.esiNumber || '',
            esiEligible: employee.isEsiEligible,
            grossSalary: employee.totalSalary || employee.basicSalary || 0
        });
        setErrors({});
    }, [employee.id, employee.esiNumber, employee.isEsiEligible, employee.totalSalary, employee.basicSalary]);
    
    // Validate ESI Number - typically 10-17 digits
    const validateESINumber = (num) => {
        if (!num) return null; // Optional field
        if (!/^\d{10,17}$/.test(num)) {
            return "ESI Number must be 10-17 digits";
        }
        return null;
    };
    
    const handleESIChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 17); // Only digits, max 17
        setFormData({...formData, esiNumber: value});
        const error = validateESINumber(value);
        setErrors({...errors, esiNumber: error});
    };
    
    const handleSave = () => {
        const esiError = validateESINumber(formData.esiNumber);
        if (esiError) {
            setErrors({...errors, esiNumber: esiError});
            toast.error("Please fix validation errors");
            return;
        }
        onSave(employee.id, formData);
    };

    const wageCeiling = parseFloat(esiSettings.wageCeiling) || 21000;
    const isEligible = parseFloat(formData.grossSalary) <= wageCeiling && formData.esiEligible;
    
    const employeeRate = parseFloat(esiSettings.employeeRate) || 0.75;
    const employerRate = parseFloat(esiSettings.employerRate) || 3.25;
    
    const projectedWages = isEligible ? parseFloat(formData.grossSalary) : 0;
    const projectedEE = isEligible ? Math.ceil((projectedWages * employeeRate) / 100) : 0;
    const projectedER = isEligible ? Math.ceil((projectedWages * employerRate) / 100) : 0;
    const projectedTotal = projectedEE + projectedER;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit2 size={20} />
                        Edit ESI Details - {employee.firstName} {employee.lastName}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            ESI Number 
                            <span className="text-xs text-gray-400 ml-1">(10-17 digits)</span>
                        </label>
                        <input
                            type="text"
                            value={formData.esiNumber}
                            onChange={handleESIChange}
                            placeholder="Enter ESI Number"
                            maxLength={17}
                            className={cn(
                                "w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors",
                                errors.esiNumber 
                                    ? "border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50" 
                                    : "focus:ring-2 focus:ring-rose-500"
                            )}
                        />
                        {errors.esiNumber && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                                <Info size={12} /> {errors.esiNumber}
                            </p>
                        )}
                        {formData.esiNumber && !errors.esiNumber && formData.esiNumber.length >= 10 && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                                <ShieldCheck size={12} /> Valid ESI Number format
                            </p>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            Gross Salary
                            <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">For ESI</span>
                        </label>
                        <input
                            type="number"
                            value={formData.grossSalary}
                            readOnly
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                        />
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                            <p className="font-medium text-gray-700 mb-1">Gross = Basic + All Allowances</p>
                            <p>Basic: ₹{employee.basicSalary || 0}</p>
                            {employee.da > 0 && <p>+ DA: ₹{employee.da}</p>}
                            {employee.hraAllowance > 0 && <p>+ HRA: ₹{employee.hraAllowance}</p>}
                            {employee.specialAllowance > 0 && <p>+ Special: ₹{employee.specialAllowance}</p>}
                            {employee.otherAllowance > 0 && <p>+ Other: ₹{employee.otherAllowance}</p>}
                            <p className="text-gray-400 mt-1 italic">Update from Employee Master</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.esiEligible}
                            onChange={(e) => setFormData({...formData, esiEligible: e.target.checked})}
                            className="w-4 h-4 text-rose-600 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">ESI Eligible</label>
                    </div>

                    {/* Projected Calculation Preview */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Projected Monthly ESI Calculation</p>
                        {isEligible ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">ESI Wages</p>
                                        <p className="font-semibold text-gray-900">₹{projectedWages.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">EE ({esiSettings.employeeRate}%)</p>
                                        <p className="font-semibold text-emerald-600">₹{projectedEE.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">ER ({esiSettings.employerRate}%)</p>
                                        <p className="font-semibold text-rose-600">₹{projectedER.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                    <p className="text-gray-500 text-sm">Total Monthly ESI</p>
                                    <p className="text-xl font-bold text-gray-900">₹{projectedTotal.toLocaleString()}</p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-gray-500">Not eligible for ESI</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {parseFloat(formData.grossSalary) > wageCeiling 
                                        ? `Gross salary exceeds ceiling of ₹${wageCeiling.toLocaleString()}` 
                                        : 'ESI eligibility is disabled'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t flex gap-3">
                        <Button 
                            onClick={handleSave}
                            disabled={errors.esiNumber}
                            className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                        >
                            <Save size={16} className="mr-2" /> Save Changes
                        </Button>
                        <Button 
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
