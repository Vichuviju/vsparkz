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

import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const LeavesListTable = ({
  leaves = [],
  onEdit,
  onDelete,
}) => {

    const oleaveTypes = {
        "sl": "Sick Leave",
        "cl": "Casual Leave",
    }
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "employeeName",
        header: "Employee Name",
      },
      {
        accessorKey: "fromDate",
        header: "From Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: "toDate",
        header: "To Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        accessorKey: "leaveType",
        header: "Leave Type",
        cell: ({ row }) => {
            const value = row.original.leaveType;
            return oleaveTypes[value] || value;
        },
      },
      {
        header: "Duration",
        cell: ({ row }) => {
          const { fromDate, toDate } = row.original;
          const diff =
            (new Date(toDate) - new Date(fromDate)) /
              (1000 * 60 * 60 * 24) +
            1;
          return `${diff} Day${diff > 1 ? "s" : ""}`;
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue();

          const statusStyles = {
            Pending: "bg-amber-100 text-amber-700",
            "HR Approved": "bg-emerald-100 text-emerald-700",
            "Manager Approved": "bg-blue-100 text-blue-700",
            Rejected: "bg-red-100 text-red-700",
          };

          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                statusStyles[status] || "bg-gray-100 text-gray-600"
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: "approvedBy",
        header: "Approved By",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "approvedAt",
        header: "Approved At",
        cell: ({ getValue }) => formatDate(getValue()),
      },
      {
        header: "Action",
        cell: ({ row }) => {
            const leave = row.original
            const isPending = leave.status === "PENDING"

            return (
            <div className="flex justify-end gap-2">
                <Button
                size="icon"
                variant="ghost"
                disabled={!isPending}
                onClick={() => onEdit(leave)}
                className={!isPending ? "opacity-40 cursor-not-allowed" : ""}
                >
                ✏
                </Button>

                <Button
                size="icon"
                variant="ghost"
                disabled={!isPending}
                onClick={() => onDelete(leave)}
                className={!isPending ? "opacity-40 cursor-not-allowed" : ""}
                >
                ✕
                </Button>
            </div>
            )
        },
      }
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: leaves,
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
                    No leave requests found
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
          Showing <b>{rows.length}</b> of <b>{leaves.length}</b> entries
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
}
