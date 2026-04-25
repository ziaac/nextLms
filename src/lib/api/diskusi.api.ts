import api from '@/lib/axios'

// ─── types ───────────────────────────────────────────────────────────────────

export interface DiskusiUser {
  id: string
  role: string
  profile: { namaLengkap: string; foto: string | null } | null
}

export interface BalasanItem {
  id: string
  isi: string
  createdAt: string
  updatedAt: string
  user: DiskusiUser
}

export interface DiskusiItem {
  id: string
  isi: string
  isPrivate: boolean
  isPinned: boolean
  createdAt: string
  updatedAt: string
  user: DiskusiUser
  balasan: BalasanItem[]
}

export interface CreateDiskusiPayload {
  isi: string
  isPrivate?: boolean
}

export interface CreateBalasanPayload {
  isi: string
}

// ─── Materi ──────────────────────────────────────────────────────────────────

export const getDiskusiMateri = (materiId: string) =>
  api.get<DiskusiItem[]>(`/materi-pelajaran/${materiId}/diskusi`).then(r => r.data)

export const createDiskusiMateri = (materiId: string, payload: CreateDiskusiPayload) =>
  api.post<DiskusiItem>(`/materi-pelajaran/${materiId}/diskusi`, payload).then(r => r.data)

export const deleteDiskusiMateri = (diskusiId: string) =>
  api.delete<{ message: string }>(`/materi-pelajaran/diskusi/${diskusiId}`).then(r => r.data)

export const pinDiskusiMateri = (diskusiId: string) =>
  api.patch<{ id: string; isPinned: boolean }>(`/materi-pelajaran/diskusi/${diskusiId}/pin`).then(r => r.data)

export const createBalasanMateri = (diskusiId: string, payload: CreateBalasanPayload) =>
  api.post<BalasanItem>(`/materi-pelajaran/diskusi/${diskusiId}/balasan`, payload).then(r => r.data)

export const deleteBalasanMateri = (balasanId: string) =>
  api.delete<{ message: string }>(`/materi-pelajaran/diskusi/balasan/${balasanId}`).then(r => r.data)

export const toggleDiskusiMateri = (materiId: string) =>
  api.patch<{ id: string; isDiskusiAktif: boolean }>(`/materi-pelajaran/${materiId}/diskusi/toggle`).then(r => r.data)

// ─── Tugas ───────────────────────────────────────────────────────────────────

export const getDiskusiTugas = (tugasId: string) =>
  api.get<DiskusiItem[]>(`/tugas/${tugasId}/diskusi`).then(r => r.data)

export const createDiskusiTugas = (tugasId: string, payload: CreateDiskusiPayload) =>
  api.post<DiskusiItem>(`/tugas/${tugasId}/diskusi`, payload).then(r => r.data)

export const deleteDiskusiTugas = (diskusiId: string) =>
  api.delete<{ message: string }>(`/tugas/diskusi/${diskusiId}`).then(r => r.data)

export const pinDiskusiTugas = (diskusiId: string) =>
  api.patch<{ id: string; isPinned: boolean }>(`/tugas/diskusi/${diskusiId}/pin`).then(r => r.data)

export const createBalasanTugas = (diskusiId: string, payload: CreateBalasanPayload) =>
  api.post<BalasanItem>(`/tugas/diskusi/${diskusiId}/balasan`, payload).then(r => r.data)

export const deleteBalasanTugas = (balasanId: string) =>
  api.delete<{ message: string }>(`/tugas/diskusi/balasan/${balasanId}`).then(r => r.data)

export const toggleDiskusiTugas = (tugasId: string) =>
  api.patch<{ id: string; isDiskusiAktif: boolean }>(`/tugas/${tugasId}/diskusi/toggle`).then(r => r.data)
