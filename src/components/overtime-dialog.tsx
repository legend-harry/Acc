
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Employee, AttendanceRecord } from "@/types";
import { formatCurrency } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";

interface OvertimeDialogProps {
  employee: Employee;
  attendanceRecord?: Partial<AttendanceRecord>;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (hours: number, rate: number) => void;
}

export function OvertimeDialog({
  employee,
  attendanceRecord,
  isOpen,
  onOpenChange,
  onSave,
}: OvertimeDialogProps) {
  const [hours, setHours] = useState<number | string>("");
  const [rate, setRate] = useState<number | string>("");
  const { toast } = useToast();
  const { currency } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      // Pre-fill hours and rate if they exist in the record
      setHours(attendanceRecord?.overtimeHours || "");
      
      // Calculate and set default rate if not present
      if (attendanceRecord?.overtimeRate) {
        setRate(attendanceRecord.overtimeRate);
      } else {
        const hourlyRate =
          employee.wageType === "daily"
            ? employee.wage / 8 // Assuming 8-hour workday
            : employee.wageType === "monthly"
            ? employee.wage / 22 / 8 // Assuming 22 work days/month, 8hr/day
            : employee.wage;
        const defaultOvertimeRate = hourlyRate * (employee.overtimeRateMultiplier || 1.5);
        setRate(parseFloat(defaultOvertimeRate.toFixed(2)));
      }
    }
  }, [isOpen, employee, attendanceRecord]);

  const handleSave = () => {
    const numHours = Number(hours);
    const numRate = Number(rate);

    if (numHours <= 0 || numRate <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter valid, positive numbers for hours and rate.",
      });
      return;
    }

    onSave(numHours, numRate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Overtime for {employee.name}</DialogTitle>
          <DialogDescription>
            Enter the number of overtime hours and the hourly rate. The default
            rate is calculated based on the employee's profile.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ot-hours" className="text-right">
              Hours
            </Label>
            <Input
              id="ot-hours"
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 2.5"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ot-rate" className="text-right">
              Rate ({currency}/hr)
            </Label>
            <Input
              id="ot-rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="col-span-3"
              placeholder={`e.g., ${formatCurrency(150, currency)}`}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave}>Save Overtime</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
