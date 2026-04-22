'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useTambahSiswa } from '@/hooks/kelas/useKelasSiswa'
import { getErrorMessage } from '@/lib/utils'
import type { UserByRole } from '@/types/kelas.types'

const FORM_ID = 'tambah-siswa-form'
const schema = z.object({
  siswaId:      z.string().min(1, 'Pilih siswa terlebih dahulu'),
  tanggalMasuk: z.string().min(1, 'Tanggal masuk wajib diisi'),
})
type FormValues = z.infer<typeof schema>
interface Props { open: boolean; onClose: () => void; kelasId: string; tahunAjaranId: string }

export function TambahSiswaModal({ open, onClose, kelasId, tahunAjaranId }: Props) {
  const [searchQuery, setSearchQuery]           = useState('')
  const [selectedSiswa, setSelectedSiswa]       = useState<UserByRole | null>(null)
  const [submitError, setSubmitError]           = useState<string | null>(null)
  const [tahunPendaftaran, setTahunPendaftaran] = useState('')

  const queryParams = {
    tahunAjaranId,
    showAll: 'true',
    ...(tahunPendaftaran ? { tahunPendaftaran } : {}),
  }

  const { data: siswaList = [], isLoading } = useQuery({
    queryKey: ['users', 'by-role', 'SISWA', tahunAjaranId, 'showAll', tahunPendaftaran],
    queryFn: () => api.get('/users/by-role/SISWA', { params: queryParams })
      .then((r) => r.data as UserByRole[]),
    enabled: open && !!tahunAjaranId && !!tahunPendaftaran,
    staleTime: 1000 * 60 * 5,
  })

  const filteredSiswa = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const filtered = q
      ? siswaList.filter((s) =>
          s.profile.namaLengkap.toLowerCase().includes(q) || (s.profile.nisn ?? '').includes(q)
        )
      : siswaList
    // Urutkan: tersedia dulu, sudah terdaftar belakangan
    return filtered
      .sort((a, b) => (a.sudahDiKelas ? 1 : 0) - (b.sudahDiKelas ? 1 : 0))
      .slice(0, 20)
  }, [siswaList, searchQuery])

  const mutation = useTambahSiswa(kelasId)
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { siswaId: '', tanggalMasuk: '' },
  })

  const handleSelect = (siswa: UserByRole) => {
    setSelectedSiswa(siswa)
    setValue('siswaId', siswa.id, { shouldValidate: true })
    setSearchQuery('')
  }

  const handleClose = () => { reset(); setSelectedSiswa(null); setSearchQuery(''); setSubmitError(null); setTahunPendaftaran(''); onClose() }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await mutation.mutateAsync({ siswaId: values.siswaId, tanggalMasuk: values.tanggalMasuk })
      handleClose()
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    }
  })

  return (
    <Modal open={open} onClose={handleClose} title="Tambah Siswa ke Kelas"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={mutation.isPending}>Tambah Siswa</Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-5">
          {submitError && <ErrorBox message={submitError} />}

          {/* ── Filter ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Filter Siswa</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tahun Pendaftaran</label>
                <input
                  type="number"
                  placeholder="Semua tahun"
                  value={tahunPendaftaran}
                  onChange={(e) => { setTahunPendaftaran(e.target.value); setSelectedSiswa(null); setValue('siswaId', '') }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cari Nama / NISN</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ketik nama atau NISN..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: '16px' }}
                    disabled={!!selectedSiswa} />
                </div>
              </div>
            </div>

            {/* Hasil dropdown */}
            {!selectedSiswa && !tahunPendaftaran && (
              <p className="text-xs text-amber-600 dark:text-amber-400 pt-0.5">
                Isi tahun pendaftaran terlebih dahulu agar pencarian berjalan
              </p>
            )}
            {!selectedSiswa && !!tahunPendaftaran && searchQuery.length >= 1 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm divide-y divide-gray-50 dark:divide-gray-700/40 max-h-44 overflow-y-auto">
                {isLoading ? <p className="px-4 py-3 text-sm text-gray-400">Memuat...</p>
                  : filteredSiswa.length === 0 ? <p className="px-4 py-3 text-sm text-gray-400">Siswa tidak ditemukan</p>
                  : filteredSiswa.map((s) => (
                    <button key={s.id} type="button"
                      disabled={!!s.sudahDiKelas}
                      onClick={() => !s.sudahDiKelas && handleSelect(s)}
                      className={[
                        'w-full text-left px-4 py-2.5 transition-colors last:rounded-b-lg',
                        s.sudahDiKelas
                          ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700/30'
                          : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                      ].join(' ')}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{s.profile.namaLengkap}</p>
                        {s.sudahDiKelas && (
                          <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                            {s.infoKelas?.namaKelas ?? 'Sudah di kelas lain'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{s.profile.nisn ? `NISN: ${s.profile.nisn}` : 'Tanpa NISN'}</p>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* ── Data Form ── */}
          <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data Pendaftaran</p>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Siswa <span className="text-red-500">*</span></label>
              {selectedSiswa ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedSiswa.profile.namaLengkap}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedSiswa.profile.nisn ? `NISN: ${selectedSiswa.profile.nisn}` : 'Tanpa NISN'}</p>
                  </div>
                  <button type="button" onClick={() => { setSelectedSiswa(null); setValue('siswaId', '') }}
                    className="text-xs text-red-500 hover:text-red-700">Ganti</button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm text-gray-400">
                  Belum ada siswa dipilih — gunakan filter di atas
                </div>
              )}
              <input type="hidden" {...register('siswaId')} />
              {errors.siswaId && <p className="text-xs text-red-500">{errors.siswaId.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Masuk Kelas <span className="text-red-500">*</span></label>
              <Input {...register('tanggalMasuk')} type="date" error={errors.tanggalMasuk?.message} />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}
