import os, textwrap

ROOT = os.path.join(os.path.dirname(__file__), "..")

def write(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  CREATED  {rel}")

# ─────────────────────────────────────────────────────────────────────────────
# FILE 1 — PerizinanStatusBadge
# ─────────────────────────────────────────────────────────────────────────────
write(
    "src/app/dashboard/perizinan/_components/PerizinanStatusBadge.tsx",
    textwrap.dedent("""\
        import type { StatusPerizinan, JenisPerizinan } from '@/types/enums'

        const STATUS_CONFIG: Record<StatusPerizinan, { label: string; className: string }> = {
          PENDING:  { label: 'Menunggu',  className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800' },
          APPROVED: { label: 'Disetujui', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800' },
          REJECTED: { label: 'Ditolak',   className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' },
        }

        const JENIS_CONFIG: Record<JenisPerizinan, { label: string; className: string }> = {
          SAKIT:              { label: 'Sakit',             className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300' },
          IZIN:               { label: 'Izin',              className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300' },
          CUTI:               { label: 'Cuti',              className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300' },
          DINAS:              { label: 'Dinas',             className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300' },
          KEPERLUAN_KELUARGA: { label: 'Kep. Keluarga',    className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300' },
        }

        export function PerizinanStatusBadge({ status }: { status: StatusPerizinan }) {
          const cfg = STATUS_CONFIG[status]
          return (
            <span className={[
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
              cfg.className,
            ].join(' ')}>
              {cfg.label}
            </span>
          )
        }

        export function PerizinanJenisBadge({ jenis }: { jenis: JenisPerizinan }) {
          const cfg = JENIS_CONFIG[jenis]
          return (
            <span className={[
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
              cfg.className,
            ].join(' ')}>
              {cfg.label}
            </span>
          )
        }
    """),
)

# ─────────────────────────────────────────────────────────────────────────────
# FILE 2 — PerizinanFilterBar
# ─────────────────────────────────────────────────────────────────────────────
write(
    "src/app/dashboard/perizinan/_components/PerizinanFilterBar.tsx",
    textwrap.dedent("""\
        'use client'

        import { Select } from '@/components/ui'
        import type { StatusPerizinan, JenisPerizinan } from '@/types/enums'

        const STATUS_OPTIONS = [
          { label: 'Semua Status', value: '' },
          { label: 'Menunggu',     value: 'PENDING'  },
          { label: 'Disetujui',    value: 'APPROVED' },
          { label: 'Ditolak',      value: 'REJECTED' },
        ]

        const JENIS_OPTIONS = [
          { label: 'Semua Jenis',      value: '' },
          { label: 'Sakit',            value: 'SAKIT' },
          { label: 'Izin',             value: 'IZIN'  },
          { label: 'Cuti',             value: 'CUTI'  },
          { label: 'Dinas',            value: 'DINAS' },
          { label: 'Keperluan Keluarga', value: 'KEPERLUAN_KELUARGA' },
        ]

        interface Props {
          status:          StatusPerizinan | ''
          jenis:           JenisPerizinan  | ''
          tanggalMulai:    string
          tanggalSelesai:  string
          onStatusChange:  (v: StatusPerizinan | '') => void
          onJenisChange:   (v: JenisPerizinan  | '') => void
          onTglMulaiChange:  (v: string) => void
          onTglSelesaiChange: (v: string) => void
        }

        export function PerizinanFilterBar({
          status, jenis, tanggalMulai, tanggalSelesai,
          onStatusChange, onJenisChange,
          onTglMulaiChange, onTglSelesaiChange,
        }: Props) {
          return (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
                <Select
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value as StatusPerizinan | '')}
                  className="w-36"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Jenis</label>
                <Select
                  options={JENIS_OPTIONS}
                  value={jenis}
                  onChange={(e) => onJenisChange(e.target.value as JenisPerizinan | '')}
                  className="w-44"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Dari Tanggal</label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => onTglMulaiChange(e.target.value)}
                  className="h-9 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Sampai Tanggal</label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => onTglSelesaiChange(e.target.value)}
                  className="h-9 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )
        }
    """),
)

# ─────────────────────────────────────────────────────────────────────────────
# FILE 3 — PerizinanTable
# ─────────────────────────────────────────────────────────────────────────────
write(
    "src/app/dashboard/perizinan/_components/PerizinanTable.tsx",
    textwrap.dedent("""\
        'use client'

        import { Button } from '@/components/ui'
        import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'
        import { PerizinanStatusBadge, PerizinanJenisBadge } from './PerizinanStatusBadge'
        import type { PerizinanItem, PerizinanMeta } from '@/types/perizinan.types'

        function formatTanggal(iso: string) {
          return new Date(iso).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        }

        interface Props {
          data:      PerizinanItem[]
          meta:      PerizinanMeta
          isLoading: boolean
          page:      number
          onPageChange: (p: number) => void
          onSelect:     (item: PerizinanItem) => void
          showNama:     boolean   // false jika siswa (tidak perlu kolom nama)
        }

        export function PerizinanTable({
          data, meta, isLoading, page, onPageChange, onSelect, showNama,
        }: Props) {
          if (isLoading) return <TableSkeleton />

          if (!data.length) {
            return (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                <FileText className="h-12 w-12 opacity-30" />
                <p className="text-sm">Tidak ada data perizinan.</p>
              </div>
            )
          }

          return (
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                {/* Header */}
                <div className={[
                  'grid gap-4 px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
                  'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide',
                  showNama
                    ? 'grid-cols-[1.5fr_1fr_1fr_120px_100px_80px]'
                    : 'grid-cols-[2fr_1fr_120px_100px_80px]',
                ].join(' ')}>
                  {showNama && <span>Siswa</span>}
                  <span>Tanggal</span>
                  <span>Jenis</span>
                  <span className="text-center">Status</span>
                  <span className="text-center">Diajukan</span>
                  <span />
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className={[
                        'grid gap-4 px-5 py-3.5 items-center cursor-pointer',
                        'hover:bg-emerald-50/60 dark:hover:bg-emerald-900/10 transition-colors',
                        showNama
                          ? 'grid-cols-[1.5fr_1fr_1fr_120px_100px_80px]'
                          : 'grid-cols-[2fr_1fr_120px_100px_80px]',
                      ].join(' ')}
                    >
                      {showNama && (
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {item.user?.profile?.namaLengkap ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.user?.profile?.nisn ?? ''}
                          </p>
                        </div>
                      )}

                      {/* Tanggal */}
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {formatTanggal(item.tanggalMulai)}
                        </p>
                        {item.tanggalMulai !== item.tanggalSelesai && (
                          <p className="text-xs text-gray-400">
                            s/d {formatTanggal(item.tanggalSelesai)}
                          </p>
                        )}
                      </div>

                      {/* Jenis */}
                      <PerizinanJenisBadge jenis={item.jenis} />

                      {/* Status */}
                      <div className="flex justify-center">
                        <PerizinanStatusBadge status={item.status} />
                      </div>

                      {/* Diajukan */}
                      <p className="text-xs text-gray-400 text-center">
                        {formatTanggal(item.createdAt)}
                      </p>

                      {/* Detail */}
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm">
                          Detail
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {meta.lastPage > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p className="text-xs">
                    {((page - 1) * meta.limit) + 1}–{Math.min(page * meta.limit, meta.total)} dari {meta.total} data
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      disabled={page <= 1}
                      onClick={() => onPageChange(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs px-2">
                      {page} / {meta.lastPage}
                    </span>
                    <Button
                      variant="ghost" size="sm"
                      disabled={page >= meta.lastPage}
                      onClick={() => onPageChange(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        }

        function TableSkeleton() {
          return (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
              <div className="h-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="w-24 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  <div className="w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  <div className="w-16 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
                  <div className="w-14 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          )
        }
    """),
)

# ─────────────────────────────────────────────────────────────────────────────
# FILE 4 — PerizinanFormModal (ajukan izin)
# ─────────────────────────────────────────────────────────────────────────────
write(
    "src/app/dashboard/perizinan/_components/PerizinanFormModal.tsx",
    textwrap.dedent("""\
        'use client'

        import { useState, useEffect } from 'react'
        import { toast } from 'sonner'
        import { Modal, Button, Select, Spinner } from '@/components/ui'
        import { useAjukanPerizinan } from '@/hooks/perizinan/usePerizinan'
        import { useSiswaPerKelas } from '@/hooks/perizinan/usePerizinan'
        import { useKelasList } from '@/hooks/kelas/useKelas'
        import { useSemesterByTahunAjaran } from '@/hooks/semester/useSemester'
        import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
        import type { JenisPerizinan } from '@/types/enums'

        const JENIS_OPTIONS = [
          { label: '— Pilih Jenis —',    value: '' },
          { label: 'Sakit',              value: 'SAKIT' },
          { label: 'Izin',               value: 'IZIN'  },
          { label: 'Cuti',               value: 'CUTI'  },
          { label: 'Dinas',              value: 'DINAS' },
          { label: 'Keperluan Keluarga', value: 'KEPERLUAN_KELUARGA' },
        ]

        interface Props {
          open:        boolean
          onClose:     () => void
          /** Jika diisi, mode siswa (tidak perlu pilih siswa) */
          siswaId?:    string
          /** Jika tidak diisi, mode admin/guru — perlu pilih siswa */
          isAdmin?:    boolean
          defaultTaId?: string
          defaultSemId?: string
        }

        export function PerizinanFormModal({
          open, onClose, siswaId, isAdmin, defaultTaId, defaultSemId,
        }: Props) {
          const [jenis,          setJenis]          = useState<JenisPerizinan | ''>('')
          const [tanggalMulai,   setTanggalMulai]   = useState('')
          const [tanggalSelesai, setTanggalSelesai] = useState('')
          const [alasan,         setAlasan]          = useState('')
          const [fileBuktiUrl,   setFileBuktiUrl]   = useState('')

          // Admin mode — pilih siswa via kelas
          const [taId,      setTaId]      = useState(defaultTaId ?? '')
          const [semId,     setSemId]     = useState(defaultSemId ?? '')
          const [kelasId,   setKelasId]   = useState('')
          const [targetId,  setTargetId]  = useState(siswaId ?? '')

          const { data: taListRaw } = useTahunAjaranList()
          const taList = (taListRaw as { id: string; nama: string }[] | undefined) ?? []

          const { data: semListRaw } = useSemesterByTahunAjaran(taId || null)
          const semList = (semListRaw as { id: string; nama: string }[] | undefined) ?? []

          const { data: kelasListRaw } = useKelasList(taId ? { tahunAjaranId: taId } : undefined)
          const kelasList = (kelasListRaw as { id: string; namaKelas: string }[] | undefined) ?? []

          const { data: siswaList = [] } = useSiswaPerKelas(
            isAdmin && kelasId ? kelasId : null,
            isAdmin && semId   ? semId   : null,
          )

          const mutation = useAjukanPerizinan()

          // Reset saat modal ditutup
          useEffect(() => {
            if (!open) {
              setJenis(''); setTanggalMulai(''); setTanggalSelesai('')
              setAlasan(''); setFileBuktiUrl(''); setKelasId('')
              setTargetId(siswaId ?? '')
            }
          }, [open, siswaId])

          const canSubmit = !!jenis && !!tanggalMulai && !!tanggalSelesai &&
            !!alasan.trim() && !!targetId

          const handleSubmit = async () => {
            if (!canSubmit) return
            try {
              await mutation.mutateAsync({
                userId:         targetId,
                jenis:          jenis as JenisPerizinan,
                tanggalMulai,
                tanggalSelesai,
                alasan:         alasan.trim(),
                fileBuktiUrl:   fileBuktiUrl || undefined,
              })
              toast.success('Perizinan berhasil diajukan')
              onClose()
            } catch (err: unknown) {
              const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Gagal mengajukan perizinan'
              toast.error(msg)
            }
          }

          return (
            <Modal
              open={open}
              onClose={onClose}
              title="Ajukan Perizinan"
              size="md"
              footer={
                <>
                  <Button variant="secondary" onClick={onClose}>Batal</Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!canSubmit || mutation.isPending}
                  >
                    {mutation.isPending ? <><Spinner />&nbsp;Menyimpan...</> : 'Ajukan'}
                  </Button>
                </>
              }
            >
              <div className="p-6 space-y-4">
                {/* Admin — pilih siswa */}
                {isAdmin && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Tahun Ajaran
                        </label>
                        <Select
                          options={[
                            { label: '— Pilih TA —', value: '' },
                            ...taList.map((t) => ({ label: t.nama, value: t.id })),
                          ]}
                          value={taId}
                          onChange={(e) => { setTaId(e.target.value); setSemId(''); setKelasId(''); setTargetId('') }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Semester
                        </label>
                        <Select
                          options={[
                            { label: '— Pilih Semester —', value: '' },
                            ...semList.map((s) => ({ label: s.nama, value: s.id })),
                          ]}
                          value={semId}
                          onChange={(e) => { setSemId(e.target.value); setKelasId(''); setTargetId('') }}
                          disabled={!taId}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Kelas</label>
                      <Select
                        options={[
                          { label: '— Pilih Kelas —', value: '' },
                          ...kelasList.map((k) => ({ label: k.namaKelas, value: k.id })),
                        ]}
                        value={kelasId}
                        onChange={(e) => { setKelasId(e.target.value); setTargetId('') }}
                        disabled={!semId}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Siswa</label>
                      <Select
                        options={[
                          { label: '— Pilih Siswa —', value: '' },
                          ...siswaList.map((s) => ({ label: s.nama + ' · ' + s.nisn, value: s.id })),
                        ]}
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        disabled={!kelasId || siswaList.length === 0}
                      />
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-800" />
                  </>
                )}

                {/* Jenis */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Jenis Perizinan <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={JENIS_OPTIONS}
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value as JenisPerizinan | '')}
                  />
                </div>

                {/* Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => {
                        setTanggalMulai(e.target.value)
                        if (!tanggalSelesai || tanggalSelesai < e.target.value)
                          setTanggalSelesai(e.target.value)
                      }}
                      className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={tanggalSelesai}
                      min={tanggalMulai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Alasan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Alasan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={3}
                    placeholder="Jelaskan alasan perizinan..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                {/* File bukti */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    URL Bukti (Opsional)
                  </label>
                  <input
                    type="url"
                    value={fileBuktiUrl}
                    onChange={(e) => setFileBuktiUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full h-9 px-3 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </Modal>
          )
        }
    """),
)

# ─────────────────────────────────────────────────────────────────────────────
# FILE 5 — PerizinanDetailModal
# ─────────────────────────────────────────────────────────────────────────────
write(
    "src/app/dashboard/perizinan/_components/PerizinanDetailModal.tsx",
    textwrap.dedent("""\
        'use client'

        import { useState } from 'react'
        import { toast } from 'sonner'
        import { Modal, Button, Spinner } from '@/components/ui'
        import { CheckCircle, XCircle, ExternalLink, Trash2 } from 'lucide-react'
        import { PerizinanStatusBadge, PerizinanJenisBadge } from './PerizinanStatusBadge'
        import { useApprovalPerizinan, useHapusPerizinan } from '@/hooks/perizinan/usePerizinan'
        import type { PerizinanItem } from '@/types/perizinan.types'
        import type { StatusPerizinan } from '@/types/enums'

        function formatTanggal(iso: string) {
          return new Date(iso).toLocaleDateString('id-ID', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
          })
        }

        interface Props {
          open:      boolean
          onClose:   () => void
          item:      PerizinanItem | null
          canApprove: boolean   // true jika user adalah wali kelas / admin
          canDelete:  boolean   // true jika PENDING dan milik sendiri / admin
          isSiswa:    boolean
        }

        export function PerizinanDetailModal({
          open, onClose, item, canApprove, canDelete, isSiswa,
        }: Props) {
          const [catatan,       setCatatan]       = useState('')
          const [confirmHapus,  setConfirmHapus]  = useState(false)

          const approvalMutation = useApprovalPerizinan()
          const hapusMutation    = useHapusPerizinan()

          if (!item) return null

          const isPending  = item.status === 'PENDING'

          const handleApproval = async (status: StatusPerizinan) => {
            try {
              await approvalMutation.mutateAsync({
                id:      item.id,
                payload: { status, catatanApproval: catatan.trim() || undefined },
              })
              toast.success(status === 'APPROVED' ? 'Perizinan disetujui' : 'Perizinan ditolak')
              onClose()
            } catch (err: unknown) {
              const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? 'Gagal memproses perizinan'
              toast.error(msg)
            }
          }

          const handleHapus = async () => {
            try {
              await hapusMutation.mutateAsync(item.id)
              toast.success('Perizinan berhasil dibatalkan')
              onClose()
            } catch {
              toast.error('Gagal membatalkan perizinan')
            }
          }

          return (
            <Modal
              open={open}
              onClose={() => { setConfirmHapus(false); onClose() }}
              title="Detail Perizinan"
              size="md"
              footer={
                <div className="flex items-center justify-between w-full">
                  <div>
                    {canDelete && isPending && (
                      confirmHapus ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500">Yakin batalkan?</span>
                          <Button
                            variant="danger" size="sm"
                            onClick={handleHapus}
                            disabled={hapusMutation.isPending}
                          >
                            {hapusMutation.isPending ? <Spinner /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                            Ya, Batalkan
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setConfirmHapus(false)}>
                            Tidak
                          </Button>
                        </div>
                      ) : (
                        <Button variant="danger" size="sm" onClick={() => setConfirmHapus(true)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />Batalkan Izin
                        </Button>
                      )
                    )}
                  </div>
                  <Button variant="secondary" onClick={onClose}>Tutup</Button>
                </div>
              }
            >
              <div className="p-6 space-y-5">
                {/* Info siswa */}
                {!isSiswa && (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {item.user?.profile?.namaLengkap?.[0] ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {item.user?.profile?.namaLengkap ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">NISN: {item.user?.profile?.nisn ?? '—'}</p>
                    </div>
                  </div>
                )}

                {/* Status & Jenis */}
                <div className="flex items-center gap-2 flex-wrap">
                  <PerizinanStatusBadge status={item.status} />
                  <PerizinanJenisBadge  jenis={item.jenis}  />
                </div>

                {/* Tanggal */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Periode</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formatTanggal(item.tanggalMulai)}
                    {item.tanggalMulai !== item.tanggalSelesai && (
                      <> &rarr; {formatTanggal(item.tanggalSelesai)}</>
                    )}
                  </p>
                </div>

                {/* Alasan */}
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Alasan</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.alasan}</p>
                </div>

                {/* Bukti */}
                {item.fileBuktiUrl && (
                  
                    href={item.fileBuktiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Lihat Bukti / Surat
                  </a>
                )}

                {/* Info approval */}
                {item.status !== 'PENDING' && item.approver && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                      {item.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'} oleh
                    </p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {item.approver.profile?.namaLengkap ?? '—'}
                    </p>
                    {item.catatanApproval && (
                      <p className="text-xs text-gray-500 italic">"{item.catatanApproval}"</p>
                    )}
                  </div>
                )}

                {/* Form approval — hanya jika PENDING dan canApprove */}
                {isPending && canApprove && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Proses Perizinan
                    </p>
                    <textarea
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={2}
                      placeholder="Catatan (opsional)..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleApproval('APPROVED')}
                        disabled={approvalMutation.isPending}
                      >
                        {approvalMutation.isPending
                          ? <Spinner />
                          : <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                        }
                        Setujui
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleApproval('REJECTED')}
                        disabled={approvalMutation.isPending}
                      >
                        {approvalMutation.isPending
                          ? <Spinner />
                          : <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        }
                        Tolak
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Modal>
          )
        }
    """),
)

# ─────────────────────────────────────────────────────────────────────────────
# FILE 6 — Page utama perizinan
# ─────────────────────────────────────────────────────────────────────────────
write(
    "src/app/dashboard/perizinan/page.tsx",
    textwrap.dedent("""\
        'use client'

        import { useState, useMemo } from 'react'
        import { useAuthStore }           from '@/stores/auth.store'
        import { PageHeader, Button }     from '@/components/ui'
        import { Plus }                   from 'lucide-react'
        import { usePerizinanList }       from '@/hooks/perizinan/usePerizinan'
        import { PerizinanFilterBar }     from './_components/PerizinanFilterBar'
        import { PerizinanTable }         from './_components/PerizinanTable'
        import { PerizinanFormModal }     from './_components/PerizinanFormModal'
        import { PerizinanDetailModal }   from './_components/PerizinanDetailModal'
        import type { PerizinanItem }     from '@/types/perizinan.types'
        import type { StatusPerizinan, JenisPerizinan } from '@/types/enums'

        const MANAJEMEN_ROLES = [
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH',
          'WAKIL_KEPALA', 'STAFF_TU',
        ]
        const APPROVE_ROLES = [
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH',
          'WAKIL_KEPALA', 'STAFF_TU', 'GURU',
        ]

        export default function PerizinanPage() {
          const { user } = useAuthStore()

          const isSiswa    = user?.role === 'SISWA'
          const isManajemen = MANAJEMEN_ROLES.includes(user?.role ?? '')
          const canApprove  = APPROVE_ROLES.includes(user?.role ?? '')

          // ── Filter ────────────────────────────────────────────────────
          const [page,           setPage]           = useState(1)
          const [status,         setStatus]         = useState<StatusPerizinan | ''>('')
          const [jenis,          setJenis]          = useState<JenisPerizinan  | ''>('')
          const [tanggalMulai,   setTanggalMulai]   = useState('')
          const [tanggalSelesai, setTanggalSelesai] = useState('')

          // ── Modal ────────────────────────────────────────────────────
          const [formOpen,    setFormOpen]    = useState(false)
          const [detailItem,  setDetailItem]  = useState<PerizinanItem | null>(null)

          // ── Query params ─────────────────────────────────────────────
          const queryParams = useMemo(() => ({
            page,
            limit: 15,
            ...(isSiswa && user?.id ? { userId: user.id } : {}),
            ...(status         ? { status }         : {}),
            ...(jenis          ? { jenis }           : {}),
            ...(tanggalMulai   ? { tanggalMulai }    : {}),
            ...(tanggalSelesai ? { tanggalSelesai }  : {}),
          }), [page, status, jenis, tanggalMulai, tanggalSelesai, isSiswa, user?.id])

          const { data, isLoading } = usePerizinanList(queryParams)

          const perizinanList = data?.data ?? []
          const meta          = data?.meta ?? { total: 0, page: 1, limit: 15, lastPage: 1 }

          // ── Reset page saat filter berubah ───────────────────────────
          const handleFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
            setter(v); setPage(1)
          }

          // ── Cek canDelete per item ────────────────────────────────────
          const canDeleteItem = (item: PerizinanItem) => {
            if (item.status !== 'PENDING') return false
            if (isManajemen) return true
            return item.userId === user?.id
          }

          return (
            <div className="space-y-6">
              <PageHeader
                title="Perizinan"
                description="Kelola pengajuan izin tidak hadir siswa"
                actions={
                  <Button variant="primary" size="sm" onClick={() => setFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />Ajukan Izin
                  </Button>
                }
              />

              {/* Filter — sembunyikan filter tanggal untuk siswa */}
              <PerizinanFilterBar
                status={status}
                jenis={jenis}
                tanggalMulai={tanggalMulai}
                tanggalSelesai={tanggalSelesai}
                onStatusChange={handleFilterChange(setStatus)}
                onJenisChange={handleFilterChange(setJenis)}
                onTglMulaiChange={handleFilterChange(setTanggalMulai)}
                onTglSelesaiChange={handleFilterChange(setTanggalSelesai)}
              />

              {/* Info count */}
              <p className="text-xs text-gray-400 -mt-3">
                Total{' '}
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {meta.total} perizinan
                </span>
              </p>

              <PerizinanTable
                data={perizinanList}
                meta={meta}
                isLoading={isLoading}
                page={page}
                onPageChange={setPage}
                onSelect={setDetailItem}
                showNama={!isSiswa}
              />

              <PerizinanFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                siswaId={isSiswa ? user?.id : undefined}
                isAdmin={!isSiswa}
              />

              <PerizinanDetailModal
                open={!!detailItem}
                onClose={() => setDetailItem(null)}
                item={detailItem}
                canApprove={canApprove && !isSiswa}
                canDelete={detailItem ? canDeleteItem(detailItem) : false}
                isSiswa={isSiswa}
              />
            </div>
          )
        }
    """),
)

print("\\nBatch 2 DONE — 6 file digenerate.")
print("Jalankan: python scripts/batch2_perizinan_ui.py")