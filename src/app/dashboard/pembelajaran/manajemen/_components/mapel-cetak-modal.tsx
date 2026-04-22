'use client'

import { useState, useEffect } from 'react'
import { FileSpreadsheet, Users, CalendarDays, BookOpen } from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useKelasList } from '@/hooks/kelas/useKelas'
import { toast } from 'sonner'
import api from '@/lib/axios'

interface Props {
  open:    boolean
  onClose: () => void
  // Konteks dari URL — jika ada, kelas sudah terkunci
  kelasIdCtx?:      string
  tahunAjaranIdCtx?: string
  semesterIdCtx?:   string
}

export function MapelCetakModal({
  open, onClose,
  kelasIdCtx, tahunAjaranIdCtx, semesterIdCtx,
}: Props) {
  const [tahunAjaranId, setTahunAjaranId] = useState(tahunAjaranIdCtx ?? '')
  const [semesterId,    setSemesterId]    = useState(semesterIdCtx    ?? '')
  const [kelasId,       setKelasId]       = useState(kelasIdCtx       ?? '')
  const [loading,       setLoading]       = useState<string | null>(null)

  const hasKelasCtx = !!kelasIdCtx

  const { data: taList = [] }       = useTahunAjaranList()
  const { data: semesterList = [] } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const { data: kelasList = [] }    = useKelasList(
    tahunAjaranId ? { tahunAjaranId } : undefined
  )

  // Reset saat tutup
  useEffect(() => {
    if (!open) {
      setTahunAjaranId(tahunAjaranIdCtx ?? '')
      setSemesterId(semesterIdCtx ?? '')
      setKelasId(kelasIdCtx ?? '')
    }
  }, [open])

  // Reset semester & kelas saat TA berubah
  useEffect(() => {
    setSemesterId('')
    if (!hasKelasCtx) setKelasId('')
  }, [tahunAjaranId])

  // Auto-set semester aktif saat semester list load
  useEffect(() => {
    if (semesterList.length > 0 && !semesterId) {
      const aktif = semesterList.find(s => s.isActive)
      if (aktif) setSemesterId(aktif.id)
    }
  }, [semesterList])

  const taOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...taList.map(ta => ({ label: ta.nama, value: ta.id })),
  ]
  const semesterOptions = [
    { label: 'Pilih Semester', value: '' },
    ...semesterList.map(s => ({
      label: `Semester ${s.nama}${s.isActive ? ' (Aktif)' : ''}`,
      value: s.id,
    })),
  ]
  const kelasOptions = [
    { label: 'Semua Kelas', value: '' },
    ...kelasList.map(k => ({ label: k.namaKelas, value: k.id })),
  ]

  async function doExport(type: string, params: Record<string, string>, filename: string) {
    setLoading(type)
    try {
      const res = await api.get(`/report/export/${type}`, {
        params,
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      const a   = document.createElement('a')
      a.href     = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${filename} berhasil diunduh`)
    } catch {
      toast.error(`Gagal mengunduh ${filename}`)
    } finally {
      setLoading(null)
    }
  }

  function validate(): boolean {
    if (!tahunAjaranId) { toast.error('Pilih tahun ajaran terlebih dahulu'); return false }
    if (!semesterId)    { toast.error('Pilih semester terlebih dahulu'); return false }
    return true
  }

  async function handleJadwal() {
    if (!validate()) return
    if (kelasId) {
      await doExport('jadwal-kelas',
        { semesterId, kelasId },
        `jadwal-kelas-${kelasId.slice(0,6)}.xlsx`)
    } else {
      await doExport('jadwal-sekolah',
        { semesterId },
        `jadwal-sekolah.xlsx`)
    }
  }

  async function handleBiodata() {
    if (!tahunAjaranId) { toast.error('Pilih tahun ajaran terlebih dahulu'); return }
    if (kelasId) {
      await doExport('siswa-kelas',
        { kelasId },
        `biodata-siswa-kelas.xlsx`)
    } else {
      await doExport('daftar-siswa',
        { tahunAjaranId },
        `biodata-siswa-semua-kelas.xlsx`)
    }
  }

  async function handleAbsensi() {
    if (!validate()) return
    const params: Record<string, string> = { semesterId }
    if (kelasId) params.kelasId = kelasId
    const filename = kelasId ? 'rekap-absensi-kelas.xlsx' : 'rekap-absensi-seluruh-kelas.xlsx'
    await doExport('absensi-semester', params, filename)
  }

  const namaTA    = taList.find(t => t.id === tahunAjaranId)?.nama ?? ''
  const namaSmt   = semesterList.find(s => s.id === semesterId)?.nama ?? ''
  const namaKelas = kelasList.find(k => k.id === kelasId)?.namaKelas ?? 'Semua Kelas'

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
        {!hasKelasCtx && (
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
        )}

        {/* Filter Semester */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">
            Semester <span className="text-red-500">*</span>
          </label>
          <Select
            options={semesterOptions}
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
          />
        </div>

        {/* Filter Kelas — opsional, lock jika ada konteks */}
        {!hasKelasCtx && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Kelas</label>
            <Select
              options={kelasOptions}
              value={kelasId}
              onChange={(e) => setKelasId(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Kosongkan untuk export semua kelas
            </p>
          </div>
        )}

        {/* Info konteks */}
        {tahunAjaranId && semesterId && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-xs text-gray-600 space-y-0.5">
            <p><span className="font-medium">TA:</span> {namaTA}</p>
            <p><span className="font-medium">Semester:</span> {namaSmt}</p>
            <p><span className="font-medium">Kelas:</span> {namaKelas}</p>
          </div>
        )}

        {/* Tombol export */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Pilih Data yang Dicetak
          </p>

          <Button
            variant="secondary"
            className="w-full justify-start"
            leftIcon={<CalendarDays className="w-4 h-4" />}
            loading={loading === 'jadwal-kelas' || loading === 'jadwal-sekolah'}
            onClick={handleJadwal}
          >
            {kelasId ? 'Jadwal Pelajaran Kelas' : 'Jadwal Sekolah (Semua Kelas)'}
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start"
            leftIcon={<Users className="w-4 h-4" />}
            loading={loading === 'siswa-kelas' || loading === 'daftar-siswa'}
            onClick={handleBiodata}
          >
            {kelasId ? 'Biodata Siswa Kelas Ini' : 'Biodata Siswa Semua Kelas'}
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-start"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            loading={loading === 'absensi-semester'}
            onClick={handleAbsensi}
          >
            {kelasId ? 'Rekap Absensi Kelas Ini' : 'Rekap Absensi Semua Kelas'}
          </Button>

          <p className="text-xs text-gray-400 pt-1">
            Export nilai tersedia di detail setiap mata pelajaran.
          </p>
        </div>

      </div>
    </Modal>
  )
}
