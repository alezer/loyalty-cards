/**
 * Backend API client.
 *
 * In development, requests to /api/v1/* are proxied to the backend
 * via next.config.ts rewrites — no CORS issues.
 *
 * In production, set NEXT_PUBLIC_BACKEND_URL to your deployed backend URL.
 */

const BACKEND_URL =
  typeof window !== 'undefined'
    ? '' // Client: use the Next.js rewrite proxy (relative URL)
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000')

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed: ${res.status}`)
  }

  return data as T
}

// ── Stamps ────────────────────────────────────────────────────────

export async function addStampViaBackend(
  customerId: string,
  businessId: string,
  token: string,
) {
  return request('/api/v1/stamps/add', {
    method: 'POST',
    token,
    body: JSON.stringify({ customer_id: customerId, business_id: businessId }),
  })
}

// ── Rewards ───────────────────────────────────────────────────────

export async function redeemReward(rewardId: string, token: string) {
  return request(`/api/v1/rewards/${rewardId}/redeem`, {
    method: 'PATCH',
    token,
  })
}
