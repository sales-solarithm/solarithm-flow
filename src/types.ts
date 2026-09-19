export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface CategoryDistribution {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  source: string;
  category: string;
  date: string;
  linkedInvoiceId?: string;
  paymentType?: "Full" | "Partial";
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  status: "Pending" | "Partial" | "Paid";
  dueDate: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategorySettings {
  expenseCategories: string[];
  incomeCategories: string[];
  updatedAt?: string;
}
