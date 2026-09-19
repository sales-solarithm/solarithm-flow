import React, { useState } from "react";
import {
  FileCheck2,
  Building,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Invoice } from "../types";
import { createInvoiceInFirestore } from "../lib/incomeService";
import { formatCurrency } from "../lib/formatters";

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectForPayment?: (invoiceId: string) => void;
}

export function InvoiceList({ invoices, onSelectForPayment }: InvoiceListProps) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "Pending" | "Partial" | "Paid">("ALL");
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // New invoice form state
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [clientName, setClientName] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>("");
  const [createLoading, setCreateLoading] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus === "ALL") return true;
    return inv.status === filterStatus;
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(totalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setCreateError("Please enter a valid total amount");
      return;
    }
    if (!clientName.trim()) {
      setCreateError("Please enter a client name");
      return;
    }

    try {
      setCreateLoading(true);
      setCreateError(null);
      await createInvoiceInFirestore({
        invoiceNumber: invoiceNumber.trim(),
        clientName: clientName.trim(),
        totalAmount: amountNum,
        amountPaid: 0,
        status: "Pending",
        dueDate: dueDate,
        description: description.trim(),
      });

      // Reset
      setIsCreatingNew(false);
      setClientName("");
      setTotalAmount("");
      setDescription("");
      setInvoiceNumber(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create invoice");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#262626] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-[#D4AF37]">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center space-x-2">
                <span>Salary Studio Invoices Database</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#252525] text-emerald-400 font-mono border border-[#333333]">
                  {invoices.length} Invoices
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Target database for two-way settlement transactions (Pending &rarr; Partial &rarr; Paid)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-white text-xs font-semibold border border-[#333333] transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{isCreatingNew ? "Cancel" : "New Invoice"}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {(["ALL", "Pending", "Partial", "Paid"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === st
                  ? "bg-[#D4AF37] text-[#121212] font-semibold shadow-sm"
                  : "bg-[#1E1E1E] text-zinc-400 hover:text-white border border-[#2C2C2C]"
              }`}
            >
              {st === "ALL" ? "All Invoices" : st}
            </button>
          ))}
        </div>
      </div>

      {/* New Invoice Form Inline Drawer */}
      {isCreatingNew && (
        <form
          onSubmit={handleCreateInvoice}
          className="p-5 bg-[#141414] border-b border-[#2A2A2A] space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
              Create Salary Studio Invoice
            </span>
            <span className="text-[11px] text-zinc-500">Saves to Firestore collection `/invoices`</span>
          </div>

          {createError && <p className="text-xs text-rose-400">{createError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Invoice #</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Client Name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Enterprise Client Ltd"
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Total Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Scope / Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Monthly Software Engineering Retainer"
                className="w-full px-3 py-2 bg-[#1C1C1C] border border-[#333] rounded-lg text-xs text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={createLoading}
            className="px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C29E2C] text-[#121212] font-semibold text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            {createLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Save Invoice to Database</span>
          </button>
        </form>
      )}

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <div className="py-10 px-4 text-center text-zinc-500 text-xs space-y-2">
          <p className="text-zinc-400 font-medium">No invoices found matching "{filterStatus}"</p>
          <p className="text-zinc-600">
            {invoices.length === 0
              ? "Click 'Seed Sample Invoices' above to populate sample invoices for testing."
              : "Try switching status filters."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#242424]">
          {filteredInvoices.map((inv) => {
            const amountPaid = inv.amountPaid || 0;
            const remaining = Math.max(0, inv.totalAmount - amountPaid);
            const percentPaid = inv.totalAmount > 0 ? Math.min(100, Math.round((amountPaid / inv.totalAmount) * 100)) : 0;

            const isPaid = inv.status === "Paid";
            const isPartial = inv.status === "Partial";

            return (
              <div
                key={inv.id}
                className="p-4 sm:p-5 hover:bg-[#1A1A1A] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                {/* Left info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white bg-[#222] px-2 py-0.5 rounded border border-[#2E2E2E]">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPaid
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-600/40"
                          : isPartial
                          ? "bg-amber-950/60 text-amber-400 border border-amber-600/40"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
                      Due: {inv.dueDate}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white truncate">{inv.clientName}</h4>
                  {inv.description && (
                    <p className="text-xs text-zinc-400 line-clamp-1">{inv.description}</p>
                  )}

                  {/* Progress Bar for Payment Ratio */}
                  <div className="w-full max-w-xs space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{percentPaid}% Settled</span>
                      <span>Paid: {formatCurrency(amountPaid)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#272727] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPaid ? "bg-emerald-400" : isPartial ? "bg-amber-400" : "bg-zinc-600"
                        }`}
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right amounts & Action */}
                <div className="flex items-center justify-between sm:justify-end sm:space-x-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#262626]">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total / Balance Due</div>
                    <div className="text-sm font-bold font-mono text-white">
                      {formatCurrency(inv.totalAmount)}
                    </div>
                    <div className="text-xs font-mono font-semibold text-[#D4AF37]">
                      {isPaid ? "Fully Paid" : `Due: ${formatCurrency(remaining)}`}
                    </div>
                  </div>

                  {!isPaid && onSelectForPayment && (
                    <button
                      onClick={() => onSelectForPayment(inv.id)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#121212] text-xs font-bold shadow-md shadow-emerald-600/15 transition-all flex items-center space-x-1.5"
                    >
                      <span>Record Payment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
