import api from '@/lib/axios'
import type {
  Kurikulum,
  FormatBaku,
  CreateKurikulumDto,
  UpdateKurikulumDto,
  CreateFormatBakuDto,
} from '@/types/kurikulum.types'

const BASE = '/kurikulum'

export const getKurikulumList = () =>
  api.get<Kurikulum[]>(BASE).then((r) => r.data)

export const getKurikulumAktif = () =>
  api.get<Kurikulum>(`${BASE}/aktif`).then((r) => r.data)

export const getKurikulumDetail = (id: string) =>
  api.get<Kurikulum>(`${BASE}/${id}`).then((r) => r.data)

export const createKurikulum = (dto: CreateKurikulumDto) =>
  api.post<Kurikulum>(BASE, dto).then((r) => r.data)

export const updateKurikulum = (id: string, dto: UpdateKurikulumDto) =>
  api.put<Kurikulum>(`${BASE}/${id}`, dto).then((r) => r.data)

export const activateKurikulum = (id: string) =>
  api.patch<Kurikulum>(`${BASE}/${id}/activate`).then((r) => r.data)

export const deleteKurikulum = (id: string) =>
  api.delete<{ message: string }>(`${BASE}/${id}`).then((r) => r.data)

export const upsertFormatBaku = (kurikulumId: string, dto: CreateFormatBakuDto) =>
  api.post<FormatBaku>(`${BASE}/${kurikulumId}/format-baku`, dto).then((r) => r.data)

export const getFormatBaku = (kurikulumId: string) =>
  api.get<FormatBaku[]>(`${BASE}/${kurikulumId}/format-baku`).then((r) => r.data)

export const uploadKurikulumTemplatePdf = async (file: File): Promise<string> => {
  const form = new FormData()
  form.append('file', file)
  const r = await api.post<{ key: string }>('/upload/kurikulum/template-pdf', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return r.data.key
}
