'use client'

import { useState, useEffect, useRef }  from 'react'
import { CheckSquare, Square, Users, AlertCircle } from 'lucide-react'
import { Modal }               from '@/components/ui/Modal'
import { Button }              from '@/components/ui/Button'
import { Spinner }             from '@/components/ui/Spinner'
import { useSesiLive }         from '@/hooks/absensi/useSesiAbsensi'
import { useSimpanManualBulk } from '@/hooks/absensi/useAbsensiManajemen'
import type { StatusAbsensi }  from '@/types'

interface Props {
  open:    boolean
  token:   string | null
  onClose: () => void
}

export function ManualAbsensiModal({ open, token, onClose }: Props) {
  const { data: sesiDetail, isLoading } = useSesiLive(open ? token : null)
  const { mutate, isPending }           = useSimpanManualBulk()

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const initDoneRef = useRef(false)

  // Reset flag saat token berganti (sesi baru)
  useEffect(() => {
    initDoneRef.current = false
    setCheckedIds(new Set())
  }, [token])

  // Init checklist HANYA sekali per sesi — berdasarkan statusAbsen dari backend
  useEffect(() => {
    if (!open || !sesiDetail || initDoneRef.current) return
    const ids = sesiDetail.peserta
      .filter((p) => p.isEligible && p.statusAbsen !== 'ALPA')
      .map((p) => p.id)
    setCheckedIds(new Set(ids))
    initDoneRef.current = true
  }, [open, sesiDetail])

  const allPeserta  = sesiDetail?.peserta ?? []
  const eligible    = allPeserta.filter((p) => p.isEligible)
  const notEligible = allPeserta.filter((p) => !p.isEligible)

  const allChecked = eligible.length > 0 && eligible.every((p) => checkedIds.has(p.id))
  const hadirCount = eligible.filter((p) => checkedIds.has(p.id)).length

  const toggleAll = () => {
    setCheckedIds(allChecked ? new Set() : new Set(eligible.map((p) => p.id)))
  }

  const toggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = () => {
    if (!sesiDetail) return
    const { sesi } = sesiDetail
    mutate(
      {
        jadwalPelajaranId: sesi.jadwalPelajaranId,
        tanggal:           sesi.tanggal,
        absensi: eligible.map((p) => ({
          userId: p.id,
          status: (checkedIds.has(p.id) ? 'HADIR' : 'ALPA') as StatusAbsensi,
        })),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Absensi Manual"
      description={sesiDetail?.sesi.tanggal}
      size="md"
      footer={
        sesiDetail ? (
          <>
            <span className="text-sm text-gray-500 mr-auto">
              Hadir: <span className="font-semibold text-emerald-600">{hadirCount}</span>
              /{eligible.length}
            </span>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button variant="primary" size="sm" loading={isPending} onClick={handleSubmit}>
              Simpan Absensi
            </Button>
          </>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Spinner /></div>
      ) : (
        <div className="p-4 space-y-2">

          {/* Check All */}
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          >
            {allChecked
              ? <CheckSquare size={16} className="text-emerald-500" />
              : <Square      size={16} className="text-gray-400" />
            }
            <Users size={14} className="text-gray-400" />
            <span>Pilih Semua — {eligible.length} siswa</span>
          </button>

          {/* Daftar Siswa Eligible */}
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {eligible.map((p) => {
              const checked = checkedIds.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={[
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors',
                    checked
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ].join(' ')}
                >
                  {checked
                    ? <CheckSquare size={15} className="text-emerald-500 flex-shrink-0" />
                    : <Square      size={15} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  }
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 tabular-nums">
                    {p.absen}
                  </span>
                  <span className={[
                    'flex-1 truncate',
                    checked
                      ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300',
                  ].join(' ')}>
                    {p.nama}
                  </span>
                  <span className={[
                    'text-xs font-semibold flex-shrink-0',
                    checked ? 'text-emerald-600' : 'text-red-400',
                  ].join(' ')}>
                    {checked ? 'Hadir' : 'Alpa'}
                  </span>
                </button>
              )
            })}

            {eligible.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6 italic">
                Tidak ada peserta terdaftar.
              </p>
            )}
          </div>

          {/* Siswa tidak eligible — tampil muted dengan keterangan */}
          {notEligible.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 flex items-center gap-1.5 px-1 py-1">
                <AlertCircle size={11} />
                {notEligible.length} siswa tidak dapat diabsen (tidak terdaftar di sesi ini)
              </p>
              {notEligible.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm border border-gray-100 dark:border-gray-800 opacity-40 cursor-not-allowed"
                >
                  <Square size={15} className="text-gray-300 flex-shrink-0" />
                  <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0 tabular-nums">
                    {p.absen}
                  </span>
                  <span className="flex-1 truncate text-gray-500">{p.nama}</span>
                  <span className="text-xs text-gray-400">Tidak eligible</span>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </Modal>
  )
}
