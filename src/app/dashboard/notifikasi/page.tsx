import { Suspense } from 'react'
import { Skeleton } from '@/components/ui'
import { NotifikasiPageContent } from './NotifikasiPageContent'

export default function NotifikasiPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      }
    >
      <NotifikasiPageContent />
    </Suspense>
  )
}
