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
import { Download, Upload } from "lucide-react"

export const AddSalaryModal = ({
  open,
  setOpen,
  onAddSalary,
  initialData = null,
}) => {
  const {
    handleSubmit,
    control,
    register,
    reset,
  } = useForm()

  const isEdit = !!initialData

  useEffect(() => {
    if (initialData) {
      reset(initialData)
    } else {
      reset({})
    }
  }, [initialData, reset])

  const onSubmit = (data) => {
    onAddSalary?.(data)

    toast.success("Salary added successfully")

    setOpen(false)
    reset()
 }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Salary" : "Add Salary"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Employee + Employee Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Employee Name *</Label>
              <Controller
                name="employeeName"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emp1">Employee 1</SelectItem>
                      <SelectItem value="emp2">Employee 2</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Employee Number</Label>
              <Input
                placeholder="Employee Number"
                {...register("employeeNumber")}
              />
            </div>
          </div>

          {/* Total + Basic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Total Salary *</Label>
              <Input
                type="number"
                {...register("totalSalary")}
              />
            </div>

            <div className="space-y-2">
              <Label>Basic Salary *</Label>
              <Input
                type="number"
                {...register("basicSalary")}
              />
            </div>
          </div>



          {/* Payment Type + Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">
                        AED (UAE Dirham)
                      </SelectItem>
                      <SelectItem value="USD">
                        USD
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Controller
                name="paymentMethod"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
                      <SelectItem value="cash">
                        Cash
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* From Date + To Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>From Date *</Label>
              <Input type="date" {...register("fromDate")} />
            </div>

            <div className="space-y-2">
              <Label>To Date *</Label>
              <Input type="date" {...register("toDate")} />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Bulk Upload</h3>

            <div className="flex gap-4">
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Sample
              </Button>

              <Button
                type="button"
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Excel
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isEdit ? "Update Salary" : "Add Salary"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}