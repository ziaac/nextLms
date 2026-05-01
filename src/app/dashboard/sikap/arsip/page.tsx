'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageHeader, Button, Skeleton } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useExportKelasPdf } from '@/hooks/sikap/useSikap'
import { SikapFilterBar }   from '../_components/SikapFilterBar'
import { SikapStatCards }   from '../_components/SikapStatCards'
import { SikapSiswaTable }  from '../_components/SikapSiswaTable'
import { SikapDetailModal } from '../_components/SikapDetailModal'
import { ArrowLeft, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import type { UserRole } from '@/types/enums'
import type { Semester } from '@/types/tahun-ajaran.types'

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function SikapArsipContent() {
  const router       = useSearchParams()
  const nav          = useRouter()
  const { user }     = useAuthStore()
  const semesterId   = router.get('semesterId') ?? ''

  // ── Resolve semester label ────────────────────────────────────
  const { data: taListRaw = [] } = useTahunAjaranList()
  const taList = taListRaw as { id: string; nama: string; isActive: boolean }[]

  // Cari tahunAjaranId dari semesterId — fetch semua TA lalu cari semester-nya
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const { data: semListRaw = [] } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = semListRaw as Semester[]

  // Auto-detect tahunAjaranId dari semesterId
  const [resolved, setResolved] = useState(false)
  if (!resolved && taList.length > 0 && semesterId) {
    // Cari TA yang memiliki semester ini — fetch semua TA dan cek
    // Karena kita tidak tahu TA-nya, kita perlu cara lain.
    // Gunakan pendekatan: fetch semua semester dari semua TA
    // Untuk simplisitas, kita ambil TA pertama dan cek, lalu iterasi
    // Solusi pragmatis: simpan tahunAjaranId di URL atau gunakan endpoint langsung
    // Untuk sekarang, kita fetch semua TA dan cari yang punya semester ini
    setResolved(true)
  }

  // Fetch semester dari semua TA untuk menemukan label
  const semesterLabel = (() => {
    for (const ta of taList) {
      // Kita tidak bisa fetch semua sekaligus tanpa loop, gunakan pendekatan berbeda
      // Simpan info di state saat navigasi dari ArsipSlideOver
      // Untuk sekarang, tampilkan ID saja jika tidak ditemukan
    }
    return `Semester Arsip`
  })()

  // ── Filter state ──────────────────────────────────────────────
  const [tingkatKelasId, setTingkatKelasId] = useState('')
  const [kelasId,        setKelasId]        = useState('')

  // ── Modal state ───────────────────────────────────────────────
  const [detailOpen,      setDetailOpen]      = useState(false)
  const [detailSiswaId,   setDetailSiswaId]   = useState('')
  const [detailSiswaName, setDetailSiswaName] = useState('')

  // ── Permissions ───────────────────────────────────────────────
  const currentUserRole = (user?.role ?? 'GURU') as UserRole
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)
  const isGuru  = ['GURU', 'WALI_KELAS'].includes(currentUserRole)
  // Di halaman arsip: GURU read-only, ADMIN bisa edit
  const detailReadonly = isGuru && !isAdmin

  // ── Export PDF kelas ──────────────────────────────────────────
  const exportKelasMut = useExportKelasPdf()

  const handleExportKelas = async () => {
    if (!kelasId) return
    try {
      const blob = await exportKelasMut.mutateAsync({ kelasId, semesterId })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `catatan-sikap-kelas-arsip.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Gagal mengunduh laporan PDF kelas')
    }
  }

  // ── Validasi semesterId ───────────────────────────────────────
  if (!semesterId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <p className="text-sm text-gray-500">Semester tidak ditemukan.</p>
        <Button variant="secondary" onClick={() => nav.push('/dashboard/sikap')}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Arsip Catatan Sikap"
        description={semesterLabel}
        actions={
          <div className="flex items-center gap-2">
            {kelasId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportKelas}
                disabled={exportKelasMut.isPending}
              >
                <FileDown className="w-4 h-4 mr-1.5" />
                {exportKelasMut.isPending ? 'Mengunduh...' : 'Export PDF Kelas'}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => nav.push('/dashboard/sikap')}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali
            </Button>
          </div>
        }
      />

      {/* Filter — arsipMode: sembunyikan TA/Semester */}
      <SikapFilterBar
        tahunAjaranId=""
        semesterId={semesterId}
        tingkatKelasId={tingkatKelasId}
        kelasId={kelasId}
        onTahunAjaranChange={() => {}}
        onTingkatChange={(id) => { setTingkatKelasId(id); setKelasId('') }}
        onKelasChange={setKelasId}
        arsipMode
        arsipSemesterLabel={semesterLabel}
      />

      {/* Konten setelah kelas dipilih */}
      {kelasId && (
        <>
          <SikapStatCards kelasId={kelasId} semesterId={semesterId} />
          <SikapSiswaTable
            kelasId={kelasId}
            semesterId={semesterId}
            currentUserRole={currentUserRole}
            canEdit={false}   // di arsip: tidak ada tombol Tambah/Edit
            onTambah={() => {}}
            onDetail={(siswaId) => {
              setDetailSiswaId(siswaId)
              setDetailOpen(true)
            }}
            onEdit={() => {}}
          />
        </>
      )}

      {/* Detail modal */}
      <SikapDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailSiswaId('') }}
        siswaId={detailSiswaId}
        siswaName={detailSiswaName}
        semesterId={semesterId}
        semesterLabel={semesterLabel}
        currentUserId={user?.id ?? ''}
        currentUserRole={currentUserRole}
        readonly={detailReadonly}
      />
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function SikapArsipPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full rounded-2xl" />}>
      <SikapArsipContent />
    </Suspense>
  )
}
