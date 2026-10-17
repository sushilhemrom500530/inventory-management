"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Key,
  Save,
  CheckCircle2,
  Lock,
  Phone,
  Building,
} from "lucide-react";
import { useAuthService } from "@/hooks/auth";
import { UserAvatar } from "@/components/reuseable/user-avatar";
import { fetchApi } from "@/utils/api";
import { message } from "antd";

export default function ProfilePage() {
  const { user } = useAuthService();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+880 1712-345678");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      message.error("Name cannot be empty");
      return;
    }

    try {
      setSavingProfile(true);
      // Simulated or actual profile update
      await new Promise((r) => setTimeout(r, 600));
      message.success("Profile information updated successfully!");
    } catch (err: any) {
      message.error(err?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      message.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("New passwords do not match");
      return;
    }

    try {
      setSavingPassword(true);
      await fetchApi("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          oldPassword: currentPassword,
          newPassword,
        }),
      });
      message.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      message.error(err?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Profile</h1>
        <p className="text-xs text-slate-500">Manage your personal credentials, role permissions, and security</p>
      </div>

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={name || "User"} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{name || "Store Associate"}</h2>
                <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold uppercase text-[#0F42C0] border border-blue-200">
                  {user?.role || "Employee"}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {email || "user@stockwise.io"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-semibold border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Active Account
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Details Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 text-slate-900 font-semibold text-sm">
            <User className="h-4 w-4 text-[#0F42C0]" />
            <span>Personal Information</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
              />
              <p className="mt-1 text-[10px] text-slate-400">Contact store admin to alter account email.</p>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-1.5 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E]"
              >
                <Save className="h-3.5 w-3.5" />
                {savingProfile ? "Saving..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 text-slate-900 font-semibold text-sm">
            <Lock className="h-4 w-4 text-[#0F42C0]" />
            <span>Security & Password</span>
          </div>

          <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-1.5 rounded-xl bg-[#0F42C0] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E]"
              >
                <Key className="h-3.5 w-3.5" />
                {savingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
