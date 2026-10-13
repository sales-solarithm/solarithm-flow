"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Menu,
  X,
  Wallet,
} from "lucide-react";
import { useAuth, AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";

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

  const currentPath =
    propCurrentPath ??
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const onNavigate =
    propOnNavigate ??
    ((path: string) => {
      if (typeof window !== "undefined") {
        window.location.href = path;
      }
    });

  const navItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Incomes", path: "/incomes", icon: ArrowUpCircle, activeColor: "text-emerald-400" },
    { name: "Expenses", path: "/expenses", icon: ArrowDownCircle, activeColor: "text-rose-400" },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col selection:bg-[#D4AF37] selection:text-black">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-[#262626] bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo / Brand */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer"
            onClick={() => onNavigate("/")}
          >
            <div className="w-7 h-7 rounded-md bg-[#D4AF37] flex items-center justify-center text-black shrink-0">
              <Wallet className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-sm tracking-wider uppercase font-mono">
                SOLARITHM
              </span>
              <span className="text-xs px-1 py-0.5 rounded border border-[#D4AF37]/50 text-[#D4AF37] font-semibold">
                FLOW
              </span>
            </div>
          </div>

          {/* Desktop 3-Tab Minimal Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? currentPath === "/" || currentPath === ""
                  : currentPath.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-[#1E1E1E] text-white border border-[#333333]"
                      : "text-zinc-400 hover:text-white hover:bg-[#181818]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive && item.activeColor ? item.activeColor : "text-zinc-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Top Right: Active Owner Email + Lock Button */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            {user && (
              <div className="flex items-center space-x-2.5">
                <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[200px]" title={user.email}>
                  {user.email}
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#1C1C1C] text-[#D4AF37] border border-[#2E2E2E]">
                  Owner
                </span>
                <button
                  onClick={logout}
                  title="Lock Terminal"
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#181818] border border-[#262626] hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-zinc-400" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-[#1E1E1E]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#262626] bg-[#141414] px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/"
                  ? currentPath === "/" || currentPath === ""
                  : currentPath.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate(item.path);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-left ${
                    isActive
                      ? "bg-[#1E1E1E] text-white border border-[#333333]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {user && (
              <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[200px]">
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-2 py-1 rounded bg-[#1E1E1E] border border-[#2E2E2E] text-zinc-300"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}

export default function AppShell(props: AppShellProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShellContent {...props} />
      </ToastProvider>
    </AuthProvider>
  );
}
