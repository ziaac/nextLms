import os, sys

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "../"
    base = os.path.abspath(base)
    path = os.path.join(base,
        "src/app/dashboard/pembelajaran/siswa/_components/mapel-card-siswa.tsx")

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    old = """\
      {/* Pengajar */}
      {koordinator && (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
            {koordinator.nama.charAt(0)}
          </div>
          <p className="text-xs text-gray-600 truncate">{koordinator.nama}</p>
          {mapel.timPengajar.length > 1 && (
            <span className="text-xs text-gray-400 shrink-0">
              +{mapel.timPengajar.length - 1}
            </span>
          )}
        </div>
      )}"""

    new = """\
      {/* Pengajar */}
      {mapel.timPengajar.length > 0 && (
        <div className="space-y-1">
          {mapel.timPengajar.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                p.isKoordinator
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {p.nama.charAt(0)}
              </div>
              <p className="text-xs text-gray-600 truncate">{p.nama}</p>
              {p.isKoordinator && (
                <span className="text-[10px] text-emerald-500 shrink-0">Koordinator</span>
              )}
            </div>
          ))}
        </div>
      )}"""

    if old in content:
        content = content.replace(old, new)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print("  OK: tampilan pengajar diubah ke baris terpisah")
    else:
        print("  GAGAL: needle tidak ditemukan — overwrite section pengajar")
        # Fallback overwrite jika patch gagal
        # Cari dan ganti bagian pengajar dengan regex sederhana
        import re
        new_section = """\
      {/* Pengajar */}
      {mapel.timPengajar.length > 0 && (
        <div className="space-y-1">
          {mapel.timPengajar.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <div className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                p.isKoordinator
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500',
              ].join(' ')}>
                {p.nama.charAt(0)}
              </div>
              <p className="text-xs text-gray-600 truncate">{p.nama}</p>
              {p.isKoordinator && (
                <span className="text-[10px] text-emerald-500 shrink-0">Koordinator</span>
              )}
            </div>
          ))}
        </div>
      )}"""
        # Coba ganti dengan pattern yang lebih fleksibel
        pattern = r'\{/\* Pengajar \*/\}.*?\}\)}'
        result = re.sub(pattern, new_section, content, flags=re.DOTALL, count=1)
        if result != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(result)
            print("  OK: patch via regex")
        else:
            print("  GAGAL: perlu edit manual")

    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if 'timPengajar.map' in v else 'GAGAL'}: verifikasi timPengajar.map")

if __name__ == "__main__":
    main()