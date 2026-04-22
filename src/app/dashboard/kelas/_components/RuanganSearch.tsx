'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Building2 } from 'lucide-react'
import type { Ruangan } from '@/types/ruangan.types'

interface Props {
  ruanganList:  Ruangan[]
  selectedId:   string
  onChange:     (id: string) => void
  placeholder?: string
  filterJenis?: string  // default: 'KELAS'
}

export function RuanganSearch({
  ruanganList,
  selectedId,
  onChange,
  placeholder = 'Ketik kode / nama ruangan...',
  filterJenis = 'KELAS',
}: Props) {
  const [search, setSearch] = useState('')
  const [open,   setOpen]   = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)

  const selectedRuangan = ruanganList.find((r) => r.id === selectedId)

  const filtered = useMemo(() => {
    const list = filterJenis
      ? ruanganList.filter((r) => r.isActive && r.jenis === filterJenis)
      : ruanganList.filter((r) => r.isActive)

    if (!search.trim()) return list.slice(0, 10)
    const q = search.toLowerCase()
    return list
      .filter((r) =>
        r.nama.toLowerCase().includes(q) ||
        r.kode.toLowerCase().includes(q)
      )
      .slice(0, 10)
  }, [ruanganList, search, filterJenis])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (id: string) => {
    onChange(id)
    setSearch('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {selectedRuangan ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedRuangan.nama}
              </p>
              <p className="text-xs text-gray-400">
                {selectedRuangan.kode} · {selectedRuangan.kapasitas} orang
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelect('')}
            className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder={placeholder}
            value={search}
            style={{ fontSize: '16px' }}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/40 last:border-0"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">{r.nama}</p>
              <p className="text-xs text-gray-400">
                {r.kode} · {r.kapasitas} orang
              </p>
            </button>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && search && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-4 py-3">
          <p className="text-sm text-gray-400">Tidak ada ruangan ditemukan</p>
        </div>
      )}
    </div>
  )
}
