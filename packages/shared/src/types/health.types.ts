/**
 * Response shape of GET /api/v1/health (@nestjs/terminus).
 */
export interface HealthStatus {
  status: 'ok' | 'error';
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string; message?: string }>;
  details?: Record<string, { status: string; message?: string }>;
}
