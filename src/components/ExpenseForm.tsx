import React, { useState, useEffect } from "react";
import { Plus, Tag, Calendar, IndianRupee, FileText, Check, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { addCustomCategoryToFirestore, createExpenseInFirestore } from "../lib/expenseService";

interface ExpenseFormProps {
  categories: string[];
  onExpenseAdded?: () => void;
}

export function ExpenseForm({ categories, onExpenseAdded }: ExpenseFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<string>(categories[0] || "Software");
  const [date, setDate] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");

  // Custom Category Input State
  const [showCustomCatInput, setShowCustomCatInput] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [addingCategory, setAddingCategory] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Sync selected category if current selection gets deleted from Firestore
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(category)) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Quick preset amounts in INR
  const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000];

  const handleAddCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError("Please enter a category name");
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError("This category already exists");
      return;
    }

    try {
      setAddingCategory(true);
      setCategoryError(null);
      await addCustomCategoryToFirestore(trimmed);
      setCategory(trimmed);
      setNewCategoryName("");
      setShowCustomCatInput(false);
    } catch (err: any) {
      console.error("Error adding category:", err);
      setCategoryError(err.message || "Failed to save category to Firestore");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setSubmitError("Please enter a valid amount greater than 0");
      return;
    }
    if (!description.trim()) {
      setSubmitError("Please provide a description");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      await createExpenseInFirestore({
        amount: numAmount,
        description: description.trim(),
        category: category || "Uncategorized",
        date: date || today,
        notes: notes.trim(),
      });

      // Reset form
      setAmount("");
      setDescription("");
      setNotes("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      onExpenseAdded?.();
    } catch (err: any) {
      console.error("Error creating expense:", err);
      setSubmitError(err.message || "Failed to save expense to Firestore");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-xl overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-[#262626] bg-gradient-to-r from-[#181818] to-[#1C1C1C] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C711E] flex items-center justify-center text-[#121212] font-bold shadow-md shadow-[#D4AF37]/15">
            <IndianRupee className="w-5 h-5 text-[#121212]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
              Log Outflow Expense
            </h2>
            <p className="text-xs text-zinc-400">
              Manual outflow entry syncing live to Firestore
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/20">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Live Sync</span>
        </div>
      </div>

      <form onSubmit={handleSubmitExpense} className="p-6 space-y-5">
        {submitSuccess && (
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-600/40 p-3.5 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Expense recorded and synchronized to Firestore successfully!</span>
          </div>
        )}

        {submitError && (
          <div className="rounded-xl bg-rose-950/40 border border-rose-600/40 p-3.5 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Amount Input with Currency and Quick Presets */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
            Amount (₹) <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D4AF37] font-semibold text-lg">
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
              className="w-full pl-9 pr-4 py-3 bg-[#121212] border border-[#2E2E2E] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-lg font-mono font-semibold text-white placeholder-zinc-600 outline-none transition-all"
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
                className="px-2 py-0.5 rounded-md bg-[#222222] hover:bg-[#2A2A2A] hover:text-[#D4AF37] text-zinc-400 text-xs font-mono transition-colors border border-[#2A2A2A]"
              >
                ₹{preset.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
            Description <span className="text-[#D4AF37]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. AWS Serverless Hosting, Annual Domain Renewal"
              className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all"
            />
          </div>
        </div>

        {/* Category & Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dynamic Categories Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Category <span className="text-[#D4AF37]">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCustomCatInput(!showCustomCatInput)}
                className="text-xs text-[#D4AF37] hover:text-[#E5C345] font-medium flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Custom</span>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#D4AF37]">
                <Tag className="w-4 h-4" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-sm text-white outline-none transition-all appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#181818] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              Date <span className="text-[#D4AF37]">*</span>
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
                className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-sm text-white outline-none transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Add Custom Category Inline Box */}
        {showCustomCatInput && (
          <div className="rounded-xl bg-[#141414] border border-[#D4AF37]/30 p-4 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#D4AF37] flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5" />
                <span>New Custom Category (Persisted to Firestore)</span>
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
                placeholder="e.g. Legal, Office Rent, Logistics"
                className="flex-1 px-3 py-2 bg-[#1C1C1C] border border-[#333333] focus:border-[#D4AF37] rounded-lg text-xs text-white placeholder-zinc-600 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomCategory(e);
                  }
                }}
              />
              <button
                type="button"
                disabled={addingCategory}
                onClick={handleAddCustomCategory}
                className="px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#B89428] text-[#121212] font-semibold text-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
              >
                {addingCategory ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Save Category</span>
              </button>
            </div>
          </div>
        )}

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Notes / Vendor / Invoice (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Invoice #INV-2026-44, Paid via Corporate Card"
            className="w-full px-4 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-zinc-600 outline-none transition-all"
          />
        </div>

        {/* Submit Outflow Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89428] hover:from-[#E5C345] hover:to-[#D4AF37] text-[#121212] font-bold text-sm tracking-wide shadow-lg shadow-[#D4AF37]/20 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#121212]" />
              <span>Syncing to Firestore...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 text-[#121212]" />
              <span>Record Outflow Expense</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
