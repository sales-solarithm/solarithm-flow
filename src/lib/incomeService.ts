import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Income, Invoice } from "../types";
import { sanitizePayload } from "./sanitize";
import {
  DEFAULT_INCOME_CATEGORIES,
  subscribeIncomeCategories,
  addCategoryToFirestore,
  deleteCategoryFromFirestore,
} from "./categoryService";

export { DEFAULT_INCOME_CATEGORIES, subscribeIncomeCategories };

export const INCOME_CATEGORY_COLORS: Record<string, string> = {
  "Client Invoice Settlement": "#D4AF37",
  "Consulting Retainer": "#10B981",
  "Software Licensing": "#38BDF8",
  "Milestone Payment": "#A855F7",
  "Direct Client Wire": "#F59E0B",
  "Investment Return": "#34D399",
  "Other Inflow": "#94A3B8",
};

const DYNAMIC_INCOME_PALETTE = [
  "#10B981",
  "#34D399",
  "#38BDF8",
  "#0EA5E9",
  "#A855F7",
  "#F59E0B",
  "#E5C345",
  "#2DD4BF",
  "#6366F1",
  "#EC4899",
  "#F97316",
  "#14B8A6",
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

export async function addIncomeCategoryToFirestore(newCategory: string): Promise<void> {
  return addCategoryToFirestore("income", newCategory);
}

export async function deleteIncomeCategoryFromFirestore(categoryToDelete: string): Promise<void> {
  return deleteCategoryFromFirestore("income", categoryToDelete);
}

const INCOMES_COLLECTION = "incomes";
const INVOICES_COLLECTION = "invoices";
const PROJECTS_COLLECTION = "projects";

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
          description: data.description || "Direct Inflow",
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
      console.warn("Firestore incomes listener warning:", err);
      onError?.(err);
    }
  );
}

/**
 * Subscribes to real-time Invoices from Solarithm Insight (`/invoices` collection).
 * Seamlessly recognizes Solarithm Insight's schema:
 * - Invoice Number: `inv.invNo || inv.invoiceNumber || inv.id`
 * - Client Name: `inv.client?.name || inv.clientName || 'Client'`
 * - Total Payable: `inv.totals?.payable ?? inv.totalAmount ?? 0`
 * - Amount Received: `inv.amountReceived ?? inv.amountPaid ?? 0`
 * - Status: `inv.status` ("PAID", "PARTIALLY_PAID", "PENDING", "CANCELLED")
 * - Project ID: `inv.projectId || inv.project?.id || inv.linkedProjectId`
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

        const totalPayable =
          typeof data.totals?.payable === "number"
            ? data.totals.payable
            : typeof data.totalAmount === "number"
            ? data.totalAmount
            : Number(data.totals?.payable ?? data.totalAmount ?? 0);

        const amountReceived =
          typeof data.amountReceived === "number"
            ? data.amountReceived
            : typeof data.amountPaid === "number"
            ? data.amountPaid
            : Number(data.amountReceived ?? data.amountPaid ?? 0);

        const rawStatus = String(data.status || "PENDING").toUpperCase();
        let normalizedStatus: Invoice["status"] = "PENDING";
        if (rawStatus === "PAID") normalizedStatus = "PAID";
        else if (rawStatus === "PARTIALLY_PAID" || rawStatus === "PARTIAL") normalizedStatus = "PARTIALLY_PAID";
        else if (rawStatus === "CANCELLED") normalizedStatus = "CANCELLED";
        else normalizedStatus = "PENDING";

        // Auto-detect if already fully settled by figures
        if (totalPayable > 0 && amountReceived >= totalPayable && normalizedStatus !== "CANCELLED") {
          normalizedStatus = "PAID";
        }

        return {
          id: docSnap.id,
          invoiceNumber: data.invNo || data.invoiceNumber || `INV-${docSnap.id.substring(0, 6).toUpperCase()}`,
          clientName: data.client?.name || data.clientName || "Client",
          totalPayable: Number(totalPayable) || 0,
          amountReceived: Number(amountReceived) || 0,
          totalAmount: Number(totalPayable) || 0,
          amountPaid: Number(amountReceived) || 0,
          status: normalizedStatus,
          dueDate: data.dueDate || new Date().toISOString().split("T")[0],
          description: data.description || "",
          projectId: data.projectId || data.project?.id || data.linkedProjectId || undefined,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || undefined,
          raw: data,
        };
      });

      // Sort by newest first
      invoices.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.dueDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.dueDate || 0).getTime();
        return timeB - timeA;
      });

      onUpdate(invoices);
    },
    (err) => {
      console.warn("Firestore invoices listener warning:", err);
      onError?.(err);
    }
  );
}

/**
 * Creates a direct inflow record in Firestore `/incomes`
 */
export async function createDirectIncome(params: {
  amount: number;
  description: string;
  source: string;
  category: string;
  date: string;
  notes?: string;
}): Promise<string> {
  const colRef = collection(db, INCOMES_COLLECTION);
  const nowIso = new Date().toISOString();

  const payload = sanitizePayload({
    amount: Number(params.amount),
    description: params.description.trim(),
    source: params.source.trim() || "Direct Inflow",
    category: params.category || "Direct Client Wire",
    date: params.date || nowIso.split("T")[0],
    notes: params.notes?.trim() || "",
    createdAt: nowIso,
    serverTimestamp: serverTimestamp(),
  });

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

export interface RecordPaymentParams {
  invoiceId: string;
  paymentType: "Full" | "Partial";
  paymentAmount: number;
  date?: string;
  category?: string;
  description?: string;
  notes?: string;
}

/**
 * ATOMIC RECONCILIATION SYNC WITH SOLARITHM INSIGHT:
 * 1) Writes income record to `/incomes`.
 * 2) Updates `/invoices/{invoiceId}` in Firestore with `{ status: "PAID" | "PARTIALLY_PAID", amountReceived }`.
 * 3) Updates linked project in `/projects/{projectId}` with `{ paymentStatus: "paid" | "partially_paid" }`
 *    so Solarithm Insight immediately marks them as Paid!
 */
export async function recordInvoicePayment(params: RecordPaymentParams): Promise<{
  incomeId: string;
  invoiceId: string;
  newStatus: "PAID" | "PARTIALLY_PAID";
  newAmountReceived: number;
}> {
  const { invoiceId, paymentType, paymentAmount, date, category, description, notes } = params;

  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error("Payment amount must be greater than ₹0.00");
  }

  const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);

  return await runTransaction(db, async (transaction) => {
    const invoiceSnap = await transaction.get(invoiceRef);
    if (!invoiceSnap.exists()) {
      throw new Error(`Invoice "${invoiceId}" not found in Firestore.`);
    }

    const data = invoiceSnap.data();

    const totalPayable =
      typeof data.totals?.payable === "number"
        ? data.totals.payable
        : typeof data.totalAmount === "number"
        ? data.totalAmount
        : Number(data.totals?.payable ?? data.totalAmount ?? 0);

    const currentReceived =
      typeof data.amountReceived === "number"
        ? data.amountReceived
        : typeof data.amountPaid === "number"
        ? data.amountPaid
        : Number(data.amountReceived ?? data.amountPaid ?? 0);

    const invoiceNumber = data.invNo || data.invoiceNumber || invoiceId;
    const clientName = data.client?.name || data.clientName || "Client";
    const linkedProjectId = data.projectId || data.project?.id || data.linkedProjectId;

    let targetAmountReceived: number;
    let targetStatus: "PAID" | "PARTIALLY_PAID";

    if (paymentType === "Full") {
      targetAmountReceived = totalPayable > 0 ? totalPayable : currentReceived + paymentAmount;
      targetStatus = "PAID";
    } else {
      targetAmountReceived = currentReceived + paymentAmount;
      if (totalPayable > 0 && targetAmountReceived >= totalPayable) {
        targetStatus = "PAID";
      } else {
        targetStatus = "PARTIALLY_PAID";
      }
    }

    const nowIso = new Date().toISOString();
    const effectiveDate = date || nowIso.split("T")[0];

    // 1. Transaction write: new income document in `/incomes`
    const incomeCol = collection(db, INCOMES_COLLECTION);
    const newIncomeDocRef = doc(incomeCol);

    const incomePayload = sanitizePayload({
      amount: paymentAmount,
      description:
        (description || "").trim() ||
        `${targetStatus === "PAID" ? "Full" : "Partial"} Payment for Invoice #${invoiceNumber}`,
      source: clientName,
      category: category || "Client Invoice Settlement",
      date: effectiveDate,
      linkedInvoiceId: invoiceId,
      paymentType: targetStatus === "PAID" ? "Full" : "Partial",
      notes: notes ? notes.trim() : "",
      createdAt: nowIso,
      serverTimestamp: serverTimestamp(),
    });

    transaction.set(newIncomeDocRef, incomePayload);

    // 2. Transaction update: `/invoices/{invoiceId}` in Firestore
    const invoiceUpdatePayload = sanitizePayload({
      status: targetStatus,
      amountReceived: targetAmountReceived,
      amountPaid: targetAmountReceived, // backward compatibility
      updatedAt: nowIso,
    });

    transaction.update(invoiceRef, invoiceUpdatePayload);

    // 3. Update linked project in `/projects/{projectId}`
    if (linkedProjectId) {
      try {
        const projectRef = doc(db, PROJECTS_COLLECTION, linkedProjectId);
        const projectUpdatePayload = sanitizePayload({
          paymentStatus: targetStatus === "PAID" ? "paid" : "partially_paid",
          updatedAt: nowIso,
        });
        transaction.update(projectRef, projectUpdatePayload);
      } catch (projErr) {
        console.warn("Notice: Linked project update in transaction skipped:", projErr);
      }
    }

    return {
      incomeId: newIncomeDocRef.id,
      invoiceId,
      newStatus: targetStatus,
      newAmountReceived: targetAmountReceived,
    };
  });
}

/**
 * Legacy alias for recordInvoicePayment
 */
export async function logIncomeWithInvoiceSync(params: any): Promise<any> {
  const invoiceId = params.linkedInvoiceId;
  const paymentType = params.paymentStatus === "Partial" ? "Partial" : "Full";
  const paymentAmount =
    paymentType === "Partial" && params.partialAmount ? Number(params.partialAmount) : Number(params.amount);

  return recordInvoicePayment({
    invoiceId,
    paymentType,
    paymentAmount,
    date: params.date,
    category: params.category,
    description: params.description,
    notes: params.notes,
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
 * Creates an invoice in Firestore
 */
export async function createInvoiceInFirestore(
  invoiceData: {
    invoiceNumber: string;
    clientName: string;
    totalPayable?: number;
    totalAmount?: number;
    amountReceived?: number;
    amountPaid?: number;
    status?: any;
    dueDate?: string;
    description?: string;
    projectId?: string;
  }
): Promise<string> {
  const colRef = collection(db, INVOICES_COLLECTION);
  const nowIso = new Date().toISOString();

  const total = Number(invoiceData.totalPayable ?? invoiceData.totalAmount ?? 0);
  const paid = Number(invoiceData.amountReceived ?? invoiceData.amountPaid ?? 0);

  const payload = sanitizePayload({
    ...invoiceData,
    invNo: invoiceData.invoiceNumber,
    totals: { payable: total },
    totalAmount: total,
    amountReceived: paid,
    amountPaid: paid,
    status: invoiceData.status || "PENDING",
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}
