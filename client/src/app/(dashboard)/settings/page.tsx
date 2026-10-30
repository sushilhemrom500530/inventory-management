"use client";

import React, { useState } from "react";
import {
  Settings,
  Store,
  DollarSign,
  Cpu,
  Bell,
  Save,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { message } from "antd";
import Cookies from "js-cookie";
import { useAuthService } from "@/hooks/auth";
import RestrictedAccess from "@/components/reuseable/restricted-access";
import { useUserRole } from "@/context/role-context";

export default function SettingsPage() {
  const { user: currentUser } = useAuthService();
  const roleContext = useUserRole();
  const userRole = (roleContext?.role || currentUser?.role || "").toLowerCase();
  const isEmployee = roleContext?.isEmployee ?? (userRole === "employee");

  if (isEmployee) {
    return <RestrictedAccess featureName="Store & System Settings" />;
  }

  const [storeName, setStoreName] = useState("StockWise Smart Retail Hub");
  const [currency, setCurrency] = useState("USD ($)");
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(5);
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState<number>(10);
  const [aiServiceUrl, setAiServiceUrl] = useState("http://127.0.0.1:8000");
  const [enableAiVelocityAlerts, setEnableAiVelocityAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      message.success("System & Store configurations saved successfully!");
    }, 500);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-xs text-slate-500">
          Configure organization preferences, default taxation rates, and AI forecasting parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store & Currency Settings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 text-slate-900 font-semibold text-sm">
            <Store className="h-4 w-4 text-[#0F42C0]" />
            <span>Store & Regional Localization</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Organization / Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5 cursor-pointer">
                Display Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition cursor-pointer"
              >
                <option value="USD ($)">USD — United States Dollar ($)</option>
                <option value="BDT (৳)">BDT — Bangladeshi Taka (৳)</option>
                <option value="EUR (€)">EUR — Euro (€)</option>
                <option value="GBP (£)">GBP — British Pound (£)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Default Sales Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Default Low-Stock Safety Threshold
              </label>
              <input
                type="number"
                min="1"
                value={defaultLowStockThreshold}
                onChange={(e) => setDefaultLowStockThreshold(parseInt(e.target.value) || 5)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: AI & ML Engine Configuration */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-200 text-slate-900 font-semibold text-sm">
            <Cpu className="h-4 w-4 text-[#0F42C0]" />
            <span>AI / ML Microservice Integration</span>
          </div>

          <div className="mt-5 space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Python FastAPI Microservice Endpoint
              </label>
              <input
                type="text"
                value={aiServiceUrl}
                onChange={(e) => setAiServiceUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-900 focus:bg-white focus:border-[#0F42C0] focus:outline-none transition"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Connected to isolated Python FastAPI service with 4-second safety timeout and fallback.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-900">Enable Real-Time Velocity Alerts</p>
                <p className="text-[11px] text-slate-500">
                  Notify store associates when stock velocity indicates impending 7-day stockout
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableAiVelocityAlerts}
                onChange={(e) => setEnableAiVelocityAlerts(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0F42C0] focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#0F42C0] px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#0F42C0]/20 transition hover:bg-[#0C369E] cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Configurations..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
