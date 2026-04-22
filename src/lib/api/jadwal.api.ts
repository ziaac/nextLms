import api from '@/lib/axios'
import type {
  JadwalPelajaran,
  RosterKelasResponse,
  RosterGuruResponse,
  RingkasanKelasItem,
  BebanMengajarResponse,
  KetersediaanRequest,
  KetersediaanResponse,
  RekapGuruItem,
  CreateJadwalPayload,
  BulkJadwalPayload,
  BulkMapelJadwalPayload,
  FilterJadwalParams,
  FilterRingkasanParams,
  ExportJadwalSekolahParams,
  ExportJadwalKelasParams,
  ExportJadwalGuruParams,
  HariEnum,
} from '@/types/jadwal.types'

async function getMingguan(kelasId: string, semesterId: string): Promise<Record<HariEnum, JadwalPelajaran[]>> {
  const { data } = await api.get('/jadwal-pelajaran/kelas/' + kelasId + '/mingguan', { params: { semesterId } })
  return data
}

async function getByGuru(guruId: string, semesterId: string): Promise<JadwalPelajaran[]> {
  const { data } = await api.get('/jadwal-pelajaran/guru/' + guruId, { params: { semesterId } })
  return data
}

async function getById(id: string): Promise<JadwalPelajaran> {
  const { data } = await api.get('/jadwal-pelajaran/' + id)
  return data
}

async function create(payload: CreateJadwalPayload): Promise<JadwalPelajaran> {
  const { data } = await api.post('/jadwal-pelajaran', payload)
  return data
}

async function bulkByKelas(payload: BulkJadwalPayload): Promise<{ message: string; count: number }> {
  const { data } = await api.post('/jadwal-pelajaran/bulk', payload)
  return data
}

async function bulkByMapel(payload: BulkMapelJadwalPayload): Promise<{ message: string; count: number }> {
  const { data } = await api.post('/jadwal-pelajaran/bulk-mapel', payload)
  return data
}

async function remove(id: string): Promise<void> {
  await api.delete('/jadwal-pelajaran/' + id)
}

async function copySemester(sourceSemesterId: string, targetSemesterId: string): Promise<{ message: string; count: number; skipped: number }> {
  const { data } = await api.post('/jadwal-pelajaran/copy-semester', {
    sourceSemesterId,
    targetSemesterId,
  })
  return data
}

async function checkKetersediaan(payload: KetersediaanRequest): Promise<KetersediaanResponse> {
  const { data } = await api.post('/jadwal-pelajaran/ketersediaan', payload)
  return data
}

/** semesterId opsional — API support tanpa semesterId */
async function getBebanMengajar(guruId: string, semesterId?: string): Promise<BebanMengajarResponse> {
  const { data } = await api.get('/jadwal-pelajaran/beban-mengajar', {
    params: { guruId, ...(semesterId ? { semesterId } : {}) },
  })
  return data
}

async function getRingkasanSemuaKelas(params: FilterRingkasanParams): Promise<RingkasanKelasItem[]> {
  const { data } = await api.get('/jadwal-pelajaran/ringkasan-semua-kelas', { params })
  return data
}

async function getRosterKelas(kelasId: string, semesterId: string): Promise<RosterKelasResponse> {
  const { data } = await api.get('/roster/kelas', { params: { kelasId, semesterId } })
  return data
}

async function getRosterGuru(guruId: string, semesterId: string): Promise<RosterGuruResponse> {
  const { data } = await api.get('/roster/guru', { params: { guruId, semesterId } })
  return data
}

async function getRekapGuru(): Promise<RekapGuruItem[]> {
  const { data } = await api.get('/mata-pelajaran-tingkat/rekap-guru')
  return data
}

async function exportJadwalSekolah(params: ExportJadwalSekolahParams): Promise<Blob> {
  const { data } = await api.get('/report/export/jadwal-sekolah', { params, responseType: 'blob' })
  return data
}

async function exportJadwalKelas(params: ExportJadwalKelasParams): Promise<Blob> {
  const { data } = await api.get('/report/export/jadwal-kelas', { params, responseType: 'blob' })
  return data
}

async function exportJadwalGuru(params: ExportJadwalGuruParams): Promise<Blob> {
  const { data } = await api.get('/report/export/jadwal-guru', { params, responseType: 'blob' })
  return data
}


async function getRingkasanKelas(kelasId: string, semesterId: string) {
  const { data } = await api.get('/jadwal-pelajaran/ringkasan-kelas', {
    params: { kelasId, semesterId },
  })
  return data
}

export const jadwalApi = {
  getMingguan, getByGuru, getById, create, bulkByKelas, bulkByMapel, remove,
  copySemester, checkKetersediaan, getBebanMengajar, getRingkasanSemuaKelas,
  getRosterKelas, getRosterGuru, getRekapGuru,
  getRingkasanKelas,
  exportJadwalSekolah, exportJadwalKelas, exportJadwalGuru,
}
