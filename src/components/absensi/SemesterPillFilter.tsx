'use client'

interface SemesterOption {
  id:       string
  nama:     string
  isActive: boolean
}

interface Props {
  semesters: SemesterOption[]
  value:     string           // semesterId yang dipilih
  onChange:  (id: string) => void
}

/**
 * Pill single-select untuk memilih semester.
 * Aktif ditandai dot hijau. Arsip tetap bisa dipilih (dot abu).
 */
export function SemesterPillFilter({ semesters, value, onChange }: Props) {
  if (semesters.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 font-medium">Semester:</span>
      {semesters.map((s) => {
        const selected = value === s.id
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
              'border transition-colors',
              selected
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600',
            ].join(' ')}
          >
            {/* Dot: hijau = aktif, abu = arsip */}
            <span className={[
              'w-1.5 h-1.5 rounded-full flex-shrink-0',
              s.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600',
            ].join(' ')} />
            {s.nama}
            {s.isActive && (
              <span className="text-[9px] font-normal opacity-70">Aktif</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
