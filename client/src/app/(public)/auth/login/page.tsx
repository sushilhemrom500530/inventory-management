"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Layers,
} from "lucide-react";
import { useAuthService } from "@/hooks/auth";
import { message } from "antd";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuthService();

  const [email, setEmail] = useState("admin@stockwise.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      message.error("Please fill in both email and password");
      return;
    }

    try {
      setLoading(true);
      await loginUser({ email, password });
      message.success("Welcome back! Redirecting to dashboard...");
      const targetUrl =
        (typeof window !== "undefined" &&
          new URLSearchParams(window.location.search).get("callbackUrl")) ||
        "/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = targetUrl;
      } else {
        router.push(targetUrl);
      }
    } catch (err: any) {
      message.error(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F42C0] text-white shadow-md shadow-[#0F42C0]/20">
            <Layers className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
            STOCKWISE
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Sign in to your enterprise inventory management portal
          </p>
        </div>

        {/* Demo Credentials Quick Selector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs">
          <p className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#0F42C0]" /> Quick Demo Access (1-Click Fill):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoRole("admin@stockwise.com", "admin123")}
              className={`rounded-xl border p-2 text-center transition cursor-pointer ${
                email === "admin@stockwise.com"
                  ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <p className={`font-semibold ${email === "admin@stockwise.com" ? "text-[#0F42C0]" : "text-slate-800"}`}>Admin</p>
              <p className="text-[10px] text-slate-400">Full Access</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoRole("manager@stockwise.com", "manager123")}
              className={`rounded-xl border p-2 text-center transition cursor-pointer ${
                email === "manager@stockwise.com"
                  ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <p className={`font-semibold ${email === "manager@stockwise.com" ? "text-[#0F42C0]" : "text-slate-800"}`}>Manager</p>
              <p className="text-[10px] text-slate-400">Stock & POS</p>
            </button>

            <button
              type="button"
              onClick={() => setDemoRole("employee@stockwise.com", "employee123")}
              className={`rounded-xl border p-2 text-center transition cursor-pointer ${
                email === "employee@stockwise.com"
                  ? "border-[#0F42C0] bg-blue-50 text-[#0F42C0] font-bold shadow-sm"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <p className={`font-semibold ${email === "employee@stockwise.com" ? "text-[#0F42C0]" : "text-slate-800"}`}>Employee</p>
              <p className="text-[10px] text-slate-400">Cashier POS</p>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F42C0] py-3 text-xs font-bold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            <span>Don&apos;t have an account? </span>
            <Link href="/auth/register" className="font-semibold text-[#0F42C0] hover:underline cursor-pointer">
              Register new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
