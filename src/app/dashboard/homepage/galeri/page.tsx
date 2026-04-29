'use client'

import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, GalleryHorizontal, Upload, X, Loader2, ZoomIn } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import {
  useGaleriKategoriList,
  useGaleriKategoriDetail,
  useCreateGaleriKategori,
  useUpdateGaleriKategori,
  useDeleteGaleriKategori,
  useBulkCreateGaleriFoto,
  useDeleteGaleriFoto,
} from '@/hooks/homepage/useGaleri'
import { Button, Modal, ConfirmModal, Badge } from '@/components/ui'
import { FileUpload } from '@/components/ui/FileUpload'
import { uploadApi } from '@/lib/api/upload.api'
import { getPublicFileUrl } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/utils'
import type { KategoriGaleri, GaleriFoto, CreateKategoriGaleriDto } from '@/types/homepage.types'

const WRITE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'STAFF_TU'])

interface AlbumFormState {
  nama:     string
  deskripsi: string
  coverUrl: string
  urutan:   number
  isActive: boolean
}

const DEFAULT_ALBUM_FORM: AlbumFormState = {
  nama:     '',
  deskripsi: '',
  coverUrl: '',
  urutan:   0,
  isActive: true,
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={18} />
      </button>
      <img
        src={url}
        alt="Preview"
        className="max-w-full max-h-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GaleriPage() {
  const user     = useAuthStore((s) => s.user)
  const canWrite = user ? WRITE_ROLES.has(user.role) : false

  const { data: albums = [], isLoading: loadingAlbums } = useGaleriKategoriList(false)

  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const { data: albumDetail, isLoading: loadingDetail } = useGaleriKategoriDetail(selectedAlbumId)

  // Album modal
  const [albumModalOpen, setAlbumModalOpen] = useState(false)
  const [editAlbum,      setEditAlbum]      = useState<KategoriGaleri | null>(null)
  const [albumForm,      setAlbumForm]      = useState<AlbumFormState>(DEFAULT_ALBUM_FORM)
  const [albumError,     setAlbumError]     = useState<string | null>(null)

  // Delete album
  const [deleteAlbum, setDeleteAlbum] = useState<KategoriGaleri | null>(null)

  // Delete foto
  const [deleteFoto, setDeleteFoto] = useState<GaleriFoto | null>(null)

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Bulk upload state
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createAlbum  = useCreateGaleriKategori()
  const updateAlbum  = useUpdateGaleriKategori()
  const deleteAlbumM = useDeleteGaleriKategori()
  const bulkUpload   = useBulkCreateGaleriFoto()
  const deleteFotoM  = useDeleteGaleriFoto()

  // ── Album handlers ───────────────────────────────────────────
  const openCreateAlbum = () => {
    setEditAlbum(null)
    setAlbumForm({ ...DEFAULT_ALBUM_FORM, urutan: albums.length + 1 })
    setAlbumError(null)
    setAlbumModalOpen(true)
  }

  const openEditAlbum = (album: KategoriGaleri) => {
    setEditAlbum(album)
    setAlbumForm({
      nama:     album.nama,
      deskripsi: album.deskripsi ?? '',
      coverUrl: album.coverUrl ?? '',
      urutan:   album.urutan,
      isActive: album.isActive,
    })
    setAlbumError(null)
    setAlbumModalOpen(true)
  }

  const handleAlbumSubmit = async () => {
    if (!albumForm.nama.trim()) { setAlbumError('Nama album wajib diisi'); return }
    setAlbumError(null)
    try {
      const dto: CreateKategoriGaleriDto = {
        nama:     albumForm.nama.trim(),
        deskripsi: albumForm.deskripsi.trim() || null,
        coverUrl: albumForm.coverUrl || null,
        urutan:   albumForm.urutan,
        isActive: albumForm.isActive,
      }
      if (editAlbum) {
        await updateAlbum.mutateAsync({ id: editAlbum.id, dto })
      } else {
        const created = await createAlbum.mutateAsync(dto)
        setSelectedAlbumId(created.id)
      }
      setAlbumModalOpen(false)
    } catch (err) {
      setAlbumError(getErrorMessage(err))
    }
  }

  const handleDeleteAlbum = async () => {
    if (!deleteAlbum) return
    try {
      await deleteAlbumM.mutateAsync(deleteAlbum.id)
      if (selectedAlbumId === deleteAlbum.id) setSelectedAlbumId(null)
      setDeleteAlbum(null)
    } catch (err) {
      setAlbumError(getErrorMessage(err))
    }
  }

  // ── Bulk foto upload ─────────────────────────────────────────
  const handleBulkUpload = async (files: FileList) => {
    if (!selectedAlbumId) return
    setUploading(true)
    setUploadError(null)
    try {
      const uploaded = await Promise.all(
        Array.from(files).map((file) =>
          uploadApi.homepageGaleri(file).then((r) => ({
            kategoriId: selectedAlbumId,
            fotoUrl:    r.url,
            urutan:     0,
          })),
        ),
      )
      await bulkUpload.mutateAsync(uploaded)
    } catch (err) {
      setUploadError(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteFoto = async () => {
    if (!deleteFoto || !selectedAlbumId) return
    try {
      await deleteFotoM.mutateAsync({ fotoId: deleteFoto.id, kategoriId: selectedAlbumId })
      setDeleteFoto(null)
    } catch (err) {
      setUploadError(getErrorMessage(err))
    }
  }

  const selectedAlbum = albums.find((a) => a.id === selectedAlbumId)
  const fotos         = albumDetail?.foto ?? []
  const isSavingAlbum = createAlbum.isPending || updateAlbum.isPending

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[500px]">

      {/* ── Panel Kiri: Daftar Album ─────────────────────────── */}
      <div className="w-full lg:w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Album
          </p>
          {canWrite && (
            <button
              type="button"
              onClick={openCreateAlbum}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              title="Tambah Album"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {loadingAlbums ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-gray-400">Belum ada album</p>
            {canWrite && (
              <button
                type="button"
                onClick={openCreateAlbum}
                className="mt-2 text-xs text-emerald-600 hover:underline"
              >
                Buat album pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {albums.map((album) => (
              <div
                key={album.id}
                className={cn(
                  'group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-colors',
                  selectedAlbumId === album.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent',
                )}
                onClick={() => setSelectedAlbumId(album.id)}
              >
                {/* Cover mini */}
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                  {album.coverUrl ? (
                    <img
                      src={getPublicFileUrl(album.coverUrl)}
                      alt={album.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GalleryHorizontal size={14} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    selectedAlbumId === album.id
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-800 dark:text-gray-200',
                  )}>
                    {album.nama}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {album._count?.foto ?? 0} foto
                  </p>
                </div>

                {/* Album actions (hover) */}
                {canWrite && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openEditAlbum(album) }}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteAlbum(album) }}
                      className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="hidden lg:block w-px bg-gray-100 dark:bg-gray-800" />

      {/* ── Panel Kanan: Foto dalam Album ────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selectedAlbumId ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <GalleryHorizontal size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pilih album untuk melihat foto
            </p>
          </div>
        ) : (
          <>
            {/* Header panel kanan */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {selectedAlbum?.nama}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fotos.length} foto
                  {!selectedAlbum?.isActive && (
                    <span className="ml-2 text-amber-500">· Nonaktif</span>
                  )}
                </p>
              </div>

              {/* Upload button */}
              {canWrite && (
                <div className="flex items-center gap-2">
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Mengupload...' : 'Upload Foto'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleBulkUpload(e.target.files)}
                  />
                </div>
              )}
            </div>

            {/* Grid foto */}
            {loadingDetail ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : fotos.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                <Upload size={24} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Belum ada foto</p>
                {canWrite && (
                  <p className="text-xs text-gray-400 mt-1">
                    Klik "Upload Foto" atau drag & drop gambar
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {fotos.map((foto) => (
                  <div
                    key={foto.id}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
                    onClick={() => setLightboxUrl(getPublicFileUrl(foto.fotoUrl))}
                  >
                    <img
                      src={getPublicFileUrl(foto.fotoUrl)}
                      alt={foto.judul ?? ''}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Delete button */}
                    {canWrite && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteFoto(foto) }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal Album ──────────────────────────────────────── */}
      <Modal
        open={albumModalOpen}
        onClose={() => setAlbumModalOpen(false)}
        title={editAlbum ? 'Edit Album' : 'Buat Album Baru'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAlbumModalOpen(false)}>Batal</Button>
            <Button onClick={handleAlbumSubmit} loading={isSavingAlbum}>
              {editAlbum ? 'Simpan' : 'Buat Album'}
            </Button>
          </>
        }
      >
        <div className="px-6 py-5 space-y-4">
          {albumError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {albumError}
            </p>
          )}

          {/* Nama */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Album <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={albumForm.nama}
              onChange={(e) => setAlbumForm((f) => ({ ...f, nama: e.target.value }))}
              placeholder="Contoh: Kegiatan MPLS 2025"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Deskripsi <span className="text-xs text-gray-400">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={albumForm.deskripsi}
              onChange={(e) => setAlbumForm((f) => ({ ...f, deskripsi: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Cover */}
          <FileUpload
            label="Foto Cover"
            hint="JPG, PNG, WebP"
            accept=".jpg,.jpeg,.png,.webp"
            onUpload={(file) => uploadApi.homepageGaleri(file).then((r) => r.url)}
            onSuccess={(url) => setAlbumForm((f) => ({ ...f, coverUrl: url }))}
            currentKey={albumForm.coverUrl || null}
            compact
          />
          {albumForm.coverUrl && (
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img
                src={getPublicFileUrl(albumForm.coverUrl)}
                alt="cover"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* isActive */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif</p>
            <button
              type="button"
              onClick={() => setAlbumForm((f) => ({ ...f, isActive: !f.isActive }))}
              className={cn(
                'relative rounded-full transition-colors',
                albumForm.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600',
              )}
              style={{ height: '22px', width: '40px' }}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  albumForm.isActive ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete album */}
      <ConfirmModal
        open={!!deleteAlbum}
        onClose={() => setDeleteAlbum(null)}
        onConfirm={handleDeleteAlbum}
        title="Hapus Album"
        description={`Hapus album "${deleteAlbum?.nama}" beserta semua fotonya? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
        isLoading={deleteAlbumM.isPending}
      />

      {/* Confirm delete foto */}
      <ConfirmModal
        open={!!deleteFoto}
        onClose={() => setDeleteFoto(null)}
        onConfirm={handleDeleteFoto}
        title="Hapus Foto"
        description="Hapus foto ini dari album? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus"
        variant="danger"
        isLoading={deleteFotoM.isPending}
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
