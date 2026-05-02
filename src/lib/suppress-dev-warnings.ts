/**
 * Suppress known false-positive warnings dari third-party libraries di development.
 * File ini di-import di layout.tsx (server) tapi guard typeof window memastikan
 * kode hanya berjalan di client. Di-import sebagai side-effect module.
 *
 * Daftar warning yang di-suppress:
 * 1. next-themes — React 19 memperingatkan inline <script> tag (false positive)
 * 2. @heroui/react v3 — meneruskan `fetchpriority` lowercase ke React DOM
 *    yang mengharapkan camelCase `fetchPriority`. Bug library, bukan kode kita.
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const _origError = console.error
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string') {
      if (args[0].includes('Encountered a script tag')) return
      if (args[0].includes('fetchpriority')) return
    }
    _origError.apply(console, args)
  }
}
