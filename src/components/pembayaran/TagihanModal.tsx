'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Button, Input, Select } from '@/components/ui'
import {
  useCreateTagihan,
  useUpdateTagihan,
} from '@/hooks/pembayaran/useTagihan'
import { useKategoriPembayaranList } from '@/hooks/pembayaran/useKategoriPembayaran'
import { getErrorMessage } from '@/lib/utils'
import api from '@/lib/axios'
import type { Tagihan, CreateTagihanDto } from '@/types/pembayaran.types'

const FORM_ID = 'tagihan-form'

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

interface SiswaItem {
  id: string
  profile: { namaLengkap: string; nisn: string | null } | null
}

interface TahunAjaranItem {
  id: string
  nama: string
}

interface TagihanModalProps {
  open: boolean
  onClose: () => void
  initialData?: Tagihan
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

export function TagihanModal({ open, onClose, initialData }: TagihanModalProps) {
  const isEdit = !!initialData
  const isLunas = initialData?.status === 'LUNAS'

  const [siswaId, setSiswaId] = useState('')
  const [kategoriPembayaranId, setKategoriPembayaranId] = useState('')
  const [tahunAjaranId, setTahunAjaranId] = useState('')
  const [bulan, setBulan] = useState('')
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [jumlah, setJumlah] = useState('')
  const [diskon, setDiskon] = useState('')
  const [denda, setDenda] = useState('')
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formTopRef = useRef<HTMLDivElement>(null)

  // Fetch daftar siswa
  const { data: siswaData } = useQuery({
    queryKey: ['users', 'SISWA'],
    queryFn: () =>
      api
        .get<{ data: SiswaItem[] }>('/users', { params: { role: 'SISWA', limit: 100 } })
        .then((res) => res.data),
    enabled: open,
  })

  // Fetch tahun ajaran
  const { data: tahunAjaranData } = useQuery({
    queryKey: ['tahun-ajaran'],
    queryFn: () =>
      api.get<TahunAjaranItem[]>('/tahun-ajaran').then((res) => res.data),
    enabled: open,
  })

  // Fetch kategori pembayaran
  const { data: kategoriData } = useKategoriPembayaranList({ isActive: true })

  const createMutation = useCreateTagihan()
  const updateMutation = useUpdateTagihan()
  const isPending = createMutation.isPending || updateMutation.isPending

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (!open) return
    setSubmitError(null)
    setErrors({})
    if (initialData) {
      setSiswaId(initialData.siswaId)
      setKategoriPembayaranId(initialData.kategoriPembayaranId)
      setTahunAjaranId(initialData.tahunAjaranId)
      setBulan(String(initialData.bulan))
      setTahun(String(initialData.tahun))
      setJumlah(initialData.totalTagihan)
      setDiskon(initialData.diskon ?? '')
      setDenda(initialData.denda ?? '')
      setTanggalJatuhTempo(
        initialData.tanggalJatuhTempo
          ? initialData.tanggalJatuhTempo.slice(0, 10)
          : '',
      )
    } else {
      setSiswaId('')
      setKategoriPembayaranId('')
      setTahunAjaranId('')
      setBulan('')
      setTahun(String(new Date().getFullYear()))
      setJumlah('')
      setDiskon('')
      setDenda('')
      setTanggalJatuhTempo('')
    }
  }, [open, initialData?.id])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!siswaId) newErrors.siswaId = 'Siswa wajib dipilih'
    if (!kategoriPembayaranId) newErrors.kategoriPembayaranId = 'Kategori wajib dipilih'
    if (!tahunAjaranId) newErrors.tahunAjaranId = 'Tahun ajaran wajib dipilih'
    if (!bulan) newErrors.bulan = 'Bulan wajib dipilih'
    if (!tahun || isNaN(Number(tahun))) newErrors.tahun = 'Tahun tidak valid'
    if (!jumlah || isNaN(Number(jumlah)) || Number(jumlah) <= 0)
      newErrors.jumlah = 'Jumlah harus berupa angka positif'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)

    if (!validate()) return

    const dto: CreateTagihanDto = {
      siswaId,
      kategoriPembayaranId,
      tahunAjaranId,
      bulan: Number(bulan),
      tahun: Number(tahun),
      jumlah: Number(jumlah),
      ...(diskon && !isNaN(Number(diskon)) ? { diskon: Number(diskon) } : {}),
      ...(denda && !isNaN(Number(denda)) ? { denda: Number(denda) } : {}),
      ...(tanggalJatuhTempo ? { tanggalJatuhTempo } : {}),
    }

    try {
      if (isEdit && initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, dto })
      } else {
        await createMutation.mutateAsync(dto)
      }
      onClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const siswaOptions =
    siswaData?.data?.map((s) => ({
      value: s.id,
      label: s.profile?.namaLengkap
        ? `${s.profile.namaLengkap}${s.profile.nisn ? ` (${s.profile.nisn})` : ''}`
        : s.id,
    })) ?? []

  const tahunAjaranOptions =
    tahunAjaranData?.map((t) => ({ value: t.id, label: t.nama })) ?? []

  const kategoriOptions =
    kategoriData?.data?.map((k) => ({ value: k.id, label: k.nama })) ?? []

  const isDisabled = isPending || isLunas

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Tagihan' : 'Tambah Tagihan'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Batal
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            loading={isPending}
            disabled={isLunas}
          >
            {isEdit ? 'Simpan Perubahan' : 'Tambah Tagihan'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <div ref={formTopRef} />

          {isLunas && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 px-4 py-3">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Tagihan ini sudah lunas dan tidak dapat diedit.
              </p>
            </div>
          )}

          {submitError && <ErrorBox message={submitError} />}

          {/* Siswa */}
          <div className="space-y-1">
            <label
              htmlFor="tagihan-siswa"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Siswa <span className="text-red-500">*</span>
            </label>
            <Select
              id="tagihan-siswa"
              options={siswaOptions}
              value={siswaId}
              onChange={(e) => setSiswaId(e.target.value)}
              placeholder="Pilih siswa..."
              disabled={isDisabled}
              error={errors.siswaId}
            />
          </div>

          {/* Kategori Pembayaran */}
          <div className="space-y-1">
            <label
              htmlFor="tagihan-kategori"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Kategori Pembayaran <span className="text-red-500">*</span>
            </label>
            <Select
              id="tagihan-kategori"
              options={kategoriOptions}
              value={kategoriPembayaranId}
              onChange={(e) => setKategoriPembayaranId(e.target.value)}
              placeholder="Pilih kategori..."
              disabled={isDisabled}
              error={errors.kategoriPembayaranId}
            />
          </div>

          {/* Tahun Ajaran */}
          <div className="space-y-1">
            <label
              htmlFor="tagihan-tahun-ajaran"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <Select
              id="tagihan-tahun-ajaran"
              options={tahunAjaranOptions}
              value={tahunAjaranId}
              onChange={(e) => setTahunAjaranId(e.target.value)}
              placeholder="Pilih tahun ajaran..."
              disabled={isDisabled}
              error={errors.tahunAjaranId}
            />
          </div>

          {/* Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="tagihan-bulan"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Bulan <span className="text-red-500">*</span>
              </label>
              <Select
                id="tagihan-bulan"
                options={BULAN_OPTIONS}
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                placeholder="Pilih bulan..."
                disabled={isDisabled}
                error={errors.bulan}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="tagihan-tahun"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Tahun <span className="text-red-500">*</span>
              </label>
              <Input
                id="tagihan-tahun"
                type="number"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                placeholder="Contoh: 2025"
                disabled={isDisabled}
                error={errors.tahun}
              />
            </div>
          </div>

          {/* Jumlah */}
          <div className="space-y-1">
            <label
              htmlFor="tagihan-jumlah"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Jumlah (Rp) <span className="text-red-500">*</span>
            </label>
            <Input
              id="tagihan-jumlah"
              type="number"
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value)}
              placeholder="Contoh: 500000"
              disabled={isDisabled}
              error={errors.jumlah}
            />
          </div>

          {/* Diskon & Denda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="tagihan-diskon"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Diskon (Rp)
              </label>
              <Input
                id="tagihan-diskon"
                type="number"
                value={diskon}
                onChange={(e) => setDiskon(e.target.value)}
                placeholder="Opsional"
                disabled={isDisabled}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="tagihan-denda"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Denda (Rp)
              </label>
              <Input
                id="tagihan-denda"
                type="number"
                value={denda}
                onChange={(e) => setDenda(e.target.value)}
                placeholder="Opsional"
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Tanggal Jatuh Tempo */}
          <div className="space-y-1">
            <label
              htmlFor="tagihan-jatuh-tempo"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tanggal Jatuh Tempo
            </label>
            <Input
              id="tagihan-jatuh-tempo"
              type="date"
              value={tanggalJatuhTempo}
              onChange={(e) => setTanggalJatuhTempo(e.target.value)}
              disabled={isDisabled}
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
