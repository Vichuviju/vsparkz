import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { toast } from "sonner"

export const RejectLoanModal = ({
  open,
  setOpen,
  data,
  onReject,
}) => {
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm()

  useEffect(() => {
    if (data) {
      reset({
        rejectionReason: "",
      })
    }
  }, [data, reset])

  const onSubmit = async (formData) => {
    try {
      await onReject({
        id: data?.id,
        rejectionReason: formData.rejectionReason,
      })

      toast.success("Loan Rejected Successfully")
      setOpen(false)
      reset()
    } catch (error) {
      toast.error("Rejection Failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Reject Loan Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Loan Info */}
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">Loan Type:</span>{" "}
              {data?.loanType}
            </p>
            <p>
              <span className="font-semibold">Amount:</span>{" "}
              {data?.amount} {data?.currency}
            </p>
            <p>
              <span className="font-semibold">Requested By:</span>{" "}
              {data?.firstName + "" + data?.lastName}
            </p>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-2">
            <Label>
              Rejection Reason <span className="text-red-500">*</span>
            </Label>

            <Textarea
              placeholder="Enter reason for rejection"
              {...register("rejectionReason", {
                required: "Rejection reason is required",
              })}
              className="min-h-[120px]"
            />

            {errors.rejectionReason && (
              <p className="text-sm text-red-500">
                {errors.rejectionReason.message}
              </p>
            )}
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Reject Loan
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}