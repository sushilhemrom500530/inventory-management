import Cookies from "js-cookie";

function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const currentHost = window.location.hostname || "localhost";
    const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

    // Normalize localhost / 127.0.0.1 based on window location
    if (currentHost === "127.0.0.1" && envUrl.includes("localhost")) {
      return envUrl.replace("localhost", "127.0.0.1");
    }
    if (currentHost === "localhost" && envUrl.includes("127.0.0.1")) {
      return envUrl.replace("127.0.0.1", "localhost");
    }
    return envUrl;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
}

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<{ success: boolean; data?: T; message?: string; meta?: any }> {
  const token = Cookies.get("token");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body = options.body;
  if (options.data && !(options.data instanceof FormData)) {
    body = JSON.stringify(options.data);
  } else if (options.data instanceof FormData) {
    body = options.data;
  }

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const primaryUrl = endpoint.startsWith("http") ? endpoint : `${baseUrl}${cleanEndpoint}`;

  try {
    const res = await fetch(primaryUrl, {
      ...options,
      headers,
      body,
      credentials: "include",
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || `Request failed with status ${res.status}`);
    }

    return result;
  } catch (error: any) {
    // If direct cross-origin connection failed, try relative proxy rewrite (/api/v1/...)
    if (
      typeof window !== "undefined" &&
      !endpoint.startsWith("http") &&
      (error?.message === "Failed to fetch" || error?.name === "TypeError")
    ) {
      try {
        const proxyUrl = `/api/v1${cleanEndpoint}`;
        const fallbackRes = await fetch(proxyUrl, {
          ...options,
          headers,
          body,
          credentials: "include",
        });
        const fallbackResult = await fallbackRes.json();
        if (fallbackRes.ok) {
          return fallbackResult;
        }
      } catch {
        // Fallback also failed, proceed to error logging
      }
    }

    console.error(`API Error [${endpoint}]:`, error);
    if (error?.message === "Failed to fetch") {
      throw new Error(
        "Unable to connect to the backend API."
      );
    }
    throw error;
  }
}

export const fetchApi = apiClient;
export default apiClient;
