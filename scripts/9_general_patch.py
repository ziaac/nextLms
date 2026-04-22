#!/usr/bin/env python3
import os

path = os.path.join("src", "app", "dashboard", "jadwal", "wali-kelas", "page.tsx")
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Tambah isFetching ke destructuring hook
content = content.replace(
    "  const { data: kelasWaliRaw, isLoading: loadingWali } = useJadwalKelasWali(resolvedSemId || null)",
    "  const { data: kelasWaliRaw, isLoading: loadingWali, isFetching: fetchingWali } = useJadwalKelasWali(resolvedSemId || null)"
)

# Sembunyikan tab kelas wali saat sedang fetching (data lama jangan tampil)
content = content.replace(
    "  const kelasWaliList = resolvedSemId ? ((kelasWaliRaw as KelasWali[] | undefined) ?? []) : []",
    "  // Sembunyikan tab saat fetching agar data lama tidak tampil\n  const kelasWaliList = (resolvedSemId && !fetchingWali)\n    ? ((kelasWaliRaw as KelasWali[] | undefined) ?? [])\n    : []"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("  ✅ kelasWaliList hidden saat isFetching")
print("Refresh browser.\n")