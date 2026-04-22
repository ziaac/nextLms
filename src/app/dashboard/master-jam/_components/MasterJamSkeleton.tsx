export function MasterJamSkeleton() {
  const widths = ['50%', '62%', '74%', '50%', '62%', '74%', '50%', '62%']

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" />
      {widths.map((w, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
          <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded" style={{ maxWidth: w }} />
          <div className="w-14 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
          <div className="w-14 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
          <div className="w-10 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
          <div className="w-10 h-4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
          <div className="w-16 h-6 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto" />
          <div className="flex gap-2 ml-auto">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
