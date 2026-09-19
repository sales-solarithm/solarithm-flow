import React, { useState, useMemo } from "react";
import { Search, Filter, Trash2, Calendar, Tag, FileText, ArrowUpDown, Smartphone, Loader2 } from "lucide-react";
import { Expense } from "../types";
import { getCategoryColor, deleteExpenseFromFirestore } from "../lib/expenseService";
import { formatCurrency } from "../lib/formatters";

interface ExpenseListProps {
  expenses: Expense[];
  categories: string[];
}

export function ExpenseList({ expenses, categories }: ExpenseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter and sort expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
        const matchesQuery =
          searchQuery.trim() === "" ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [expenses, selectedCategory, searchQuery, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteExpenseFromFirestore(id);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Failed to delete expense from Firestore.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-xl overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-[#262626] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center space-x-2">
              <span>Expense Transactions</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#252525] text-[#D4AF37] font-mono border border-[#333333]">
                {filteredExpenses.length} Records
              </span>
            </h3>
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-zinc-300 text-xs font-medium border border-[#2E2E2E] transition-colors flex items-center space-x-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Date: {sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by keyword, vendor, note..."
              className="w-full pl-9 pr-4 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-zinc-600 outline-none"
            />
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-[#D4AF37] text-[#121212] font-semibold shadow-sm shadow-[#D4AF37]/20"
                  : "bg-[#1E1E1E] text-zinc-400 hover:text-white border border-[#2C2C2C]"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  selectedCategory === cat
                    ? "bg-[#D4AF37] text-[#121212] font-semibold"
                    : "bg-[#1E1E1E] text-zinc-400 hover:text-white border border-[#2C2C2C]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getCategoryColor(cat) }}
                />
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="py-12 px-4 text-center text-zinc-500 text-xs space-y-2">
          <p className="text-zinc-400 font-medium">No matching expenses found</p>
          <p className="text-zinc-600">Try adjusting your category filter or search query.</p>
        </div>
      ) : (
        <>
          {/* 1. Desktop Data Table View (Hidden on mobile: hidden md:table) */}
          <div className="w-full overflow-x-auto">
            <table className="hidden md:table w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#141414] text-xs uppercase tracking-wider text-zinc-400 border-b border-[#262626]">
                <tr>
                  <th className="py-3 px-5 font-semibold">Date</th>
                  <th className="py-3 px-5 font-semibold">Description</th>
                  <th className="py-3 px-5 font-semibold">Category</th>
                  <th className="py-3 px-5 font-semibold">Notes / Reference</th>
                  <th className="py-3 px-5 font-semibold text-right">Amount</th>
                  <th className="py-3 px-5 font-semibold text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {filteredExpenses.map((item) => {
                  const catColor = getCategoryColor(item.category);
                  const isDeleting = deletingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-[#1E1E1E]/80 transition-colors">
                      <td className="py-3 px-5 text-xs text-zinc-400 whitespace-nowrap font-mono">
                        {item.date}
                      </td>
                      <td className="py-3 px-5 font-medium text-white max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span
                          className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                            borderColor: `${catColor}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: catColor }}
                          />
                          <span>{item.category}</span>
                        </span>
                      </td>
                      <td className="py-3 px-5 text-xs text-zinc-400 max-w-xs truncate">
                        {item.notes || <span className="text-zinc-600">—</span>}
                      </td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-[#D4AF37] whitespace-nowrap">
                        -{formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          title="Delete expense"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 2. Mobile Touch-Friendly Card View (Visible on mobile: block md:hidden) */}
          <div className="block md:hidden divide-y divide-[#262626] p-4 space-y-3">
            {filteredExpenses.map((item) => {
              const catColor = getCategoryColor(item.category);
              const isDeleting = deletingId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl bg-[#1E1E1E] p-4 border border-[#2A2A2A] shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${catColor}15`,
                        color: catColor,
                        borderColor: `${catColor}30`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: catColor }}
                      />
                      <span>{item.category}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-zinc-400 font-mono">{item.date}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting}
                        className="p-1 rounded-md text-zinc-500 hover:text-rose-400"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.description}</h4>
                    {item.notes && (
                      <p className="text-xs text-zinc-400 mt-0.5">{item.notes}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#282828] flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Outflow:</span>
                    <span className="font-mono text-sm font-bold text-[#D4AF37]">
                      -{formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
