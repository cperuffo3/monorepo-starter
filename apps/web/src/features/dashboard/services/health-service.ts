import type { HealthStatus } from '@starter/shared';

import { apiClient } from '@/lib/api-client';

export function getHealth(): Promise<HealthStatus> {
  return apiClient.get<HealthStatus>('/health');
}
