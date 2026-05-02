'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, Input, Spinner } from '@/components/ui'
import { useMataPelajaranList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import { useSemesterActive } from '@/hooks/semester/useSemester'
import { useTingkatKelasList } from '@/hooks/tingkat-kelas/useTingkatKelas'
import type { CreateRppDto } from '@/types/rpp.types'

interface RppModalProps {
  open:      boolean
  onClose:   () => void
  onSubmit:  (dto: CreateRppDto) => Promise<void>
  isPending: boolean
  error?:    string | null
}

export function RppModal({ open, onClose, onSubmit, isPending, error }: RppModalProps) {
  const [judul,            setJudul]            = useState('')
  const [topik,            setTopik]            = useState('')
  const [mataPelajaranId,  setMataPelajaranId]  = useState('')
  const [semesterId,       setSemesterId]       = useState('')
  const [tingkatKelasId,   setTingkatKelasId]   = useState('')
  const [pertemuanKe,      setPertemuanKe]      = useState('')
  const [alokasiWaktu,     setAlokasiWaktu]     = useState('')
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState('')

  const { data: semesterList } = useSemesterActive()
  const { data: tingkatList }  = useTingkatKelasList()
  const { data: mapelData }    = useMataPelajaranList(
    semesterId ? { semesterId, limit: 100 } : undefined,
  )

  useEffect(() => {
    if (!open) {
      setJudul(''); setTopik(''); setMataPelajaranId(''); setSemesterId('')
      setTingkatKelasId(''); setPertemuanKe(''); setAlokasiWaktu(''); setTujuanPembelajaran('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      judul:               judul.trim(),
      topik:               topik.trim(),
      mataPelajaranId,
      semesterId,
      konten:              {},
      tingkatKelasId:      tingkatKelasId || undefined,
      pertemuanKe:         pertemuanKe ? parseInt(pertemuanKe) : undefined,
      alokasiWaktu:        alokasiWaktu ? parseInt(alokasiWaktu) : undefined,
      tujuanPembelajaran:  tujuanPembelajaran.trim() || undefined,
    })
  }

  const semesterOptions = (semesterList as { id: string; nama: string }[] | undefined) ?? []
  const tingkatOptions  = (tingkatList  as { id: string; nama: string }[] | undefined) ?? []
  const mapelOptions    = mapelData?.data ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat RPP Baru"
      size="md"
      footer={
        <div className="flex gap-2 justify-end px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Batal</Button>
          <Button type="submit" form="rpp-form" disabled={isPending || !judul.trim() || !mataPelajaranId || !semesterId}>
            {isPending ? <><Spinner />&nbsp;Menyimpan...</> : 'Buat RPP'}
          </Button>
        </div>
      }
    >
      <form id="rpp-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Judul <span className="text-red-500">*</span>
            </label>
            <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul RPP" maxLength={250} required />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Topik <span className="text-red-500">*</span>
            </label>
            <Input value={topik} onChange={(e) => setTopik(e.target.value)} placeholder="Topik pembelajaran" maxLength={250} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              value={semesterId}
              onChange={(e) => { setSemesterId(e.target.value); setMataPelajaranId('') }}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              <option value="">Pilih semester</option>
              {semesterOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <select
              value={mataPelajaranId}
              onChange={(e) => setMataPelajaranId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              disabled={!semesterId}
            >
              <option value="">Pilih mata pelajaran</option>
              {mapelOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {(m as { mataPelajaranTingkat?: { masterMapel?: { nama: string } } }).mataPelajaranTingkat?.masterMapel?.nama ?? m.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tingkat Kelas
            </label>
            <select
              value={tingkatKelasId}
              onChange={(e) => setTingkatKelasId(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Opsional</option>
              {tingkatOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.nama}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pertemuan Ke
            </label>
            <Input type="number" value={pertemuanKe} onChange={(e) => setPertemuanKe(e.target.value)} placeholder="Opsional" min={1} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alokasi Waktu (menit)
            </label>
            <Input type="number" value={alokasiWaktu} onChange={(e) => setAlokasiWaktu(e.target.value)} placeholder="Opsional" min={1} max={600} />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tujuan Pembelajaran
            </label>
            <textarea
              value={tujuanPembelajaran}
              onChange={(e) => setTujuanPembelajaran(e.target.value)}
              placeholder="Opsional"
              rows={2}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
