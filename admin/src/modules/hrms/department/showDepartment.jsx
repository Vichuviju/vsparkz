import React, { useState } from 'react';
import {
  ArrowUpRight,
  ChevronRight,
  Plus,
  ArrowUpDown,
  Users
} from 'lucide-react';
import { AddDepartment } from "@/components/modals/hrms/department/AddDepartment.jsx"
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useGetDepartmentsWithEmployeesQuery } from "@/services/hrms/department.api";
import { getProfileImageUrl } from "@/services/base/base.api";


export const showDepartment = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
  } = useGetDepartmentsWithEmployeesQuery();

  const departments = data?.data?.departments || [];
  const totalActiveUsers = data?.data?.summary?.totalActiveUsers || 0;

  const filters = ['All']; //, 'Probation Ending'

  if (isLoading) {
    return <div className="p-8">Loading departments...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-500">Failed to load departments</div>;
  }


  return (
    <>
      <div className=" bg-slate-50 dark:bg-slate-800 p-4 md:p-8 font-sans text-slate-800">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="flex items-center gap-2 bg-[#00B074] hover:bg-[#009b66] text-white"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={18} />
              Add New Department
            </Button>

          </div>
        </div>

        {/* Filter and Stats Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                className={
                  activeFilter === filter
                    ? "bg-[#0B5ED7] hover:bg-[#084298] text-white rounded-full"
                    : "rounded-full border-gray-300 text-gray-600 hover:bg-gray-100"
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* <div className="bg-[#E6F7F1] text-[#00B074] px-4 py-2 rounded-lg text-sm font-bold border border-[#00B07422]">
            Total active users: {totalActiveUsers}
        </div> */}
        </div>

        {/* Grid of Department Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {departments.map((dept) => (
            <div key={dept.id}
              onClick={() =>
                navigate(`/hrms/departments/${dept.id}/employees`, {
                  state: {
                    departmentName: dept.name,
                    employees: dept.employees,
                    deptId: dept.id
                  },
                })
              }
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-bold uppercase tracking-tight">{dept.name}</h2>
                <Button
                  size="icon"
                  variant="outline"
                  className="text-[#0B5ED7] border-gray-200 hover:bg-gray-50"
                >
                  <ArrowUpRight size={18} />
                </Button>

              </div>
              <p className="text-gray-400 text-sm mb-6">
                {dept.activeEmployeeCount < 10
                  ? `0${dept.activeEmployeeCount}`
                  : dept.activeEmployeeCount}{" "}
                Employees
              </p>

              <div className="space-y-4 flex-grow">
                {dept.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 flex-shrink-0">
                        {emp.profileImage ? (
                          <img
                            src={getProfileImageUrl(emp.profileImage)}
                            alt={emp.name}
                            className="w-full h-full rounded-full object-cover border border-gray-100 shadow-sm"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] uppercase">
                            {emp.name ? emp.name[0] : "?"}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold truncate">
                          {emp.name}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                          {emp.role}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#00B074]" />
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      </div>
      {
        isModalOpen && <AddDepartment open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      }
    </>
  );
};
