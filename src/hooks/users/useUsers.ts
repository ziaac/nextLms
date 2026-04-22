import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, type UsersParams } from '@/lib/api/users.api'
import { getErrorMessage } from '@/lib/utils'
import type { CreateUserDto, UpdateUserDto } from '@/types/users.types'

export const USER_KEYS = {
  all:    ['users'] as const,
  list:   (params?: UsersParams) => ['users', 'list', params] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
}

export function useUsers(params?: UsersParams) {
  return useQuery({
    queryKey: USER_KEYS.list(params),
    queryFn:  () => usersApi.getAll(params),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn:  () => usersApi.getById(id),
    enabled:  !!id,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateUserDto) => usersApi.update(id, dto),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}

export function useUserErrorMessage(error: unknown) {
  return error ? getErrorMessage(error) : null
}
