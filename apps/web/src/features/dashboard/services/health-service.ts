import { apiClient } from '@/lib/api-client';
import type { HealthStatus } from '@starter/shared';

export function getHealth(): Promise<HealthStatus> {
  return apiClient.get<HealthStatus>('/health');
}
