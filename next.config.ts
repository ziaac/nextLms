import type { NextConfig } from 'next'

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