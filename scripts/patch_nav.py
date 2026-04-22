"""
PATCH — Update nav.config.ts untuk FASE 7B & 7C:
  1. Fix href 'Mata Pelajaran': /dashboard/mata-pelajaran-tingkat
     → /dashboard/mata-pelajaran
  2. Tambah entry 'Tingkat Kelas' di group Manajemen

Jalankan dari ROOT project:
    python scripts/patch_nav_config.py
"""

import os

BASE     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAV_PATH = os.path.join(BASE, "src", "config", "nav.config.ts")

# ── Fix 1: href mata pelajaran ────────────────────────────────
OLD_MAPEL = """\
      {
        label: 'Mata Pelajaran',
        href: '/dashboard/mata-pelajaran-tingkat',
        icon: BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },"""

NEW_MAPEL = """\
      {
        label: 'Tingkat Kelas',
        href: '/dashboard/tingkat-kelas',
        icon: Layers,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },
      {
        label: 'Mata Pelajaran',
        href: '/dashboard/mata-pelajaran',
        icon: BookOpen,
        roles: ['ADMIN', 'SUPER_ADMIN'],
      },"""


def patch():
    if not os.path.exists(NAV_PATH):
        print(f"❌ File tidak ditemukan: {NAV_PATH}")
        return

    with open(NAV_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if OLD_MAPEL not in content:
        print("⚠️  Anchor tidak ditemukan — mungkin sudah dipatch atau struktur berbeda.")
        return

    patched = content.replace(OLD_MAPEL, NEW_MAPEL, 1)

    with open(NAV_PATH, "w", encoding="utf-8") as f:
        f.write(patched)

    print("=" * 54)
    print("  PATCH — nav.config.ts")
    print("=" * 54)
    print("  ✅ Berhasil diupdate")
    print()
    print("  Perubahan di group Manajemen:")
    print("  + Tambah: Tingkat Kelas → /dashboard/tingkat-kelas")
    print("  ~ Fix:    Mata Pelajaran → /dashboard/mata-pelajaran")
    print("=" * 54)


if __name__ == "__main__":
    patch()