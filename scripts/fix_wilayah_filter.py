"""
FIX — Wilayah search filter KELURAHAN_DESA only
+ fix resolve nama dari kode

python scripts/fix_wilayah_filter.py
"""

import os
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = {}

# ============================================================
# src/lib/api/wilayah.api.ts
# ============================================================

files["src/lib/api/wilayah.api.ts"] = """\
import api from '@/lib/axios'

export interface WilayahItem {
  kode: string
  nama: string
  tipe?: string
  indukKode?: string
}

export const wilayahApi = {
  /**
   * Search wilayah — filter hanya KELURAHAN_DESA di frontend
   * karena endpoint tidak support filter by tipe
   */
  searchKelurahan: async (q: string): Promise<WilayahItem[]> => {
    if (q.length < 3) return []
    const { data } = await api.get('/wilayah/search', { params: { q } })
    // Filter hanya kelurahan/desa — buang kecamatan, kabupaten, dll
    return (data as WilayahItem[]).filter(
      (item) => item.tipe === 'KELURAHAN_DESA'
    )
  },

  getAllProvinsi: async (): Promise<WilayahItem[]> => {
    const { data } = await api.get('/wilayah/provinsi')
    return data
  },

  getKabupaten: async (indukKode: string): Promise<WilayahItem[]> => {
    const { data } = await api.get('/wilayah/kabupaten', { params: { indukKode } })
    return data
  },

  getKecamatan: async (indukKode: string): Promise<WilayahItem[]> => {
    const { data } = await api.get('/wilayah/kecamatan', { params: { indukKode } })
    return data
  },
}

/**
 * Derive kode induk dari kode kelurahan (4 segment)
 * "73.71.06.1004" → { provinsiKode: "73", kabupatenKode: "73.71", kecamatanKode: "73.71.06" }
 */
export function deriveKodeInduk(kelurahanKode: string) {
  const parts = kelurahanKode.split('.')
  return {
    provinsiKode:  parts[0],
    kabupatenKode: parts.slice(0, 2).join('.'),
    kecamatanKode: parts.slice(0, 3).join('.'),
  }
}

/**
 * Resolve nama provinsi, kabupaten, kecamatan dari kode kelurahan
 */
export async function resolveWilayahNames(kelurahanKode: string): Promise<{
  provinsi: string
  kabupaten: string
  kecamatan: string
}> {
  const { provinsiKode, kabupatenKode, kecamatanKode } = deriveKodeInduk(kelurahanKode)

  const [provinsiList, kabupatenList, kecamatanList] = await Promise.all([
    wilayahApi.getAllProvinsi(),
    wilayahApi.getKabupaten(provinsiKode),
    wilayahApi.getKecamatan(kabupatenKode),
  ])

  const provinsi  = provinsiList.find(p => p.kode === provinsiKode)?.nama  ?? ''
  const kabupaten = kabupatenList.find(k => k.kode === kabupatenKode)?.nama ?? ''
  const kecamatan = kecamatanList.find(k => k.kode === kecamatanKode)?.nama ?? ''

  return { provinsi, kabupaten, kecamatan }
}
"""

# ============================================================
# src/components/ui/WilayahAutocomplete.tsx
# — tampilan lebih clean, tidak tampil kode
# ============================================================

files["src/components/ui/WilayahAutocomplete.tsx"] = """\
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { wilayahApi, resolveWilayahNames, type WilayahItem } from '@/lib/api/wilayah.api'
import { useDebounce } from '@/hooks/useDebounce'

export interface WilayahValue {
  kelurahan: string
  kecamatan: string
  kabupaten: string
  provinsi: string
  kodeKelurahan?: string
}

interface WilayahAutocompleteProps {
  value?: WilayahValue
  onChange: (value: WilayahValue) => void
  label?: string
  error?: string
  disabled?: boolean
}

export function WilayahAutocomplete({
  value,
  onChange,
  label = 'Kelurahan / Desa',
  error,
  disabled,
}: WilayahAutocompleteProps) {
  const [query, setQuery]         = useState(value?.kelurahan ?? '')
  const [results, setResults]     = useState<WilayahItem[]>([])
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [resolving, setResolving] = useState(false)
  const [selected, setSelected]   = useState(false)

  const containerRef   = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 400)

  // Sync value dari luar (saat form di-reset)
  useEffect(() => {
    if (value?.kelurahan && value.kelurahan !== query) {
      setQuery(value.kelurahan)
      setSelected(true)
    }
  }, [value?.kelurahan])

  // Search saat query berubah
  useEffect(() => {
    if (selected) return
    if (debouncedQuery.length < 3) { setResults([]); setOpen(false); return }

    setLoading(true)
    wilayahApi.searchKelurahan(debouncedQuery)
      .then((data) => {
        setResults(data)
        setOpen(data.length > 0)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQuery, selected])

  // Tutup saat klik luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = useCallback(async (item: WilayahItem) => {
    setQuery(item.nama)
    setSelected(true)
    setOpen(false)
    setResolving(true)

    try {
      const { provinsi, kabupaten, kecamatan } = await resolveWilayahNames(item.kode)
      onChange({
        kelurahan:     item.nama,
        kecamatan,
        kabupaten,
        provinsi,
        kodeKelurahan: item.kode,
      })
    } catch {
      onChange({
        kelurahan:     item.nama,
        kecamatan:     '',
        kabupaten:     '',
        provinsi:      '',
        kodeKelurahan: item.kode,
      })
    } finally {
      setResolving(false)
    }
  }, [onChange])

  const handleClear = () => {
    setQuery('')
    setSelected(false)
    setResults([])
    onChange({ kelurahan: '', kecamatan: '', kabupaten: '', provinsi: '' })
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Input search kelurahan */}
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(false) }}
          onFocus={() => { if (results.length > 0 && !selected) setOpen(true) }}
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
              : 'border border-gray-200 dark:border-gray-700/60',
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {(loading || resolving) ? (
            <Loader2 size={15} className="animate-spin text-gray-400" />
          ) : query ? (
            <button type="button" onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={15} />
            </button>
          ) : null}
        </div>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-52 overflow-y-auto rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 shadow-lg">
            {results.map((item) => (
              <button
                key={item.kode}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/40 last:border-0"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.nama}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Auto-filled fields — tampil setelah pilih */}
      {resolving && (
        <div className="grid grid-cols-3 gap-2">
          {['Kecamatan', 'Kabupaten / Kota', 'Provinsi'].map(l => (
            <AutoFilledField key={l} label={l} value="..." />
          ))}
        </div>
      )}

      {!resolving && (value?.kecamatan || value?.kabupaten || value?.provinsi) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <AutoFilledField label="Kecamatan"      value={value?.kecamatan ?? ''} />
          <AutoFilledField label="Kabupaten / Kota" value={value?.kabupaten ?? ''} />
          <AutoFilledField label="Provinsi"       value={value?.provinsi  ?? ''} />
        </div>
      )}
    </div>
  )
}

function AutoFilledField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-2 space-y-0.5">
      <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">
        {value || <span className="text-gray-400 italic font-normal">—</span>}
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
    print("""
🎉 Fix selesai!

Yang difix:
  ✅ Filter hasil search — hanya tampil KELURAHAN_DESA
  ✅ Dropdown lebih clean — tidak tampil kode, tidak tampil tipe
  ✅ Auto-fill fields — warna emerald agar mudah dibedakan
  ✅ resolveWilayahNames — fetch all provinsi lalu find by kode

npm run dev → test ketik "bontoala" → harusnya hanya kelurahan
""")

if __name__ == "__main__":
    print("🔧 Fix Wilayah — filter KELURAHAN_DESA only\n")
    write_files(files, BASE)