'use client'

import { useState }                  from 'react'
import { useRouter }                  from 'next/navigation'
import { SlideOver }                  from '@/components/ui/SlideOver'
import { Button, Select, Skeleton }   from '@/components/ui'
import { TujuanBadge, BentukBadge }  from './TugasBadge'
import { SalinTugasModal }           from './SalinTugasModal'
import { useTugasList }              from '@/hooks/tugas/useTugas'
import { useTahunAjaranList }        from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran }  from '@/hooks/semester/useSemester'
import { useMataPelajaranList }      from '@/hooks/mata-pelajaran/useMataPelajaran'
import {
  ClipboardList, ChevronRight, ChevronLeft,
  BookOpen, Users, Copy, Archive, ExternalLink, Filter,
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { TugasItem } from '@/types/tugas.types'

interface Props {
  open:    boolean
  onClose: () => void
  guruId:  string
}

export function ArsipTugasSlideOver({ open, onClose, guruId }: Props) {
  const router = useRouter()

  const [tahunAjaranId,   setTahunAjaranId]   = useState('')
  const [semesterId,      setSemesterId]      = useState('')
  const [selectedMapelId, setSelectedMapelId] = useState('')
  const [selected,        setSelected]        = useState<Set<string>>(new Set())
  const [salinOpen,       setSalinOpen]       = useState(false)

  // ── TA & Semester ────────────────────────────────────────────────
  const { data: taRaw } = useTahunAjaranList()
  const taList = (taRaw as { id: string; nama: string }[] | undefined) ?? []

  const { data: semRaw } = useSemesterByTahunAjaran(tahunAjaranId || null)
  const semList = ((semRaw as any[]) ?? []).filter((s) => !s.isActive)

  const taNama      = taList.find((t) => t.id === tahunAjaranId)?.nama ?? ''
  const semNama     = semList.find((s) => s.id === semesterId)?.nama ?? ''

  // ── Step 2: Mapel guru di semester tsb ──────────────────────────
  const { data: mapelData, isLoading: loadingMapel } = useMataPelajaranList(
    semesterId && guruId ? { guruId, semesterId, limit: 100 } : undefined,
    { enabled: open && !!semesterId && !!guruId },
  )
  const mapelList = mapelData?.data ?? []

  // ── Step 3: Tugas per mapel ──────────────────────────────────────
  const { data: tugasData, isLoading: loadingTugas } = useTugasList(
    { guruId, semesterId, mataPelajaranId: selectedMapelId, limit: 100 },
    { enabled: open && !!guruId && !!semesterId && !!selectedMapelId },
  )
  const tugasList: TugasItem[] = tugasData?.data ?? []

  const selectedMapel      = mapelList.find((m) => m.id === selectedMapelId)
  const namaMapelSelected  = selectedMapel
    ? `${selectedMapel.mataPelajaranTingkat?.masterMapel?.nama ?? '—'} — ${selectedMapel.kelas?.namaKelas ?? '—'}`
    : ''

  const step: 'filter' | 'mapel' | 'items' =
    selectedMapelId ? 'items' : semesterId ? 'mapel' : 'filter'

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const selectedTugas = tugasList.filter((t) => selected.has(t.id))

  const resetAll = () => {
    setTahunAjaranId(''); setSemesterId(''); setSelectedMapelId(''); setSelected(new Set())
  }

  const handleClose = () => { resetAll(); onClose() }

  return (
    <>
      <SlideOver
        open={open} onClose={handleClose} title="Arsip Tugas" width="lg"
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
                  ...taList.map((t) => ({ label: t.nama, value: t.id })),
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
              <p className="text-xs mt-1 opacity-60">untuk menelusuri arsip tugas</p>
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
                const namaMapel  = mapel.mataPelajaranTingkat?.masterMapel?.nama ?? '—'
                const namaKelas  = mapel.kelas?.namaKelas ?? '—'
                const kategori   = mapel.mataPelajaranTingkat?.masterMapel?.kategori ?? ''
                const tugasCount = (mapel as any)._count?.tugas ?? null
                return (
                  <div
                    key={mapel.id}
                    onClick={() => { setSelectedMapelId(mapel.id); setSelected(new Set()) }}
                    className="group flex items-center gap-4 px-4 py-4 rounded-2xl border cursor-pointer transition-all border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-800 bg-white dark:bg-gray-800/40 hover:bg-blue-50/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                      <BookOpen size={18} className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{namaMapel}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500 flex items-center gap-1"><Users size={11} />{namaKelas}</span>
                        {kategori && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{kategori}</span>}
                        {tugasCount != null && tugasCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium">{tugasCount} tugas</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0" />
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Step 2: Daftar tugas per kelas ── */}
          {step === 'items' && (
            <div className="space-y-3">
              <button
                onClick={() => { setSelectedMapelId(''); setSelected(new Set()) }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft size={14} /> Kembali ke daftar kelas
              </button>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Tugas — {namaMapelSelected}</p>

              {/* Sticky action bar */}
              {selected.size > 0 && (
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20 text-white animate-in slide-in-from-top-2">
                  <p className="text-sm font-medium">{selected.size} tugas dipilih</p>
                  <Button
                    size="sm" variant="secondary"
                    className="bg-white text-blue-600 hover:bg-blue-50 border-none h-8 text-xs font-medium"
                    leftIcon={<Copy size={14} />}
                    onClick={() => setSalinOpen(true)}
                  >
                    Salin ke Semester Lain
                  </Button>
                </div>
              )}

              {loadingTugas && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl w-full" />)}

              {!loadingTugas && tugasList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                  <ClipboardList size={36} className="mb-2 opacity-20" />
                  <p className="text-sm">Tidak ada tugas di kelas ini</p>
                </div>
              )}

              {!loadingTugas && tugasList.map((item) => {
                const isChecked = selected.has(item.id)
                const deadline  = item.tanggalSelesai
                  ? format(new Date(item.tanggalSelesai), 'd MMM yyyy', { locale: localeId })
                  : '—'
                const isLate = new Date(item.tanggalSelesai) < new Date()

                return (
                  <div
                    key={item.id}
                    className={[
                      'flex items-start gap-3 px-4 py-3.5 rounded-2xl border transition-all',
                      isChecked
                        ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/40',
                    ].join(' ')}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggle(item.id)}
                      className={['w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all', isChecked ? 'border-blue-500 bg-blue-500' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'].join(' ')}
                    >
                      {isChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(item.id)}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <TujuanBadge tujuan={item.tujuan} />
                        <BentukBadge bentuk={item.bentuk} />
                        {isLate && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">Berakhir</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.judul}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Deadline: {deadline}
                        {item.isPublished
                          ? <span className="ml-2 text-emerald-600 font-medium">• Published</span>
                          : <span className="ml-2 text-gray-400">• Draft</span>
                        }
                      </p>
                    </div>

                    {/* Lihat */}
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/tugas/${item.id}`)}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 transition-colors"
                      title="Lihat detail tugas"
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

      {/* Modal salin — dengan tugas terpilih sebagai sumber */}
      {salinOpen && (
        <SalinTugasModal
          open={salinOpen}
          onClose={() => setSalinOpen(false)}
          guruId={guruId}
          prefillSource={{
            tahunAjaranId,
            semesterId,
            mapelId:      selectedMapelId,
            mapelNama:    namaMapelSelected,
            semesterNama: `${semNama} ${taNama}`,
            tugas:        selectedTugas,
          }}
        />
      )}
    </>
  )
}
