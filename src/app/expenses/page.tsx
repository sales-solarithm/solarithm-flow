import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowDownCircle, SlidersHorizontal } from "lucide-react";
import { Expense } from "@/types";
import { subscribeCategories, subscribeExpenses, DEFAULT_CATEGORIES } from "@/lib/expenseService";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { CategoryManagerModal } from "@/components/CategoryManagerModal";

export default function ExpensesPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Subscribe to dynamic categories from Firestore settings doc
    const unsubCategories = subscribeCategories((cats) => {
      setCategories(cats);
    });

    // 2. Subscribe to realtime expenses from Firestore
    const unsubExpenses = subscribeExpenses((exps) => {
      setExpenses(exps);
      setLoading(false);
    });

    return () => {
      unsubCategories();
      unsubExpenses();
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#262626]">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate?.("/")}
            className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-zinc-400 hover:text-white border border-[#2E2E2E] transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                <ArrowDownCircle className="w-6 h-6 text-[#D4AF37]" />
                <span>Expense Outflows</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manual outflow logging and dynamic transaction history with Firestore synchronization
            </p>
          </div>
        </div>

        {/* Primary Action: Manage Categories */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-[#181818] hover:bg-[#222] border border-[#2E2E2E] flex items-center space-x-2 transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Manage Categories</span>
          </button>
        </div>
      </div>

      {/* Unified View: Logging Form at Top, Transaction History Table Directly Below */}
      <div className="space-y-8">
        <div>
          <ExpenseForm categories={categories} />
        </div>

        <div>
          <ExpenseList expenses={expenses} categories={categories} />
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        defaultTab="expense"
        expenses={expenses}
      />
    </div>
  );
}
