"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowDownCircle,
  Loader2,
  Trash2,
  Check,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import { Expense } from "@/types";
import {
  subscribeExpenses,
  createExpenseInFirestore,
  deleteExpenseFromFirestore,
  DEFAULT_CATEGORIES,
} from "@/lib/expenseService";
import { subscribeExpenseCategories } from "@/lib/categoryService";
import { formatCurrency, formatSigned } from "@/lib/formatters";

export default function ExpensesPage({ onNavigate }: { onNavigate?: (path: string) => void } = {}) {
  const today = new Date().toISOString().split("T")[0];

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);

  // Outflow Logger Form State
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0] || "Operations");
  const [date, setDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deleting expense state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubExpenses = subscribeExpenses((exps) => {
      setExpenses(exps);
      setLoading(false);
    });

    const unsubCategories = subscribeExpenseCategories((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !cats.includes(category)) {
        setCategory(cats[0]);
      }
    });

    return () => {
      unsubExpenses();
      unsubCategories();
    };
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Please enter a valid expense amount greater than ₹0");
      return;
    }
    if (!description.trim()) {
      setErrorMessage("Please enter a description for the expense");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      await createExpenseInFirestore({
        amount: numAmount,
        description: description.trim(),
        category: category || "Operations",
        date: date || today,
        notes: notes.trim(),
      });

      setSuccessMessage(`Logged outflow of -${formatCurrency(numAmount)}`);
      setAmount("");
      setDescription("");
      setNotes("");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log expense in Firestore");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteExpenseFromFirestore(id);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const totalOutflows = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header with Uniform Red Theme */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div className="flex items-center space-x-2.5">
          <ArrowDownCircle className="w-5 h-5 text-rose-400" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Expense Outflows
            </h1>
            <p className="text-xs text-zinc-400">
              Direct outflow logger synchronized with Solarithm Insight Executive Dashboard
            </p>
          </div>
        </div>

        {/* Total Outflows Mini Counter */}
        <div className="text-right">
          <span className="text-[10px] font-mono text-zinc-500 uppercase block">Total Outflows</span>
          <span className="text-base font-bold font-mono text-rose-400">
            {formatSigned(totalOutflows, "-")}
          </span>
        </div>
      </div>

      {/* TOP SECTION: Minimal Outflow Logger */}
      <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 sm:p-5">
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-[#242424]">
          <span className="w-2 h-2 rounded-full bg-rose-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Log Outflow Expense
          </h2>
        </div>

        {successMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Amount with Red Highlight */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-rose-400 text-xs font-mono font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-[#121212] border border-rose-900/60 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg text-xs font-mono text-rose-400 placeholder-zinc-600 outline-none transition-all font-semibold"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Server hosting, travel allowance"
                className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg text-xs text-white placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg text-xs text-white outline-none transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg text-xs text-white outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting || !amount}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowDownCircle className="w-3.5 h-3.5" />
              )}
              <span>Save Outflow Expense</span>
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM SECTION: Clean Table of Outflow Transactions */}
      <div className="rounded-xl bg-[#181818] border border-[#262626] overflow-hidden">
        <div className="p-3.5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Outflow Transactions ({expenses.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">No outflow expenses recorded.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#141414] text-zinc-400 border-b border-[#262626]">
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Description</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Amount</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#1E1E1E]/50 transition-colors">
                    {/* Date */}
                    <td className="py-2.5 px-3 text-zinc-400 font-mono whitespace-nowrap">
                      {exp.date}
                    </td>

                    {/* Category */}
                    <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#121212] border border-[#262626]">
                        {exp.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-2.5 px-3 text-white font-medium">
                      {exp.description}
                      {exp.notes && (
                        <span className="block text-[11px] text-zinc-500 mt-0.5">
                          {exp.notes}
                        </span>
                      )}
                    </td>

                    {/* Amount in Red -₹ */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 whitespace-nowrap">
                      -{formatCurrency(exp.amount)}
                    </td>

                    {/* Delete Action */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        disabled={deletingId === exp.id}
                        title="Delete expense"
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        {deletingId === exp.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
