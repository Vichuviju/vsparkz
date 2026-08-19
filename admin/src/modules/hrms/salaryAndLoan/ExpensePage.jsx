import React, { useState, useMemo } from "react"
import { ExpenseTable } from "./ExpenseTable"
import { ExpenseApprovalCard } from "./ExpenseApprovalCard"
import {
  useGetExpensesQuery,
  useCreateExpensesMutation,
  useManagerApproveMutation,
  useHrApproveMutation,
  useUpdateExpensesMutation,
  useDeleteExpensesMutation
} from "@/services/hrms/expense.api"

import { RejectExpenseModal } from "@/components/modals/hrms/salaryAndLoan/RejectExpenseModal"
import { ExpenseManagerApproveModal } from "@/components/modals/hrms/salaryAndLoan/ExpenseManagerApprovalModal"
import { ExpenseHrApprovalModal } from "@/components/modals/hrms/salaryAndLoan/ExpenseHrApprovalModal"
import { AddExpenseModal } from "@/components/modals/hrms/salaryAndLoan/AddExpenseModal"
import { Button } from "@/components/ui/button"
import { ExpenseApprovalModal } from "@/components/modals/hrms/salaryAndLoan/ExpenseApprovalModal"



export const ExpensePage = () => {
  const role = "hr" // change dynamically later

  const { data = [], isLoading } = useGetExpensesQuery()

  const [createExpense] = useCreateExpensesMutation()
  const [updateExpense] = useUpdateExpensesMutation();
  const [deleteExpense] = useDeleteExpensesMutation();
//   const [managerApprove] = useManagerApproveMutation()
//   const [hrApprove] = useHrApproveMutation()

  const [selected, setSelected] = useState(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const [hrOpen, setHrOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editData, setEditData] = useState(null);

  const pendingExpenses = useMemo(() => {
    if (role === "manager") {
      return data.filter((e) => e.status === "SUBMITTED")
    }
    if (role === "hr") {
      return data.filter((e) => e.status === "SUBMITTED")
    }
    return []
  }, [data, role])


  return (
    <div className="p-6 space-y-8">

      {/* Add Button */}
      {/* {role === "employee" && ( */}
        <div className="flex justify-end">
          <Button onClick={() => setAddOpen(true)}>
            + Submit Expense
          </Button>
        </div>
      {/* )} */}

      {/* Approval Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pendingExpenses.map((expense) => (
          <ExpenseApprovalCard
            key={expense.id}
            data={expense}
            onApprove={() => {
              setSelected(expense)
              role === "manager"
                ? setManagerOpen(true)
                : setHrOpen(true)
            }}
            onReject={() => {
              setSelected(expense)
              setRejectOpen(true)
            }}
          />
        ))}
      </div>

      {/* Table */}
      <ExpenseTable
        data={data}
        onEdit={(expense) => {
            setEditData(expense)
            setAddOpen(true)
        }}
        onDelete={async (id) => {
            await deleteExpense(id)
        }}
     />

      {/* Add Expense */}
      <AddExpenseModal
        open={addOpen}
        setOpen={(val) => {
            setAddOpen(val)
            if (!val) setEditData(null)
        }}
        initialData={editData}
        onSubmitExpense={async (formData) => {
            const formattedData = {
            ...formData,
            category: formData.category?.toUpperCase(),
            paymentMode: formData.paymentMode?.toUpperCase(),
            }

            if (editData) {
            await updateExpense({
                id: editData.id,
                data: formattedData,
            })
            } else {
            await createExpense(formattedData)
            }
        }}
     />

      {/* Manager Approve */}
      {/* <ExpenseManagerApproveModal
        open={managerOpen}
        setOpen={setManagerOpen}
        expense={selected}
        onConfirm={async () => {
          await managerApprove(selected.id)
          setManagerOpen(false)
        }}
      /> */}

      {/* HR Approve */}
      {/* <ExpenseHrApprovalModal
        open={hrOpen}
        setOpen={setHrOpen}
        expense={selected}
        onConfirm={async () => {
          await hrApprove(selected.id)
          setHrOpen(false)
        }}
      /> */}

      <ExpenseApprovalModal
            open={managerOpen || hrOpen}
            setOpen={(val) => {
              if (!val) {
                setManagerOpen(false)
                setHrOpen(false)
              }
            }}
            expense={selected}
            role={role}
        />

      {/* Reject */}
      <RejectExpenseModal
        open={rejectOpen}
        setOpen={setRejectOpen}
        expense={selected}
      />
    </div>
  )
}