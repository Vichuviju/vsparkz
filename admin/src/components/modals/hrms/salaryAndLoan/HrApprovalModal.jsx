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

import { useForm } from "react-hook-form"
import { useEffect } from "react"
import { toast } from "sonner"

export const HrApprovalModal = ({
  open,
  setOpen,
  data,
  onApprove,
}) => {
    const {
        handleSubmit,
        register,
        reset,
    } = useForm({
        defaultValues: {
            paymentMode: "with_salary"
        }
    })

  useEffect(() => {
    if (data) {
      reset({
        deductionDate: "",
        remarks: "",
      })
    }
  }, [data, reset])

  const onSubmit = async (formData) => {
    try {
        
        await onApprove({
        id: data?.id,
        deductionDate: formData.deductionDate,
        paymentMode: formData.paymentMode,
        remarks: formData.remarks,
        })

        toast.success("Request Approved Successfully")
        setOpen(false)
        reset()
    } catch (error) {
        toast.error("Approval Failed")
    }
 }

 

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            HR Approval
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Info Text */}
          <p className="text-sm text-gray-500">
            Select deduction date before approving this loan request.
          </p>

          {/* Info Card */}
          <div className="bg-gray-100 rounded-xl p-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Employee:</span>{" "}
              {data?.employeeName || "Unknown Employee"}
            </p>
            <p>
              <span className="font-semibold">Amount:</span>{" "}
              {data?.amount} {data?.currency}
            </p>
            {data?.installments && (<p>
              <span className="font-semibold">Installments:</span>{" "}
              {data?.installments}
            </p>) }
          </div>

          {/* Deduction Date */}
          <div className="space-y-2">
            <Label>
              Deduction Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              {...register("deductionDate", { required: true })}
            />
            <p className="text-xs text-gray-500">
              Select the date when the loan amount will be deducted from salary
            </p>
          </div>

          {/* Payment Mode */}
        <div className="space-y-2">
        <Label>
            Payment Mode <span className="text-red-500">*</span>
        </Label>

        <div className="flex gap-4">

            <label className="flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer">
            <input
                type="radio"
                value="with_salary"
                {...register("paymentMode", { required: true })}
            />
            With Salary
            </label>

            <label className="flex items-center gap-2 border rounded-lg px-4 py-3 cursor-pointer">
            <input
                type="radio"
                value="separate"
                {...register("paymentMode", { required: true })}
            />
            Pay Separately
            </label>

        </div>
        </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks (optional)</Label>
            <Textarea
              placeholder="Add remarks..."
              {...register("remarks")}
            />
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
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}