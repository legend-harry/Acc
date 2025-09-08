
export type Transaction = {
  id: string;
  date: string; // Store as ISO string for Firebase compatibility
  invoiceNo: string;
  glCode: string;
  title: string;
  amount: number;
  quantity: number;
  unit: string;
  ratePerUnit: number;
  vendor: string;
  description: string;
  notes: string;
  category: string;
  receiptUrl?: string;
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
