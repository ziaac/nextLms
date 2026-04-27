'use client'

import React, { useRef } from 'react'
import { Plus, Trash2, FileImage, FileText, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorksheetBuilderStore } from '@/stores/worksheet-builder.store'
import { uploadWorksheetImage, uploadWorksheetPdf } from '@/lib/api/worksheet.api'
import { toast } from 'sonner'

interface Props {
  onUploading?: (loading: boolean) => void
}

export function PageNavigator({ onUploading }: Props) {
  const { halaman, halamanAktifIndex, addHalaman, removeHalaman, setHalamanAktif } =
    useWorksheetBuilderStore()

  const imgInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = React.useState(false)

  const setLoad = (v: boolean) => { setLoading(v); onUploading?.(v) }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setLoad(true)
    try {
      for (const file of files) {
        const objectUrl = URL.createObjectURL(file)
        const { key } = await uploadWorksheetImage(file)
        addHalaman(key, objectUrl)
      }
      toast.success(`${files.length} halaman ditambahkan`)
    } catch {
      toast.error('Gagal upload gambar')
    } finally {
      setLoad(false)
      e.target.value = ''
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoad(true)
    const toastId = toast.loading('Mengkonversi PDF ke gambar…')
    try {
      const result = await uploadWorksheetPdf(file)
      // Gunakan object URL sementara dari re-fetch presigned nanti
      // Untuk preview builder, kita minta presigned URL per key
      for (const p of result.pages) {
        // Buat placeholder imageUrl (akan di-resolve saat definisi dimuat dari server)
        addHalaman(p.key, '')
      }
      toast.success(`${result.pages.length} halaman dari PDF berhasil ditambahkan`, { id: toastId })
    } catch {
      toast.error('Gagal konversi PDF', { id: toastId })
    } finally {
      setLoad(false)
      e.target.value = ''
    }
  }

  return (
    <div className="w-36 flex-shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
      {/* Page thumbnails */}
      {halaman.map((h, i) => (
        <div
          key={h.id}
          role="button"
          tabIndex={0}
          onClick={() => setHalamanAktif(i)}
          onKeyDown={(e) => e.key === 'Enter' && setHalamanAktif(i)}
          className={cn(
            'relative group rounded-xl overflow-hidden border-2 transition-all duration-150 cursor-pointer',
            'aspect-[3/4] flex-shrink-0',
            halamanAktifIndex === i
              ? 'border-blue-500 shadow-md shadow-blue-500/20 ring-2 ring-blue-400/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700',
          )}
        >
          {h.imageUrl
            ? <img src={h.imageUrl} alt={`Halaman ${i + 1}`} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FileImage size={20} className="text-gray-300 dark:text-gray-600" />
              </div>
          }
          {/* Page number badge */}
          <span className={cn(
            'absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full',
            halamanAktifIndex === i
              ? 'bg-blue-500 text-white'
              : 'bg-black/40 text-white',
          )}>
            {i + 1}
          </span>
          {/* Widget count badge */}
          {h.widget.length > 0 && (
            <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/80 text-white">
              {h.widget.length}
            </span>
          )}
          {/* Delete button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeHalaman(i) }}
            title="Hapus halaman"
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
          >
            <Trash2 size={9} />
          </button>
        </div>
      ))}

      {/* Add page buttons */}
      <div className="flex flex-col gap-1.5 mt-1">
        <button
          type="button"
          disabled={loading}
          onClick={() => imgInputRef.current?.click()}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-dashed',
            'text-xs font-medium transition-colors',
            loading
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-blue-300 text-blue-500 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20',
          )}
        >
          <FileImage size={12} />
          + Gambar
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => pdfInputRef.current?.click()}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-dashed',
            'text-xs font-medium transition-colors',
            loading
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-rose-300 text-rose-500 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20',
          )}
        >
          <FileText size={12} />
          + PDF
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-1.5 text-[10px] text-blue-500 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
          Memproses…
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={handleImageUpload}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handlePdfUpload}
      />
    </div>
  )
}
