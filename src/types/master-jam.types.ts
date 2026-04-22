export type TipeHari = 'REGULER' | 'JUMAT' | 'SENIN' | 'KHUSUS'

export const TIPE_HARI_LIST: TipeHari[] = ['REGULER', 'JUMAT', 'SENIN', 'KHUSUS']

export const TIPE_HARI_LABEL: Record<TipeHari, string> = {
  REGULER: 'Reguler',
  JUMAT:   'Jumat',
  SENIN:   'Senin',
  KHUSUS:  'Khusus',
}

export const TIPE_HARI_VARIANT: Record<TipeHari, 'default' | 'success' | 'info' | 'warning'> = {
  REGULER: 'default',
  JUMAT:   'success',
  SENIN:   'info',
  KHUSUS:  'warning',
}

export interface MasterJam {
  id:             string
  namaSesi:       string
  jamMulai:       string   // "HH:mm"
  jamSelesai:     string   // "HH:mm"
  jumlahMenit:    number
  bobotJp:        number
  tipeHari:       TipeHari
  isIstirahat:    boolean
  urutan:         number
  tingkatKelasId: string
  createdAt:      string
  updatedAt:      string
  // Relations (optional)
  tingkatKelas?: { id: string; nama: string; jenjang: string }
}

export interface CreateMasterJamPayload {
  namaSesi:       string
  jamMulai:       string   // "HH:mm"
  jamSelesai:     string   // "HH:mm"
  bobotJp:        number
  tipeHari:       TipeHari
  isIstirahat:    boolean
  urutan:         number
  tingkatKelasId: string
}

export type UpdateMasterJamPayload = Partial<CreateMasterJamPayload>

export interface FilterMasterJamParams {
  tingkatKelasId?: string
  tipeHari?:       TipeHari
  isIstirahat?:    boolean
}
