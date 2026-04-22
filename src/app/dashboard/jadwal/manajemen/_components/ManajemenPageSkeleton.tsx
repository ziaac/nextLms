export function ManajemenPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-44 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          <div className="h-9 w-36 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          <div className="h-9 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-56 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="h-9 w-40 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="h-9 w-44 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        <div className="h-9 w-44 bg-gray-100 dark:bg-gray-800 rounded-lg" />
      </div>

      {/* Tabel */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Hint bar */}
        <div className="h-8 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800/30" />
        {/* Header */}
        <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
        {/* Rows */}
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
          >
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" style={{ maxWidth: `${60 + (i % 3) * 15}%` }} />
            <div className="w-20 h-4 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="w-20 h-6 bg-gray-100 dark:bg-gray-700 rounded-full" />
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
