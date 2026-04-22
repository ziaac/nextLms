'use client'

import { useState, useEffect }   from 'react'
import { QRCodeSVG }             from 'qrcode.react'
import {
  Clock, Users, CheckCircle2, XCircle, RefreshCw,
  ChevronDown, Check,
} from 'lucide-react'
import { useQueryClient }        from '@tanstack/react-query'
import { Modal }                 from '@/components/ui/Modal'
import { Button }                from '@/components/ui/Button'
import { Spinner }               from '@/components/ui/Spinner'
import {
  useSesiLive,
  useTutupSesi,
  usePerpanjangSesi,
  useOverrideSiswaSesi,
  useBatalkanScan,
  sesiKeys,
} from '@/hooks/absensi/useSesiAbsensi'
import { getSocket }    from '@/lib/socket'
import { useAuthStore } from '@/stores/auth.store'
import type { SesiResponse, StatusAbsensi } from '@/types'

interface Props {
  open:    boolean
  sesi:    SesiResponse | null
  onClose: () => void
  onTutup: () => void
}

const STATUS_OPTIONS: { value: StatusAbsensi; label: string; cls: string }[] = [
  { value: 'HADIR',     label: 'Hadir',     cls: 'text-emerald-600' },
  { value: 'TERLAMBAT', label: 'Terlambat', cls: 'text-yellow-600'  },
  { value: 'SAKIT',     label: 'Sakit',     cls: 'text-blue-600'    },
  { value: 'IZIN',      label: 'Izin',      cls: 'text-purple-600'  },
  { value: 'ALPA',      label: 'Alpa',      cls: 'text-red-500'     },
]

const STATUS_CLS: Record<string, string> = {
  HADIR:     'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  TERLAMBAT: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  SAKIT:     'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  IZIN:      'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  ALPA:      'text-red-500 bg-red-50 dark:bg-red-900/20',
}

export function QRSesiPanel({ open, sesi, onClose, onTutup }: Props) {
  const qc      = useQueryClient()
  const user    = useAuthStore((s) => s.user)
  const token   = sesi?.token   ?? null
  const kelasId = sesi?.kelasId ?? null

  const { data: sesiDetail, isLoading } = useSesiLive(open ? token : null)
  const tutup      = useTutupSesi()
  const perpanjang = usePerpanjangSesi()
  const override   = useOverrideSiswaSesi()
  const batalkan   = useBatalkanScan()

  const [timeLeft, setTimeLeft]           = useState(0)
  const [tambahanMenit, setTambahanMenit] = useState(10)
  const [openDropdown,    setOpenDropdown]    = useState<string | null>(null)
  const [resetTarget,     setResetTarget]     = useState<{ id: string; nama: string } | null>(null)
  
  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sesiDetail?.sesi.expiresAt) return
    const tick = () => {
      const diff = new Date(sesiDetail.sesi.expiresAt).getTime() - Date.now()
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [sesiDetail?.sesi.expiresAt])

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !token || !kelasId || !user?.id) return
    const s = getSocket()
    s.emit('join:kelas', kelasId)
    const handler = () => {
      qc.invalidateQueries({ queryKey: sesiKeys.detail(token) })
    }
    s.on('absensi:siswa-scan', handler)
    return () => { s.off('absensi:siswa-scan', handler) }
  }, [open, token, kelasId, user?.id, qc])

  // Tutup dropdown saat klik luar
  useEffect(() => {
    if (!openDropdown) return
    const handler = () => setOpenDropdown(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openDropdown])

  const qrUrl = token && typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/absensi/scan?token=${token}`
    : ''

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`
  }

  const handleTutup = () => {
    if (!token) return
    tutup.mutate(token, { onSuccess: onTutup })
  }

  const handlePerpanjang = () => {
    if (!token) return
    perpanjang.mutate({ token, payload: { tambahanMenit } })
  }

  const handleOverride = (userId: string, status: StatusAbsensi) => {
    if (!token) return
    setOpenDropdown(null)
    override.mutate({ token, payload: { userId, status } })
  }

  const handleBatalkanScan = (userId: string) => {
    if (!token) return
    setOpenDropdown(null)
    batalkan.mutate({ token, userId })
  }

  const peserta   = sesiDetail?.peserta ?? []
  const statistik = sesiDetail?.statistik
  const isExpired = timeLeft === 0 && !!sesiDetail

  // Auto-close modal saat sesi expired
  useEffect(() => {
    if (!isExpired) return
    const t = setTimeout(() => onTutup(), 3000)
    return () => clearTimeout(t)
  }, [isExpired, onTutup])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sesi Absensi Aktif"
      description={sesi ? `${sesi.tanggal} \u2022 ${sesi.jamMulai} \u2022 ${sesi.mode}` : undefined}
      size="xl"
      fullHeight
      footer={
        <div className="flex items-center gap-3 w-full flex-wrap">
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-xs text-gray-500 hidden sm:inline">Tambah:</span>
            <input
              type="number" value={tambahanMenit} min={1} max={60}
              onChange={(e) => setTambahanMenit(Math.max(1, +e.target.value))}
              className="w-14 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-center outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-gray-500">menit</span>
            <Button
              variant="secondary" size="sm"
              loading={perpanjang.isPending}
              disabled={isExpired || perpanjang.isPending}
              leftIcon={<RefreshCw size={13} />}
              onClick={handlePerpanjang}
            >
              Perpanjang
            </Button>
          </div>
          <Button
            variant="danger" size="sm"
            loading={tutup.isPending}
            disabled={isExpired || tutup.isPending}
            onClick={handleTutup}
          >
            {isExpired ? 'Sesi Berakhir' : 'Tutup Sesi'}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : (
        <div className="p-6 grid md:grid-cols-2 gap-6 h-full overflow-hidden">

          {/* Kolom Kiri: QR + Countdown */}
          <div className="flex flex-col items-center gap-4">
            <div className={[
              'p-4 rounded-2xl bg-white border-4 transition-all',
              isExpired
                ? 'border-red-300 opacity-50 grayscale'
                : 'border-emerald-400 shadow-lg',
            ].join(' ')}>
              {qrUrl ? (
                <QRCodeSVG value={qrUrl} size={188} />
              ) : (
                <div className="w-[188px] h-[188px] flex items-center justify-center bg-gray-100">
                  <Spinner />
                </div>
              )}
            </div>
            <div className={[
              'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-3xl font-mono font-bold tabular-nums',
              timeLeft <= 60
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
            ].join(' ')}>
              <Clock size={20} />
              {fmt(timeLeft)}
            </div>
            {isExpired && (
              <p className="text-xs text-red-500 text-center font-medium">
                Sesi telah berakhir. Modal akan tertutup otomatis dalam 3 detik...
              </p>
            )}
          </div>

          {/* Kolom Kanan: Statistik + Peserta */}
            <div className="flex flex-col gap-4 h-full overflow-hidden">
              {statistik && (
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Total" value={statistik.total} />
                <StatCard label="Hadir" value={statistik.hadir} color="text-emerald-600" />
                <StatCard label="Belum" value={statistik.sisa}  color="text-orange-500"  />
              </div>
            )}

            <div className="flex flex-col flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2 shrink-0">
                <Users size={12} />
                Peserta ({peserta.filter(p => p.isEligible).length} siswa)
              </p>
              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {peserta.map((p) => {
                  const isOverriding = override.isPending && override.variables?.payload.userId === p.id
                  const statusCls    = p.statusAbsen ? STATUS_CLS[p.statusAbsen] ?? '' : ''
                  const isOpen       = openDropdown === p.id

                  return (
                    <div
                      key={p.id}
                      className={[
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                        !p.isEligible
                          ? 'opacity-30'
                          : p.sudahScan || p.statusAbsen
                          ? 'bg-emerald-50 dark:bg-emerald-900/20'
                          : 'bg-gray-50 dark:bg-gray-800/50',
                      ].join(' ')}
                    >
                      {/* Nomor absen */}
                      <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 tabular-nums">
                        {p.absen}
                      </span>

                      {/* Nama */}
                      <span className="flex-1 truncate text-gray-800 dark:text-gray-200">{p.nama}</span>

                      {/* Status badge */}
                      {p.statusAbsen && (
                        <span className={'text-xs font-medium px-1.5 py-0.5 rounded-md ' + statusCls}>
                          {p.statusAbsen}
                        </span>
                      )}

                      {/* Scan indicator / Override dropdown */}
                      {p.isEligible && (
                        isOverriding ? (
                          <Spinner />
                        ) : (
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenDropdown(isOpen ? null : p.id)
                              }}
                              className={[
                                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                                p.sudahScan || p.statusAbsen
                                  ? 'text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                              ].join(' ')}
                            >
                              {p.sudahScan || p.statusAbsen
                                ? <CheckCircle2 size={14} />
                                : <XCircle      size={14} />
                              }
                              <ChevronDown size={10} />
                            </button>

                            {/* Dropdown override */}
                            {isOpen && (
                              <div
                                className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[120px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <p className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                                  Ubah status
                                </p>
                                {STATUS_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleOverride(p.id, opt.value)}
                                    className={[
                                      'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                                      opt.cls,
                                    ].join(' ')}
                                  >
                                    {opt.label}
                                    {p.statusAbsen === opt.value && <Check size={12} />}
                                  </button>
                                ))}

                                {/* Batalkan scan — hanya muncul jika siswa sudah scan */}
                                {(p.sudahScan || !!p.statusAbsen) && (
                                    <>
                                      <div className="h-px bg-gray-100 dark:bg-gray-800 mx-2" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdown(null)
                                          setResetTarget({ id: p.id, nama: p.nama })
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      >
                                        <XCircle size={13} />
                                        Reset Absen
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )
                })}
                {peserta.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 italic">
                    Memuat daftar peserta...
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
      {/* Modal konfirmasi reset absen */}
      {resetTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setResetTarget(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Reset Absen</h3>
                <p className="text-xs text-gray-500 mt-0.5">{resetTarget.nama}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Status absensi siswa ini akan <span className="font-semibold text-red-500">dihapus</span>.
              Siswa dapat melakukan scan ulang.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setResetTarget(null)}>
                Batal
              </Button>
              <Button
                variant="danger" size="sm"
                loading={batalkan.isPending}
                onClick={() => {
                  handleBatalkanScan(resetTarget.id)
                  setResetTarget(null)
                }}
              >
                <XCircle size={14} className="mr-1" />Ya, Reset
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
function StatCard({ label, value, color = 'text-gray-900 dark:text-white' }: {
  label: string; value: number; color?: string
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
      <p className={'text-2xl font-bold tabular-nums ' + color}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}
