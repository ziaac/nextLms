'use client'

import { useState, useMemo, useEffect }         from 'react'
import { useRouter }                            from 'next/navigation'
import { Modal }                                from '@/components/ui'
import { Button }                               from '@/components/ui'
import { Select }                               from '@/components/ui'
import { Combobox }                             from '@/components/ui/Combobox'
import { ArrowRight }                           from 'lucide-react'
import { useTahunAjaranList, useTahunAjaranOneActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran, useSemesterActive } from '@/hooks/semester/useSemester'
import { useMataPelajaranList }                 from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useGuruList }                          from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { MateriPredefinedData }            from '@/types/materi-pelajaran.types'

interface Props {
  open:     boolean
  onClose:  () => void
  isAdmin:  boolean
  guruId?:  string   // logged-in guru ID (guru mode)
  gurNama?: string   // logged-in guru name
}

export function PredefinedDataModal({ open, onClose, isAdmin, guruId, gurNama }: Props) {
  const router = useRouter()

  // Admin: pick guru
  const [selectedGuruId,  setSelectedGuruId]  = useState(guruId ?? '')
  const [tahunAjaranId,   setTahunAjaranId]   = useState('')
  const [semesterId,      setSemesterId]       = useState('')
  const [mapelTingkatId,  setMapelTingkatId]  = useState('')
  const [mataPelajaranId, setMataPelajaranId] = useState('')  // exact mata pelajaran row
  const [kelasId,         setKelasId]         = useState('')

  // ── Data ────────────────────────────────────────────────────
  const { data: guruRaw } = useGuruList()
  const guruOptions = useMemo(() =>
    (guruRaw ?? []).map((g) => ({
      value: g.id,
      label: g.profile?.namaLengkap ?? g.username ?? g.id,
    })),
  [guruRaw])

  const { data: taRaw }    = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: taAktif }     = useTahunAjaranOneActive()
  const { data: semAktifRaw } = useSemesterActive()

  // Auto-set TA aktif + semester aktif urutan tertinggi (hanya untuk mode guru)
  useEffect(() => {
    if (!open || isAdmin) return
    const taId = (taAktif as any)?.id
    if (taId && !tahunAjaranId) {
      setTahunAjaranId(taId)
      const semAktifList = (semAktifRaw as any[]) ?? []
      const highest = semAktifList
        .filter((s: any) => s.tahunAjaranId === taId && s.isActive)
        .sort((a: any, b: any) => b.urutan - a.urutan)[0]
      if (highest && !semesterId) setSemesterId(highest.id)
    }
  }, [open, taAktif, semAktifRaw, isAdmin])

  const { data: semRaw } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = (semRaw as { id: string; nama: string; isActive?: boolean; urutan?: number }[] | undefined) ?? []

  const activeGuruId = isAdmin ? selectedGuruId : (guruId ?? '')

  const { data: mapelData } = useMataPelajaranList(
    semesterId ? {
      semesterId,
      ...(activeGuruId ? { guruId: activeGuruId } : {}),
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

  // ── Computed labels ──────────────────────────────────────────
  const selectedTA   = taList.find((t) => t.id === tahunAjaranId)
  const selectedSem  = semList.find((s) => s.id === semesterId)
  const selectedMT   = mapelTingkatOptions.find((o) => o.value === mapelTingkatId)
  const selectedKelas = kelasOptions.find((o) => o.value === mataPelajaranId)
  const selectedMapelRow = mapelList.find((m) => m.id === mataPelajaranId)

  // Find tingkat name from mapelList
  const tingkatNama = selectedMapelRow?.mataPelajaranTingkat?.tingkatKelas?.nama ?? ''

  const isComplete = !!(tahunAjaranId && semesterId && mapelTingkatId && mataPelajaranId)

  const handleBuat = () => {
    if (!isComplete) return

    const data: MateriPredefinedData = {
      ...(isAdmin && selectedGuruId
        ? {
            guruId:   selectedGuruId,
            guruNama: guruOptions.find((g) => g.value === selectedGuruId)?.label,
          }
        : {
            guruId:   guruId,
            guruNama: gurNama,
          }
      ),
      tahunAjaranId,
      tahunAjaranNama:        selectedTA?.nama ?? '',
      semesterId,
      semesterNama:           selectedSem?.nama ?? '',
      mataPelajaranTingkatId: mapelTingkatId,
      mapelNama:              selectedMT?.label ?? '',
      tingkatNama,
      mataPelajaranId,
      kelasId:                selectedKelas?.kelasId ?? '',
      kelasNama:              selectedKelas?.kelasNama ?? '',
    }

    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(data).filter(([, v]) => v != null && v !== '') as [string, string][]
      )
    )

    router.push(`/dashboard/materi-pelajaran/buat?${params.toString()}`)
    onClose()
  }

  const handleClose = () => {
    setSelectedGuruId(guruId ?? '')
    setTahunAjaranId('')
    setSemesterId('')
    setMapelTingkatId('')
    setMataPelajaranId('')
    setKelasId('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Buat Materi Baru"
      description="Pilih mata pelajaran dan kelas sebelum membuat materi"
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
      <div className="p-6 space-y-4">

        {/* Guru (admin only) */}
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guru</label>
            <Combobox
              options={[{ value: '', label: 'Pilih guru...' }, ...guruOptions]}
              value={selectedGuruId}
              onChange={(v) => {
                setSelectedGuruId(v)
                setMapelTingkatId('')
                setMataPelajaranId('')
              }}
              searchOnly
              minSearchLength={0}
              placeholder="Cari nama guru..."
            />
          </div>
        )}

        {/* Tahun Ajaran */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Ajaran</label>
          {/* Guru: locked ke TA aktif. Admin: bisa pilih bebas */}
          {isAdmin ? (
            <Select
              options={[
                { label: 'Pilih tahun ajaran...', value: '' },
                ...taList.map((t) => ({ label: t.nama, value: t.id })),
              ]}
              value={tahunAjaranId}
              onChange={(e) => {
                setTahunAjaranId(e.target.value)
                setSemesterId('')
                setMapelTingkatId('')
                setMataPelajaranId('')
              }}
            />
          ) : (
            <div className="relative">
              <Select
                options={[{ label: tahunAjaranId ? (taList.find(t => t.id === tahunAjaranId)?.nama ?? '—') : 'Memuat...', value: tahunAjaranId }]}
                value={tahunAjaranId}
                onChange={() => {}}
                disabled
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full pointer-events-none">Aktif</span>
            </div>
          )}
        </div>

        {/* Semester */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Semester</label>
          {isAdmin ? (
            <Select
              options={[
                { label: 'Pilih semester...', value: '' },
                ...semList.map((s) => ({ label: s.nama, value: s.id })),
              ]}
              value={semesterId}
              disabled={!tahunAjaranId}
              onChange={(e) => {
                setSemesterId(e.target.value)
                setMapelTingkatId('')
                setMataPelajaranId('')
              }}
            />
          ) : (
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
              <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full pointer-events-none">Aktif</span>
            </div>
          )}
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
            onChange={(e) => setMataPelajaranId(e.target.value)}
          />
        </div>

      </div>
    </Modal>
  )
}
