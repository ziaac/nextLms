'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { Modal, Button, Input, Select } from '@/components/ui'
import { useBulkGenerateTagihan } from '@/hooks/pembayaran/useTagihan'
import { useKategoriPembayaranList } from '@/hooks/pembayaran/useKategoriPembayaran'
import { getErrorMessage } from '@/lib/utils'
import api from '@/lib/axios'
import type { BulkGenerateTagihanDto } from '@/types/pembayaran.types'

const FORM_ID = 'bulk-generate-form'

const BULAN_OPTIONS = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

const TARGET_OPTIONS = [
  { value: 'semua', label: 'Semua Siswa' },
  { value: 'kelas', label: 'Per Kelas' },
]

interface KelasItem {
  id: string
  nama: string
}

interface TahunAjaranItem {
  id: string
  nama: string
}

interface BulkGenerateResult {
  jumlahDibuat: number
}

interface BulkGenerateModalProps {
  open: boolean
  onClose: () => void
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

export function BulkGenerateModal({ open, onClose }: BulkGenerateModalProps) {
  const [kategoriPembayaranId, setKategoriPembayaranId] = useState('')
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [bulan, setBulan] = useState('')
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [jumlah, setJumlah] = useState('')
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('')
  const [target, setTarget] = useState<'semua' | 'kelas'>('semua')
  const [kelasId, setKelasId] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<BulkGenerateResult | null>(null)

  const formTopRef = useRef<HTMLDivElement>(null)

  // Fetch tahun ajaran
  const { data: tahunAjaranData } = useQuery({
    queryKey: ['tahun-ajaran'],
    queryFn: () =>
      api.get<TahunAjaranItem[]>('/tahun-ajaran').then((res) => res.data),
    enabled: open,
  })

  // Fetch kelas
  const { data: kelasData } = useQuery({
    queryKey: ['kelas'],
    queryFn: () =>
      api.get<KelasItem[]>('/kelas').then((res) => res.data),
    enabled: open && target === 'kelas',
  })

  // Fetch kategori pembayaran
  const { data: kategoriData } = useKategoriPembayaranList({ isActive: true })

  const bulkMutation = useBulkGenerateTagihan()
  const isPending = bulkMutation.isPending

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setErrors({})
    setResult(null)
    setKategoriPembayaranId('')
    setTahunAjaranId('')
    setBulan('')
    setTahun(String(new Date().getFullYear()))
    setJumlah('')
    setTanggalJatuhTempo('')
    setTarget('semua')
    setKelasId('')
  }, [open])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!kategoriPembayaranId) newErrors.kategoriPembayaranId = 'Kategori wajib dipilih'
    if (!tahunAjaranId) newErrors.tahunAjaranId = 'Tahun ajaran wajib dipilih'
    if (!bulan) newErrors.bulan = 'Bulan wajib dipilih'
    if (!tahun || isNaN(Number(tahun))) newErrors.tahun = 'Tahun tidak valid'
    if (!jumlah || isNaN(Number(jumlah)) || Number(jumlah) <= 0)
      newErrors.jumlah = 'Jumlah harus berupa angka positif'
    if (target === 'kelas' && !kelasId) newErrors.kelasId = 'Kelas wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const dto: BulkGenerateTagihanDto = {
      kategoriPembayaranId,
      tahunAjaranId,
      bulan: Number(bulan),
      tahun: Number(tahun),
      jumlah: Number(jumlah),
      ...(tanggalJatuhTempo ? { tanggalJatuhTempo } : {}),
      ...(target === 'kelas' && kelasId ? { kelasId } : {}),
    }

    try {
      const response = await bulkMutation.mutateAsync(dto)
      setResult({ jumlahDibuat: response.jumlahDibuat })
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const tahunAjaranOptions =
    tahunAjaranData?.map((t) => ({ value: t.id, label: t.nama })) ?? []

  const kategoriOptions =
    kategoriData?.data?.map((k) => ({ value: k.id, label: k.nama })) ?? []

  const kelasOptions =
    kelasData?.map((k) => ({ value: k.id, label: k.nama })) ?? []

  // Result summary view
  if (result) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Bulk Generate Tagihan"
        size="md"
        footer={
          <Button onClick={onClose} type="button">
            Tutup
          </Button>
        }
      >
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <CheckCircle2 size={48} className="text-emerald-500" />
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Berhasil!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {result.jumlahDibuat} tagihan berhasil dibuat.
            </p>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Generate Tagihan"
      description="Buat tagihan sekaligus untuk banyak siswa"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            Generate Tagihan
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <div ref={formTopRef} />

          {submitError && <ErrorBox message={submitError} />}

          {/* Kategori Pembayaran */}
          <div className="space-y-1">
            <label
              htmlFor="bulk-kategori"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kategori Pembayaran <span className="text-red-500">*</span>
            </label>
            <Select
              id="bulk-kategori"
              options={kategoriOptions}
              value={kategoriPembayaranId}
              onChange={(e) => setKategoriPembayaranId(e.target.value)}
              placeholder="Pilih kategori..."
              disabled={isPending}
              error={errors.kategoriPembayaranId}
            />
          </div>

          {/* Tahun Ajaran */}
          <div className="space-y-1">
            <label
              htmlFor="bulk-tahun-ajaran"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <Select
              id="bulk-tahun-ajaran"
              options={tahunAjaranOptions}
              value={tahunAjaranId}
              onChange={(e) => setTahunAjaranId(e.target.value)}
              placeholder="Pilih tahun ajaran..."
              disabled={isPending}
              error={errors.tahunAjaranId}
            />
          </div>

          {/* Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="bulk-bulan"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Bulan <span className="text-red-500">*</span>
              </label>
              <Select
                id="bulk-bulan"
                options={BULAN_OPTIONS}
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                placeholder="Pilih bulan..."
                disabled={isPending}
                error={errors.bulan}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="bulk-tahun"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tahun <span className="text-red-500">*</span>
              </label>
              <Input
                id="bulk-tahun"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                placeholder="Contoh: 2025"
                disabled={isPending}
                error={errors.tahun}
              />
            </div>
          </div>

          {/* Jumlah */}
          <div className="space-y-1">
            <label
              htmlFor="bulk-jumlah"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Jumlah (Rp) <span className="text-red-500">*</span>
            </label>
            <Input
              id="bulk-jumlah"
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="Contoh: 500000"
              disabled={isPending}
              error={errors.jumlah}
            />
          </div>

          {/* Tanggal Jatuh Tempo */}
          <div className="space-y-1">
            <label
              htmlFor="bulk-jatuh-tempo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tanggal Jatuh Tempo
            </label>
            <Input
              id="bulk-jatuh-tempo"
              type="date"
              value={tanggalJatuhTempo}
              onChange={(e) => setTanggalJatuhTempo(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Target */}
          <div className="space-y-1">
            <label
              htmlFor="bulk-target"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Target
            </label>
            <Select
              id="bulk-target"
              options={TARGET_OPTIONS}
              value={target}
              onChange={(e) => {
                const val = e.target.value as 'semua' | 'kelas'
                setTarget(val)
                if (val === 'semua') setKelasId('')
              }}
              disabled={isPending}
            />
          </div>

          {/* Kelas (conditional) */}
          {target === 'kelas' && (
            <div className="space-y-1">
              <label
                htmlFor="bulk-kelas"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Kelas <span className="text-red-500">*</span>
              </label>
              <Select
                id="bulk-kelas"
                options={kelasOptions}
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
                placeholder="Pilih kelas..."
                disabled={isPending}
                error={errors.kelasId}
              />
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
