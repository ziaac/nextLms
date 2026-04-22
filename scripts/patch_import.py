import os

targets = [
    "src/lib/api/kelas.api.ts",
    "src/lib/api/kelas-siswa.api.ts",
]

for path in targets:
    if not os.path.exists(path):
        print(f"SKIP (tidak ditemukan): {path}")
        continue
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(
        'import { axiosInstance } from "@/lib/axios";',
        'import api from "@/lib/axios";'
    ).replace("axiosInstance", "api")
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"PATCHED: {path}")

print("\nSelesai.")