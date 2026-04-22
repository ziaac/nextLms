'use client'

import { SlideOver }            from '@/components/ui/SlideOver'
import { MateriStatusBadge }    from './MateriStatusBadge'
import { MateriTipeBadge }      from './MateriTipeBadge'
import { MateriPreviewContent } from './MateriPreviewContent'
import { getStatusMateri }      from '@/types/materi-pelajaran.types'
import type { MateriItem }      from '@/types/materi-pelajaran.types'
import { format }               from 'date-fns'
import { id as localeId }       from 'date-fns/locale'
import { Eye, Clock, BookOpen, User, GraduationCap, FileText } from 'lucide-react'

interface Props {
  open:    boolean
  onClose: () => void
  item:    MateriItem | null
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value}</p>
      </div>
    </div>
  )
}

export function MateriDetailSlideOver({ open, onClose, item }: Props) {
  if (!item) return null

  const status   = getStatusMateri(item)
  const namaMapel = item.mataPelajaran?.mataPelajaranTingkat?.masterMapel?.nama ?? (item.mataPelajaran as any)?.masterMapel?.nama ?? (item.mataPelajaran as any)?.nama ?? '—'
  const namaKelas = item.kelas?.namaKelas ?? item.mataPelajaran?.kelas?.namaKelas ?? '—'
  const tingkat   = item.mataPelajaran?.mataPelajaranTingkat?.tingkatKelas?.nama ?? ''
  const namaGuru  = item.guru?.profile?.namaLengkap ?? '—'
  const semester  = item.mataPelajaran?.semester
    ? `${item.mataPelajaran.semester.nama} ${item.mataPelajaran.semester.isActive ? '(Aktif)' : ''}`
    : '—'

  const description = [namaMapel, namaKelas].filter(Boolean).join(' · ')

  const pubAt = item.tanggalPublikasi
    ? format(new Date(item.tanggalPublikasi), "EEEE, d MMMM yyyy 'pukul' HH:mm", { locale: localeId })
    : null

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Detail Materi Pelajaran"
      description={description || undefined}
      width="lg"
    >
      <div className="space-y-6">

        {/* ── Badges ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <MateriStatusBadge status={status} />
          <MateriTipeBadge   tipe={item.tipeMateri} />
          {item.pertemuanKe && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              Pertemuan ke-{item.pertemuanKe}
            </span>
          )}
        </div>

        {/* ── Judul ── */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white leading-snug">
            {item.judul}
          </h2>
          {item.deskripsi && (
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {item.deskripsi}
            </p>
          )}
        </div>

        {/* ── Meta identitas ── */}
        <div className="grid grid-cols-2 gap-4 px-4 py-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
          <MetaRow icon={BookOpen}      label="Mata Pelajaran" value={namaMapel} />
          <MetaRow icon={GraduationCap} label="Kelas"          value={`${namaKelas}${tingkat ? ` · ${tingkat}` : ''}`} />
          <MetaRow icon={User}          label="Guru"           value={namaGuru} />
          <MetaRow icon={BookOpen}      label="Semester"       value={semester} />
          {pubAt && (
            <div className="col-span-2 flex items-start gap-2.5">
              <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Tanggal Publikasi</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{pubAt}</p>
              </div>
            </div>
          )}
          <div className="col-span-2 flex items-center gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Eye size={12} /> {item.viewCount} kali dilihat
            </div>
            {item.minScreenTime > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={12} /> Min. {Math.round(item.minScreenTime / 60)} menit
              </div>
            )}
          </div>
        </div>

        {/* ── Kompetensi & Tujuan ── */}
        {(item.kompetensiDasar || item.tujuanPembelajaran) && (
          <div className="space-y-3">
            {item.kompetensiDasar && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Kompetensi Dasar
                </p>
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                  dangerouslySetInnerHTML={{ __html: item.kompetensiDasar }}
                />
              </div>
            )}
            {item.tujuanPembelajaran && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Tujuan Pembelajaran
                </p>
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                  dangerouslySetInnerHTML={{ __html: item.tujuanPembelajaran }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Preview Konten ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Preview Materi
          </p>
          <MateriPreviewContent
            tipe={item.tipeMateri}
            konten={item.konten}
            fileUrls={item.fileUrls}
          />
        </div>

        {/* ── Dokumen terkait ── */}
        {item.dokumenPengajarans && item.dokumenPengajarans.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Dokumen Pengajaran Terkait
            </p>
            <div className="space-y-1.5">
              {item.dokumenPengajarans.map((dok) => (
                <a
                  key={dok.id}
                  href={dok.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm text-emerald-600 dark:text-emerald-400"
                >
                  <FileText size={14} className="shrink-0" />
                  <span className="truncate">{dok.judul}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{dok.jenisDokumen}</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </SlideOver>
  )
}
