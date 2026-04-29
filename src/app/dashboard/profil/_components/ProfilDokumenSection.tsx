'use client'

import { FileText, ExternalLink } from 'lucide-react'
import { usePresignedUrl } from '@/hooks/usePresignedUrl'
import type { UserProfileFull } from '@/types/users.types'

function DokumenItem({ label, fileKey }: { label: string; fileKey?: string | null }) {
  const { url, isLoading } = usePresignedUrl(fileKey ?? null)

  if (!fileKey) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 px-3 py-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 italic">Belum diunggah</p>
        </div>
      </div>
    )
  }

  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-3 flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
    >
      <FileText className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{label}</p>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
          {isLoading ? 'Memuat...' : 'Klik untuk buka'}
        </p>
      </div>
      <ExternalLink className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-500 shrink-0" />
    </a>
  )
}

interface Props {
  profile?: UserProfileFull | null
}

export function ProfilDokumenSection({ profile: p }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <p className="font-semibold text-gray-800 dark:text-gray-100">Dokumen</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <DokumenItem label="Akta Kelahiran" fileKey={p?.aktaKey} />
        <DokumenItem label="Kartu Keluarga (KK)" fileKey={p?.kkKey} />
        <DokumenItem label="Ijazah / STTB Terakhir" fileKey={p?.ijazahLaluKey} />
        <DokumenItem label="Rapor Terakhir" fileKey={p?.raporKey} />
        <DokumenItem label="SKHUN" fileKey={p?.skhunKey} />
        <DokumenItem label="Sertifikat Prestasi" fileKey={p?.sertifikatKey} />
        <DokumenItem label="KTP Orang Tua / Wali" fileKey={p?.ktpOrtuKey} />
        {p?.penerimaKIP && <DokumenItem label="Kartu KIP / PKH" fileKey={p?.kipKey} />}
      </div>
    </div>
  )
}
