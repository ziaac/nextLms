'use client'

import { Skeleton } from '@/components/ui'
import { FileText, Lock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useDokumenPengajaranList } from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import { useKurikulumAktif } from '@/hooks/kurikulum/useKurikulum'
import type { DokumenPengajaranItem } from '@/types/dokumen-pengajaran.types'
import type { JenisKontenAI } from '@/types/ai-generator.types'
import type { FormatBaku } from '@/types/kurikulum.types'
import { cn } from '@/lib/utils'

interface Props {
  semesterId:    string
  tahunAjaranId: string
  jenisKonten:   JenisKontenAI
  selectedIds:   string[]
  onChange:      (ids: string[]) => void
}

/** Map JenisKontenAI → jenisFormat format baku */
const JENIS_TO_FORMAT: Record<JenisKontenAI, string> = {
  RPP:              'RPP',
  MATERI_PELAJARAN: 'MATERI_PELAJARAN',
  TUGAS:            'ASESMEN',
}

/** Ambil nama file dari path MinIO key */
function fileNameFromKey(key: string): string {
  return key.split('/').pop() ?? key
}

/** Tampilan satu baris format baku (locked, otomatis disertakan) */
function FormatBakuRow({ formatBaku }: { formatBaku: FormatBaku }) {
  const isPdf = formatBaku.formatTipe === 'PDF_TEMPLATE' && formatBaku.pdfTemplateKey

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30">
      <Lock size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 truncate">
          {isPdf ? fileNameFromKey(formatBaku.pdfTemplateKey!) : `Format Baku ${formatBaku.jenisFormat} (schema)`}
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
          Format Baku · Otomatis disertakan · {formatBaku.formatTipe === 'PDF_TEMPLATE' ? 'PDF Template' : 'Richtext Schema'}
        </p>
      </div>
      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
    </div>
  )
}

export function StepSelectDokumen({
  semesterId,
  tahunAjaranId,
  jenisKonten,
  selectedIds,
  onChange,
}: Props) {
  const { data: kurikulumAktif, isLoading: loadingKurikulum } = useKurikulumAktif()
  const { data, isLoading: loadingDokumen } = useDokumenPengajaranList(
    {
      semesterId:    semesterId    || undefined,
      tahunAjaranId: tahunAjaranId || undefined,
      limit:         100,
    },
    { enabled: !!semesterId || !!tahunAjaranId },
  )

  const dokumenList: DokumenPengajaranItem[] = data?.data ?? []

  // Format baku yang relevan berdasarkan jenisKonten
  const jenisFormat  = JENIS_TO_FORMAT[jenisKonten]
  const formatBaku   = kurikulumAktif?.formatBaku?.find((fb) => fb.jenisFormat === jenisFormat)

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const isLoading = loadingKurikulum || loadingDokumen

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Pilih Dokumen Referensi
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          AI akan menggunakan dua sumber: format baku kurikulum dan dokumen pengajaran
          yang Anda pilih. Pilih minimal <strong>1 dokumen pengajaran</strong>.
        </p>
      </div>

      {/* ── Seksi 1: Format Baku (locked) ─────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Format Baku Kurikulum
        </p>

        {isLoading ? (
          <Skeleton className="h-14 w-full rounded-lg" />
        ) : formatBaku ? (
          <FormatBakuRow formatBaku={formatBaku} />
        ) : (
          <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Format baku {jenisFormat} belum dikonfigurasi
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                AI akan menggunakan struktur standar. Hubungi admin untuk mengatur format baku.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Seksi 2: Dokumen Pengajaran Guru (wajib min 1) ────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Dokumen Pengajaran Anda
          <span className="ml-1 normal-case font-normal text-red-500">*wajib pilih min. 1</span>
        </p>

        {loadingDokumen ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : dokumenList.length === 0 ? (
          <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Belum ada dokumen pengajaran untuk konteks ini.</p>
            <p className="text-xs mt-1 text-gray-400">
              Upload dokumen (buku ajar, silabus, dll.) melalui menu Dokumen Pengajaran.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {dokumenList.map((doc) => {
              const checked = selectedIds.includes(doc.id)
              return (
                <label
                  key={doc.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    checked
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(doc.id)}
                    className="mt-0.5 accent-emerald-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.judul}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {doc.jenisDokumen} · {new Date(doc.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer counter */}
      <p className={cn(
        'text-xs',
        selectedIds.length === 0 ? 'text-red-400' : 'text-gray-400',
      )}>
        {selectedIds.length === 0
          ? '⚠ Belum ada dokumen pengajaran dipilih'
          : `${selectedIds.length} dokumen pengajaran dipilih`}
      </p>
    </div>
  )
}
