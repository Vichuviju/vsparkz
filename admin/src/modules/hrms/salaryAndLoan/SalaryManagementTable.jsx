import React from "react";
import {
  useReactTable,
  getCoreRowModel,
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export const SalaryManagementTable = ({
  salaries = [],
  onView,
  onEdit,
  onDelete,
}) => {


  const columns = React.useMemo(
  () => [
    {
      accessorKey: "employeeName",
      header: "Employee",
      cell: ({ row }) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{row.original.employeeName}</p>
            {(row.original.status?.toUpperCase() === 'TERMINATED' || row.original.status?.toUpperCase() === 'RESIGNED') && (
              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-black uppercase tracking-widest">
                {row.original.status}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{row.original.empCode}</p>
        </div>
      ),
    },
    {
      accessorKey: "basicSalary",
      header: "Basic",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "da",
      header: "DA",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "hra",
      header: "HRA",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "travel",
      header: "Travel",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "special",
      header: "Special",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "other",
      header: "Other",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "totalSalary",
      header: "Gross Salary",
      cell: ({ getValue }) => (
        <span className="font-semibold">
          ₹ {Number(getValue()).toFixed(2)}
        </span>
      ),
    },

    {
      accessorKey: "incentiveAmount",
      header: "Incentive",
      cell: ({ getValue }) => (
        <span className="text-green-600 font-medium">
          ₹ {Number(getValue()).toFixed(2)}
        </span>
      ),
    },

    {
      accessorKey: "expenseAmount",
      header: "Expense",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "loanDeduction",
      header: "Loan Deduction",
      cell: ({ getValue }) => (
        <span className="text-red-600">
          ₹ {Number(getValue()).toFixed(2)}
        </span>
      ),
    },

    {
      accessorKey: "advanceDeduction",
      header: "Advance Deduction",
      cell: ({ getValue }) => `₹ ${Number(getValue()).toFixed(2)}`,
    },

    {
      accessorKey: "netSalary",
      header: "Net Salary",
      cell: ({ getValue }) => (
        <span className="font-semibold text-blue-600">
          ₹ {Number(getValue()).toFixed(2)}
        </span>
      ),
    },

    {
      header: "Actions",
      cell: ({ row }) => {
        const salary = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(salary)}>
                View
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onEdit?.(salary)}>
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete?.(salary)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ],
  [onView, onEdit, onDelete]
);

  const table = useReactTable({
    data: salaries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col h-full">
      <div className="w-full p-4 rounded-xl border bg-white shadow-sm flex-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-slate-50 dark:bg-slate-800"
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
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50 dark:bg-slate-800/30"
                    } hover:bg-blue-50/30 transition`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-4 text-sm"
                      >
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
                    No salary records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          Showing <b>{rows.length}</b> of <b>{salaries.length}</b> entries
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled>
            Previous
          </Button>
          <Button size="sm" variant="outline">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};