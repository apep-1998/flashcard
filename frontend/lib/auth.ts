type Tokens = {
  access: string;
  refresh: string;
};

const TOKEN_KEY = "learning-fast.tokens";

export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const getStoredTokens = (): Tokens | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Tokens;
  } catch {
    return null;
  }
};

export const setStoredTokens = (tokens: Tokens) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

export const clearStoredTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
};

const decodeJwt = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
};

export const registerUser = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error?.email?.[0] ||
        error?.detail ||
        "Unable to register. Please try again.",
    );
  }
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}) => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.detail || "Invalid email or password.");
  }

  const data = (await response.json()) as Tokens;
  if (!data.access || !data.refresh) {
    throw new Error("Invalid login response.");
  }
  setStoredTokens({ access: data.access, refresh: data.refresh });
  return data;
};

export const refreshAccessToken = async (refresh: string) => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    throw new Error("Unable to refresh token.");
  }

  const data = (await response.json()) as { access?: string };
  if (!data.access) {
    throw new Error("Invalid refresh response.");
  }

  const current = getStoredTokens();
  if (current) {
    setStoredTokens({ access: data.access, refresh: current.refresh });
  }
  return data.access;
};

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
) => {
  const tokens = getStoredTokens();
  const headers = new Headers(init.headers);
  if (tokens?.access) {
    headers.set("Authorization", `Bearer ${tokens.access}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401 || !tokens?.refresh) {
    return response;
  }

  try {
    const access = await refreshAccessToken(tokens.refresh);
    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Authorization", `Bearer ${access}`);
    return await fetch(input, { ...init, headers: retryHeaders });
  } catch {
    clearStoredTokens();
    return response;
  }
};
