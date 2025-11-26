
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useProjects, useEmployees, useAttendanceForDates } from "@/hooks/use-database";
import type { Employee, AttendanceRecord, AttendanceStatus } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectFilter } from "@/context/project-filter-context";
import { AddEmployeeDialog } from "@/components/add-employee-dialog";
import { OvertimeDialog } from "@/components/overtime-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { LogTimeDialog } from "@/components/log-time-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/data";
import { useCurrency } from "@/context/currency-context";
import { BulkLogTimeDialog } from "@/components/bulk-log-time-dialog";
import { useAttendance } from "@/hooks/use-attendance";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function EmployeesPage() {
  const router = useRouter();
  const { employees, loading: employeesLoading } = useEmployees();
  const { projects, loading: projectsLoading } = useProjects();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { selectedProjectId } = useProjectFilter();
  const [overtimeEmployee, setOvertimeEmployee] = useState<Employee | null>(
    null
  );
  const {
    attendance,
    loading: attendanceLoading,
    updateAttendance,
    bulkUpdateAttendance,
  } = useAttendance(selectedDate);
  const { dailySummaries, loading: datesLoading } = useAttendanceForDates();

  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const { currency } = useCurrency();
  const [isBulkLogTimeOpen, setIsBulkLogTimeOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast({ title: "Notifications Enabled", description: "You'll receive attendance reminders." });
        } else {
          toast({ title: "Notifications Denied", description: "You won't receive attendance reminders.", variant: "destructive" });
        }
      });
    }
  }, [toast]);

  const { activeEmployees, pastEmployees } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = employees.filter(emp => {
        if (emp.employmentType === 'permanent') return true;
        if (emp.employmentEndDate) {
            return new Date(emp.employmentEndDate) >= today;
        }
        return true; // Default to active if end date is missing for temporary
    });

    const past = employees.filter(emp => {
        if (emp.employmentType === 'temporary' && emp.employmentEndDate) {
            return new Date(emp.employmentEndDate) < today;
        }
        return false;
    });

    return { activeEmployees: active, pastEmployees: past };
  }, [employees]);


  const filteredEmployees = useMemo(() => {
    if (selectedProjectId === "all") {
      return activeEmployees;
    }
    return activeEmployees.filter(
      (emp) =>
        emp.projectIds && emp.projectIds.includes(selectedProjectId)
    );
  }, [activeEmployees, selectedProjectId]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date || new Date());
  };

  const handleAttendanceChange = useCallback(
    (employeeId: string, status: "full-day" | "half-day" | "absent") => {
      const record = attendance[employeeId] || {};
      updateAttendance(employeeId, { ...record, status });
    },
    [attendance, updateAttendance]
  );

  const toggleBulkEdit = () => {
    setBulkEditMode(!bulkEditMode);
    setSelectedEmployees([]);
  };

  const handleBulkStatusChange = (
    status: "full-day" | "half-day" | "absent"
  ) => {
    const updates = selectedEmployees.map(employeeId => {
      const record = attendance[employeeId] || {};
      return { employeeId, record: { ...record, status } };
    });
    bulkUpdateAttendance(updates);
    setBulkEditMode(false);
    setSelectedEmployees([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(filteredEmployees.map((emp) => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const calendarModifiers = useMemo(() => {
    const present: Date[] = [];
    const absent: Date[] = [];
    const halfDay: Date[] = [];

    Object.keys(dailySummaries).forEach(dateStr => {
      const summary = dailySummaries[dateStr];
      const date = new Date(dateStr);
      date.setUTCHours(0, 0, 0, 0); // Normalize date

      if (summary.status === 'absent') {
        absent.push(date);
      } else if (summary.status === 'half-day') {
        halfDay.push(date);
      } else if (summary.status === 'present') {
        present.push(date);
      }
    });

    return { present, absent, halfDay };
  }, [dailySummaries]);

  const loading = employeesLoading || projectsLoading || attendanceLoading || datesLoading;

  const EmployeeList = ({ emps }: { emps: Employee[] }) => (
    <tbody>
        {emps.map((emp) => {
            const record = attendance[emp.id];
            return (
                <tr key={emp.id} onClick={() => router.push(`/employees/${emp.id}`)} className={cn("border-b", "hover:bg-muted/50 cursor-pointer")}>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    {bulkEditMode && (
                    <Checkbox
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={(checked) =>
                        setSelectedEmployees((prev) =>
                            checked
                            ? [...prev, emp.id]
                            : prev.filter((id) => id !== emp.id)
                        )
                        }
                    />
                    )}
                </td>
                <td className="p-3 font-medium">
                    <div>
                        {emp.name}
                        {emp.employmentType === 'temporary' && (
                            <p className="text-xs text-muted-foreground">Temporary (until {formatDate(emp.employmentEndDate || '')})</p>
                        )}
                    </div>
                </td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <Select
                    value={record?.status || "absent"}
                    onValueChange={(value) =>
                        handleAttendanceChange(
                        emp.id,
                        value as "full-day" | "half-day" | "absent"
                        )
                    }
                    >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="full-day">
                        Full Day
                        </SelectItem>
                        <SelectItem value="half-day">
                        Half Day
                        </SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                    </Select>
                </td>
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                    <Checkbox
                        id={`ot-${emp.id}`}
                        checked={!!record?.overtimeHours}
                        onCheckedChange={(checked) => {
                        if (checked) {
                            setOvertimeEmployee(emp);
                        } else {
                            // Remove overtime
                            const {
                            overtimeHours,
                            overtimeRate,
                            ...rest
                            } = record;
                            updateAttendance(emp.id, rest);
                        }
                        }}
                    />
                    <Label htmlFor={`ot-${emp.id}`} className="cursor-pointer">
                                            {record?.overtimeHours ? (
                                                <button className="text-xs text-muted-foreground underline" onClick={() => setOvertimeEmployee(emp)}>
                                                    {record.overtimeHours}hr @ {formatCurrency(record.overtimeRate || 0, currency)}
                                                </button>
                                            ) : (
                                                'Log OT'
                                            )}
                                            </Label>
                    </div>
                </td>
                </tr>
            );
        })}
    </tbody>
  );

  if (loading && employees.length === 0) {
    return (
      <div>
        <PageHeader
          title="Employees"
          description="Track attendance and manage your team."
        />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (employees.length === 0 && !loading) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-2xl font-semibold mb-2">No Employees Found</h2>
            <p className="text-muted-foreground mb-4">Get started by adding your first team member.</p>
            <AddEmployeeDialog>
                <Button>Add New Employee</Button>
            </AddEmployeeDialog>
        </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <PageHeader
          title="Employees"
          description="Track attendance and manage your team."
          className="mb-0"
        />
        <div className="flex gap-2">
            <AddEmployeeDialog>
                <Button variant="secondary">
                    <User className="mr-2 h-4 w-4" /> Add Employee
                </Button>
            </AddEmployeeDialog>
            <LogTimeDialog>
              <Button>Log Time</Button>
            </LogTimeDialog>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle>
                  Attendance for {selectedDate.toLocaleDateString()}
                </CardTitle>
                <CardDescription>
                  {selectedProjectId === "all"
                    ? "Showing all employees."
                    : `Showing employees for: ${
                        projects.find((p) => p.id === selectedProjectId)?.name
                      }`}
                </CardDescription>
              </div>
              <div>
                {bulkEditMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsBulkLogTimeOpen(true)}>
                      Bulk Log Time
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange("full-day")}
                    >
                      Full Day
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange("half-day")}
                    >
                      Half Day
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleBulkStatusChange("absent")}
                    >
                      Absent
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleBulkEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={toggleBulkEdit}>
                    Bulk Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">
                        {bulkEditMode && (
                          <Checkbox
                            checked={
                              selectedEmployees.length > 0 &&
                              selectedEmployees.length ===
                              filteredEmployees.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        )}
                      </th>
                      <th className="text-left p-3 font-medium">Employee</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Overtime</th>
                    </tr>
                  </thead>
                  <EmployeeList emps={filteredEmployees} />
                </table>
                 {filteredEmployees.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No active employees for this project.
                    </div>
                 )}
              </div>
            </CardContent>
          </Card>

          {pastEmployees.length > 0 && (
              <Card>
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-muted-foreground">
                          <Archive className="h-5 w-5" />
                          Past Employees
                      </CardTitle>
                      <CardDescription>These employees' contracts have ended.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <ul className="space-y-3">
                          {pastEmployees.map(emp => (
                              <li key={emp.id} className="flex justify-between items-center p-3 rounded-md border">
                                  <div>
                                      <p className="font-medium">{emp.name}</p>
                                      <p className="text-sm text-muted-foreground">Ended on {formatDate(emp.employmentEndDate || '')}</p>
                                  </div>
                                  <Button variant="ghost" onClick={() => router.push(`/employees/${emp.id}`)}>
                                      View History
                                  </Button>
                              </li>
                          ))}
                      </ul>
                  </CardContent>
              </Card>
          )}

        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                className="rounded-md border"
                modifiers={calendarModifiers}
                modifiersClassNames={{
                  present: 'day-present',
                  absent: 'day-absent',
                  halfDay: 'day-half-day',
                  today: 'day-today-outline',
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {overtimeEmployee && (
        <OvertimeDialog
          employee={overtimeEmployee}
          attendanceRecord={attendance[overtimeEmployee.id]}
          isOpen={!!overtimeEmployee}
          onOpenChange={() => setOvertimeEmployee(null)}
          onSave={(hours, rate) => {
            if (overtimeEmployee) {
              const record = attendance[overtimeEmployee.id] || {};
              updateAttendance(overtimeEmployee.id, {
                ...record,
                overtimeHours: hours,
                overtimeRate: rate,
              });
            }
            setOvertimeEmployee(null);
          }}
        />
      )}
       <BulkLogTimeDialog
        isOpen={isBulkLogTimeOpen}
        onOpenChange={setIsBulkLogTimeOpen}
        employeeIds={selectedEmployees}
        onSave={(logData) => {
          const updates = selectedEmployees.map(employeeId => ({
            employeeId,
            record: logData
          }));
          bulkUpdateAttendance(updates, logData.dates);
          setIsBulkLogTimeOpen(false);
          setBulkEditMode(false);
          setSelectedEmployees([]);
        }}
      />
    </div>
  );
}
