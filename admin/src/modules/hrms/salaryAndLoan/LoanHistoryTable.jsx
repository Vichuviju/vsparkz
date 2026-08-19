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
import { formatDate } from "@/lib/utils";

export const LoanHistoryTable = ({
  loans = [],
  onView,
  onEdit,
  onDelete,
}) => {

  const columns = React.useMemo(
    () => [
      /* Employee */
      {
        accessorKey: "employeeName",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.employeeName}</p>
            <p className="text-xs text-gray-500">User</p>
          </div>
        ),
      },

      /* Date */
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ getValue }) => formatDate(getValue()),
      },

      /* Amount */
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) =>
          `${row.original.amount.toFixed(2)} ${row.original.currency || "INR"}`,
      },

      /* Instalments */
      {
        accessorKey: "installments",
        header: "Instalments",
      },

      /* Remaining */
      {
        accessorKey: "remaining",
        header: "Remaining",
      },

      /* Type */
      {
        accessorKey: "loanType",
        header: "Type",
      },

      /* Name */
      {
        accessorKey: "loanName",
        header: "Name",
      },

      /* Reason */
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ getValue }) => {
          const value = getValue();
          return value?.length > 20
            ? value.slice(0, 20) + "..."
            : value;
        },
      },

      /* Status */
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

      /* Actions (3 dots) */
      {
        header: "Actions",
        cell: ({ row }) => {
          const loan = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(loan)}>
                  View
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onEdit?.(loan)}>
                  Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete?.(loan)}
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
    data: loans,
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
                    No loan history found
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
          Showing <b>{rows.length}</b> of <b>{loans.length}</b> entries
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