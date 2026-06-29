"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { BrainCircuit, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { registerUser } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await registerUser(name, email, password);

      // Automatically log in the user on success
      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInRes?.error) {
        throw new Error("Registration successful, but auto-login failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6">
      <Link
        href="/upload"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <img src="/icon.png" alt="AI Coach Logo" className="w-16 h-16 rounded-2xl shadow-xl shadow-indigo-500/20" />
          </div>
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-zinc-400 text-sm mt-1">Start your AI interview journey today.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 outline-none"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 outline-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email.length > 0 && (
              <div className="mt-3 space-y-1 text-xs">
                <p className={`${isEmailValid ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {isEmailValid ? '✓' : '○'} Valid email format
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 pr-12 text-white focus:border-indigo-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Validation UI */}
            {password.length > 0 && (
              <div className="mt-3 space-y-1 text-xs">
                <p className={`${password.length >= 8 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {password.length >= 8 ? '✓' : '○'} At least 8 characters
                </p>
                <p className={`${/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                </p>
                <p className={`${/[a-z]/.test(password) ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                </p>
                <p className={`${/\d/.test(password) ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {/\d/.test(password) ? '✓' : '○'} One number
                </p>
                <p className={`${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'} One special character
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !isEmailValid || !isPasswordValid}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign Up
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
