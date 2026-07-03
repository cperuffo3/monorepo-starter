/**
 * Error thrown by the API client for non-2xx responses.
 * Carries the HTTP status and the parsed response body (when available)
 * so callers and TanStack Query error handlers can branch on it.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
