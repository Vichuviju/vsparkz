import React, { useState, useMemo } from "react";
import { Search, Edit2, Lock, User, Wallet, CheckCircle2, AlertTriangle, Filter, ChevronLeft, ChevronRight, RefreshCw, X, Users, ShieldCheck, Zap, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useGetAllEmployeesQuery,
    useUpdateEmployeeMutation
} from "@/services/hrms/employee.api";
import { useGetHrSettingsQuery } from "@/services/hrms/hrSettings.api";
import { useGetAllDepartmentsQuery } from "@/services/hrms/department.api";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const SalaryStructureSetup = () => {
    // 1. Data Fetching
    const { data: employeesResponse, isLoading: employeesLoading, refetch } = useGetAllEmployeesQuery();
    const employees = employeesResponse?.data || employeesResponse || [];

    const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
    const { data: hrSettingsResponse } = useGetHrSettingsQuery();
    const settings = hrSettingsResponse?.data || {};

    // 2. Local State
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [deptFilter, setDeptFilter] = useState("all");

    const { data: deptsData } = useGetAllDepartmentsQuery();
    const departments = useMemo(() => deptsData?.data || [], [deptsData]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [salaryForm, setSalaryForm] = useState({
        totalSalary: 0,
        basicSalary: 0,
        hraAllowance: 0,
        da: 0,
        travelAllowance: 0,
        specialAllowance: 0,
        otherAllowance: 0
    });

    // 3. Handlers
    const handleEditClick = (emp) => {
        setSelectedEmp(emp);
        setSalaryForm({
            totalSalary: emp.totalSalary || 0,
            basicSalary: emp.basicSalary || 0,
            hraAllowance: emp.hraAllowance || 0,
            da: emp.da || 0,
            travelAllowance: emp.travelAllowance || 0,
            specialAllowance: emp.specialAllowance || 0,
            otherAllowance: emp.otherAllowance || 0
        });
        setIsModalOpen(true);
    };

    const handleSaveSalary = async (e) => {
        e.preventDefault();
        try {
            await updateEmployee({
                id: selectedEmp.id,
                payload: {
                    employee: { ...salaryForm }
                }
            }).unwrap();

            toast.success("Employee salary updated successfully!");
            setIsModalOpen(false);
            refetch();
        } catch (error) {
            toast.error(error?.data?.message || "Failed to update salary.");
        }
    };

    // 4. Calculations for Modal
    const monthlyGross = Object.values({
        basic: Number(salaryForm.basicSalary),
        hra: Number(salaryForm.hraAllowance),
        da: Number(salaryForm.da),
        travel: Number(salaryForm.travelAllowance),
        special: Number(salaryForm.specialAllowance),
        other: Number(salaryForm.otherAllowance)
    }).reduce((a, b) => a + b, 0);

    const balance = Number(salaryForm.totalSalary) - monthlyGross;

    // 5. Filtering logic
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = (emp.firstName + " " + emp.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.empCode?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = deptFilter === "all" || String(emp.departmentId) === String(deptFilter);
        return matchesSearch && matchesDept;
    });

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalMonthlyPayroll = filteredEmployees.reduce((acc, emp) => acc + Number(emp.totalSalary || 0), 0);

    if (employeesLoading) {
        return <div className="p-10 text-center font-medium text-gray-500 animate-pulse">Loading Employee Payroll Data...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen font-sans">
            {/* Page Header */}
            <div>
                {/* <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employee Salary Setup</h1> */}
                {/* <p className="text-gray-500 mt-1 font-medium">Manage and configure employee salaries with ease.</p> */}
            </div>

            {/* Top Toolbar & Insights */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    {/* Total Employees */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Employees</p>
                            <p className="text-2xl font-black text-gray-900 leading-none">{filteredEmployees.length}</p>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-10 bg-gray-100" />

                    {/* Total Budget */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Wallet size={22} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Monthly Budget</p>
                            <p className="text-2xl font-black text-gray-900 leading-none">₹{totalMonthlyPayroll.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-4 py-3 !bg-white border border-gray-100 rounded-2xl hover:!bg-gray-50 text-gray-500 font-bold transition-all shadow-sm active:scale-95 text-sm outline-none">
                                <Filter size={18} />
                                {deptFilter === "all" ? "All Departments" : departments.find(d => String(d.id) === String(deptFilter))?.name || "Select Dept"}
                                <ChevronDown size={14} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            <DropdownMenuItem onClick={() => setDeptFilter("all")}>
                                All Departments
                            </DropdownMenuItem>
                            {departments.map(dept => (
                                <DropdownMenuItem key={dept.id} onClick={() => setDeptFilter(dept.id)}>
                                    {dept.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            className="pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-blue-50/50 focus:border-blue-200 outline-none w-full md:w-80 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <button
                        onClick={refetch}
                        className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={20} className={cn(employeesLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Employee List Table */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Monthly CTC</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Gross Pay</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paginatedEmployees.map((emp) => {
                                    const gross = Number(emp.basicSalary || 0) + Number(emp.hraAllowance || 0) +
                                        Number(emp.da || 0) + Number(emp.travelAllowance || 0) +
                                        Number(emp.specialAllowance || 0) + Number(emp.otherAllowance || 0);

                                    return (
                                        <tr key={emp.id} className="hover:bg-blue-50/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold relative group">
                                                        <User size={20} />
                                                        <div className={cn(
                                                            "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                                                            emp.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-300"
                                                        )} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{emp.firstName} {emp.lastName}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                                            <span>{emp.empCode}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <span>{emp.designation || "Staff"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <p className="font-black text-gray-900 text-sm">₹{Number(emp.totalSalary || 0).toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Fixed CTC</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span className={cn(
                                                        "font-black text-sm",
                                                        gross > 0 ? "text-blue-600" : "text-amber-500 italic"
                                                    )}>
                                                        ₹{gross.toLocaleString()}
                                                    </span>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Sum of Earnings</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditClick(emp)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 !bg-blue-50 !text-blue-600 rounded-lg text-xs font-bold hover:!bg-blue-100 transition-all !border !border-blue-100 active:scale-95 outline-none"
                                                >
                                                    <Edit2 size={14} /> Update Salary
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="p-1.5 rounded-lg !border !border-gray-200 !bg-white !text-gray-500 hover:!bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all outline-none"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg text-xs font-black transition-all border-none outline-none flex items-center justify-center !p-0",
                                                currentPage === i + 1
                                                    ? "!bg-blue-600 !text-white shadow-lg shadow-blue-100"
                                                    : "!bg-transparent !text-gray-500 hover:!bg-gray-200"
                                            )}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="p-1.5 rounded-lg !border !border-gray-200 !bg-white !text-gray-500 hover:!bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all outline-none"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {filteredEmployees.length === 0 && (
                            <div className="py-20 text-center">
                                <p className="text-gray-400 text-sm font-medium">No employees found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Statutory Reference Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                                <ShieldCheck size={20} />
                            </div>
                            <h2 className="text-base font-bold text-gray-900 tracking-tight">Statutory Rules</h2>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "PF Contribution", value: `${settings.PF_EMPLOYEE_PERCENTAGE || 12}% of Basic Salary`, color: "bg-blue-50 text-blue-700" },
                                { label: "ESI Rules", value: `${settings.ESI_EMPLOYEE_PERCENTAGE || 0.75}% (If Gross < ₹${settings.ESI_THRESHOLD_LIMIT || 21000})`, color: "bg-rose-50 text-rose-700" },
                                { label: "Professional Tax", value: `₹${settings.PROFESSIONAL_TAX_AMOUNT || 200}/month fixed`, color: "bg-emerald-50 text-emerald-700" }
                            ].map((rule, idx) => (
                                <div key={idx} className="p-4 bg-gray-50 rounded-[16px] border border-gray-100 group hover:bg-white hover:shadow-md hover:border-blue-100 transition-all duration-300">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{rule.label}</p>
                                    <p className="text-xs font-bold text-gray-800">{rule.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-[24px] shadow-xl shadow-blue-100 p-6 text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500 transform rotate-12">
                            <Wallet size={120} />
                        </div>
                        <div className="relative z-10">
                            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                                <Zap size={16} className="text-yellow-300" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Payroll Insight</h3>
                            <p className="text-xl font-bold leading-tight mb-3">Individual Management</p>
                            <p className="text-[13px] opacity-80 leading-relaxed font-medium">
                                The system now prioritizes direct salary components defined for each employee over shared templates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Salary Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900/60 z-[9999] bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
                        <form onSubmit={handleSaveSalary} className="flex flex-col h-full overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-blue-600 px-8 py-10 text-white flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Payroll Configuration</p>
                                    <h2 className="text-3xl font-black tracking-tighter">
                                        {selectedEmp?.firstName} {selectedEmp?.lastName}
                                    </h2>
                                    <p className="text-blue-100 font-medium text-sm mt-1">{selectedEmp?.empCode} • {selectedEmp?.designation || 'Specialist'}</p>
                                </div>
                                <div
                                    role="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-full !bg-white !text-blue-600 flex items-center justify-center hover:!bg-blue-50 transition-all active:scale-95 shadow-lg cursor-pointer border-none z-50"
                                >
                                    <X size={20} strokeWidth={3} />
                                </div>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="p-8 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
                                {/* Monthly CTC Section */}
                                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
                                                <Wallet size={18} />
                                            </div>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tight">Target Monthly CTC</h3>
                                        </div>
                                        <input
                                            required
                                            type="number"
                                            className="w-40 text-right text-2xl font-black bg-transparent border-none focus:ring-0 text-blue-700"
                                            value={salaryForm.totalSalary}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, totalSalary: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium italic">Enter the fixed monthly compensation (CTC) for this employee.</p>
                                </div>

                                {/* Components Grid */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Earnings Components</h4>
                                        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <Filter size={10} />
                                            <span className="text-[10px] font-bold">Summing Gross</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                        {[
                                            { label: "Basic Salary", field: "basicSalary", icon: "B" },
                                            { label: "HRA Allowance", field: "hraAllowance", icon: "H" },
                                            { label: "Dearness Allowance", field: "da", icon: "D" },
                                            { label: "Travel Allowance", field: "travelAllowance", icon: "T" },
                                            { label: "Special Allowance", field: "specialAllowance", icon: "S" },
                                            { label: "Other Allowance", field: "otherAllowance", icon: "O" },
                                        ].map((item) => (
                                            <div key={item.field} className="group flex flex-col gap-2">
                                                <label className="text-xs font-black text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded bg-gray-100 text-[10px] flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors uppercase font-black">{item.icon}</span>
                                                    {item.label}
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-0 bottom-3 text-lg font-black text-gray-300">₹</span>
                                                    <input
                                                        type="number"
                                                        className="w-full pl-6 pr-0 py-2 border-b-2 border-gray-100 focus:border-blue-600 outline-none text-base font-black transition-all bg-transparent"
                                                        value={salaryForm[item.field]}
                                                        onChange={(e) => setSalaryForm({ ...salaryForm, [item.field]: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary Footer */}
                                <div className="flex items-center gap-4 pt-6">
                                    <div className={cn(
                                        "flex-1 p-6 rounded-3xl border-2 flex items-center justify-between transition-all duration-500",
                                        Math.abs(balance) < 2
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xl shadow-emerald-50"
                                            : "bg-rose-50 border-rose-200 text-rose-900"
                                    )}>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Calculated Gross</p>
                                            <h4 className="text-2xl font-black">₹{monthlyGross.toLocaleString()}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance Remainder</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-black tracking-tight italic">₹{balance.toLocaleString()}</span>
                                                {Math.abs(balance) < 2 ? <CheckCircle2 size={24} className="text-emerald-500" /> : <AlertTriangle size={24} className="text-rose-500 animate-pulse" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Actions - Fixed Footer */}
                            <div className="p-8 pt-4 flex gap-4 bg-white border-t border-gray-100 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-4 !bg-gray-100 !text-gray-500 rounded-3xl font-black text-sm hover:!bg-gray-200 transition-colors border-none outline-none"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    disabled={isUpdating}
                                    type="submit"
                                    className="flex-1 py-4 !bg-blue-600 !text-white rounded-3xl font-black text-sm hover:!bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50 border-none outline-none"
                                >
                                    {isUpdating ? "Storing Payroll Data..." : "Update Salary Record"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
