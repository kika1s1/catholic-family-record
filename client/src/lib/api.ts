export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: string;
  message: string | null;
  status: string;
  source: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardAnalytics = {
  kpis: {
    totalLeads: number;
    newLeads: number;
    last7Days: number;
    last30Days: number;
    pageViews: number;
    formStarts: number;
    conversionRate: number;
    scheduled: number;
  };
  byRole: Array<{ name: string; value: number }>;
  byStatus: Array<{ name: string; value: number }>;
  byDay: Array<{ date: string; count: number }>;
  byOrganization: Array<{ name: string; value: number }>;
  funnel: Array<{ stage: string; count: number }>;
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    organization: string;
    role: string;
    status: string;
    message: string | null;
    created_at: string;
  }>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  me: () => request<{ user: AuthUser }>("/api/auth/me"),

  updateProfile: (name: string) =>
    request<{ user: AuthUser }>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),

  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    request<{ ok: boolean; message: string }>("/api/auth/password", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  analytics: () => request<DashboardAnalytics>("/api/analytics/dashboard"),

  leads: (params?: { status?: string; role?: string; q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.role) qs.set("role", params.role);
    if (params?.q) qs.set("q", params.q);
    const query = qs.toString();
    return request<{ items: Lead[]; total: number }>(
      `/api/leads${query ? `?${query}` : ""}`,
    );
  },

  lead: (id: string) => request<{ lead: Lead }>(`/api/leads/${id}`),

  updateLeadStatus: (id: string, status: string) =>
    request<{ lead: Lead }>(`/api/leads/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
