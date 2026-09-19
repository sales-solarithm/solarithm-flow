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
        setErrorMessage(res.error || "Access Denied: Admin or Owner clearance required.");
      }
    } catch {
      setErrorMessage("Access Denied: Admin or Owner clearance required.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-[#D4AF37] selection:text-[#121212]">
      {/* Background Decorative Ambient Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Lock Container Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] shadow-2xl p-8 sm:p-10 space-y-7 backdrop-blur-sm">
          {/* Brand Header */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center text-black shadow-xl shadow-[#D4AF37]/20">
              <ShieldCheck className="w-7 h-7 text-black" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl font-bold uppercase text-white tracking-wider">SOLARITHM</span>
                <span className="text-xs px-2 py-0.5 rounded border border-[#D4AF37] text-[#D4AF37] font-medium">
                  Flow
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Cash Flow Architecture &amp; Invoices
              </p>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="rounded-xl bg-rose-950/40 border border-rose-600/50 p-4 text-xs text-rose-300 flex items-start space-x-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-rose-200">Authentication Failed</p>
                <p className="text-rose-300/90 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="lock-email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4 text-zinc-400" />
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
                  placeholder="Enter your authorized corporate email"
                  className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-xl text-sm text-white placeholder-zinc-600 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C345] disabled:opacity-50 disabled:cursor-not-allowed text-[#121212] font-bold text-sm shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#121212]" />
                  <span>Verifying Clearance...</span>
                </>
              ) : (
                <>
                  <span>Access Flow</span>
                  <ArrowRight className="w-4 h-4 text-[#121212]" />
                </>
              )}
            </button>
          </form>

          {/* Terminal Clearance Policy */}
          <div className="pt-2 border-t border-[#242424] text-center">
            <div className="flex items-center justify-center space-x-1.5 text-[11px] text-zinc-500">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Admin or Owner clearance required for system entry</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <p className="text-center text-[11px] text-zinc-600 mt-6">
          Solarithm Flow • Protected Financial Infrastructure
        </p>
      </div>
    </div>
  );
}
