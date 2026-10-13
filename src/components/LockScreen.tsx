import React, { useState } from "react";
import { ShieldCheck, Mail, ArrowRight, AlertCircle, Loader2, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LockScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(cleanEmail);
      if (!res.success) {
        setErrorMessage(res.error || "Access Denied: Owner clearance required.");
      }
    } catch {
      setErrorMessage("Access Denied: Owner clearance required.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-[#D4AF37] selection:text-[#121212]">
      {/* Main Lock Container Card */}
      <div className="w-full max-w-sm">
        <div className="rounded-xl bg-[#181818] border border-[#262626] p-7 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-lg bg-[#D4AF37] flex items-center justify-center text-black">
              <ShieldCheck className="w-6 h-6 text-black" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg font-bold uppercase text-white tracking-wider">SOLARITHM</span>
                <span className="text-xs px-1.5 py-0.5 rounded border border-[#D4AF37] text-[#D4AF37] font-medium">
                  Flow
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Owner Cash Flow Terminal
              </p>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="lock-email"
                className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5"
              >
                Owner Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="lock-email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter partner / owner email"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#121212] border border-[#2E2E2E] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-lg text-xs text-white placeholder-zinc-600 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-[#D4AF37] hover:bg-[#E5C345] disabled:opacity-50 disabled:cursor-not-allowed text-[#121212] font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#121212]" />
                  <span>Verifying Clearance...</span>
                </>
              ) : (
                <>
                  <span>Access Terminal</span>
                  <ArrowRight className="w-4 h-4 text-[#121212]" />
                </>
              )}
            </button>
          </form>

          {/* Clearance Footer */}
          <div className="pt-3 border-t border-[#262626] text-center">
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-zinc-500">
              <Lock className="w-3.5 h-3.5" />
              <span>Owner clearance required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
