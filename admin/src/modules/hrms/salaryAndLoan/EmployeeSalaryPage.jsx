import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { EmployeeSalaryTable } from "./EmployeeSalaryTable"
import { AddSalaryModal } from "@/components/modals/hrms/salaryAndLoan/AddSalaryModal"
import { useGetAllSalariesQuery, useGetMySalaryQuery } from "@/services/hrms/employeeSalary.api"

export const EmployeeSalaryPage = () => {
  const [open, setOpen] = useState(false)
  const role = "admin"
  const [salaryData, setSalaryData] = useState([])

const { data: allData } = useGetAllSalariesQuery(undefined, {
  skip: role !== "admin",
})

const { data: myData } = useGetMySalaryQuery(undefined, {
  skip: role !== "employee",
})

const salaryDataOr =
  role === "admin"
    ? allData?.data ?? []
    : myData?.data
      ? [myData.data]
      : []

  const formattedSalaryData = salaryDataOr.map((item) => ({
  employeeName: `${item.firstName ?? ""} ${item.lastName ?? ""}`,
  employeeNumber: item.empCode,
  department: item.department ?? "-",
  totalSalary: Number(item.totalSalary),
  basicSalary: Number(item.basicSalary),
  da: Number(item.da),
  hra: Number(item.hra),
  travel: Number(item.travel),
  special: Number(item.special),
  other: Number(item?.other),

  // paymentType: "AED",
}))

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 p-6 space-y-6">
      


      {/* Table */}
      <EmployeeSalaryTable data={formattedSalaryData} />

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