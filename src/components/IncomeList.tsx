import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  Trash2,
  Calendar,
  Building,
  Tag,
  FileCheck2,
  Loader2,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Income } from "../types";
import { getIncomeCategoryColor, deleteIncomeFromFirestore } from "../lib/incomeService";
import { formatCurrency } from "../lib/formatters";

interface IncomeListProps {
  incomes: Income[];
}

export function IncomeList({ incomes }: IncomeListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    incomes.forEach((inc) => {
      if (inc.category) cats.add(inc.category);
    });
    return Array.from(cats);
  }, [incomes]);

  // Filter & sort
  const filteredIncomes = useMemo(() => {
    return incomes
      .filter((item) => {
        const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
        const matchesQuery =
          searchQuery.trim() === "" ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.linkedInvoiceId && item.linkedInvoiceId.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [incomes, selectedCategory, searchQuery, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this income record?")) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteIncomeFromFirestore(id);
    } catch (err) {
      console.error("Failed to delete income:", err);
      alert("Failed to delete income from Firestore.");
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
              <span>Logged Inflow Transactions</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#252525] text-emerald-400 font-mono border border-[#333333]">
                {filteredIncomes.length} Records
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live revenue records linked to Salary Studio or recorded directly
            </p>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-zinc-300 text-xs font-medium border border-[#2E2E2E] transition-colors flex items-center space-x-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Date: {sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
          </button>
        </div>

        {/* Search & Category Pills */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, invoice #, description, wire ref..."
              className="w-full pl-9 pr-4 py-2 bg-[#121212] border border-[#2E2E2E] focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-600 outline-none"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === "ALL"
                  ? "bg-emerald-500 text-[#121212] font-semibold shadow-sm"
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
                    ? "bg-emerald-500 text-[#121212] font-semibold"
                    : "bg-[#1E1E1E] text-zinc-400 hover:text-white border border-[#2C2C2C]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getIncomeCategoryColor(cat) }}
                />
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredIncomes.length === 0 ? (
        <div className="py-12 px-4 text-center text-zinc-500 text-xs space-y-2">
          <p className="text-zinc-400 font-medium">No matching incomes found</p>
          <p className="text-zinc-600">Log a new revenue inflow using the form above.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="w-full overflow-x-auto">
            <table className="hidden md:table w-full text-left text-sm text-zinc-300">
              <thead className="bg-[#141414] text-xs uppercase tracking-wider text-zinc-400 border-b border-[#262626]">
                <tr>
                  <th className="py-3 px-5 font-semibold">Date</th>
                  <th className="py-3 px-5 font-semibold">Source / Client</th>
                  <th className="py-3 px-5 font-semibold">Description</th>
                  <th className="py-3 px-5 font-semibold">Category</th>
                  <th className="py-3 px-5 font-semibold">Linked Invoice</th>
                  <th className="py-3 px-5 font-semibold text-right">Inflow Amount</th>
                  <th className="py-3 px-5 font-semibold text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {filteredIncomes.map((item) => {
                  const catColor = getIncomeCategoryColor(item.category);
                  const isDeleting = deletingId === item.id;
                  const isInvoiceLinked = Boolean(item.linkedInvoiceId);

                  return (
                    <tr key={item.id} className="hover:bg-[#1E1E1E]/80 transition-colors">
                      <td className="py-3 px-5 text-xs text-zinc-400 whitespace-nowrap font-mono">
                        {item.date}
                      </td>
                      <td className="py-3 px-5 font-medium text-white max-w-xs truncate">
                        <div className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{item.source}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-zinc-300 max-w-xs truncate">
                        <div>{item.description}</div>
                        {item.notes && <div className="text-[11px] text-zinc-500 truncate">{item.notes}</div>}
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
                      <td className="py-3 px-5 whitespace-nowrap">
                        {isInvoiceLinked ? (
                          <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-[#202020] border border-[#333] text-xs font-mono text-[#D4AF37]">
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>Linked</span>
                            {item.paymentType && (
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                  item.paymentType === "Full"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}
                              >
                                {item.paymentType}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">Direct Inflow</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        +{formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          title="Delete income"
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

          {/* Mobile Touch-Friendly Card View */}
          <div className="block md:hidden divide-y divide-[#262626] p-4 space-y-3">
            {filteredIncomes.map((item) => {
              const catColor = getIncomeCategoryColor(item.category);
              const isDeleting = deletingId === item.id;
              const isInvoiceLinked = Boolean(item.linkedInvoiceId);

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
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center space-x-1">
                      <Building className="w-3 h-3 text-zinc-500" />
                      <span>{item.source}</span>
                    </p>
                    {item.notes && <p className="text-xs text-zinc-500 mt-1">{item.notes}</p>}
                  </div>

                  <div className="pt-2 border-t border-[#282828] flex items-center justify-between">
                    <div>
                      {isInvoiceLinked ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-[#D4AF37] font-mono">
                          <FileCheck2 className="w-3 h-3" />
                          <span>Linked ({item.paymentType || "Settlement"})</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-500">Direct Inflow</span>
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      +{formatCurrency(item.amount)}
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
