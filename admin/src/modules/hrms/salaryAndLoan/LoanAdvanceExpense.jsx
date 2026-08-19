import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoanPage } from "./LoanPage"
import { AdvanceSalaryPage } from "./AdvanceSalaryPage"
import { FileText, Wallet } from "lucide-react"
import { EmployeeSalaryPage } from "./EmployeeSalaryPage"
import { IncentivePage } from "./IncentivePage"
import { ExpensePage } from "./ExpensePage"

export const LoanAdvanceExpense = () => {
  return (
    <div className="p-6">

      <Tabs defaultValue="advance" className="w-full">

        {/* Better Styled Tabs */}
        <TabsList className="bg-gray-100 p-1 rounded-xl inline-flex">

          <TabsTrigger
            value="loan"
            className="
              flex items-center gap-2 px-6 py-2 rounded-lg
              text-gray-600
              hover:text-gray-900
              data-[state=active]:bg-green-600
              data-[state=active]:text-white
              data-[state=active]:shadow-sm
              transition
            "
          >
            <FileText className="w-4 h-4" />
            Loan
          </TabsTrigger>

          <TabsTrigger
            value="advance"
            className="
              flex items-center gap-2 px-6 py-2 rounded-lg
              text-gray-600
              hover:text-gray-900
              data-[state=active]:bg-green-600
              data-[state=active]:text-white
              data-[state=active]:shadow-sm
              transition
            "
          >
            <Wallet className="w-4 h-4" />
            Advance Salary
          </TabsTrigger>

          <TabsTrigger
            value="expense"
            className="
              flex items-center gap-2 px-6 py-2 rounded-lg
              text-gray-600
              hover:text-gray-900
              data-[state=active]:bg-green-600
              data-[state=active]:text-white
              data-[state=active]:shadow-sm
              transition
            "
          >
            <Wallet className="w-4 h-4" />
            Expense
          </TabsTrigger>

        </TabsList>

        <TabsContent value="loan" className="mt-6">
          <LoanPage />
        </TabsContent>

        <TabsContent value="advance" className="mt-6">
          <AdvanceSalaryPage />
        </TabsContent>

        <TabsContent value="expense" className="mt-6">
          <ExpensePage />
        </TabsContent>

      </Tabs>
    </div>
  )
}