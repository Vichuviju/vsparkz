import React, { useState, useMemo, useEffect } from "react";
import { 
    Download, 
    Search, 
    Filter, 
    Users, 
    CreditCard, 
    Calculator,
    ShieldCheck,
    Settings,
    Info,
    TrendingUp,
    Wallet,
    Edit2,
    Save,
    Building,
    FileText,
    ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetAllEmployeesQuery, useUpdateEmployeeMutation } from "@/services/hrms/employee.api";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { useGetStatutorySettingsQuery, useCalculateContributionsMutation } from "@/services/hrms/statutory.api";
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

export const PFManagementPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all"); // all, eligible, ineligible
    const [filterDept, setFilterDept] = useState("all");
    
    // Fetch PF settings from backend
    const { data: settingsResponse, isLoading: isSettingsLoading } = useGetStatutorySettingsQuery({ type: 'PF' });
    const pfSettings = settingsResponse || {
        employeeRate: 12,
        employerRate: 12,
        wageCeiling: 15000,
        adminCharges: 0.5,
        edliCharges: 0.5,
        edliAdminCharges: 0
    };

    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: employeesResponse, isLoading } = useGetAllEmployeesQuery({ page, limit, deptId: filterDept, search: searchTerm });
    const { data: deptsResponse } = useGetAllDepartmentsQuery();
    
    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [filterDept, searchTerm]);
    const [updateEmployee] = useUpdateEmployeeMutation();
    const [calculateContributions] = useCalculateContributionsMutation();

    const employees = employeesResponse?.data || [];
    const pagination = employeesResponse?.pagination || { total: 0, totalPages: 1 };

    // Calculate PF details for each employee using backend-calculated values or local calculation
    const employeesWithPf = useMemo(() => {
        return employees.map(emp => {
            const basicSalary = parseFloat(emp.basicSalary) || 0;
            const isEligible = basicSalary > 0 && (emp.pfEligible !== false);
            
            if (!isEligible) {
                return {
                    ...emp,
                    pfWages: 0,
                    pfEmployee: 0,
                    pfEmployer: 0,
                    adminCharges: 0,
                    edliCharges: 0,
                    edliAdminCharges: 0,
                    totalPf: 0,
                    isPfEligible: false,
                    uan: emp.uan || '',
                    pfNumber: emp.pfNumber || ''
                };
            }
            
            // Calculate locally using backend settings
            const wageCeiling = parseFloat(pfSettings.wageCeiling) || 15000;
            const pfWages = Math.min(basicSalary, wageCeiling);
            const employeeRate = parseFloat(pfSettings.employeeRate) || 12;
            const employerRate = parseFloat(pfSettings.employerRate) || 12;
            const adminRate = parseFloat(pfSettings.adminCharges) || 0.5;
            const edliRate = parseFloat(pfSettings.edliCharges) || 0.5;
            const edliAdminRate = parseFloat(pfSettings.edliAdminCharges) || 0;
            
            const pfEmployee = Math.round((pfWages * employeeRate) / 100);
            const pfEmployer = Math.round((pfWages * employerRate) / 100);
            const adminCharges = Math.round((pfWages * adminRate) / 100);
            const edliCharges = Math.round((pfWages * edliRate) / 100);
            const edliAdminCharges = Math.round((pfWages * edliAdminRate) / 100);
            const totalPf = pfEmployee + pfEmployer + adminCharges + edliCharges + edliAdminCharges;
            
            return {
                ...emp,
                pfWages,
                pfEmployee,
                pfEmployer,
                adminCharges,
                edliCharges,
                edliAdminCharges,
                totalPf,
                isPfEligible: true,
                uan: emp.uan || '',
                pfNumber: emp.pfNumber || ''
            };
        });
    }, [employees, pfSettings]);

    const filteredEmployees = employeesWithPf.filter(emp => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (
            (emp.firstName || '').toLowerCase().includes(query) ||
            (emp.lastName || '').toLowerCase().includes(query) ||
            (emp.empCode || '').toLowerCase().includes(query) ||
            (emp.uan || '').toLowerCase().includes(query)
        );

        if (!matchesSearch) return false;
        if (filterStatus === "eligible" && !emp.isPfEligible) return false;
        if (filterStatus === "ineligible" && emp.isPfEligible) return false;
        
        return true;
    });

    const departments = useMemo(() => deptsResponse?.data || [], [deptsResponse]);

    const stats = useMemo(() => {
        const eligible = employeesWithPf.filter(e => e.isPfEligible);
        const totals = eligible.reduce((acc, curr) => ({
            count: acc.count + 1,
            totalWages: acc.totalWages + curr.pfWages,
            totalEE: acc.totalEE + curr.pfEmployee,
            totalER: acc.totalER + curr.pfEmployer,
            totalAdmin: acc.totalAdmin + curr.adminCharges + curr.edliCharges + curr.edliAdminCharges,
            totalLiability: acc.totalLiability + curr.totalPf
        }), { count: 0, totalWages: 0, totalEE: 0, totalER: 0, totalAdmin: 0, totalLiability: 0 });

        return {
            ...totals,
            avgContribution: totals.count > 0 ? Math.round(totals.totalLiability / totals.count) : 0,
            totalCount: employeesWithPf.length,
            eligibleCount: eligible.length
        };
    }, [employeesWithPf]);

    const handleSaveSettings = () => {
        toast.success("PF settings saved to backend (implement admin panel)");
        setIsSettingsOpen(false);
    };

    const handleSaveEmployeePf = async (employeeId, pfData) => {
        try {
            await updateEmployee({
                id: employeeId,
                payload: {
                    employee: {
                        uan: pfData.uan,
                        pfNumber: pfData.pfNumber,
                        pfEligible: pfData.pfEligible
                    }
                }
            }).unwrap();
            toast.success("PF details updated successfully");
            setEditingEmployee(null);
        } catch (error) {
            toast.error("Failed to update PF details");
            
        }
    };

    const handleExport = () => {
        if (!filteredEmployees.length) {
            return toast.error("No data available to export");
        }
        const exportData = filteredEmployees.map(emp => ({
            EmployeeCode: emp.empCode,
            Name: `${emp.firstName} ${emp.lastName}`,
            UAN: emp.uan,
            PFNumber: emp.pfNumber,
            BasicSalary: emp.basicSalary,
            PFWages: emp.pfWages,
            EEContribution: emp.pfEmployee,
            ERContribution: emp.pfEmployer,
            AdminCharges: emp.adminCharges,
            TotalPF: emp.totalPf,
            IsEligible: emp.isPfEligible ? 'Yes' : 'No'
        }));
        exportToCSV(exportData, `PF_Employee_Master_${new Date().toISOString().split('T')[0]}`);
        toast.success("PF Master data exported");
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
                    <p className="text-xs text-gray-400 font-medium">Manage employee PF contributions and UAN details</p>
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
                <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} className="text-blue-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Employees</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalCount}</h3>
                    <p className="text-xs text-gray-400 mt-2">{stats.eligibleCount} PF eligible</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={64} className="text-blue-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total PF Wages</p>
                    <h3 className="text-3xl font-bold text-blue-600">₹{stats.totalWages.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Subject to ceiling ₹{pfSettings.wageCeiling.toLocaleString()}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CreditCard size={64} className="text-emerald-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">EE ({pfSettings.employeeRate}%)</p>
                    <h3 className="text-3xl font-bold text-emerald-600">₹{stats.totalEE.toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Employee contribution</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building size={64} className="text-orange-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">ER + Admin ({pfSettings.employerRate + pfSettings.adminCharges}%)</p>
                    <h3 className="text-3xl font-bold text-orange-600">₹{(stats.totalER + stats.totalAdmin).toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-2">Employer liability</p>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-white/80">Projected Monthly PF Liability</p>
                            <h3 className="text-2xl font-bold">₹{stats.totalLiability.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                            <p className="text-white/70">Avg. per Eligible</p>
                            <p className="font-bold">₹{stats.avgContribution.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/70">Total Admin Charges</p>
                            <p className="font-bold">₹{stats.totalAdmin.toLocaleString()}</p>
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
                            placeholder="Search by name or code..." 
                            className="pl-10 rounded-xl"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("text-gray-500", filterStatus !== 'all' && "text-blue-600 border-blue-200 bg-blue-50")}>
                                    <Filter size={16} className="mr-2" /> 
                                    {filterStatus === 'all' ? 'More Filters' : 
                                     filterStatus === 'eligible' ? 'Eligible Only' : 'Not Eligible'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                                    All Employees
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus('eligible')}>
                                    PF Eligible Only
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setFilterStatus('ineligible')}>
                                    Not Eligible
                                </DropdownMenuItem>
                                {departments.length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-100 my-1" />
                                        <div className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Departments</div>
                                        <DropdownMenuItem onClick={() => setFilterDept('all')} className={cn(filterDept === 'all' && "bg-blue-50 text-blue-600")}>
                                            All Departments
                                        </DropdownMenuItem>
                                        {departments.map(dept => (
                                            <DropdownMenuItem 
                                                key={dept.id} 
                                                onClick={() => setFilterDept(dept.id)}
                                                className={cn(filterDept === dept.id && "bg-blue-50 text-blue-600")}
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
                                <th className="px-4 py-4">PF Details</th>
                                <th className="px-4 py-4 text-right">Basic Salary</th>
                                <th className="px-4 py-4 text-right">PF Wages</th>
                                <th className="px-4 py-4 text-right text-emerald-700">EE ({pfSettings.employeeRate}%)</th>
                                <th className="px-4 py-4 text-right text-orange-700">ER ({pfSettings.employerRate}%)</th>
                                <th className="px-4 py-4 text-right text-blue-700">Admin</th>
                                <th className="px-4 py-4 text-right font-bold text-gray-900">Total</th>
                                <th className="px-4 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={9} className="px-6 py-4 h-12 bg-gray-50/50"></td>
                                    </tr>
                                ))
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
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
                                                <p className="text-xs text-gray-500">UAN: <span className="font-medium text-gray-700">{emp.uan || 'Not set'}</span></p>
                                                <p className="text-xs text-gray-500">PF No: <span className="font-medium text-gray-700">{emp.pfNumber || 'Not set'}</span></p>
                                                <span className={cn(
                                                    "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                    emp.isPfEligible 
                                                        ? "bg-emerald-50 text-emerald-700" 
                                                        : "bg-gray-100 text-gray-500"
                                                )}>
                                                    {emp.isPfEligible ? 'PF Eligible' : 'Not Eligible'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium text-gray-700">₹{emp.basicSalary?.toLocaleString() || 0}</td>
                                        <td className="px-4 py-4 text-right font-medium text-blue-600">₹{emp.pfWages.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right text-emerald-600 font-semibold">₹{emp.pfEmployee.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right text-orange-600 font-semibold">₹{emp.pfEmployer.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right text-blue-600">₹{emp.adminCharges.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-right font-bold text-gray-900">₹{emp.totalPf.toLocaleString()}</td>
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                onClick={() => setEditingEmployee(emp)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        No employees found. Add employees to manage their PF details.
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

            {/* Employee PF Edit Dialog */}
            {editingEmployee && (
                <EmployeePfEditDialog 
                    employee={editingEmployee}
                    onClose={() => setEditingEmployee(null)}
                    onSave={handleSaveEmployeePf}
                    pfSettings={pfSettings}
                />
            )}

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings size={20} />
                            PF Configuration Settings
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Employee Rate (%)</label>
                                <input
                                    type="number"
                                    value={pfSettings.employeeRate}
                                    onChange={(e) => setPfSettings({...pfSettings, employeeRate: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Employer Rate (%)</label>
                                <input
                                    type="number"
                                    value={pfSettings.employerRate}
                                    onChange={(e) => setPfSettings({...pfSettings, employerRate: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Wage Ceiling (₹)</label>
                            <input
                                type="number"
                                value={pfSettings.wageCeiling}
                                onChange={(e) => setPfSettings({...pfSettings, wageCeiling: Number(e.target.value)})}
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-gray-500">Maximum wages subject to PF contribution</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Admin Charges (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={pfSettings.adminCharges}
                                    onChange={(e) => setPfSettings({...pfSettings, adminCharges: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">EDLI Charges (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={pfSettings.edliCharges}
                                    onChange={(e) => setPfSettings({...pfSettings, edliCharges: Number(e.target.value)})}
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <Button onClick={handleSaveSettings} className="w-full bg-blue-600 hover:bg-blue-700">
                                Save Configuration
                            </Button>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                            <Info size={14} className="mt-0.5 flex-shrink-0" />
                            <p>These settings are stored locally and used for display calculations. Actual payroll processing uses backend configuration.</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// Employee PF Edit Dialog Component
const EmployeePfEditDialog = ({ employee, onClose, onSave, pfSettings }) => {
    const [formData, setFormData] = useState({
        uan: employee.uan || '',
        pfNumber: employee.pfNumber || '',
        pfEligible: employee.isPfEligible,
        basicSalary: employee.basicSalary || 0
    });
    const [errors, setErrors] = useState({});
    
    // Validate UAN - must be exactly 12 digits
    const validateUAN = (uan) => {
        if (!uan) return null; // Optional field
        if (!/^\d{12}$/.test(uan)) {
            return "UAN must be exactly 12 digits";
        }
        return null;
    };
    
    const handleUANChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 12); // Only digits, max 12
        setFormData({...formData, uan: value});
        const error = validateUAN(value);
        setErrors({...errors, uan: error});
    };
    
    const handleSave = () => {
        const uanError = validateUAN(formData.uan);
        if (uanError) {
            setErrors({...errors, uan: uanError});
            toast.error("Please fix validation errors");
            return;
        }
        onSave(employee.id, formData);
    };

    const pfWages = Math.min(Number(formData.basicSalary), pfSettings.wageCeiling);
    const projectedEE = Math.round(pfWages * pfSettings.employeeRate / 100);
    const projectedER = Math.round(pfWages * pfSettings.employerRate / 100);
    const projectedAdmin = Math.round(pfWages * pfSettings.adminCharges / 100);
    const projectedTotal = projectedEE + projectedER + projectedAdmin;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit2 size={20} />
                        Edit PF Details - {employee.firstName} {employee.lastName}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                UAN 
                                <span className="text-xs text-gray-400 ml-1">(12 digits)</span>
                            </label>
                            <input
                                type="text"
                                value={formData.uan}
                                onChange={handleUANChange}
                                placeholder="Enter 12-digit UAN"
                                maxLength={12}
                                className={cn(
                                    "w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors",
                                    errors.uan 
                                        ? "border-red-300 focus:ring-2 focus:ring-red-500 bg-red-50" 
                                        : "focus:ring-2 focus:ring-blue-500"
                                )}
                            />
                            {errors.uan && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <Info size={12} /> {errors.uan}
                                </p>
                            )}
                            {formData.uan && !errors.uan && formData.uan.length === 12 && (
                                <p className="text-xs text-emerald-600 flex items-center gap-1">
                                    <ShieldCheck size={12} /> Valid UAN format
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">PF Number</label>
                            <input
                                type="text"
                                value={formData.pfNumber}
                                onChange={(e) => setFormData({...formData, pfNumber: e.target.value})}
                                placeholder="Enter PF Number"
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Basic Salary</label>
                        <input
                            type="number"
                            value={formData.basicSalary}
                            readOnly
                            className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                        />
                        <p className="text-xs text-gray-500">Basic salary can be updated from Employee Master</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.pfEligible}
                            onChange={(e) => setFormData({...formData, pfEligible: e.target.checked})}
                            className="w-4 h-4 text-blue-600 rounded"
                        />
                        <label className="text-sm font-medium text-gray-700">PF Eligible</label>
                    </div>

                    {/* Projected Calculation Preview */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700">Projected Monthly PF Calculation</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">PF Wages</p>
                                <p className="font-semibold text-gray-900">₹{pfWages.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">EE ({pfSettings.employeeRate}%)</p>
                                <p className="font-semibold text-emerald-600">₹{projectedEE.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">ER ({pfSettings.employerRate}%)</p>
                                <p className="font-semibold text-orange-600">₹{projectedER.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Admin ({pfSettings.adminCharges}%)</p>
                                <p className="font-semibold text-blue-600">₹{projectedAdmin.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                            <p className="text-gray-500 text-sm">Total Monthly PF</p>
                            <p className="text-xl font-bold text-gray-900">₹{projectedTotal.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t flex gap-3">
                        <Button 
                            onClick={handleSave}
                            disabled={errors.uan}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
