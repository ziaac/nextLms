'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Save, Eye, EyeOff, AlertTriangle,
  Type, Hash, CheckSquare, ChevronDown,
  Minus, Volume2, PenLine, Loader2, ImagePlus,
  ArrowLeftRight, Maximize2, Minimize2,
} from 'lucide-react'
import { TipeWidgetWorksheet } from '@/types/worksheet.types'
import type { HalamanDraft } from '@/types/worksheet.types'
import { useWorksheetBuilderStore } from '@/stores/worksheet-builder.store'
import { useWorksheetDefinition, useSaveWorksheetDefinition } from '@/hooks/worksheet/useWorksheet'
import { uploadWorksheetImage } from '@/lib/api/worksheet.api'
import { WorksheetCanvas }   from './builder/WorksheetCanvas'
import { PageNavigator }      from './builder/PageNavigator'
import { WidgetInspector }    from './builder/WidgetInspector'
import { toast } from 'sonner'

// ── Widget toolbar items ───────────────────────────────────────────────────

const WIDGET_TOOLS: { tipe: TipeWidgetWorksheet; label: string; icon: React.ElementType; color: string }[] = [
  { tipe: TipeWidgetWorksheet.TEXT_INPUT,      label: 'Text Input',    icon: Type,         color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' },
  { tipe: TipeWidgetWorksheet.NUMBER_INPUT,    label: 'Number Input',  icon: Hash,         color: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400' },
  { tipe: TipeWidgetWorksheet.MULTIPLE_CHOICE, label: 'Pilihan Ganda', icon: CheckSquare,  color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400' },
  { tipe: TipeWidgetWorksheet.DROPDOWN,        label: 'Dropdown',      icon: ChevronDown,  color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' },
  { tipe: TipeWidgetWorksheet.FILL_IN_BLANK,   label: 'Isian Singkat', icon: Minus,        color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400' },
  { tipe: TipeWidgetWorksheet.AUDIO_PLAYER,    label: 'Audio Player',  icon: Volume2,      color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' },
  { tipe: TipeWidgetWorksheet.DRAWING_AREA,    label: 'Area Drawing',  icon: PenLine,       color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400' },
  { tipe: TipeWidgetWorksheet.MATCHING,        label: 'Pasangkan',     icon: ArrowLeftRight, color: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400' },
]

interface Props {
  tugasId: string
  readOnly?: boolean
}

export function WorksheetBuilder({ tugasId, readOnly = false }: Props) {
  const [showLabels,       setShowLabels]       = useState(true)
  const [replacingImage,   setReplacingImage]   = useState(false)
  const [isFullscreen,     setIsFullscreen]     = useState(false)
  const builderRef         = React.useRef<HTMLDivElement>(null)
  const replaceImgInputRef = React.useRef<HTMLInputElement>(null)

  // Sync fullscreen state from browser events
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await builderRef.current?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const handleReplaceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setReplacingImage(true)
    try {
      const objectUrl = URL.createObjectURL(file)
      const { key } = await uploadWorksheetImage(file)
      store.updateHalamanImage(store.halamanAktifIndex, key, objectUrl)
      toast.success('Gambar halaman berhasil diganti')
    } catch {
      toast.error('Gagal mengganti gambar')
    } finally {
      setReplacingImage(false)
      e.target.value = ''
    }
  }

  const store = useWorksheetBuilderStore()
  const { data: serverDef, isLoading: defLoading } = useWorksheetDefinition(tugasId)
  const saveMutation = useSaveWorksheetDefinition()

  // Muat definisi dari server ke store saat pertama kali / tugasId berubah
  useEffect(() => {
    if (serverDef) {
      const halamanDraft: HalamanDraft[] = serverDef.halaman.map((h) => ({
        id:       h.id,
        urutan:   h.urutan,
        imageKey: h.imageKey,
        imageUrl: h.imageUrl ?? '',
        widget:   h.widget.map((w) => ({
          id:         w.id,
          tipe:       w.tipe,
          label:      w.label,
          posisiX:    w.posisiX,
          posisiY:    w.posisiY,
          lebarPct:   w.lebarPct,
          tinggiPct:  w.tinggiPct,
          urutan:     w.urutan,
          konfigurasi: w.konfigurasi,
        })),
      }))
      store.loadFromServer(halamanDraft)
    }
  }, [serverDef?.tugasId])

  // Reset store saat unmount
  useEffect(() => () => store.reset(), [])

  const handleSave = async () => {
    if (store.halaman.length === 0) {
      toast.error('Tambah minimal 1 halaman sebelum menyimpan')
      return
    }
    try {
      await saveMutation.mutateAsync(store.toSavePayload(tugasId))
      store.markClean()
      toast.success('Worksheet berhasil disimpan!')
    } catch {
      toast.error('Gagal menyimpan worksheet')
    }
  }

  const selectedWidget = store.getWidgetTerpilih()
  const totalWidgets = store.halaman.reduce((a, h) => a + h.widget.length, 0)

  if (defLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div
      ref={builderRef}
      className={cn(
        'flex flex-col gap-3 h-full min-h-[70vh]',
        isFullscreen && 'fixed inset-0 z-[9999] bg-white dark:bg-gray-950 p-4 overflow-auto',
      )}
    >

      {/* ── Toolbar bar ── */}
      <div className="flex items-center gap-2 flex-wrap min-w-0">

        {/* Widget drag tools */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-wrap">
          {WIDGET_TOOLS.map(({ tipe, label, icon: Icon, color }) => (
            <div
              key={tipe}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('widget-tipe', tipe)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing',
                'text-xs font-medium select-none transition-all hover:shadow-sm hover:-translate-y-0.5',
                color,
              )}
              title={`Drag ke kanvas untuk tambah ${label}`}
            >
              <Icon size={12} />
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1" />

        {/* Unsaved indicator */}
        {store.isDirty && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle size={12} />
            Belum tersimpan
          </div>
        )}

        {/* Show labels toggle */}
        <button
          type="button"
          onClick={() => setShowLabels((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
            'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
            'hover:bg-gray-50 dark:hover:bg-gray-800',
          )}
        >
          {showLabels ? <EyeOff size={12} /> : <Eye size={12} />}
          Label
        </button>

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
            'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
            'hover:bg-gray-50 dark:hover:bg-gray-800',
          )}
        >
          {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          {isFullscreen ? 'Keluar' : 'Fullscreen'}
        </button>

        {/* Stats */}
        <span className="text-xs text-gray-400 px-2">
          {store.halaman.length} hal · {totalWidgets} widget
        </span>

        {/* Save */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending || !store.isDirty}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              saveMutation.isPending || !store.isDirty
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md',
            )}
          >
            {saveMutation.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Menyimpan…</>
              : <><Save size={14} /> Simpan</>
            }
          </button>
        )}
      </div>

      {/* ── Main layout: Navigator | Canvas | Inspector ── */}
      <div className="flex flex-col md:flex-row gap-3 flex-1 min-h-0">

        {/* Left: Page Navigator — hidden on mobile (prevents overflow) */}
        <div className="hidden md:block md:w-36 md:flex-shrink-0 md:overflow-y-auto">
          <PageNavigator />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 min-h-0">

          {/* Mobile-only: horizontal page thumbnail strip (Navigator is hidden on mobile) */}
          {store.halaman.length > 0 && (
            <div className="flex md:hidden gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {store.halaman.map((h, i) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => store.setHalamanAktif(i)}
                  className={cn(
                    'shrink-0 w-12 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                    store.halamanAktifIndex === i
                      ? 'border-blue-500 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700',
                  )}
                >
                  {h.imageUrl
                    ? <img src={h.imageUrl} alt={`Hal ${i+1}`} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[9px] text-gray-400">{i+1}</div>
                  }
                </button>
              ))}
            </div>
          )}

          {/* Canvas header — info halaman + ganti gambar */}
          {store.halaman.length > 0 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] text-gray-400 font-medium">
                Halaman {store.halamanAktifIndex + 1} / {store.halaman.length}
              </span>
              {!readOnly && (
                <>
                  <button
                    type="button"
                    disabled={replacingImage}
                    onClick={() => replaceImgInputRef.current?.click()}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors',
                      replacingImage
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-orange-300 dark:border-orange-700 text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20',
                    )}
                  >
                    {replacingImage
                      ? <><Loader2 size={11} className="animate-spin" /> Mengganti…</>
                      : <><ImagePlus size={11} /> Ganti Gambar</>
                    }
                  </button>
                  <input
                    ref={replaceImgInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleReplaceImage}
                  />
                </>
              )}
            </div>
          )}
          <div className="flex-1 overflow-auto rounded-xl bg-gray-100 dark:bg-gray-950 p-2">
            <WorksheetCanvas showLabels={showLabels} />
          </div>
        </div>

        {/* Right: Inspector — hidden on mobile */}
        <div className={cn(
          'hidden md:flex flex-col md:w-56 md:flex-shrink-0 rounded-xl border border-gray-200 dark:border-gray-700',
          'bg-white dark:bg-gray-900 overflow-hidden',
          'transition-all duration-200',
          selectedWidget ? 'opacity-100' : 'opacity-50',
        )}>
          {selectedWidget ? (
            <WidgetInspector widget={selectedWidget} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-600 leading-relaxed">
                Klik widget di kanvas untuk mengatur konfigurasinya
              </p>
              <p className="text-[10px] text-gray-300 dark:text-gray-700">
                Atau drag widget dari toolbar ke kanvas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
