"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useAuthService } from "@/hooks/auth";
import { message } from "antd";

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuthService();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      message.error("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      message.error("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      await registerUser({
        name,
        email,
        password,
        role,
      });

      message.success("Account created successfully! Please sign in.");
      router.push("/auth/login");
    } catch (err: any) {
      message.error(err?.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
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
            Create StockWise Account
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Set up your organization credentials to manage inventory & sales
          </p>
        </div>

        {/* Register Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Work Email
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Initial Account Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition cursor-pointer"
                >
                  <option value="manager">Store Manager (Inventory & Sales)</option>
                  <option value="admin">Administrator (Full System Control)</option>
                  <option value="employee">Cashier Employee (POS Terminal Only)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F42C0] py-3 text-xs font-bold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <Link href="/auth/login" className="font-semibold text-[#0F42C0] hover:underline cursor-pointer">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
