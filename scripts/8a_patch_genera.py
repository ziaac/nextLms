import os, sys

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else "../"
    base = os.path.abspath(base)
    path = os.path.join(base,
        "src/app/dashboard/pembelajaran/siswa/_components/mapel-slideover-siswa.tsx")

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Tambah import Clock dan formatJam
    old_import = "import {\n  BookOpen, ClipboardList, BarChart2, CalendarDays,\n  Users, AlertCircle, CheckCircle2, XCircle,\n} from 'lucide-react'"
    new_import  = "import {\n  BookOpen, ClipboardList, BarChart2, CalendarDays,\n  Users, AlertCircle, CheckCircle2, XCircle, Clock,\n} from 'lucide-react'\nimport { formatHariJam, formatJam } from '@/lib/helpers/timezone'"

    if old_import in content:
        content = content.replace(old_import, new_import)
        print("  OK: tambah import Clock + formatHariJam")
    else:
        # fallback
        if "Clock" not in content:
            content = content.replace(
                "} from 'lucide-react'",
                "  Clock,\n} from 'lucide-react'",
            )
        if "formatJam" not in content:
            content = content.replace(
                "import { SlideOver",
                "import { formatHariJam, formatJam } from '@/lib/helpers/timezone'\nimport { SlideOver",
            )
        print("  OK: tambah import (fallback)")

    # 2. Tambah section jadwal setelah badge info, sebelum Pengajar
    old_pengajar = """\
        {/* Pengajar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengajar</p>"""

    new_jadwal_pengajar = """\
        {/* Jadwal */}
        {mapel.jadwal && mapel.jadwal.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Jadwal</p>
            {mapel.jadwal.map((j, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{formatHariJam(j.hari, j.jamMulai)}</span>
                <span className="text-gray-400">–</span>
                <span>{formatJam(j.jamSelesai)}</span>
                {j.ruangan && (
                  <span className="text-gray-400">· {typeof j.ruangan === 'string' ? j.ruangan : j.ruangan.nama}</span>
                )}
              </div>
            ))}
          </div>
        )}
        {(!mapel.jadwal || mapel.jadwal.length === 0) && (
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-amber-500 italic">Jadwal belum ditentukan</span>
          </div>
        )}

        {/* Pengajar */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pengajar</p>"""

    if old_pengajar in content:
        content = content.replace(old_pengajar, new_jadwal_pengajar)
        print("  OK: tambah section jadwal di slideover siswa")
    else:
        print("  GAGAL: needle Pengajar tidak ditemukan")

    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

    with open(path, "r", encoding="utf-8") as f:
        v = f.read()
    print(f"  {'OK' if 'formatHariJam' in v and 'jadwal' in v else 'GAGAL'}: verifikasi")

if __name__ == "__main__":
    main()