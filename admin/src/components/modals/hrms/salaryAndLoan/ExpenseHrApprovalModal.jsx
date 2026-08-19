import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useHrApproveMutation } from "@/services/hrms/expense.api"

export const ExpenseHrApprovalModal = ({ open, setOpen, expense }) => {
  const [updateStatus] = useHrApproveMutation()

  const handleApprove = async () => {
    await updateStatus({
      id: expense.id,
      status: "finance_approved",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>HR / Finance Approval</DialogTitle>
        </DialogHeader>

        <Button onClick={handleApprove} className="w-full">
          Approve & Send to Payment
        </Button>
      </DialogContent>
    </Dialog>
  )
}