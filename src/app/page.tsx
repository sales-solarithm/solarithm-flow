"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpCircle, ArrowDownCircle, ArrowRight } from "lucide-react";
import { Expense, Income } from "@/types";
import { subscribeExpenses } from "@/lib/expenseService";
import { subscribeIncomes } from "@/lib/incomeService";
import { formatCurrency, formatSigned } from "@/lib/formatters";

export default function HomePage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubExps = subscribeExpenses((exps) => {
      setExpenses(exps);
      setLoading(false);
    });

    const unsubIncs = subscribeIncomes((incs) => {
      setIncomes(incs);
    });

    return () => {
      unsubExps();
      unsubIncs();
    };
  }, []);

  const totalInflows = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  const totalOutflows = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const netPosition = totalInflows - totalOutflows;

  // Latest 8 transactions for each side
  const recentInflows = incomes.slice(0, 8);
  const recentExpenses = expenses.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Minimal Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Cash Flow Terminal
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Two-way financial synchronization with Solarithm Insight
          </p>
        </div>
      </div>

      {/* Minimal Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Inflows */}
        <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Inflows</span>
            <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {formatSigned(totalInflows, "+")}
          </div>
          <p className="text-[11px] font-mono text-zinc-500">
            {incomes.length} inflow entries
          </p>
        </div>

        {/* Total Outflows */}
        <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Outflows</span>
            <ArrowDownCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 tracking-tight">
            {formatSigned(totalOutflows, "-")}
          </div>
          <p className="text-[11px] font-mono text-zinc-500">
            {expenses.length} outflow entries
          </p>
        </div>

        {/* Net Position */}
        <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Net Position</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                netPosition >= 0
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/60"
                  : "bg-rose-950/60 text-rose-400 border border-rose-900/60"
              }`}
            >
              {netPosition >= 0 ? "SURPLUS" : "DEFICIT"}
            </span>
          </div>
          <div
            className={`text-2xl font-bold font-mono tracking-tight ${
              netPosition >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {netPosition >= 0 ? formatSigned(netPosition, "+") : formatSigned(netPosition, "-")}
          </div>
          <p className="text-[11px] text-zinc-500">
            {netPosition >= 0 ? "Operating Surplus" : "Operating Deficit"}
          </p>
        </div>
      </div>

      {/* Two Clean Side-by-Side Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Inflow Payments */}
        <div className="rounded-xl bg-[#181818] border border-[#262626] overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Inflow Payments
              </h2>
            </div>
            <button
              onClick={() => onNavigate?.("/incomes")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading inflows...</div>
            ) : recentInflows.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">No inflow payments recorded.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#141414] text-zinc-400 border-b border-[#262626]">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Client / Source</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {recentInflows.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#1E1E1E]/50 transition-colors">
                      <td className="py-2.5 px-3 text-zinc-400 font-mono whitespace-nowrap">
                        {inc.date}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-white font-medium block truncate max-w-[180px]">
                          {inc.source}
                        </span>
                        {inc.description && (
                          <span className="text-[11px] text-zinc-500 truncate block max-w-[180px]">
                            {inc.description}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                        +{formatCurrency(inc.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Recent Outflow Expenses */}
        <div className="rounded-xl bg-[#181818] border border-[#262626] overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Recent Outflow Expenses
              </h2>
            </div>
            <button
              onClick={() => onNavigate?.("/expenses")}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-zinc-500">Loading expenses...</div>
            ) : recentExpenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">No outflow expenses recorded.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#141414] text-zinc-400 border-b border-[#262626]">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Description</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {recentExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#1E1E1E]/50 transition-colors">
                      <td className="py-2.5 px-3 text-zinc-400 font-mono whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                        {exp.category}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-200 truncate max-w-[160px]">
                        {exp.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-400 whitespace-nowrap">
                        -{formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
