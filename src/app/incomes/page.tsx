"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpCircle, SlidersHorizontal } from "lucide-react";
import { Income, Invoice } from "@/types";
import { subscribeIncomes, subscribeInvoices } from "@/lib/incomeService";
import { IncomeForm } from "@/components/IncomeForm";
import { RecentInvoicesList } from "@/components/RecentInvoicesList";
import { IncomeList } from "@/components/IncomeList";
import { CategoryManagerModal } from "@/components/CategoryManagerModal";

export default function IncomesPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Subscribe to real-time Incomes
    const unsubIncomes = subscribeIncomes((incs) => {
      setIncomes(incs);
      setLoading(false);
    });

    // 2. Subscribe to real-time Salary Studio Invoices
    const unsubInvoices = subscribeInvoices((invs) => {
      setInvoices(invs);
      setInvoicesLoading(false);
    });

    return () => {
      unsubIncomes();
      unsubInvoices();
    };
  }, []);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    // Smoothly scroll to the Log Inflow form
    const formEl = document.getElementById("log-inflow-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#262626]">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate?.("/")}
            className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-zinc-400 hover:text-white border border-[#2E2E2E] transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
                <span>Revenue Inflows</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manual inflow logging and live invoice synchronization with Firestore
            </p>
          </div>
        </div>

        {/* Primary Action: Manage Categories */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-[#181818] hover:bg-[#222] border border-[#2E2E2E] flex items-center space-x-2 transition-colors shadow-sm cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manage Categories</span>
          </button>
        </div>
      </div>

      {/* Unified View Layout */}
      <div className="space-y-8">
        {/* 1. Log Inflow Form (at top) */}
        <div>
          <IncomeForm
            invoices={invoices}
            selectedInvoiceId={selectedInvoiceId}
            onClearSelectedInvoice={() => setSelectedInvoiceId(null)}
            onIncomeLogged={() => {}}
            onInvoiceUpdated={() => {}}
          />
        </div>

        {/* 2. Recent Client Invoices List (Directly below Log Inflow form) */}
        <div>
          <RecentInvoicesList
            invoices={invoices}
            selectedInvoiceId={selectedInvoiceId}
            onSelectInvoice={handleSelectInvoice}
            loading={invoicesLoading}
          />
        </div>

        {/* 3. Transaction History Table (Directly below Recent Invoices) */}
        <div>
          <IncomeList incomes={incomes} />
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        defaultTab="income"
        incomes={incomes}
      />
    </div>
  );
}
