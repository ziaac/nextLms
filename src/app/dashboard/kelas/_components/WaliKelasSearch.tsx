'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { UserByRole } from '@/types/kelas.types'

interface Props {
  waliList: UserByRole[]
  selectedId: string
  onChange: (id: string) => void
  placeholder?: string
}

export function WaliKelasSearch({ waliList, selectedId, onChange, placeholder = 'Ketik nama / NIP...' }: Props) {
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const containerRef          = useRef<HTMLDivElement>(null)

  const selectedWali = waliList.find((w) => w.id === selectedId)

  const filtered = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return waliList
      .filter((w) =>
        w.profile.namaLengkap.toLowerCase().includes(q) ||
        (w.profile.nip ?? '').includes(q)
      )
      .slice(0, 10)
  }, [waliList, search])

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
      {selectedWali ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedWali.profile.namaLengkap}</p>
            {selectedWali.profile.nip && (
              <p className="text-xs text-gray-400">NIP: {selectedWali.profile.nip}</p>
            )}
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
            onFocus={() => { if (search) setOpen(true) }}
          />
        </div>
      )}

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          {filtered.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleSelect(w.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/40 last:border-0"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">{w.profile.namaLengkap}</p>
              {w.profile.nip && <p className="text-xs text-gray-400">NIP: {w.profile.nip}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
