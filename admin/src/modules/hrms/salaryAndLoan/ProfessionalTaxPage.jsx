import React, { useState, useMemo } from "react";
import { 
    Download, 
    Search, 
    Filter, 
    Users, 
    Calculator,
    ShieldCheck,
    Settings,
    Info,
    TrendingUp,
    Wallet,
    Edit2,
    Save,
    ChevronLeft,
    Plus,
    Trash2,
    Zap,
    Scale
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { 
    useGetAllStatutorySettingsQuery, 
    useCreateStatutorySettingsMutation,
    useUpdateStatutorySettingsMutation
} from "@/services/hrms/statutory.api";
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

export const ProfessionalTaxPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAddSlabOpen, setIsAddSlabOpen] = useState(false);
    const [editingSlab, setEditingSlab] = useState(null);
    const [newSlab, setNewSlab] = useState({ wageCeiling: "", amount: "" });
    const [page, setPage] = useState(1);
    const limit = 10;
    const [filterDept, setFilterDept] = useState("all");

    const { data: employeesResponse, isLoading: isEmployeesLoading } = useGetAllEmployeesQuery({ page, limit, deptId: filterDept, search: searchTerm });
    const { data: deptsResponse } = useGetAllDepartmentsQuery();
    
    // Reset to page 1 when filters change
    React.useEffect(() => {
        setPage(1);
    }, [filterDept, searchTerm]);
    const { data: allSettings, isLoading: isSettingsLoading } = useGetAllStatutorySettingsQuery();
    const [createSettings, { isLoading: isCreating }] = useCreateStatutorySettingsMutation();
    const [updateSettings] = useUpdateStatutorySettingsMutation();

    const employees = employeesResponse?.data || [];
    const pagination = employeesResponse?.pagination || { total: 0, totalPages: 1 };
    const ptSlabs = (allSettings || [])
        .filter(s => s.type === 'PT' && s.isActive === 'true')
        .sort((a, b) => Number(a.wageCeiling) - Number(b.wageCeiling));

    // Helper to calculate PT based on slabs
    const calculatePT = (gross, slabs) => {
        if (!slabs || slabs.length === 0) return 0;
        const sorted = [...slabs].sort((a, b) => Number(b.wageCeiling) - Number(a.wageCeiling));
        const slab = sorted.find(s => gross >= Number(s.wageCeiling));
        return slab ? Number(slab.employeeRate) : 0;
    };

    const employeesWithPT = useMemo(() => {
        return employees.map(emp => {
            const basic = parseFloat(emp.basicSalary) || 0;
            const da = parseFloat(emp.da) || 0;
            const hra = parseFloat(emp.hraAllowance) || 0;
            const special = parseFloat(emp.specialAllowance) || 0;
            const other = parseFloat(emp.otherAllowance) || 0;
            const travel = parseFloat(emp.travelAllowance) || 0;
            const grossSalary = basic + da + hra + special + other + travel;
            const finalGross = parseFloat(emp.totalSalary) || grossSalary;
            
            const ptDeduction = calculatePT(finalGross, ptSlabs);
            
            return {
                ...emp,
                grossSalary: finalGross,
                ptDeduction,
            };
        });
    }, [employees, ptSlabs]);

    const filteredEmployees = employeesWithPT.filter(emp => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (
            (emp.firstName || '').toLowerCase().includes(query) ||
            (emp.lastName || '').toLowerCase().includes(query) ||
            (emp.empCode || '').toLowerCase().includes(query)
        );

        if (!matchesSearch) return false;
        
        return true;
    });

    const departments = useMemo(() => {
        return deptsResponse?.data || [];
    }, [deptsResponse]);

    const stats = useMemo(() => {
        const totals = employeesWithPT.reduce((acc, curr) => ({
            count: acc.count + 1,
            totalGross: acc.totalGross + curr.grossSalary,
            totalPT: acc.totalPT + curr.ptDeduction,
            withDeduction: acc.withDeduction + (curr.ptDeduction > 0 ? 1 : 0)
        }), { count: 0, totalGross: 0, totalPT: 0, withDeduction: 0 });

        return {
            ...totals,
            avgPT: totals.withDeduction > 0 ? Math.round(totals.totalPT / totals.withDeduction) : 0,
        };
    }, [employeesWithPT]);

    const handleSaveSlab = async () => {
        if (!newSlab.wageCeiling || !newSlab.amount) {
            return toast.error("Please fill all fields");
        }

        try {
            if (editingSlab) {
                await updateSettings({
                    id: editingSlab.id,
                    wageCeiling: Number(newSlab.wageCeiling),
                    employeeRate: Number(newSlab.amount),
                    description: `PT Slab: Above ₹${newSlab.wageCeiling}`
                }).unwrap();
                toast.success("Slab updated successfully");
            } else {
                await createSettings({
                    type: 'PT',
                    wageCeiling: Number(newSlab.wageCeiling),
                    employeeRate: Number(newSlab.amount),
                    employerRate: 0,
                    effectiveFrom: new Date().toISOString().split('T')[0],
                    description: `PT Slab: Above ₹${newSlab.wageCeiling}`,
                    isActive: 'true'
                }).unwrap();
                toast.success("Slab added successfully");
            }
            
            setIsAddSlabOpen(false);
            setNewSlab({ wageCeiling: "", amount: "" });
            setEditingSlab(null);
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleToggleStatus = async (slab) => {
        try {
            await updateSettings({
                id: slab.id,
                isActive: slab.isActive === 'true' ? 'false' : 'true'
            }).unwrap();
            toast.success("Slab visibility updated");
        } catch (error) {
            toast.error("Status update failed");
        }
    };

    const handleExport = () => {
        if (!filteredEmployees.length) {
            return toast.error("No data available to export");
        }
        const exportData = filteredEmployees.map(emp => ({
            EmployeeCode: emp.empCode,
            Name: `${emp.firstName} ${emp.lastName}`,
            GrossSalary: emp.grossSalary,
            PTDeduction: emp.ptDeduction,
            Department: emp.departmentName
        }));
        exportToCSV(exportData, `PT_Employee_Master_${new Date().toISOString().split('T')[0]}`);
        toast.success("PT Master data exported");
    };

    const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
                    >
                        <ChevronLeft size={20} className="text-gray-500" />
                    </button>
                    <div>
                        {/* Title handled by global header */}
                        <p className="text-xs text-gray-400 font-medium">Manage professional tax slabs and employee deductions</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setIsSettingsOpen(true)}
                        variant="outline"
                        className="flex items-center gap-2 border-gray-200"
                    >
                        <Settings size={16} /> Configure Slabs
                    </Button>
                    <Button 
                        onClick={handleExport}
                        variant="outline" 
                        className="flex items-center gap-2 border-gray-200"
                    >
                        <Download size={16} /> Export Master
                    </Button>
                </div>
            </div>

            {/* KPI Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={64} className="text-amber-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Employees</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.count}</h3>
                    <p className="text-xs text-gray-400 mt-2">{stats.withDeduction} employees eligible for PT</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={64} className="text-blue-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Monthly Gross</p>
                    <h3 className="text-3xl font-bold text-blue-600">₹{fmt(stats.totalGross)}</h3>
                    <p className="text-xs text-gray-400 mt-2">Aggregate of all eligible components</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calculator size={64} className="text-amber-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Active Slabs</p>
                    <h3 className="text-3xl font-bold text-amber-600">{ptSlabs.length}</h3>
                    <p className="text-xs text-gray-400 mt-2">Based on current statutory matrix</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} className="text-emerald-900" />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Avg. PT Deduction</p>
                    <h3 className="text-3xl font-bold text-emerald-600">₹{fmt(stats.avgPT)}</h3>
                    <p className="text-xs text-gray-400 mt-2">Per eligible employee</p>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Scale size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-white/80">Projected Monthly PT Liability</p>
                            <h3 className="text-2xl font-bold">₹{fmt(stats.totalPT)}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                            <p className="text-white/70">Total Headcount</p>
                            <p className="font-bold">{stats.count}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/70">Deduction Frequency</p>
                            <p className="font-bold">Monthly / Slab-Based</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name or code..." 
                            className="pl-10 rounded-xl border-gray-200"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("text-gray-500", filterDept !== 'all' && "text-amber-600 border-amber-200 bg-amber-50")}>
                                    <Filter size={16} className="mr-2" /> 
                                    {filterDept === 'all' ? 'Filter by Dept' : departments.find(d => d.id === filterDept)?.name || 'Filter by Dept'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setFilterDept('all')}>
                                    All Departments
                                </DropdownMenuItem>
                                {departments.length > 0 && (
                                    <>
                                        <div className="h-px bg-gray-100 my-1" />
                                        {departments.map(dept => (
                                            <DropdownMenuItem 
                                                key={dept.id} 
                                                onClick={() => setFilterDept(dept.id)}
                                                className={cn(filterDept === dept.id && "bg-amber-50 text-amber-600")}
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
                        <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">PT Details</th>
                                <th className="px-6 py-4 text-right">Gross Salary</th>
                                <th className="px-6 py-4 text-right text-amber-700">PT Deduction</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {(isEmployeesLoading || isSettingsLoading) ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-16 bg-gray-50/30"></td>
                                    </tr>
                                ))
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{emp.firstName} {emp.lastName}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-tight">{emp.empCode}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <span className={cn(
                                                    "inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight",
                                                    emp.ptDeduction > 0 
                                                        ? "bg-emerald-50 text-emerald-700" 
                                                        : "bg-gray-100 text-gray-500"
                                                )}>
                                                    {emp.ptDeduction > 0 ? 'Deduction Applicable' : 'Below PT Limit'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-700">₹{fmt(emp.grossSalary)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn("text-base font-black", emp.ptDeduction > 0 ? "text-amber-600" : "text-gray-300")}>
                                                ₹{fmt(emp.ptDeduction)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => navigate(`/hrms/employee/${emp.id}`)}
                                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                        No employees found matching the criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">Showing {employees.length} of {pagination.total} employees</p>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white border-gray-200"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white border-gray-200"
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Slabs Configuration Dialog (Matrix) */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-4xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                    <div className="bg-white">
                        <div className="p-8 border-b bg-gray-50/50 flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-black text-gray-800 tracking-tight">PT Deduction Matrix</DialogTitle>
                                <p className="text-xs text-gray-500 font-medium">Manage statutory wage brackets and deduction amounts</p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setEditingSlab(null);
                                    setNewSlab({ wageCeiling: "", amount: "" });
                                    setIsAddSlabOpen(true);
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6"
                            >
                                <Plus size={18} className="mr-2" /> Add New Slab
                            </Button>
                        </div>
                        
                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-left border-separate border-spacing-y-3">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-4 pb-2">Monthly Gross Earnings Above</th>
                                        <th className="px-4 pb-2 text-center">Deduction Amount</th>
                                        <th className="px-4 pb-2 text-center">Status</th>
                                        <th className="px-4 pb-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ptSlabs.map((slab) => (
                                        <tr key={slab.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 rounded-l-2xl">
                                                <p className="text-lg font-black text-gray-800">₹{fmt(slab.wageCeiling)} & Above</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Lower Limit Threshold</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="text-2xl font-black text-amber-600 tracking-tighter">₹{fmt(slab.employeeRate)}</p>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Per Month</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Active</span>
                                            </td>
                                            <td className="px-6 py-4 text-right rounded-r-2xl">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button 
                                                        onClick={() => {
                                                            setEditingSlab(slab);
                                                            setNewSlab({ wageCeiling: slab.wageCeiling, amount: slab.employeeRate });
                                                            setIsAddSlabOpen(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-amber-600"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(slab)}
                                                        className="p-2 text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-6 bg-gray-50 border-t flex justify-end">
                            <Button onClick={() => setIsSettingsOpen(false)} className="bg-gray-800 hover:bg-gray-900 text-white rounded-xl px-10">
                                Close Matrix
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add/Edit Slab Dialog (Nested) */}
            <Dialog open={isAddSlabOpen} onOpenChange={setIsAddSlabOpen}>
                <DialogContent className="sm:max-w-md rounded-[2.5rem] p-10 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-800 tracking-tight">
                            {editingSlab ? "Update PT Slab" : "Create New PT Slab"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Monthly Gross Above (₹)</label>
                            <Input 
                                type="number"
                                value={newSlab.wageCeiling}
                                onChange={(e) => setNewSlab({...newSlab, wageCeiling: e.target.value})}
                                placeholder="e.g. 15000"
                                className="h-14 rounded-xl border-gray-200 text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Deduction Amount (₹)</label>
                            <Input 
                                type="number"
                                value={newSlab.amount}
                                onChange={(e) => setNewSlab({...newSlab, amount: e.target.value})}
                                placeholder="e.g. 200"
                                className="h-14 rounded-xl border-gray-200 text-lg font-bold text-amber-600"
                            />
                        </div>
                        <Button 
                            onClick={handleSaveSlab}
                            disabled={isCreating}
                            className="h-16 w-full rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-100"
                        >
                            {isCreating ? "Processing..." : editingSlab ? "Update Statutory Slab" : "Save Statutory Slab"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
