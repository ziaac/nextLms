'use client'
import { useQuery } from '@tanstack/react-query'
import { getPresignedUrl } from '@/lib/api/upload.api'

/**
 * Resolves a private MinIO key to a presigned URL.
 * Returns null if key is null/empty.
 */
export function usePresignedUrl(key: string | null, expirySeconds = 3600) {
  const { data: url, isLoading } = useQuery({
    queryKey: ['presigned-url', key],
    queryFn: () => getPresignedUrl(key!, expirySeconds),
    enabled: !!key,
    staleTime: 1000 * 60 * 50, // 50 min — slightly less than 1h expiry
    gcTime: 1000 * 60 * 55,
  })

  return { url: url ?? null, isLoading }
}
