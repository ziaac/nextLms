'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { useAjukanPerizinan } from '@/hooks/perizinan/usePerizinan'
import { useSiswaPerKelas } from '@/hooks/perizinan/usePerizinan'
import { useKelasList } from '@/hooks/kelas/useKelas'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import type { JenisPerizinan } from '@/types/enums'
import { BuktiFotoUpload }    from '@/components/ui/BuktiFotoUpload'

const JENIS_OPTIONS = [
  { label: '— Pilih Jenis —',    value: '' },
  { label: 'Sakit',              value: 'SAKIT' },
  { label: 'Izin',               value: 'IZIN'  },
  { label: 'Cuti',               value: 'CUTI'  },
  { label: 'Dinas',              value: 'DINAS' },
  { label: 'Keperluan Keluarga', value: 'KEPERLUAN_KELUARGA' },
]

interface Props {
  open:        boolean
  onClose:     () => void
  /** Jika diisi, mode siswa (tidak perlu pilih siswa) */
  siswaId?:    string
  /** Jika tidak diisi, mode admin/guru — perlu pilih siswa */
  isAdmin?:    boolean
  defaultTaId?: string
  defaultSemId?: string
}

export function PerizinanFormModal({
  open, onClose, siswaId, isAdmin, defaultTaId, defaultSemId,
}: Props) {
  const [jenis,          setJenis]          = useState<JenisPerizinan | ''>('')
  const [tanggalMulai,   setTanggalMulai]   = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [alasan,         setAlasan]          = useState('')
  const [fileBuktiKey,   setFileBuktiKey]   = useState<string | null>(null)

  // Admin mode — pilih siswa via kelas
  const [taId,      setTaId]      = useState(defaultTaId ?? '')
  const [semId,     setSemId]     = useState(defaultSemId ?? '')
  const [kelasId,   setKelasId]   = useState('')
  const [targetId,  setTargetId]  = useState(siswaId ?? '')

  const { data: taListRaw } = useTahunAjaranList()
  const taList = (taListRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = (semListRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: kelasListRaw } = useKelasList(taId ? { tahunAjaranId: taId } : undefined)
  const kelasList = (kelasListRaw as { id: string; namaKelas: string }[] | undefined) ?? []

  const { data: siswaList = [] } = useSiswaPerKelas(
    isAdmin && kelasId ? kelasId : null,
    isAdmin && semId   ? semId   : null,
  )

  const mutation = useAjukanPerizinan()

  // Reset saat modal ditutup
  useEffect(() => {
    if (!open) {
      setJenis(''); setTanggalMulai(''); setTanggalSelesai('')
      setAlasan(''); setFileBuktiKey(null); setKelasId('')
      setTargetId(siswaId ?? '')
    }
  }, [open, siswaId])

  const canSubmit = !!jenis && !!tanggalMulai && !!tanggalSelesai &&
    !!alasan.trim() && !!targetId

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      await mutation.mutateAsync({
        userId:         targetId,
        jenis:          jenis as JenisPerizinan,
        tanggalMulai,
        tanggalSelesai,
        alasan:         alasan.trim(),
        fileBuktiUrl:   fileBuktiKey ?? undefined,
      })
      toast.success('Perizinan berhasil diajukan')
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Gagal mengajukan perizinan'
      toast.error(msg)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajukan Perizinan"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || mutation.isPending}
          >
            {mutation.isPending ? <><Spinner />&nbsp;Menyimpan...</> : 'Ajukan'}
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4">
        {/* Admin — pilih siswa */}
        {isAdmin && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Tahun Ajaran
                </label>
                <Select
                  options={[
                    { label: '— Pilih TA —', value: '' },
                    ...taList.map((t) => ({ label: t.nama, value: t.id })),
                  ]}
                  value={taId}
                  onChange={(e) => { setTaId(e.target.value); setSemId(''); setKelasId(''); setTargetId('') }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Semester
                </label>
                <Select
                  options={[
                    { label: '— Pilih Semester —', value: '' },
                    ...semList.map((s) => ({ label: s.nama, value: s.id })),
                  ]}
                  value={semId}
                  onChange={(e) => { setSemId(e.target.value); setKelasId(''); setTargetId('') }}
                  disabled={!taId}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Kelas</label>
              <Select
                options={[
                  { label: '— Pilih Kelas —', value: '' },
                  ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
                ]}
                value={kelasId}
                onChange={(e) => { setKelasId(e.target.value); setTargetId('') }}
                disabled={!semId}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Siswa</label>
              <Select
                options={[
                  { label: '— Pilih Siswa —', value: '' },
                  ...siswaList.map((s) => ({ label: s.nama + ' · ' + s.nisn, value: s.id })),
                ]}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                disabled={!kelasId || siswaList.length === 0}
              />
            </div>
            <div className="h-px bg-gray-100 dark:bg-gray-800" />
          </>
        )}

        {/* Jenis */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Jenis Perizinan <span className="text-red-500">*</span>
          </label>
          <Select
            options={JENIS_OPTIONS}
            value={jenis}
            onChange={(e) => setJenis(e.target.value as JenisPerizinan | '')}
          />
        </div>

        {/* Tanggal */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => {
                setTanggalMulai(e.target.value)
                if (!tanggalSelesai || tanggalSelesai < e.target.value)
                  setTanggalSelesai(e.target.value)
              }}
              className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggalSelesai}
              min={tanggalMulai}
              onChange={(e) => setTanggalSelesai(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Alasan */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Alasan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            placeholder="Jelaskan alasan perizinan..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* File bukti */}
                <BuktiFotoUpload
                  value={fileBuktiKey}
                  onChange={setFileBuktiKey}
                />
      </div>
    </Modal>
  )
}
