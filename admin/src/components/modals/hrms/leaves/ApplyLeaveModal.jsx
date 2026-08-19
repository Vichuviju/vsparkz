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
import { useApplyLeaveMutation, useUpdateLeaveMutation } from "@/services/hrms/leaves.api.js"
import { useEffect } from "react"
import { toast } from "sonner";
import { useSelector } from "react-redux"

export const ApplyLeaveModal = ({ open, setOpen, initialData = null }) => {
  const {
    handleSubmit,
    control,
    register,
    reset,
  } = useForm()

  const user = useSelector((state)=> state?.user?.user)

  const [applyLeave] = useApplyLeaveMutation()
  const [updateLeave] = useUpdateLeaveMutation()

  const isEdit = !!initialData

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toISOString().split("T")[0]
  }

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        fromDate: formatDate(initialData.fromDate),
        toDate: formatDate(initialData.toDate),
      })
    } else {
      reset({})
    }
  }, [initialData, reset])

 const onSubmit = async (data) => {
  try {
    if (isEdit) {
      await updateLeave({
        id: initialData.id,
        ...data,
      }).unwrap()
      toast.success("Leave updated successfully");
    } else {
      await applyLeave(data).unwrap()
      toast.success("Leave applied successfully");
    }

    setOpen(false)
    reset()
  } catch (err) {
     toast.error("Failed to apply leave");
    console.error(err)
  }
}


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Leave" : "Apply Leave"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Leave Plan */}
          <div className="space-y-2">
            <Label>Leave Plan *</Label>
            <Controller
              name="leavePlan"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">
                      Confirmed
                    </SelectItem>
                    <SelectItem value="planned">
                      Planned
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Leave Type */}
          <div className="space-y-2">
            <Label>Leave Type *</Label>
            <Controller
              name="leaveType"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cl">Casual Leave</SelectItem>
                    <SelectItem value="sl">Sick Leave</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* From Date */}
          <div className="space-y-2">
            <Label>From *</Label>
            <Input
              type="date"
              {...register("fromDate")}
            />
          </div>

          {/* To Date */}
          <div className="space-y-2">
            <Label>To *</Label>
            <Input
              type="date"
              {...register("toDate")}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Leave Reason</Label>
            <Textarea
              {...register("reason")}
              placeholder="Write your reason"
            />
          </div>

            {/* Leave Type */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="hr_approved">HR Approved</SelectItem>
                    <SelectItem value="manager_approved">Manager Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full">
              {isEdit ? "Update Leave" : "Submit Leave"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
