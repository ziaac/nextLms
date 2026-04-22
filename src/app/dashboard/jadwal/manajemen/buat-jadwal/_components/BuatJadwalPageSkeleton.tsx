export function BuatJadwalPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-5 w-52 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-80 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          <div className="h-9 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex gap-4 items-start">
        {/* Kiri — Guru Info */}
        <div className="w-64 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-3">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-px bg-gray-100 dark:bg-gray-800" />
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        </div>

        {/* Tengah — Grid */}
        <div className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Header row */}
          <div className="flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="w-20 shrink-0 p-3">
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-1 p-3 border-l border-gray-200 dark:border-gray-700">
                <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
              </div>
            ))}
          </div>
          {/* Rows */}
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((hari) => (
            <div key={hari} className="flex border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="w-20 shrink-0 p-3 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-800">
                <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              {[...Array(6)].map((_, j) => (
                <div key={j} className="flex-1 p-1.5 border-r border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="h-24 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Kanan — Palette */}
        <div className="w-56 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-2">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-px bg-gray-100 dark:bg-gray-800" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
