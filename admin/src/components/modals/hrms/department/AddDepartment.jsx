import React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateEmployeeDepartmentMutation } from "@/services/hrms/department.api.js";

// ------------------------------
// ZOD SCHEMA
// ------------------------------
const DepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  status: z
    .string()
    .min(1, "Status is required")
    .refine((val) => ["active", "inactive"].includes(val)),
  description: z.string().optional(),
});

export function AddDepartment({ open, onClose }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(DepartmentSchema),
    mode: "onSubmit",
    defaultValues: {
      name: "",
      code: "",
      status: "",
      description: "",
    },
  });
 const [createDepartment, { isLoading }] = useCreateEmployeeDepartmentMutation();

const onSubmit = async (data) => {

  try {
    await createDepartment({
      name: data.name.trim(),
      departmentCode: data.code.trim().toUpperCase(),
      status: data.status.toUpperCase(), // ACTIVE / INACTIVE
      description: data.description?.trim() || null,
    }).unwrap();

    toast.success("Department created successfully!");
    reset();
    onClose();
  } catch (error) {
    console.error("Error saving department:", error);
    
    // Check for specific error status from backend (409 Conflict) (Duplicate)
    const isDuplicate = error?.status === 409;
    const errorMessage = error?.data?.message || "Failed to save department. Please try again.";
    
    if (isDuplicate) {
      toast.warning(errorMessage);
    } else {
      toast.error(errorMessage);
    }
  }
};



//   const onSubmit = async (data) => {
//     try {
//       // 👉 API call here
//       console.log("DEPARTMENT DATA:", data);

//       toast.success("Department created successfully");
//       reset();
//       onClose();
//     } catch (error) {
//       toast.error("Failed to create department");
//     }
//   };

  const handleError = (errors) => {
    const firstError = Object.values(errors)[0];
    toast.error(firstError?.message || "Please fill required fields");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border rounded-2xl shadow-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add Department
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit, handleError)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"
        >
          {/* Department Name */}
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">
              Department Name <span className="text-red-500">*</span>
            </label>
            <Input placeholder="Enter department name" {...register("name")} />
            {errors.name && (
              <p className="text-red-500 text-xs">{errors.name.message}</p>
            )}
          </div>

          {/* Department Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Department Code <span className="text-red-500">*</span>
            </label>
            <Input placeholder="Eg: HR, DEV" {...register("code")} />
            {errors.code && (
              <p className="text-red-500 text-xs">{errors.code.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Status <span className="text-red-500">*</span>
            </label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-red-500 text-xs">{errors.status.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2 space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              rows={3}
              placeholder="Department description (optional)"
              {...register("description")}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="col-span-2 flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="!bg-primary-blue !text-white">
              Add Department
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
