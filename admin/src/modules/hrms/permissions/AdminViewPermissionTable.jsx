import React from "react"
import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"


export const AdminPermissionTable = ({
    requests,
    updateStatus = () => { },
    statusFilter
}) => {

    const filteredRequests = React.useMemo(() => {
        if (!Array.isArray(requests)) return []

        if (statusFilter === "All") return requests

        return requests.filter(
            (r) => r && r.status === statusFilter
        )
    }, [requests, statusFilter])


    const columns = React.useMemo(
        () => [
            {
                header: "Employee Name",
                accessorKey: "userName",
                cell: ({ row }) => row.original?.userName || "-",
            },
            {
                header: "Date",
                accessorKey: "date",
                cell: ({ row }) => row.original?.date.split("T")[0] || "-",
            },
            {
                header: "Start Time",
                accessorKey: "startTime",
                cell: ({ row }) => row.original?.startTime || "-",
            },
            {
                header: "End Time",
                accessorKey: "endTime",
                cell: ({ row }) => row.original?.endTime || "-",
            },
            {
                header: "Duration (hrs)",
                accessorKey: "duration",
                cell: ({ row }) =>
                    row.original?.duration != null
                        ? `${row.original.duration}h`
                        : "-",
            },
            {
                header: "Action",
                id: "actions",
                cell: ({ row }) => {
                    const req = row.original
                    if (!req?.id) return null

                    // ✅ Pending → Show buttons
                    if (req.status === "Pending") {
                    return (
                        <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateStatus(req.id, "Approved")}
                        >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </Button>

                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateStatus(req.id, "Rejected")}
                        >
                            <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                        </div>
                    )
                    }

                    // ✅ Approved
                    if (req.status === "Approved") {
                    return (
                        <span className="text-green-600 font-medium">
                         Approved
                        </span>
                    )
                    }

                    // ✅ Rejected
                    if (req.status === "Rejected") {
                    return (
                        <span className="text-red-600 font-medium">
                         Rejected
                        </span>
                    )
                    }

                    return null
                },
            }
        ],
        [updateStatus]
    )

    const table = useReactTable({
        data: filteredRequests,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className="px-4 py-3 text-left font-semibold"
                                >
                                    {flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="border-t hover:bg-muted/30">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-3">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="text-center py-10 text-muted-foreground"
                            >
                                No Pending Requests
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
