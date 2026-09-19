"use client";

import React, { useState } from "react";
import { LayoutDashboard, Receipt, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Lock, Menu, X } from "lucide-react";
import { useAuth, AuthProvider } from "../context/AuthContext";

interface AppShellProps {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

function AppShellContent({
  children,
  currentPath: propCurrentPath,
  onNavigate: propOnNavigate,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const currentPath = propCurrentPath ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const onNavigate = propOnNavigate ?? ((path: string) => {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  });

  const navItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Expenses", path: "/expenses", icon: ArrowDownCircle },
    { name: "Incomes", path: "/incomes", icon: ArrowUpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col selection:bg-[#D4AF37] selection:text-[#121212]">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#121212]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate("/")}>
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37] flex items-center justify-center text-black shrink-0">
              <Receipt className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white uppercase text-sm tracking-wider">SOLARITHM</span>
                <span className="text-xs px-1.5 py-0.5 rounded border border-[#D4AF37] text-[#D4AF37] font-medium">
                  Flow
                </span>
              </div>
              <p className="text-xs text-gray-400">Cash Flow Architecture &amp; Invoices</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E1E]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action / Security Clearance */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono uppercase tracking-wider text-[11px]">Authorized</span>
            </div>

            {user && (
              <div className="flex items-center space-x-3 text-xs border-l border-[#2A2A2A] pl-4">
                <span className="text-zinc-400 font-mono truncate max-w-[150px]">{user.email}</span>
                <button
                  onClick={logout}
                  title="Lock Terminal"
                  className="flex items-center space-x-1 px-2 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-zinc-400" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#2A2A2A] bg-[#161616] px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30"
                      : "text-zinc-300 hover:bg-[#202020]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {user && (
              <div className="pt-3 mt-2 border-t border-zinc-800 flex items-center justify-between text-xs px-2">
                <span className="truncate max-w-[200px] text-zinc-300">{user.email}</span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                >
                  Lock Terminal
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222222] bg-[#0E0E0E] py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Solarithm Flow • Enterprise Financial Terminal</p>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
              <span>Dark Charcoal (#121212) + Metallic Gold (#D4AF37)</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function AppShell(props: AppShellProps) {
  return (
    <AuthProvider>
      <AppShellContent {...props} />
    </AuthProvider>
  );
}
