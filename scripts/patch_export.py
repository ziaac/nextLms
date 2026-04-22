import os, sys

base = sys.argv[1] if len(sys.argv) > 1 else "."

# Semua file yang pakai Modal/ConfirmModal/SlideOver dengan isOpen
targets = [
    "src/app/dashboard/kelas/page.tsx",
    "src/app/dashboard/kelas/_components/KelasFormModal.tsx",
    "src/app/dashboard/kelas/_components/KelasFormBulkModal.tsx",
    "src/app/dashboard/kelas/[id]/siswa/_components/TambahSiswaModal.tsx",
    "src/app/dashboard/kelas/[id]/siswa/_components/TambahSiswaBulkModal.tsx",
    "src/app/dashboard/kelas/[id]/siswa/_components/CopySiswaModal.tsx",
    "src/app/dashboard/kelas/[id]/siswa/_components/MutasiSiswaModal.tsx",
]

# Cek juga SlideOver
slideover_targets = [
    "src/app/dashboard/kelas/_components/KelasDetailPanel.tsx",
    "src/app/dashboard/kelas/[id]/siswa/_components/SiswaDetailPanel.tsx",
]

for rel_path in targets:
    full_path = os.path.join(base, rel_path)
    if not os.path.exists(full_path):
        print(f"SKIP: {rel_path}")
        continue
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Fix isOpen -> open pada prop Modal
    content = content.replace(
        '<Modal\n          isOpen={isOpen}',
        '<Modal\n          open={isOpen}'
    ).replace(
        '<Modal isOpen={isOpen}',
        '<Modal open={isOpen}'
    ).replace(
        '<Modal\n            isOpen={isOpen}',
        '<Modal\n            open={isOpen}'
    ).replace(
        '<Modal\n          isOpen={!!',
        '<Modal\n          open={!!'
    ).replace(
        '<Modal isOpen={!!',
        '<Modal open={!!'
    )

    # Fix children wrapping — tambah px-6 py-4 wrapper jika belum ada
    # Ganti pola: <form ... className="flex flex-col gap-4">
    # children dalam Modal tidak ada padding, perlu dibungkus

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"PATCHED: {rel_path}")

# SlideOver — cek prop dulu, skip jika sudah benar
for rel_path in slideover_targets:
    full_path = os.path.join(base, rel_path)
    if not os.path.exists(full_path):
        print(f"SKIP: {rel_path}")
        continue
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(
        '<SlideOver\n          isOpen={isOpen}',
        '<SlideOver\n          open={isOpen}'
    ).replace(
        '<SlideOver isOpen={isOpen}',
        '<SlideOver open={isOpen}'
    ).replace(
        '<SlideOver\n          isOpen={!!',
        '<SlideOver\n          open={!!'
    ).replace(
        '<SlideOver isOpen={!!',
        '<SlideOver open={!!'
    )
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"PATCHED: {rel_path}")

print("\nSelesai.")