'use client'

import { CheckCircle2, Clock, Pencil, Trash2, ShieldCheck, ExternalLink, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  TINGKAT_LABEL, TINGKAT_COLOR,
  HASIL_LABEL,   HASIL_COLOR,
  type PrestasiItem,
} from '@/types/prestasi.types'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

function fmtDate(iso: string) {
  try { return format(new Date(iso), 'd MMM yyyy', { locale: localeId }) }
  catch { return iso }
}

interface Props {
  item:          PrestasiItem
  /** siswa — hanya bisa edit/hapus sendiri yg belum verified */
  isSiswa?:      boolean
  /** wali/admin — bisa verifikasi */
  canVerify?:    boolean
  /** admin — bisa hapus semua */
  canDeleteAny?: boolean
  currentUserId?: string
  onEdit?:       (item: PrestasiItem) => void
  onDelete?:     (item: PrestasiItem) => void
  onVerify?:     (item: PrestasiItem) => void
}

export function PrestasiCard({
  item, isSiswa, canVerify, canDeleteAny, currentUserId,
  onEdit, onDelete, onVerify,
}: Props) {

  const canEdit = (
    (isSiswa && item.siswaId === currentUserId && !item.isVerified) ||
    (!isSiswa && !canVerify && canDeleteAny)
  )
  const canDel = canDeleteAny || (isSiswa && item.inputBy === currentUserId && !item.isVerified)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col">
      {/* Foto / Banner */}
      {item.fotoUrl ? (
        <div className="relative h-36 overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img src={item.fotoUrl} alt={item.judul}
            className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          {/* Overlay badge */}
          <div className="absolute top-2 left-2">
            <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', HASIL_COLOR[item.hasilPrestasi])}>
              {HASIL_LABEL[item.hasilPrestasi]}
            </span>
          </div>
        </div>
      ) : (
        /* No photo — colored header */
        <div className="h-14 flex items-center px-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50">
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', HASIL_COLOR[item.hasilPrestasi])}>
            {HASIL_LABEL[item.hasilPrestasi]}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 p-4 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
          {item.judul}
        </h3>

        {/* Jenis + Tingkat */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
            {item.jenisLomba}
          </span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', TINGKAT_COLOR[item.tingkat])}>
            {TINGKAT_LABEL[item.tingkat]}
          </span>
        </div>

        {/* Penyelenggara + Tanggal */}
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
          {item.penyelenggara}
        </p>
        <p className="text-xs text-gray-400">
          {fmtDate(item.tanggalMulai)}
          {item.tanggalSelesai && ` – ${fmtDate(item.tanggalSelesai)}`}
        </p>

        {/* Peringkat */}
        {item.peringkat && (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">{item.peringkat}</p>
        )}

        {/* Siswa (jika tampilan guru/admin) */}
        {!isSiswa && item.siswa?.profile?.namaLengkap && (
          <p className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
            <User size={11} className="shrink-0 text-gray-400" />
            {item.siswa.profile.namaLengkap}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        {/* Status verified */}
        {item.isVerified ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={12} /> Terverifikasi
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Clock size={12} /> Menunggu
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Sertifikat link */}
          {item.sertifikatUrl && (
            <a href={item.sertifikatUrl} target="_blank" rel="noopener noreferrer"
              title="Lihat Sertifikat"
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <ExternalLink size={13} />
            </a>
          )}
          {/* Verify */}
          {canVerify && !item.isVerified && onVerify && (
            <button type="button" onClick={() => onVerify(item)}
              title="Verifikasi"
              className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              <ShieldCheck size={13} />
            </button>
          )}
          {/* Edit */}
          {canEdit && onEdit && (
            <button type="button" onClick={() => onEdit(item)}
              title="Edit"
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
              <Pencil size={13} />
            </button>
          )}
          {/* Delete */}
          {canDel && onDelete && (
            <button type="button" onClick={() => onDelete(item)}
              title="Hapus"
              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
