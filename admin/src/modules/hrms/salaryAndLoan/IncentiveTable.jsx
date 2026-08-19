import React from "react"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDeleteIncentiveMutation } from "@/services/hrms/incentive.api"

export const IncentiveTable = ({ data, onEdit }) => {
    const [deleteIncentive] = useDeleteIncentiveMutation()

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "employeeName",
        header: "Employee Name",
      },
      {
        accessorKey: "amount",
        header: "Incentive Amount",
        cell: ({ getValue }) => (
          <span className="font-semibold text-green-700">
            ₹ {Number(getValue()).toLocaleString("en-IN")}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ getValue }) => (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "period",
        header: "Period",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">

            <Button
              size="sm"
              onClick={() => onEdit(row.original)}
            >
              Edit
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteIncentive(row.original.id)}
            >
              Delete
            </Button>

          </div>
        ),
      },
    ],
    [onEdit]
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
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