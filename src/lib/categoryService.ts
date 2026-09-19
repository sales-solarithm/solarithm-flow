import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { CategorySettings } from "../types";

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  "Software",
  "Travel",
  "Hardware",
  "Salaries",
  "Operations",
  "Marketing",
];

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  "Client Invoice Settlement",
  "Consulting Retainer",
  "Software Licensing",
  "Milestone Payment",
  "Direct Client Wire",
  "Investment Return",
  "Other Inflow",
];

export const SETTINGS_COLLECTION = "settings";
export const CATEGORIES_DOC_ID = "categories";
export const LEGACY_EXPENSE_DOC_ID = "expense_categories";

/**
 * Subscribes to the shared Firestore settings document (settings/categories)
 * containing both expenseCategories and incomeCategories.
 * Handles automatic initialization and backward compatibility.
 */
export function subscribeCategorySettings(
  onUpdate: (settings: CategorySettings) => void,
  onError?: (error: Error) => void
): () => void {
  const docRef = doc(db, SETTINGS_COLLECTION, CATEGORIES_DOC_ID);

  return onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const expenseCats: string[] =
          Array.isArray(data?.expenseCategories) && data.expenseCategories.length > 0
            ? data.expenseCategories
            : DEFAULT_EXPENSE_CATEGORIES;
        const incomeCats: string[] =
          Array.isArray(data?.incomeCategories) && data.incomeCategories.length > 0
            ? data.incomeCategories
            : DEFAULT_INCOME_CATEGORIES;

        onUpdate({
          expenseCategories: expenseCats,
          incomeCategories: incomeCats,
          updatedAt: data?.updatedAt || new Date().toISOString(),
        });
      } else {
        // Document does not exist yet; check legacy document or initialize
        try {
          const legacyDocRef = doc(db, SETTINGS_COLLECTION, LEGACY_EXPENSE_DOC_ID);
          const legacySnap = await getDoc(legacyDocRef);
          let initialExpense = DEFAULT_EXPENSE_CATEGORIES;
          if (legacySnap.exists()) {
            const legData = legacySnap.data();
            if (Array.isArray(legData?.categories) && legData.categories.length > 0) {
              initialExpense = Array.from(new Set([...DEFAULT_EXPENSE_CATEGORIES, ...legData.categories]));
            }
          }

          const initialSettings: CategorySettings = {
            expenseCategories: initialExpense,
            incomeCategories: DEFAULT_INCOME_CATEGORIES,
            updatedAt: new Date().toISOString(),
          };

          await setDoc(docRef, initialSettings);
          onUpdate(initialSettings);
        } catch (err) {
          console.warn("Could not auto-initialize shared categories settings document:", err);
          onUpdate({
            expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
            incomeCategories: DEFAULT_INCOME_CATEGORIES,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    },
    (err) => {
      console.warn("Firestore category settings listener error:", err);
      onError?.(err);
      onUpdate({
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
        incomeCategories: DEFAULT_INCOME_CATEGORIES,
      });
    }
  );
}

/**
 * Subscribes specifically to expense categories
 */
export function subscribeExpenseCategories(
  onUpdate: (categories: string[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribeCategorySettings(
    (settings) => onUpdate(settings.expenseCategories),
    onError
  );
}

/**
 * Subscribes specifically to income categories
 */
export function subscribeIncomeCategories(
  onUpdate: (categories: string[]) => void,
  onError?: (error: Error) => void
): () => void {
  return subscribeCategorySettings(
    (settings) => onUpdate(settings.incomeCategories),
    onError
  );
}

/**
 * Adds a new category to the shared Firestore settings document
 */
export async function addCategoryToFirestore(
  type: "expense" | "income",
  newCategory: string
): Promise<void> {
  const trimmed = newCategory.trim();
  if (!trimmed) throw new Error("Category name cannot be empty");

  const docRef = doc(db, SETTINGS_COLLECTION, CATEGORIES_DOC_ID);
  const snap = await getDoc(docRef);

  let expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
  let incomeCategories = DEFAULT_INCOME_CATEGORIES;

  if (snap.exists()) {
    const data = snap.data();
    if (Array.isArray(data?.expenseCategories) && data.expenseCategories.length > 0) {
      expenseCategories = data.expenseCategories;
    }
    if (Array.isArray(data?.incomeCategories) && data.incomeCategories.length > 0) {
      incomeCategories = data.incomeCategories;
    }
  }

  const targetList = type === "expense" ? expenseCategories : incomeCategories;
  if (targetList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error(`Category "${trimmed}" already exists in ${type} categories`);
  }

  const updatedList = [...targetList, trimmed];
  const now = new Date().toISOString();

  if (type === "expense") {
    await setDoc(
      docRef,
      {
        expenseCategories: updatedList,
        incomeCategories,
        updatedAt: now,
      },
      { merge: true }
    );
    // Backward compatibility sync
    try {
      await setDoc(
        doc(db, SETTINGS_COLLECTION, LEGACY_EXPENSE_DOC_ID),
        { categories: updatedList, updatedAt: now },
        { merge: true }
      );
    } catch {
      // ignore
    }
  } else {
    await setDoc(
      docRef,
      {
        expenseCategories,
        incomeCategories: updatedList,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

/**
 * Deletes a category (default or custom) from the shared Firestore settings document.
 * This removes it from future dropdown choices while preserving past transaction records.
 */
export async function deleteCategoryFromFirestore(
  type: "expense" | "income",
  categoryToDelete: string
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, CATEGORIES_DOC_ID);
  const snap = await getDoc(docRef);

  let expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
  let incomeCategories = DEFAULT_INCOME_CATEGORIES;

  if (snap.exists()) {
    const data = snap.data();
    if (Array.isArray(data?.expenseCategories) && data.expenseCategories.length > 0) {
      expenseCategories = data.expenseCategories;
    }
    if (Array.isArray(data?.incomeCategories) && data.incomeCategories.length > 0) {
      incomeCategories = data.incomeCategories;
    }
  }

  const targetList = type === "expense" ? expenseCategories : incomeCategories;
  const updatedList = targetList.filter((c) => c !== categoryToDelete);

  if (updatedList.length === 0) {
    throw new Error(`Cannot delete all categories. At least one ${type} category must remain active.`);
  }

  const now = new Date().toISOString();

  if (type === "expense") {
    await setDoc(
      docRef,
      {
        expenseCategories: updatedList,
        incomeCategories,
        updatedAt: now,
      },
      { merge: true }
    );
    // Backward compatibility sync
    try {
      await setDoc(
        doc(db, SETTINGS_COLLECTION, LEGACY_EXPENSE_DOC_ID),
        { categories: updatedList, updatedAt: now },
        { merge: true }
      );
    } catch {
      // ignore
    }
  } else {
    await setDoc(
      docRef,
      {
        expenseCategories,
        incomeCategories: updatedList,
        updatedAt: now,
      },
      { merge: true }
    );
  }
}

/**
 * Resets categories to default presets in the shared Firestore settings document
 */
export async function resetCategoriesToDefault(
  type: "expense" | "income" | "all"
): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, CATEGORIES_DOC_ID);
  const snap = await getDoc(docRef);
  const data = snap.exists() ? snap.data() : {};
  const now = new Date().toISOString();

  const newSettings: any = {
    updatedAt: now,
  };

  if (type === "expense" || type === "all") {
    newSettings.expenseCategories = DEFAULT_EXPENSE_CATEGORIES;
    try {
      await setDoc(
        doc(db, SETTINGS_COLLECTION, LEGACY_EXPENSE_DOC_ID),
        { categories: DEFAULT_EXPENSE_CATEGORIES, updatedAt: now },
        { merge: true }
      );
    } catch {
      // ignore
    }
  } else {
    newSettings.expenseCategories = data.expenseCategories || DEFAULT_EXPENSE_CATEGORIES;
  }

  if (type === "income" || type === "all") {
    newSettings.incomeCategories = DEFAULT_INCOME_CATEGORIES;
  } else {
    newSettings.incomeCategories = data.incomeCategories || DEFAULT_INCOME_CATEGORIES;
  }

  await setDoc(docRef, newSettings, { merge: true });
}
