'use client'

import { useState, useEffect } from 'react'
import { PageHeader, Button } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useExportKelasPdf } from '@/hooks/sikap/useSikap'
import { SikapFilterBar }      from './SikapFilterBar'
import { SikapStatCards }      from './SikapStatCards'
import { SikapSiswaTable }     from './SikapSiswaTable'
import { SikapDetailModal }    from './SikapDetailModal'
import { SikapFormModal }      from './SikapFormModal'
import { SikapArsipSlideOver } from './SikapArsipSlideOver'
import { toast } from 'sonner'
import { Archive, FileDown } from 'lucide-react'
import type { UserRole } from '@/types/enums'
import type { Semester } from '@/types/tahun-ajaran.types'

interface SikapKelasViewProps {
  currentUserId:   string
  currentUserRole: UserRole
  canEdit:         boolean   // GURU, WALI_KELAS, SUPER_ADMIN, ADMIN
  canEditAll:      boolean   // SUPER_ADMIN, ADMIN
}

export function SikapKelasView({
  currentUserId,
  currentUserRole,
  canEdit,
  canEditAll,
}: SikapKelasViewProps) {
  // ── Filter state ──────────────────────────────────────────────
  const [tahunAjaranId,  setTahunAjaranId]  = useState('')
  const [semesterId,     setSemesterId]     = useState('')
  const [tingkatKelasId, setTingkatKelasId] = useState('')
  const [kelasId,        setKelasId]        = useState('')

  // ── Modal state ───────────────────────────────────────────────
  const [arsipOpen,       setArsipOpen]       = useState(false)
  const [formOpen,        setFormOpen]        = useState(false)
  const [formSiswaId,     setFormSiswaId]     = useState('')
  const [formSiswaName,   setFormSiswaName]   = useState('')
  const [detailOpen,      setDetailOpen]      = useState(false)
  const [detailSiswaId,   setDetailSiswaId]   = useState('')
  const [detailSiswaName, setDetailSiswaName] = useState('')
  const [detailReadonly,  setDetailReadonly]  = useState(false)

  // ── Auto-init tahun ajaran aktif ──────────────────────────────
  const { data: taListRaw = [] } = useTahunAjaranList()
  const taList = taListRaw as { id: string; nama: string; isActive: boolean }[]

  const { data: semListRaw = [] } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = semListRaw as Semester[]

  useEffect(() => {
    if (tahunAjaranId || taList.length === 0) return
    const aktif = taList.find((t) => t.isActive) ?? taList[0]
    if (aktif) setTahunAjaranId(aktif.id)
  }, [taList, tahunAjaranId])

  useEffect(() => {
    if (!tahunAjaranId || semList.length === 0 || semesterId) return
    const aktif = semList.find((s) => s.isActive) ?? semList[0]
    if (aktif) setSemesterId(aktif.id)
  }, [semList, tahunAjaranId, semesterId])

  // ── Semester label ────────────────────────────────────────────
  const semesterLabel = (() => {
    const sem = semList.find((s) => s.id === semesterId)
    const ta  = taList.find((t) => t.id === tahunAjaranId)
    if (!sem || !ta) return undefined
    return `Semester ${sem.nama === 'GANJIL' ? 'Ganjil' : 'Genap'} ${ta.nama}`
  })()

  // ── Export PDF kelas ──────────────────────────────────────────
  const exportKelasMut = useExportKelasPdf()

  const handleExportKelas = async () => {
    if (!kelasId) return
    try {
      const blob = await exportKelasMut.mutateAsync({ kelasId, semesterId })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `catatan-sikap-kelas.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Gagal mengunduh laporan PDF kelas')
    }
  }

  // ── Handlers ──────────────────────────────────────────────────
  const handleTahunAjaranChange = (newTaId: string, newSemId: string) => {
    setTahunAjaranId(newTaId)
    setSemesterId(newSemId)
    setTingkatKelasId('')
    setKelasId('')
  }

  const handleTingkatChange = (newTingkatId: string) => {
    setTingkatKelasId(newTingkatId)
    setKelasId('')
  }

  const handleKelasChange = (newKelasId: string) => {
    setKelasId(newKelasId)
  }

  const handleTambah = (siswaId: string, siswaName?: string) => {
    setFormSiswaId(siswaId)
    setFormSiswaName(siswaName ?? '')
    setFormOpen(true)
  }

  const handleDetail = (siswaId: string, readonly: boolean) => {
    setDetailSiswaId(siswaId)
    setDetailReadonly(readonly)
    setDetailOpen(true)
  }

  const handleEdit = (siswaId: string) => {
    setDetailSiswaId(siswaId)
    setDetailReadonly(false)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catatan Sikap"
        description="Kelola catatan sikap siswa per kelas dan semester."
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
              onClick={() => setArsipOpen(true)}
            >
              <Archive className="w-4 h-4 mr-1.5" />
              Arsip
            </Button>
          </div>
        }
      />

      {/* Filter — TA+Semester dikunci ke yang aktif */}
      <SikapFilterBar
        tahunAjaranId={tahunAjaranId}
        semesterId={semesterId}
        tingkatKelasId={tingkatKelasId}
        kelasId={kelasId}
        onTahunAjaranChange={handleTahunAjaranChange}
        onTingkatChange={handleTingkatChange}
        onKelasChange={handleKelasChange}
        lockedLabel={semesterLabel}
      />

      {/* Konten — hanya tampil setelah kelas dipilih */}
      {kelasId && (
        <>
          <SikapStatCards kelasId={kelasId} semesterId={semesterId} />
          <SikapSiswaTable
            kelasId={kelasId}
            semesterId={semesterId}
            currentUserRole={currentUserRole}
            canEdit={canEdit}
            onTambah={handleTambah}
            onDetail={handleDetail}
            onEdit={handleEdit}
          />
        </>
      )}

      {/* Modals */}
      <SikapFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setFormSiswaId(''); setFormSiswaName('') }}
        prefillSiswaId={formSiswaId}
        prefillSiswaName={formSiswaName}
        prefillSemesterId={semesterId}
        prefillSemesterLabel={semesterLabel}
      />

      <SikapDetailModal
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailSiswaId('') }}
        siswaId={detailSiswaId}
        siswaName={detailSiswaName}
        semesterId={semesterId}
        semesterLabel={semesterLabel}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        readonly={detailReadonly}
      />

      <SikapArsipSlideOver
        open={arsipOpen}
        onClose={() => setArsipOpen(false)}
        activeSemesterId={semesterId}
      />
    </div>
  )
}
