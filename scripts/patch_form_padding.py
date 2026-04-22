"""
PATCH — Fix padding form & ErrorBox style
di TahunAjaranFormModal.tsx dan SemesterFormModal.tsx

Sesuaikan dengan pola UserFormModal:
  - form body pakai <div className="p-6 space-y-6">
  - ErrorBox pakai rounded-xl + warna yang konsisten

Jalankan dari ROOT project:
    python scripts/patch_form_padding.py
"""

import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TARGETS = {
    "TahunAjaranFormModal": os.path.join(
        BASE, "src", "app", "dashboard", "tahun-ajaran",
        "_components", "TahunAjaranFormModal.tsx"
    ),
    "SemesterFormModal": os.path.join(
        BASE, "src", "app", "dashboard", "tahun-ajaran",
        "_components", "SemesterFormModal.tsx"
    ),
}

# ── Patch TahunAjaranFormModal ────────────────────────────────

TA_OLD_FORM = '''\
      <form id="ta-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div ref={formTopRef} />
        {submitError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}

        {/* Nama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Tahun Ajaran
          </label>
          <Input
            {...register('nama')}
            placeholder="Contoh: 2025/2026"
            error={errors.nama?.message}
          />
          {!isEdit && tanggalMulai && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Auto-generate dari tanggal mulai · bisa diubah manual
            </p>
          )}
        </div>

        {/* Tanggal Mulai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Mulai
          </label>
          <Input
            type="date"
            {...register('tanggalMulai')}
            error={errors.tanggalMulai?.message}
          />
        </div>

        {/* Tanggal Selesai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Selesai
          </label>
          <Input
            type="date"
            {...register('tanggalSelesai')}
            error={errors.tanggalSelesai?.message}
          />
        </div>

        {/* isActive — hanya create */}
        {!isEdit && (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="ta-isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="ta-isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Langsung aktifkan tahun ajaran ini
            </label>
          </div>
        )}
      </form>'''

TA_NEW_FORM = '''\
      <form id="ta-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          {/* Nama */}
          <div>
            <Input
              label="Nama Tahun Ajaran"
              {...register('nama')}
              placeholder="Contoh: 2025/2026"
              error={errors.nama?.message}
            />
            {!isEdit && tanggalMulai && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Auto-generate dari tanggal mulai · bisa diubah manual
              </p>
            )}
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              {...register('tanggalMulai')}
              error={errors.tanggalMulai?.message}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              {...register('tanggalSelesai')}
              error={errors.tanggalSelesai?.message}
            />
          </div>

          {/* isActive — hanya create */}
          {!isEdit && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ta-isActive"
                {...register('isActive')}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <label htmlFor="ta-isActive" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Langsung aktifkan tahun ajaran ini
              </label>
            </div>
          )}
        </div>
      </form>'''

# ── Patch SemesterFormModal ───────────────────────────────────

SEM_OLD_FORM = '''\
      <form id="sem-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div ref={formTopRef} />
        {submitError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {submitError}
          </div>
        )}

        {/* Nama Semester */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nama Semester
          </label>
          <Select
            options={NAMA_OPTIONS}
            value={watch('nama')}
            placeholder="Pilih semester"
            {...register('nama')}
            error={errors.nama?.message}
          />
          {namaValue && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Urutan otomatis: {urutan}
            </p>
          )}
        </div>

        {/* Tanggal Mulai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Mulai
          </label>
          <Input
            type="date"
            {...register('tanggalMulai')}
            error={errors.tanggalMulai?.message}
          />
        </div>

        {/* Tanggal Selesai */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Selesai
          </label>
          <Input
            type="date"
            {...register('tanggalSelesai')}
            error={errors.tanggalSelesai?.message}
          />
        </div>

        {/* isActive — hanya create */}
        {!isEdit && (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="sem-isActive"
              {...register('isActive')}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="sem-isActive" className="text-sm text-gray-700 dark:text-gray-300">
              Langsung aktifkan semester ini
            </label>
          </div>
        )}
      </form>'''

SEM_NEW_FORM = '''\
      <form id="sem-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="p-6 space-y-5">
          <div ref={formTopRef} />
          {submitError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          {/* Nama Semester */}
          <div>
            <Select
              label="Nama Semester"
              options={NAMA_OPTIONS}
              value={watch('nama')}
              placeholder="Pilih semester"
              {...register('nama')}
              error={errors.nama?.message}
            />
            {namaValue && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Urutan otomatis: {urutan}
              </p>
            )}
          </div>

          {/* Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tanggal Mulai"
              type="date"
              {...register('tanggalMulai')}
              error={errors.tanggalMulai?.message}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              {...register('tanggalSelesai')}
              error={errors.tanggalSelesai?.message}
            />
          </div>

          {/* isActive — hanya create */}
          {!isEdit && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sem-isActive"
                {...register('isActive')}
                className="w-4 h-4 rounded accent-emerald-600"
              />
              <label htmlFor="sem-isActive" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Langsung aktifkan semester ini
              </label>
            </div>
          )}
        </div>
      </form>'''


# ── Runner ────────────────────────────────────────────────────

def patch_file(name: str, path: str, old: str, new: str) -> bool:
    if not os.path.exists(path):
        print(f"  ❌ [{name}] File tidak ditemukan: {path}")
        return False

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    if old not in content:
        print(f"  ⚠️  [{name}] Sudah dipatch atau struktur berbeda — skip.")
        return False

    patched = content.replace(old, new, 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(patched)

    print(f"  ✅ [{name}] Berhasil dipatch")
    return True


def main():
    print("\n" + "=" * 56)
    print("  PATCH — Fix padding & ErrorBox style form modal")
    print("=" * 56)

    patch_file("TahunAjaranFormModal", TARGETS["TahunAjaranFormModal"], TA_OLD_FORM, TA_NEW_FORM)
    patch_file("SemesterFormModal",    TARGETS["SemesterFormModal"],    SEM_OLD_FORM, SEM_NEW_FORM)

    print("=" * 56)
    print()
    print("  Perubahan:")
    print("  • form body → <div className=\"p-6 space-y-5\">")
    print("  • label dipindah ke prop Input/Select (bukan div terpisah)")
    print("  • Tanggal Mulai & Selesai → grid 2 kolom")
    print("  • ErrorBox → rounded-xl, warna konsisten dgn UserFormModal")
    print("  • checkbox → accent-emerald-600 (konsisten)")
    print()


if __name__ == "__main__":
    main()