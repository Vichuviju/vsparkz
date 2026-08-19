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

export const ExpenseTable = ({ data, onEdit, onDelete }) => {
  const columns = [
    { accessorKey: "employeeName", header: "Employee" },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ getValue }) => (
        <span className="font-semibold text-green-600">
          ₹ {Number(getValue()).toLocaleString("en-IN")}
        </span>
      ),
    },
    { accessorKey: "status", header: "Status" },
    {
        header: "Actions",
        cell: ({ row }) => (
            <div className="flex gap-2">
            <button
                className="text-blue-600"
                onClick={() => onEdit(row.original)}
            >
                Edit
            </button>

            <button
                className="text-red-600"
                onClick={() => onDelete(row.original.id)}
            >
                Delete
            </button>
            </div>
        ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="border rounded-2xl bg-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
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