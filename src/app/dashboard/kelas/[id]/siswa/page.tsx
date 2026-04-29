'use client'

import { useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Upload, Copy, Hash, GraduationCap } from 'lucide-react'
import { PageHeader, Button, SearchInput, Select } from '@/components/ui'
import { useKelasById } from '@/hooks/kelas/useKelas'
import { useSiswaByKelas, useGenerateNomorAbsen } from '@/hooks/kelas/useKelasSiswa'
import { KelasInfoCards } from './_components/KelasInfoCards'
import { KelasSiswaTable } from './_components/KelasSiswaTable'
import { TambahSiswaModal } from './_components/TambahSiswaModal'
import { TambahSiswaBulkModal } from './_components/TambahSiswaBulkModal'
import { MutasiSiswaModal } from './_components/MutasiSiswaModal'
import { SiswaDetailPanel } from './_components/SiswaDetailPanel'
import { CopySiswaModal } from './_components/CopySiswaModal'
import { StatusAkhirTahunModal } from './_components/StatusAkhirTahunModal'
import { ProsesAkhirTahunModal } from './_components/ProsesAkhirTahunModal'
import { ExportSiswaButton } from './_components/ExportSiswaButton'
import { StatusSiswa } from '@/types/kelas.types'
import type { KelasSiswa } from '@/types/kelas.types'
import { useAuthStore } from '@/stores/auth.store'
import { isGuru } from '@/lib/helpers/role'

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  { label: 'Aktif', value: StatusSiswa.AKTIF },
  { label: 'Pindah', value: StatusSiswa.PINDAH },
  { label: 'Keluar', value: StatusSiswa.KELUAR },
  { label: 'Lulus', value: StatusSiswa.LULUS },
  { label: 'DO', value: StatusSiswa.DO },
  { label: 'Mengundurkan Diri', value: StatusSiswa.MENGUNDURKAN_DIRI },
]

export default function KelasSiswaPage() {
  const params  = useParams<{ id: string }>()
  const router  = useRouter()
  const kelasId = params.id
  const { user } = useAuthStore()
  const isGuruRole = isGuru(user?.role)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tambahOpen, setTambahOpen]   = useState(false)
  const [bulkOpen, setBulkOpen]       = useState(false)
  const [copyOpen, setCopyOpen]       = useState(false)
  const [mutasiTarget, setMutasiTarget]               = useState<KelasSiswa | null>(null)
  const [statusAkhirTahunTarget, setStatusAkhirTahunTarget] = useState<KelasSiswa | null>(null)
  const [prosesAkhirTahunOpen, setProsesAkhirTahunOpen]     = useState(false)
  const [detailTarget, setDetailTarget] = useState<KelasSiswa | null>(null)

  const { data: kelasData, isLoading: loadingKelas } = useKelasById(kelasId)
  const { data: siswaData, isLoading: loadingSiswa } = useSiswaByKelas(kelasId)
  const allSiswa = siswaData ?? []
  const generateAbsen = useGenerateNomorAbsen(kelasId)

  const filteredSiswa = allSiswa.filter((ks) => {
    const matchSearch = search === '' ||
      ks.siswa.profile.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
      (ks.siswa.profile.nisn ?? '').includes(search)
    const matchStatus = statusFilter === '' || ks.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ExportSiswaButton kelasId={kelasId} namaKelas={kelasData?.namaKelas ?? ""} />
            {!isGuruRole && (
              <>
                <Button size="sm" variant="secondary" leftIcon={<GraduationCap size={14} />}
                  onClick={() => setProsesAkhirTahunOpen(true)}>
                  <span className="hidden sm:inline">Status Akhir Tahun</span>
                  <span className="sm:hidden">Akhir Tahun</span>
                </Button>
                <Button size="sm" variant="secondary" leftIcon={<Copy size={14} />} onClick={() => setCopyOpen(true)}>
                  <span className="hidden sm:inline">Salin dari TA Lalu</span>
                </Button>
                <Button size="sm" variant="secondary" leftIcon={<Upload size={14} />} onClick={() => setBulkOpen(true)}>
                  <span className="hidden sm:inline">Tambah Bulk</span>
                </Button>
                <Button size="sm" variant="secondary" leftIcon={<Hash size={14} />}
                  loading={generateAbsen.isPending}
                  onClick={() => generateAbsen.mutate()}>
                  <span className="hidden sm:inline">Nomor Absen A-Z</span>
                  <span className="sm:hidden">Absen</span>
                </Button>
                <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setTambahOpen(true)}>
                  Tambah Siswa
                </Button>
              </>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {loadingKelas ? 'Memuat...' : `Daftar Siswa — ${kelasData?.namaKelas ?? ''}`}
          </h1>
          {kelasData && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {kelasData.tahunAjaran.nama} · {kelasData.tingkatKelas.nama}
            </p>
          )}
        </div>
      </div>

      <KelasInfoCards kelas={kelasData ?? null} siswaList={allSiswa} />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchInput placeholder="Cari nama / NISN siswa..." value={search} onChange={setSearch} />
        </div>
        <div className="w-full sm:w-52">
          <Select options={STATUS_OPTIONS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 md:p-6">
        <KelasSiswaTable
          data={filteredSiswa}
          isLoading={loadingSiswa}
          activeId={detailTarget?.id}
          kelasId={kelasId}
          onRowClick={(ks) => setDetailTarget(ks)}
          onMutasi={(ks) => setMutasiTarget(ks)}
          onStatusAkhirTahun={(ks) => setStatusAkhirTahunTarget(ks)}
          readOnly={isGuruRole}
        />
      </div>

      <TambahSiswaModal open={tambahOpen} onClose={() => setTambahOpen(false)} kelasId={kelasId} tahunAjaranId={kelasData?.tahunAjaranId ?? ''} />
      <TambahSiswaBulkModal open={bulkOpen} onClose={() => setBulkOpen(false)} kelasId={kelasId} tahunAjaranId={kelasData?.tahunAjaranId ?? ''} />
      <CopySiswaModal open={copyOpen} onClose={() => setCopyOpen(false)} kelasId={kelasId} namaKelas={kelasData?.namaKelas ?? ''} tahunAjaranId={kelasData?.tahunAjaranId ?? ''} />
      <StatusAkhirTahunModal
        open={!!statusAkhirTahunTarget}
        onClose={() => setStatusAkhirTahunTarget(null)}
        kelasSiswa={statusAkhirTahunTarget}
        kelasId={kelasId}
        tingkatNama={kelasData?.tingkatKelas.nama ?? ''}
      />
      <ProsesAkhirTahunModal
        open={prosesAkhirTahunOpen}
        onClose={() => setProsesAkhirTahunOpen(false)}
        kelasId={kelasId}
        namaKelas={kelasData?.namaKelas ?? ''}
        tingkatNama={kelasData?.tingkatKelas.nama ?? ''}
        jumlahSiswa={allSiswa.length}
      />
      <MutasiSiswaModal open={!!mutasiTarget} onClose={() => setMutasiTarget(null)} kelasSiswa={mutasiTarget} kelasId={kelasId} />
      <SiswaDetailPanel kelasSiswa={detailTarget} onClose={() => setDetailTarget(null)} onMutasi={(ks) => { setDetailTarget(null); setMutasiTarget(ks) }} readOnly={isGuruRole} />
    </div>
  )
}
