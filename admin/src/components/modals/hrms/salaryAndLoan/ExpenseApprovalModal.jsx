import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useApproveExpenseMutation } from "@/services/hrms/expense.api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"

export const ExpenseApprovalModal = ({
  open,
  setOpen,
  expense,
}) => {

  const { register, handleSubmit } = useForm()
  const [approveExpense] = useApproveExpenseMutation()

  const onSubmit = async () => {
    if (!expense) return
    await approveExpense(expense.id)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            Approval Decision
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve this expense claim to move it to the next workflow stage.
          </p>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 space-y-3">
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Employee</span>
                <span className="font-bold text-gray-900">{expense?.employeeName}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Category</span>
                <span className="px-2 py-0.5 rounded-md bg-white border text-[10px] font-black uppercase text-gray-600">
                  {expense?.category}
                </span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Payroll Month</span>
                <span className="font-bold text-indigo-600">
                  {expense?.payrollMonth ? (() => {
                      const [y, m] = expense.payrollMonth.split('-').map(Number);
                      return new Date(y, m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                  })() : 'Next Payroll'}
                </span>
             </div>
             <div className="pt-2 border-t border-indigo-100 flex justify-between items-center">
                <span className="text-gray-600 font-bold">Total Amount</span>
                <span className="text-lg font-black text-gray-900">₹{Number(expense?.amount).toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1 rounded-xl font-semibold h-11">
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold h-11 shadow-lg shadow-indigo-200">
            Confirm Approval
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}