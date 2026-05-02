/**
 * Service Worker — LMS MAN 2 Kota Makassar
 *
 * AUDIT CACHE STRATEGY (2026-05-01)
 * ──────────────────────────────────────────────────────────────────────────
 * Prinsip utama: data fresh > performa cache untuk modul kritis.
 *
 * TIDAK DI-CACHE (network-only, biarkan browser handle):
 *   - /api/*                  → semua API endpoint (absensi, jadwal, pembayaran,
 *                               notifikasi, dll.) — data real-time, TIDAK BOLEH stale
 *   - Halaman dashboard       → HTML Next.js bisa berisi data SSR; biarkan fresh
 *   - Request ke hostname lain → CDN/storage eksternal punya cache sendiri
 *
 * DI-CACHE (aman karena konten tidak berubah):
 *   - /_next/static/*         → JS/CSS bundle Next.js (content-hashed, aman cache lama)
 *   - Gambar dari storage MinIO (UUID-based URL, tidak pernah berubah)
 *   - Gambar statis lokal (.webp, .jpg, .png, .svg, dll.)
 *
 * STRATEGI PER TIPE:
 *   - Static JS/CSS (_next/static): Cache-first (konten sudah content-hashed)
 *   - Gambar:                       Cache-first + max 200 item, 30 hari TTL
 *   - Semua lainnya:                Network-only (tidak di-cache)
 * ──────────────────────────────────────────────────────────────────────────
 */

const STATIC_CACHE_NAME = 'lms-man2-static-v5'   // JS/CSS Next.js bundles
const IMG_CACHE_NAME    = 'lms-man2-images-v2'    // Gambar (storage + lokal)
const OFFLINE_URL       = '/offline.html'

// Cache lama yang harus dihapus saat aktivasi
const OLD_CACHES = [
  'lms-man2-v1',
  'lms-man2-v2',
  'lms-man2-v3',
  'lms-man2-images-v1',
  'lms-man2-static-v4',
]

// Batas cache gambar agar tidak membengkak
const IMG_CACHE_MAX_ITEMS = 200
const IMG_CACHE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 hari

// ── Install ──────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  // Pre-cache halaman offline agar selalu tersedia tanpa koneksi
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  )
})

// ── Activate — bersihkan cache lama ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => OLD_CACHES.includes(key))
            .map((key) => {
              console.log('[SW] Menghapus cache lama:', key)
              return caches.delete(key)
            })
        )
      )
      .then(() => self.clients.claim())
  )
})

// ── Message handler — terima SKIP_WAITING dari ServiceWorkerRegister ────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ── Fetch — inti cache strategy ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Hanya handle GET
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // ── 1. API ENDPOINTS — TIDAK DI-CACHE (network-only) ──────────────────
  // Semua /api/* harus selalu fresh: absensi, jadwal, pembayaran, notifikasi, dll.
  // Biarkan browser handle langsung tanpa intervensi service worker.
  if (url.pathname.startsWith('/api/')) {
    return // network-only: tidak intercept
  }

  // ── 2. Request ke hostname lain — TIDAK DI-CACHE ──────────────────────
  // Termasuk storage MinIO eksternal yang punya cache header sendiri.
  // KECUALI: gambar dari storage MinIO kita tangani di blok berikutnya.
  const isOwnHost = url.hostname === self.location.hostname
  const isStorageHost = url.hostname.includes('storagelms')

  if (!isOwnHost && !isStorageHost) {
    return // network-only untuk hostname asing
  }

  // ── 3. GAMBAR — Cache-first dengan TTL dan batas jumlah ───────────────
  // Gambar dari MinIO (UUID-based URL) dan gambar statis lokal tidak berubah.
  // Aman di-cache lama. Gunakan cache-first untuk performa offline.
  const isImage =
    isStorageHost ||
    url.pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|avif|ico)$/i)

  if (isImage) {
    event.respondWith(handleImageCache(event.request))
    return
  }

  // ── 4. STATIC ASSETS Next.js — Cache-first ────────────────────────────
  // /_next/static/ berisi JS/CSS dengan content hash di nama file.
  // Konten tidak pernah berubah untuk URL yang sama → aman cache-first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(handleStaticCache(event.request))
    return
  }

  // ── 5. HALAMAN & LAINNYA — Network-first dengan offline fallback ──────
  // Halaman HTML Next.js harus selalu fresh dari network.
  // Jika network gagal (offline), tampilkan offline.html.
  // KHUSUS: /offline.html sendiri — jangan intercept, biarkan browser
  // fetch langsung dari cache SW (sudah di-pre-cache saat install).
  // Ini mencegah loop: offline.html → SW intercept → coba network → gagal → offline.html lagi.
  if (url.pathname === OFFLINE_URL) {
    return // biarkan browser ambil dari pre-cache normal
  }

  event.respondWith(handleNavigationWithFallback(event.request))
})

// ── Helper: Cache-first untuk gambar dengan TTL & batas item ────────────
async function handleImageCache(request) {
  const cache = await caches.open(IMG_CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    // Cek TTL dari header Date response yang di-cache
    const dateHeader = cached.headers.get('date')
    if (dateHeader) {
      const cachedAt = new Date(dateHeader).getTime()
      const ageSeconds = (Date.now() - cachedAt) / 1000
      if (ageSeconds < IMG_CACHE_MAX_AGE_SECONDS) {
        return cached // masih fresh, gunakan cache
      }
      // Sudah expired, hapus dan fetch ulang
      await cache.delete(request)
    } else {
      return cached // tidak ada header Date, percaya cache
    }
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      // Trim cache jika sudah terlalu banyak
      await trimImageCache(cache)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    // Offline: kembalikan cache lama meski expired (lebih baik dari error)
    return cached || Response.error()
  }
}

// ── Helper: Trim cache gambar agar tidak melebihi batas ─────────────────
async function trimImageCache(cache) {
  const keys = await cache.keys()
  if (keys.length >= IMG_CACHE_MAX_ITEMS) {
    // Hapus item paling lama (FIFO)
    const toDelete = keys.slice(0, keys.length - IMG_CACHE_MAX_ITEMS + 1)
    await Promise.all(toDelete.map((key) => cache.delete(key)))
  }
}

// ── Helper: Cache-first untuk static assets Next.js ─────────────────────
async function handleStaticCache(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    return cached || Response.error()
  }
}

// ── Helper: Network-first untuk navigasi dengan offline fallback ─────────
async function handleNavigationWithFallback(request) {
  try {
    return await fetch(request)
  } catch {
    // Offline — tampilkan halaman offline yang sudah di-pre-cache saat install
    const cache = await caches.open(STATIC_CACHE_NAME)
    const offline = await cache.match(OFFLINE_URL)
    return offline || Response.error()
  }
}
