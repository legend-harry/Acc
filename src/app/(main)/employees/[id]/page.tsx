
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from 'next/navigation';
import { useEmployees, useEmployeeMonthlyAttendance } from "@/hooks/use-database";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, CalendarCheck, CalendarX, ChevronsRight, ArrowLeft } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getYear, getMonth, format } from "date-fns";
import Link from "next/link";

const availableYears = [new Date().getFullYear(), new Date().getFullYear() - 1];
const availableMonths = Array.from({ length: 12 }, (_, i) => ({
  value: i,
  label: format(new Date(0, i), 'MMMM'),
}));

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { employees, loading: employeesLoading } = useEmployees();
  
  const [isAbsentListOpen, setIsAbsentListOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(new Date());

  const { attendanceForMonth, summary, loading: attendanceLoading } = useEmployeeMonthlyAttendance(id, displayDate);

  const employee = useMemo(() => {
    return employees.find(e => e.id === id);
  }, [employees, id]);

  const { calendarModifiers, absentDates } = useMemo(() => {
    const present: Date[] = [];
    const absent: Date[] = [];
    const halfDay: Date[] = [];

    attendanceForMonth.forEach(record => {
      const date = new Date(record.date);
      date.setUTCHours(0, 0, 0, 0); // Normalize date

      if (record.status === 'absent') {
        absent.push(date);
      } else if (record.status === 'half-day') {
        halfDay.push(date);
      } else if (record.status === 'full-day') {
        present.push(date);
      }
    });

    return { 
        calendarModifiers: { present, absent, halfDay },
        absentDates: absent.sort((a,b) => a.getTime() - b.getTime())
    };
  }, [attendanceForMonth]);
  
  const loading = employeesLoading || attendanceLoading;

  const handleYearChange = (year: string) => {
    const newDate = new Date(displayDate);
    newDate.setFullYear(parseInt(year, 10));
    setDisplayDate(newDate);
  }

  const handleMonthChange = (month: string) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(parseInt(month, 10));
    setDisplayDate(newDate);
  }

  if (loading) {
      return (
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-80 mb-8" />
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Skeleton className="h-[400px] w-full" />
                </div>
                 <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
          </div>
      )
  }

  if (!employee) {
      return <PageHeader title="Employee not found" />
  }

  return (
    <div>
        <Button asChild variant="ghost" className="mb-4">
            <Link href="/employees">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Employees
            </Link>
        </Button>

      <PageHeader
        title={employee.name}
        description={`Attendance history and details for ${employee.name}.`}
      />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                         <div>
                            <CardTitle>Attendance Calendar</CardTitle>
                            <CardDescription>View of {employee.name}'s attendance.</CardDescription>
                         </div>
                         <div className="flex gap-2">
                            <Select value={getMonth(displayDate).toString()} onValueChange={handleMonthChange}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonths.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                             <Select value={getYear(displayDate).toString()} onValueChange={handleYearChange}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                         </div>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        month={displayDate}
                        onMonthChange={setDisplayDate}
                        mode="multiple"
                        selected={[]}
                        className="p-0"
                        modifiers={calendarModifiers}
                        modifiersClassNames={{
                            present: 'day-present',
                            absent: 'day-absent',
                            halfDay: 'day-half-day',
                        }}
                     />
                </CardContent>
             </Card>
        </div>
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Present</CardTitle>
                    <CalendarCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{summary.present} Days</p>
                    <p className="text-xs text-muted-foreground">in {format(displayDate, 'MMMM')}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Half Days</CardTitle>
                    <User className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{summary.halfDay} Days</p>
                    <p className="text-xs text-muted-foreground">in {format(displayDate, 'MMMM')}</p>
                </CardContent>
            </Card>
            <Collapsible open={isAbsentListOpen} onOpenChange={setIsAbsentListOpen}>
                <Card className="border-red-500/50">
                    <CollapsibleTrigger asChild>
                         <div className="p-6 cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <CalendarX className="h-4 w-4 text-red-500 mr-2" />
                                    <span className="text-sm font-medium">Absent</span>
                                </div>
                                <Button variant="ghost" size="sm" className="w-9 p-0">
                                    <ChevronsRight className={`h-4 w-4 transition-transform duration-200 ${isAbsentListOpen ? 'rotate-90' : ''}`} />
                                </Button>
                            </div>
                            <p className="text-2xl font-bold mt-2">{summary.absent} Days</p>
                            <p className="text-xs text-muted-foreground">in {format(displayDate, 'MMMM')}</p>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground mb-2">List of absent dates:</p>
                            <ul className="space-y-1 text-sm list-none p-0">
                                {absentDates.map(date => (
                                    <li key={date.toISOString()} className="p-2 rounded-md bg-muted">
                                        {formatDate(date)}
                                    </li>
                                ))}
                                {absentDates.length === 0 && <li className="text-sm text-muted-foreground">No absent days recorded.</li>}
                            </ul>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
        </div>
      </div>
    </div>
  );
}

    