import React, { useMemo, useState } from "react"
import { SalaryManagementTable } from "./SalaryManagementTable"
import { useGetSalaryManagementQuery } from "@/services/hrms/salaryManagement.api"

export const SalaryManagementPage = () => {

  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  })

  const { data = [], isLoading } = useGetSalaryManagementQuery(month)

  const formattedData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      netSalary:
        Number(item.totalSalary || 0) +
        Number(item.incentiveAmount || 0) +
        Number(item.expenseAmount || 0) -
        Number(item.loanDeduction || 0) -
        Number(item.advanceDeduction || 0)
    }))
  }, [data])

  if (isLoading) return <p>Loading...</p>

  return (
    <div className="p-4">

      {/* Month Filter */}
      <div className="mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      <SalaryManagementTable salaries={formattedData} />
    </div>
  )
}