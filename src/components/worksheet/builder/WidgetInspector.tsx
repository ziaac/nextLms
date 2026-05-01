'use client'

import React from 'react'
import {
  Trash2, Copy, Volume2,
  Type, Hash, CheckSquare, ChevronDown, Minus, PenLine, ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TipeWidgetWorksheet } from '@/types/worksheet.types'
import type { WidgetDraft, KonfigurasiWidget } from '@/types/worksheet.types'
import { useWorksheetBuilderStore } from '@/stores/worksheet-builder.store'
import { uploadWorksheetAudio } from '@/lib/api/worksheet.api'
import { toast } from 'sonner'

interface Props {
  widget: WidgetDraft
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{children}</label>
}

// ── BgColorPicker — warna + opacity dalam 1 popover, output hex8 (#rrggbbaa) ──
//
// Format penyimpanan:
//   - 'transparent' → benar-benar transparan
//   - '#rrggbb'     → fully opaque (compat dengan data lama)
//   - '#rrggbbaa'   → hex8 dengan alpha (modern browsers parse sebagai background)
//
// Native <input type="color"> hanya support hex6, jadi alpha disimpan terpisah
// di local state lalu digabung saat onChange dipanggil ke parent.

function parseHex(input?: string): { hex6: string; alpha: number; transparent: boolean } {
  if (!input || input === 'transparent') return { hex6: '#ffffff', alpha: 1, transparent: true }
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(input)
  if (!m) return { hex6: '#ffffff', alpha: 1, transparent: false }
  const hex6 = `#${m[1]}`
  const alpha = m[2] ? parseInt(m[2], 16) / 255 : 1
  return { hex6, alpha, transparent: false }
}

function buildHex8(hex6: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0')
  return alpha >= 1 ? hex6 : `${hex6}${a}`
}

const CHECKER_BG = `
  linear-gradient(45deg, #d4d4d8 25%, transparent 25%),
  linear-gradient(-45deg, #d4d4d8 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #d4d4d8 75%),
  linear-gradient(-45deg, transparent 75%, #d4d4d8 75%)
`

interface BgColorPickerProps {
  value?: string
  onChange: (v: string) => void
}

function BgColorPicker({ value, onChange }: BgColorPickerProps) {
  const parsed = parseHex(value)
  const [open,    setOpen]    = React.useState(false)
  const [draftHex, setDraftHex] = React.useState(parsed.hex6)
  const [draftA,   setDraftA]   = React.useState(parsed.alpha)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const popRef     = React.useRef<HTMLDivElement>(null)

  // Sync ke draft jika value eksternal berubah
  React.useEffect(() => {
    const p = parseHex(value)
    setDraftHex(p.hex6)
    setDraftA(p.alpha)
  }, [value])

  // Click outside menutup popover
  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        popRef.current && !popRef.current.contains(t) &&
        triggerRef.current && !triggerRef.current.contains(t)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const commit = (hex6: string, alpha: number) => {
    onChange(buildHex8(hex6, alpha))
  }

  return (
    <div className="flex items-center gap-2 relative">
      {/* Trigger swatch — border netral, tidak berubah saat dipilih */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Klik untuk pilih warna & opacity"
        className={cn(
          'relative w-9 h-9 rounded-lg border overflow-hidden cursor-pointer transition-all shrink-0',
          'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
        )}
        style={{
          background: CHECKER_BG,
          backgroundSize: '6px 6px',
          backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
        }}
      >
        {!parsed.transparent && parsed.alpha > 0 && (
          <span
            className="absolute inset-0"
            style={{ background: parsed.hex6, opacity: parsed.alpha }}
          />
        )}
      </button>

      <span className="text-[11px] text-gray-500 tabular-nums">
        {parsed.transparent || parsed.alpha === 0
          ? 'Transparan'
          : `${parsed.hex6}${parsed.alpha < 1 ? ` · ${Math.round(parsed.alpha * 100)}%` : ''}`}
      </span>

      {/* Popover */}
      {open && (
        <div
          ref={popRef}
          className={cn(
            'absolute top-full left-0 mt-1.5 z-50 w-52 p-2.5',
            'bg-white dark:bg-gray-900 rounded-xl shadow-xl',
            'border border-purple-200 dark:border-purple-800',
            'flex flex-col gap-2.5',
          )}
        >
          {/* Color picker */}
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-1.5">
              Warna
            </p>
            <div className="flex items-center gap-2">
              <span
                className="block w-7 h-7 rounded-md border border-gray-200 dark:border-gray-700 shrink-0 relative overflow-hidden"
                style={{
                  background: CHECKER_BG,
                  backgroundSize: '5px 5px',
                  backgroundPosition: '0 0, 0 2.5px, 2.5px -2.5px, -2.5px 0px',
                }}
              >
                <span
                  className="absolute inset-0"
                  style={{ background: draftHex, opacity: draftA }}
                />
              </span>
              <input
                type="color"
                value={draftHex}
                onChange={(e) => { setDraftHex(e.target.value); commit(e.target.value, draftA) }}
                className="flex-1 h-7 rounded cursor-pointer bg-transparent"
              />
            </div>
          </div>

          {/* Opacity slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400">
                Opacity
              </p>
              <span className="text-[10px] font-bold tabular-nums text-purple-700 dark:text-purple-300">
                {Math.round(draftA * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(draftA * 100)}
              onChange={(e) => {
                const a = Number(e.target.value) / 100
                setDraftA(a)
                commit(draftHex, a)
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-purple-500"
              style={{ background: `linear-gradient(to right, ${draftHex}1a, ${draftHex}ff)` }}
            />
            <div className="flex justify-between mt-1">
              {[0, 25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setDraftA(p / 100); commit(draftHex, p / 100) }}
                  className={cn(
                    'text-[9px] font-semibold px-1 py-0.5 rounded transition-all',
                    Math.round(draftA * 100) === p
                      ? 'bg-purple-500 text-white'
                      : 'text-purple-400 hover:text-purple-600 dark:hover:text-purple-300',
                  )}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        'px-2.5 py-1.5 text-sm text-gray-800 dark:text-gray-200 outline-none',
        'focus:border-blue-400 dark:focus:border-blue-500 focus:ring-1 focus:ring-blue-400/30',
        'transition-colors',
        props.className,
      )}
    />
  )
}

export function WidgetInspector({ widget }: Props) {
  const { updateWidget, updateKonfigurasi, removeWidget, duplicateWidget } = useWorksheetBuilderStore()
  const cfg = (widget.konfigurasi ?? {}) as KonfigurasiWidget
  const [audioUploading, setAudioUploading] = React.useState(false)

  const set = (partial: Partial<KonfigurasiWidget>) => updateKonfigurasi(widget.id, partial)

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioUploading(true)
    try {
      const r = await uploadWorksheetAudio(file)
      set({ audioKey: r.key })
      toast.success('Audio berhasil diupload')
    } catch {
      toast.error('Gagal upload audio')
    } finally {
      setAudioUploading(false)
    }
  }

  const TIPE_ICON: Record<TipeWidgetWorksheet, React.ElementType> = {
    TEXT_INPUT:      Type,
    NUMBER_INPUT:    Hash,
    MULTIPLE_CHOICE: CheckSquare,
    DROPDOWN:        ChevronDown,
    FILL_IN_BLANK:   Minus,
    AUDIO_PLAYER:    Volume2,
    DRAWING_AREA:    PenLine,
    MATCHING:        ArrowLeftRight,
  }

  const TIPE_LABEL: Record<TipeWidgetWorksheet, string> = {
    TEXT_INPUT:      'Text Input',
    NUMBER_INPUT:    'Number Input',
    MULTIPLE_CHOICE: 'Pilihan Ganda',
    DROPDOWN:        'Dropdown',
    FILL_IN_BLANK:   'Isian Singkat',
    AUDIO_PLAYER:    'Audio Player',
    DRAWING_AREA:    'Area Menggambar',
    MATCHING:        'Pasangkan',
  }

  const TipeIcon = TIPE_ICON[widget.tipe]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1.5">
          <TipeIcon size={11} />
          {TIPE_LABEL[widget.tipe]}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => duplicateWidget(widget.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Copy size={11} /> Duplikat
          </button>
          <button
            type="button"
            onClick={() => removeWidget(widget.id)}
            className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4 p-4">

        {/* Label (semua tipe kecuali audio) */}
        {widget.tipe !== TipeWidgetWorksheet.AUDIO_PLAYER && (
          <div>
            <Label>Label / Pertanyaan</Label>
            <textarea
              className={cn(
                'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
                'px-2.5 py-1.5 text-sm text-gray-800 dark:text-gray-200 outline-none resize-none',
                'focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-colors',
              )}
              rows={2}
              placeholder="Tulis pertanyaan atau instruksi…"
              value={widget.label ?? ''}
              onChange={(e) => updateWidget(widget.id, { label: e.target.value })}
            />
          </div>
        )}

        {/* Placeholder */}
        {[TipeWidgetWorksheet.TEXT_INPUT, TipeWidgetWorksheet.NUMBER_INPUT,
          TipeWidgetWorksheet.FILL_IN_BLANK].includes(widget.tipe) && (
          <div>
            <Label>Placeholder</Label>
            <Input
              placeholder="Teks hint..."
              value={cfg.placeholder ?? ''}
              onChange={(e) => set({ placeholder: e.target.value })}
            />
          </div>
        )}

        {/* Options — MC & Dropdown */}
        {[TipeWidgetWorksheet.MULTIPLE_CHOICE, TipeWidgetWorksheet.DROPDOWN].includes(widget.tipe) && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Pilihan Jawaban</Label>
              <button
                type="button"
                onClick={() => set({ options: [...(cfg.options ?? []), ''] })}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold"
              >
                + Tambah
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {(cfg.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <Input
                    placeholder={`Opsi ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...(cfg.options ?? [])]
                      opts[i] = e.target.value
                      set({ options: opts })
                    }}
                    className="flex-1"
                  />
                  {(cfg.options ?? []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const opts = (cfg.options ?? []).filter((_, j) => j !== i)
                        set({ options: opts })
                      }}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pairs — Matching */}
        {widget.tipe === TipeWidgetWorksheet.MATCHING && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Pasangan Jawaban</Label>
              <button
                type="button"
                onClick={() => set({ pairs: [...(cfg.pairs ?? []), { left: '', right: '' }] })}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold"
              >
                + Tambah
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {(cfg.pairs ?? []).map((pair, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    placeholder={`Kiri ${i + 1}`}
                    value={pair.left}
                    onChange={(e) => {
                      const p = [...(cfg.pairs ?? [])]
                      p[i] = { ...p[i], left: e.target.value }
                      set({ pairs: p })
                    }}
                    className="flex-1"
                  />
                  <span className="text-gray-300 text-xs shrink-0">→</span>
                  <Input
                    placeholder={`Kanan ${i + 1}`}
                    value={pair.right}
                    onChange={(e) => {
                      const p = [...(cfg.pairs ?? [])]
                      p[i] = { ...p[i], right: e.target.value }
                      set({ pairs: p })
                    }}
                    className="flex-1"
                  />
                  {(cfg.pairs ?? []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const p = (cfg.pairs ?? []).filter((_, j) => j !== i)
                        set({ pairs: p })
                      }}
                      className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jawaban Benar */}
        {[TipeWidgetWorksheet.MULTIPLE_CHOICE, TipeWidgetWorksheet.DROPDOWN].includes(widget.tipe) && (
          <div>
            <Label>Jawaban Benar</Label>
            <select
              className={cn(
                'w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
                'px-2.5 py-1.5 text-sm text-gray-800 dark:text-gray-200 outline-none',
                'focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition-colors',
              )}
              value={cfg.correctAnswer ?? ''}
              onChange={(e) => set({ correctAnswer: e.target.value })}
            >
              <option value="">— Pilih Jawaban Benar —</option>
              {(cfg.options ?? []).filter(Boolean).map((opt, i) => (
                <option key={i} value={opt}>{String.fromCharCode(65 + i)}. {opt}</option>
              ))}
            </select>
          </div>
        )}

        {/* Jawaban benar untuk Fill-in-blank & Number */}
        {[TipeWidgetWorksheet.FILL_IN_BLANK, TipeWidgetWorksheet.NUMBER_INPUT].includes(widget.tipe) && (
          <div>
            <Label>Jawaban Benar (opsional, untuk auto-grade)</Label>
            <Input
              placeholder="Jawaban benar…"
              value={cfg.correctAnswer ?? ''}
              onChange={(e) => set({ correctAnswer: e.target.value })}
            />
          </div>
        )}

        {/* Bobot */}
        {widget.tipe !== TipeWidgetWorksheet.AUDIO_PLAYER && widget.tipe !== TipeWidgetWorksheet.MATCHING && (
          <div>
            <Label>Bobot Soal</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="1"
              value={cfg.bobot ?? 1}
              onChange={(e) => set({ bobot: Number(e.target.value) })}
              className="w-24"
            />
          </div>
        )}

        {/* Audio upload */}
        {widget.tipe === TipeWidgetWorksheet.AUDIO_PLAYER && (
          <div>
            <Label>File Audio</Label>
            <label className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors',
              audioUploading
                ? 'border-gray-300 opacity-50 pointer-events-none'
                : 'border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-emerald-700 dark:hover:border-emerald-600',
            )}>
              <Volume2 size={14} className="text-emerald-500 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {audioUploading ? 'Mengupload…' : cfg.audioKey ? 'Audio tersimpan — Ganti?' : 'Upload MP3 / WAV / OGG'}
              </span>
              <input type="file" accept="audio/*" className="sr-only" onChange={handleAudioUpload} />
            </label>
            {cfg.audioKey && (
              <p className="text-[10px] text-gray-400 mt-1 truncate">{cfg.audioKey}</p>
            )}
          </div>
        )}

        {/* Drawing: warna background — popover picker dengan opacity slider */}
        {widget.tipe === TipeWidgetWorksheet.DRAWING_AREA && (
          <div>
            <Label>Warna Background Area</Label>
            <BgColorPicker
              value={cfg.bgColor}
              onChange={(v) => set({ bgColor: v })}
            />
            <p className="text-[9px] text-gray-400 mt-1">
              Transparan = siswa menggambar langsung di atas gambar
            </p>
          </div>
        )}

        {/* Ukuran widget */}
        <div>
          <Label>Ukuran Widget</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] text-gray-400 mb-0.5">Lebar %</p>
              <Input
                type="number" min={1} max={100} step={1}
                value={Math.round((widget.lebarPct ?? 0.2) * 100)}
                onChange={(e) => updateWidget(widget.id, { lebarPct: Number(e.target.value) / 100 })}
              />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 mb-0.5">Tinggi %</p>
              <Input
                type="number" min={1} max={100} step={1}
                value={Math.round((widget.tinggiPct ?? 0.1) * 100)}
                onChange={(e) => updateWidget(widget.id, { tinggiPct: Number(e.target.value) / 100 })}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
