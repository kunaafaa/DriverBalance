"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Car, Lock, Mail, ChevronRight, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        // Pass a client-side identifier for rate limiting
        clientIp: email,
        redirect: false, // Handle redirect manually for better error UX
      });

      if (result?.error === "TOO_MANY_ATTEMPTS") {
        setError("Too many failed attempts. Please wait 15 minutes before trying again.");
        setLoading(false);
        return;
      }

      if (result?.error || !result?.ok) {
        setAttempts((prev) => prev + 1);
        // Generic message — never reveal which field is wrong
        setError("Invalid credentials. Please check your email and password.");
        setLoading(false);
        return;
      }

      // Success — redirect to dashboard
      window.location.href = "/";
    } catch {
      setError("A system error occurred. Please try again later.");
      setLoading(false);
    }
  };

  const isLockedOut = attempts >= 5;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1486497395400-7497a106b8a0?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0D0D0D] rounded-[40px] p-12 shadow-2xl shadow-black/50 overflow-hidden relative">
          {/* Brand */}
          <div className="flex flex-col items-center mb-12">
            <Logo className="mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Workshop Management Suite</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-start space-x-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs font-bold text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@drivermade.co"
                  disabled={isLockedOut || loading}
                  className="w-full pl-12 pr-4 py-4 bg-[#111111] rounded-2xl border border-[#1A1A1A] focus:bg-[#0D0D0D] focus:border-[#A855F7]/50 transition-all outline-none font-bold text-sm text-white placeholder:text-gray-600 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLockedOut || loading}
                  className="w-full pl-12 pr-4 py-4 bg-[#111111] rounded-2xl border border-[#1A1A1A] focus:bg-[#0D0D0D] focus:border-[#A855F7]/50 transition-all outline-none font-bold text-sm text-white placeholder:text-gray-600 disabled:opacity-50"
                />
              </div>
            </div>

            {isLockedOut ? (
              <div className="w-full py-5 bg-red-500/10 border border-red-500/30 text-red-400 font-black rounded-2xl text-center text-xs uppercase tracking-widest">
                Account Temporarily Locked
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-[#A855F7] text-white font-black rounded-2xl shadow-xl shadow-[#A855F7]/20 hover:bg-[#9333EA] hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <span>{loading ? "Authenticating..." : "Authorize Access"}</span>
                {!loading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            )}
          </form>

          <p className="text-center mt-12 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            © 2026 DriverMade Abu Dhabi · Restricted Access
          </p>
        </div>

        <p className="text-center mt-8 text-white/30 text-xs font-medium italic">
          High-performance tools for precision workshops.
        </p>
      </div>
    </div>
  );
}
