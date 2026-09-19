import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  SlidersHorizontal,
  Tag,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  RotateCcw,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
} from "lucide-react";
import { Expense, Income, CategorySettings } from "../types";
import {
  subscribeCategorySettings,
  addCategoryToFirestore,
  deleteCategoryFromFirestore,
  resetCategoriesToDefault,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../lib/categoryService";
import { getCategoryColor } from "../lib/expenseService";
import { getIncomeCategoryColor } from "../lib/incomeService";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "expense" | "income";
  expenses?: Expense[];
  incomes?: Income[];
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  defaultTab = "expense",
  expenses = [],
  incomes = [],
}: CategoryManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">(defaultTab);
  const [categorySettings, setCategorySettings] = useState<CategorySettings>({
    expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    incomeCategories: DEFAULT_INCOME_CATEGORIES,
  });

  const [newCatName, setNewCatName] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [categoryPendingDelete, setCategoryPendingDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Sync active tab with defaultTab prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setNewCatName("");
      setAddError(null);
      setCategoryPendingDelete(null);
      setShowConfirmReset(false);
      setFeedbackMessage(null);
    }
  }, [isOpen, defaultTab]);

  // Subscribe to real-time shared Firestore settings document
  useEffect(() => {
    const unsubscribe = subscribeCategorySettings((settings) => {
      setCategorySettings(settings);
    });
    return () => unsubscribe();
  }, []);

  const activeCategories =
    activeTab === "expense"
      ? categorySettings.expenseCategories
      : categorySettings.incomeCategories;

  const defaultPresetList =
    activeTab === "expense" ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;

  // Calculate usage counts across historical records
  const usageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (activeTab === "expense") {
      expenses.forEach((e) => {
        const cat = e.category || "Uncategorized";
        counts[cat] = (counts[cat] || 0) + 1;
      });
    } else {
      incomes.forEach((i) => {
        const cat = i.category || "Other Inflow";
        counts[cat] = (counts[cat] || 0) + 1;
      });
    }
    return counts;
  }, [activeTab, expenses, incomes]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setAddError("Please enter a category name");
      return;
    }

    if (activeCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setAddError(`"${trimmed}" already exists in ${activeTab} categories`);
      return;
    }

    try {
      setIsAdding(true);
      setAddError(null);
      await addCategoryToFirestore(activeTab, trimmed);
      setNewCatName("");
      setFeedbackMessage({
        text: `Category "${trimmed}" successfully synced to Firestore!`,
        type: "success",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setAddError(err.message || "Failed to add category to Firestore");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (activeCategories.length <= 1) {
      setFeedbackMessage({
        text: `Cannot delete the last remaining ${activeTab} category. At least one must be active.`,
        type: "error",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
      setCategoryPendingDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      await deleteCategoryFromFirestore(activeTab, cat);
      setFeedbackMessage({
        text: `Removed "${cat}" from future dropdown options. Historical records remain preserved.`,
        type: "success",
      });
      setCategoryPendingDelete(null);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({
        text: err.message || "Failed to delete category from Firestore",
        type: "error",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setIsResetting(true);
      await resetCategoriesToDefault(activeTab);
      setShowConfirmReset(false);
      setFeedbackMessage({
        text: `Standard default presets restored for ${activeTab === "expense" ? "Expense Outflows" : "Income Inflows"}.`,
        type: "success",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage({
        text: err.message || "Failed to reset categories",
        type: "error",
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  const isExpense = activeTab === "expense";
  const themeColor = isExpense ? "#D4AF37" : "#10B981";
  const themeText = isExpense ? "text-[#D4AF37]" : "text-emerald-400";
  const themeBg = isExpense ? "bg-[#D4AF37]" : "bg-emerald-500";
  const themeBorder = isExpense ? "border-[#D4AF37]" : "border-emerald-500";

  return (
    <div
      id="category-manager-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="category-manager-modal"
        className="w-full max-w-xl bg-[#181818] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#262626] bg-gradient-to-r from-[#181818] via-[#1C1C1C] to-[#1F1F1F] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-black font-bold shadow-md ${
                isExpense ? "bg-[#D4AF37] shadow-[#D4AF37]/20" : "bg-emerald-500 shadow-emerald-500/20"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center space-x-2">
                <span>Manage Dynamic Categories</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Shared Firestore <span className="font-mono text-zinc-300">settings/categories</span> sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#2A2A2A] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 pb-2 border-b border-[#242424] bg-[#151515] flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 w-full">
            <button
              onClick={() => {
                setActiveTab("expense");
                setAddError(null);
                setCategoryPendingDelete(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all border ${
                isExpense
                  ? "bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/40 shadow-sm"
                  : "bg-[#1C1C1C] text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-[#222]"
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Expense Categories</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isExpense ? "bg-[#D4AF37] text-black font-bold" : "bg-[#2A2A2A] text-zinc-300"
                }`}
              >
                {categorySettings.expenseCategories.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("income");
                setAddError(null);
                setCategoryPendingDelete(null);
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all border ${
                !isExpense
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm"
                  : "bg-[#1C1C1C] text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-[#222]"
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Income Categories</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  !isExpense ? "bg-emerald-500 text-black font-bold" : "bg-[#2A2A2A] text-zinc-300"
                }`}
              >
                {categorySettings.incomeCategories.length}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Toast / Feedback Notice */}
          {feedbackMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-200 border ${
                feedbackMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                {feedbackMessage.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
              <button
                onClick={() => setFeedbackMessage(null)}
                className="text-zinc-400 hover:text-white text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Add Form */}
          <div className="rounded-xl bg-[#141414] border border-[#282828] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center space-x-1.5">
                <Tag className={`w-3.5 h-3.5 ${themeText}`} />
                <span>Add New {isExpense ? "Expense" : "Income"} Category</span>
              </label>
              <span className="text-[11px] text-zinc-500">Syncs to Firestore</span>
            </div>

            <form onSubmit={handleAddCategory} className="flex items-center space-x-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  if (addError) setAddError(null);
                }}
                placeholder={
                  isExpense
                    ? "e.g. Legal & Compliance, Office Rent, Logistics"
                    : "e.g. Affiliate Royalties, Equity Dividend, Grant"
                }
                className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333] focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isAdding || !newCatName.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-black flex items-center space-x-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isExpense
                    ? "bg-[#D4AF37] hover:bg-[#E5C345]"
                    : "bg-emerald-500 hover:bg-emerald-400"
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-black" />
                <span>{isAdding ? "Adding..." : "Add"}</span>
              </button>
            </form>

            {addError && <p className="text-xs text-rose-400">{addError}</p>}
          </div>

          {/* Active Selectable Categories List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Active Selectable Options ({activeCategories.length})
              </h3>
              <span className="text-[11px] text-zinc-500">
                Click delete to remove from dropdowns
              </span>
            </div>

            <div className="rounded-xl border border-[#262626] bg-[#141414] divide-y divide-[#222] overflow-hidden">
              {activeCategories.map((cat, idx) => {
                const count = usageCounts[cat] || 0;
                const isPreset = defaultPresetList.includes(cat);
                const dotColor = isExpense
                  ? getCategoryColor(cat, idx)
                  : getIncomeCategoryColor(cat, idx);
                const isPendingDelete = categoryPendingDelete === cat;

                return (
                  <div
                    key={cat}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#1A1A1A] transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: dotColor }}
                      />
                      <div>
                        <span className="text-sm font-medium text-white tracking-tight">
                          {cat}
                        </span>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                              isPreset
                                ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                                : "bg-purple-950/40 text-purple-300 border-purple-800/40"
                            }`}
                          >
                            {isPreset ? "Default Preset" : "Custom"}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {count > 0 ? (
                              <span className="text-zinc-400">
                                {count} {count === 1 ? "record" : "records"} using this
                              </span>
                            ) : (
                              <span>0 records</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-end space-x-2">
                      {isPendingDelete ? (
                        <div className="flex items-center space-x-2 bg-rose-950/40 border border-rose-800/50 p-1.5 rounded-lg">
                          <span className="text-[11px] text-rose-300">Remove?</span>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={isDeleting}
                            className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                          >
                            {isDeleting ? "..." : "Yes, Delete"}
                          </button>
                          <button
                            onClick={() => setCategoryPendingDelete(null)}
                            className="px-2 py-0.5 rounded bg-[#2A2A2A] hover:bg-[#333] text-zinc-300 text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCategoryPendingDelete(cat)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title={`Delete "${cat}" from choices`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Safety Info Notice */}
          <div className="rounded-xl bg-[#151515] border border-blue-500/20 p-3.5 flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">Data Safety Guarantee</div>
              <div>
                Deleting a category only removes it from future input dropdowns. Any past expenses
                or income transactions that used this category retain their string value and will continue
                to render seamlessly in Recharts distribution analytics.
              </div>
            </div>
          </div>

          {/* Reset to Defaults Section */}
          <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 border-t border-[#222]">
            {showConfirmReset ? (
              <div className="flex items-center space-x-2 w-full justify-between bg-amber-950/30 border border-amber-800/40 p-2.5 rounded-xl">
                <span className="text-amber-300 text-xs flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Restore standard presets for {isExpense ? "Expenses" : "Incomes"}?</span>
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={handleResetToDefaults}
                    disabled={isResetting}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
                  >
                    {isResetting ? "Resetting..." : "Confirm Reset"}
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-2 py-1 rounded-lg bg-[#2A2A2A] hover:bg-[#333] text-zinc-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="text-zinc-500 hover:text-zinc-300 flex items-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore {isExpense ? "Expense" : "Income"} Defaults</span>
                </button>
                <span className="font-mono text-[11px] text-zinc-600">settings/categories</span>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#262626] bg-[#141414] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-semibold border border-[#333] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
