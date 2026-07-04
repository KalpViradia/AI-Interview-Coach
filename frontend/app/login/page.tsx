"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") || "/dashboard";
      router.push(callbackUrl);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6">
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 2) {
            router.back();
          } else {
            router.push("/");
          }
        }}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <img src="/icon.png" alt="SkillMock Logo" className="w-16 h-16 rounded-2xl shadow-xl shadow-indigo-500/20" />
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in to continue your interview prep.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign In
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
