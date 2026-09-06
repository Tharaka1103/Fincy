// ============================================================
// FINCY Unified API Client
// All client-side API calls flow through this single module.
// ============================================================

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const url = new URL(`${baseUrl}/api/v1${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, params, headers = {} } = options;

  const url = buildUrl(path, params);

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    let code: string | undefined;
    try {
      const errorData = await response.json();
      message = errorData.error ?? errorData.message ?? message;
      code = errorData.code;
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, message, code);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ──────────────────────────────────────────────
// Financial Accounts
// ──────────────────────────────────────────────
export const accountsApi = {
  list: () => apiFetch<any[]>("/accounts"),
  get: (id: string) => apiFetch<any>(`/accounts/${id}`),
  create: (data: any) => apiFetch<any>("/accounts", { method: "POST", body: data }),
  update: (id: string, data: any) => apiFetch<any>(`/accounts/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => apiFetch<void>(`/accounts/${id}`, { method: "DELETE" }),
};

// ──────────────────────────────────────────────
// Transactions
// ──────────────────────────────────────────────
export const transactionsApi = {
  list: (params?: Record<string, any>) => apiFetch<any>("/transactions", { params }),
  get: (id: string) => apiFetch<any>(`/transactions/${id}`),
  create: (data: any) => apiFetch<any>("/transactions", { method: "POST", body: data }),
  update: (id: string, data: any) => apiFetch<any>(`/transactions/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => apiFetch<void>(`/transactions/${id}`, { method: "DELETE" }),
  exportCsv: (params?: Record<string, any>) =>
    fetch(buildUrl("/transactions/export", params), { credentials: "include" }),
};

// ──────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────
export const categoriesApi = {
  list: (params?: { type?: string }) => apiFetch<any[]>("/categories", { params }),
  create: (data: any) => apiFetch<any>("/categories", { method: "POST", body: data }),
  update: (id: string, data: any) => apiFetch<any>(`/categories/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => apiFetch<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ──────────────────────────────────────────────
// Budgets
// ──────────────────────────────────────────────
export const budgetsApi = {
  list: () => apiFetch<any[]>("/budgets"),
  get: (id: string) => apiFetch<any>(`/budgets/${id}`),
  create: (data: any) => apiFetch<any>("/budgets", { method: "POST", body: data }),
  update: (id: string, data: any) => apiFetch<any>(`/budgets/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => apiFetch<void>(`/budgets/${id}`, { method: "DELETE" }),
};

// ──────────────────────────────────────────────
// Reminders
// ──────────────────────────────────────────────
export const remindersApi = {
  list: (params?: { done?: boolean }) => apiFetch<any[]>("/reminders", { params }),
  get: (id: string) => apiFetch<any>(`/reminders/${id}`),
  create: (data: any) => apiFetch<any>("/reminders", { method: "POST", body: data }),
  update: (id: string, data: any) => apiFetch<any>(`/reminders/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => apiFetch<void>(`/reminders/${id}`, { method: "DELETE" }),
  markDone: (id: string) => apiFetch<any>(`/reminders/${id}`, { method: "PATCH", body: { isDone: true } }),
};

// ──────────────────────────────────────────────
// Goals
// ──────────────────────────────────────────────
export const goalsApi = {
  list: () => apiFetch<any[]>("/goals"),
  get: (id: string) => apiFetch<any>(`/goals/${id}`),
  create: (data: any) => apiFetch<any>("/goals", { method: "POST", body: data }),
  update: (id: string, data: any) => apiFetch<any>(`/goals/${id}`, { method: "PATCH", body: data }),
  delete: (id: string) => apiFetch<void>(`/goals/${id}`, { method: "DELETE" }),
  deposit: (id: string, amount: number, note?: string) =>
    apiFetch<any>(`/goals/${id}/deposit`, { method: "POST", body: { amount, note } }),
};

// ──────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────
export const analyticsApi = {
  summary: (params?: { from?: string; to?: string }) =>
    apiFetch<any>("/analytics/summary", { params }),
  byCategory: (params?: { from?: string; to?: string; type?: string }) =>
    apiFetch<any[]>("/analytics/by-category", { params }),
  trends: (params?: { from?: string; to?: string; interval?: string }) =>
    apiFetch<any[]>("/analytics/trends", { params }),
  topExpenses: (params?: { from?: string; to?: string; limit?: number }) =>
    apiFetch<any[]>("/analytics/top-expenses", { params }),
};

// ──────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────
export const settingsApi = {
  getProfile: () => apiFetch<any>("/settings/profile"),
  updateProfile: (data: any) => apiFetch<any>("/settings/profile", { method: "PATCH", body: data }),
  getBottomNav: () => apiFetch<any>("/settings/bottom-nav"),
  updateBottomNav: (items: any[]) =>
    apiFetch<any>("/settings/bottom-nav", { method: "PUT", body: { items } }),
  getAuditLogs: (params?: { limit?: number; page?: number }) =>
    apiFetch<any>("/settings/audit-logs", { params }),
  changePassword: (data: any) =>
    apiFetch<any>("/settings/change-password", { method: "POST", body: data }),
  getSessions: () => apiFetch<any[]>("/settings/sessions"),
  revokeSession: (sessionId: string) =>
    apiFetch<void>(`/settings/sessions/${sessionId}`, { method: "DELETE" }),
};

// ──────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────
export const reportsApi = {
  getSummary: (params?: { from?: string; to?: string }) =>
    apiFetch<any>("/reports/summary", { params }),
  exportCsv: (params?: { from?: string; to?: string }) =>
    fetch(buildUrl("/reports/export", params), { credentials: "include" }),
};

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export const authApi = {
  forceLogout: () => apiFetch<void>("/auth/force-logout", { method: "POST" }),
  checkActiveSession: () => apiFetch<{ hasActiveSession: boolean; deviceInfo?: string }>("/auth/check-session"),
};
