export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface AuthorityProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  scope: 'WARD' | 'ZONE' | 'DEPARTMENT' | 'DISTRICT';
  levelOrder: number;
  permissions: string[];
  departmentId: string | null;
  zoneId: string | null;
  wardId: string | null;
  totpEnabled: boolean;
}

const CSRF_STORAGE_KEY = 'ss_csrf_token';
let memoryCsrfToken: string | null =
  typeof window !== 'undefined' ? window.sessionStorage.getItem(CSRF_STORAGE_KEY) : null;

export function getCsrfToken(): string | null {
  return memoryCsrfToken;
}

export function setCsrfToken(token: string | null) {
  memoryCsrfToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
    }
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && memoryCsrfToken && !headers.has('X-CSRF-Token')) {
    headers.set('X-CSRF-Token', memoryCsrfToken);
  }

  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });

  const text = await res.text();
  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }
  }

  if (!res.ok) {
    const code = parsed?.error?.code || parsed?.code || `HTTP_${res.status}`;
    const message =
      parsed?.error?.message || parsed?.message || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, code, message);
  }

  return parsed as T;
}

// ── Authority Auth APIs ──
export async function authorityLogin(email: string, password: string) {
  const res = await apiRequest<{ mfaRequired: true; mfaToken: string } | { mfaRequired: false; csrfToken: string }>(
    '/api/authority/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.mfaRequired && res.csrfToken) {
    setCsrfToken(res.csrfToken);
  }
  return res;
}

export async function authorityCompleteMfa(mfaToken: string, code: string) {
  const res = await apiRequest<{ csrfToken: string }>('/api/authority/mfa/complete', {
    method: 'POST',
    body: JSON.stringify({ mfaToken, code }),
  });
  if (res.csrfToken) {
    setCsrfToken(res.csrfToken);
  }
  return res;
}

export async function authorityActivate(token: string, password: string) {
  return apiRequest<{ success: boolean }>('/api/authority/activate', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function authorityMe() {
  return apiRequest<AuthorityProfile>('/api/authority/me');
}

export async function authorityLogout() {
  try {
    await apiRequest<{ success: boolean }>('/api/authority/logout', { method: 'POST' });
  } finally {
    setCsrfToken(null);
  }
}

export async function authoritySetupMfa() {
  return apiRequest<{ secret: string; otpauthUrl: string }>('/api/authority/mfa/setup', { method: 'POST' });
}

export async function authorityConfirmMfa(code: string) {
  return apiRequest<{ success: boolean; totpEnabled: boolean }>('/api/authority/mfa/confirm', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

// ── Admin Governance APIs ──
export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  status: 'PENDING_ACTIVATION' | 'ACTIVE' | 'SUSPENDED';
  totpEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: { id: string; code: string; name: string; scope: string };
  department: { id: string; code: string; name: string } | null;
  zone: { id: string; name: string } | null;
  ward: { id: string; number: number; name: string } | null;
}

export interface AdminRuleItem {
  id: string;
  departmentId: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  fromLevelOrder: number;
  toLevelOrder: number;
  slaHours: number;
  active: boolean;
  department: { id: string; code: string; name: string } | null;
}

export interface AdminAuditItem {
  id: string;
  actorType: 'CITIZEN' | 'AUTHORITY' | 'SYSTEM';
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  ticketId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function adminListUsers(params: { status?: string; search?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  if (params.page) qs.set('page', String(params.page));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<{ total: number; page: number; totalPages: number; users: AdminUserItem[] }>(
    `/api/admin/users${suffix}`,
  );
}

export function adminCreateUser(payload: {
  name: string;
  email: string;
  roleId: string;
  departmentId?: string;
  zoneId?: string;
  wardId?: string;
}) {
  return apiRequest<{ id: string; name: string; email: string; activationLink: string }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function adminSetUserStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
  return apiRequest<{ user: { id: string; status: string } }>(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function adminResendActivation(id: string) {
  return apiRequest<{ id: string; activationLink: string }>(`/api/admin/users/${id}/resend-activation`, {
    method: 'POST',
  });
}

export function adminGetOrg() {
  return apiRequest<{
    departments: Array<{ id: string; code: string; name: string }>;
    zones: Array<{ id: string; name: string }>;
    wards: Array<{ id: string; number: number; name: string; zoneId: string }>;
    levels: Array<{ id: string; levelOrder: number; name: string }>;
    roles: Array<{ id: string; code: string; name: string; scope: string }>;
  }>('/api/admin/org');
}

export function adminListRules() {
  return apiRequest<{ rules: AdminRuleItem[] }>('/api/admin/rules');
}

export function adminUpsertRule(payload: {
  departmentId?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fromLevelOrder: number;
  toLevelOrder: number;
  slaHours: number;
}) {
  return apiRequest<{ rule: AdminRuleItem }>('/api/admin/rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function adminDeleteRule(id: string) {
  return apiRequest<{ rule: AdminRuleItem }>(`/api/admin/rules/${id}`, { method: 'DELETE' });
}

export function adminGetSettings() {
  return apiRequest<{ settings: Record<string, Record<string, number>> }>('/api/admin/settings');
}

export function adminUpdateSetting(key: string, values: Record<string, number>) {
  return apiRequest<{ settings: Record<string, Record<string, number>> }>(`/api/admin/settings/${key}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

export function adminListAuditLogs(params: { actorType?: string; action?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.actorType) qs.set('actorType', params.actorType);
  if (params.action) qs.set('action', params.action);
  if (params.page) qs.set('page', String(params.page));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<{ total: number; page: number; totalPages: number; logs: AdminAuditItem[] }>(
    `/api/admin/audit-logs${suffix}`,
  );
}
