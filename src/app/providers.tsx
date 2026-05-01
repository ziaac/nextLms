'use client'

import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { Toaster } from 'sonner'

// next-themes menyuntikkan inline <script> untuk mencegah flash tema (FOUC).
// React 19 memperingatkan tentang script tag di dalam komponen, tapi ini
// adalah false positive — script berjalan dengan benar saat SSR.
// Referensi: https://github.com/pacocoursey/next-themes/issues
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return
    orig.apply(console, args)
  }
}

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
      </ThemeProvider>
    </QueryClientProvider>
  )
}
