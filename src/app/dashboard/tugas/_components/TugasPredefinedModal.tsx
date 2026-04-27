'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter }                    from 'next/navigation'
import { Modal }                        from '@/components/ui'
import { Button }                       from '@/components/ui'
import { Select }                       from '@/components/ui'
import { Combobox }                     from '@/components/ui/Combobox'
import { ArrowRight }                   from 'lucide-react'
import { useTahunAjaranList, useTahunAjaranOneActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran, useSemesterActive } from '@/hooks/semester/useSemester'
import { useMataPelajaranList }         from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useMateriList }                from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { TujuanTugas, BentukTugas }     from '@/types/tugas.types'

interface Props {
  open:     boolean
  onClose:  () => void
  guruId?:  string
}

export function TugasPredefinedModal({ open, onClose, guruId }: Props) {
  const router = useRouter()

  const [tahunAjaranId,   setTahunAjaranId]   = useState('')
  const [semesterId,      setSemesterId]      = useState('')
  const [mapelTingkatId,  setMapelTingkatId]  = useState('')
  const [mataPelajaranId, setMataPelajaranId] = useState('')  // exact mata pelajaran row
  const [tujuan,          setTujuan]          = useState<TujuanTugas | ''>('')
  const [bentuk,          setBentuk]          = useState<BentukTugas | ''>('')
  const [materiIds,       setMateriIds]       = useState<string[]>([]) // Multiple materi

  // ── Data ────────────────────────────────────────────────────
  const { data: taRaw } = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: taAktif }     = useTahunAjaranOneActive()
  const { data: semAktifRaw } = useSemesterActive()

  // Auto-set TA aktif + semester aktif urutan tertinggi saat modal terbuka
  useEffect(() => {
    if (!open) return
    const taId = (taAktif as any)?.id
    if (taId && !tahunAjaranId) {
      setTahunAjaranId(taId)
      const semAktifList = (semAktifRaw as any[]) ?? []
      const highest = semAktifList
        .filter((s: any) => s.tahunAjaranId === taId && s.isActive)
        .sort((a: any, b: any) => b.urutan - a.urutan)[0]
      if (highest && !semesterId) setSemesterId(highest.id)
    }
  }, [open, taAktif, semAktifRaw])

  const { data: semRaw } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = (semRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[] | undefined) ?? []

  const { data: mapelData } = useMataPelajaranList(
    semesterId ? {
      semesterId,
      ...(guruId ? { guruId } : {}),
      limit: 200,
    } : undefined,
    { enabled: !!semesterId },
  )
  const mapelList = mapelData?.data ?? []

  // MapelTingkat options (unique)
  const mapelTingkatOptions = useMemo(() => {
    const map = new Map<string, string>()
    mapelList.forEach((m) => {
      const mt = m.mataPelajaranTingkat
      if (mt?.id) map.set(mt.id, mt.masterMapel?.nama ?? mt.id)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [mapelList])

  // Kelas options filtered by mapelTingkat
  const kelasOptions = useMemo(() => {
    const filtered = mapelTingkatId
      ? mapelList.filter((m) => m.mataPelajaranTingkatId === mapelTingkatId)
      : mapelList
    return filtered.map((m) => ({
      value:    m.id,           // mataPelajaranId (row-level)
      label:    m.kelas?.namaKelas ?? m.kelasId,
      kelasId:  m.kelasId,
      kelasNama: m.kelas?.namaKelas ?? '—',
    }))
  }, [mapelList, mapelTingkatId])

  // Materi list filtered by mataPelajaranId
  const { data: materiData, isLoading: loadingMateri } = useMateriList(
    mataPelajaranId ? { mataPelajaranId, limit: 100 } : undefined,
    { enabled: !!mataPelajaranId }
  )
  const materiList = materiData?.data ?? []

  // ── Dynamic Logic ────────────────────────────────────────────
  const showMateriField = [TujuanTugas.TUGAS_HARIAN, TujuanTugas.PROYEK, TujuanTugas.PENGAYAAN].includes(tujuan as TujuanTugas)

  const bentukOptions = useMemo(() => {
    // Basic mapping constraints
    if (tujuan === TujuanTugas.UTS || tujuan === TujuanTugas.UAS) {
      return [
        { label: 'Quiz (Multiple Choice)', value: BentukTugas.QUIZ_MULTIPLE_CHOICE },
        { label: 'Quiz (Campuran)', value: BentukTugas.QUIZ_MIX },
        { label: 'File Upload (Take Home)', value: BentukTugas.FILE_SUBMISSION },
      ]
    }
    if (tujuan === TujuanTugas.PORTOFOLIO || tujuan === TujuanTugas.PROYEK) {
      return [
        { label: 'File Upload', value: BentukTugas.FILE_SUBMISSION },
        { label: 'Hybrid (Teks + File)', value: BentukTugas.HYBRID },
      ]
    }
    return [
      { label: 'File Upload', value: BentukTugas.FILE_SUBMISSION },
      { label: 'Ketik Langsung (Rich Text)', value: BentukTugas.RICH_TEXT },
      { label: 'Hybrid (Teks + File)', value: BentukTugas.HYBRID },
      { label: 'Quiz (Multiple Choice)', value: BentukTugas.QUIZ_MULTIPLE_CHOICE },
      { label: 'Quiz (Campuran)', value: BentukTugas.QUIZ_MIX },
      { label: 'Interactive Worksheet (LKS Interaktif)', value: BentukTugas.INTERACTIVE_WORKSHEET },
    ]
  }, [tujuan])

  const isComplete = !!(tahunAjaranId && semesterId && mapelTingkatId && mataPelajaranId && tujuan && bentuk)

  const handleBuat = () => {
    if (!isComplete) return

    const selectedKelas = kelasOptions.find((o) => o.value === mataPelajaranId)

    const params = new URLSearchParams({
      mataPelajaranId,
      kelasId: selectedKelas?.kelasId ?? '',
      semesterId,
      tujuan,
      bentuk,
      ...(showMateriField && materiIds.length ? { materiPelajaranIds: materiIds.join(',') } : {})
    })

    router.push(`/dashboard/tugas/buat?${params.toString()}`)
    onClose()
  }

  const handleClose = () => {
    // Reset hanya field pilihan user; TA+Semester akan di-auto-set kembali saat modal dibuka
    setTahunAjaranId('')
    setSemesterId('')
    setMapelTingkatId('')
    setMataPelajaranId('')
    setTujuan('')
    setBentuk('')
    setMateriIds([])
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Buat Tugas Baru"
      description="Tentukan konteks kelas dan bentuk tugas sebelum melanjutkan"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button disabled={!isComplete} onClick={handleBuat} rightIcon={<ArrowRight className="w-4 h-4 shrink-0" strokeWidth={2.5} />}>
            Lanjut ke Form
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

        <div className="grid grid-cols-2 gap-4">
          {/* Tahun Ajaran — locked ke TA aktif */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Ajaran</label>
            <div className="relative">
              <Select
                options={[
                  { label: tahunAjaranId ? (taList.find(t => t.id === tahunAjaranId)?.nama ?? '—') : 'Memuat...', value: tahunAjaranId },
                ]}
                value={tahunAjaranId}
                onChange={() => {}}
                disabled
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full pointer-events-none">
                Aktif
              </span>
            </div>
          </div>

          {/* Semester — locked ke semester aktif urutan tertinggi */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Semester</label>
            <div className="relative">
              <Select
                options={[
                  { label: semesterId ? (semList.find(s => s.id === semesterId)?.nama ?? '—') : 'Memuat...', value: semesterId },
                  ...semList.filter(s => s.isActive).map(s => ({ label: s.nama, value: s.id }))
                ]}
                value={semesterId}
                onChange={(e) => {
                  setSemesterId(e.target.value)
                  setMapelTingkatId('')
                  setMataPelajaranId('')
                }}
                disabled={!tahunAjaranId || semList.filter(s => s.isActive).length <= 1}
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full pointer-events-none">
                Aktif
              </span>
            </div>
          </div>
        </div>


        {/* Mata Pelajaran */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mata Pelajaran</label>
          <Combobox
            options={[{ value: '', label: 'Pilih mata pelajaran...' }, ...mapelTingkatOptions]}
            value={mapelTingkatId}
            onChange={(v) => { setMapelTingkatId(v); setMataPelajaranId('') }}
            searchOnly
            minSearchLength={0}
            placeholder="Cari mata pelajaran..."
            disabled={!semesterId}
          />
        </div>

        {/* Kelas */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kelas</label>
          <Select
            options={[
              { label: 'Pilih kelas...', value: '' },
              ...kelasOptions.map((o) => ({ label: o.label, value: o.value })),
            ]}
            value={mataPelajaranId}
            disabled={!mapelTingkatId}
            onChange={(e) => {
              setMataPelajaranId(e.target.value)
              setMateriIds([])
            }}
          />
        </div>

        <hr className="border-gray-100 dark:border-gray-800 my-2" />

        {/* Tujuan */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tujuan Tugas</label>
          <Select
            options={[
              { label: 'Pilih Tujuan...', value: '' },
              { label: 'Tugas Harian', value: TujuanTugas.TUGAS_HARIAN },
              { label: 'Pengayaan', value: TujuanTugas.PENGAYAAN },
              { label: 'Remedial', value: TujuanTugas.REMEDIAL },
              { label: 'Proyek', value: TujuanTugas.PROYEK },
              { label: 'Portofolio', value: TujuanTugas.PORTOFOLIO },
              { label: 'Praktikum', value: TujuanTugas.PRAKTIKUM },
              { label: 'UTS (Ujian Tengah Semester)', value: TujuanTugas.UTS },
              { label: 'UAS (Ujian Akhir Semester)', value: TujuanTugas.UAS },
            ]}
            value={tujuan}
            onChange={(e) => {
              setTujuan(e.target.value as TujuanTugas)
              setBentuk('')
            }}
          />
        </div>

        {/* Materi Terkait (Opsional) - Hanya muncul jika tujuan tertentu */}
        {showMateriField && mataPelajaranId && (
          <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50">
            <label className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Materi Terkait (Opsional)
            </label>
            <p className="text-[11px] text-blue-600 dark:text-blue-400">
              Anda dapat memilih lebih dari satu materi yang berkaitan dengan tugas ini.
            </p>
            {loadingMateri ? (
              <div className="text-xs text-gray-500">Memuat daftar materi...</div>
            ) : materiList.length === 0 ? (
              <div className="text-xs text-gray-500 italic">Belum ada materi untuk kelas ini.</div>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1 max-h-32 overflow-y-auto pr-2">
                {materiList.map((m) => (
                  <label key={m.id} className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={materiIds.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) setMateriIds(prev => [...prev, m.id])
                        else setMateriIds(prev => prev.filter(id => id !== m.id))
                      }}
                      className="mt-0.5 accent-blue-600 rounded"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {m.judul}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bentuk */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bentuk Tugas</label>
          <Select
            options={[
              { label: 'Pilih Bentuk...', value: '' },
              ...bentukOptions,
            ]}
            value={bentuk}
            disabled={!tujuan}
            onChange={(e) => setBentuk(e.target.value as BentukTugas)}
          />
        </div>

      </div>
    </Modal>
  )
}
