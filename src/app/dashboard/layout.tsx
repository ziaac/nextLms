'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { MobileDrawer } from '@/components/dashboard/MobileDrawer'
import { SocketInitializer } from '@/components/dashboard/SocketInitializer'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-6 p-4 lg:p-6">
          <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
      <SocketInitializer />
    </div>
  )
}