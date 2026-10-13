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

/**
 * Solarithm Insight & Flow Two-Way Synced Invoice Entity
 */
export interface Invoice {
  id: string;
  invoiceNumber: string; // inv.invNo || inv.invoiceNumber || inv.id
  clientName: string; // inv.client?.name || inv.clientName || 'Client'
  totalPayable: number; // inv.totals?.payable ?? inv.totalAmount ?? 0
  amountReceived: number; // inv.amountReceived ?? inv.amountPaid ?? 0
  totalAmount?: number; // legacy alias
  amountPaid?: number; // legacy alias
  status: "PAID" | "PARTIALLY_PAID" | "PENDING" | "CANCELLED" | "Paid" | "Partial" | "Pending";
  dueDate?: string;
  description?: string;
  projectId?: string; // inv.projectId || inv.project?.id || inv.linkedProjectId
  createdAt?: string;
  updatedAt?: string;
  raw?: any;
}

export interface CategorySettings {
  expenseCategories: string[];
  incomeCategories: string[];
  updatedAt?: string;
}
