import {
  Claim,
  ClaimCreatePayload,
  ClaimDetailResponse,
  DashboardStats,
  Policy,
  AuditLog
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchClaims(params?: {
  search?: string;
  status?: string;
  category?: string;
  sort_by?: string;
  sort_order?: string;
}): Promise<Claim[]> {
  const url = new URL(`${API_BASE_URL}/api/claims`);
  if (params?.search) url.searchParams.append('search', params.search);
  if (params?.status) url.searchParams.append('status', params.status);
  if (params?.category) url.searchParams.append('category', params.category);
  if (params?.sort_by) url.searchParams.append('sort_by', params.sort_by);
  if (params?.sort_order) url.searchParams.append('sort_order', params.sort_order);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch claims');
  return res.json();
}

export async function submitClaim(payload: ClaimCreatePayload): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/api/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to submit claim');
  }
  return res.json();
}

export async function fetchClaimDetail(id: number | string): Promise<ClaimDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/api/claims/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch claim #${id}`);
  return res.json();
}

export async function approveClaim(id: number, reviewer: string, reason?: string): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/api/claims/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer, reason })
  });
  if (!res.ok) throw new Error('Failed to approve claim');
  return res.json();
}

export async function rejectClaim(id: number, reviewer: string, reason: string): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/api/claims/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer, reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reject claim');
  }
  return res.json();
}

export async function requestClarification(id: number, reviewer: string, message: string): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/api/claims/${id}/clarification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer, message })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to request clarification');
  }
  return res.json();
}

export async function overrideCategory(id: number, reviewer: string, newCategory: string, reason: string): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/api/claims/${id}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer, new_category: newCategory, reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to override classification');
  }
  return res.json();
}

export async function fetchPolicies(): Promise<Policy[]> {
  const res = await fetch(`${API_BASE_URL}/api/policies`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

export async function importPolicyText(payload: {
  name: string;
  version: string;
  description?: string;
  effective_date: string;
  raw_text: string;
}): Promise<Policy> {
  const res = await fetch(`${API_BASE_URL}/api/policies/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to import policy text');
  return res.json();
}

export async function fetchGlobalAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE_URL}/api/audit`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
