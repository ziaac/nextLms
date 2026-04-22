import os, sys

base = sys.argv[1] if len(sys.argv) > 1 else "."
path = os.path.join(base, "src/app/dashboard/kelas/[id]/siswa/page.tsx")

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'onValueChange={setSearch}',
    'onChange={setSearch}'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

with open(path, "r", encoding="utf-8") as f:
    v = f.read()

print(f"WRITTEN: src/app/dashboard/kelas/[id]/siswa/page.tsx")
print(f"  {'OK' if 'onChange={setSearch}' in v else 'GAGAL'}: SearchInput onChange")
print(f"  {'OK' if 'onValueChange' not in v else 'GAGAL'}: no onValueChange")
print("Selesai.")