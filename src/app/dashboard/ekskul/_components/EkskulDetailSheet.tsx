'use client'

import { useState } from 'react'
import { X, Calendar, MapPin, Users, Loader2, ChevronLeft, ChevronRight, Star, CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEkskulDetail, useKegiatanEkskul, useDaftarMandiri } from '@/hooks/ekskul/useEkskul'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { HARI_LABEL, type EkskulItem, type StatusAnggotaEkskul } from '@/types/ekskul.types'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

function fmtTime(iso: string) {
  try { return format(new Date(iso), 'HH:mm') } catch { return '' }
}
function fmtDate(iso: string) {
  try { return format(new Date(iso), 'd MMM yyyy', { locale: localeId }) } catch { return iso }
}

interface Props {
  ekskulId:    string | null
  onClose:     () => void
  /** Status keanggotaan siswa di ekskul ini (jika ada) */
  myStatus?:   StatusAnggotaEkskul | null
  isSiswa?:    boolean
}

export function EkskulDetailSheet({ ekskulId, onClose, myStatus, isSiswa }: Props) {
  const [kegiatanPage, setKegiatanPage] = useState(1)

  const { data: ekskul,   isLoading: loadingDetail }   = useEkskulDetail(ekskulId)
  const { data: kegRaw,   isLoading: loadingKegiatan } = useKegiatanEkskul(ekskulId, kegiatanPage)
  const kegiatan   = (kegRaw as any)?.data ?? []
  const kegTotal   = (kegRaw as any)?.total ?? 0
  const kegPages   = Math.max(1, Math.ceil(kegTotal / 10))

  const { data: taListRaw = [] } = useTahunAjaranActive()
  const taList  = taListRaw as { id: string; nama: string }[]
  const taAktif = taList[0]

  const daftarMut = useDaftarMandiri()

  const handleDaftar = async () => {
    if (!ekskulId || !taAktif) return
    try {
      await daftarMut.mutateAsync({
        ekstrakurikulerId: ekskulId,
        tahunAjaranId: taAktif.id,
        tanggalBergabung: format(new Date(), 'yyyy-MM-dd'),
      })
      toast.success('Pendaftaran berhasil! Menunggu persetujuan pembina.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Gagal mendaftar')
    }
  }

  if (!ekskulId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[88dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {loadingDetail ? 'Memuat...' : ekskul?.nama ?? 'Detail Ekskul'}
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {loadingDetail ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : ekskul ? (
            <>
              {/* Logo + Info */}
              <div className="flex items-start gap-4">
                {ekskul.logoUrl ? (
                  <img src={ekskul.logoUrl} alt={ekskul.nama}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-100 dark:bg-gray-800" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <Star size={24} className="text-emerald-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  {ekskul.kategori && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      {ekskul.kategori}
                    </span>
                  )}
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{ekskul.nama}</p>
                  <p className="text-xs text-gray-500">
                    Pembina: {ekskul.pembina?.profile?.namaLengkap ?? '—'}
                  </p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                    <Calendar size={10} /> Jadwal
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {HARI_LABEL[ekskul.jadwalHari]}
                  </p>
                  <p className="text-xs text-gray-500">{fmtTime(ekskul.jadwalJam)} WIB</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                    <Users size={10} /> Anggota
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {ekskul._count?.anggota ?? 0} / {ekskul.kuotaMaksimal}
                  </p>
                  <p className="text-xs text-gray-500">siswa aktif</p>
                </div>
              </div>

              {ekskul.tempatKegiatan && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={12} className="shrink-0" />
                  {ekskul.tempatKegiatan}
                </div>
              )}

              {ekskul.deskripsi && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {ekskul.deskripsi}
                </p>
              )}

              {/* Kegiatan terbaru */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Kegiatan Terbaru
                  </h3>
                  <p className="text-xs text-gray-400">{kegTotal} kegiatan</p>
                </div>
                {loadingKegiatan ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : kegiatan.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Belum ada kegiatan tercatat</p>
                ) : (
                  <div className="space-y-2">
                    {kegiatan.map((k: any) => (
                      <div key={k.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="text-center shrink-0 w-9">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none">
                            {format(new Date(k.tanggal), 'd')}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase">
                            {format(new Date(k.tanggal), 'MMM', { locale: localeId })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                            {k.judul}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {fmtTime(k.jamMulai)}–{fmtTime(k.jamSelesai)} · {k.tempat}
                          </p>
                          {k.catatan && (
                            <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">{k.catatan}</p>
                          )}
                        </div>
                        {k.peserta > 0 && (
                          <span className="text-[10px] text-gray-400 shrink-0">{k.peserta} hadir</span>
                        )}
                      </div>
                    ))}
                    {kegPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button type="button" disabled={kegiatanPage <= 1}
                          onClick={() => setKegiatanPage((p) => p - 1)}
                          className="p-1 rounded text-gray-400 disabled:opacity-40 hover:text-gray-600 transition-colors">
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-xs text-gray-400">{kegiatanPage}/{kegPages}</span>
                        <button type="button" disabled={kegiatanPage >= kegPages}
                          onClick={() => setKegiatanPage((p) => p + 1)}
                          className="p-1 rounded text-gray-400 disabled:opacity-40 hover:text-gray-600 transition-colors">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer — tombol daftar (hanya untuk siswa) */}
        {isSiswa && ekskul && (
          <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
            {myStatus === 'AKTIF' ? (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle2 size={15} /> Anda sudah menjadi anggota aktif
              </div>
            ) : myStatus === 'NONAKTIF' ? (
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium">
                <Clock size={15} /> Menunggu persetujuan pembina
              </div>
            ) : (
              <button type="button" onClick={handleDaftar}
                disabled={daftarMut.isPending || !ekskul.isActive}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                  ekskul.isActive
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800',
                )}>
                {daftarMut.isPending && <Loader2 size={15} className="animate-spin" />}
                {ekskul.isActive ? 'Daftar Ekskul Ini' : 'Ekskul Tidak Aktif'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
