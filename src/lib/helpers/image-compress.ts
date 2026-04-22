/**
 * Kompres image menggunakan Canvas API.
 * - Resize agar lebar/tinggi max tidak melebihi maxPx
 * - Export sebagai WebP dengan kualitas tertentu
 * - Jika hasil lebih besar dari maxBytes, turunkan quality secara iteratif
 *
 * Reusable untuk semua modul yang butuh kompres foto sebelum upload.
 */

export interface CompressOptions {
  /** Max width/height in px (default: 1200) */
  maxPx?:    number
  /** Initial WebP quality 0–1 (default: 0.80) */
  quality?:  number
  /** Max output size in bytes (default: 500_000 = 500 KB) */
  maxBytes?: number
}

/**
 * Kompres File/Blob gambar → Blob WebP sekecil mungkin.
 */
export async function compressImage(
  source:  File | Blob,
  options: CompressOptions = {},
): Promise<Blob> {
  const { maxPx = 1200, quality = 0.80, maxBytes = 500_000 } = options

  // 1. Baca sebagai ImageBitmap (lebih efisien dari FileReader)
  const bitmap = await createImageBitmap(source)

  // 2. Hitung dimensi baru dengan mempertahankan aspect ratio
  let { width, height } = bitmap
  if (width > maxPx || height > maxPx) {
    if (width >= height) {
      height = Math.round((height / width) * maxPx)
      width  = maxPx
    } else {
      width  = Math.round((width / height) * maxPx)
      height = maxPx
    }
  }

  // 3. Gambar ke canvas
  const canvas = document.createElement('canvas')
  canvas.width  = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // 4. Export WebP — turunkan quality jika masih terlalu besar
  let q    = quality
  let blob = await canvasToBlob(canvas, 'image/webp', q)

  while (blob.size > maxBytes && q > 0.3) {
    q   -= 0.08
    blob = await canvasToBlob(canvas, 'image/webp', Math.max(q, 0.3))
  }

  return blob
}

/**
 * Kompres → buat File object dengan nama .webp (siap untuk FormData).
 */
export async function compressImageToFile(
  source:   File | Blob,
  filename  = 'foto.webp',
  options?: CompressOptions,
): Promise<File> {
  const blob = await compressImage(source, options)
  return new File([blob], filename.replace(/\.[^.]+$/, '.webp'), {
    type:         'image/webp',
    lastModified: Date.now(),
  })
}

// ── Internal ──────────────────────────────────────────────────────────────────
function canvasToBlob(
  canvas:  HTMLCanvasElement,
  type:    string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob gagal'))),
      type,
      quality,
    )
  })
}

/**
 * Format ukuran file untuk ditampilkan ke user.
 * Contoh: formatFileSize(123456) → "120.6 KB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
