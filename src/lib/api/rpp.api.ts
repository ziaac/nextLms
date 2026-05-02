import api from '@/lib/axios'
import type {
  RPP,
  RppListResponse,
  CreateRppDto,
  UpdateRppDto,
  RppFilterParams,
} from '@/types/rpp.types'

const BASE = '/rpp'

export const getRppList = (filter?: RppFilterParams) =>
  api.get<RppListResponse>(BASE, { params: filter }).then((r) => r.data)

export const getRppDetail = (id: string) =>
  api.get<RPP>(`${BASE}/${id}`).then((r) => r.data)

export const createRpp = (dto: CreateRppDto) =>
  api.post<RPP>(BASE, dto).then((r) => r.data)

export const updateRpp = (id: string, dto: UpdateRppDto) =>
  api.put<RPP>(`${BASE}/${id}`, dto).then((r) => r.data)

export const publishRpp = (id: string) =>
  api.patch<RPP>(`${BASE}/${id}/publish`).then((r) => r.data)

export const deleteRpp = (id: string) =>
  api.delete<{ message: string }>(`${BASE}/${id}`).then((r) => r.data)
