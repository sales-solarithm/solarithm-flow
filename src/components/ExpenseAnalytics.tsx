import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { PieChart as PieIcon, BarChart3, TrendingDown, IndianRupee, Layers, Hash } from "lucide-react";
import { Expense, CategoryDistribution } from "../types";
import { getCategoryColor } from "../lib/expenseService";
import { formatCurrency, formatRupeeTick } from "../lib/formatters";

interface ExpenseAnalyticsProps {
  expenses: Expense[];
  categories: string[];
}

export function ExpenseAnalytics({ expenses, categories }: ExpenseAnalyticsProps) {
  // Aggregate category-wise distributions
  const { categoryData, totalOutflow, topCategory, avgExpense } = useMemo(() => {
    const totals: Record<string, { total: number; count: number }> = {};

    let grandTotal = 0;
    for (const exp of expenses) {
      const cat = exp.category || "Uncategorized";
      const amt = Number(exp.amount) || 0;
      grandTotal += amt;

      if (!totals[cat]) {
        totals[cat] = { total: 0, count: 0 };
      }
      totals[cat].total += amt;
      totals[cat].count += 1;
    }

    const dist: CategoryDistribution[] = Object.entries(totals).map(
      ([cat, info], idx) => ({
        category: cat,
        total: Number(info.total.toFixed(2)),
        count: info.count,
        percentage: grandTotal > 0 ? Number(((info.total / grandTotal) * 100).toFixed(1)) : 0,
        color: getCategoryColor(cat, idx),
      })
    );

    // Sort by total descending
    dist.sort((a, b) => b.total - a.total);

    const top = dist.length > 0 ? dist[0] : null;
    const avg = expenses.length > 0 ? grandTotal / expenses.length : 0;

    return {
      categoryData: dist,
      totalOutflow: grandTotal,
      topCategory: top,
      avgExpense: avg,
    };
  }, [expenses]);

  // Custom Dark/Gold Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: CategoryDistribution = payload[0].payload;
      return (
        <div className="rounded-xl bg-[#181818] border border-[#D4AF37]/50 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-xs font-semibold text-white">{data.category}</span>
          </div>
          <div className="mt-1 text-sm font-bold text-[#D4AF37] font-mono">
            {formatCurrency(data.total)}
          </div>
          <div className="text-[11px] text-zinc-400">
            {data.percentage}% of total ({data.count} transactions)
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Dark/Gold Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl bg-[#181818] border border-[#2E2E2E] p-3 shadow-2xl">
          <p className="text-xs font-semibold text-zinc-300">{data.category}</p>
          <p className="text-sm font-bold text-[#D4AF37] font-mono">
            {formatCurrency(data.total)}
          </p>
          <p className="text-[11px] text-zinc-400">{data.count} items</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Outflow */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Outflow</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-[#D4AF37]">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
            {formatCurrency(totalOutflow)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Live synchronized total</p>
        </div>

        {/* Card 2: Top Expense Category */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Top Category</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-[#D4AF37]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-xl font-bold text-[#D4AF37] truncate">
            {topCategory ? topCategory.category : "N/A"}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {topCategory ? `${formatCurrency(topCategory.total)} (${topCategory.percentage}%)` : "No records yet"}
          </p>
        </div>

        {/* Card 3: Transaction Count */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Entries Count</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-[#D4AF37]">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
            {expenses.length}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Recorded transactions</p>
        </div>

        {/* Card 4: Average Expense */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Average Ticket</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-[#D4AF37]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
            {formatCurrency(avgExpense)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Per transaction mean</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#222222] border border-[#2E2E2E] flex items-center justify-center mx-auto text-[#D4AF37]">
            <PieIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Expense Outflows Logged Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Log your first expense using the form to generate real-time Recharts category distribution analytics.
          </p>
        </div>
      ) : (
        /* Recharts Analytics Grids */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart: Category Share Distribution (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-[#181818] border border-[#2A2A2A] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center space-x-2">
                  <PieIcon className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-semibold text-white">
                    Category Distribution (Donut Chart)
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">
                  {categoryData.length} Tags Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Relative percentage distribution across dynamic expense categories.
              </p>
            </div>

            {/* Recharts Pie / Donut Chart */}
            <div className="h-64 sm:h-72 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={categoryData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="#181818"
                    strokeWidth={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Dynamic Category Legend Pills */}
            <div className="pt-3 border-t border-[#262626] flex flex-wrap gap-2">
              {categoryData.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[#202020] border border-[#2C2C2C] text-xs"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-zinc-200 font-medium">{item.category}</span>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart: Category Spend Ranking (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-3 border-b border-[#262626]">
                <BarChart3 className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-semibold text-white">Outflow by Category</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Comparative ranking of expenses per tag.
              </p>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-64 sm:h-72 w-full my-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis
                    type="number"
                    tickFormatter={(v) => formatRupeeTick(v)}
                    stroke="#555"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="#888"
                    fontSize={11}
                    width={75}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="total"
                    radius={[0, 6, 6, 0]}
                    fill="#D4AF37"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Total summary */}
            <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs text-zinc-400">
              <span>Cumulative Sum</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(totalOutflow)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
