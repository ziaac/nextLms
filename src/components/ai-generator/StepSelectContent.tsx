'use client'

import { FileText, BookOpen, ClipboardList } from 'lucide-react'
import type { JenisKontenAI } from '@/types/ai-generator.types'
import { cn } from '@/lib/utils'

interface ContentOption {
  value:       JenisKontenAI
  label:       string
  description: string
  icon:        React.ComponentType<{ size?: number; className?: string }>
}

const OPTIONS: ContentOption[] = [
  {
    value:       'RPP',
    label:       'RPP',
    description: 'Rencana Pelaksanaan Pembelajaran lengkap mengikuti format kurikulum aktif.',
    icon:        FileText,
  },
  {
    value:       'MATERI_PELAJARAN',
    label:       'Materi Pelajaran',
    description: 'Bahan ajar terstruktur dengan tujuan, kompetensi, dan konten richtext.',
    icon:        BookOpen,
  },
  {
    value:       'TUGAS',
    label:       'Tugas / Kuis',
    description: 'Tugas pembelajaran dengan opsi soal pilihan ganda atau esai.',
    icon:        ClipboardList,
  },
]

interface Props {
  value:    JenisKontenAI | null
  onChange: (val: JenisKontenAI) => void
}

export function StepSelectContent({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Pilih Jenis Konten
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Konten apa yang ingin Anda generate dengan AI?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((opt) => {
          const Icon     = opt.icon
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'text-left rounded-xl border-2 p-5 transition-all',
                selected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700',
              )}
            >
              <Icon
                size={28}
                className={cn(
                  'mb-3',
                  selected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400',
                )}
              />
              <p className="font-semibold text-gray-900 dark:text-gray-100">{opt.label}</p>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{opt.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
