import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  FileCheck2,
  Calendar,
  Building,
  Tag,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { Invoice } from "../types";
import {
  DEFAULT_INCOME_CATEGORIES,
  subscribeIncomeCategories,
  addIncomeCategoryToFirestore,
  logIncomeWithInvoiceSync,
  subscribeInvoices,
} from "../lib/incomeService";
import { formatCurrency, formatRupeeTick } from "../lib/formatters";

interface IncomeFormProps {
  invoices?: Invoice[];
  categories?: string[];
  selectedInvoiceId?: string | null;
  onClearSelectedInvoice?: () => void;
  onIncomeLogged?: () => void;
  onInvoiceUpdated?: () => void;
}

export function IncomeForm({
  invoices: propInvoices,
  categories: propCategories,
  selectedInvoiceId: propSelectedInvoiceId,
  onClearSelectedInvoice,
  onIncomeLogged,
  onInvoiceUpdated,
}: IncomeFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [dbInvoices, setDbInvoices] = useState<Invoice[]>([]);

  // Automatically fetch from Firestore invoices collection if not provided as prop
  useEffect(() => {
    if (!propInvoices || propInvoices.length === 0) {
      const unsub = subscribeInvoices((data) => {
        setDbInvoices(data);
      });
      return () => unsub();
    }
  }, [propInvoices]);

  const invoices = propInvoices && propInvoices.length > 0 ? propInvoices : dbInvoices;

  const [subscribedCategories, setSubscribedCategories] = useState<string[]>(DEFAULT_INCOME_CATEGORIES);
  const activeCategories = propCategories && propCategories.length > 0 ? propCategories : subscribedCategories;

  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [category, setCategory] = useState<string>(activeCategories[0] || DEFAULT_INCOME_CATEGORIES[0]);
  const [date, setDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");

  // Custom Category Input State
  const [showCustomCatInput, setShowCustomCatInput] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [addingCategory, setAddingCategory] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Subscribe to income categories if not passed as prop
  useEffect(() => {
    if (!propCategories) {
      const unsub = subscribeIncomeCategories((cats) => {
        setSubscribedCategories(cats);
      });
      return () => unsub();
    }
  }, [propCategories]);

  // Sync selected category if activeCategories change and selected is removed
  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.includes(category)) {
      setCategory(activeCategories[0]);
    }
  }, [activeCategories, category]);

  const handleAddCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError("Please enter a category name");
      return;
    }
    if (activeCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError("This category already exists");
      return;
    }

    try {
      setAddingCategory(true);
      setCategoryError(null);
      await addIncomeCategoryToFirestore(trimmed);
      setCategory(trimmed);
      setNewCategoryName("");
      setShowCustomCatInput(false);
    } catch (err: any) {
      console.error("Error adding income category:", err);
      setCategoryError(err.message || "Failed to save category to Firestore");
    } finally {
      setAddingCategory(false);
    }
  };

  // Optional Linked Invoice State
  const [linkedInvoiceId, setLinkedInvoiceId] = useState<string>(propSelectedInvoiceId || "NONE");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Partial">("Paid");
  const [partialAmount, setPartialAmount] = useState<string>("");

  // Keep in sync when propSelectedInvoiceId changes
  useEffect(() => {
    if (propSelectedInvoiceId !== undefined) {
      setLinkedInvoiceId(propSelectedInvoiceId || "NONE");
    }
  }, [propSelectedInvoiceId]);

  const handleUnlinkInvoice = () => {
    setLinkedInvoiceId("NONE");
    onClearSelectedInvoice?.();
    setSource("");
    setDescription("");
    setAmount("");
    setPartialAmount("");
    setPaymentStatus("Paid");
  };

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Selected invoice helper
  const selectedInvoice = invoices.find((inv) => inv.id === linkedInvoiceId);

  // When an invoice is selected, auto-populate fields and set defaults
  useEffect(() => {
    if (selectedInvoice) {
      const remaining = Math.max(0, selectedInvoice.totalAmount - (selectedInvoice.amountPaid || 0));
      setSource(selectedInvoice.clientName || "");
      setDescription(`Invoice Settlement: ${selectedInvoice.invoiceNumber || selectedInvoice.id}`);
      setCategory("Client Invoice Settlement");

      if (paymentStatus === "Paid") {
        setAmount(remaining.toString());
      } else {
        // Partial: suggest half or 1000 or remaining
        const suggestedPartial = remaining > 1000 ? 1000 : remaining;
        setPartialAmount(suggestedPartial.toString());
        setAmount(suggestedPartial.toString());
      }
    } else if (linkedInvoiceId === "NONE") {
      setPaymentStatus("Paid");
      setPartialAmount("");
    }
  }, [linkedInvoiceId, selectedInvoice]);

  // When paymentStatus switches between Paid and Partial
  const handlePaymentStatusChange = (newStatus: "Paid" | "Partial") => {
    setPaymentStatus(newStatus);
    if (!selectedInvoice) return;

    const remaining = Math.max(0, selectedInvoice.totalAmount - (selectedInvoice.amountPaid || 0));
    if (newStatus === "Paid") {
      setAmount(remaining.toString());
      setPartialAmount("");
    } else {
      const suggested = partialAmount ? partialAmount : (remaining > 500 ? (remaining / 2).toFixed(2) : remaining.toString());
      setPartialAmount(suggested);
      setAmount(suggested);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isLinked = linkedInvoiceId !== "NONE" && Boolean(selectedInvoice);
    const finalAmount = isLinked && paymentStatus === "Partial"
      ? parseFloat(partialAmount)
      : parseFloat(amount);

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setSubmitError("Please enter a valid inflow payment amount greater than ₹0.00");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Please provide an income description");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const result = await logIncomeWithInvoiceSync({
        amount: finalAmount,
        description: description.trim(),
        source: source.trim() || (selectedInvoice ? selectedInvoice.clientName : "Direct Inflow"),
        category,
        date: date || today,
        notes: notes.trim(),
        linkedInvoiceId: isLinked ? linkedInvoiceId : undefined,
        paymentStatus: isLinked ? paymentStatus : undefined,
        partialAmount: isLinked && paymentStatus === "Partial" ? finalAmount : undefined,
      });

      // Clear & notify
      setAmount("");
      setDescription("");
      setSource("");
      setNotes("");
      setPartialAmount("");
      setLinkedInvoiceId("NONE");
      onClearSelectedInvoice?.();
      setPaymentStatus("Paid");

      if (result.invoiceId) {
        setSubmitSuccess(
          `Firestore Transaction Executed! Logged +${formatCurrency(finalAmount)} income and updated Invoice status to "${result.newStatus}" (Amount Paid: ${formatCurrency(result.newAmountPaid || 0)}).`
        );
      } else {
        setSubmitSuccess(`Direct income of +${formatCurrency(finalAmount)} recorded in Firestore!`);
      }

      setTimeout(() => setSubmitSuccess(null), 6000);
      onIncomeLogged?.();
      onInvoiceUpdated?.();
    } catch (err: any) {
      console.error("Error logging income transaction:", err);
      setSubmitError(err.message || "Failed to execute income transaction in Firestore");
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAmounts = [2500, 5000, 10000, 25000, 50000, 100000];

  return (
    <div id="log-inflow-form" className="rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-xl overflow-hidden scroll-mt-6">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-[#262626] bg-gradient-to-r from-[#181818] via-[#1B1B1B] to-[#1F1F1F] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-[#121212] font-bold shadow-md shadow-emerald-500/20">
            <IndianRupee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Log Revenue Inflow
            </h2>
            <p className="text-xs text-zinc-400">
              Two-way atomic transaction sync with Salary Studio invoices
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Atomic Transaction</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Success Alert */}
        {submitSuccess && (
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/40 p-4 text-xs text-emerald-300 flex items-start space-x-3 animate-in fade-in">
            <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-200">Atomic Two-Way Sync Succeeded</p>
              <p className="text-emerald-300/90 leading-relaxed">{submitSuccess}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {submitError && (
          <div className="rounded-xl bg-rose-950/40 border border-rose-600/40 p-3.5 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 1. Linked Invoice Status & Settlement (Replaces massive dropdown) */}
        {selectedInvoice ? (
          <div className="rounded-xl bg-[#141414] border border-[#2E2E2E] p-4 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#242424]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white">
                      Linked Invoice: {selectedInvoice.invoiceNumber || selectedInvoice.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase font-mono ${
                        selectedInvoice.status === "Paid"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : selectedInvoice.status === "Partial"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      }`}
                    >
                      {selectedInvoice.status}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    Client: <strong className="text-zinc-200">{selectedInvoice.clientName}</strong> • ID:{" "}
                    <span className="font-mono text-[11px] text-zinc-400">{selectedInvoice.id}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUnlinkInvoice}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-rose-300 bg-[#1E1E1E] hover:bg-rose-950/30 border border-[#2E2E2E] hover:border-rose-700/50 transition-colors cursor-pointer"
                title="Unlink invoice and log direct inflow"
              >
                <X className="w-3.5 h-3.5" />
                <span>Unlink Invoice</span>
              </button>
            </div>

            {/* Invoiced Balance Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-[#181818] rounded-lg border border-[#262626]">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Total Billed</div>
                <div className="font-mono font-semibold text-white mt-0.5">
                  {formatCurrency(selectedInvoice.totalAmount)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Already Paid</div>
                <div className="font-mono font-semibold text-emerald-400 mt-0.5">
                  {formatCurrency(selectedInvoice.amountPaid || 0)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase font-medium">Remaining Due</div>
                <div className="font-mono font-semibold text-[#D4AF37] mt-0.5">
                  {formatCurrency(
                    Math.max(
                      0,
                      selectedInvoice.totalAmount - (selectedInvoice.amountPaid || 0)
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Payment Settlement Status Choice */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Select Settlement Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePaymentStatusChange("Paid")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    paymentStatus === "Paid"
                      ? "bg-emerald-500 text-[#121212] border-emerald-500 shadow-md shadow-emerald-500/15"
                      : "bg-[#181818] text-zinc-400 border-[#2E2E2E] hover:text-white"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Full Settlement (Paid)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentStatusChange("Partial")}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    paymentStatus === "Partial"
                      ? "bg-amber-500 text-[#121212] border-amber-500 shadow-md shadow-amber-500/15"
                      : "bg-[#181818] text-zinc-400 border-[#2E2E2E] hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Partial Payment (Partial)</span>
                </button>
              </div>
            </div>

            {/* Partial payments input if status is "Partial" */}
            {paymentStatus === "Partial" && (
              <div className="p-3 rounded-lg bg-[#181818] border border-amber-500/30 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                    <span>Partial Payment Amount (₹)</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[11px] text-zinc-400">
                    Remaining Due:{" "}
                    {formatCurrency(
                      Math.max(
                        0,
                        selectedInvoice.totalAmount - (selectedInvoice.amountPaid || 0)
                      )
                    )}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400 font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={partialAmount}
                    onChange={(e) => {
                      setPartialAmount(e.target.value);
                      setAmount(e.target.value);
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-2 bg-[#121212] border border-amber-500/50 rounded-lg text-sm font-mono font-bold text-white outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  The transaction will record this partial inflow and update invoice status to{" "}
                  <strong className="text-amber-400">Partial</strong> with incremented amountPaid.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-[#141414] border border-[#262626] p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-zinc-400">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Direct Inflow Mode. To link a client invoice, click <span className="text-emerald-400 font-semibold">"Log Payment"</span> on any invoice in the list below.
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
              {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} in database
            </span>
          </div>
        )}

        {/* 2. Amount Input (if not partial payment mode) */}
        {paymentStatus !== "Partial" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Inflow Amount (₹) <span className="text-emerald-400">*</span>
              </label>
              {selectedInvoice && (
                <span className="text-xs text-zinc-500">
                  Full balance due:{" "}
                  {formatCurrency(
                    Math.max(
                      0,
                      selectedInvoice.totalAmount - (selectedInvoice.amountPaid || 0)
                    )
                  )}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400 font-semibold text-lg">
                ₹
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-lg font-mono font-semibold text-white placeholder-zinc-600 outline-none transition-all"
              />
            </div>

            {/* Quick presets */}
            <div className="flex items-center flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-zinc-500 mr-1">Quick Add:</span>
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className="px-2 py-0.5 rounded-md bg-[#222222] hover:bg-[#2A2A2A] hover:text-emerald-400 text-zinc-400 text-xs font-mono transition-colors border border-[#2A2A2A]"
                >
                  ₹{preset.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Description & Client / Source Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Income Description <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly Retainer, Milestone #2 Release"
              className="w-full px-3.5 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Source / Client
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Building className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Acme Corp, Stripe Wire, Consulting Client"
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* 4. Category & Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Revenue Category <span className="text-emerald-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Custom</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400">
                <Tag className="w-4 h-4" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white outline-none transition-all cursor-pointer appearance-none"
              >
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#181818] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Inflow Date <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-white outline-none transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Add Custom Category Inline Box */}
        {showCustomCatInput && (
          <div className="rounded-xl bg-[#141414] border border-emerald-500/30 p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>New Custom Revenue Category (Persisted to Firestore)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCustomCatInput(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>

            {categoryError && (
              <p className="text-xs text-rose-400">{categoryError}</p>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Affiliate Royalties, Enterprise Retainer, Grant"
                className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] focus:border-emerald-500 rounded-lg text-xs text-white placeholder-zinc-600 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomCategory(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomCategory}
                disabled={addingCategory || !newCategoryName.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#121212] font-semibold text-xs transition-colors flex items-center space-x-1 disabled:opacity-50"
              >
                {addingCategory ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#121212]" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 text-[#121212]" />
                    <span>Save to Firestore</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Notes / Bank Reference / Wire Details (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Wire confirmation #WIRE-88912, Received via Silicon Valley Bank"
            className="w-full px-4 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#121212] font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#121212]" />
              <span>Executing Firestore Transaction...</span>
            </>
          ) : (
            <>
              <IndianRupee className="w-4 h-4 text-[#121212]" />
              <span>
                {selectedInvoice
                  ? `Execute Sync Transaction for ${selectedInvoice.invoiceNumber}`
                  : "Record Revenue Inflow"}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
