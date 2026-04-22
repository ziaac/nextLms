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

  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', rel: 'icon' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', rel: 'icon' },
    ],
  },

  manifest: '/site.webmanifest',

  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESC,
    locale: 'id_ID',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sistem Manajemen Pembelajaran MAN 2 Kota Makassar',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESC,
    images: ['/opengraph-image.jpg'],
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
