'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { toast } from 'sonner'
import api from '@/lib/axios'

interface Props {
  open:    boolean
  onClose: () => void
}

type ExportType =
  | 'list-kelas'
  | 'daftar-siswa'
  | 'daftar-guru'
  | 'jadwal-sekolah'
  | 'jadwal-kelas'

interface ExportOption {
  type:        ExportType
  label:       string
  needSemester: boolean
  needKelas:   boolean
}

const EXPORT_OPTIONS: ExportOption[] = [
  { type: 'list-kelas',     label: 'List Kelas per TA',        needSemester: false, needKelas: false },
  { type: 'daftar-siswa',   label: 'Daftar Siswa per TA',      needSemester: false, needKelas: false },
  { type: 'daftar-guru',    label: 'Daftar Guru & Jadwal',     needSemester: true,  needKelas: false },
  { type: 'jadwal-sekolah', label: 'Jadwal Sekolah (Semua)',   needSemester: true,  needKelas: false },
  { type: 'jadwal-kelas',   label: 'Jadwal per Kelas',         needSemester: true,  needKelas: true  },
]

export function KelasExportModal({ open, onClose }: Props) {
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [semesterId,    setSemesterId]    = useState('')
  const [kelasId,       setKelasId]       = useState('')
  const [loading,       setLoading]       = useState<ExportType | null>(null)

  const { data: taList = [] }       = useTahunAjaranList()
  const { data: semesterList = [] } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const { data: kelasList = [] }    = useKelasListByTA(tahunAjaranId)

  useEffect(() => {
    if (!open) {
      setTahunAjaranId('')
      setSemesterId('')
      setKelasId('')
    }
  }, [open])

  useEffect(() => {
    setSemesterId('')
    setKelasId('')
  }, [tahunAjaranId])

  const taOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...taList.map((ta) => ({ label: ta.nama, value: ta.id })),
  ]
  const semesterOptions = [
    { label: 'Pilih Semester', value: '' },
    ...semesterList.map((s) => ({ label: `Semester ${s.nama}`, value: s.id })),
  ]
  const kelasOptions = [
    { label: 'Pilih Kelas', value: '' },
    ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
  ]

  async function handleExport(opt: ExportOption) {
    if (!tahunAjaranId) { toast.error('Pilih tahun ajaran terlebih dahulu'); return }
    if (opt.needSemester && !semesterId) { toast.error('Pilih semester terlebih dahulu'); return }
    if (opt.needKelas && !kelasId) { toast.error('Pilih kelas terlebih dahulu'); return }

    setLoading(opt.type)
    try {
      const params: Record<string, string> = { tahunAjaranId }
      if (opt.needSemester) params.semesterId = semesterId
      if (opt.needKelas)    params.kelasId    = kelasId

      const res = await api.get(`/report/export/${opt.type}`, {
        params,
        responseType: 'blob',
      })

      const url  = URL.createObjectURL(res.data)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${opt.type}-${tahunAjaranId.slice(0, 8)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${opt.label} berhasil diunduh`)
    } catch {
      toast.error(`Gagal mengunduh ${opt.label}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cetak / Export Data"
      size="md"
      footer={<Button variant="secondary" onClick={onClose}>Tutup</Button>}
    >
      <div className="p-6 space-y-5">

        {/* Filter TA */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Tahun Ajaran <span className="text-red-500">*</span>
          </label>
          <Select
            options={taOptions}
            value={tahunAjaranId}
            onChange={(e) => setTahunAjaranId(e.target.value)}
          />
        </div>

        {/* Filter Semester */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Semester</label>
          <Select
            options={semesterOptions}
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
          />
          <p className="text-xs text-gray-400">Diperlukan untuk export jadwal</p>
        </div>

        {/* Filter Kelas */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Kelas Spesifik</label>
          <Select
            options={kelasOptions}
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
          />
          <p className="text-xs text-gray-400">Diperlukan untuk export jadwal per kelas</p>
        </div>

        {/* Tombol export */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Pilih Data yang Dicetak
          </p>
          <div className="grid grid-cols-1 gap-2">
            {EXPORT_OPTIONS.map((opt) => (
              <Button
                key={opt.type}
                variant="secondary"
                className="w-full justify-start"
                leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                loading={loading === opt.type}
                onClick={() => handleExport(opt)}
              >
                {opt.label}
                {opt.needSemester && (
                  <span className="ml-auto text-[10px] text-gray-400">perlu semester</span>
                )}
                {opt.needKelas && (
                  <span className="ml-auto text-[10px] text-gray-400">perlu kelas</span>
                )}
              </Button>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  )
}

// Inline hook untuk kelas list by TA
function useKelasListByTA(tahunAjaranId: string) {
  return useQuery({
    queryKey: ['kelas-by-ta', tahunAjaranId],
    queryFn:  async () => {
      const res = await api.get('/kelas', { params: { tahunAjaranId } })
      return res.data as Array<{ id: string; namaKelas: string }>
    },
    enabled:   !!tahunAjaranId,
    staleTime: 1000 * 60 * 5,
  })
}
