
"use client";

import { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parse } from "date-fns";

type BulkLogTimeData = {
    date: string;
    clockIn: string;
    clockOut: string;
    breakDuration: number;
    status: 'full-day' | 'half-day' | 'absent';
}

interface BulkLogTimeDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    employeeIds: string[];
    onSave: (data: BulkLogTimeData) => void;
}

export function BulkLogTimeDialog({ isOpen, onOpenChange, employeeIds, onSave }: BulkLogTimeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [date, setDate] = useState(new Date());
  const [clockInTime, setClockInTime] = useState("09:00");
  const [clockOutTime, setClockOutTime] = useState("17:00");
  const [breakDuration, setBreakDuration] = useState("60");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (employeeIds.length === 0) {
      toast({
        variant: "destructive",
        title: "No employees selected",
        description: "Please select at least one employee to log time for.",
      });
      return;
    }
    setIsLoading(true);
    
    const clockInDate = set(date, { hours: parseInt(clockInTime.split(':')[0]), minutes: parseInt(clockInTime.split(':')[1])});
    const clockOutDate = set(date, { hours: parseInt(clockOutTime.split(':')[0]), minutes: parseInt(clockOutTime.split(':')[1])});
    
    onSave({
        date: format(date, 'yyyy-MM-dd'),
        clockIn: clockInDate.toISOString(),
        clockOut: clockOutDate.toISOString(),
        breakDuration: Number(breakDuration) || 0,
        status: 'full-day'
    });

    setIsLoading(false);
    onOpenChange(false);

    toast({
        title: "Bulk Time Logged",
        description: `Successfully logged time for ${employeeIds.length} employees.`
    })

  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Log Employee Time</DialogTitle>
          <DialogDescription>
            Record clock-in, clock-out, and break times for all selected employees ({employeeIds.length}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-auto p-1">
            <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                        Date
                    </Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        value={format(date, 'yyyy-MM-dd')}
                        onChange={(e) => setDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                        required
                        className="col-span-3"
                    />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clock-in" className="text-right">Clock In</Label>
                    <Input id="clock-in" type="time" value={clockInTime} onChange={e => setClockInTime(e.target.value)} className="col-span-3"/>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="clock-out" className="text-right">Clock Out</Label>
                    <Input id="clock-out" type="time" value={clockOutTime} onChange={e => setClockOutTime(e.target.value)} className="col-span-3"/>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="break" className="text-right">Break (mins)</Label>
                    <Input id="break" type="number" className="col-span-3" value={breakDuration} onChange={e => setBreakDuration(e.target.value)} placeholder="e.g., 30" />
                </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || employeeIds.length === 0}>
              {isLoading ? "Saving..." : "Save Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
