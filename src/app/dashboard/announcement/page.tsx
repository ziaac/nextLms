import { Suspense } from 'react'
import { AnnouncementContent } from './AnnouncementContent'

export default function AnnouncementPage() {
  return (
    <Suspense>
      <AnnouncementContent />
    </Suspense>
  )
}
