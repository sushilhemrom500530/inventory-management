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
      const token = Cookies.get("token");
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const res = await apiClient("/auth/me", { method: "GET" });
      if (res?.success && res.data) {
        const userObj = res.data.user || res.data.results || res.data;
        setCurrentUser(userObj);
        Cookies.set("user", JSON.stringify(userObj));
        Cookies.set("role", userObj.role || "");
      }
    } catch (_error) {
      // Token might be invalid or expired
      const cached = Cookies.get("user");
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
          Cookies.set("token", token, { expires: 7 });
        }
        if (user && typeof user === "object") {
          Cookies.set("user", JSON.stringify(user), { expires: 7 });
          Cookies.set("role", user.role || "", { expires: 7 });
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

  const logoutUser = () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    Cookies.remove("user");
    Cookies.remove("role");
    setCurrentUser(null);
    router.push("/auth/login");
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
