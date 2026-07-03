/**
 * Shared HTTP client for the backend API.
 * All feature services (features/*\/services) go through this — never call
 * fetch directly from components, hooks, or queries.
 *
 * Paths are relative to the API prefix, e.g. apiClient.get('/health').
 * In dev, Vite proxies /api to the backend (see vite.config.ts).
 */
import { ApiError } from './api-error';

const API_BASE = '/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const message =
      (body as { message?: string } | undefined)?.message ??
      `Request failed: ${response.status} ${response.statusText}`;
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data !== undefined ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
