'use client'

import { useState, use, Suspense }           from 'react'
import { useRouter, useSearchParams }  from 'next/navigation'
import { useQuery }                    from '@tanstack/react-query'
import {
  ArrowLeft, Archive, BookOpen, ClipboardList,
  CalendarDays, FileText, Lock,
} from 'lucide-react'
import { Badge, Skeleton }             from '@/components/ui'
import api                             from '@/lib/axios'

// ── Tab type ──────────────────────────────────────────────────────
type Tab = 'materi' | 'tugas' | 'absensi' | 'dokumen'
const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'materi',   label: 'Materi',   icon: <BookOpen    className="w-4 h-4" /> },
  { key: 'tugas',    label: 'Tugas',    icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'absensi',  label: 'Absensi',  icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'dokumen',  label: 'Dokumen',  icon: <FileText    className="w-4 h-4" /> },
]

// ── Helpers ───────────────────────────────────────────────────────
function formatTanggal(val?: string | null) {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Page ─────────────────────────────────────────────────────────
export default function ArsipMapelDetailPage({ params }: { params: Promise<{ mataPelajaranId: string }> }) {
  return <Suspense><ArsipMapelDetailContent params={params} /></Suspense>
}
function ArsipMapelDetailContent({ params }: { params: Promise<{ mataPelajaranId: string }> }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { mataPelajaranId: mapelId } = use(params)

  const semesterId = searchParams.get('semesterId') ?? ''
  const taNama     = searchParams.get('taNama')     ?? ''
  const semNama    = searchParams.get('semNama')    ?? ''
  const kelasId    = searchParams.get('kelasId')    ?? ''
  const defaultTab = (searchParams.get('tab') as Tab) ?? 'materi'

  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)

  // ── Materi ────────────────────────────────────────────────────
  const { data: materiData, isLoading: loadingMateri } = useQuery({
    queryKey: ['arsip-materi', mapelId, semesterId],
    queryFn:  () => api.get('/materi-pelajaran', {
      params: { mataPelajaranId: mapelId, semesterId, limit: 100 },
    }).then((r) => r.data?.data ?? []),
    enabled: !!mapelId && !!semesterId && activeTab === 'materi',
    staleTime: 1000 * 60 * 10,
  })

  // ── Tugas ─────────────────────────────────────────────────────
  const { data: tugasData, isLoading: loadingTugas } = useQuery({
    queryKey: ['arsip-tugas', mapelId, semesterId],
    queryFn:  () => api.get('/tugas', {
      params: { mataPelajaranId: mapelId, semesterId, limit: 100 },
    }).then((r) => r.data?.data ?? []),
    enabled: !!mapelId && !!semesterId && activeTab === 'tugas',
    staleTime: 1000 * 60 * 10,
  })

  // ── Absensi rekap ─────────────────────────────────────────────
  const { data: absensiData, isLoading: loadingAbsensi } = useQuery({
    queryKey: ['arsip-absensi', kelasId, semesterId, mapelId],
    queryFn:  () => api.get(`/absensi/rekap/kelas/${kelasId}`, {
      params: { semesterId, mataPelajaranId: mapelId },
    }).then((r) => r.data ?? null),
    enabled: !!kelasId && !!semesterId && activeTab === 'absensi',
    staleTime: 1000 * 60 * 10,
  })

  // ── Dokumen ───────────────────────────────────────────────────
  const { data: dokumenData, isLoading: loadingDokumen } = useQuery({
    queryKey: ['arsip-dokumen', mapelId, semesterId],
    queryFn:  () => api.get('/dokumen-pengajaran', {
      params: { mataPelajaranId: mapelId, semesterId, limit: 100 },
    }).then((r) => r.data?.data ?? []),
    enabled: !!mapelId && !!semesterId && activeTab === 'dokumen',
    staleTime: 1000 * 60 * 10,
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12">

      {/* ── Back button ── */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
      >
        <span className="w-7 h-7 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
          <ArrowLeft className="w-3.5 h-3.5" />
        </span>
        Kembali ke Arsip
      </button>

      {/* ── Header read-only banner ── */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center shrink-0">
          <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold text-amber-800 dark:text-amber-200">
              Mode Arsip
            </h1>
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <Badge variant="warning">Read Only</Badge>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            {taNama}
            {semNama && ` · Semester ${semNama}`}
          </p>
          <p className="text-[11px] text-amber-500 mt-1">
            Data ini adalah rekap historis dan tidak dapat diedit.
          </p>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300',
            ].join(' ')}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Materi ── */}
      {activeTab === 'materi' && (
        <div className="space-y-3">
          {loadingMateri ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : !materiData?.length ? (
            <EmptyTab label="Tidak ada materi pada periode ini." />
          ) : (
            materiData.map((m: any) => (
              <div key={m.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{m.judul}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.tipeMateri} · Pertemuan {m.pertemuanKe ?? '-'}</p>
                  </div>
                  <span className={[
                    'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                    m.isPublished
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-400',
                  ].join(' ')}>
                    {m.isPublished ? 'Dipublish' : 'Draft'}
                  </span>
                </div>
                {m.deskripsi && <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{m.deskripsi}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Tugas ── */}
      {activeTab === 'tugas' && (
        <div className="space-y-3">
          {loadingTugas ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : !tugasData?.length ? (
            <EmptyTab label="Tidak ada tugas pada periode ini." />
          ) : (
            tugasData.map((t: any) => (
              <div key={t.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{t.judul}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.tujuan} · {t.bentuk}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{formatTanggal(t.tanggalSelesai)}</span>
                </div>
                {t._count?.pengumpulanTugas != null && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {t._count.pengumpulanTugas} pengumpulan
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Absensi ── */}
      {activeTab === 'absensi' && (
        <div className="space-y-3">
          {loadingAbsensi ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : !absensiData ? (
            <EmptyTab label="Data absensi tidak tersedia untuk periode ini." />
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                {JSON.stringify(absensiData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Dokumen ── */}
      {activeTab === 'dokumen' && (
        <div className="space-y-3">
          {loadingDokumen ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : !dokumenData?.length ? (
            <EmptyTab label="Tidak ada dokumen pengajaran pada periode ini." />
          ) : (
            dokumenData.map((d: any) => (
              <div key={d.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{d.judul}</p>
                <p className="text-xs text-gray-400 mt-0.5">{d.jenisDokumen} · {d.status}</p>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  )
}

// ── Helper component ──────────────────────────────────────────────
function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
      <Archive className="w-8 h-8 opacity-40" />
      <p className="text-sm">{label}</p>
    </div>
  )
}
