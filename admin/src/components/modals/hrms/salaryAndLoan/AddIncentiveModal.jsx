import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useGetIncentivesQuery, useUpdateIncentiveMutation, useCreateIncentiveMutation } from "@/services/hrms/incentive.api"
import { useEffect } from "react"

export const AddIncentiveModal = ({ open, setOpen, employees = [], initialData }) => {
    const { register, handleSubmit, reset, setValue, watch } = useForm()
    const selectedType = watch("type")
    const isEdit = Boolean(initialData);
    const [createIncentive] = useCreateIncentiveMutation()
    const [updateIncentive] = useUpdateIncentiveMutation()

    

    useEffect(() => {
        if (initialData) {
            reset(initialData)
        } else {
            reset({
            employeeName: "",
            amount: "",
            type: "",
            period: "",
            paymentMode: "with_salary"
            })
        }
}, [initialData, reset])

    const submitHandler = async (data) => {

        const payload = {
            ...data,
        }

        if (isEdit) {
            await updateIncentive({ id: initialData.id, ...payload })
        } else {
            await createIncentive(payload)
        }

        reset()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Add Employee Incentive</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(submitHandler)}
                    className="space-y-4"
                >
                    <div>
                        <Label>Employee *</Label>
                        <Select
                            value={watch("userId")}
                            onValueChange={(val) => {
                                setValue("userId", val);
                                const emp = employees.find(e => e.userId === val);
                                if (emp) setValue("employeeName", `${emp.firstName} ${emp.lastName}`);
                            }}
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
                        <input type="hidden" {...register("userId", { required: true })} />
                    </div>

                    {/* <div>
            <Label>Employee Code</Label>
            <Input {...register("employeeNumber", { required: true })} />
          </div> */}

                    <div>
                        <Label>Incentive Amount (₹)</Label>
                        <Input
                            type="number"
                            {...register("amount", { required: true })}
                        />
                    </div>

                    <div>
                        <Label>Incentive Type</Label>
                        <Select
                        value={selectedType}
                        onValueChange={(value) => setValue("type", value)}
                        >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Incentive Type" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="Performance">Performance</SelectItem>
                            <SelectItem value="Festival">Festival</SelectItem>
                            <SelectItem value="Bonus">Bonus</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                        </SelectContent>
                        </Select>

                        <input
                            type="hidden"
                            {...register("type", { required: true })}
                        />
                    </div>
                    <div>
                        <Label>Period (YYYY-MM)</Label>
                        <Input
                            type="month"
                            {...register("period", { required: true })}
                        />
                    </div>

                    <div>
                        <Label>Payment Mode</Label>

                        <div className="flex gap-4 mt-2">

                            <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer">
                                <input
                                    type="radio"
                                    value="with_salary"
                                    {...register("paymentMode")}
                                />
                                With Salary
                            </label>

                            <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer">
                                <input
                                    type="radio"
                                    value="separate"
                                    {...register("paymentMode")}
                                />
                                Pay Separately
                            </label>

                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        Save Incentive
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}