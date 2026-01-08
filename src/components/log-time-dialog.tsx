
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/use-database";
import { useAttendance } from "@/hooks/use-attendance";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Combobox } from "./ui/combobox";
import { format, set, parse } from 'date-fns';

export function LogTimeDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { employees, loading: employeesLoading } = useEmployees();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // We manage attendance hook at this level to handle date changes
  const { attendance, updateAttendance } = useAttendance(selectedDate);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const employeeOptions = employees.map(e => ({ value: e.id, label: e.name }));

  // Form state
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");
  const [breakDuration, setBreakDuration] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedEmployeeId && attendance[selectedEmployeeId]) {
      const record = attendance[selectedEmployeeId];
      setClockInTime(record.clockIn ? format(new Date(record.clockIn), "HH:mm") : "");
      setClockOutTime(record.clockOut ? format(new Date(record.clockOut), "HH:mm") : "");
      setBreakDuration(record.breakDuration?.toString() || "");
      setNotes(record.notes || "");
    } else {
      // Reset form when employee changes or record doesn't exist
      setClockInTime("");
      setClockOutTime("");
      setBreakDuration("");
      setNotes("");
    }
  }, [selectedEmployeeId, attendance]);

  const setTimeToNow = (setter: React.Dispatch<React.SetStateAction<string>>) => {
      setter(format(new Date(), "HH:mm"));
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployeeId) {
        toast({ variant: "destructive", title: "Please select an employee." });
        return;
    }
    setIsLoading(true);

    try {
        const record = attendance[selectedEmployeeId] || {};

        const parseTime = (timeStr: string) => {
            if (!timeStr) return null;
            const [hours, minutes] = timeStr.split(':').map(Number);
            return set(selectedDate, { hours, minutes, seconds: 0, milliseconds: 0 });
        }

        const clockInDate = parseTime(clockInTime);
        const clockOutDate = parseTime(clockOutTime);

        await updateAttendance(selectedEmployeeId, {
            ...record,
            clockIn: clockInDate?.toISOString(),
            clockOut: clockOutDate?.toISOString(),
            breakDuration: Number(breakDuration) || 0,
            notes: notes,
            status: clockInDate ? 'full-day' : 'absent' // Simple logic for now
        });
        
        toast({
            title: "Time Logged",
            description: `Successfully logged time for the selected employee.`,
        });
        setIsLoading(false);
        setOpen(false);

    } catch (error) {
      console.error("Failed to log time:", error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save the time log.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{children}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Employee Time</DialogTitle>
          <DialogDescription>
            Record clock-in, clock-out, and break times for an employee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[70vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">
                  Employee *
                </Label>
                <div className="col-span-3">
                   <Combobox
                        options={employeeOptions}
                        value={selectedEmployeeId}
                        onChange={setSelectedEmployeeId}
                        placeholder="Select employee..."
                        searchPlaceholder="Search employees..."
                        notFoundMessage="No employees found."
                    />
                </div>
              </div>

               <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                        Date *
                    </Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        value={format(selectedDate, 'yyyy-MM-dd')}
                        onChange={(e) => setSelectedDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                        required
                        className="col-span-3"
                    />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clock-in" className="text-right">Clock In</Label>
                    <div className="col-span-3 flex gap-2">
                        <Input id="clock-in" type="time" value={clockInTime} onChange={e => setClockInTime(e.target.value)} />
                        <Button type="button" variant="outline" onClick={() => setTimeToNow(setClockInTime)}>Now</Button>
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clock-out" className="text-right">Clock Out</Label>
                    <div className="col-span-3 flex gap-2">
                        <Input id="clock-out" type="time" value={clockOutTime} onChange={e => setClockOutTime(e.target.value)} />
                        <Button type="button" variant="outline" onClick={() => setTimeToNow(setClockOutTime)}>Now</Button>
                    </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="break" className="text-right">Break (mins)</Label>
                    <Input id="break" type="number" className="col-span-3" value={breakDuration} onChange={e => setBreakDuration(e.target.value)} placeholder="e.g., 30" />
                </div>
              
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                        Notes
                    </Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        className="col-span-3"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || employeesLoading || !selectedEmployeeId}>
              {isLoading ? "Saving..." : "Save Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
