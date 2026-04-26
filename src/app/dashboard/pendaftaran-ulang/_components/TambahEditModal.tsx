'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Select } from '@/components/ui'
import type { SiswaLulus } from '@/types/pendaftaran.types'
import { useCreateSiswaLulus, useUpdateSiswaLulus } from '@/hooks/pendaftaran/usePendaftaran'
import { useTahunAjaranList } from '@/hooks/tahun-ajaran/useTahunAjaran'
import type { TahunAjaran } from '@/types/tahun-ajaran.types'

const JALUR_OPTIONS = [
  { value: 'ZONASI',      label: 'Zonasi' },
  { value: 'PRESTASI',    label: 'Prestasi' },
  { value: 'AFIRMASI',    label: 'Afirmasi' },
  { value: 'PERPINDAHAN', label: 'Perpindahan' },
  { value: 'REGULER',     label: 'Reguler' },
]

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAYS  = Array.from({ length: 31 }, (_, i) => i + 1)
const YEARS = Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i)

const inputCls = 'w-full h-9 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed'

const labelCls = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5'

interface Props {
  open: boolean
  onClose: () => void
  item?: SiswaLulus | null
  defaultTahunAjaranId?: string
}

export function TambahEditModal({ open, onClose, item, defaultTahunAjaranId }: Props) {
  const isEdit = !!item
  const create = useCreateSiswaLulus()
  const update = useUpdateSiswaLulus()
  const { data: tahunList } = useTahunAjaranList()

  const parseDate = (dateStr: string | undefined) => {
    if (!dateStr) return { d: '', m: '', y: '' }
    const dt = new Date(dateStr)
    return { d: String(dt.getDate()), m: String(dt.getMonth() + 1), y: String(dt.getFullYear()) }
  }

  const [nama,         setNama]         = useState('')
  const [noPend,       setNoPend]       = useState('')
  const [tahunAjaranId,setTahunAjaranId]= useState(defaultTahunAjaranId ?? '')
  const [jalur,        setJalur]        = useState('')
  const [d, setD] = useState('')
  const [m, setM] = useState('')
  const [y, setY] = useState('')

  useEffect(() => {
    if (open) {
      setNama(item?.nama ?? '')
      setNoPend(item?.noPendaftaran ?? '')
      setTahunAjaranId(item?.tahunAjaranId ?? defaultTahunAjaranId ?? '')
      setJalur(item?.jalurPendaftaran ?? '')
      const parsed = parseDate(item?.tanggalLahir)
      setD(parsed.d); setM(parsed.m); setY(parsed.y)
    }
  }, [open, item, defaultTahunAjaranId])

  const loading = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tanggalLahir = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const payload = {
      nama: nama.toUpperCase(),
      noPendaftaran: noPend.trim().toUpperCase(),
      tahunAjaranId,
      tanggalLahir,
      jalurPendaftaran: jalur || undefined,
    }
    if (isEdit && item) {
      await update.mutateAsync({ id: item.id, data: payload })
    } else {
      await create.mutateAsync(payload)
    }
    onClose()
  }

  const tahunOptions = (tahunList ?? []).map((t: TahunAjaran) => ({ value: t.id, label: t.nama }))
  const dayOptions   = DAYS.map((v) => ({ value: String(v), label: String(v).padStart(2, '0') }))
  const monthOptions = MONTHS.map((mo, i) => ({ value: String(i + 1), label: mo }))
  const yearOptions  = YEARS.map((yr) => ({ value: String(yr), label: String(yr) }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Data Pendaftar' : 'Tambah Data Pendaftar'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button form="tambah-form" type="submit" loading={loading} disabled={loading}>
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambahkan'}
          </Button>
        </>
      }
    >
      <form id="tambah-form" onSubmit={handleSubmit} className="p-6 space-y-4">
        {!isEdit && (
          <div>
            <label className={labelCls}>Tahun Ajaran <span className="text-red-500">*</span></label>
            <Select
              placeholder="— Pilih tahun ajaran —"
              options={tahunOptions}
              value={tahunAjaranId}
              onChange={(e) => setTahunAjaranId(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className={labelCls}>Nomor Pendaftaran <span className="text-red-500">*</span></label>
          <input
            value={noPend}
            onChange={(e) => setNoPend(e.target.value.toUpperCase())}
            required
            placeholder="Contoh: 2025-001"
            className={inputCls}
            disabled={isEdit}
          />
        </div>

        <div>
          <label className={labelCls}>Nama Lengkap <span className="text-red-500">*</span></label>
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value.toUpperCase())}
            required
            placeholder="NAMA LENGKAP"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Tanggal Lahir <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-3 gap-2">
            <Select size="sm" placeholder="Tgl"   options={dayOptions}   value={d} onChange={(e) => setD(e.target.value)} />
            <Select size="sm" placeholder="Bulan" options={monthOptions} value={m} onChange={(e) => setM(e.target.value)} />
            <Select size="sm" placeholder="Tahun" options={yearOptions}  value={y} onChange={(e) => setY(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Jalur Pendaftaran</label>
          <Select
            placeholder="— Pilih jalur —"
            options={JALUR_OPTIONS}
            value={jalur}
            onChange={(e) => setJalur(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  )
}
