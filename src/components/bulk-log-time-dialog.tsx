
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
import { format, parse, eachDayOfInterval, set } from "date-fns";

type BulkLogTimeData = {
    dates: string[];
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

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
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

    if (endDate < startDate) {
        toast({
            variant: "destructive",
            title: "Invalid Date Range",
            description: "The 'To' date cannot be before the 'From' date.",
        });
        return;
    }

    setIsLoading(true);
    
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const datesAsStrings = dateInterval.map(d => format(d, 'yyyy-MM-dd'));

    const clockInDateTime = set(new Date(), { hours: parseInt(clockInTime.split(':')[0]), minutes: parseInt(clockInTime.split(':')[1])});
    const clockOutDateTime = set(new Date(), { hours: parseInt(clockOutTime.split(':')[0]), minutes: parseInt(clockOutTime.split(':')[1])});

    onSave({
        dates: datesAsStrings,
        clockIn: clockInDateTime.toISOString(),
        clockOut: clockOutDateTime.toISOString(),
        breakDuration: Number(breakDuration) || 0,
        status: 'full-day'
    });

    setIsLoading(false);
    onOpenChange(false);

    toast({
        title: "Bulk Time Logged",
        description: `Successfully logged time for ${employeeIds.length} employees across ${datesAsStrings.length} days.`
    })

  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Log Employee Time</DialogTitle>
          <DialogDescription>
            Log time for {employeeIds.length} employees over a selected date range.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-auto p-1">
            <div className="grid gap-4 py-4 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="start-date" className="text-right">
                        From *
                    </Label>
                    <Input
                        id="start-date"
                        name="start-date"
                        type="date"
                        value={format(startDate, 'yyyy-MM-dd')}
                        onChange={(e) => setStartDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
                        required
                        className="col-span-3"
                    />
                </div>

                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="end-date" className="text-right">
                        To *
                    </Label>
                    <Input
                        id="end-date"
                        name="end-date"
                        type="date"
                        value={format(endDate, 'yyyy-MM-dd')}
                        onChange={(e) => setEndDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))}
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
