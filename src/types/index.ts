
export type Transaction = {
  id: string;
  date: Date;
  created_at: Date;
  invoiceNo: string;
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
  type: 'expense' | 'income';
  status: 'completed' | 'credit' | 'expected';
  projectid: string;
};

export type Budget = {
  category: string;
  amount: number;
};

export type BudgetSummary = {
  id: string;
  category: string;
  budget: number; // Keep UI property 'budget' for now, but map from 'amount' in hooks
  projectid: string;
};

export type Project = {
    id: string;
    name: string;
    archived?: boolean;
};

export type Employee = {
  id: string;
  name: string;
  wage: number;
  wageType: 'hourly' | 'daily' | 'monthly';
  projectIds: string[];
  overtimeRateMultiplier: number;
  notes?: string;
  employmentType: 'permanent' | 'temporary';
  employmentEndDate?: string; // ISO string for temporary employees
};

export type AttendanceStatus = 'full-day' | 'half-day' | 'absent' | 'scheduled';

export type AttendanceRecord = {
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  overtimeHours?: number;
  overtimeRate?: number;
  notes?: string;
  clockIn?: string; // ISO string
  clockOut?: string; // ISO string
  breakDuration?: number; // in minutes
};
