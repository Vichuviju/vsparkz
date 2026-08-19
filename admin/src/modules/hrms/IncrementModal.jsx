import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAddIncrementMutation } from "@/services/hrms/employee.api";
import { Calculator } from "lucide-react";

export const IncrementModal = ({ isOpen, onClose, employee }) => {
  const [addIncrement, { isLoading }] = useAddIncrementMutation();
  const [formData, setFormData] = useState({
    effectiveFrom: new Date().toISOString().split('T')[0],
    totalSalary: 0,
    basicSalary: 0,
    hraAllowance: 0,
    da: 0,
    travelAllowance: 0,
    specialAllowance: 0,
    otherAllowance: 0,
  });
  const [incrementAmount, setIncrementAmount] = useState(0);

  // Pre-fill with current salary when opened
  useEffect(() => {
    if (isOpen && employee) {
      const currentSalary = Number(employee.totalSalary) || 0;
      setFormData({
        effectiveFrom: new Date().toISOString().split('T')[0],
        totalSalary: currentSalary,
        basicSalary: Number(employee.basicSalary) || 0,
        hraAllowance: Number(employee.hraAllowance) || 0,
        da: Number(employee.da) || 0,
        travelAllowance: Number(employee.travelAllowance) || 0,
        specialAllowance: Number(employee.specialAllowance) || 0,
        otherAllowance: Number(employee.otherAllowance) || 0,
      });
      setIncrementAmount(0);
    }
  }, [isOpen, employee]);

  const autoCalculate = (total) => {
    const salaryToBreak = Number(total || formData.totalSalary) || 0;
    if (!salaryToBreak || salaryToBreak <= 0) return;
    
    const basic = Math.round(salaryToBreak * 0.5);
    const hra = Math.round(salaryToBreak * 0.2);
    const da = 0;
    const travel = 0;
    const other = 0;
    const special = salaryToBreak - (basic + hra + da + travel + other);

    setFormData(prev => ({
      ...prev,
      basicSalary: basic,
      hraAllowance: hra,
      da,
      travelAllowance: travel,
      otherAllowance: other,
      specialAllowance: special
    }));
  };

  const handleIncrementChange = (value) => {
    // Allow empty string for backspacing
    if (value === "") {
      setIncrementAmount("");
      return;
    }

    const amount = Number(value);
    setIncrementAmount(amount);
    const currentSalary = Number(employee?.totalSalary) || 0;
    const newTotal = currentSalary + amount;
    
    setFormData(prev => ({
      ...prev,
      totalSalary: newTotal
    }));
    
    // Auto recalculate breakdown
    autoCalculate(newTotal);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Allow empty string for backspacing
    if (value === "" && name !== 'effectiveFrom') {
      setFormData(prev => ({ ...prev, [name]: "" }));
      if (name === 'totalSalary') setIncrementAmount("");
      return;
    }

    const numValue = Number(value);

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: name === 'effectiveFrom' ? value : numValue,
      };

      // If total salary is changed manually, update increment amount
      if (name === 'totalSalary') {
        const currentSalary = Number(employee?.totalSalary) || 0;
        setIncrementAmount(numValue - currentSalary);
        autoCalculate(numValue);
      }

      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!formData.effectiveFrom) {
      return toast.error("Effective date is required");
    }

    // Use Number() || 0 for all fields to handle empty strings
    const fs = (val) => Number(val) || 0;

    const calculatedTotal = 
      fs(formData.basicSalary) + 
      fs(formData.hraAllowance) + 
      fs(formData.da) + 
      fs(formData.travelAllowance) + 
      fs(formData.specialAllowance) + 
      fs(formData.otherAllowance);

    const totalToVerify = fs(formData.totalSalary);

    if (calculatedTotal !== totalToVerify) {
      return toast.error(`Breakdown (${calculatedTotal}) does not equal Total Salary (${totalToVerify})!`);
    }

    try {
      // Ensure we send numbers to the backend
      const payload = {
        ...formData,
        totalSalary: fs(formData.totalSalary),
        basicSalary: fs(formData.basicSalary),
        hraAllowance: fs(formData.hraAllowance),
        da: fs(formData.da),
        travelAllowance: fs(formData.travelAllowance),
        specialAllowance: fs(formData.specialAllowance),
        otherAllowance: fs(formData.otherAllowance),
      };

      await addIncrement({ id: employee.id, payload }).unwrap();
      toast.success("Increment added and Master Salary updated successfully!");
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add increment");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Salary Increment</DialogTitle>
          <DialogDescription>
            Update the employee's salary and record the change in history.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label>Effective Date</Label>
            <Input
              type="date"
              name="effectiveFrom"
              value={formData?.effectiveFrom}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label>Increment Amount (Monthly)</Label>
            <Input
              type="number"
              placeholder="Enter increment amount..."
              value={incrementAmount}
              onChange={(e) => handleIncrementChange(e.target.value)}
              className="border-blue-200 bg-blue-50 focus-visible:ring-blue-500"
            />
            <p className="text-[10px] text-slate-500 italic">
              Current: ₹{Number(employee?.totalSalary || 0).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between items-center">
              New Total Salary (Monthly)
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  autoCalculate();
                  toast.success("Salary breakdown auto-calculated");
                }} 
                className="h-6 px-2 text-xs gap-1 text-emerald-600"
              >
                <Calculator size={12} /> Auto-Breakdown
              </Button>
            </Label>
            <Input
              type="number"
              name="totalSalary"
              value={formData?.totalSalary}
              onChange={handleChange}
              className="font-bold border-emerald-200 bg-emerald-50"
            />
          </div>

          <div className="space-y-2">
            <Label>Basic Salary</Label>
            <Input type="number" name="basicSalary" value={formData.basicSalary} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>HRA</Label>
            <Input type="number" name="hraAllowance" value={formData.hraAllowance} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Dearness Allowance (DA)</Label>
            <Input type="number" name="da" value={formData.da} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Travel Allowance</Label>
            <Input type="number" name="travelAllowance" value={formData.travelAllowance} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Special Allowance</Label>
            <Input type="number" name="specialAllowance" value={formData.specialAllowance} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Other Allowance</Label>
            <Input type="number" name="otherAllowance" value={formData.otherAllowance} onChange={handleChange} />
          </div>
        </div>

        {/* Salary Balance Status */}
        {(() => {
          const fs = (val) => Number(val) || 0;
          const currentSum = 
            fs(formData.basicSalary) + 
            fs(formData.hraAllowance) + 
            fs(formData.da) + 
            fs(formData.travelAllowance) + 
            fs(formData.specialAllowance) + 
            fs(formData.otherAllowance);
          const target = fs(formData.totalSalary);
          const diff = target - currentSum;
          const isBalanced = currentSum === target;

          return (
            <div className={`mt-2 p-3 rounded-lg border flex justify-between items-center ${
              isBalanced ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"
            }`}>
              <div className="text-sm font-medium">
                {isBalanced ? (
                  <span className="flex items-center gap-2">✅ Salary is balanced (Total: ₹{target.toLocaleString()})</span>
                ) : (
                  <span className="flex items-center gap-2">
                    ⚠️ Sum (₹{currentSum.toLocaleString()}) is {diff > 0 ? "short by" : "over by"} ₹{Math.abs(diff).toLocaleString()}
                  </span>
                )}
              </div>
              {!isBalanced && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs border-amber-200 hover:bg-amber-100"
                  onClick={() => {
                    const currentSpecial = fs(formData.specialAllowance);
                    setFormData(prev => ({
                      ...prev,
                      specialAllowance: currentSpecial + diff
                    }));
                    toast.success("Adjusted Special Allowance to balance total");
                  }}
                >
                  Fix Balance
                </Button>
              )}
            </div>
          );
        })()}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            Save Increment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
