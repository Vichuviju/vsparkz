import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useForm, Controller } from "react-hook-form"
import { useEffect } from "react"
import { toast } from "sonner"
import { useCreateLoanMutation, useUpdateLoanMutation } from "@/services/hrms/loan.api"
import { useSelector } from "react-redux"

export const LoanRequestModal = ({
  open,
  setOpen,
  initialData = null,
}) => {
  const {
    handleSubmit,
    control,
    register,
    reset,
  } = useForm()
  
  console.log("initial---Data---check --data--to get--", initialData);
  const userProfile = useSelector((state) => (state.user && state.user.user) || {})
  const [updateLoan] = useUpdateLoanMutation()
  const isEdit = !!initialData
  const [createLoan, { isLoading }] = useCreateLoanMutation()

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toISOString().split("T")[0]
  }

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        date: formatDate(initialData.date),
      })
    } else {
      reset({
        date: new Date().toISOString().split("T")[0],
      })
    }
  }, [initialData, reset])

 const onSubmit = async (data) => {
  try {
    const payload = {
      ...data,
      userId: userProfile?.id,
    }

    if (isEdit) {
      await updateLoan({
        id: initialData.id,
        ...payload,
      }).unwrap()

      toast.success("Loan updated successfully")
    } else {
      await createLoan(payload).unwrap()
      toast.success("Loan request submitted successfully")
    }

    setOpen(false)
    reset()
  } catch (error) {
    toast.error("Failed to submit loan")
  }
}


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Loan Request" : "Loan Request"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Loan Type */}
          <div className="space-y-2">
            <Label>Loan Type *</Label>
            <Controller
              name="loanType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Loan Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_loan">
                      Home Loan
                    </SelectItem>
                    <SelectItem value="medical_loan">
                      Medical Loan
                    </SelectItem>
                    <SelectItem value="personal_loan">
                      Personal Loan
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Amount + Payment Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                {...register("amount")}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <Controller
                name="paymentType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        Cash
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              {...register("date")}
            />
          </div>

          {/* No of Installments */}
          <div className="space-y-2">
            <Label>No. of Instalments *</Label>
            <Input
              type="number"
              placeholder="Enter number of instalments"
              {...register("installments")}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              {...register("reason")}
              placeholder="Write your reason for loan"
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <Label>
              Attachment <span className="text-red-500">*</span>
            </Label>
            <Input
              type="file"
              {...register("attachment")}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full">
              {isEdit ? "Update Loan" : "Submit Loan"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}