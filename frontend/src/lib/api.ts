function getApiBase(): string {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL;
  if (configuredBase && configuredBase.trim().length > 0) {
    return configuredBase.trim();
  }

  if (typeof window !== "undefined") {
    return "/api";
  }

  return "http://backend:8080/api";
}

const API_BASE = getApiBase();

/**
 * Thin wrapper around fetch that:
 *  - Prepends the backend base URL.
 *  - Sets JSON headers.
 *  - Attaches the JWT token from localStorage when available.
 *  - Throws on non-2xx responses with the server's error message.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.message || body?.errors
        ? JSON.stringify(body.errors)
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  // Handle 204 No Content
  if (res.status === 204) return null as T;

  const text = await res.text();
  if (!text) return null as T;

  // If it's valid JSON return parsed, otherwise return raw text
  try {
    return JSON.parse(text);
  } catch {
    return text as T;
  }
}
