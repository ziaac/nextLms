'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreatePrestasi, useUpdatePrestasi } from '@/hooks/prestasi/usePrestasi'
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox'
import {
  TINGKAT_LABEL, HASIL_LABEL,
  type PrestasiItem, type TingkatLomba, type HasilPrestasi,
} from '@/types/prestasi.types'
import { toast } from 'sonner'
import { format } from 'date-fns'

const TINGKAT_LIST: TingkatLomba[] = [
  'SEKOLAH', 'KECAMATAN', 'KABUPATEN_KOTA', 'PROVINSI', 'NASIONAL', 'INTERNASIONAL',
]
const HASIL_LIST: HasilPrestasi[] = [
  'JUARA_1', 'JUARA_2', 'JUARA_3', 'JUARA_HARAPAN', 'FINALIS', 'PESERTA', 'LAINNYA',
]

const TINGKAT_OPTIONS: ComboboxOption[] = TINGKAT_LIST.map((t) => ({
  value: t,
  label: TINGKAT_LABEL[t],
}))

const HASIL_OPTIONS: ComboboxOption[] = HASIL_LIST.map((h) => ({
  value: h,
  label: HASIL_LABEL[h],
}))

const todayISO = () => format(new Date(), 'yyyy-MM-dd')

interface Props {
  open:      boolean
  onClose:   () => void
  editItem?: PrestasiItem | null
  /** untuk guru/admin input untuk siswa tertentu */
  siswaId?:  string
}

export function PrestasiFormModal({ open, onClose, editItem, siswaId }: Props) {
  const isEdit = !!editItem

  const [judul,          setJudul]          = useState('')
  const [deskripsi,      setDeskripsi]      = useState('')
  const [jenisLomba,     setJenisLomba]     = useState('')
  const [tingkat,        setTingkat]        = useState<TingkatLomba>('SEKOLAH')
  const [penyelenggara,  setPenyelenggara]  = useState('')
  const [tempatLomba,    setTempatLomba]    = useState('')
  const [tanggalMulai,   setTanggalMulai]   = useState(todayISO())
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [peringkat,      setPeringkat]      = useState('')
  const [hasilPrestasi,  setHasilPrestasi]  = useState<HasilPrestasi>('JUARA_1')
  const [sertifikatUrl,  setSertifikatUrl]  = useState('')
  const [fotoUrl,        setFotoUrl]        = useState('')

  // Prefill saat edit
  useEffect(() => {
    if (!open) return
    if (editItem) {
      setJudul(editItem.judul)
      setDeskripsi(editItem.deskripsi ?? '')
      setJenisLomba(editItem.jenisLomba)
      setTingkat(editItem.tingkat)
      setPenyelenggara(editItem.penyelenggara)
      setTempatLomba(editItem.tempatLomba ?? '')
      setTanggalMulai(editItem.tanggalMulai.slice(0, 10))
      setTanggalSelesai(editItem.tanggalSelesai?.slice(0, 10) ?? '')
      setPeringkat(editItem.peringkat ?? '')
      setHasilPrestasi(editItem.hasilPrestasi)
      setSertifikatUrl(editItem.sertifikatUrl ?? '')
      setFotoUrl(editItem.fotoUrl ?? '')
    } else {
      setJudul(''); setDeskripsi(''); setJenisLomba(''); setTingkat('SEKOLAH')
      setPenyelenggara(''); setTempatLomba(''); setTanggalMulai(todayISO())
      setTanggalSelesai(''); setPeringkat(''); setHasilPrestasi('JUARA_1')
      setSertifikatUrl(''); setFotoUrl('')
    }
  }, [open, editItem])

  const createMut = useCreatePrestasi()
  const updateMut = useUpdatePrestasi()
  const isSaving  = createMut.isPending || updateMut.isPending

  const canSubmit = judul.trim() && jenisLomba.trim() && penyelenggara.trim() && tanggalMulai

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const payload = {
      ...(siswaId && !isEdit ? { siswaId } : {}),
      judul, tingkat, penyelenggara, tanggalMulai, hasilPrestasi,
      jenisLomba: jenisLomba.trim(),
      ...(deskripsi.trim()    ? { deskripsi: deskripsi.trim() }        : {}),
      ...(tempatLomba.trim()  ? { tempatLomba: tempatLomba.trim() }    : {}),
      ...(tanggalSelesai      ? { tanggalSelesai }                      : {}),
      ...(peringkat.trim()    ? { peringkat: peringkat.trim() }         : {}),
      ...(sertifikatUrl.trim()? { sertifikatUrl: sertifikatUrl.trim() } : {}),
      ...(fotoUrl.trim()      ? { fotoUrl: fotoUrl.trim() }             : {}),
    }
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: editItem!.id, payload })
        toast.success('Prestasi berhasil diperbarui')
      } else {
        await createMut.mutateAsync(payload)
        toast.success('Prestasi berhasil diajukan')
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal menyimpan prestasi')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isEdit ? 'Edit Prestasi' : 'Ajukan Prestasi'}
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Judul */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Nama / Judul Kegiatan <span className="text-red-500">*</span>
            </label>
            <input type="text" required value={judul} maxLength={250}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Mis. Olimpiade Matematika SMA Nasional 2025"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Jenis Lomba */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Jenis Lomba / Kegiatan <span className="text-red-500">*</span>
            </label>
            <input type="text" required value={jenisLomba} maxLength={100}
              onChange={(e) => setJenisLomba(e.target.value)}
              placeholder="Mis. Olimpiade, Tahfidz, Olahraga, Seni..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Tingkat + Hasil (2 kolom) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Tingkat <span className="text-red-500">*</span>
              </label>
              <Combobox
                options={TINGKAT_OPTIONS}
                value={tingkat}
                onChange={(v) => setTingkat(v as TingkatLomba)}
                placeholder="Pilih tingkat..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Hasil <span className="text-red-500">*</span>
              </label>
              <Combobox
                options={HASIL_OPTIONS}
                value={hasilPrestasi}
                onChange={(v) => setHasilPrestasi(v as HasilPrestasi)}
                placeholder="Pilih hasil..."
              />
            </div>
          </div>

          {/* Penyelenggara */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Penyelenggara <span className="text-red-500">*</span>
            </label>
            <input type="text" required value={penyelenggara} maxLength={150}
              onChange={(e) => setPenyelenggara(e.target.value)}
              placeholder="Mis. Kemendikbud, Universitas Indonesia..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Tempat + Peringkat */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tempat Lomba</label>
              <input type="text" value={tempatLomba} maxLength={150}
                onChange={(e) => setTempatLomba(e.target.value)}
                placeholder="Kota / venue..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Keterangan Peringkat</label>
              <input type="text" value={peringkat} maxLength={50}
                onChange={(e) => setPeringkat(e.target.value)}
                placeholder="Mis. 1 dari 120 peserta"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Tanggal Mulai + Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input type="date" required value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Tanggal Selesai</label>
              <input type="date" value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Deskripsi</label>
            <textarea value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} rows={2}
              placeholder="Ceritakan singkat tentang kegiatan ini..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* URL Sertifikat + Foto */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">URL Sertifikat</label>
              <input type="url" value={sertifikatUrl}
                onChange={(e) => setSertifikatUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">URL Foto</label>
              <input type="url" value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <button type="button" onClick={onClose} disabled={isSaving}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition-colors">
            Batal
          </button>
          <button type="submit" onClick={handleSubmit}
            disabled={!canSubmit || isSaving}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              canSubmit && !isSaving
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed',
            )}>
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Ajukan Prestasi'}
          </button>
        </div>
      </div>
    </div>
  )
}
