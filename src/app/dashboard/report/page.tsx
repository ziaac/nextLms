'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { isManajemen } from '@/lib/helpers/role'
import { useTahunAjaranList, useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import { useReportEisOverview } from '@/hooks/report/useReportEis'
import { useServiceHealth } from '@/hooks/report/useServiceHealth'
import type { EisGroupBy } from '@/lib/api/report.api'
import { PageHeader, Select, Skeleton, Badge } from '@/components/ui'
import { toast } from 'sonner'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  BookOpen, CalendarDays, ClipboardList, School, Users, User,
  Database, Server, HardDrive, Wifi, RefreshCw, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'

type Option = { value: string; label: string }

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  loading: boolean
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-20 rounded mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {sub && <p className="text-[11px] text-gray-400 mt-1 truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ── Service Health Panel ──────────────────────────────────────────────────────

const SERVICE_META: Record<string, { label: string; icon: React.ElementType }> = {
  database: { label: 'Database',        icon: Database  },
  redis:    { label: 'Redis Cache',     icon: Server    },
  storage:  { label: 'Storage (MinIO)', icon: HardDrive },
}

function ServiceHealthPanel() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useServiceHealth()

  const [wsConnected, setWsConnected] = useState(false)
  useEffect(() => {
    import('@/lib/socket').then(({ getSocket }) => {
      const s = getSocket()
      setWsConnected(s.connected)
      const onConnect    = () => setWsConnected(true)
      const onDisconnect = () => setWsConnected(false)
      s.on('connect',    onConnect)
      s.on('disconnect', onDisconnect)
      return () => {
        s.off('connect',    onConnect)
        s.off('disconnect', onDisconnect)
      }
    })
  }, [])

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : null

  // API Server = jika /health berhasil di-fetch, berarti API up
  const apiOk = !!data

  const frontendStatuses = [
    { key: 'api',       label: 'API Server', icon: Server, ok: apiOk },
    { key: 'websocket', label: 'WebSocket',  icon: Wifi,   ok: wsConnected },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Status Layanan</p>
          {data && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                data.status === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
              }`}
            >
              {data.status === 'ok'
                ? <CheckCircle2 className="w-3 h-3" />
                : <AlertCircle className="w-3 h-3" />
              }
              {data.status === 'ok' ? 'Semua Normal' : 'Ada Gangguan'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[11px] text-gray-400">Diperbarui {lastUpdated}</span>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Frontend-side checks */}
        {frontendStatuses.map(({ key, label, icon: Icon, ok }) => (
          <ServiceChip key={key} label={label} icon={Icon} ok={ok} />
        ))}

        {/* Backend-side checks (dari /health) */}
        {isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[58px] w-full rounded-xl" />)
          : (data?.services ?? []).map((svc) => {
              const meta = SERVICE_META[svc.name] ?? { label: svc.name, icon: Server }
              return (
                <ServiceChip
                  key={svc.name}
                  label={meta.label}
                  icon={meta.icon}
                  ok={svc.status === 'ok'}
                  sub={svc.status === 'ok' ? `${svc.latencyMs}ms` : 'Error'}
                  title={svc.detail}
                />
              )
            })
        }
      </div>
    </div>
  )
}

function ServiceChip({
  label,
  icon: Icon,
  ok,
  sub,
  title,
}: {
  label: string
  icon: React.ElementType
  ok: boolean
  sub?: string
  title?: string
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border ${
        ok
          ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20'
      }`}
      title={title}
    >
      <Icon className={`w-4 h-4 shrink-0 ${ok ? 'text-emerald-500' : 'text-red-500'}`} />
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{label}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {ok
            ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            : <XCircle className="w-3 h-3 text-red-500" />
          }
          <span className={`text-[10px] font-semibold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {sub ?? (ok ? 'Online' : 'Offline')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportEisPage() {
  return (
    <Suspense fallback={<Skeleton className="h-80 w-full rounded-2xl" />}>
      <ReportEisContent />
    </Suspense>
  )
}

function ReportEisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  const bolehAkses = isManajemen(user?.role)

  // URL state
  const spTa      = searchParams.get('tahunAjaranId') ?? ''
  const spSem     = searchParams.get('semesterId') ?? ''
  const spTingkat = searchParams.get('tingkatKelasId') ?? ''
  const spGroupBy = (searchParams.get('groupBy') as EisGroupBy | null) ?? 'week'

  const [tahunAjaranId, setTahunAjaranId] = useState(spTa)
  const [semesterId,    setSemesterId]    = useState(spSem)
  const [tingkatKelasId, setTingkatKelasId] = useState(spTingkat)
  const [groupBy, setGroupBy] = useState<EisGroupBy>(spGroupBy)

  const { data: allTa = [] }       = useTahunAjaranList()
  const { data: taAktifList = [] } = useTahunAjaranActive()
  const taAktif = (taAktifList as { id: string }[])[0]?.id ?? ''

  const taIdForSemester = tahunAjaranId || taAktif
  const { data: semesterList = [] } = useSemesterByTahunAjaran(taIdForSemester || null)
  const { data: tingkatList = [] }  = useTingkatKelasList()

  // default TA aktif
  useEffect(() => {
    if (!tahunAjaranId && taAktif) setTahunAjaranId(taAktif)
    // Intentional: setTahunAjaranId adalah stable setter. tahunAjaranId dikeluarkan
    // dari deps untuk menghindari loop — effect hanya perlu berjalan saat taAktif tersedia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taAktif])

  // default semester aktif untuk TA
  useEffect(() => {
    if (!semesterId && semesterList.length > 0) {
      const aktif = semesterList.find((s) => s.isActive)
      if (aktif) setSemesterId(aktif.id)
    }
  }, [semesterList, semesterId])

  // sync ke URL
  useEffect(() => {
    const qs = new URLSearchParams()
    if (tahunAjaranId)  qs.set('tahunAjaranId',  tahunAjaranId)
    if (semesterId)     qs.set('semesterId',      semesterId)
    if (tingkatKelasId) qs.set('tingkatKelasId',  tingkatKelasId)
    if (groupBy)        qs.set('groupBy',          groupBy)
    router.replace('/dashboard/report?' + qs.toString())
  }, [tahunAjaranId, semesterId, tingkatKelasId, groupBy, router])

  const eisParams = useMemo(() => {
    if (!tahunAjaranId) return null
    return {
      tahunAjaranId,
      semesterId:     semesterId     || undefined,
      tingkatKelasId: tingkatKelasId || undefined,
      groupBy,
    }
  }, [tahunAjaranId, semesterId, tingkatKelasId, groupBy])

  const { data, isLoading, error } = useReportEisOverview(eisParams)

  useEffect(() => {
    if (error) toast.error('Gagal memuat dashboard EIS')
  }, [error])

  const taOptions: Option[] = useMemo(
    () => [{ value: '', label: 'Tahun ajaran (aktif)' }, ...allTa.map((t: any) => ({ value: t.id, label: t.nama }))],
    [allTa],
  )
  const semOptions: Option[] = useMemo(
    () => [{ value: '', label: 'Semester (aktif)' }, ...semesterList.map((s: any) => ({ value: s.id, label: s.nama }))],
    [semesterList],
  )
  const tingkatOptions: Option[] = useMemo(
    () => [{ value: '', label: 'Semua tingkat' }, ...tingkatList.map((t: any) => ({ value: t.id, label: t.nama }))],
    [tingkatList],
  )
  const groupByOptions: Option[] = [
    { value: 'week',     label: 'Per Pekan'    },
    { value: 'month',    label: 'Per Bulan'    },
    { value: 'semester', label: 'Per Semester' },
    { value: 'year',     label: 'Per Tahun'    },
  ]

  if (!bolehAkses) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-gray-400">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    )
  }

  const cards         = data?.cards
  const absensiSeries = data?.series.absensi ?? []
  const materiSeries  = data?.series.materi  ?? []
  const tugasSeries   = data?.series.tugas   ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report & EIS"
        description="Dashboard manajemen: statistik visual, tren, dan daftar terkini."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="info">Default: ISO week</Badge>
          </div>
        }
      />

      {/* Service Health */}
      <ServiceHealthPanel />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          label="Tahun Ajaran"
          options={taOptions}
          value={tahunAjaranId}
          placeholder="Pilih tahun ajaran"
          onChange={(e) => {
            setTahunAjaranId(e.target.value)
            setSemesterId('')
          }}
        />
        <Select
          label="Semester"
          options={semOptions}
          value={semesterId}
          placeholder="Pilih semester"
          onChange={(e) => setSemesterId(e.target.value)}
          disabled={!taIdForSemester}
        />
        <Select
          label="Tingkat"
          options={tingkatOptions}
          value={tingkatKelasId}
          placeholder="Semua tingkat"
          onChange={(e) => setTingkatKelasId(e.target.value)}
        />
        <Select
          label="Periode"
          options={groupByOptions}
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as EisGroupBy)}
        />
      </div>

      {/* Mini cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Kelas"       value={cards?.totalKelas ?? 0}           icon={School}        loading={isLoading} sub="sesuai filter" />
        <StatCard label="Total Siswa"       value={cards?.totalSiswa ?? 0}           icon={Users}         loading={isLoading} sub="aktif (TA)" />
        <StatCard label="Guru Aktif"        value={cards?.totalGuru ?? 0}            icon={User}          loading={isLoading} sub="guru + wali kelas" />
        <StatCard label="Mapel Aktif"       value={cards?.totalMapel ?? 0}           icon={BookOpen}      loading={isLoading} sub="semester" />
        <StatCard label="Sesi Absensi"      value={cards?.sesiDibuka ?? 0}           icon={CalendarDays}  loading={isLoading} sub="range terpilih" />
        <StatCard label="% Kehadiran"       value={`${cards?.persentaseHadir ?? 0}%`} icon={CalendarDays} loading={isLoading} sub="hadir + terlambat" />
        <StatCard label="Materi Published"  value={cards?.totalMateri ?? 0}          icon={BookOpen}      loading={isLoading} sub="range terpilih" />
        <StatCard label="Tugas Published"   value={cards?.totalTugas ?? 0}           icon={ClipboardList} loading={isLoading} sub="range terpilih" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Trend Kehadiran</p>
            <p className="text-xs text-gray-400">{groupBy.toUpperCase()}</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : absensiSeries.length === 0 ? (
            <p className="text-sm text-gray-400 py-20 text-center">Belum ada data absensi.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={absensiSeries}>
                  <defs>
                    <linearGradient id="gradHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="persentaseHadir" stroke="#10b981" fill="url(#gradHadir)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Absensi per Status</p>
            <p className="text-xs text-gray-400">{groupBy.toUpperCase()}</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : absensiSeries.length === 0 ? (
            <p className="text-sm text-gray-400 py-20 text-center">Belum ada data absensi.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={absensiSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalHadir"     stackId="a" fill="#10b981" name="Hadir" />
                  <Bar dataKey="totalTerlambat" stackId="a" fill="#f59e0b" name="Terlambat" />
                  <Bar dataKey="totalIzin"      stackId="a" fill="#3b82f6" name="Izin" />
                  <Bar dataKey="totalSakit"     stackId="a" fill="#8b5cf6" name="Sakit" />
                  <Bar dataKey="totalAlpa"      stackId="a" fill="#ef4444" name="Alpa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Materi Published</p>
            <p className="text-xs text-gray-400">{groupBy.toUpperCase()}</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : materiSeries.length === 0 ? (
            <p className="text-sm text-gray-400 py-20 text-center">Belum ada data materi.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={materiSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="totalMateriPublished" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tugas: Published & % Submit</p>
            <p className="text-xs text-gray-400">{groupBy.toUpperCase()}</p>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : tugasSeries.length === 0 ? (
            <p className="text-sm text-gray-400 py-20 text-center">Belum ada data tugas.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tugasSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bucketLabel" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area yAxisId="left"  type="monotone" dataKey="totalTugasPublished" stroke="#111827" fill="#111827" fillOpacity={0.08} />
                  <Area yAxisId="right" type="monotone" dataKey="persentaseSubmit"    stroke="#10b981" fill="#10b981" fillOpacity={0.08} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Latest lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Tugas Terkini</p>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (data?.latest.tugas.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Belum ada tugas.</p>
          ) : (
            <div className="space-y-2">
              {data!.latest.tugas.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/tugas/${t.id}`)}
                  className="w-full text-left rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t.judul}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{t.mapel} · {t.kelas}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Materi Terkini</p>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (data?.latest.materi.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Belum ada materi.</p>
          ) : (
            <div className="space-y-2">
              {data!.latest.materi.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => router.push(`/dashboard/materi-pelajaran/${m.id}`)}
                  className="w-full text-left rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2.5 transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{m.judul}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{m.mapel} · {m.kelas}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
