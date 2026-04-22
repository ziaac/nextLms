'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useCopySemesterJadwal } from '@/hooks/jadwal/useJadwal'
import { ArrowRight, Info, AlertTriangle } from 'lucide-react'

interface TaOption { id: string; nama: string }

interface Props {
  open:      boolean
  onClose:   () => void
  taList:    TaOption[]
  onSuccess: (targetSemesterId: string) => void
}

type SemesterRaw = { id: string; nama: string; urutan: number; isActive: boolean }

export function CopySemesterModal({ open, onClose, taList, onSuccess }: Props) {
  const [selectedTaId, setSelectedTaId] = useState('')

  const { data: semListRaw, isLoading: loadingSmt } =
    useSemesterByTahunAjaran(selectedTaId || null)

  const semList = (semListRaw as SemesterRaw[] | undefined) ?? []

  // Resolve GANJIL (urutan=1) dan GENAP (urutan=2) otomatis
  const semGanjil = useMemo(() => semList.find((s) => s.urutan === 1), [semList])
  const semGenap  = useMemo(() => semList.find((s) => s.urutan === 2), [semList])

  const copyMutation = useCopySemesterJadwal()

  const taOptions = [
    { label: '— Pilih Tahun Ajaran —', value: '' },
    ...taList.map((t) => ({ label: t.nama, value: t.id })),
  ]

  // Validasi
  const hasGanjil  = !!semGanjil
  const hasGenap   = !!semGenap
  const canSubmit  = !!selectedTaId && hasGanjil && hasGenap && !loadingSmt

  const selectedTaNama = taList.find((t) => t.id === selectedTaId)?.nama ?? ''

  const handleClose = () => {
    setSelectedTaId('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || !semGanjil || !semGenap) return
    try {
      const result = await copyMutation.mutateAsync({
        sourceSemesterId: semGanjil.id,
        targetSemesterId: semGenap.id,
      })

      let msg = `Berhasil menyalin ${result.count} jadwal · ${selectedTaNama} GANJIL → GENAP`
      if (result.skipped > 0) {
        msg += ` · ${result.skipped} dilewati (mapel belum disetup)`
      }
      toast.success(msg)
      handleClose()
      onSuccess(semGenap.id)
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Gagal menyalin jadwal'
      toast.error(message)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Copy Jadwal Ganjil → Genap"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit || copyMutation.isPending}
          >
            {copyMutation.isPending
              ? <><Spinner />&nbsp;Menyalin...</>
              : 'Salin Jadwal'
            }
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-5">
        {/* Info */}
        <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2.5 border border-blue-100 dark:border-blue-800/40">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Proses ini akan menyalin seluruh jadwal dari semester{' '}
            <span className="font-semibold">Ganjil</span> ke semester{' '}
            <span className="font-semibold">Genap</span> pada tahun ajaran yang sama.
            Semester Genap <span className="font-semibold">harus kosong</span> sebelum proses dijalankan.
          </p>
        </div>

        {/* Pilih TA */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tahun Ajaran
          </label>
          <Select
            options={taOptions}
            value={selectedTaId}
            onChange={(e) => setSelectedTaId(e.target.value)}
          />
        </div>

        {/* Preview semester yang akan diproses */}
        {selectedTaId && !loadingSmt && (
          <>
            {(!hasGanjil || !hasGenap) ? (
              <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2.5 border border-amber-200 dark:border-amber-800/40">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {!hasGanjil && !hasGenap
                    ? 'Tahun ajaran ini belum memiliki semester Ganjil maupun Genap.'
                    : !hasGanjil
                    ? 'Semester Ganjil belum ditemukan pada tahun ajaran ini.'
                    : 'Semester Genap belum ditemukan pada tahun ajaran ini.'
                  }
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 px-4 py-3">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                  Akan diproses:
                </p>
                <div className="flex items-center gap-3">
                  {/* Ganjil */}
                  <div className="flex-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Sumber</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {semGanjil.nama}
                    </p>
                    {semGanjil.isActive && (
                      <span className="text-[10px] text-emerald-500 font-medium">✓ Aktif</span>
                    )}
                  </div>

                  <ArrowRight className="h-4 w-4 text-emerald-500 shrink-0" />

                  {/* Genap */}
                  <div className="flex-1 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tujuan</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {semGenap.nama}
                    </p>
                    {semGenap.isActive && (
                      <span className="text-[10px] text-emerald-500 font-medium">✓ Aktif</span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  {selectedTaNama}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}