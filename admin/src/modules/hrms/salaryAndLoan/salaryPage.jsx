import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { EmployeeSalaryTable } from "./EmployeeSalaryTable"
import { AddSalaryModal } from "@/components/modals/hrms/salaryAndLoan/AddSalaryModal"

export const SalaryPage = () => {
  const [open, setOpen] = useState(false)

  const [salaryData, setSalaryData] = useState([])

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6 space-y-6">
      
      <div className="flex justify-end">
        <Button
          onClick={() => setOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Salary
        </Button>
      </div>

      {/* Table */}
      <EmployeeSalaryTable data={salaryData} />

      {/* Modal */}
      <AddSalaryModal
        open={open}
        setOpen={setOpen}
        onAddSalary={(newSalary) =>
            setSalaryData((prev) => [...prev, newSalary])
        }
      />
    </div>
  )
}