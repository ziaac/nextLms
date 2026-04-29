const CACHE_NAME     = 'lms-man2-v3'
const IMG_CACHE_NAME = 'lms-man2-images-v1'
const OLD_CACHES     = ['lms-man2-v1', 'lms-man2-v2']

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => OLD_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // ── Cache-first untuk gambar dari MinIO storage ──
  // Gambar tidak berubah (UUID-based URL), aman di-cache lama
  const isStorageImage = url.hostname.includes('storagelms') ||
    url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif)$/i)

  if (isStorageImage) {
    event.respondWith(
      caches.open(IMG_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached
          return fetch(event.request).then((res) => {
            if (res.ok) cache.put(event.request, res.clone())
            return res
          })
        })
      )
    )
    return
  }

  // ── Network-first untuk request lainnya (API, halaman) ──
  // Jangan cache API calls
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    return // biarkan browser handle langsung
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})
