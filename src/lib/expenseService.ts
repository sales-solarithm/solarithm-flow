import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { Expense } from "../types";
import { sanitizePayload } from "./sanitize";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  subscribeExpenseCategories,
  addCategoryToFirestore,
  deleteCategoryFromFirestore,
} from "./categoryService";

export const DEFAULT_CATEGORIES: string[] = DEFAULT_EXPENSE_CATEGORIES;

export const CATEGORY_COLORS: Record<string, string> = {
  Software: "#D4AF37",
  Travel: "#38BDF8",
  Hardware: "#F59E0B",
  Salaries: "#10B981",
  Operations: "#A855F7",
  Marketing: "#F43F5E",
};

const DYNAMIC_COLOR_PALETTE = [
  "#E5C345",
  "#34D399",
  "#60A5FA",
  "#F472B6",
  "#FB923C",
  "#A78BFA",
  "#2DD4BF",
  "#FBBF24",
  "#818CF8",
  "#F87171",
];

export function getCategoryColor(category: string, index = 0): string {
  const safeCategory = category || "Uncategorized";
  if (CATEGORY_COLORS[safeCategory]) {
    return CATEGORY_COLORS[safeCategory];
  }
  let hash = 0;
  for (let i = 0; i < safeCategory.length; i++) {
    hash = safeCategory.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash + index) % DYNAMIC_COLOR_PALETTE.length;
  return DYNAMIC_COLOR_PALETTE[colorIndex];
}

const EXPENSES_COLLECTION = "expenses";

/**
 * Subscribes to dynamic expense categories from the shared Firestore settings document.
 */
export function subscribeCategories(
  onUpdate: (categories: string[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribeExpenseCategories(onUpdate, onError);
}

/**
 * Persists a new custom category into the shared Firestore settings document
 */
export async function addCustomCategoryToFirestore(newCategory: string): Promise<void> {
  return addCategoryToFirestore("expense", newCategory);
}

/**
 * Subscribes to realtime expenses from Firestore
 */
export function subscribeExpenses(
  onUpdate: (expenses: Expense[]) => void,
  onError?: (error: Error) => void
): () => void {
  const colRef = collection(db, EXPENSES_COLLECTION);
  const q = query(colRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: Expense[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          amount: typeof data.amount === "number" ? data.amount : Number(data.amount) || 0,
          description: data.description || "Outflow Expense",
          category: data.category || "General Operations",
          date: data.date || new Date().toISOString().split("T")[0],
          notes: data.notes || "",
          createdAt:
            data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        };
      });
      onUpdate(expenses);
    },
    (err) => {
      console.warn("Firestore expenses listener warning:", err);
      onError?.(err);
    }
  );
}

/**
 * Adds an outflow expense to Firestore `/expenses`.
 * Read by Solarithm Insight's Executive Dashboard expense cards.
 */
export async function createExpenseInFirestore(
  expenseData: Omit<Expense, "id" | "createdAt">
): Promise<string> {
  const colRef = collection(db, EXPENSES_COLLECTION);
  const nowIso = new Date().toISOString();

  const payload = sanitizePayload({
    amount: Number(expenseData.amount),
    description: expenseData.description.trim(),
    category: expenseData.category.trim() || "Operations",
    date: expenseData.date || nowIso.split("T")[0],
    notes: expenseData.notes ? expenseData.notes.trim() : "",
    createdAt: nowIso,
    serverTimestamp: serverTimestamp(),
  });

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

/**
 * Deletes an expense from Firestore
 */
export async function deleteExpenseFromFirestore(expenseId: string): Promise<void> {
  const docRef = doc(db, EXPENSES_COLLECTION, expenseId);
  await deleteDoc(docRef);
}
