import { useQuery } from '@tanstack/react-query'
import { reportApi, type ReportEisOverviewParams } from '@/lib/api/report.api'

export const reportEisKeys = {
  all: ['report', 'eis'] as const,
  overview: (params: ReportEisOverviewParams) => ['report', 'eis', 'overview', params] as const,
}

export function useReportEisOverview(params: ReportEisOverviewParams | null) {
  return useQuery({
    queryKey: reportEisKeys.overview(params ?? { tahunAjaranId: '' }),
    queryFn: () => reportApi.getEisOverview(params!),
    enabled: !!params?.tahunAjaranId,
    staleTime: 1000 * 60 * 3,
  })
}

