'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search } from 'lucide-react'
import { Modal, Button, Input } from '@/components/ui'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useTambahSiswaBulk } from '@/hooks/kelas/useKelasSiswa'
import type { UserByRole } from '@/types/kelas.types'

const FORM_ID = 'tambah-siswa-bulk-form'
const schema = z.object({ tanggalMasuk: z.string().min(1, 'Tanggal masuk wajib diisi') })
type FormValues = z.infer<typeof schema>

interface Props { open: boolean; onClose: () => void; kelasId: string; tahunAjaranId: string }

export function TambahSiswaBulkModal({ open, onClose, kelasId, tahunAjaranId }: Props) {
  const [searchQuery, setSearchQuery]           = useState('')
  const [selected, setSelected]                 = useState<Set<string>>(new Set())
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
    return filtered.sort((a, b) => (a.sudahDiKelas ? 1 : 0) - (b.sudahDiKelas ? 1 : 0))
  }, [siswaList, searchQuery])

  const mutation = useTambahSiswaBulk(kelasId)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tanggalMasuk: '' },
  })

  const availableSiswa = useMemo(() => filteredSiswa.filter((s) => !s.sudahDiKelas), [filteredSiswa])

  const toggleSelect = (id: string) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const allFilteredSelected = availableSiswa.length > 0 && availableSiswa.every((s) => selected.has(s.id))
  const toggleAll = () => setSelected(allFilteredSelected ? new Set() : new Set(availableSiswa.map((s) => s.id)))
  const handleClose = () => { reset(); setSelected(new Set()); setSearchQuery(''); setTahunPendaftaran(''); onClose() }

const onSubmit = handleSubmit((values) => {
    const payload = { 
      tanggalMasuk: values.tanggalMasuk, 
      siswa: Array.from(selected).map((siswaId) => ({ 
        siswaId
        // Hapus baris tanggalMasuk di sini
      })) 
    }
    mutation.mutate(payload, { onSuccess: handleClose })
  })
  return (
    <Modal open={open} onClose={handleClose} title="Tambah Siswa Bulk" size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Batal</Button>
          <Button type="submit" form={FORM_ID} loading={mutation.isPending} disabled={selected.size === 0}>
            Tambah {selected.size} Siswa
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="p-6 space-y-5">

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
                  onChange={(e) => { setTahunPendaftaran(e.target.value); setSelected(new Set()) }}
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
                    placeholder="Nama atau NISN..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: '16px' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{selected.size} siswa dipilih</span>
              {availableSiswa.length > 0 && (
                <button type="button" onClick={toggleAll} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  {allFilteredSelected ? 'Batal pilih semua' : 'Pilih semua yang tersedia'}
                </button>
              )}
            </div>
            <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
              {!tahunPendaftaran ? (
                <p className="px-4 py-8 text-center text-sm text-gray-400">
                  Isi <span className="font-medium text-gray-500 dark:text-gray-300">Tahun Pendaftaran</span> untuk memuat daftar siswa
                </p>
              ) : isLoading ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Memuat data siswa...</p>
              ) : filteredSiswa.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Tidak ada siswa ditemukan</p>
              ) : filteredSiswa.map((s) => (
                <label key={s.id}
                  className={[
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    s.sudahDiKelas
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700/30'
                      : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  ].join(' ')}>
                  <input type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 accent-emerald-600"
                    checked={selected.has(s.id)}
                    disabled={!!s.sudahDiKelas}
                    onChange={() => !s.sudahDiKelas && toggleSelect(s.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.profile.namaLengkap}</p>
                      {s.sudahDiKelas && (
                        <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                          {s.infoKelas?.namaKelas ?? 'Sudah di kelas lain'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{s.profile.nisn ? `NISN: ${s.profile.nisn}` : 'Tanpa NISN'}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Data Form ── */}
          <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Data Pendaftaran</p>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Masuk Kelas <span className="text-red-500">*</span></label>
              <Input {...register('tanggalMasuk')} type="date" error={errors.tanggalMasuk?.message} />
              <p className="text-xs text-gray-400">Berlaku untuk semua siswa yang dipilih</p>
            </div>
          </div>

        </div>
      </form>
    </Modal>
  )
}
