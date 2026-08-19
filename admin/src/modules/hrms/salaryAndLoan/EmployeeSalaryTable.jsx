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

export const EmployeeSalaryTable = ({ data }) => {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "employeeName",
        header: "Employee Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-800">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "employeeNumber",
        header: "Employee Number",
      },
      {
        accessorKey: "department",
        header: "Department",
      },
      {
        accessorKey: "totalSalary",
        header: "Total Salary",
        cell: ({ getValue }) => (
          <span className="font-semibold">
            {Number(getValue()).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "basicSalary",
        header: "Basic Salary",
        cell: ({ getValue }) =>
          Number(getValue()).toLocaleString(),
      },
      {
        accessorKey: "hra",
        header: "HR Allowance",
        cell: ({ getValue }) =>
          Number(getValue()).toLocaleString(),
      },
      {
        accessorKey: "da",
        header: "DA allowance",
        cell: ({ getValue }) =>
          Number(getValue()).toLocaleString(),
      },
       {
        accessorKey: "travel",
        header: "Travel Allowance",
        cell: ({ getValue }) =>
          Number(getValue()).toLocaleString(),
      },
      {
        accessorKey: "special",
        header: "Special Allowance",
        cell: ({ getValue }) =>
          Number(getValue()).toLocaleString(),
      },
       {
        accessorKey: "other",
        header: "Other Allowance",
        cell: ({ getValue }) =>
          Number(getValue()).toLocaleString(),
      },
      // {
      //   accessorKey: "paymentType",
      //   header: "Payment Type",
      //   cell: ({ getValue }) => (
      //     <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
      //       {getValue()}
      //     </span>
      //   ),
      // },
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
            <TableRow
              key={row.id}
              className="hover:bg-gray-50 transition"
            >
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