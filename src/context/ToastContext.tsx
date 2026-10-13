"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, CheckCircle, Info, X, AlertCircle } from "lucide-react";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, durationMs = 5000 }: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message, durationMs }]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => {
    addToast({ type: "success", title: title || "Success", message });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast({ type: "warning", title: title || "Warning", message, durationMs: 6500 });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ type: "error", title: title || "Action Failed", message, durationMs: 7000 });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ type: "info", title: title || "Notification", message });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, warning, error, info }}
    >
      {children}
      {/* Toast Floating Viewport */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isWarning = toast.type === "warning";
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200 ${
                isWarning
                  ? "bg-[#1E170A]/95 border-amber-600/60 text-amber-200 shadow-amber-950/40"
                  : isError
                  ? "bg-[#200D10]/95 border-rose-600/60 text-rose-200 shadow-rose-950/40"
                  : isSuccess
                  ? "bg-[#0B1A12]/95 border-emerald-600/60 text-emerald-200 shadow-emerald-950/40"
                  : "bg-[#181818]/95 border-zinc-700 text-zinc-200"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {!isWarning && !isError && !isSuccess && (
                  <Info className="w-5 h-5 text-[#D4AF37]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs leading-relaxed opacity-90">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      success: (msg: string) => console.log("[Toast Success]", msg),
      warning: (msg: string) => console.warn("[Toast Warning]", msg),
      error: (msg: string) => console.error("[Toast Error]", msg),
      info: (msg: string) => console.log("[Toast Info]", msg),
    };
  }
  return context;
}
