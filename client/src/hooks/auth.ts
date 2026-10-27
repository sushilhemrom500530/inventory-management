"use client";

import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/api";

export function useAuthService() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      let token = Cookies.get("token");
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("token") || undefined;
        if (token) {
          Cookies.set("token", token, { path: "/", expires: 7, sameSite: "lax" });
        }
      }

      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const res = await apiClient("/auth/me", { method: "GET" });
      if (res?.success && res.data) {
        const userObj = res.data.user || res.data.results || res.data;
        setCurrentUser(userObj);
        Cookies.set("user", JSON.stringify(userObj), { path: "/", expires: 7, sameSite: "lax" });
        Cookies.set("role", userObj.role || "", { path: "/", expires: 7, sameSite: "lax" });
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(userObj));
          localStorage.setItem("role", userObj.role || "");
        }
      }
    } catch (_error) {
      // Token might be invalid or expired
      const cached =
        Cookies.get("user") ||
        (typeof window !== "undefined" ? localStorage.getItem("user") : null);
      if (cached) {
        try {
          setCurrentUser(JSON.parse(cached));
        } catch { }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const loginUser = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await apiClient("/auth/login", {
        method: "POST",
        data: credentials,
      });

      if (res?.success && res.data) {
        const token = res.data.token || res.data.accessToken;
        const user = res.data.user || res.data.results || res.data;
        if (token) {
          Cookies.set("token", token, { path: "/", expires: 7, sameSite: "lax" });
          if (typeof window !== "undefined") {
            localStorage.setItem("token", token);
          }
        }
        if (user && typeof user === "object") {
          Cookies.set("user", JSON.stringify(user), { path: "/", expires: 7, sameSite: "lax" });
          Cookies.set("role", user.role || "", { path: "/", expires: 7, sameSite: "lax" });
          if (typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("role", user.role || "");
          }
          setCurrentUser(user);
        }
        return res;
      }
      throw new Error(res?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (payload: any) => {
    setLoading(true);
    try {
      const res = await apiClient("/auth/register", {
        method: "POST",
        data: payload,
      });
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {}

    Cookies.remove("token", { path: "/" });
    Cookies.remove("token", { path: "/auth" });
    Cookies.remove("token");
    Cookies.remove("refreshToken", { path: "/" });
    Cookies.remove("user", { path: "/" });
    Cookies.remove("role", { path: "/" });

    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      sessionStorage.clear();
      window.location.replace("/auth/login?logout=true");
    } else {
      router.replace("/auth/login?logout=true");
    }
    setCurrentUser(null);
  };

  return {
    currentUser,
    user: currentUser,
    loading,
    isAuthenticated: Boolean(currentUser || Cookies.get("token")),
    loginUser,
    registerUser,
    logoutUser,
    refreshUserProfile: fetchProfile,
  };
}
