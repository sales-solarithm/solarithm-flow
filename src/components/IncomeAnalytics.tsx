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
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  IndianRupee,
  FileCheck2,
  Building,
  Layers,
} from "lucide-react";
import { Income, Invoice, CategoryDistribution } from "../types";
import { getIncomeCategoryColor } from "../lib/incomeService";
import { formatCurrency, formatRupeeTick } from "../lib/formatters";

interface IncomeAnalyticsProps {
  incomes: Income[];
  invoices: Invoice[];
}

export function IncomeAnalytics({ incomes, invoices }: IncomeAnalyticsProps) {
  const {
    categoryData,
    totalInflow,
    invoicedInflow,
    directInflow,
    paidInvoicesCount,
    avgInflow,
  } = useMemo(() => {
    let grandTotal = 0;
    let invTotal = 0;
    let dirTotal = 0;
    const catMap: Record<string, { total: number; count: number }> = {};

    for (const inc of incomes) {
      const amt = Number(inc.amount) || 0;
      grandTotal += amt;
      if (inc.linkedInvoiceId) {
        invTotal += amt;
      } else {
        dirTotal += amt;
      }

      const cat = inc.category || "Other Inflow";
      if (!catMap[cat]) {
        catMap[cat] = { total: 0, count: 0 };
      }
      catMap[cat].total += amt;
      catMap[cat].count += 1;
    }

    const dist: CategoryDistribution[] = Object.entries(catMap).map(
      ([cat, info], idx) => ({
        category: cat,
        total: Number(info.total.toFixed(2)),
        count: info.count,
        percentage: grandTotal > 0 ? Number(((info.total / grandTotal) * 100).toFixed(1)) : 0,
        color: getIncomeCategoryColor(cat, idx),
      })
    );

    dist.sort((a, b) => b.total - a.total);

    const paidInvs = invoices.filter((i) => i.status === "Paid").length;
    const avg = incomes.length > 0 ? grandTotal / incomes.length : 0;

    return {
      categoryData: dist,
      totalInflow: grandTotal,
      invoicedInflow: invTotal,
      directInflow: dirTotal,
      paidInvoicesCount: paidInvs,
      avgInflow: avg,
    };
  }, [incomes, invoices]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: CategoryDistribution = payload[0].payload;
      return (
        <div className="rounded-xl bg-[#181818] border border-emerald-500/50 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center space-x-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-xs font-semibold text-white">{data.category}</span>
          </div>
          <div className="mt-1 text-sm font-bold text-emerald-400 font-mono">
            +{formatCurrency(data.total)}
          </div>
          <div className="text-[11px] text-zinc-400">
            {data.percentage}% of total ({data.count} inflows)
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl bg-[#181818] border border-[#2E2E2E] p-3 shadow-2xl">
          <p className="text-xs font-semibold text-zinc-300">{data.category}</p>
          <p className="text-sm font-bold text-emerald-400 font-mono">
            +{formatCurrency(data.total)}
          </p>
          <p className="text-[11px] text-zinc-400">{data.count} inflows</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflows */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Inflow</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            +{formatCurrency(totalInflow)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 font-mono">
            {incomes.length} recorded payments
          </p>
        </div>

        {/* Invoice Sync Settled */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Invoiced Settled</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-[#D4AF37]">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
            {formatCurrency(invoicedInflow)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {paidInvoicesCount} of {invoices.length} invoices paid
          </p>
        </div>

        {/* Direct Inflow */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Direct Inflow</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-sky-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
            {formatCurrency(directInflow)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Non-invoiced retainers & wires</p>
        </div>

        {/* Average Ticket */}
        <div className="rounded-xl bg-[#181818] border border-[#2A2A2A] p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Average Ticket</span>
            <div className="p-1.5 rounded-lg bg-[#222222] text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-white">
            {formatCurrency(avgInflow)}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Mean inflow amount</p>
        </div>
      </div>

      {incomes.length === 0 ? (
        <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#222222] border border-[#2E2E2E] flex items-center justify-center mx-auto text-emerald-400">
            <PieIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Incomes Logged Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Log an income or execute a two-way settlement transaction against a Salary Studio invoice to see Recharts revenue analytics.
          </p>
        </div>
      ) : (
        /* Recharts Analytics Grids */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-[#181818] border border-[#2A2A2A] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center space-x-2">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Revenue Stream Distribution
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {categoryData.length} Streams
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Relative percentage distribution across dynamic revenue streams.
              </p>
            </div>

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
                      <Cell key={`cell-inc-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Pills */}
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

          {/* Bar Chart (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl bg-[#181818] border border-[#2A2A2A] p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 pb-3 border-b border-[#262626]">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Inflows by Stream</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Ranked breakdown of incoming revenue streams.
              </p>
            </div>

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
                    width={80}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#10B981">
                    {categoryData.map((entry, index) => (
                      <Cell key={`bar-inc-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs text-zinc-400">
              <span>Cumulative Revenue</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                +{formatCurrency(totalInflow)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
