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

import {
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
} from "@/services/hrms/holiday.api"
import { useGetShiftsQuery } from "@/services/hrms/shifts.api"

export const HolidayModal = ({ open, setOpen, initialData = null }) => {
  const {
    handleSubmit,
    control,
    register,
    reset,
  } = useForm()

  const [createHoliday, { isLoading: isCreating }] =
    useCreateHolidayMutation()

  const [updateHoliday, { isLoading: isUpdating }] =
    useUpdateHolidayMutation()

  const { data: shiftsData } = useGetShiftsQuery()

  const isEdit = !!initialData

  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toISOString().split("T")[0]
  }

  useEffect(() => {
    if (initialData) {
      reset({
        holidayName: initialData.holidayName,
        date: formatDate(initialData.date),
        type: initialData.type,
        region: initialData.region,
        shiftId: initialData.shiftId ? String(initialData.shiftId) : "all",
        description: initialData.description,
      })
    } else {
      reset({
        holidayName: "",
        date: "",
        type: "public",
        region: "INDIA",
        shiftId: "all",
        description: "",
      })
    }
  }, [initialData, reset])

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateHoliday({
          id: initialData.id,
          ...data,
          shiftId: data.shiftId === "all" ? null : Number(data.shiftId),
        }).unwrap()

        toast.success("Holiday updated successfully")
      } else {
        await createHoliday({
          ...data,
          shiftId: data.shiftId === "all" ? null : Number(data.shiftId),
        }).unwrap()
        toast.success("Holiday added successfully")
      }

      setOpen(false)
      reset()
    } catch (err) {
      toast.error("Failed to save holiday")
      console.error(err)
    }
  }

  const isLoading = isCreating || isUpdating

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Holiday" : "Add New Holiday"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Holiday Name */}
          <div className="space-y-2">
            <Label>Holiday Name *</Label>
            <Input
              {...register("holidayName", { required: true })}
              placeholder="Enter holiday name"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              {...register("date", { required: true })}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              name="type"
              control={control}
              defaultValue="public"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      Public Holiday
                    </SelectItem>
                    <SelectItem value="restricted">
                      Restricted Holiday
                    </SelectItem>
                    <SelectItem value="company">
                      Company Holiday
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Region */}
          <div className="hidden">
            <Label>Region *</Label>
            <Controller
              name="region"
              control={control}
              defaultValue="INDIA"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDIA">India</SelectItem>
                    <SelectItem value="UAE">UAE</SelectItem>
                    <SelectItem value="SAUDI">Saudi Arabia</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Shift selection */}
          <div className="space-y-2">
            <Label>Shift</Label>
            <Controller
              name="shiftId"
              control={control}
              defaultValue="all"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift (Global if All)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🌍 All Shifts (Global)</SelectItem>
                    {shiftsData?.data?.map(shift => (
                        <SelectItem key={shift.id} value={String(shift.id)}>
                            ✨ {shift.shiftName}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register("description")}
              placeholder="Enter holiday description (optional)"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-4">

            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[140px]"
            >
              {isLoading
                ? "Saving..."
                : isEdit
                ? "Update Holiday"
                : "Add Holiday"}
            </Button>

          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
