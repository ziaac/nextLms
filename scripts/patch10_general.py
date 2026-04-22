import os

ROOT = os.path.join(os.path.dirname(__file__), "..")

def write(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  WRITTEN  {rel}")

# ── 1. API function ───────────────────────────────────────────────────────────
absensi_api = os.path.join(ROOT, "src/lib/api/absensi.api.ts")
with open(absensi_api, "r", encoding="utf-8") as f:
    content = f.read()

addition = """
export interface RekapJadwalItem {
  id:          string
  namaLengkap: string
  nisn:        string
  status:      string
  waktuMasuk:  string | null
  keterangan:  string | null
}

export interface RekapJadwalResponse {
  tanggal: string
  total:   number
  summary: { HADIR: number; TERLAMBAT: number; SAKIT: number; IZIN: number; ALPA: number; TAP: number }
  data:    RekapJadwalItem[]
}

export const getRekapJadwalHariIni = (jadwalPelajaranId: string): Promise<RekapJadwalResponse> =>
  api.get<RekapJadwalResponse>(`/absensi/rekap-jadwal/${jadwalPelajaranId}`).then((r) => r.data)
"""

if "getRekapJadwalHariIni" not in content:
    with open(absensi_api, "a", encoding="utf-8") as f:
        f.write(addition)
    print("  PATCHED  src/lib/api/absensi.api.ts")

# ── 2. Komponen RekapJadwalModal ──────────────────────────────────────────────
write("src/app/dashboard/absensi/guru/_components/RekapJadwalModal.tsx", """\
'use client'

import { useQuery }      from '@tanstack/react-query'
import { Modal }         from '@/components/ui/Modal'
import { Spinner }       from '@/components/ui/Spinner'
import { getRekapJadwalHariIni, type RekapJadwalItem } from '@/lib/api/absensi.api'
import {
  CheckCircle2, AlertCircle, MinusCircle, Clock, BookOpen,
} from 'lucide-react'

const STATUS_CFG: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
  HADIR:     { label: 'Hadir',     cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20',  Icon: CheckCircle2 },
  TERLAMBAT: { label: 'Terlambat', cls: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',     Icon: AlertCircle  },
  SAKIT:     { label: 'Sakit',     cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20',           Icon: MinusCircle  },
  IZIN:      { label: 'Izin',      cls: 'text-purple-700 bg-purple-50 dark:bg-purple-900/20',     Icon: MinusCircle  },
  ALPA:      { label: 'Alpa',      cls: 'text-red-700 bg-red-50 dark:bg-red-900/20',              Icon: AlertCircle  },
  TAP:       { label: 'TAP',       cls: 'text-orange-700 bg-orange-50 dark:bg-orange-900/20',     Icon: AlertCircle  },
}

const MODE_LABEL: Record<string, string> = {
  QR_LURING: 'QR + GPS',
  QR_WFH:    'QR WFH',
  MANUAL:    'Manual',
}

function fmtTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Makassar',
  })
}

interface Props {
  open:              boolean
  onClose:           () => void
  jadwalPelajaranId: string
  namaMapel:         string
  namaKelas:         string
  jam:               string
  modeSesi:          string | null
}

export function RekapJadwalModal({
  open, onClose, jadwalPelajaranId, namaMapel, namaKelas, jam, modeSesi,
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey:  ['absensi', 'rekap-jadwal', jadwalPelajaranId],
    queryFn:   () => getRekapJadwalHariIni(jadwalPelajaranId),
    enabled:   open && !!jadwalPelajaranId,
    staleTime: 0,
  })

  const summary = data?.summary
  const list    = data?.data ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rekap Absensi"
      description={`${namaMapel} · ${namaKelas} · ${jam}`}
      size="md"
      footer={null}
    >
      <div className="p-5 space-y-4">
        {/* Info sesi */}
        {modeSesi && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl">
            <BookOpen className="h-3.5 w-3.5" />
            Mode: <span className="font-medium">{MODE_LABEL[modeSesi] ?? modeSesi}</span>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-6 gap-1.5">
            {Object.entries(summary).map(([key, val]) => {
              const cfg = STATUS_CFG[key]
              return (
                <div
                  key={key}
                  className={[
                    'flex flex-col items-center py-2 rounded-xl text-center',
                    cfg?.cls ?? 'bg-gray-50 text-gray-600',
                  ].join(' ')}
                >
                  <span className="text-lg font-bold">{val}</span>
                  <span className="text-[10px] font-medium">{cfg?.label ?? key}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* List siswa */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-400 gap-2">
            <BookOpen className="h-8 w-8 opacity-30" />
            <p className="text-sm">Belum ada data absensi untuk sesi ini</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {list.map((item: RekapJadwalItem, idx: number) => {
              const cfg = STATUS_CFG[item.status] ?? STATUS_CFG['ALPA']
              const Icon = cfg.Icon
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  {/* No */}
                  <span className="text-xs text-gray-400 w-5 text-right shrink-0">
                    {idx + 1}
                  </span>

                  {/* Nama & NISN */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.namaLengkap}
                    </p>
                    <p className="text-[10px] text-gray-400">{item.nisn}</p>
                  </div>

                  {/* Waktu masuk */}
                  {item.waktuMasuk && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <Clock className="h-3 w-3" />
                      {fmtTime(item.waktuMasuk)}
                    </div>
                  )}

                  {/* Status badge */}
                  <span className={[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0',
                    cfg.cls,
                  ].join(' ')}>
                    <Icon size={10} />
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
""")

print("\nDONE — lanjut patch JadwalGuruCard dan page guru")