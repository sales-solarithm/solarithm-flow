/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import RootLayout from "./app/layout";
import HomePage from "./app/page";
import ExpensesPage from "./app/expenses/page";
import IncomesPage from "./app/incomes/page";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LockScreen } from "./components/LockScreen";

function AppContent() {
  const { isUnlocked } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  };

  // If locked, render the passwordless lock screen
  if (!isUnlocked) {
    return <LockScreen />;
  }

  const renderActiveRoute = () => {
    switch (currentPath) {
      case "/expenses":
        return <ExpensesPage onNavigate={handleNavigate} />;
      case "/incomes":
        return <IncomesPage onNavigate={handleNavigate} />;
      case "/":
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <RootLayout currentPath={currentPath} onNavigate={handleNavigate}>
      {renderActiveRoute()}
    </RootLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
