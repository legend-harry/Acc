
export type Transaction = {
  id: string;
  date: Date;
  createdAt: Date;
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
  projectId: string;
};

export type Budget = {
  category: string;
  amount: number;
};

export type BudgetSummary = {
  id: string;
  category: string;
  budget: number;
  projectId: string;
};

export type Project = {
    id: string;
    name: string;
};
