"""
FIX SCRIPT 1:
1. Sticky footer di Modal (tombol Save/Cancel tidak scroll)
2. ConfirmModal ikut dark/light theme
3. Dropdown wilayah fixed position saat scroll

python scripts/fix_ui_batch1.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# FIX 1: src/components/ui/Modal.tsx
# — ModalFooter sticky bottom
# ============================================================

files["src/components/ui/Modal.tsx"] = """\
'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({ open, onClose, title, description, size = 'md', children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className={isDark ? 'dark' : ''}>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div className={cn(
          'relative w-full flex flex-col max-h-[90vh]',
          'bg-white dark:bg-gray-900',
          'rounded-2xl shadow-2xl',
          'border border-gray-200 dark:border-gray-600/60',
          SIZE[size],
        )}>
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-600/60 flex-shrink-0">
            <div className="space-y-0.5 pr-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="overflow-y-auto flex-1 min-h-0 text-gray-900 dark:text-white">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      flex items-center justify-end gap-3
      px-6 py-4
      border-t border-gray-200 dark:border-gray-600/60
      bg-white dark:bg-gray-900
      flex-shrink-0
      rounded-b-2xl
    ">
      {children}
    </div>
  )
}
"""

# ============================================================
# FIX 2: src/components/ui/ConfirmModal.tsx
# — portal + dark mode observer
# ============================================================

files["src/components/ui/ConfirmModal.tsx"] = """\
'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  variant?: 'danger' | 'warning'
}

export function ConfirmModal({
  open, onClose, onConfirm,
  title, description,
  confirmLabel = 'Hapus',
  loading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, loading, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className={isDark ? 'dark' : ''}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && onClose()}
        />
        <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-600/60">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center',
              variant === 'danger'
                ? 'bg-red-100 dark:bg-red-950/50'
                : 'bg-yellow-100 dark:bg-yellow-950/50',
            )}>
              <AlertTriangle size={20} className={
                variant === 'danger' ? 'text-red-600' : 'text-yellow-600'
              } />
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-600/60">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
"""

# ============================================================
# FIX 3: src/components/ui/WilayahAutocomplete.tsx
# — dropdown pakai fixed position agar tidak ikut scroll form
# ============================================================

files["src/components/ui/WilayahAutocomplete.tsx"] = """\
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  wilayahApi, resolveWilayahNames, enrichKelurahanList,
  type WilayahItem,
} from '@/lib/api/wilayah.api'
import { useDebounce } from '@/hooks/useDebounce'

export interface WilayahValue {
  kelurahan: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  kodeKelurahan?: string
}

type EnrichedItem = WilayahItem & { namaKecamatan: string; namaKabupaten: string }

interface WilayahAutocompleteProps {
  value?: WilayahValue
  onChange: (value: WilayahValue) => void
  label?: string
  error?: string
  disabled?: boolean
}

export function WilayahAutocomplete({
  value, onChange, label = 'Kelurahan / Desa', error, disabled,
}: WilayahAutocompleteProps) {
  const [query, setQuery]         = useState(value?.kelurahan ?? '')
  const [results, setResults]     = useState<EnrichedItem[]>([])
  const [open, setOpen]           = useState(false)
  const [searching, setSearching] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [selected, setSelected]   = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 400)

  // Sync value dari luar
  useEffect(() => {
    if (value?.kelurahan && value.kelurahan !== query) {
      setQuery(value.kelurahan)
      setSelected(true)
    }
  }, [value?.kelurahan])

  // Hitung posisi dropdown (fixed, ikut posisi input)
  const updateDropdownPosition = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top:   rect.bottom + 4,
      left:  rect.left,
      width: rect.width,
      zIndex: 9999,
    })
  }, [])

  // Search
  useEffect(() => {
    if (selected) return
    if (debouncedQuery.length < 3) { setResults([]); setOpen(false); return }

    let cancelled = false
    setSearching(true)

    wilayahApi.searchKelurahan(debouncedQuery)
      .then(async (raw) => {
        if (cancelled) return
        setSearching(false)
        if (raw.length === 0) { setResults([]); setOpen(false); return }

        const preliminary = raw.map(item => ({
          ...item, namaKecamatan: '...', namaKabupaten: '...',
        }))
        setResults(preliminary)
        updateDropdownPosition()
        setOpen(true)

        setEnriching(true)
        const enriched = await enrichKelurahanList(raw).catch(() => preliminary)
        if (!cancelled) { setResults(enriched); setEnriching(false) }
      })
      .catch(() => { if (!cancelled) { setSearching(false); setResults([]) } })

    return () => { cancelled = true }
  }, [debouncedQuery, selected, updateDropdownPosition])

  // Update posisi saat scroll/resize
  useEffect(() => {
    if (!open) return
    const handler = () => updateDropdownPosition()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open, updateDropdownPosition])

  // Tutup saat klik luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback(async (item: EnrichedItem) => {
    setQuery(item.nama)
    setSelected(true)
    setOpen(false)
    setResolving(true)

    try {
      const { provinsi, kabupaten, kecamatan } = await resolveWilayahNames(item.kode)
      onChange({ kelurahan: item.nama, kecamatan, kabupaten, provinsi, kodeKelurahan: item.kode })
    } catch {
      onChange({ kelurahan: item.nama, kecamatan: item.namaKecamatan, kabupaten: item.namaKabupaten, provinsi: '', kodeKelurahan: item.kode })
    } finally {
      setResolving(false)
    }
  }, [onChange])

  const handleClear = () => {
    setQuery(''); setSelected(false); setResults([])
    onChange({ kelurahan: '', kecamatan: '', kabupaten: '', provinsi: '' })
  }

  const isLoading = searching || resolving

  return (
    <div ref={containerRef} className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(false) }}
          onFocus={() => {
            if (results.length > 0 && !selected) {
              updateDropdownPosition()
              setOpen(true)
            }
          }}
          placeholder="Ketik nama kelurahan (min. 3 huruf)..."
          disabled={disabled || resolving}
          className={cn(
            'w-full rounded-xl bg-white dark:bg-gray-800 pl-9 pr-9 py-2.5',
            'text-base text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'outline-none transition',
            'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border border-red-400 dark:border-red-500/70'
              : 'border border-gray-200 dark:border-gray-600/60',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading
            ? <Loader2 size={15} className="animate-spin text-gray-400" />
            : query
              ? <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={15} /></button>
              : null
          }
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Dropdown — fixed position agar tidak ikut scroll */}
      {open && results.length > 0 && (
        <div
          style={dropdownStyle}
          className="max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600/60 shadow-lg"
        >
          {results.map((item) => (
            <button
              key={item.kode}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/40 last:border-0"
            >
              <p className="font-medium text-gray-900 dark:text-white">{item.nama}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {enriching && item.namaKecamatan === '...'
                  ? <span className="italic">Memuat lokasi...</span>
                  : <>{item.namaKecamatan} · {item.namaKabupaten}</>
                }
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Auto-filled */}
      {resolving && (
        <div className="grid grid-cols-3 gap-2">
          {['Kecamatan', 'Kabupaten / Kota', 'Provinsi'].map(l => (
            <AutoFilledField key={l} label={l} value="..." />
          ))}
        </div>
      )}
      {!resolving && (value?.kecamatan || value?.kabupaten || value?.provinsi) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <AutoFilledField label="Kecamatan"       value={value?.kecamatan ?? ''} />
          <AutoFilledField label="Kabupaten / Kota" value={value?.kabupaten ?? ''} />
          <AutoFilledField label="Provinsi"         value={value?.provinsi  ?? ''} />
        </div>
      )}
    </div>
  )
}

function AutoFilledField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-2 space-y-0.5">
      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">
        {value && value !== '...'
          ? value
          : <span className="text-gray-400 italic font-normal">{value === '...' ? '...' : '—'}</span>
        }
      </p>
    </div>
  )
}
"""

# ============================================================
# WRITE
# ============================================================

def write_files(files_dict, base):
    for path, content in files_dict.items():
        full = os.path.join(base, path.replace("/", os.sep))
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  ✅ {path}")
    print(f"""
🎉 {len(files_dict)} file diupdate!

Fix:
  ✅ Modal — ModalFooter sticky (tidak ikut scroll konten)
  ✅ ConfirmModal — portal + dark mode observer
  ✅ WilayahAutocomplete — dropdown fixed position, tidak ikut scroll form

npm run dev → test semua
""")

if __name__ == "__main__":
    print("🔧 Fix UI Batch 1 — Sticky footer, Dark ConfirmModal, Wilayah fixed\n")
    write_files(files, BASE)