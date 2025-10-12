
"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from 'next/navigation';
import { useEmployees, useEmployeeAttendance } from "@/hooks/use-database";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, CalendarCheck, CalendarX, ChevronsRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/data";

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { employees, loading: employeesLoading } = useEmployees();
  const { attendanceRecords, loading: attendanceLoading } = useEmployeeAttendance(id);

  const [isAbsentListOpen, setIsAbsentListOpen] = useState(false);

  const employee = useMemo(() => {
    return employees.find(e => e.id === id);
  }, [employees, id]);

  const { calendarModifiers, summary } = useMemo(() => {
    const present: Date[] = [];
    const absent: Date[] = [];
    const halfDay: Date[] = [];

    Object.values(attendanceRecords).forEach(record => {
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

    const summaryData = {
        present: present.length,
        absent: absent.length,
        halfDay: halfDay.length,
        absentDates: absent.sort((a,b) => a.getTime() - b.getTime())
    };

    return { 
        calendarModifiers: { present, absent, halfDay },
        summary: summaryData
    };
  }, [attendanceRecords]);
  
  const loading = employeesLoading || attendanceLoading;

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
      <PageHeader
        title={employee.name}
        description={`Attendance history and details for ${employee.name}.`}
      />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
             <Card>
                <CardHeader>
                    <CardTitle>Attendance Calendar</CardTitle>
                    <CardDescription>Full year view of {employee.name}'s attendance.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        numberOfMonths={new Date().getMonth() + 1}
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
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Half Days</CardTitle>
                    <User className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{summary.halfDay} Days</p>
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
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground mb-2">List of absent dates:</p>
                            <ul className="space-y-1 text-sm list-none p-0">
                                {summary.absentDates.map(date => (
                                    <li key={date.toISOString()} className="p-2 rounded-md bg-muted">
                                        {formatDate(date)}
                                    </li>
                                ))}
                                {summary.absentDates.length === 0 && <li className="text-sm text-muted-foreground">No absent days recorded.</li>}
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
