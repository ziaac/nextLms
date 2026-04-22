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
      setOpen(false)
      setResults([])
      setSearching(false)
      setEnriching(false)
      setResolving(false)
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
    if (!debouncedQuery || debouncedQuery.length < 3) { setResults([]); setOpen(false); return }

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
          }}
          placeholder="Ketik nama kelurahan (min. 3 huruf)..."
          disabled={disabled || resolving}
          className={cn(
            'w-full rounded-lg bg-white dark:bg-gray-800 pl-9 pr-9 py-2',
            'text-sm text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'outline-none transition',
            'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border border-red-400 dark:border-red-500/70'
              : 'border border-gray-200 dark:border-gray-400/40',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading
            ? <Loader2 size={15} className="animate-spin text-gray-400" />
            : query
              ? <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Hapus pilihan"
                  title="Hapus pilihan"
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={15} />
                </button>
              : null
          }
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Dropdown — fixed position agar tidak ikut scroll */}
      {open && results.length > 0 && (
        <div
          style={dropdownStyle}
          className="max-h-60 overflow-y-auto rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-400/40 shadow-lg"
        >
          {results.map((item) => (
            <button
              key={item.kode}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/40 last:border-0"
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
