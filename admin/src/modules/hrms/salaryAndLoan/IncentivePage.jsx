import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { IncentiveTable } from "./IncentiveTable"
import { AddIncentiveModal } from "@/components/modals/hrms/salaryAndLoan/AddIncentiveModal"
import { useGetIncentivesQuery } from "@/services/hrms/incentive.api"
import { useGetAllEmployeesQuery } from "@/services/hrms/employee.api"

export const IncentivePage = () => {
  const [open, setOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const { data } = useGetIncentivesQuery()
  const { data: employeesResponse } = useGetAllEmployeesQuery()
  const employees = employeesResponse?.data || [];

  const handleEdit = (row) => {
    setEditData(row)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditData(null)
  }

  return (
    <div className="p-6 space-y-6">
      
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditData(null)
            setOpen(true)
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Incentive
        </Button>
      </div>

      {/* Table */}
     <IncentiveTable
        data={data?.data || []}
        onEdit={handleEdit}
      />

      <AddIncentiveModal
        open={open}
        setOpen={handleClose}
        employees={employees}
        initialData={editData}
      />
    </div>
  )
}