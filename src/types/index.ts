
export type Transaction = {
  id: string;
  date: Date;
  createdAt: Date;
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
  type: 'expense' | 'income';
  status: 'completed' | 'credit' | 'expected';
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
