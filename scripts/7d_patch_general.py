import os, sys

base = sys.argv[1] if len(sys.argv) > 1 else "."
path = os.path.join(base, "src/app/dashboard/kelas/[id]/siswa/_components/SiswaDetailPanel.tsx")

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = (
    "              {profil?.fotoUrl\n"
    "                ? <img src={profil.fotoUrl} alt={namaLengkap} className=\"h-full w-full object-cover\" />\n"
    "                : <User className=\"h-8 w-8 text-gray-400\" />\n"
    "              }"
)
new = (
    "              {profil?.fotoUrl\n"
    "                ? <img src={getPublicFileUrl(profil.fotoUrl)} alt={namaLengkap} className=\"h-full w-full object-cover\" />\n"
    "                : <User className=\"h-8 w-8 text-gray-400\" />\n"
    "              }"
)

if old in content:
    content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("OK: fotoUrl pakai getPublicFileUrl")
else:
    print("GAGAL — cek apakah import getPublicFileUrl sudah ada:")
    print("getPublicFileUrl" in content)