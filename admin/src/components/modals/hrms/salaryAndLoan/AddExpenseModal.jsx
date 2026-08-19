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
import { Textarea } from "@/components/ui/textarea"
import { useForm, Controller } from "react-hook-form"
import { useEffect } from "react"
import { toast } from "sonner"
import { Upload } from "lucide-react"

export const AddExpenseModal = ({
  open,
  setOpen,
  onSubmitExpense,
  employees = [],
  initialData = null,
}) => {
  const {
    handleSubmit,
    control,
    register,
    reset,
    watch,
    setValue,
  } = useForm()
  
  const isEdit = !!initialData

  // Watch employeeName and auto-populate empCode (Employee ID)
  const selectedUserId = watch("employeeName")

  useEffect(() => {
    if (selectedUserId) {
      const selectedEmp = employees.find(emp => emp.userId === selectedUserId)
      if (selectedEmp) {
        setValue("empCode", selectedEmp.empCode)
      }
    }
  }, [selectedUserId, setValue, employees])

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        expenseDate: initialData.expenseDate
          ? initialData.expenseDate.split("T")[0]
          : "",
      })
    } else {
      reset({})
    }
  }, [initialData, reset])

  const onSubmit = async (data) => {
    // Force paymentMode to PAYROLL as per requirement
    const payload = { ...data, paymentMode: 'PAYROLL' };
    await onSubmitExpense?.(payload)

    toast.success(
      initialData
        ? "Expense updated successfully"
        : "Expense submitted successfully"
    )
    setOpen(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Expense Claim" : "Submit Expense Claim"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Employee + Employee ID */}
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
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.userId}>
                          {emp.firstName} {emp.lastName} ({emp.empCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input
                readOnly
                placeholder="Auto-selected from name"
                {...register("empCode")}
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Category + Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Expense Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRAVEL">Travel</SelectItem>
                      <SelectItem value="FOOD">Food</SelectItem>
                      <SelectItem value="ACCOMMODATION">
                        Accommodation
                      </SelectItem>
                      <SelectItem value="MEDICAL">Medical</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                {...register("amount")}
              />
            </div>
          </div>

          {/* Expense Date + Payroll Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Expense Date *</Label>
              <Input
                type="date"
                {...register("expenseDate")}
              />
            </div>

            <div className="space-y-2">
              <Label>Payroll Month *</Label>
              <Controller
                name="payrollMonth"
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  // Generate current month + next 5 months
                  const options = [];
                  const now = new Date();
                  for (let i = 0; i < 6; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
                    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM (local)
                    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                    options.push({ val, label });
                  }

                  return (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Payroll Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map(opt => (
                          <SelectItem key={opt.val} value={opt.val}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Enter expense description"
              {...register("description")}
            />
          </div>

          {/* Bill Upload Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Bill Attachment</h3>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Bill
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isEdit ? "Update Expense" : "Submit Expense"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}