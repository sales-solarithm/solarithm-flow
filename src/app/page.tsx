"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  TrendingUp,
  ArrowRight,
  FileCheck2,
  Scale,
} from "lucide-react";
import { Expense, Income, Invoice } from "@/types";
import { subscribeCategories, subscribeExpenses, DEFAULT_CATEGORIES } from "@/lib/expenseService";
import { subscribeIncomes, subscribeInvoices } from "@/lib/incomeService";
import { ExpenseAnalytics } from "@/components/ExpenseAnalytics";
import { ExpenseList } from "@/components/ExpenseList";
import { formatCurrency } from "@/lib/formatters";

export default function HomePage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubCats = subscribeCategories((cats) => {
      setCategories(cats);
    });

    const unsubExps = subscribeExpenses((exps) => {
      setExpenses(exps);
      setLoading(false);
    });

    const unsubIncs = subscribeIncomes((incs) => {
      setIncomes(incs);
    });

    const unsubInvs = subscribeInvoices((invs) => {
      setInvoices(invs);
    });

    return () => {
      unsubCats();
      unsubExps();
      unsubIncs();
      unsubInvs();
    };
  }, []);

  const totalOutflows = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const totalInflows = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  const netCashFlow = totalInflows - totalOutflows;

  const paidInvoicesCount = invoices.filter((i) => i.status === "Paid").length;
  const partialInvoicesCount = invoices.filter((i) => i.status === "Partial").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#181818] via-[#1A1A1A] to-[#202020] border border-[#2A2A2A] p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Solarithm Flow
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Enterprise financial management, real-time cash flow analytics, and client invoice reconciliation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate?.("/incomes")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#121212] font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-[#121212]" />
              <span>Log Revenue Inflow</span>
            </button>
            <button
              onClick={() => onNavigate?.("/expenses")}
              className="px-4 py-2.5 rounded-xl bg-[#1E1E1E] hover:bg-[#252525] text-zinc-200 hover:text-white border border-[#333333] text-sm font-medium transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <TrendingDown className="w-4 h-4 text-[#D4AF37]" />
              <span>Expense Outflows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial Health Overview (4 Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Inflow</span>
            <div className="p-1 rounded-md bg-[#222] text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            +{formatCurrency(totalInflows)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {incomes.length} revenue entries
          </p>
        </div>

        {/* Total Outflow */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Outflow</span>
            <div className="p-1 rounded-md bg-[#222] text-[#D4AF37]">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
            -{formatCurrency(totalOutflows)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {expenses.length} outflow expenses
          </p>
        </div>

        {/* Net Cash Flow */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Net Cash Position</span>
            <div className="p-1 rounded-md bg-[#222] text-[#D4AF37]">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div
            className={`mt-2 text-xl sm:text-2xl font-bold font-mono ${
              netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {netCashFlow >= 0 ? `+${formatCurrency(netCashFlow)}` : formatCurrency(netCashFlow)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {netCashFlow >= 0 ? "Operating Surplus" : "Operating Deficit"}
          </p>
        </div>

        {/* Salary Studio Two-Way Sync */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Salary Studio Invoices</span>
            <div className="p-1 rounded-md bg-[#222] text-[#D4AF37]">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-[#D4AF37]">
            {paidInvoicesCount}/{invoices.length} Paid
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {partialInvoicesCount} in partial status
          </p>
        </div>
      </div>

      {/* Dynamic Recharts Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Expense Distribution Analytics
            </h2>
            <p className="text-xs text-zinc-400">
              Category-wise expenditure breakdown
            </p>
          </div>
          <button
            onClick={() => onNavigate?.("/expenses")}
            className="text-xs text-[#D4AF37] hover:text-[#E5C345] font-semibold flex items-center space-x-1"
          >
            <span>Manage Expenses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ExpenseAnalytics expenses={expenses} categories={categories} />
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recent Outflow Transactions
            </h2>
          </div>
        </div>

        <ExpenseList expenses={expenses} categories={categories} />
      </div>
    </div>
  );
}
