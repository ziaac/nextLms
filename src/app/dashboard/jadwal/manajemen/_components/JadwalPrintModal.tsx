'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useKelasList } from '@/hooks/kelas/useKelas'
import { useGuruList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import {
  useExportJadwalSekolah,
  useExportJadwalKelas,
  useExportJadwalGuru,
} from '@/hooks/jadwal/useJadwal'
import { Download, School, Users, User } from 'lucide-react'

type JenisExport = 'sekolah' | 'kelas' | 'guru'
interface TaOption { id: string; nama: string }

interface Props {
  open: boolean; onClose: () => void
  taList: TaOption[]; defaultTaId: string; defaultSemesterId: string
}

export function JadwalPrintModal({ open, onClose, taList, defaultTaId, defaultSemesterId }: Props) {
  const [taId, setTaId]             = useState(defaultTaId)
  const [semesterId, setSemesterId] = useState(defaultSemesterId)
  const [tingkatId, setTingkatId]   = useState('')
  const [kelasId, setKelasId]       = useState('')
  const [guruId, setGuruId]         = useState('')
  const [jenis, setJenis]           = useState<JenisExport>('sekolah')

  const { data: semesterListRaw } = useSemesterByTahunAjaran(taId || null)
  const { data: tingkatListRaw }  = useTingkatKelasList()

  // Kelas hanya di-fetch kalau TA & tingkat sudah dipilih
  const { data: kelasListRaw } = useKelasList(
    taId && tingkatId
      ? { tahunAjaranId: taId, tingkatKelasId: tingkatId }
      : undefined,
  )
  const { data: guruListRaw } = useGuruList()

  const exportSekolah = useExportJadwalSekolah()
  const exportKelas   = useExportJadwalKelas()
  const exportGuru    = useExportJadwalGuru()
  const isLoading = exportSekolah.isPending || exportKelas.isPending || exportGuru.isPending

  const canDownload = useMemo(() => {
    if (!semesterId) return false
    if (jenis === 'kelas' && !kelasId) return false
    if (jenis === 'guru'  && !guruId)  return false
    return true
  }, [semesterId, jenis, kelasId, guruId])

  const handleDownload = async () => {
    if (!canDownload) return
    try {
      if (jenis === 'sekolah') {
        await exportSekolah.mutateAsync(semesterId)
        toast.success('Export jadwal sekolah berhasil')
      } else if (jenis === 'kelas') {
        await exportKelas.mutateAsync({ semesterId, kelasId })
        toast.success('Export jadwal kelas berhasil')
      } else {
        await exportGuru.mutateAsync({ semesterId, guruId: guruId || undefined })
        toast.success('Export jadwal guru berhasil')
      }
      onClose()
    } catch { toast.error('Gagal export jadwal') }
  }

  const semArr     = (semesterListRaw as unknown as { id: string; nama: string; isActive: boolean }[] | undefined) ?? []
  const tingkatArr = (tingkatListRaw  as unknown as { id: string; nama: string }[] | undefined) ?? []
  const kelasArr   = (kelasListRaw    as unknown as { id: string; namaKelas: string }[] | undefined) ?? []
  const guruArr    = (guruListRaw     as unknown as { id: string; profile: { namaLengkap: string } }[] | undefined) ?? []

  const taOptions   = taList.map((t) => ({ label: t.nama, value: t.id }))
  const smtOptions  = semArr.map((s) => ({ label: s.nama + (s.isActive ? ' (Aktif)' : ''), value: s.id }))
  const tingkatOpts = [
    { label: '— Pilih Tingkat —', value: '' },
    ...tingkatArr.map((t) => ({ label: 'Kelas ' + t.nama, value: t.id })),
  ]
  const kelasOpts = [
    { label: '— Pilih Kelas —', value: '' },
    ...kelasArr.map((k) => ({ label: k.namaKelas, value: k.id })),
  ]
  const guruOpts = [
    { label: '— Pilih Guru —', value: '' },
    ...guruArr.map((g) => ({ label: g.profile.namaLengkap, value: g.id })),
  ]

  return (
    <Modal open={open} onClose={onClose} title="Cetak / Export Jadwal" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={handleDownload} disabled={!canDownload || isLoading}>
            {isLoading
              ? <><Spinner />&nbsp;Loading...</>
              : <><Download className="h-4 w-4 mr-1.5" />Download Excel</>
            }
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">
        {/* Jenis Export */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jenis Export</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'sekolah', label: 'Jadwal Sekolah', Icon: School },
              { value: 'kelas',   label: 'Per Kelas',      Icon: Users  },
              { value: 'guru',    label: 'Per Guru',        Icon: User   },
            ] as { value: JenisExport; label: string; Icon: React.ElementType }[]).map(({ value, label, Icon }) => (
              <button key={value} type="button" onClick={() => { setJenis(value); setKelasId('') }}
                className={
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-xs font-medium transition-colors ' +
                  (jenis === value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400')
                }>
                <Icon className="h-5 w-5" />{label}
              </button>
            ))}
          </div>
        </div>

        {/* TA & Semester */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <Select options={taOptions} value={taId}
              onChange={(e) => { setTaId(e.target.value); setSemesterId(''); setKelasId(''); setTingkatId('') }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Semester <span className="text-red-500">*</span>
            </label>
            <Select
              options={[{ label: '— Pilih Semester —', value: '' }, ...smtOptions]}
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
            />
          </div>
        </div>

        {/* Tingkat — wajib untuk jenis kelas */}
        {(jenis === 'sekolah' || jenis === 'kelas') && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tingkat
              {jenis === 'kelas'
                ? <span className="text-red-500 ml-0.5">*</span>
                : <span className="text-xs text-gray-400 ml-1">(opsional)</span>
              }
            </label>
            <Select
              options={tingkatOpts}
              value={tingkatId}
              onChange={(e) => { setTingkatId(e.target.value); setKelasId('') }}
            />
          </div>
        )}

        {/* Kelas — hanya tampil jika tingkat dipilih */}
        {jenis === 'kelas' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kelas <span className="text-red-500">*</span>
            </label>
            {!tingkatId ? (
              <p className="text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                ⚠ Pilih tingkat terlebih dahulu untuk menampilkan daftar kelas.
              </p>
            ) : (
              <Select
                options={kelasOpts}
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
              />
            )}
          </div>
        )}

        {/* Guru */}
        {jenis === 'guru' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Guru <span className="text-red-500">*</span>
            </label>
            <Select options={guruOpts} value={guruId}
              onChange={(e) => setGuruId(e.target.value)} />
          </div>
        )}
      </div>
    </Modal>
  )
}
