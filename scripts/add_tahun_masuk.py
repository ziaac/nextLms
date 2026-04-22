"""
ADD tahunMasuk — field penting untuk identifikasi siswa
Integer, contoh: 2024 (tahun awal ajaran)

Backend:
  python scripts/add_tahun_masuk.py  (di project BACKEND)
  npx prisma migrate dev --name add_tahun_masuk
  npx prisma generate
  git add . && git commit -m "feat: tambah tahunMasuk di profile" && git push

Frontend:
  python scripts/add_tahun_masuk.py  (di project FRONTEND)
  npm run dev
"""

import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Deteksi apakah ini project backend atau frontend
IS_BACKEND = os.path.exists(os.path.join(BASE, "prisma", "schema.prisma"))

files_backend = {}
files_frontend = {}

# ============================================================
# BACKEND
# ============================================================

# prisma/schema.prisma — tambah field tahunMasuk ke model Profile
# Edit manual: cari baris "berat Int? @db.SmallInt"
# Tambahkan setelah baris tersebut:
PRISMA_FIELD = """
  // ── Tahun Masuk ───────────────────────────────────────────
  tahunMasuk           Int?              @map("tahun_masuk") @db.SmallInt
"""

files_backend["src/modules/users/dto/create-user.dto.ts"] = None  # patch only
files_backend["src/modules/users/dto/update-user.dto.ts"] = None  # patch only

# Patch create-user.dto.ts — tambah field tahunMasuk
CREATE_DTO_ADDITION = """\
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  tahunMasuk?: number;
"""

# ============================================================
# FRONTEND
# ============================================================

files_frontend["src/types/users.types.ts"] = None  # patch only

# ============================================================
# SCRIPT LOGIC
# ============================================================

def patch_file(filepath, search_str, insert_after):
    """Insert text after a specific string in a file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if insert_after in content:
        print(f"  ⚠️  Sudah ada, skip: {filepath}")
        return False
    if search_str not in content:
        print(f"  ❌ Marker tidak ditemukan di: {filepath}")
        return False
    content = content.replace(search_str, search_str + insert_after)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  ✅ {filepath}")
    return True

def run_backend():
    print("🔧 Mode: BACKEND\n")

    # 1. prisma/schema.prisma
    schema_path = os.path.join(BASE, "prisma", "schema.prisma")
    patch_file(
        schema_path,
        "  berat                Int?              @db.SmallInt",
        "\n  tahunMasuk           Int?              @map(\"tahun_masuk\") @db.SmallInt"
    )

    # 2. create-user.dto.ts
    create_dto = os.path.join(BASE, "src/modules/users/dto/create-user.dto.ts".replace("/", os.sep))
    patch_file(
        create_dto,
        "  @IsOptional()\n  @IsString()\n  aktaKey?: string;",
        "\n  @IsOptional()\n  @IsInt()\n  @Min(2000)\n  @Max(2100)\n  tahunMasuk?: number;\n"
    )

    # 3. update-user.dto.ts
    update_dto = os.path.join(BASE, "src/modules/users/dto/update-user.dto.ts".replace("/", os.sep))
    patch_file(
        update_dto,
        "  @IsOptional()\n  @IsString()\n  aktaKey?: string;",
        "\n  @IsOptional()\n  @IsInt()\n  @Min(2000)\n  @Max(2100)\n  tahunMasuk?: number;\n"
    )

    # 4. users.service.ts — patch create() dan update()
    service_path = os.path.join(BASE, "src/modules/users/users.service.ts".replace("/", os.sep))

    # Patch create()
    patch_file(
        service_path,
        "            aktaKey: dto.aktaKey,\n            kkKey:   dto.kkKey,\n            kipKey:  dto.kipKey,",
        "\n            tahunMasuk: dto.tahunMasuk,"
    )

    # Patch update() — ada 2 occurrence aktaKey, cari yang di update()
    with open(service_path, 'r', encoding='utf-8') as f:
        content = f.read()

    update_marker = "            aktaKey: dto.aktaKey,\n            kkKey:   dto.kkKey,\n            kipKey:  dto.kipKey,\n            tahunMasuk: dto.tahunMasuk,"
    if "tahunMasuk: dto.tahunMasuk" not in content:
        # Patch kedua occurrence (di update())
        count = content.count("aktaKey: dto.aktaKey,\n            kkKey:   dto.kkKey,\n            kipKey:  dto.kipKey,")
        if count >= 2:
            # Replace semua — sudah ditambahkan di create, update belum
            content = content.replace(
                "            aktaKey: dto.aktaKey,\n            kkKey:   dto.kkKey,\n            kipKey:  dto.kipKey,",
                "            aktaKey: dto.aktaKey,\n            kkKey:   dto.kkKey,\n            kipKey:  dto.kipKey,\n            tahunMasuk: dto.tahunMasuk,"
            )
            with open(service_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ users.service.ts (update method)")

    print("""
✅ Backend selesai!

Jalankan:
  npx prisma migrate dev --name add_tahun_masuk
  npx prisma generate
  git add .
  git commit -m "feat: tambah tahunMasuk di profile siswa"
  git push
""")

def run_frontend():
    print("🔧 Mode: FRONTEND\n")

    # 1. src/types/users.types.ts
    types_path = os.path.join(BASE, "src/types/users.types.ts".replace("/", os.sep))
    patch_file(
        types_path,
        "  kipKey: string | null",
        "\n  tahunMasuk: number | null"
    )

    # 2. src/app/dashboard/users/_components/UserFormModal.tsx
    modal_path = os.path.join(
        BASE,
        "src/app/dashboard/users/_components/UserFormModal.tsx".replace("/", os.sep)
    )

    # Tambah ke schema
    patch_file(
        modal_path,
        "  kipKey:  z.string().optional(),\n})",
        "\n  tahunMasuk: z.string().optional(),\n})"
    )

    # Tambah ke form reset (edit mode) — setelah kipKey
    patch_file(
        modal_path,
        "        aktaKey: p.aktaKey ?? '', kkKey: p.kkKey ?? '', kipKey: p.kipKey ?? '',",
        "\n        tahunMasuk: p.tahunMasuk?.toString() ?? '',"
    )

    # Tambah field di UI — setelah section Nomor Identitas, di dalam grid
    patch_file(
        modal_path,
        "              <Input label=\"NUPTK\" placeholder=\"16 digit\" {...r('nuptk')} />",
        "\n              <Input label=\"Tahun Masuk\" type=\"number\" placeholder=\"2024\" {...r('tahunMasuk')} />"
    )

    # Tambah ke buildPayload conversion
    patch_file(
        modal_path,
        "  if (payload.jarakKeSekolah) payload.jarakKeSekolah = parseFloat(payload.jarakKeSekolah as string)",
        "\n  if (payload.tahunMasuk) payload.tahunMasuk = parseInt(payload.tahunMasuk as string)"
    )

    print("""
✅ Frontend selesai!

npm run dev → cek field Tahun Masuk di section Nomor Identitas
""")

# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("🚀 Add tahunMasuk\n")
    print(f"📁 Base: {BASE}")
    print(f"🔍 Detected: {'BACKEND' if IS_BACKEND else 'FRONTEND'}\n")

    if IS_BACKEND:
        run_backend()
    else:
        run_frontend()