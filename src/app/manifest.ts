import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'LMS MAN 2 Kota Makassar',
    short_name:       'LMS MAN 2',
    description:      'Sistem Manajemen Pembelajaran MAN 2 Kota Makassar',
    start_url:        '/',
    display:          'standalone',
    background_color: '#ffffff',
    theme_color:      '#059669',
    lang:             'id',
    icons: [
      {
        src:   '/android-chrome-192x192.png',
        sizes: '192x192',
        type:  'image/png',
      },
      {
        src:   '/android-chrome-512x512.png',
        sizes: '512x512',
        type:  'image/png',
      },
      {
        src:   '/apple-touch-icon.png',
        sizes: '180x180',
        type:  'image/png',
      },
    ],
  }
}
