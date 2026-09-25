import type { ApiEnvelope } from '@/domain/raw'

export const DATA_MODE: 'mock' | 'live' = process.env.NEXT_PUBLIC_DATA_MODE === 'live' ? 'live' : 'mock'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const UNAUTHORIZED_EVENT = 'sf:unauthorized'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function liveRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let json: ApiEnvelope<T> | undefined
  try {
    json = (await res.json()) as ApiEnvelope<T>
  } catch {
    // non-JSON response
  }
  if (res.status === 401) {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(json?.errorMessage ?? 'Unauthorized', 401, json?.errorCode)
  }
  if (!res.ok || !json?.success) {
    throw new ApiError(json?.errorMessage ?? `Request failed (${res.status})`, res.status, json?.errorCode)
  }
  return json.data as T
}

async function mockRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const { handleMock } = await import('@/mocks/handlers')
  // Simulated latency so skeleton states are visible.
  await new Promise((r) => setTimeout(r, 250 + Math.random() * 350))
  const env = (await handleMock(method, path, body)) as ApiEnvelope<T>
  if (!env.success) throw new ApiError(env.errorMessage ?? 'Mock error', 400, env.errorCode)
  return env.data as T
}

export function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  return DATA_MODE === 'live' ? liveRequest<T>(method, path, body) : mockRequest<T>(method, path, body)
}

export const apiGet = <T>(path: string) => request<T>('GET', path)
export const apiPost = <T>(path: string, body?: unknown) => request<T>('POST', path, body)
export const apiPut = <T>(path: string, body?: unknown) => request<T>('PUT', path, body)
export const apiDelete = <T>(path: string) => request<T>('DELETE', path)

/** Raw file download (used by booking export in live mode). */
export async function apiDownload(path: string): Promise<{ blob: Blob; filename?: string }> {
  const res = await fetch(path, { credentials: 'same-origin' })
  if (!res.ok) throw new ApiError('Failed to export', res.status)
  const cd = res.headers.get('content-disposition') ?? ''
  const star = cd.match(/filename\*=UTF-8''([^;]+)/i)
  const plain = cd.match(/filename="([^"]+)"/i)
  return { blob: await res.blob(), filename: star ? decodeURIComponent(star[1]) : plain?.[1] }
}
