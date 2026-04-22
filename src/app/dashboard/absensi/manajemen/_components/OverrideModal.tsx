'use client'

import { useState, useEffect }  from 'react'
import { Modal }               from '@/components/ui/Modal'
import { Button }              from '@/components/ui/Button'
import { Combobox }            from '@/components/ui/Combobox'
import type { ComboboxOption } from '@/components/ui/Combobox'
import type { StatusAbsensi }  from '@/types'

const STATUS_OPTIONS: ComboboxOption[] = [
  { label: 'Hadir',     value: 'HADIR'     },
  { label: 'Sakit',     value: 'SAKIT'     },
  { label: 'Izin',      value: 'IZIN'      },
  { label: 'Alpa',      value: 'ALPA'      },
  { label: 'Terlambat', value: 'TERLAMBAT' },
  { label: 'TAP',       value: 'TAP'       },
]

interface OverrideTarget {
  absensiId:         string | null
  userId:            string
  namaSiswa:         string
  tanggal:           string
  jadwalPelajaranId: string
}

interface Props {
  open:      boolean
  target:    OverrideTarget | null
  onClose:   () => void
  onSubmit:  (status: StatusAbsensi, keterangan?: string) => void
  isPending: boolean
}

export function OverrideModal({ open, target, onClose, onSubmit, isPending }: Props) {
  const [status, setStatus]         = useState<string>('')
  const [keterangan, setKeterangan] = useState('')

  useEffect(() => {
    if (!open) return
    setStatus('')
    setKeterangan('')
  }, [open])

  const canSubmit = !!status && !isPending

  // Format "2026-04-15" → "15/04/2026"
  const fmtTgl = (iso: string) => iso.split('-').reverse().join('/')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Koreksi Absensi"
      description={target ? `${target.namaSiswa} — ${fmtTgl(target.tanggal)}` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            variant="primary" size="sm"
            loading={isPending} disabled={!canSubmit}
            onClick={() => onSubmit(status as StatusAbsensi, keterangan || undefined)}
          >
            Simpan Koreksi
          </Button>
        </>
      }
    >
      <div className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status Baru <span className="text-red-500">*</span>
          </label>
          <Combobox
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
            placeholder="Pilih status..."
            hasError={!status}
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Keterangan
            <span className="ml-1.5 text-xs text-gray-400 font-normal">(opsional)</span>
          </label>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Diubah Admin — ada surat dokter"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
    </Modal>
  )
}
