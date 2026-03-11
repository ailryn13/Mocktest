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

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, requestOptions);

  if (!res.ok) {
    const body = await res.json().catch(() => null);

    // Build a human-readable message from the response body.
    // Previous code had an operator-precedence bug:
    //   body?.message || body?.errors ? JSON.stringify(body.errors) : fallback
    // was evaluated as
    //   (body?.message || body?.errors) ? JSON.stringify(body.errors) : fallback
    // which discarded body.message when body.errors was present (or vice-versa).
    const message: string =
      body?.message
        ? body.message
        : body?.errors
        ? JSON.stringify(body.errors)
        : `Request failed with status ${res.status}`;

    // If the JWT is expired or missing the server now returns 401.
    // Redirect to /login so the student can re-authenticate.
    // We do NOT redirect for /auth/* calls to avoid a redirect loop.
    if (res.status === 401 && !endpoint.startsWith("/auth/")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        window.location.href = "/login";
      }
    }

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
