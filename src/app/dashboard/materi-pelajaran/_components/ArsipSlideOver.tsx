'use client'

import { useState }                  from 'react'
import { useRouter }                  from 'next/navigation'
import { SlideOver }                  from '@/components/ui/SlideOver'
import { Button, Select, Skeleton }   from '@/components/ui'
import { MateriStatusBadge }          from './MateriStatusBadge'
import { MateriTipeBadge }            from './MateriTipeBadge'
import { getStatusMateri }            from '@/types/materi-pelajaran.types'
import type { MateriItem }            from '@/types/materi-pelajaran.types'
import { useMateriList }              from '@/hooks/materi-pelajaran/useMateriPelajaran'
import { useTahunAjaranList }         from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }   from '@/hooks/semester/useSemester'
import { useMataPelajaranList }       from '@/hooks/mata-pelajaran/useMataPelajaran'
import {
  BookOpen, Copy, ExternalLink, Archive, Filter,
  ChevronRight, ChevronLeft, Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface Props {
  open:    boolean
  onClose: () => void
  guruId:  string
  onCopySelected: (items: MateriItem[]) => void
}

export function ArsipSlideOver({ open, onClose, guruId, onCopySelected }: Props) {
  const router = useRouter()

  const [selected,       setSelected]       = useState<Set<string>>(new Set())
  const [tahunAjaranId,  setTahunAjaranId]  = useState('')
  const [semesterId,     setSemesterId]     = useState('')
  const [selectedMapelId, setSelectedMapelId] = useState('')

  // ── TA list ─────────────────────────────────────────────────────
  const { data: taRaw } = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? []

  // ── Semester — hanya yang TIDAK aktif ───────────────────────────
  const { data: semRaw } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = ((semRaw as { id: string; nama: string; isActive?: boolean }[] | undefined) ?? [])
    .filter((s) => !s.isActive)

  const taNama  = taList.find((t) => t.id === tahunAjaranId)?.nama ?? ''
  const semNama = semList.find((s) => s.id === semesterId)?.nama ?? ''

  // ── Step 2: Mapel list ───────────────────────────────────────────
  const { data: mapelData, isLoading: loadingMapel } = useMataPelajaranList(
    semesterId && guruId ? { guruId, semesterId, limit: 100 } : undefined,
    { enabled: open && !!semesterId && !!guruId },
  )
  const mapelList = mapelData?.data ?? []

  // ── Step 3: Materi in selected mapel ────────────────────────────
  const { data: materiData, isLoading: loadingMateri } = useMateriList(
    { guruId, semesterId, mataPelajaranId: selectedMapelId, limit: 100 },
    { enabled: open && !!guruId && !!semesterId && !!selectedMapelId },
  )
  const materiList: MateriItem[] = materiData?.data ?? []

  const selectedMapel = mapelList.find((m) => m.id === selectedMapelId)
  const namaMapelSelected = selectedMapel
    ? `${selectedMapel.mataPelajaranTingkat?.masterMapel?.nama ?? '—'} — ${selectedMapel.kelas?.namaKelas ?? '—'}`
    : ''

  // 'filter' | 'mapel' | 'items'
  const step = selectedMapelId ? 'items' : semesterId ? 'mapel' : 'filter'

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const selectedItems = materiList.filter((i) => selected.has(i.id))

  const handleCopy = () => {
    if (selectedItems.length === 0) return
    onCopySelected(selectedItems)
    handleClose()
  }

  const handleClose = () => {
    setSelected(new Set()); setTahunAjaranId(''); setSemesterId(''); setSelectedMapelId('')
    onClose()
  }

  return (
    <SlideOver
      open={open} onClose={handleClose} title="Arsip Materi" width="lg"
      description={
        step === 'filter' ? 'Pilih Tahun Ajaran & Semester' :
        step === 'mapel'  ? 'Pilih kelas yang ingin ditelusuri' :
        namaMapelSelected
      }
    >
      <div className="space-y-5">

        {/* ── Filter ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tahun Ajaran</label>
            <Select
              options={[
                { label: taList.length === 0 ? 'Tidak ada data' : 'Pilih Tahun Ajaran...', value: '' },
                ...taList.map((t) => ({ label: t.nama + (t.isActive ? ' (Aktif)' : ''), value: t.id })),
              ]}
              value={tahunAjaranId}
              onChange={(e) => { setTahunAjaranId(e.target.value); setSemesterId(''); setSelectedMapelId(''); setSelected(new Set()) }}
              disabled={taList.length === 0}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Semester</label>
            <Select
              options={[
                { label: !tahunAjaranId ? 'Pilih TA dulu...' : semList.length === 0 ? 'Semua semester masih aktif' : 'Pilih Semester...', value: '' },
                ...semList.map((s) => ({ label: s.nama, value: s.id })),
              ]}
              value={semesterId}
              onChange={(e) => { setSemesterId(e.target.value); setSelectedMapelId(''); setSelected(new Set()) }}
              disabled={!tahunAjaranId || semList.length === 0}
            />
          </div>
        </div>

        {/* ── Amber banner ── */}
        {semesterId && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Archive className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">{taNama} · Sem. {semNama}</span>
            <span className="ml-auto text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wide">Arsip</span>
          </div>
        )}

        {/* ── Step 0: Prompt ── */}
        {step === 'filter' && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <Filter className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Pilih Tahun Ajaran & Semester</p>
            <p className="text-xs mt-1 opacity-60">untuk menampilkan arsip materi</p>
          </div>
        )}

        {/* ── Step 1: Kartu kelas-mapel ── */}
        {step === 'mapel' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Kelas yang Anda Ajar</p>
            {loadingMapel && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl w-full" />)}
            {!loadingMapel && mapelList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                <BookOpen size={36} className="mb-2 opacity-20" />
                <p className="text-sm">Tidak ada mata pelajaran di semester ini</p>
              </div>
            )}
            {!loadingMapel && mapelList.map((mapel) => {
              const namaMapel   = mapel.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
              const namaKelas   = mapel.kelas?.namaKelas ?? '—'
              const kategori    = mapel.mataPelajaranTingkat?.masterMapel?.kategori ?? ''
              const countMateri = (mapel as any)._count?.materiPelajarans ?? null
              return (
                <div
                  key={mapel.id}
                  onClick={() => { setSelectedMapelId(mapel.id); setSelected(new Set()) }}
                  className="group flex items-center gap-4 px-4 py-4 rounded-2xl border cursor-pointer transition-all border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 bg-white dark:bg-gray-800/40 hover:bg-emerald-50/30"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <BookOpen size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{namaMapel}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-500 flex items-center gap-1"><Users size={11} />{namaKelas}</span>
                      {kategori && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{kategori}</span>}
                      {countMateri != null && countMateri > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-medium">{countMateri} materi</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                </div>
              )
            })}
          </div>
        )}

        {/* ── Step 2: Daftar materi per kelas ── */}
        {step === 'items' && (
          <div className="space-y-3">
            <button
              onClick={() => { setSelectedMapelId(''); setSelected(new Set()) }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <ChevronLeft size={14} /> Kembali ke daftar kelas
            </button>

            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Materi — {namaMapelSelected}</p>
              {materiList.length > 0 && (
                <button
                  type="button"
                  className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  onClick={() => {
                    if (selected.size === materiList.length)
                      setSelected(new Set())
                    else
                      setSelected(new Set(materiList.map((i) => i.id)))
                  }}
                >
                  {selected.size === materiList.length ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>

            {/* Sticky action bar */}
            {selected.size > 0 && (
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-emerald-600 shadow-lg shadow-emerald-500/20 text-white animate-in slide-in-from-top-2">
                <p className="text-sm font-medium">{selected.size} materi dipilih</p>
                <Button size="sm" variant="secondary" className="bg-white text-emerald-600 hover:bg-emerald-50 border-none h-8 text-xs font-medium" leftIcon={<Copy size={14} />} onClick={handleCopy}>
                  Salin ke Semester Aktif
                </Button>
              </div>
            )}

            {loadingMateri && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl w-full" />)}

            {!loadingMateri && materiList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                <BookOpen size={36} className="mb-2 opacity-20" />
                <p className="text-sm">Tidak ada materi di kelas ini</p>
              </div>
            )}

            {!loadingMateri && materiList.map((item) => {
              const status    = getStatusMateri(item)
              const isChecked = selected.has(item.id)
              const createdAt = format(new Date(item.createdAt), 'd MMM yyyy', { locale: localeId })
              return (
                <div
                  key={item.id}
                  className={[
                    'flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all',
                    isChecked
                      ? 'border-emerald-400 bg-emerald-30/50 dark:bg-emerald-900/10'
                      : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40',
                  ].join(' ')}
                >
                  <div
                    onClick={() => toggle(item.id)}
                    className={['w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all', isChecked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'].join(' ')}
                  >
                    {isChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(item.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <MateriTipeBadge tipe={item.tipeMateri} />
                      <MateriStatusBadge status={status} />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.judul}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Pertemuan {item.pertemuanKe ?? '-'} · {createdAt}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/materi-pelajaran/${item.id}?readOnly=true`)}
                    className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors"
                    title="Lihat detail (read-only)"
                  >
                    <ExternalLink className="w-3 h-3" /> Lihat
                  </button>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </SlideOver>
  )
}
