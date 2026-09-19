import React, { useState } from "react";
import { LayoutDashboard, Receipt, ArrowDownCircle, ArrowUpCircle, ShieldCheck, Lock, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface RootLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function RootLayout({ children, currentPath, onNavigate }: RootLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

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
          <nav className="hidden md:flex items-center space-x-1 bg-[#1A1A1A] p-1 rounded-xl border border-[#2A2A2A]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#D4AF37] text-[#121212] font-semibold shadow-md shadow-[#D4AF37]/20"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-[#252525]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User Session & Terminal Lock (Firebase badge completely deleted) */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {user && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-[#2E2E2E]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-zinc-300 font-medium">{user.email}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-rose-300 bg-[#1A1A1A] hover:bg-rose-950/30 border border-[#2E2E2E] hover:border-rose-900/40 transition-colors cursor-pointer"
                  title="Lock Terminal Session"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#1E1E1E] text-zinc-300 hover:text-[#D4AF37] border border-[#2A2A2A]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#2A2A2A] bg-[#161616] px-4 pt-2 pb-4 space-y-2">
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#D4AF37] text-[#121212] font-semibold"
                      : "text-zinc-300 hover:bg-[#202020] hover:text-[#D4AF37]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
              );
            })}
            {user && (
              <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between text-xs text-zinc-400 px-2">
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
