"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cpu, Mail, Lock, User, AlertCircle, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";

export default function BrutalistSignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("ERR_REQUIRED: All registration fields must be completed.");
      setLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("ERR_INVALID_EMAIL: Enter a valid email format.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("ERR_PASSWORD_LENGTH: Password minimum threshold is 6 characters.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("ERR_MISMATCH: Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userName", formData.name);
      localStorage.setItem("userEmail", formData.email);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERR_REGISTRATION_FAILED: Registration rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid-bg flex items-center justify-center p-4 font-mono py-10">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Logo */}
        <div className="text-center">
          <Link href="/landing" className="inline-flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center bg-[#7C3AED] text-white border-2 border-current">
              <Cpu className="h-5 w-5" />
            </div>
            <span className="text-lg font-black tracking-widest uppercase">
              STUDYMET.AI <span className="text-[#7C3AED]">// SYS.INT</span>
            </span>
          </Link>
        </div>

        {/* SignUp Box */}
        <div className="border-2 border-current bg-background p-6 sm:p-8 brutalist-card-static shadow-[6px_6px_0px_var(--border)]">
          <div className="flex items-center justify-between border-b-2 border-current pb-4 mb-6">
            <div>
              <span className="text-[10px] tracking-widest uppercase opacity-70 block">// REGISTRATION_MANIFEST</span>
              <h1 className="text-xl font-black uppercase tracking-tight">CREATE COMPUTE ACCOUNT</h1>
            </div>
            <span className="bg-[#7C3AED] text-white text-[9px] font-bold px-2 py-0.5 uppercase">
              FREE TIER
            </span>
          </div>

          {error && (
            <div className="mb-6 border-2 border-red-600 bg-red-500/10 p-3 text-xs font-mono text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase block mb-1 font-bold">
                // STUDENT_NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="brutalist-input pl-10"
                  placeholder="Alex Mercer"
                  disabled={loading}
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase block mb-1 font-bold">
                // USER_EMAIL
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="brutalist-input pl-10"
                  placeholder="alex@university.edu"
                  disabled={loading}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase block mb-1 font-bold">
                // PASSWORD (MIN 6 CHARS)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="brutalist-input pl-10"
                  placeholder="••••••••••••"
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="text-[10px] font-mono tracking-widest uppercase block mb-1 font-bold">
                // CONFIRM_PASSWORD
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="brutalist-input pl-10"
                  placeholder="••••••••••••"
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
              </div>
            </div>

            {/* Included Tier Features */}
            <div className="border-2 border-current bg-current/5 p-3 text-xs space-y-1.5 my-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#7C3AED] block">// INCLUDED IN FREE TIER:</span>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#7C3AED]" />
                <span>Unlimited PDF/Doc note uploads</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#7C3AED]" />
                <span>Sub-5ms AI Retrieval Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#7C3AED]" />
                <span>Live Quiz Generator &amp; Competitions</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="brutalist-btn-orange w-full justify-center py-3 text-xs font-bold mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  INITIALIZING ACCOUNT...
                </>
              ) : (
                <>
                  REGISTER &amp; INITIALIZE →
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-4 border-t-2 border-current/20 text-center space-y-2 text-xs">
            <p className="opacity-80">
              ALREADY REGISTERED?{" "}
              <Link href="/login" className="text-[#7C3AED] font-bold hover:underline">
                LOG IN HERE
              </Link>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/landing" className="text-xs font-mono tracking-widest uppercase opacity-70 hover:opacity-100 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5 text-[#7C3AED]" />
            RETURN TO LANDING PAGE
          </Link>
        </div>

      </div>
    </div>
  );
}
