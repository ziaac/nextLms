import type { TipeMateri } from '@/types/materi-pelajaran.types'
import { FileText, FileImage, Volume2, Video, Presentation, Layers } from 'lucide-react'

const CONFIG: Record<TipeMateri, { label: string; className: string; Icon: React.ElementType }> = {
  TEXT:          { label: 'Teks',       className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',         Icon: FileText },
  PDF:           { label: 'PDF',        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             Icon: FileImage },
  AUDIO:         { label: 'Audio',      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', Icon: Volume2 },
  VIDEO_YOUTUBE: { label: 'YouTube',    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',         Icon: Video },
  SLIDESHOW:     { label: 'Slideshow',  className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', Icon: Presentation },
  HYBRID:        { label: 'Hybrid',     className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',         Icon: Layers },
}

export function MateriTipeBadge({ tipe }: { tipe: TipeMateri }) {
  const cfg  = CONFIG[tipe] ?? CONFIG.TEXT
  const Icon = cfg.Icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.className}`}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

export function getTipeLabel(tipe: TipeMateri) {
  return CONFIG[tipe]?.label ?? tipe
}
