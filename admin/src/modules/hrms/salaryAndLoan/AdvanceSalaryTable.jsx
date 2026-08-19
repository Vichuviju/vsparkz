import React from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"

export const AdvanceSalaryTable = ({ data, onEdit, onDelete }) => {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "employeeName",
        header: "Name",
        cell: ({ row }) =>
          `${row.original.firstName} ${row.original.lastName}`,
      },
      {
        accessorKey: "advanceType",
        header: "Advance Type",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) =>
          `${row.original.amount}`,  //${row.original.currency}
      },
      {
        accessorKey: "reason",
        header: "Reason",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "requestedDate",
        header: "Requested Date",
        cell: ({ row }) =>
          `${row.original.createdAt.split("T")[0]}`,
      },
      {
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {/* {row.original.status === "submitted" && ( */}
              <Button size="sm" onClick={() => onEdit(row.original)}>
                Edit
              </Button>
            {/* )} */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full p-6 rounded-2xl border bg-white shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="bg-gray-100">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}