import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const APP_URL = 'https://lms.man2kotamakassar.sch.id'
const APP_NAME = 'LMS MAN 2 Kota Makassar'
const APP_DESC = 'Sistem Manajemen Pembelajaran & ERP MAN 2 Kota Makassar'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  title: {
    default: APP_NAME,
    template: '%s | LMS MAN 2 Makassar',
  },
  description: APP_DESC,
  keywords: ['LMS', 'MAN 2', 'Makassar', 'Madrasah', 'E-Learning', 'Sistem Manajemen Pembelajaran'],
  authors: [{ name: 'MAN 2 Kota Makassar', url: APP_URL }],

  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESC,
    locale: 'id_ID',
  },

  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESC,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
