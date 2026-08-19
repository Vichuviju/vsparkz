import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useManagerApproveMutation } from "@/services/hrms/expense.api"

export const ExpenseManagerApproveModal = ({ open, setOpen, expense }) => {
  const [updateStatus] = useManagerApproveMutation()

  const handleApprove = async () => {
    await updateStatus({
      id: expense.id,
      status: "manager_approved",
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manager Approval</DialogTitle>
        </DialogHeader>

        <Button onClick={handleApprove} className="w-full">
          Confirm Approval
        </Button>
      </DialogContent>
    </Dialog>
  )
}