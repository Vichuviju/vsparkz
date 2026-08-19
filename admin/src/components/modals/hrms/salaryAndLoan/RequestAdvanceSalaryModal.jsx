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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useForm, Controller } from "react-hook-form"
import { useEffect } from "react"
import { toast } from "sonner"
import { useSelector } from "react-redux"
import { 
useCreateAdvanceSalaryMutation,
useUpdateAdvanceSalaryMutation 
} from "@/services/hrms/advanceSalary.api"

export const RequestAdvanceSalaryModal = ({
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

  const user = useSelector((state) => state?.user?.user)
  const [createAdvanceSalary, { isLoading }] = useCreateAdvanceSalaryMutation()
  const [updateAdvanceSalary] = useUpdateAdvanceSalaryMutation()

  const isEdit = !!initialData

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    } else {
      reset({
        employeeId: user?.employeeId || user?.id,
      })
    }
  }, [initialData, reset, user])

const onSubmit = async (data) => {
  try {

    if (isEdit) {

      await updateAdvanceSalary({
        id: initialData.id,
        ...data
      }).unwrap()

      toast.success("Advance salary updated")

    } else {

      const payload = {
        ...data,
        status: "submitted",
        userId: user?.id,
      }

      await createAdvanceSalary(payload).unwrap()

      toast.success("Advance salary requested")

    }

    setOpen(false)
    reset()

  } catch (err) {
    toast.error("Something went wrong")
  }
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Edit Advance Salary"
              : "Request Advance Salary"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Employee */}
            <div className="space-y-2">
              <Label>
                Employee <span className="text-red-500">*</span>
              </Label>
              <Input
                readOnly
                {...register("employeeId")}
              />
            </div>

            {/* Advance Type */}
            <div className="space-y-2">
              <Label>
                Advance Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="advanceType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Advance Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary_advance">
                        Salary Advance
                      </SelectItem>
                      <SelectItem value="festival_advance">
                        Festival Advance
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

          </div>

          {/* Advance Amount */}
          <div className="space-y-2">
            <Label>
              Advance Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              placeholder="Enter advance amount"
              {...register("amount")}
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Submit
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}