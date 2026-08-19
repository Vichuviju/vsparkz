import React, { useState } from 'react';
import { 
  Plus, 
  Search,
  Users,
  LayoutGrid,
  List,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useGetDepartmentsWithEmployeesQuery } from "@/services/hrms/department.api";
import { useGetAllEmployeesQuery, useGetUnlinkedUsersQuery } from "@/services/hrms/employee.api";
import { AddDepartment } from "@/components/modals/hrms/department/AddDepartment.jsx";
import { EmployeeListTable, UnlinkedUsersListTable } from "./EmployeeTable";

export const EmployeeMaster = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const navigate = useNavigate();

  // Data fetching
  const { 
    data: deptData, 
    isLoading: isDeptLoading 
  } = useGetDepartmentsWithEmployeesQuery();

  const { 
    data: empData, 
    isLoading: isEmpLoading 
  } = useGetAllEmployeesQuery();

  const { 
    data: unlinkedData, 
    isLoading: isUnlinkedLoading 
  } = useGetUnlinkedUsersQuery();

  const departments = deptData?.data?.departments || [];
  const employees = Array.isArray(empData?.data) ? empData.data : [];
  const unlinkedUsers = Array.isArray(unlinkedData) ? unlinkedData : [];

  // Filter logic for All Employees tab
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.empCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "ALL" || 
      emp.status?.toUpperCase() === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  // Filter logic for Draft/Unlinked Users tab
  const filteredUnlinkedUsers = unlinkedUsers.filter(user => {
    return (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const { checkPermission } = useHRMSPermissions();
  const canCreate = checkPermission('/hrms/core', 'create');
  const canCreateDept = checkPermission('/hrms/departments', 'create');

  return (
    <div className="font-sans">
      <main className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* Page Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Employees</h1>
            <p className="text-sm text-slate-500 mt-1">Create, manage and track all your personnel records</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm rounded-md h-10 px-4 font-bold text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Export
            </Button>
            <Button variant="outline" className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm rounded-md h-10 px-4 font-bold text-sm">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              Filters
            </Button>
            {canCreate && (
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow shadow-blue-500/20 h-10 px-4 flex items-center gap-2 font-bold text-sm"
                onClick={() => navigate('/hrms/core/add-employee')}
              >
                <Plus size={16} strokeWidth={3} />
                Add Employee
                <ChevronRight size={14} strokeWidth={3} className="ml-1 opacity-70" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Card 1: Total Employees */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Employees</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{employees.length}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" strokeWidth={3} /> 12.5%
                <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
              </span>
              <svg className="w-16 h-6 text-blue-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 15 Q5 5, 10 10 T20 12 T30 5 T40 10 T50 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Card 2: Active */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{employees.filter(e => e.status?.toLowerCase() === 'active').length}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" strokeWidth={3} /> 4.2%
                <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
              </span>
              <svg className="w-16 h-6 text-emerald-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 18 Q10 10, 20 15 T30 8 T40 12 T50 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
          
          {/* Card 3: Notice Period */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notice Period</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{employees.filter(e => e.status?.toLowerCase() === 'notice_period').length}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" strokeWidth={3} /> 1.1%
                <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
              </span>
              <svg className="w-16 h-6 text-amber-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 10 Q10 12, 20 10 T30 8 T40 10 T50 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Card 4: Departments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <LayoutGrid className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Departments</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{departments.length}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" strokeWidth={3} /> 0.0%
                <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
              </span>
              <svg className="w-16 h-6 text-purple-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 15 Q10 5, 20 8 T30 15 T40 5 T50 10" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {/* Card 5: Unlinked Users */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Draft Users</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{unlinkedUsers.length}</h3>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-500 flex items-center">
                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg> 33.3%
                <span className="text-slate-400 font-semibold ml-1 text-[10px]">vs last month</span>
              </span>
              <svg className="w-16 h-6 text-rose-400 opacity-60" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M0 2 Q10 15, 20 12 T30 5 T40 18 T50 8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        </div>

        {/* Tabs and Search Bar */}
        <Tabs defaultValue="departments" className="w-full" onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pt-2">
            <TabsList className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-md h-auto self-start shadow-sm">
              <TabsTrigger 
                value="departments" 
                className="rounded-md px-6 py-2 data-[state=active]:bg-blue-50 data-[state=active]:dark:bg-blue-900/20 data-[state=active]:text-blue-600 data-[state=active]:shadow-none font-medium"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Departments
              </TabsTrigger>
              <TabsTrigger 
                value="employees" 
                className="rounded-md px-6 py-2 data-[state=active]:bg-blue-50 data-[state=active]:dark:bg-blue-900/20 data-[state=active]:text-blue-600 data-[state=active]:shadow-none font-medium"
              >
                <List className="w-4 h-4 mr-2" />
                All Employees
              </TabsTrigger>
              <TabsTrigger 
                value="unlinked" 
                className="rounded-md px-6 py-2 data-[state=active]:bg-blue-50 data-[state=active]:dark:bg-blue-900/20 data-[state=active]:text-blue-600 data-[state=active]:shadow-none font-medium"
              >
                <Users className="w-4 h-4 mr-2" />
                Draft / Unlinked Users
              </TabsTrigger>
            </TabsList>

            {(activeTab === 'employees' || activeTab === 'unlinked') && (
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                {activeTab === 'employees' && (
                  <div className="flex gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-md shadow-sm">
                    {["ALL", "ACTIVE", "NOTICE PERIOD", "RESIGNED", "TERMINATED"].map((status) => (
                      <Button
                        key={status}
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-md px-3 py-1 font-medium text-xs uppercase tracking-tight ${
                          statusFilter === status 
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-none hover:bg-blue-100 dark:hover:bg-blue-900/40" 
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        {status === "ALL" ? "All" : status}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder={activeTab === 'employees' ? "Search name or ID..." : "Search name or email..."}
                    className="pl-10 rounded-xl bg-white border-gray-200 focus:ring-blue-500 h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Departments Tab Content */}
          <TabsContent value="departments" className="mt-0">
            {isDeptLoading ? (
              <div className="py-20 text-center text-gray-400 font-medium italic">Loading organizational structure...</div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-600 uppercase tracking-widest">Departmental Grid</h3>
                  {canCreateDept && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 font-bold hover:bg-blue-50"
                      onClick={() => setIsDeptModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Dept
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {departments.map((dept) => (
                    <div 
                      key={dept.id} 
                      onClick={() => navigate(`/hrms/departments/${dept.id}/employees`, {
                        state: { departmentName: dept.name, employees: dept.employees, deptId: dept.id }
                      })}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-bold uppercase tracking-tight group-hover:text-blue-600 transition-colors">{dept.name}</h2>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                          <ArrowUpRight size={16} />
                        </div>
                      </div>
                      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-6">
                        {dept.activeEmployeeCount} Staff Members
                      </p>

                      <div className="space-y-3">
                        {dept.employees.slice(0, 3).map((emp) => {
                          const empInitials = emp.name ? emp.name[0] : "?";
                          const empPhoto = emp.profileImage || null;

                          return (
                            <div key={emp.id} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0 border border-blue-50 bg-blue-50 shadow-sm">
                                {empPhoto ? (
                                  <img 
                                    src={empPhoto} 
                                    alt={emp.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-blue-700 font-bold text-[10px] uppercase">
                                    {empInitials}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold truncate">{emp.name}</h4>
                              </div>
                            </div>
                          );
                        })}
                        {dept.employees.length > 3 && (
                          <div className="text-xs text-gray-400 font-medium pl-11">
                            + {dept.employees.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* All Employees Tab Content */}
          <TabsContent value="employees" className="mt-0">
            {isEmpLoading ? (
              <div className="py-20 text-center text-gray-400 font-medium italic">Fetching personnel records...</div>
            ) : (
              <EmployeeListTable 
                employees={filteredEmployees}
                onEdit={(emp) => navigate('/hrms/core/add-employee', { state: { employee: emp } })}
                onDelete={(id) => {}} // Not implemented - soft delete disabled
              />
            )}
          </TabsContent>

          {/* Draft/Unlinked Users Tab Content */}
          <TabsContent value="unlinked" className="mt-0">
            {isUnlinkedLoading ? (
              <div className="py-20 text-center text-gray-400 font-medium italic">Fetching draft/unlinked users...</div>
            ) : (
              <UnlinkedUsersListTable 
                users={filteredUnlinkedUsers}
                onConvert={(user) => navigate('/hrms/core/add-employee', { state: { unlinkedUser: user } })}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {isDeptModalOpen && (
        <AddDepartment open={isDeptModalOpen} onClose={() => setIsDeptModalOpen(false)} />
      )}
    </div>
  );
};
