"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2,
  X,
  FileCheck2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Income, Invoice } from "@/types";
import {
  subscribeIncomes,
  subscribeInvoices,
  createDirectIncome,
  recordInvoicePayment,
  deleteIncomeFromFirestore,
} from "@/lib/incomeService";
import { subscribeIncomeCategories, DEFAULT_INCOME_CATEGORIES } from "@/lib/categoryService";
import { formatCurrency } from "@/lib/formatters";

export default function IncomesPage({ onNavigate }: { onNavigate?: (path: string) => void } = {}) {
  const today = new Date().toISOString().split("T")[0];

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);

  // Direct Inflow Form State
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(today);
  const [source, setSource] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>(DEFAULT_INCOME_CATEGORIES[0]);
  const [submittingInflow, setSubmittingInflow] = useState<boolean>(false);
  const [inflowSuccess, setInflowSuccess] = useState<string | null>(null);
  const [inflowError, setInflowError] = useState<string | null>(null);

  // Record Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentType, setPaymentType] = useState<"Full" | "Partial">("Full");
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Filter for Invoices table
  const [invoiceFilter, setInvoiceFilter] = useState<"ALL" | "UNPAID" | "PAID">("ALL");

  useEffect(() => {
    const unsubIncomes = subscribeIncomes((incs) => {
      setIncomes(incs);
      setLoading(false);
    });

    const unsubInvoices = subscribeInvoices((invs) => {
      setInvoices(invs);
    });

    const unsubCategories = subscribeIncomeCategories((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !cats.includes(category)) {
        setCategory(cats[0]);
      }
    });

    return () => {
      unsubIncomes();
      unsubInvoices();
      unsubCategories();
    };
  }, []);

  // Handle Direct Inflow submission
  const handleLogDirectInflow = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setInflowError("Please enter a valid amount greater than ₹0");
      return;
    }
    if (!source.trim()) {
      setInflowError("Please enter a client or source name");
      return;
    }

    try {
      setSubmittingInflow(true);
      setInflowError(null);
      await createDirectIncome({
        amount: numAmount,
        date: date || today,
        source: source.trim(),
        description: description.trim(),
        category: category || "Direct Client Wire",
      });

      setInflowSuccess(`Logged inflow of ${formatCurrency(numAmount)} from ${source}`);
      setAmount("");
      setSource("");
      setDescription("");
      setTimeout(() => setInflowSuccess(null), 4000);
    } catch (err: any) {
      setInflowError(err.message || "Failed to log inflow");
    } finally {
      setSubmittingInflow(false);
    }
  };

  // Open modal for recording invoice payment
  const handleOpenRecordPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const remaining = Math.max(0, inv.totalPayable - inv.amountReceived);
    setPaymentType("Full");
    setPartialAmount(remaining > 0 ? remaining.toString() : "");
    setPaymentDate(today);
    setPaymentNotes("");
    setPaymentError(null);
  };

  // Submit invoice payment with ATOMIC SYNC
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const remaining = Math.max(0, selectedInvoice.totalPayable - selectedInvoice.amountReceived);
    let payAmount = 0;

    if (paymentType === "Full") {
      payAmount = remaining > 0 ? remaining : selectedInvoice.totalPayable;
    } else {
      payAmount = parseFloat(partialAmount);
      if (isNaN(payAmount) || payAmount <= 0) {
        setPaymentError("Please enter a valid partial amount greater than ₹0");
        return;
      }
    }

    try {
      setProcessingPayment(true);
      setPaymentError(null);

      await recordInvoicePayment({
        invoiceId: selectedInvoice.id,
        paymentType,
        paymentAmount: payAmount,
        date: paymentDate,
        category: "Client Invoice Settlement",
        description: `${paymentType} Settlement for Invoice #${selectedInvoice.invoiceNumber}`,
        notes: paymentNotes,
      });

      setSelectedInvoice(null);
    } catch (err: any) {
      setPaymentError(err.message || "Failed to record payment in Firestore");
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const isPaid = inv.status === "PAID" || (inv.totalPayable > 0 && inv.amountReceived >= inv.totalPayable);
    if (invoiceFilter === "PAID") return isPaid;
    if (invoiceFilter === "UNPAID") return !isPaid;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header with Uniform Green Theme */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div className="flex items-center space-x-2.5">
          <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Incomes &amp; Invoice Reconciliation
            </h1>
            <p className="text-xs text-zinc-400">
              Direct inflow logging and bidirectional invoice synchronization
            </p>
          </div>
        </div>
      </div>

      {/* TOP SECTION: Clean Form to Log Direct Inflows */}
      <div className="rounded-xl bg-[#181818] border border-[#262626] p-4 sm:p-5">
        <div className="flex items-center space-x-2 mb-4 pb-2 border-b border-[#242424]">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Log Direct Inflow
          </h2>
        </div>

        {inflowSuccess && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{inflowSuccess}</span>
          </div>
        )}

        {inflowError && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{inflowError}</span>
          </div>
        )}

        <form onSubmit={handleLogDirectInflow} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-emerald-400 text-xs font-mono font-bold">
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
                  className="w-full pl-7 pr-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs font-mono text-emerald-400 placeholder-zinc-600 outline-none transition-all font-semibold"
                />
              </div>
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
                className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs text-white outline-none transition-all font-mono"
              />
            </div>

            {/* Source / Client */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Source / Client
              </label>
              <input
                type="text"
                required
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Acme Solar Corp"
                className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs text-white placeholder-zinc-600 outline-none transition-all"
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
                className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs text-white outline-none transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Direct deposit details"
                className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs text-white placeholder-zinc-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submittingInflow || !amount}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#121212] font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              {submittingInflow ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUpCircle className="w-3.5 h-3.5" />
              )}
              <span>Record Direct Inflow</span>
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM SECTION: Real-Time Invoices Table from Solarithm Insight */}
      <div className="rounded-xl bg-[#181818] border border-[#262626] overflow-hidden">
        <div className="p-3.5 border-b border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Solarithm Insight Invoices ({invoices.length})
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1">
            {(["ALL", "UNPAID", "PAID"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setInvoiceFilter(filter)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium font-mono transition-colors cursor-pointer ${
                  invoiceFilter === filter
                    ? "bg-[#252525] text-emerald-400 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-white bg-[#141414] border border-[#262626]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No invoices synced from Solarithm Insight yet.
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No invoices match the "{invoiceFilter}" filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#141414] text-zinc-400 border-b border-[#262626]">
                  <th className="py-2.5 px-3 font-semibold">Invoice #</th>
                  <th className="py-2.5 px-3 font-semibold">Client</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Payable</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Received</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Due</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredInvoices.map((inv) => {
                  const remaining = Math.max(0, inv.totalPayable - inv.amountReceived);
                  const isPaid =
                    inv.status === "PAID" || (inv.totalPayable > 0 && inv.amountReceived >= inv.totalPayable);
                  const isPartial = inv.status === "PARTIALLY_PAID" && !isPaid;

                  return (
                    <tr key={inv.id} className="hover:bg-[#1E1E1E]/50 transition-colors">
                      {/* Invoice # */}
                      <td className="py-2.5 px-3 font-mono font-medium text-white whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      {/* Client */}
                      <td className="py-2.5 px-3">
                        <span className="text-zinc-200 font-medium block truncate max-w-[180px]">
                          {inv.clientName}
                        </span>
                        {inv.description && (
                          <span className="text-[11px] text-zinc-500 block truncate max-w-[180px]">
                            {inv.description}
                          </span>
                        )}
                      </td>

                      {/* Total Payable */}
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-200 whitespace-nowrap">
                        {formatCurrency(inv.totalPayable)}
                      </td>

                      {/* Amount Received */}
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400 whitespace-nowrap">
                        {formatCurrency(inv.amountReceived)}
                      </td>

                      {/* Remaining Due */}
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400 whitespace-nowrap">
                        {isPaid ? "—" : formatCurrency(remaining)}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PAID</span>
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/60 text-amber-400 border border-amber-900/60">
                            <Clock className="w-3 h-3" />
                            <span>PARTIAL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {isPaid ? (
                          <span className="text-[11px] text-emerald-400/80 font-mono">
                            Settled
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenRecordPayment(inv)}
                            className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-[#121212] text-xs font-bold transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <IndianRupee className="w-3 h-3" />
                            <span>Record Payment</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RECORD PAYMENT ATOMIC SYNC MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-[#181818] border border-[#262626] p-5 space-y-4 shadow-2xl animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-1.5">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  <span>Record Payment</span>
                </h3>
                <p className="text-[11px] font-mono text-zinc-400">
                  {selectedInvoice.invoiceNumber} • {selectedInvoice.clientName}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#262626]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Summary */}
            <div className="p-3 rounded-lg bg-[#121212] border border-[#262626] grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block">Total</span>
                <span className="text-white font-bold">{formatCurrency(selectedInvoice.totalPayable)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Received</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(selectedInvoice.amountReceived)}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block">Remaining</span>
                <span className="text-[#D4AF37] font-bold">
                  {formatCurrency(Math.max(0, selectedInvoice.totalPayable - selectedInvoice.amountReceived))}
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              {/* Payment Type Selection */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Settlement Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType("Full")}
                    className={`py-2 px-3 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                      paymentType === "Full"
                        ? "bg-emerald-950/50 text-emerald-400 border-emerald-500"
                        : "bg-[#141414] text-zinc-400 border-[#2A2A2A] hover:text-white"
                    }`}
                  >
                    Full Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType("Partial")}
                    className={`py-2 px-3 rounded-lg font-medium border text-center transition-all cursor-pointer ${
                      paymentType === "Partial"
                        ? "bg-emerald-950/50 text-emerald-400 border-emerald-500"
                        : "bg-[#141414] text-zinc-400 border-[#2A2A2A] hover:text-white"
                    }`}
                  >
                    Partial Payment
                  </button>
                </div>
              </div>

              {/* Partial Amount Input */}
              {paymentType === "Partial" && (
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Partial Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 rounded-lg font-mono text-emerald-400 text-xs outline-none"
                  />
                </div>
              )}

              {/* Payment Date */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Settlement Date
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 rounded-lg text-white text-xs outline-none font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Bank transfer transaction ref"
                  className="w-full px-3 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 rounded-lg text-white text-xs outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-2 rounded-lg text-zinc-400 hover:text-white bg-[#141414] border border-[#262626]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#121212] font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {processingPayment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
