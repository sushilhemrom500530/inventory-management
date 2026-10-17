import Cookies from "js-cookie";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

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

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  try {
    const res = await fetch(url, {
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
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const fetchApi = apiClient;
export default apiClient;
