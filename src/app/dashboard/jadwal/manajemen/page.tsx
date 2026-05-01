'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAuthStore }              from '@/stores/auth.store'
import { isManajemen }               from '@/lib/helpers/role'
import { useTahunAjaranList }        from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }  from '@/hooks/semester/useSemester'
import { useTingkatKelasList }       from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useQueryClient }            from '@tanstack/react-query'
import { useRingkasanKelasLengkap }  from '@/hooks/jadwal/useRingkasanKelasLengkap'
import { PageHeader, Button }        from '@/components/ui'
import { Copy, Printer }             from 'lucide-react'
import { JadwalFilterBar }           from './_components/JadwalFilterBar'
import { KelasRingkasanTable }       from './_components/KelasRingkasanTable'
import { JadwalPrintModal }          from './_components/JadwalPrintModal'
import { CopySemesterModal }         from './_components/CopySemesterModal'
import { ManajemenPageSkeleton }     from './_components/ManajemenPageSkeleton'
import type { RingkasanKelasItem }   from '@/types/jadwal.types'

export default function JadwalManajemenPage() {
  const { user }   = useAuthStore()
  const bolehAkses = isManajemen(user?.role)

  const [selectedTaId,       setSelectedTaId]   = useState<string>('')
  const [selectedSemesterId, setSelectedSemId]  = useState<string>('')
  const [selectedTingkatId,  setSelectedTingkat]= useState<string>('')
  const [printOpen, setPrintOpen] = useState(false)
  const [copyOpen,  setCopyOpen]  = useState(false)

  const queryClient = useQueryClient()

  // ── Tahun Ajaran ────────────────────────────────────────────────────
  const { data: taListRaw, isLoading: loadingTa } = useTahunAjaranList()
  const taList = (taListRaw as unknown as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  useEffect(() => {
    if (selectedTaId || !taList.length) return
    const aktif = taList.find((t) => t.isActive) ?? taList[0]
    if (aktif) setSelectedTaId(aktif.id)
  }, [taList, selectedTaId])

  // ── Semester ────────────────────────────────────────────────────────
  const { data: semesterListRaw, isLoading: loadingSmt } =
    useSemesterByTahunAjaran(selectedTaId || null)
          const semesterList =
            (semesterListRaw as unknown as { id: string; nama: string; isActive: boolean; urutan: number }[] | undefined) ?? []
          useEffect(() => {
            if (!semesterList.length) return
            const aktifList = semesterList.filter((s) => s.isActive)
            const aktif = aktifList.length > 1
              ? aktifList.reduce((a, b) => (b.urutan > a.urutan ? b : a))  // urutan tertinggi = GENAP
              : aktifList[0] ?? semesterList[semesterList.length - 1]       // fallback: semester terakhir
            if (aktif && selectedSemesterId !== aktif.id) setSelectedSemId(aktif.id)
          // Intentional: selectedSemesterId dan setSelectedSemId dikeluarkan dari deps.
          // Effect ini hanya perlu berjalan saat daftar semester berubah (TA baru dipilih).
          // Menambahkan selectedSemesterId akan menyebabkan loop karena effect mengubah nilai tersebut.
          // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [semesterList])

  // Reset semester & tingkat saat TA berubah
  const handleTaChange = (id: string) => {
    setSelectedTaId(id)
    setSelectedSemId('')
    setSelectedTingkat('')
  }

  // Reset tingkat saat semester berubah
  const handleSemChange = (id: string) => {
    setSelectedSemId(id)
    setSelectedTingkat('')
  }

  // ── Tingkat ─────────────────────────────────────────────────────────
  const { data: tingkatListRaw } = useTingkatKelasList()
  const tingkatList =
    (tingkatListRaw as unknown as { id: string; nama: string }[] | undefined) ?? []

  // ── Data utama — endpoint baru (semua kelas) ─────────────────────
  const ringkasanParams = useMemo(() => {
    if (!selectedSemesterId) return null
    return {
      semesterId:      selectedSemesterId,
      ...(selectedTingkatId ? { tingkatKelasId: selectedTingkatId } : {}),
    }
  }, [selectedSemesterId, selectedTingkatId])

  const {
    data:       ringkasanRaw,
    isLoading:  loadingRingkasan,
    refetch,
  } = useRingkasanKelasLengkap(ringkasanParams)

  const ringkasanList = (ringkasanRaw as RingkasanKelasItem[] | undefined) ?? []

  // ── Info label ───────────────────────────────────────────────────
  const selectedTingkatNama = useMemo(
    () => tingkatList.find((t) => t.id === selectedTingkatId)?.nama ?? '',
    [tingkatList, selectedTingkatId],
  )

  // ── Access & loading guard ────────────────────────────────────────
  const isInitialLoad = !user || (loadingTa && !taList.length)
  if (isInitialLoad) return <ManajemenPageSkeleton />

  if (!bolehAkses) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jadwal Pelajaran"
        description="Kelola jadwal pelajaran per kelas untuk setiap semester"
        actions={
          <>
            <Button variant="secondary" leftIcon={<Copy size={16} />} onClick={() => setCopyOpen(true)}>
              Copy dari Semester Lalu
            </Button>
            <Button variant="secondary" leftIcon={<Printer size={16} />} onClick={() => setPrintOpen(true)}>
              Cetak / Export
            </Button>
          </>
        }
      />

      <JadwalFilterBar
        taList={taList}
        selectedTaId={selectedTaId}
        onTaChange={handleTaChange}
        semesterList={semesterList}
        selectedSemesterId={selectedSemesterId}
        onSemesterChange={handleSemChange}
        tingkatList={tingkatList}
        selectedTingkatId={selectedTingkatId}
        onTingkatChange={setSelectedTingkat}
      />

      {/* Wajib pilih semester dulu */}
      {!selectedSemesterId ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <p className="text-sm font-medium">Pilih Tahun Ajaran dan Semester untuk menampilkan data</p>
          <p className="text-xs">Filter di atas wajib diisi sebelum data ditampilkan</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 -mt-3">
            Menampilkan{' '}
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {ringkasanList.length} kelas
            </span>
            {selectedTingkatNama && (
              <> · Tingkat <span className="font-medium">{selectedTingkatNama}</span></>
            )}
            {' · '}{taList.find((t) => t.id === selectedTaId)?.nama}
            {' · '}{semesterList.find((s) => s.id === selectedSemesterId)?.nama}
          </p>

          <KelasRingkasanTable
            data={ringkasanList}
            isLoading={loadingRingkasan || loadingSmt}
            semesterId={selectedSemesterId}
            onRefresh={() => { void refetch() }}
          />
        </>
      )}

      <JadwalPrintModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        taList={taList}
        defaultTaId={selectedTaId}
        defaultSemesterId={selectedSemesterId}
      />
      <CopySemesterModal
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        taList={taList}
              onSuccess={(targetSemesterId) => {
                setCopyOpen(false)
                setSelectedSemId(targetSemesterId)
                void queryClient.invalidateQueries({ queryKey: ['jadwal'] })
              }}  
              />
    </div>
  )
}
