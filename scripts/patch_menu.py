import os
import sys

def write_file(base: str, rel: str, content: str, check: str):
    path = os.path.join(base, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if check in v else 'GAGAL'}: {rel}")

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "../"
    base = os.path.abspath(base)
    print(f"Base dir: {base}\n")

    # ─────────────────────────────────────────────────────────────
    # Cari file nav config — coba beberapa lokasi umum
    # ─────────────────────────────────────────────────────────────
    candidates = [
        "src/config/nav.config.ts"
    ]

    nav_path = None
    for c in candidates:
        full = os.path.join(base, c)
        if os.path.exists(full):
            nav_path = c
            break

    if not nav_path:
        print("  GAGAL: file nav config tidak ditemukan di lokasi umum.")
        print("  Masukkan path relatif file nav config Anda (dari root project):")
        print("  Contoh: src/lib/nav.ts")
        print("  Lalu jalankan ulang script ini dengan argumen path:")
        print("  python patch_nav.py ../ src/lib/nav.ts")
        if len(sys.argv) > 2:
            nav_path = sys.argv[2]
        else:
            return

    print(f"  Ditemukan: {nav_path}")

    # ─────────────────────────────────────────────────────────────
    # Baca file existing
    # ─────────────────────────────────────────────────────────────
    full_nav_path = os.path.join(base, nav_path)
    with open(full_nav_path, "r", encoding="utf-8") as f:
        content = f.read()

    # ─────────────────────────────────────────────────────────────
    # PATCH 1 — Tambah import GraduationCap (ikon Pembelajaran)
    # Gunakan BookOpenCheck dari lucide jika ada, fallback ke GraduationCap
    # ─────────────────────────────────────────────────────────────
    print("\n=== PATCH 1: Tambah ikon baru di import lucide ===")

    old_import = "  LayoutDashboard, CalendarDays, BookOpen, ClipboardList,"
    new_import = "  LayoutDashboard, CalendarDays, BookOpen, ClipboardList, GraduationCap, School2,"

    if "GraduationCap" in content:
        print("  SKIP: GraduationCap sudah ada di import")
    elif old_import in content:
        content = content.replace(old_import, new_import)
        print("  OK: Tambah GraduationCap, School2 ke import lucide")
    else:
        # Fallback: cari baris import lucide apapun
        lines = content.split("\n")
        for i, line in enumerate(lines):
            if "from 'lucide-react'" in line or 'from "lucide-react"' in line:
                # Tambah ikon sebelum penutup import
                lines[i] = lines[i].replace(
                    "} from 'lucide-react'",
                    "  GraduationCap, School2,\n} from 'lucide-react'"
                ).replace(
                    '} from "lucide-react"',
                    '  GraduationCap, School2,\n} from "lucide-react"'
                )
                content = "\n".join(lines)
                print("  OK: Tambah ikon via fallback")
                break
        else:
            print("  GAGAL: Tidak bisa menemukan import lucide-react")

    # ─────────────────────────────────────────────────────────────
    # PATCH 2 — Tambah menu di grup Akademik
    # Sisipkan sebelum item Jadwal
    # ─────────────────────────────────────────────────────────────
    print("\n=== PATCH 2: Tambah menu Kelas Belajar & Pembelajaran ===")

    # Cek apakah sudah ada
    if "kelas-belajar" in content:
        print("  SKIP: Menu Kelas Belajar sudah ada")
    elif "pembelajaran" in content and "href: '/dashboard/pembelajaran'" in content:
        print("  SKIP: Menu Pembelajaran sudah ada")
    else:
        # Needle: item Jadwal yang sudah ada di grup Akademik
        needle_jadwal = """\
      {
        label: 'Jadwal',
        href: '/dashboard/jadwal',
        icon: CalendarDays,"""

        insert_before_jadwal = """\
      {
        label: 'Pembelajaran',
        href: '/dashboard/pembelajaran',
        icon: GraduationCap,
        roles: [
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU',
          'GURU', 'WALI_KELAS', 'SISWA', 'ORANG_TUA',
        ],
      },
      {
        label: 'Kelas Belajar',
        href: '/dashboard/kelas-belajar',
        icon: School2,
        roles: [
          'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA',
          'STAFF_TU', 'WALI_KELAS',
        ],
      },
"""

        if needle_jadwal in content:
            content = content.replace(needle_jadwal, insert_before_jadwal + needle_jadwal)
            print("  OK: Menu Pembelajaran & Kelas Belajar ditambahkan sebelum Jadwal")
        else:
            print("  GAGAL: Needle item Jadwal tidak ditemukan — cek manual")
            print("  Tambahkan manual di grup Akademik sebelum item Jadwal:")
            print(insert_before_jadwal)

    # ─────────────────────────────────────────────────────────────
    # Tulis file kembali
    # ─────────────────────────────────────────────────────────────
    with open(full_nav_path, "w", encoding="utf-8") as f:
        f.write(content)

    with open(full_nav_path, "r", encoding="utf-8") as v:
        verify = v.read()

    checks = {
        "kelas-belajar di nav": "kelas-belajar",
        "pembelajaran di nav":  "/dashboard/pembelajaran",
        "GraduationCap import": "GraduationCap",
    }
    print("\n=== Verifikasi ===")
    for label, needle in checks.items():
        print(f"  {'OK' if needle in verify else 'GAGAL'}: {label}")

    print(f"\nPatch nav selesai: {nav_path}")
    print("""
CATATAN:
  - Ikon GraduationCap & School2 dari lucide-react
  - Menu Pembelajaran muncul untuk semua role kecuali STAFF_KEUANGAN
  - Menu Kelas Belajar hanya untuk manajemen + WALI_KELAS
  - Sesuaikan roles jika ada perubahan kebijakan akses
""")

if __name__ == "__main__":
    main()