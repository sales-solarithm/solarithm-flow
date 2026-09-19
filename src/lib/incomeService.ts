import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Income, Invoice } from "../types";
import {
  DEFAULT_INCOME_CATEGORIES,
  subscribeIncomeCategories,
  addCategoryToFirestore,
  deleteCategoryFromFirestore,
} from "./categoryService";

export { DEFAULT_INCOME_CATEGORIES, subscribeIncomeCategories };

export const INCOME_CATEGORY_COLORS: Record<string, string> = {
  "Client Invoice Settlement": "#D4AF37", // Metallic Gold
  "Consulting Retainer": "#10B981", // Emerald
  "Software Licensing": "#38BDF8", // Sky Blue
  "Milestone Payment": "#A855F7", // Purple
  "Direct Client Wire": "#F59E0B", // Amber
  "Investment Return": "#34D399", // Mint
  "Other Inflow": "#94A3B8", // Slate
};

const DYNAMIC_INCOME_PALETTE = [
  "#10B981", // Emerald
  "#34D399", // Mint
  "#38BDF8", // Sky Blue
  "#0EA5E9", // Ocean Blue
  "#A855F7", // Purple
  "#F59E0B", // Amber
  "#E5C345", // Metallic Gold
  "#2DD4BF", // Teal
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#F97316", // Orange
  "#14B8A6", // Cyan-Teal
];

export function getIncomeCategoryColor(category: string, index = 0): string {
  const safeCat = category || "Other Inflow";
  if (INCOME_CATEGORY_COLORS[safeCat]) {
    return INCOME_CATEGORY_COLORS[safeCat];
  }
  let hash = 0;
  for (let i = 0; i < safeCat.length; i++) {
    hash = safeCat.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash + index) % DYNAMIC_INCOME_PALETTE.length;
  return DYNAMIC_INCOME_PALETTE[colorIndex];
}

/**
 * Persists a new custom income category into the shared Firestore settings document
 */
export async function addIncomeCategoryToFirestore(newCategory: string): Promise<void> {
  return addCategoryToFirestore("income", newCategory);
}

/**
 * Removes an income category from the selectable list in the shared Firestore settings document
 */
export async function deleteIncomeCategoryFromFirestore(categoryToDelete: string): Promise<void> {
  return deleteCategoryFromFirestore("income", categoryToDelete);
}

const INCOMES_COLLECTION = "incomes";
const INVOICES_COLLECTION = "invoices";

/**
 * Subscribes to real-time incomes from Firestore
 */
export function subscribeIncomes(
  onUpdate: (incomes: Income[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, INCOMES_COLLECTION);
  const q = query(colRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const incomes: Income[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          amount: typeof data.amount === "number" ? data.amount : Number(data.amount) || 0,
          description: data.description || "Untitled Income",
          source: data.source || "Client Inflow",
          category: data.category || "Client Invoice Settlement",
          date: data.date || new Date().toISOString().split("T")[0],
          linkedInvoiceId: data.linkedInvoiceId || undefined,
          paymentType: data.paymentType || undefined,
          notes: data.notes || "",
          createdAt:
            data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        };
      });
      onUpdate(incomes);
    },
    (err) => {
      console.warn("Firestore incomes listener error:", err);
      onError?.(err);
    }
  );
}

/**
 * Subscribes to all Salary Studio invoices
 */
export function subscribeInvoices(
  onUpdate: (invoices: Invoice[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, INVOICES_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const invoices: Invoice[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          invoiceNumber: data.invoiceNumber || `INV-${docSnap.id.substring(0, 6).toUpperCase()}`,
          clientName: data.clientName || "Enterprise Client",
          totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : Number(data.totalAmount) || 0,
          amountPaid: typeof data.amountPaid === "number" ? data.amountPaid : Number(data.amountPaid) || 0,
          status: (data.status as "Pending" | "Partial" | "Paid") || "Pending",
          dueDate: data.dueDate || new Date().toISOString().split("T")[0],
          description: data.description || "",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || undefined,
        };
      });
      onUpdate(invoices);
    },
    (err) => {
      console.warn("Firestore invoices listener error:", err);
      onError?.(err);
    }
  );
}

export interface IncomeTransactionParams {
  amount: number;
  description: string;
  source: string;
  category: string;
  date: string;
  notes?: string;
  linkedInvoiceId?: string;
  paymentStatus?: "Paid" | "Partial";
  partialAmount?: number;
}

export interface IncomeTransactionResult {
  incomeId: string;
  invoiceId?: string;
  newAmountPaid?: number;
  newStatus?: "Paid" | "Partial";
  remainingDue?: number;
}

/**
 * Executes an atomic Firestore transaction for two-way sync:
 * - Writes new income document to `incomes`
 * - Simultaneously updates linked Salary Studio invoice's `status` (Paid/Partial) and `amountPaid`
 */
export async function logIncomeWithInvoiceSync(
  params: IncomeTransactionParams
): Promise<IncomeTransactionResult> {
  const {
    amount,
    description,
    source,
    category,
    date,
    notes,
    linkedInvoiceId,
    paymentStatus,
    partialAmount,
  } = params;

  // Case 1: Standalone income without linked invoice
  if (!linkedInvoiceId || linkedInvoiceId === "NONE") {
    const colRef = collection(db, INCOMES_COLLECTION);
    const docRef = await addDoc(colRef, {
      amount: Number(amount),
      description: description.trim(),
      source: source.trim() || "Direct Inflow",
      category: category || "Direct Client Wire",
      date: date || new Date().toISOString().split("T")[0],
      notes: notes ? notes.trim() : "",
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    });
    return { incomeId: docRef.id };
  }

  // Case 2: Linked invoice - Atomic Firestore Transaction
  const invoiceRef = doc(db, INVOICES_COLLECTION, linkedInvoiceId);

  return await runTransaction(db, async (transaction) => {
    const invoiceSnap = await transaction.get(invoiceRef);
    if (!invoiceSnap.exists()) {
      throw new Error(`Invoice "${linkedInvoiceId}" does not exist in the Salary Studio database.`);
    }

    const invoiceData = invoiceSnap.data();
    const totalAmount = Number(invoiceData.totalAmount || 0);
    const currentPaid = Number(invoiceData.amountPaid || 0);

    // Determine payment figure: partial payment input or specified amount
    const actualPayment =
      paymentStatus === "Partial" && partialAmount !== undefined && partialAmount > 0
        ? Number(partialAmount)
        : Number(amount);

    if (isNaN(actualPayment) || actualPayment <= 0) {
      throw new Error("Payment amount must be greater than ₹0.00");
    }

    const newAmountPaid = Number(Math.min(totalAmount, currentPaid + actualPayment).toFixed(2));
    const remainingDue = Number(Math.max(0, totalAmount - newAmountPaid).toFixed(2));

    // Status logic:
    // If user selected "Partial" and remaining balance > 0, set Partial.
    // If paid reaches totalAmount, set Paid.
    let targetStatus: "Paid" | "Partial";
    if (remainingDue <= 0 || paymentStatus === "Paid") {
      targetStatus = "Paid";
    } else {
      targetStatus = "Partial";
    }

    // Reference for new income record
    const incomeCol = collection(db, INCOMES_COLLECTION);
    const newIncomeDocRef = doc(incomeCol);

    // 1. Transaction write: new income document
    transaction.set(newIncomeDocRef, {
      amount: actualPayment,
      description:
        description.trim() ||
        `Settlement for Invoice #${invoiceData.invoiceNumber || linkedInvoiceId}`,
      source: source.trim() || invoiceData.clientName || "Salary Studio Client",
      category: category || "Client Invoice Settlement",
      date: date || new Date().toISOString().split("T")[0],
      linkedInvoiceId: linkedInvoiceId,
      paymentType: targetStatus === "Paid" ? "Full" : "Partial",
      notes: notes ? notes.trim() : "",
      createdAt: new Date().toISOString(),
      serverTimestamp: serverTimestamp(),
    });

    // 2. Transaction update: original Salary Studio invoice's status & amountPaid
    transaction.update(invoiceRef, {
      amountPaid: newAmountPaid,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    });

    return {
      incomeId: newIncomeDocRef.id,
      invoiceId: linkedInvoiceId,
      newAmountPaid,
      newStatus: targetStatus,
      remainingDue,
    };
  });
}

/**
 * Deletes an income record from Firestore
 */
export async function deleteIncomeFromFirestore(incomeId: string): Promise<void> {
  const docRef = doc(db, INCOMES_COLLECTION, incomeId);
  await deleteDoc(docRef);
}

/**
 * Creates a new Salary Studio invoice (for testing or real client billing)
 */
export async function createInvoiceInFirestore(
  invoiceData: Omit<Invoice, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const colRef = collection(db, INVOICES_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...invoiceData,
    totalAmount: Number(invoiceData.totalAmount),
    amountPaid: Number(invoiceData.amountPaid || 0),
    status: invoiceData.status || "Pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return docRef.id;
}

