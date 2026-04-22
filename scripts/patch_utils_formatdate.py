"""
PATCH — Tambah formatDate ke src/lib/utils.ts

Jalankan dari ROOT project:
    python scripts/patch_utils_formatdate.py
"""

import os

BASE      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UTILS_PATH = os.path.join(BASE, "src", "lib", "utils.ts")

ANCHOR = "export function truncate(text: string, maxLength: number): string {"

NEW_FUNC = """\
/**
 * Format ISO date string ke format lokal Indonesia (WITA)
 * Contoh: "2025-07-15T00:00:00.000Z" → "15 Jul 2025"
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '-'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('id-ID', {
    day:      'numeric',
    month:    'short',
    year:     'numeric',
    timeZone: 'Asia/Makassar',
  })
}

"""

def patch():
    if not os.path.exists(UTILS_PATH):
        print(f"❌ File tidak ditemukan: {UTILS_PATH}")
        return

    with open(UTILS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if "export function formatDate" in content:
        print("⚠️  formatDate sudah ada di utils.ts — tidak ada yang diubah.")
        return

    if ANCHOR not in content:
        print(f"❌ Anchor tidak ditemukan: '{ANCHOR}'")
        print("   Pastikan utils.ts berisi fungsi truncate.")
        return

    patched = content.replace(ANCHOR, NEW_FUNC + ANCHOR)

    with open(UTILS_PATH, "w", encoding="utf-8") as f:
        f.write(patched)

    print("=" * 50)
    print("  PATCH — formatDate → src/lib/utils.ts")
    print("=" * 50)
    print("  ✅ formatDate berhasil ditambahkan")
    print()
    print("  Posisi: tepat sebelum fungsi truncate")
    print("  Format: '15 Jul 2025' (WITA, id-ID)")
    print("=" * 50)

if __name__ == "__main__":
    patch()