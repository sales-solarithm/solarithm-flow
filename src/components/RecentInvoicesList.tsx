import React, { useState, useMemo } from "react";
import {
  FileCheck2,
  Building,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { Invoice } from "../types";
import { formatCurrency } from "../lib/formatters";

interface RecentInvoicesListProps {
  invoices: Invoice[];
  selectedInvoiceId?: string | null;
  onSelectInvoice: (invoice: Invoice) => void;
  loading?: boolean;
}

export function RecentInvoicesList({
  invoices,
  selectedInvoiceId,
  onSelectInvoice,
  loading = false,
}: RecentInvoicesListProps) {
  const [showAll, setShowAll] = useState<boolean>(false);

  // Sort invoices by date: newest first (using createdAt, dueDate, or updatedAt)
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.dueDate || 0).getTime();
      const timeB = new Date(b.createdAt || b.dueDate || 0).getTime();
      return timeB - timeA;
    });
  }, [invoices]);

  // Display limit: latest 6 by default
  const displayedInvoices = showAll ? sortedInvoices : sortedInvoices.slice(0, 6);

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "Paid":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Paid</span>
          </span>
        );
      case "Partial":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            <span>Partial</span>
          </span>
        );
      case "Pending":
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#262626]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#222222] border border-[#2E2E2E] flex items-center justify-center text-emerald-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Recent Client Invoices
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#242424] text-zinc-300 font-mono border border-[#333333]">
                  {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Quick-select any invoice to automatically populate and reconcile inflow payments
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-500 font-mono self-start sm:self-auto">
            {sortedInvoices.length > 0 && (
              <span>Showing {displayedInvoices.length} of {sortedInvoices.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Invoice List Content */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 space-y-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Fetching invoices from Salary Studio Firestore...</p>
        </div>
      ) : sortedInvoices.length === 0 ? (
        <div className="p-10 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#2C2C2C] flex items-center justify-center mx-auto text-zinc-500">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-zinc-200">
            No pending invoices found in Salary Studio.
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            When invoices are created in Salary Studio, they will sync here in real time for payment logging.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141414] text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#262626]">
                  <th className="py-3.5 px-4">Client Name</th>
                  <th className="py-3.5 px-4">Invoice ID / Number</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Total &amp; Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {displayedInvoices.map((inv) => {
                  const remaining = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
                  const isSelected = selectedInvoiceId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-emerald-950/20 hover:bg-emerald-950/30"
                          : "hover:bg-[#1E1E1E]/60"
                      }`}
                    >
                      {/* Client Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#202020] border border-[#2E2E2E] flex items-center justify-center text-zinc-400 shrink-0">
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-white block text-sm">
                              {inv.clientName}
                            </span>
                            {inv.description && (
                              <span className="text-[11px] text-zinc-400 line-clamp-1 max-w-[200px]">
                                {inv.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Invoice ID / Number */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-zinc-200 font-semibold block">
                          {inv.invoiceNumber || "—"}
                        </span>
                        <span className="text-[10px] text-zinc-500 truncate block max-w-[140px]" title={inv.id}>
                          ID: {inv.id}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{inv.dueDate || "—"}</span>
                        </div>
                      </td>

                      {/* Total & Remaining Balance */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-white block text-sm">
                            {formatCurrency(inv.totalAmount)}
                          </span>
                          {inv.status !== "Paid" && remaining > 0 ? (
                            <span className="text-[11px] font-mono text-[#D4AF37] block">
                              Due: {formatCurrency(remaining)}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-emerald-400 block">
                              Fully Settled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(inv.status)}
                      </td>

                      {/* Log Payment Quick-Select Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectInvoice(inv)}
                          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer shadow-sm ${
                            isSelected
                              ? "bg-emerald-500 text-[#121212] font-bold ring-2 ring-emerald-400/50"
                              : "bg-[#222222] hover:bg-emerald-500 hover:text-[#121212] text-zinc-200 border border-[#333333] hover:border-emerald-500"
                          }`}
                          title={`Log payment for ${inv.clientName}`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#121212]" />
                              <span>Selected</span>
                            </>
                          ) : (
                            <>
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>Log Payment</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[#222222]">
            {displayedInvoices.map((inv) => {
              const remaining = Math.max(0, inv.totalAmount - (inv.amountPaid || 0));
              const isSelected = selectedInvoiceId === inv.id;

              return (
                <div
                  key={inv.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isSelected ? "bg-emerald-950/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {inv.clientName}
                      </h4>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-400 font-mono mt-0.5">
                        <span>{inv.invoiceNumber}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">ID: {inv.id}</span>
                      </div>
                    </div>
                    {getStatusBadge(inv.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500 font-medium">Total Amount</div>
                      <div className="font-mono font-bold text-white text-sm">
                        {formatCurrency(inv.totalAmount)}
                      </div>
                    </div>

                    {inv.status !== "Paid" && remaining > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] uppercase text-zinc-500 font-medium">Remaining Due</div>
                        <div className="font-mono font-semibold text-[#D4AF37]">
                          {formatCurrency(remaining)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#252525] flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">
                      Due: {inv.dueDate || "N/A"}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectInvoice(inv)}
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500 text-[#121212] font-bold"
                          : "bg-[#242424] text-white hover:bg-emerald-500 hover:text-[#121212] border border-[#363636]"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Log Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "See All" / "Show Less" Pagination Toggle */}
          {sortedInvoices.length > 6 && (
            <div className="p-4 bg-[#141414] border-t border-[#242424] text-center">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#202020] hover:bg-[#282828] text-xs font-semibold text-zinc-200 hover:text-white border border-[#333333] transition-colors cursor-pointer shadow-sm"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4 text-emerald-400" />
                    <span>Show Less (Display Latest 6)</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 text-emerald-400" />
                    <span>See All ({sortedInvoices.length} Historical Invoices)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
