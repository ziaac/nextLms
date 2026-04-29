'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users.api'
import { useAuthStore } from '@/stores/auth.store'
import type { UpdateUserDto } from '@/types/users.types'

export function useProfil() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['profil', user?.id],
    queryFn: () => usersApi.getById(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  })

  const updateMutation = useMutation({
    mutationFn: (dto: UpdateUserDto) => usersApi.updateMe(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profil', user?.id] })
    },
  })

  return { data, isLoading, updateMutation, userId: user?.id }
}
