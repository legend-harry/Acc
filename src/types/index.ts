
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

// Shrimp Farming Types
export type InventoryItemType = 'feed' | 'minerals' | 'chemicals' | 'medicine' | 'equipment' | 'other';

export type InventoryItem = {
  id: string;
  name: string;
  type: InventoryItemType;
  quantity: number;
  unit: string; // kg, liter, piece, etc.
  minimumThreshold: number;
  reorderQuantity: number;
  unitCost: number;
  supplier?: string;
  lastRestocked: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PondActivity = {
  id: string;
  pondId: string;
  type: 'feeding' | 'water-change' | 'cleaning' | 'health-check' | 'harvesting' | 'treatment' | 'testing' | 'other';
  description: string;
  quantity?: number;
  quantityUnit?: string;
  date: string;
  time?: string;
  performedBy: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
};

export type Pond = {
  id: string;
  name: string;
  area: number; // in square meters
  capacity: number; // estimated shrimp capacity
  currentStock: number;
  waterQuality: {
    ph?: number;
    temperature?: number;
    salinity?: number;
    dissolvedOxygen?: number;
    ammonia?: number;
    lastTestedDate?: string;
  };
  status: 'active' | 'fallow' | 'preparation' | 'harvesting';
  cycleStartDate?: string;
  expectedHarvestDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type FarmingStats = {
  totalPonds: number;
  activePonds: number;
  totalStockValue: number;
  feedUsageThisMonth: number;
  averageSurvivalRate: number;
  nextHarvestDate?: string;
};
