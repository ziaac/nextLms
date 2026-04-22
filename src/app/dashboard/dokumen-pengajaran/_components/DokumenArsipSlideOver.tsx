'use client'

import { useState, useMemo }         from 'react'
import { SlideOver }                  from '@/components/ui/SlideOver'
import { Select, Skeleton }           from '@/components/ui'
import { FilePreview }                from '@/components/ui/FilePreview'
import { DokumenStatusBadge }         from './DokumenStatusBadge'
import { useDokumenPengajaranList }   from '@/hooks/dokumen-pengajaran/useDokumenPengajaran'
import { useTahunAjaranList }         from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }   from '@/hooks/semester/useSemester'
import { format }                     from 'date-fns'
import { id as localeId }             from 'date-fns/locale'
import {
  Archive, FileText, Eye, FolderOpen,
} from 'lucide-react'
import type { DokumenPengajaranItem } from '@/types/dokumen-pengajaran.types'
import type { JenisDokumen }          from '@/types/enums'

const JENIS_LABEL: Record<string, string> = {
  CP:                     'CP',
  ATP:                    'ATP',
  MODUL_AJAR_RPP:         'Modul Ajar / RPP',
  MODUL_PROJEK_P5:        'Modul P5',
  KKTP:                   'KKTP',
  RINCIAN_MINGGU_EFEKTIF: 'Rincian Minggu',
  BUKU_PEGANGAN:          'Buku Pegangan',
  LAINNYA:                'Lainnya',
}

interface Props {
  open:    boolean
  onClose: () => void
  guruId:  string
}

export function DokumenArsipSlideOver({ open, onClose, guruId }: Props) {
  const [taId,         setTaId]         = useState('')
  const [semesterId,   setSemesterId]   = useState('')
  const [jenisDokumen, setJenisDokumen] = useState<JenisDokumen | ''>('')
  const [previewKey,   setPreviewKey]   = useState<string | null>(null)
  const [previewLabel, setPreviewLabel] = useState('')

  // ── TA list (semua) ────────────────────────────────────────────
  const { data: taRaw } = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []
  const taOptions = useMemo(() =>
    taList.map((t) => ({ label: t.nama + (t.isActive ? ' (Aktif)' : ''), value: t.id })),
    [taList],
  )

  // ── Semester — hanya yang tidak aktif ─────────────────────────
  const { data: semRaw } = useSemesterByTahunAjaran(taId || null)
  const semList = ((semRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? [])
    .filter((s) => !s.isActive)
  const semOptions = semList.map((s) => ({ label: s.nama, value: s.id }))

  // Label konteks yang dipilih
  const taNama  = taList.find((t) => t.id === taId)?.nama ?? ''
  const semNama = semList.find((s) => s.id === semesterId)?.nama ?? ''

  // ── Fetch — HANYA setelah TA + Semester dipilih ────────────────
  const { data, isLoading } = useDokumenPengajaranList(
    {
      guruId,
      semesterId,
      limit: 200,
      ...(jenisDokumen ? { jenisDokumen } : {}),
    },
    { enabled: open && !!guruId && !!semesterId },
  )
  const items: DokumenPengajaranItem[] = data?.data ?? []

  const handleTaChange = (v: string) => { setTaId(v); setSemesterId('') }
  const handleClose    = () => { setTaId(''); setSemesterId(''); setJenisDokumen(''); onClose() }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Arsip Dokumen Pengajaran"
      description="Dokumen dari semester yang telah selesai"
      width="md"
    >
      <div className="space-y-5">

        {/* ── Filter TA & Semester ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Tahun Ajaran
            </label>
            <Select
              options={[
                { label: taOptions.length === 0 ? 'Tidak ada data' : 'Pilih Tahun Ajaran...', value: '' },
                ...taOptions,
              ]}
              value={taId}
              onChange={(e) => handleTaChange(e.target.value)}
              disabled={taOptions.length === 0}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Semester
            </label>
            <Select
              options={[
                {
                  label: !taId
                    ? 'Pilih TA dulu...'
                    : semOptions.length === 0
                      ? 'Semua semester masih aktif'
                      : 'Pilih Semester...',
                  value: '',
                },
                ...semOptions,
              ]}
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              disabled={!taId || semOptions.length === 0}
            />
          </div>
        </div>

        {/* Filter jenis — hanya tampil jika semester sudah dipilih */}
        {semesterId && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Jenis Dokumen
            </label>
            <Select
              options={[
                { label: 'Semua Jenis', value: '' },
                ...Object.entries(JENIS_LABEL).map(([v, l]) => ({ label: l, value: v })),
              ]}
              value={jenisDokumen}
              onChange={(e) => setJenisDokumen(e.target.value as JenisDokumen | '')}
            />
          </div>
        )}

        {/* ── Prompt: belum pilih filter ── */}
        {!semesterId && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Archive className="w-7 h-7 text-gray-300 dark:text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Pilih periode arsip</p>
              <p className="text-xs text-gray-400 mt-1">
                Pilih tahun ajaran dan semester untuk melihat riwayat dokumen pengajaran Anda.
              </p>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {semesterId && isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        )}

        {/* ── Empty ── */}
        {semesterId && !isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <FolderOpen className="w-8 h-8 opacity-40" />
            <p className="text-sm">Tidak ada dokumen pada semester ini.</p>
          </div>
        )}

        {/* ── List dokumen ── */}
        {semesterId && !isLoading && items.length > 0 && (
          <div className="space-y-3">

            {/* Banner konteks periode */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
              <Archive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                {taNama} · Semester {semNama}
              </p>
              <span className="ml-auto text-[10px] text-amber-500 shrink-0">
                {items.length} dokumen
              </span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 p-4 space-y-3"
              >
                {/* Identitas */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={14} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {item.judul}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {JENIS_LABEL[item.jenisDokumen] ?? item.jenisDokumen}
                        {item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama && (
                          <> · {item.mataPelajaran.mataPelajaranTingkat.masterMapel.nama}</>
                        )}
                        {item.mataPelajaran?.kelas?.namaKelas && (
                          <span className="text-gray-400"> · {item.mataPelajaran.kelas.namaKelas}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <DokumenStatusBadge status={item.status} />
                </div>

                {/* Identitas akademik */}
                <div className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 font-medium tracking-wide">
                  {taNama} · Semester {semNama}
                  {item.createdAt && (
                    <> · {format(new Date(item.createdAt), 'd MMM yyyy', { locale: localeId })}</>
                  )}
                </div>

                {/* Tombol lihat file (presigned URL via FilePreview) */}
                {item.fileUrl ? (
                  <button
                    type="button"
                    onClick={() => { setPreviewKey(item.fileUrl!); setPreviewLabel(item.judul) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 hover:border-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat / Unduh
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400">
                    <FileText className="w-3 h-3" />
                    Tidak ada file
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* FilePreview modal — handle presigned URL dari MinIO */}
      <FilePreview
        open={!!previewKey}
        onClose={() => setPreviewKey(null)}
        docKey={previewKey}
        label={previewLabel}
      />
    </SlideOver>
  )
}
