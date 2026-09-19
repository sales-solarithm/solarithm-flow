import "./globals.css";
import React from "react";
import AppShell from "./AppShell";

export const metadata = {
  title: "Solarithm Flow",
  description: "Enterprise Cash Flow Architecture & Invoices",
};

export default function RootLayout({
  children,
  currentPath,
  onNavigate,
}: {
  children: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#121212] text-zinc-100 selection:bg-[#D4AF37] selection:text-[#121212]">
        <AppShell currentPath={currentPath} onNavigate={onNavigate}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
