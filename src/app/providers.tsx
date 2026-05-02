'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { Toaster } from 'sonner'
import dynamic from 'next/dynamic'
import '@/lib/suppress-dev-warnings'

const PWAInstallPrompt = dynamic(
  () => import('@/components/pwa/PWAInstallPrompt').then(m => m.PWAInstallPrompt),
  { ssr: false },
)

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors position="top-right" />
        <PWAInstallPrompt />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
