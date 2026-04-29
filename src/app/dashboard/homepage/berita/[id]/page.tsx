'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import {
  useBeritaDetail,
  useCreateBerita,
  useUpdateBerita,
  useKategoriBerita,
  useCreateKategoriBerita,
} from '@/hooks/homepage/useBerita'
import { Button, Badge } from '@/components/ui'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { FileUpload } from '@/components/ui/FileUpload'
import { uploadApi } from '@/lib/api/upload.api'
import { getPublicFileUrl } from '@/lib/constants'
import { getErrorMessage } from '@/lib/utils'
import type { CreateBeritaDto, StatusBerita } from '@/types/homepage.types'

const WRITE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'])

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface FormState {
  judul:       string
  slug:        string
  konten:      string
  excerpt:     string
  kategoriId:  string
  fotoUrl:     string
  status:      StatusBerita
  publishedAt: string
}

const DEFAULT_FORM: FormState = {
  judul:       '',
  slug:        '',
  konten:      '',
  excerpt:     '',
  kategoriId:  '',
  fotoUrl:     '',
  status:      'DRAFT',
  publishedAt: '',
}

export default function BeritaFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const isNew  = id === 'baru'

  const router   = useRouter()
  const user     = useAuthStore((s) => s.user)
  const canWrite = user ? WRITE_ROLES.has(user.role) : false

  const { data: existing, isLoading } = useBeritaDetail(isNew ? null : id)
  const { data: kategoriList = [] }   = useKategoriBerita()

  const createBerita        = useCreateBerita()
  const updateBerita        = useUpdateBerita()
  const createKategori      = useCreateKategoriBerita()

  const [form,          setForm]          = useState<FormState>(DEFAULT_FORM)
  const [slugManual,    setSlugManual]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [newKatNama,    setNewKatNama]    = useState('')
  const [showNewKat,    setShowNewKat]    = useState(false)

  // Sync existing data
  useEffect(() => {
    if (!existing) return
    setForm({
      judul:       existing.judul,
      slug:        existing.slug,
      konten:      existing.konten,
      excerpt:     existing.excerpt ?? '',
      kategoriId:  existing.kategoriId ?? '',
      fotoUrl:     existing.fotoUrl ?? '',
      status:      existing.status,
      publishedAt: existing.publishedAt
        ? new Date(existing.publishedAt).toISOString().slice(0, 10)
        : '',
    })
    setSlugManual(true) // existing slug jangan auto-overwrite
  }, [existing])

  // Auto-generate slug dari judul (hanya saat baru dan belum manual)
  useEffect(() => {
    if (!isNew || slugManual) return
    setForm((f) => ({ ...f, slug: slugify(f.judul) }))
  }, [form.judul, isNew, slugManual])

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async (targetStatus?: StatusBerita) => {
    if (!form.judul.trim())  { setError('Judul wajib diisi'); return }
    if (!form.slug.trim())   { setError('Slug wajib diisi'); return }
    if (!form.konten.trim()) { setError('Konten wajib diisi'); return }
    setError(null)

    const status = targetStatus ?? form.status

    try {
      const dto: CreateBeritaDto = {
        judul:       form.judul.trim(),
        slug:        form.slug.trim(),
        konten:      form.konten,
        excerpt:     form.excerpt.trim() || null,
        kategoriId:  form.kategoriId || null,
        fotoUrl:     form.fotoUrl || null,
        status,
        publishedAt: status === 'PUBLISHED' && form.publishedAt
          ? form.publishedAt
          : null,
      }

      if (isNew) {
        const created = await createBerita.mutateAsync(dto)
        router.replace(`/dashboard/homepage/berita/${created.id}`)
      } else {
        await updateBerita.mutateAsync({ id, dto })
        setForm((f) => ({ ...f, status }))
      }
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleAddKategori = async () => {
    if (!newKatNama.trim()) return
    try {
      const created = await createKategori.mutateAsync({
        nama: newKatNama.trim(),
        slug: slugify(newKatNama.trim()),
      })
      setForm((f) => ({ ...f, kategoriId: created.id }))
      setNewKatNama('')
      setShowNewKat(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const isSaving = createBerita.isPending || updateBerita.isPending

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => router.push('/dashboard/homepage/berita')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={15} />
          Kembali ke Daftar
        </button>

        <div className="flex items-center gap-2">
          <Badge variant={form.status === 'PUBLISHED' ? 'success' : 'warning'} size="sm">
            {form.status === 'PUBLISHED' ? 'Published' : 'Draft'}
          </Badge>

          {canWrite && (
            <>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Save size={13} />}
                onClick={() => handleSave('DRAFT')}
                loading={isSaving && form.status === 'DRAFT'}
              >
                Simpan Draft
              </Button>
              <Button
                size="sm"
                leftIcon={<Send size={13} />}
                onClick={() => handleSave('PUBLISHED')}
                loading={isSaving && form.status === 'PUBLISHED'}
              >
                {form.status === 'PUBLISHED' ? 'Update' : 'Publish'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      {/* Judul */}
      <div>
        <input
          type="text"
          value={form.judul}
          onChange={(e) => set('judul')(e.target.value)}
          placeholder="Judul berita..."
          disabled={!canWrite}
          className="w-full px-0 py-2 text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-0 border-b-2 border-gray-100 dark:border-gray-800 focus:outline-none focus:border-emerald-400 transition-colors placeholder-gray-300 dark:placeholder-gray-600 disabled:opacity-60"
        />
      </div>

      {/* Slug */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 shrink-0">Slug:</span>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => { setSlugManual(true); set('slug')(e.target.value) }}
          disabled={!canWrite}
          className="flex-1 px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-60"
        />
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Kategori */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Kategori
          </label>
          {showNewKat ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newKatNama}
                onChange={(e) => setNewKatNama(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddKategori() }}
                placeholder="Nama kategori baru"
                autoFocus
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <Button size="sm" onClick={handleAddKategori} loading={createKategori.isPending}>
                OK
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewKat(false)}>
                ✕
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.kategoriId}
                onChange={(e) => set('kategoriId')(e.target.value)}
                disabled={!canWrite}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-60"
              >
                <option value="">Tanpa kategori</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => setShowNewKat(true)}
                  className="px-2 py-1 text-xs text-emerald-600 hover:underline shrink-0"
                >
                  + Baru
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tanggal publish */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tanggal Publish
          </label>
          <input
            type="date"
            value={form.publishedAt}
            onChange={(e) => set('publishedAt')(e.target.value)}
            disabled={!canWrite}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all disabled:opacity-60"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ringkasan <span className="text-xs text-gray-400">(opsional, maks 500 karakter)</span>
        </label>
        <textarea
          rows={2}
          maxLength={500}
          value={form.excerpt}
          onChange={(e) => set('excerpt')(e.target.value)}
          placeholder="Ringkasan singkat berita yang tampil di daftar..."
          disabled={!canWrite}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none disabled:opacity-60"
        />
        <p className="text-xs text-gray-400 text-right">{form.excerpt.length}/500</p>
      </div>

      {/* Foto utama */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Foto Utama <span className="text-xs text-gray-400">(opsional)</span>
        </label>
        {canWrite && (
          <FileUpload
            label=""
            hint="JPG, PNG, WebP — rekomendasi 1200×630px"
            accept=".jpg,.jpeg,.png,.webp"
            onUpload={(file) => uploadApi.homepageBerita(file).then((r) => r.url)}
            onSuccess={(url) => set('fotoUrl')(url)}
            currentKey={form.fotoUrl || null}
            compact
          />
        )}
        {form.fotoUrl && (
          <div className="w-full max-w-lg h-40 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={getPublicFileUrl(form.fotoUrl)}
              alt="Foto utama"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Konten */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Konten <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={form.konten}
          onChange={set('konten')}
          placeholder="Tulis konten berita di sini..."
          minHeight="400px"
          disabled={!canWrite}
        />
      </div>
    </div>
  )
}
