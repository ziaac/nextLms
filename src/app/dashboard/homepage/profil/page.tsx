'use client'

import { useState, useEffect } from 'react'
import { Save, Building2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useProfil, useUpsertProfil } from '@/hooks/homepage/useProfil'
import { Button } from '@/components/ui'
import { FileUpload } from '@/components/ui/FileUpload'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { uploadApi } from '@/lib/api/upload.api'
import { getPublicFileUrl } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { UpsertProfilDto } from '@/types/homepage.types'

const WRITE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN'])

interface FormState {
  nama:        string
  visi:        string
  misi:        string
  sejarah:     string
  sambutan:    string
  namaKepala:  string
  fotoKepala:  string
  foto1Url:    string
  foto2Url:    string
  foto3Url:    string
  alamat:      string
  telepon:     string
  email:       string
  website:     string
  akreditasi:  string
}

const DEFAULT_FORM: FormState = {
  nama:        '',
  visi:        '',
  misi:        '',
  sejarah:     '',
  sambutan:    '',
  namaKepala:  '',
  fotoKepala:  '',
  foto1Url:    '',
  foto2Url:    '',
  foto3Url:    '',
  alamat:      '',
  telepon:     '',
  email:       '',
  website:     '',
  akreditasi:  '',
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  hint,
  children,
}: {
  label:    string
  required?: boolean
  hint?:    string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 text-xs font-normal text-gray-400">({hint})</span>}
      </label>
      {children}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
}: {
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
  disabled?:   boolean
  type?:       string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-60"
    />
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilPage() {
  const user     = useAuthStore((s) => s.user)
  const canWrite = user ? WRITE_ROLES.has(user.role) : false

  const { data: profil, isLoading } = useProfil()
  const upsert = useUpsertProfil()

  const [form,      setForm]      = useState<FormState>(DEFAULT_FORM)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState(false)
  const [isDirty,   setIsDirty]   = useState(false)

  // Sync data ke form saat loaded — gunakan profil.id sebagai dependency
  // agar tidak re-run setiap render (object reference baru dari React Query)
  const profilId = (profil as any)?.id
  useEffect(() => {
    if (!profil || !profilId) return
    setForm({
      nama:       (profil as any).nama        ?? '',
      visi:       (profil as any).visi        ?? '',
      misi:       (profil as any).misi        ?? '',
      sejarah:    (profil as any).sejarah     ?? '',
      sambutan:   (profil as any).sambutan    ?? '',
      namaKepala: (profil as any).namaKepala  ?? '',
      fotoKepala: (profil as any).fotoKepala  ?? '',
      foto1Url:   (profil as any).foto1Url    ?? '',
      foto2Url:   (profil as any).foto2Url    ?? '',
      foto3Url:   (profil as any).foto3Url    ?? '',
      alamat:     (profil as any).alamat      ?? '',
      telepon:    (profil as any).telepon     ?? '',
      email:      (profil as any).email       ?? '',
      website:    (profil as any).website     ?? '',
      akreditasi: (profil as any).akreditasi  ?? '',
    })
    setIsDirty(false)
  // Intentional: profil (query data) dikeluarkan dari deps — effect ini hanya
  // perlu sync form saat profilId berubah, bukan setiap kali data di-refetch.
  // Menambahkan profil akan menyebabkan form reset setiap background refetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilId])

  const set = (key: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setIsDirty(true)
    setSuccess(false)
  }

  const handleSave = async () => {
    if (!form.nama.trim())       { setError('Nama madrasah wajib diisi'); return }
    if (!form.visi.trim())       { setError('Visi wajib diisi'); return }
    if (!form.misi.trim())       { setError('Misi wajib diisi'); return }
    if (!form.namaKepala.trim()) { setError('Nama kepala madrasah wajib diisi'); return }
    if (!form.alamat.trim())     { setError('Alamat wajib diisi'); return }
    if (!form.telepon.trim())    { setError('Telepon wajib diisi'); return }
    if (!form.email.trim())      { setError('Email wajib diisi'); return }
    setError(null)

    try {
      const dto: UpsertProfilDto = {
        nama:        form.nama.trim(),
        visi:        form.visi,
        misi:        form.misi,
        sejarah:     form.sejarah  || null,
        sambutan:    form.sambutan || null,
        namaKepala:  form.namaKepala.trim(),
        fotoKepala:  form.fotoKepala  || null,
        foto1Url:    form.foto1Url    || null,
        foto2Url:    form.foto2Url    || null,
        foto3Url:    form.foto3Url    || null,
        alamat:      form.alamat.trim(),
        telepon:     form.telepon.trim(),
        email:       form.email.trim(),
        website:     form.website.trim()    || null,
        akreditasi:  form.akreditasi.trim() || null,
      }
      await upsert.mutateAsync(dto)
      setSuccess(true)
      setIsDirty(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Sticky save bar */}
      {canWrite && (
        <div className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-amber-500 dark:text-amber-400">
                Ada perubahan yang belum disimpan
              </span>
            )}
            {success && !isDirty && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                ✓ Tersimpan
              </span>
            )}
          </div>
          <Button
            size="sm"
            leftIcon={<Save size={14} />}
            onClick={handleSave}
            loading={upsert.isPending}
            disabled={!isDirty}
          >
            Simpan Perubahan
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      {/* ── Identitas Madrasah ─────────────────────────────── */}
      <Section title="Identitas Madrasah">
        <Field label="Nama Madrasah" required>
          <TextInput
            value={form.nama}
            onChange={set('nama')}
            placeholder="MAN 2 Kota Makassar"
            disabled={!canWrite}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Akreditasi" hint="opsional">
            <TextInput
              value={form.akreditasi}
              onChange={set('akreditasi')}
              placeholder="A"
              disabled={!canWrite}
            />
          </Field>
          <Field label="Website" hint="opsional">
            <TextInput
              value={form.website}
              onChange={set('website')}
              placeholder="https://man2kotamakassar.sch.id"
              disabled={!canWrite}
            />
          </Field>
        </div>

        <Field label="Alamat" required>
          <textarea
            rows={2}
            value={form.alamat}
            onChange={(e) => { set('alamat')(e.target.value) }}
            placeholder="Jl. ..."
            disabled={!canWrite}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none disabled:opacity-60"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Telepon" required>
            <TextInput
              value={form.telepon}
              onChange={set('telepon')}
              placeholder="0411-..."
              disabled={!canWrite}
            />
          </Field>
          <Field label="Email" required>
            <TextInput
              value={form.email}
              onChange={set('email')}
              placeholder="info@man2kotamakassar.sch.id"
              type="email"
              disabled={!canWrite}
            />
          </Field>
        </div>
      </Section>

      {/* ── Kepala Madrasah ────────────────────────────────── */}
      <Section title="Kepala Madrasah">
        <div className="flex gap-4 items-start">
          {/* Foto kepala */}
          <div className="shrink-0 space-y-2">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {form.fotoKepala ? (
                <img
                  src={getPublicFileUrl(form.fotoKepala)}
                  alt="Foto Kepala"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 size={24} className="text-gray-300" />
                </div>
              )}
            </div>
            {canWrite && (
              <FileUpload
                label="Foto"
                hint="JPG/PNG"
                accept=".jpg,.jpeg,.png,.webp"
                onUpload={(file) => uploadApi.homepageProfil(file).then((r) => r.url)}
                onSuccess={(url) => { set('fotoKepala')(url) }}
                currentKey={form.fotoKepala || null}
                compact
              />
            )}
          </div>

          <div className="flex-1 space-y-4">
            <Field label="Nama Kepala Madrasah" required>
              <TextInput
                value={form.namaKepala}
                onChange={set('namaKepala')}
                placeholder="Nama lengkap kepala madrasah"
                disabled={!canWrite}
              />
            </Field>
          </div>
        </div>

        {/* Sambutan */}
        <Field label="Sambutan Kepala" hint="opsional — tampil di halaman profil publik">
          <RichTextEditor
            value={form.sambutan}
            onChange={set('sambutan')}
            placeholder="Tulis sambutan kepala madrasah..."
            minHeight="160px"
            disabled={!canWrite}
          />
        </Field>
      </Section>

      {/* ── Visi & Misi ────────────────────────────────────── */}
      <Section title="Visi & Misi">
        <Field label="Visi" required>
          <RichTextEditor
            value={form.visi}
            onChange={set('visi')}
            placeholder="Visi madrasah..."
            minHeight="120px"
            disabled={!canWrite}
          />
        </Field>

        <Field label="Misi" required>
          <RichTextEditor
            value={form.misi}
            onChange={set('misi')}
            placeholder="Misi madrasah..."
            minHeight="160px"
            disabled={!canWrite}
          />
        </Field>
      </Section>

      {/* ── Sejarah ────────────────────────────────────────── */}
      <Section title="Sejarah Madrasah">
        <Field label="Sejarah" hint="opsional">
          <RichTextEditor
            value={form.sejarah}
            onChange={set('sejarah')}
            placeholder="Tulis sejarah singkat madrasah..."
            minHeight="200px"
            disabled={!canWrite}
          />
        </Field>
      </Section>

      {/* ── Foto Madrasah ──────────────────────────────────── */}
      <Section title="Foto Madrasah">
        <p className="text-xs text-gray-400 -mt-2">
          Foto-foto ini akan ditampilkan di halaman profil publik.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['foto1Url', 'foto2Url', 'foto3Url'] as const).map((key, i) => (
            <div key={key} className="space-y-2">
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {form[key] ? (
                  <img
                    src={getPublicFileUrl(form[key])}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Building2 size={20} />
                  </div>
                )}
              </div>
              {canWrite && (
                <FileUpload
                  label={`Foto ${i + 1}`}
                  hint="JPG/PNG/WebP"
                  accept=".jpg,.jpeg,.png,.webp"
                  onUpload={(file) => uploadApi.homepageFoto(file).then((r) => r.url)}
                  onSuccess={(url) => { set(key)(url) }}
                  currentKey={form[key] || null}
                  compact
                />
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
