import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface ServiceStatus {
  name: string
  status: 'ok' | 'error'
  latencyMs?: number
  detail?: string
}

export interface HealthResponse {
  status: 'ok' | 'degraded'
  timestamp: string
  services: ServiceStatus[]
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await api.get<HealthResponse>('/health')
  return res.data
}

export function useServiceHealth() {
  return useQuery({
    queryKey: ['service-health'],
    queryFn: fetchHealth,
    // Refresh setiap 30 detik agar status selalu terkini
    refetchInterval: 30_000,
    // Tetap fetch meski tab tidak aktif
    refetchIntervalInBackground: false,
    // Jangan retry terlalu agresif — health check harus cepat
    retry: 1,
    staleTime: 20_000,
  })
}
