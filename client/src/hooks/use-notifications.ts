"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/utils/api";

interface UseNotificationsOptions {
  autoFetch?: boolean;
}

export function useNotifications({ autoFetch = true }: UseNotificationsOptions = {}) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient("/notification/get-all", { method: "GET" });
      if (res?.success && res.data) {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setNotifications(items);
        setUnreadCount(items.filter((n: any) => !n.isRead).length);
      }
    } catch (_error) {
      // Quiet fail if notifications service offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch, fetchNotifications]);

  const markAsRead = async () => {
    try {
      await apiClient("/notification/mark-as-read", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (_e) { }
  };

  return {
    unreadCount,
    notifications,
    loading,
    refreshNotifications: fetchNotifications,
    markAsRead,
  };
}
