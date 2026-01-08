
export type Transaction = {
  id: string;
  date: string; // Store as ISO string for Firebase compatibility
  createdAt: string; // Store as ISO string for Firebase compatibility
  invoiceNo: string;
  glCode: string;
  title:string;
  amount: number;
  quantity: number;
  unit: string;
  ratePerUnit: number;
  vendor: string;
  description: string;
  notes: string;
  category: string;
  receiptUrl?: string;
  createdBy: string;
};

export type Budget = {
  category: string;
  amount: number;
};

export type BudgetSummary = {
  id: string;
  glCode: string;
  category: string;
  budget: number;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  dailyWage: number;
  projectIds: string[];
  employmentType: 'permanent' | 'temporary';
  employmentStartDate?: string;
  employmentEndDate?: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on-hold';
  startDate?: string;
  endDate?: string;
  budget?: number;
  createdAt: string;
};

export type AttendanceStatus = 'full-day' | 'half-day' | 'absent';

export type AttendanceRecord = {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  overtimeHours?: number;
  overtimeRate?: number;
  notes?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DailySummary = {
  date: string;
  status: 'present' | 'absent' | 'half-day' | 'mixed';
  totalPresent: number;
  totalAbsent: number;
  totalHalfDay: number;
};

export type MonthlyAttendanceSummary = {
  totalDays: number;
  fullDays: number;
  halfDays: number;
  absent: number;
  totalWages: number;
  overtimeHours: number;
  overtimeWages: number;
};
