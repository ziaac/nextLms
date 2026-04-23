'use client'

import { useState, useMemo }          from 'react'
import { useRouter }                  from 'next/navigation'
import { SlideOver }                  from '@/components/ui/SlideOver'
import { Select, Skeleton }           from '@/components/ui'
import { Combobox }                   from '@/components/ui/Combobox'
import type { ComboboxOption }        from '@/components/ui/Combobox'
import { TujuanBadge }               from './TugasBadge'
import { useTugasList }              from '@/hooks/tugas/useTugas'
import { useTahunAjaranList }        from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }  from '@/hooks/semester/useSemester'
import { Archive, ClipboardList, ExternalLink, Filter, Clock } from 'lucide-react'
import { format, isPast }            from 'date-fns'
import { id as localeId }            from 'date-fns/locale'
import type { TugasItem }            from '@/types/tugas.types'

interface Props {
  open:    boolean
  onClose: () => void
}

export function SiswaTugasArsipSlideOver({ open, onClose }: Props) {
  const router = useRouter()

  const [tahunAjaranId,  setTahunAjaranId]  = useState('')
  const [semesterId,     setSemesterId]     = useState('')
  const [mapelTingkatId, setMapelTingkatId] = useState('')

  // ── TA list ──────────────────────────────────────────────────────────
  const { data: taRaw } = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  // ── Semester — hanya yang TIDAK aktif ───────────────────────────────
  const { data: semRaw } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = ((semRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? [])
    .filter((s) => !s.isActive)

  const taNama  = taList.find((t) => t.id === tahunAjaranId)?.nama ?? ''
  const semNama = semList.find((s) => s.id === semesterId)?.nama   ?? ''

  // ── Tugas arsip ──────────────────────────────────────────────────────
  const { data: tugasData, isLoading } = useTugasList(
    { semesterId, isPublished: true, limit: 100 },
    { enabled: open && !!semesterId },
  )
  const tugasList: TugasItem[] = tugasData?.data ?? []

  // Opsi filter mapel dari data yang dimuat
  const mapelOptions = useMemo<ComboboxOption[]>(() => {
    const map = new Map<string, string>()
    for (const item of tugasList) {
      const id   = item.mataPelajaran?.mataPelajaranTingkat?.id
      const nama = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama
      if (id && nama) map.set(id, nama)
    }
    return [
      { value: '', label: 'Semua Mata Pelajaran' },
      ...Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ]
  }, [tugasList])

  // Kelompokkan per mapel
  const grouped = tugasList.reduce<Record<string, { nama: string; items: TugasItem[] }>>((acc, item) => {
    const id   = item.mataPelajaran?.mataPelajaranTingkat?.id   ?? 'lainnya'
    const nama = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? 'Lainnya'
    if (mapelTingkatId && id !== mapelTingkatId) return acc
    if (!acc[id]) acc[id] = { nama, items: [] }
    acc[id].items.push(item)
    return acc
  }, {})

  const step = semesterId ? 'items' : 'filter'

  const handleClose = () => {
    setTahunAjaranId('')
    setSemesterId('')
    setMapelTingkatId('')
    onClose()
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title="Arsip Tugas"
      width="lg"
      description={
        step === 'filter'
          ? 'Pilih Tahun Ajaran & Semester'
          : `${taNama} · Semester ${semNama}`
      }
    >
      <div className="space-y-5">

        {/* ── Filter TA & Semester ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tahun Ajaran</label>
            <Select
              options={[
                { label: taList.length === 0 ? 'Tidak ada data' : 'Pilih Tahun Ajaran...', value: '' },
                ...taList.map((t) => ({ label: t.nama + (t.isActive ? ' (Aktif)' : ''), value: t.id })),
              ]}
              value={tahunAjaranId}
              onChange={(e) => { setTahunAjaranId(e.target.value); setSemesterId(''); setMapelTingkatId('') }}
              disabled={taList.length === 0}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Semester</label>
            <Select
              options={[
                {
                  label: !tahunAjaranId
                    ? 'Pilih TA dulu...'
                    : semList.length === 0
                      ? 'Semua semester masih aktif'
                      : 'Pilih Semester...',
                  value: '',
                },
                ...semList.map((s) => ({ label: s.nama, value: s.id })),
              ]}
              value={semesterId}
              onChange={(e) => { setSemesterId(e.target.value); setMapelTingkatId('') }}
              disabled={!tahunAjaranId || semList.length === 0}
            />
          </div>
        </div>

        {/* ── Filter mapel (tampil jika ada 2+ mapel) ──────────────────── */}
        {semesterId && mapelOptions.length > 2 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mata Pelajaran</label>
            <Combobox
              options={mapelOptions}
              value={mapelTingkatId}
              onChange={(v) => setMapelTingkatId(v)}
              placeholder="Semua mata pelajaran"
              searchable={mapelOptions.length > 6}
              searchPlaceholder="Cari mata pelajaran..."
            />
          </div>
        )}

        {/* ── Amber banner ─────────────────────────────────────────────── */}
        {semesterId && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Archive className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {taNama} · Sem. {semNama}
            </span>
            <span className="ml-auto text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Arsip
            </span>
          </div>
        )}

        {/* ── Prompt ───────────────────────────────────────────────────── */}
        {step === 'filter' && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <Filter className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Pilih Tahun Ajaran & Semester</p>
            <p className="text-xs mt-1 opacity-60">untuk menampilkan arsip tugas</p>
          </div>
        )}

        {/* ── Daftar tugas (grouped by mapel) ──────────────────────────── */}
        {step === 'items' && (
          <div className="space-y-5">
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl w-full" />
            ))}

            {!isLoading && tugasList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                <ClipboardList size={36} className="mb-2 opacity-20" />
                <p className="text-sm">Tidak ada tugas di semester ini</p>
              </div>
            )}

            {!isLoading && Object.values(grouped).map(({ nama, items }) => (
              <div key={nama} className="space-y-2">
                {/* Mapel header */}
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">
                  {nama}
                </p>

                {items.map((item) => {
                  const deadline = item.tanggalSelesai
                    ? format(new Date(item.tanggalSelesai), 'd MMM yyyy, HH:mm', { locale: localeId })
                    : '—'
                  const past = isPast(new Date(item.tanggalSelesai))

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40"
                    >
                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 mt-0.5">
                        <ClipboardList size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <TujuanBadge tujuan={item.tujuan} />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug line-clamp-2">
                          {item.judul}
                        </p>
                        <p className={`text-[11px] mt-0.5 flex items-center gap-1 ${past ? 'text-red-400' : 'text-gray-400'}`}>
                          <Clock size={10} /> {deadline}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => { router.push(`/dashboard/tugas/${item.id}`); handleClose() }}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Lihat
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

      </div>
    </SlideOver>
  )
}
