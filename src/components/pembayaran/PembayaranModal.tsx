'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Button, Input, Select } from '@/components/ui'
import { useCreatePembayaran } from '@/hooks/pembayaran/usePembayaran'
import { getErrorMessage, formatCurrency } from '@/lib/utils'
import api from '@/lib/axios'
import type { Tagihan, CreatePembayaranDto } from '@/types/pembayaran.types'

const FORM_ID = 'pembayaran-form'

const METODE_OPTIONS = [
  { value: 'TUNAI', label: 'Tunai' },
  { value: 'EDC', label: 'EDC' },
  { value: 'TRANSFER', label: 'Transfer' },
]

const BULAN_LABEL: Record<number, string> = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr',
  5: 'Mei', 6: 'Jun', 7: 'Jul', 8: 'Agu',
  9: 'Sep', 10: 'Okt', 11: 'Nov', 12: 'Des',
}

interface TagihanResponse {
  data: Tagihan[]
}

interface PembayaranModalProps {
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

export function PembayaranModal({ open, onClose }: PembayaranModalProps) {
  const [tagihanId, setTagihanId] = useState('')
  const [jumlahBayar, setJumlahBayar] = useState('')
  const [metodePembayaran, setMetodePembayaran] = useState('')
  const [tanggalBayar, setTanggalBayar] = useState('')
  const [buktiBayarUrl, setBuktiBayarUrl] = useState('')
  const [catatanKasir, setCatatanKasir] = useState('')
  const [referensiBank, setReferensiBank] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formTopRef = useRef<HTMLDivElement>(null)

  // Fetch tagihan belum bayar
  const { data: tagihanBelumBayarData } = useQuery({
    queryKey: ['tagihan', 'BELUM_BAYAR'],
    queryFn: () =>
      api
        .get<TagihanResponse>('/tagihan', {
          params: { status: 'BELUM_BAYAR', limit: 100 },
        })
        .then((res) => res.data),
    enabled: open,
  })

  // Fetch tagihan cicilan
  const { data: tagihanCicilanData } = useQuery({
    queryKey: ['tagihan', 'CICILAN'],
    queryFn: () =>
      api
        .get<TagihanResponse>('/tagihan', {
          params: { status: 'CICILAN', limit: 100 },
        })
        .then((res) => res.data),
    enabled: open,
  })

  const createMutation = useCreatePembayaran()
  const isPending = createMutation.isPending

  // Gabungkan kedua list tagihan
  const allTagihan: Tagihan[] = [
    ...(tagihanBelumBayarData?.data ?? []),
    ...(tagihanCicilanData?.data ?? []),
  ]

  const tagihanOptions = allTagihan.map((t) => {
    const namaKategori = t.kategoriPembayaran?.nama ?? 'Kategori'
    const namaSiswa = t.siswa?.profile?.namaLengkap ?? 'Siswa'
    const bulanLabel = BULAN_LABEL[t.bulan] ?? String(t.bulan)
    return {
      value: t.id,
      label: `${namaKategori} - ${namaSiswa} - ${bulanLabel}/${t.tahun}`,
    }
  })

  // Cari tagihan yang dipilih untuk menampilkan sisa bayar
  const selectedTagihan = allTagihan.find((t) => t.id === tagihanId)

  // Reset form saat modal dibuka/ditutup
  useEffect(() => {
    if (!open) return
    setTagihanId('')
    setJumlahBayar('')
    setMetodePembayaran('')
    setTanggalBayar(new Date().toISOString().slice(0, 10))
    setBuktiBayarUrl('')
    setCatatanKasir('')
    setReferensiBank('')
    setSubmitError(null)
    setErrors({})
  }, [open])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!tagihanId) newErrors.tagihanId = 'Tagihan wajib dipilih'
    if (!jumlahBayar || isNaN(Number(jumlahBayar)) || Number(jumlahBayar) <= 0)
      newErrors.jumlahBayar = 'Jumlah bayar harus berupa angka positif'
    if (!metodePembayaran) newErrors.metodePembayaran = 'Metode pembayaran wajib dipilih'
    if (!tanggalBayar) newErrors.tanggalBayar = 'Tanggal bayar wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const dto: CreatePembayaranDto = {
      tagihanId,
      jumlahBayar: Number(jumlahBayar),
      metodePembayaran: metodePembayaran as CreatePembayaranDto['metodePembayaran'],
      tanggalBayar,
      ...(buktiBayarUrl ? { buktiBayarUrl } : {}),
      ...(catatanKasir ? { catatanKasir } : {}),
      ...(referensiBank ? { referensiBank } : {}),
    }

    try {
      await createMutation.mutateAsync(dto)
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Input Pembayaran"
      description="Input pembayaran manual oleh kasir"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Batal
          </Button>
          <Button type="submit" form={FORM_ID} loading={isPending}>
            Simpan Pembayaran
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <div ref={formTopRef} />

          {submitError && <ErrorBox message={submitError} />}

          {/* Tagihan */}
          <div className="space-y-1">
            <label
              htmlFor="pembayaran-tagihan"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tagihan <span className="text-red-500">*</span>
            </label>
            <Select
              id="pembayaran-tagihan"
              options={tagihanOptions}
              value={tagihanId}
              onChange={(e) => setTagihanId(e.target.value)}
              placeholder="Pilih tagihan..."
              disabled={isPending}
              error={errors.tagihanId}
            />
            {selectedTagihan && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Sisa bayar:{' '}
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatCurrency(Number(selectedTagihan.sisaBayar))}
                </span>
              </p>
            )}
          </div>

          {/* Jumlah Bayar */}
          <div className="space-y-1">
            <label
              htmlFor="pembayaran-jumlah"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Jumlah Bayar (Rp) <span className="text-red-500">*</span>
            </label>
            <Input
              id="pembayaran-jumlah"
              type="number"
              value={jumlahBayar}
              onChange={(e) => setJumlahBayar(e.target.value)}
              placeholder="Contoh: 500000"
              disabled={isPending}
              error={errors.jumlahBayar}
            />
          </div>

          {/* Metode Pembayaran */}
          <div className="space-y-1">
            <label
              htmlFor="pembayaran-metode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Metode Pembayaran <span className="text-red-500">*</span>
            </label>
            <Select
              id="pembayaran-metode"
              options={METODE_OPTIONS}
              value={metodePembayaran}
              onChange={(e) => setMetodePembayaran(e.target.value)}
              placeholder="Pilih metode..."
              disabled={isPending}
              error={errors.metodePembayaran}
            />
          </div>

          {/* Tanggal Bayar */}
          <div className="space-y-1">
            <label
              htmlFor="pembayaran-tanggal"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tanggal Bayar <span className="text-red-500">*</span>
            </label>
            <Input
              id="pembayaran-tanggal"
              type="date"
              value={tanggalBayar}
              onChange={(e) => setTanggalBayar(e.target.value)}
              disabled={isPending}
              error={errors.tanggalBayar}
            />
          </div>

          {/* Bukti Bayar URL */}
          <div className="space-y-1">
            <label
              htmlFor="pembayaran-bukti"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              URL Bukti Bayar
            </label>
            <Input
              id="pembayaran-bukti"
              type="text"
              value={buktiBayarUrl}
              onChange={(e) => setBuktiBayarUrl(e.target.value)}
              placeholder="https://... (opsional)"
              disabled={isPending}
            />
          </div>

          {/* Referensi Bank */}
          <div className="space-y-1">
            <label
              htmlFor="pembayaran-referensi"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Referensi Bank
            </label>
            <Input
              id="pembayaran-referensi"
              type="text"
              value={referensiBank}
              onChange={(e) => setReferensiBank(e.target.value)}
              placeholder="No. referensi / kode transfer (opsional)"
              disabled={isPending}
            />
          </div>

          {/* Catatan Kasir */}
          <div className="space-y-1">
            <label
              htmlFor="pembayaran-catatan"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Catatan Kasir
            </label>
            <textarea
              id="pembayaran-catatan"
              value={catatanKasir}
              onChange={(e) => setCatatanKasir(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              disabled={isPending}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
