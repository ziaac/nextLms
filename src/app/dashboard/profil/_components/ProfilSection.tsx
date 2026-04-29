import type { ReactNode } from 'react'

export function ProfilSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-4">
        {title}
      </p>
      {children}
    </div>
  )
}

export function ProfilField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 px-3 py-2.5 space-y-0.5">
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 break-words">
        {value ?? <span className="text-gray-300 dark:text-gray-600 italic">Belum diisi</span>}
      </p>
    </div>
  )
}
