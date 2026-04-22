"""
PATCH — Fix PageHeader children → actions prop
di src/app/dashboard/tahun-ajaran/page.tsx

Jalankan dari ROOT project:
    python scripts/patch_pageheader_actions.py
"""

import os

BASE      = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE_PATH = os.path.join(BASE, "src", "app", "dashboard", "tahun-ajaran", "page.tsx")

OLD = """\
        <PageHeader
          title="Tahun Ajaran & Semester"
          description="Kelola tahun ajaran dan semester aktif untuk seluruh kegiatan akademik."
        >
          <Button onClick={handleAdd}>
            <span className="flex items-center gap-1.5">
              <PlusIcon />
              Tambah Tahun Ajaran
            </span>
          </Button>
        </PageHeader>"""

NEW = """\
        <PageHeader
          title="Tahun Ajaran & Semester"
          description="Kelola tahun ajaran dan semester aktif untuk seluruh kegiatan akademik."
          actions={
            <Button onClick={handleAdd}>
              <span className="flex items-center gap-1.5">
                <PlusIcon />
                Tambah Tahun Ajaran
              </span>
            </Button>
          }
        />"""

def patch():
    if not os.path.exists(PAGE_PATH):
        print(f"❌ File tidak ditemukan: {PAGE_PATH}")
        return

    with open(PAGE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    if OLD not in content:
        print("⚠️  Sudah dipatch atau struktur berbeda — tidak ada yang diubah.")
        return

    patched = content.replace(OLD, NEW, 1)

    with open(PAGE_PATH, "w", encoding="utf-8") as f:
        f.write(patched)

    print("=" * 52)
    print("  PATCH — PageHeader children → actions prop")
    print("=" * 52)
    print("  ✅ page.tsx berhasil dipatch")
    print()
    print("  Sebelum: <PageHeader>children</PageHeader>")
    print("  Sesudah: <PageHeader actions={...} />")
    print("=" * 52)

if __name__ == "__main__":
    patch()