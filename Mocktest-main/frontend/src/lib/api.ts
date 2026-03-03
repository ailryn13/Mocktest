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

function getDirectBackendBase(): string | null {
  if (typeof window === "undefined") return null;
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8080/api`;
}

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

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, requestOptions);
  } catch (error) {
    const directBase = getDirectBackendBase();
    if (API_BASE === "/api" && directBase) {
      res = await fetch(`${directBase}${endpoint}`, requestOptions);
    } else {
      throw error;
    }
  }

  if ((res.status === 502 || res.status === 503) && API_BASE === "/api") {
    const directBase = getDirectBackendBase();
    if (directBase) {
      res = await fetch(`${directBase}${endpoint}`, requestOptions);
    }
  }

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

/**
 * Send a password-reset link to the given email address.
 * Always resolves (backend never reveals whether email is registered).
 */
export async function forgotPassword(email: string): Promise<void> {
  await apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/**
 * Consume a password-reset token and set a new password.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  await apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
