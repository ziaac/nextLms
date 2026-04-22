export function JadwalFormSkeleton() {
  return (
    <div className="flex gap-4 animate-pulse">
      {/* Kiri */}
      <div className="w-64 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-3">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 flex-1 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Tengah */}
      <div className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center border-b border-gray-100 dark:border-gray-800 p-2 gap-2">
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
            {[...Array(6)].map((_, j) => (
              <div key={j} className="flex-1 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
        ))}
      </div>

      {/* Kanan */}
      <div className="w-56 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-2">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
