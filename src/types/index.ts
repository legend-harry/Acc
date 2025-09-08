export type Transaction = {
  id: string;
  date: Date;
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
};

export type Budget = {
  category: string;
  amount: number;
};

export type BudgetSummary = {
  glCode: string;
  category: string;
  budget: number;
};
