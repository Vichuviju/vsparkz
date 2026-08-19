// import React, { useMemo, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { ArrowLeft, Search } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// export const EmployeeGrid = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();

//   const employees = state?.employees || [];
//   console.log("employeegrid--to--employees", employees);
//   const departmentName = state?.departmentName || "Employees";
//   const deptId = state?.deptId || null;

//   const [search, setSearch] = useState("");

//   if (!state) {
//     return <div className="p-8">No department data found</div>;
//   }

//   const handleAddNew = () => {
//     navigate("/hrms/add-employee", { state: { deptId } });
//   };

//   // 🔍 Filter employees by name
//   const filteredEmployees = useMemo(() => {
//     return employees.filter((emp) =>
//       emp.name?.toLowerCase().includes(search.toLowerCase())
//     );
//   }, [employees, search]);

//   return (
//     <div className=" bg-slate-50 dark:bg-slate-800 p-6">
//       {/* Header */}
//       <div className="mb-6 space-y-4">
//         {/* Top row */}
//         <div className="flex items-center justify-between">
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-1"
//           >
//             <ArrowLeft size={16} />
//             Back
//           </Button>

//           <Button
//             onClick={handleAddNew}
//             className="bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             + Add Employee
//           </Button>
//         </div>

//         {/* Title + Search */}
//         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
//           <div>
//             <h2 className="text-2xl font-bold">{departmentName}</h2>
//             <p className="text-gray-500">
//               ({filteredEmployees.length} Employees)
//             </p>
//           </div>

//           {/* Search */}
//           <div className="relative w-full md:w-72">
//             <Search
//               size={16}
//               className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//             />
//             <Input
//               placeholder="Search employee..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="pl-9"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Employee Grid */}
//       {filteredEmployees.length === 0 ? (
//         <div className="text-center text-gray-500 mt-20">
//           No employees found
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {filteredEmployees.map((emp) => (
//             <div
//               key={emp.id}
//               className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition"
//               onClick={() =>
//                 navigate(`/hrms/employee/${emp.id}`, {
//                   state: { deptId },
//                 })
//               }
//             >
//               <img
//                 src={`https://i.pravatar.cc/150?u=${emp.id}`}
//                 alt={emp.name}
//                 className="w-16 h-16 rounded-full mb-3"
//               />
//               <h3 className="font-semibold truncate">{emp.name}</h3>
//               <p className="text-sm text-gray-500">{emp.role}</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfileImageUrl } from "@/services/base/base.api";
import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api";

export const EmployeeGrid = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { checkPermission } = useHRMSPermissions();
  const canCreate = checkPermission('/hrms/core', 'create');

  if (!state) {
    return <div className="p-8">No department data found</div>;
  }

  const departmentName = state?.departmentName || "Employees";
  const deptId = state?.deptId || null;

  const { data: empData, isLoading } = useGetAllEmployeesQuery();
  const allEmployees = Array.isArray(empData?.data) ? empData.data : [];

  const employees = useMemo(() => {
    if (!deptId) return state?.employees || [];
    return allEmployees.filter(emp => String(emp.departmentId) === String(deptId));
  }, [allEmployees, deptId, state]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Reset to page 1 on search or filter
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleAddNew = () => {
    navigate("/hrms/core/add-employee", { state: { deptId } });
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`).trim();
      const matchesSearch = fullName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        emp.status?.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 font-medium italic mt-20">Fetching department personnel data...</div>;
  }

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6">
      {/* ================= HEADER ================= */}
      {/* ================= HEADER ================= */}
<div className="mb-8 space-y-6">
  {/* Top Row: Back + Title + Action */}
  <div className="flex items-center justify-between">
    {/* Left: Back + Title */}
    <div className="flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div>
        <p className="text-sm text-gray-500">
          ({filteredEmployees.length} Employees)
        </p>
      </div>
    </div>

    {/* Right: Add Button */}
    {canCreate && (
      <Button onClick={handleAddNew} className="px-5">
        + Add New Employee
      </Button>
    )}
  </div>


        {/* Filters + Search */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {["ALL", "ACTIVE", "NOTICE PERIOD", "RESIGNED", "TERMINATED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "All" : status}
              </Button>
            ))}
          </div>

          {/* Search + Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search employee"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm h-9"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="NOTICE PERIOD">Notice Period</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= GRID ================= */}
      {paginatedEmployees.length === 0 ? (
        <div className="text-center text-gray-500 mt-20">
          No personnel records found for this department.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedEmployees.map((emp) => {
              const fullName = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`).trim();
              const initial = fullName ? fullName[0] : "?";
              return (
              <div
                key={emp.employeeId || emp.id}
                className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition"
                onClick={() =>
                  navigate(`/hrms/employee/${emp.employeeId || emp.id}`, {
                    state: { deptId },
                  })
                }
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative group w-20 h-20 mb-4 flex items-center justify-center">
                    {emp.profileImage ? (
                      <img 
                        src={getProfileImageUrl(emp.profileImage)}
                        alt={fullName} 
                        className="w-full h-full rounded-full object-cover border-4 border-blue-50 shadow-sm group-hover:shadow-md transition-all grayscale-[0.2] hover:grayscale-0"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-sm uppercase tracking-wider">
                        {initial}
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 truncate w-full mb-1">{fullName}</h3>
                  <p className="text-xs text-gray-400 font-black uppercase tracking-tighter">{emp.designation || "Employee"}</p>
                </div>

                {emp.status && (
                  <span className="inline-block mt-3 px-3 py-1 text-xs rounded-md border text-blue-600 bg-blue-50 border-blue-100 font-bold uppercase">
                    {emp.status}
                  </span>
                )}
              </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between mt-8 border-t pt-4">
            <span className="text-sm text-gray-500">
              Showing <b>{filteredEmployees.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</b> to <b>{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</b> of <b>{filteredEmployees.length}</b> entries
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 px-2 text-sm font-medium">
                {currentPage} / {totalPages}
              </div>
              <Button 
                size="sm" 
                variant="outline"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
