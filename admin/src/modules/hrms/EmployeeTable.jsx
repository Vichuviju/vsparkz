import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import { getProfileImageUrl } from "@/services/base/base.api";
import { formatDate } from "@/lib/utils";
import { useHRMSPermissions } from "@/hooks/useHRMSPermissions";

export function EmployeeListTable({
  employees = [],
  onEdit,
  onDelete,
}) {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => {
          const emp = row.original;
          const imageUrl = getProfileImageUrl(emp.profileImage);

          return (
            <div className="flex items-center gap-3">
              <div className="relative group w-10 h-10 flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`${emp.firstName} ${emp.lastName}`}
                    className="w-full h-full rounded-full object-cover border-2 border-slate-100 shadow-sm group-hover:shadow-md transition-all grayscale-[0.2] hover:grayscale-0"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm uppercase tracking-wider">
                    {emp.firstName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="font-bold text-gray-900 leading-tight">
                  {emp.firstName} {emp.lastName}
                </div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">
                  ID: {emp.empCode || "PENDING"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "department",
        header: "Department",
      },
      {
        accessorKey: "designation",
        header: "Designation",
      },
      {
        accessorKey: "joiningDate",
        header: "Joining Date",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {formatDate(getValue())}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          const lowerStatus = (status || '').toLowerCase();
          
          let colorClass = "bg-slate-50 text-slate-600";
          if (lowerStatus === "active") colorClass = "bg-emerald-50 text-emerald-600";
          else if (lowerStatus === "notice period") colorClass = "bg-amber-50 text-amber-600";
          else if (lowerStatus === "resigned") colorClass = "bg-orange-50 text-orange-600";
          else if (lowerStatus === "terminated") colorClass = "bg-red-50 text-red-600";
          
          return (
            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold ${colorClass}`}>
              {status}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right pr-10 min-w-[140px] uppercase tracking-widest font-black text-[10px] text-slate-400">
            Actions
          </div>
        ),
        cell: ({ row }) => {
          const { checkPermission } = useHRMSPermissions();
          const canEdit = checkPermission("/hrms/core", "edit");
          const canDelete = checkPermission("/hrms/core", "delete");

          if (!canEdit && !canDelete)
            return (
              <div className="text-right pr-10 text-gray-400 italic text-[10px]">
                No Access
              </div>
            );

          return (
            <div className="flex justify-end gap-3 pr-8 relative z-30">
              <button
                className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                title="View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
              {canEdit && (
                <button
                  className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row.original);
                  }}
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if(onDelete) onDelete(row.original.id);
                  }}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="More"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
              </button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col h-full">
      <div className="w-full p-4 rounded-xl border bg-white shadow-sm flex-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-slate-50 dark:bg-slate-800 border-none"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="py-4 text-xs font-bold uppercase text-gray-500"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length ? (
                rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className="bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-12 text-gray-500"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">
          Showing <b>{employees.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</b> to <b>{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, employees.length)}</b> of <b>{employees.length}</b> entries
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg hover:bg-gray-50 shadow-sm"
          >
            Previous
          </Button>
          <span className="text-sm font-bold text-gray-500 px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
             {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg hover:bg-gray-50 shadow-sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnlinkedUsersListTable({
  users = [],
  onConvert,
}) {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "user",
        header: "User",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm uppercase tracking-wider">
                {user.firstName?.[0] || "?"}
              </div>
              <div className="flex flex-col">
                <div className="font-bold text-gray-900 leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mt-0.5">
                  Nickname: {user.nickName || "N/A"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone",
        cell: ({ getValue }) => getValue() || "N/A",
      },
      {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {formatDate(getValue())}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-right pr-10 min-w-[140px] uppercase tracking-widest font-black text-[10px] text-slate-400">
            Actions
          </div>
        ),
        cell: ({ row }) => {
          const { checkPermission } = useHRMSPermissions();
          const canCreate = checkPermission("/hrms/core", "create");

          if (!canCreate)
            return (
              <div className="text-right pr-10 text-gray-400 italic text-[10px]">
                No Access
              </div>
            );

          return (
            <div className="flex justify-end gap-3 pr-8 relative z-30">
              <Button
                variant="outline"
                className="h-9 px-4 border-slate-200 dark:border-slate-700 rounded-md hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95 cursor-pointer shadow-sm font-bold text-xs flex items-center gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onConvert(row.original);
                }}
              >
                <Edit2 className="w-3.5 h-3.5" />
                Convert to Employee
              </Button>
            </div>
          );
        },
      },
    ],
    [onConvert]
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col h-full">
      <div className="w-full p-4 rounded-xl border bg-white shadow-sm flex-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-slate-50 dark:bg-slate-800 border-none"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="py-4 text-xs font-bold uppercase text-gray-500"
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length ? (
                rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className="bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-12 text-gray-500 font-medium italic"
                  >
                    No draft / unlinked users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 border-t border-gray-100 pt-4">
        <span className="text-sm text-gray-500">
          Showing <b>{users.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</b> to <b>{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, users.length)}</b> of <b>{users.length}</b> entries
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-lg hover:bg-gray-50 shadow-sm"
          >
            Previous
          </Button>
          <span className="text-sm font-bold text-gray-500 px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
             {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-lg hover:bg-gray-50 shadow-sm"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

