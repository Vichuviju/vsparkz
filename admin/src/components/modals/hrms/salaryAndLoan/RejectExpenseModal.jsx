import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useRejectExpenseMutation } from "@/services/hrms/expense.api"
import { useForm } from "react-hook-form"

export const RejectExpenseModal = ({ open, setOpen, expense }) => {
  const { register, handleSubmit } = useForm()
  const [rejectExpense] = useRejectExpenseMutation()

  const onSubmit = async (data) => {
    await rejectExpense({
      id: expense.id,
      remark: data.reason,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <textarea
            {...register("reason", { required: true })}
            className="w-full border rounded-md p-2"
            placeholder="Enter rejection reason"
          />

          <Button type="submit" variant="destructive" className="w-full">
            Reject
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}