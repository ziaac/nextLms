import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  // Tambahkan baris ini untuk build Docker yang efisien
  output: 'standalone', 

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storagelms.man2kotamakassar.sch.id',
      },
    ],
  },

  allowedDevOrigins: [
    '192.168.2.88',
    'localhost',
    '*.trycloudflare.com',
  ],

  // Pastikan file manifest dilayani dengan MIME type yang benar
  async headers() {
    return [
      {
        source: '/site.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' },
        ],
      },
      // Cache agresif untuk static assets hanya di production.
      // Di dev, Next.js mengelola cache sendiri — jangan di-override.
      ...(!isDev ? [{
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      }] : []),
      {
        // CSP untuk semua halaman
        // unsafe-eval dibutuhkan oleh beberapa library (recharts, heroui) di dev mode
        // Di production, eval diblokir kecuali jika library memang memerlukannya
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // unsafe-eval hanya di dev; di production hapus jika tidak ada error
              isDev
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://storagelms.man2kotamakassar.sch.id",
              "font-src 'self' data:",
              "connect-src 'self' https://storagelms.man2kotamakassar.sch.id https://apilms.man2kotamakassar.sch.id wss: ws:",
              "media-src 'self' blob:",
              "object-src 'none'",
              "frame-src 'self' blob: https://storagelms.man2kotamakassar.sch.id",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // canvas is an optional Node.js dep of pdfjs-dist — not needed in browser
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },

  turbopack: {
    resolveAlias: {
      canvas: { browser: './src/lib/canvas-empty.ts' },
    },
  },
}

export default nextConfig