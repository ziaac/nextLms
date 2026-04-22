#!/usr/bin/env python3
"""
Script: patch_bulk_copy_auto_frontend.py
Lokasi: nextjslms/scripts/patch_bulk_copy_auto_frontend.py
"""
import os

NEXT_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MODAL     = os.path.join(NEXT_ROOT, 'src', 'app', 'dashboard', 'pembelajaran',
                         'manajemen', '_components', 'mapel-bulk-copy-modal.tsx')

# ══════════════════════════════════════════════════════════════
# Ganti seluruh isi file dengan versi baru yang disederhanakan
# ══════════════════════════════════════════════════════════════
NEW_CONTENT = r"""'use client'

import { useState, useEffect } from 'react'
import {
  ChevronRight, ChevronLeft, CheckCircle2,
  AlertTriangle, ArrowUpFromLine, ArrowDownToLine, Loader2,
} from 'lucide-react'
import { Modal, Button, Select } from '@/components/ui'
import { useTahunAjaranList }    from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast }           from 'sonner'
import api                 from '@/lib/axios'
import { getErrorMessage } from '@/lib/utils'

type Step = 'form' | 'confirm' | 'progress' | 'done'

interface Props {
  open:    boolean
  onClose: () => void
  kelasId?:             string
  targetTahunAjaranId?: string
}

interface BulkCopyAutoResult {
  message:       string
  totalDiproses: number
  totalBaru:     number
  totalSkip:     number
  semester: {
    sumber: { id: string; nama: string }
    tujuan: { id: string; nama: string }
  }
}

function useBulkCopyAuto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (tahunAjaranId: string): Promise<BulkCopyAutoResult> => {
      const res = await api.post('/mata-pelajaran/bulk-copy-auto', null, {
        params: { tahunAjaranId },
      })
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mata-pelajaran'] })
    },
  })
}

export function MapelBulkCopyModal({ open, onClose }: Props) {
  const [step,          setStep]          = useState<Step>('form')
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [progress,      setProgress]      = useState(0)
  const [error,         setError]         = useState<string | null>(null)
  const [result,        setResult]        = useState<BulkCopyAutoResult | null>(null)

  const { data: allTAList = [] } = useTahunAjaranList()
  const { data: semList = [] }   = useSemesterByTahunAjaran(tahunAjaranId || null)

  const mutation = useBulkCopyAuto()

  // Info semester dari TA yang dipilih
  const semGanjil = semList.find((s) => s.nama === 'GANJIL')
  const semGenap  = semList.find((s) => s.nama === 'GENAP')

  useEffect(() => {
    if (!open) {
      setStep('form')
      setTahunAjaranId('')
      setProgress(0)
      setError(null)
      setResult(null)
    }
  }, [open])

  const taOptions = [
    { label: 'Pilih Tahun Ajaran', value: '' },
    ...allTAList.map((ta) => ({ label: ta.nama, value: ta.id })),
  ]

  const canProceed = !!tahunAjaranId && !!semGanjil && !!semGenap

  async function handleConfirm() {
    setError(null)
    setStep('progress')
    setProgress(10)

    const timer = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 85))
    }, 400)

    try {
      const res = await mutation.mutateAsync(tahunAjaranId)
      clearInterval(timer)
      setProgress(100)
      setResult(res)
      toast.success(`${res.totalBaru} mata pelajaran berhasil disalin`)
      setTimeout(() => setStep('done'), 600)
    } catch (err) {
      clearInterval(timer)
      setProgress(0)
      setStep('confirm')
      setError(getErrorMessage(err))
    }
  }

  const taNama = allTAList.find((t) => t.id === tahunAjaranId)?.nama ?? '-'

  return (
    <Modal
      open={open}
      onClose={step === 'progress' ? () => {} : onClose}
      title="Salin Mapel GANJIL → GENAP"
      size="md"
      footer={
        step === 'form' ? (
          <>
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button
              disabled={!canProceed}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => setStep('confirm')}
            >
              Lanjut
            </Button>
          </>
        ) : step === 'confirm' ? (
          <>
            <Button
              variant="secondary"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              onClick={() => { setStep('form'); setError(null) }}
            >
              Kembali
            </Button>
            <Button loading={mutation.isPending} onClick={handleConfirm}>
              Konfirmasi & Salin
            </Button>
          </>
        ) : step === 'done' ? (
          <Button className="w-full" onClick={onClose}>Tutup</Button>
        ) : null
      }
    >
      <div className="p-6">

        {/* ── STEP: Form ───────────────────────────────────── */}
        {step === 'form' && (
          <div className="space-y-5">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Fitur ini menyalin semua mata pelajaran dari semester <strong>GANJIL</strong> ke semester <strong>GENAP</strong> dalam tahun ajaran yang sama. Mapel yang sudah ada di GENAP akan dilewati.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <Select
                options={taOptions}
                value={tahunAjaranId}
                onChange={(e) => setTahunAjaranId(e.target.value)}
              />
            </div>

            {/* Preview semester */}
            {tahunAjaranId && semList.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <ArrowUpFromLine className="w-4 h-4" />
                    <span className="text-sm">Sumber</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Semester GANJIL
                    </p>
                    <p className="text-xs text-gray-400">{taNama}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <ArrowDownToLine className="w-4 h-4" />
                    <span className="text-sm">Tujuan</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Semester GENAP
                    </p>
                    <p className="text-xs text-gray-400">{taNama}</p>
                  </div>
                </div>
              </div>
            )}

            {tahunAjaranId && (!semGanjil || !semGenap) && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600">
                  Tahun ajaran ini belum memiliki kedua semester (GANJIL & GENAP).
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Confirm ────────────────────────────────── */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <ArrowUpFromLine className="w-4 h-4" />
                  <span className="text-sm">Dari</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Semester GANJIL</p>
                  <p className="text-xs text-gray-400">{taNama}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <ArrowDownToLine className="w-4 h-4" />
                  <span className="text-sm">Ke</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Semester GENAP</p>
                  <p className="text-xs text-gray-400">{taNama}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Semua mata pelajaran dari semester GANJIL akan disalin ke GENAP.
              Mapel yang sudah ada di GENAP akan dilewati (tidak diduplikasi).
              Pengajar ikut disalin.
            </p>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP: Progress ───────────────────────────────── */}
        {step === 'progress' && (
          <div className="flex flex-col items-center gap-6 py-8">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <div className="w-full space-y-2">
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center text-gray-500">
                {progress < 100 ? 'Menyalin mata pelajaran...' : 'Selesai!'}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: Done ───────────────────────────────────── */}
        {step === 'done' && result && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-white">Berhasil</p>
              <p className="text-sm text-gray-500 mt-1">{result.message}</p>
            </div>
            <div className="flex gap-3 w-full">
              <div className="flex-1 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{result.totalBaru}</p>
                <p className="text-xs text-emerald-600">Baru Ditambahkan</p>
              </div>
              <div className="flex-1 rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{result.totalSkip}</p>
                <p className="text-xs text-amber-600">Dilewati</p>
              </div>
              <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                <p className="text-2xl font-bold text-gray-700">{result.totalDiproses}</p>
                <p className="text-xs text-gray-500">Total Diproses</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
"""

# ══════════════════════════════════════════════════════════════
def main():
    print('\n=== Patch: Bulk Copy Auto Frontend ===\n')
    if not os.path.exists(MODAL):
        print(f'  [ERROR]  {MODAL}'); return
    with open(MODAL, 'w', encoding='utf-8') as f:
        f.write(NEW_CONTENT)
    print(f'  [WRITE]  {MODAL}')
    print('\n=== Selesai ===')
    print('Jalankan: npx tsc --noEmit\n')

if __name__ == '__main__':
    main()