'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import type { Kelas } from '@/types/kelas.types'

interface Props {
  kelasList: Kelas[]
  selectedId: string
  onChange: (id: string) => void
  placeholder?: string
  excludeId?: string   // exclude kelas saat ini
  filterTahunAjaranId?: string  // filter beda tahun ajaran (untuk copy)
}

export function KelasSearch({
  kelasList, selectedId, onChange,
  placeholder = 'Ketik nama kelas...',
  excludeId, filterTahunAjaranId,
}: Props) {
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const containerRef          = useRef<HTMLDivElement>(null)

  const baseList = useMemo(() => {
    let list = kelasList
    if (excludeId) list = list.filter((k) => k.id !== excludeId)
    if (filterTahunAjaranId) list = list.filter((k) => k.tahunAjaranId !== filterTahunAjaranId)
    return list
  }, [kelasList, excludeId, filterTahunAjaranId])

  const selectedKelas = kelasList.find((k) => k.id === selectedId)

  const filtered = useMemo(() => {
    if (!search.trim()) return baseList.slice(0, 15)
    const q = search.toLowerCase()
    return baseList
      .filter((k) =>
        k.namaKelas.toLowerCase().includes(q) ||
        k.tahunAjaran.nama.toLowerCase().includes(q) ||
        k.tingkatKelas.nama.toLowerCase().includes(q)
      )
      .slice(0, 15)
  }, [baseList, search])

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
      {selectedKelas ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedKelas.namaKelas}</p>
            <p className="text-xs text-gray-400">{selectedKelas.tahunAjaran.nama} · {selectedKelas.tingkatKelas.nama}</p>
          </div>
          <button type="button" onClick={() => handleSelect('')}
          aria-label="Pilih"
            className="shrink-0 text-gray-400 hover:text-red-500 transition-colors">
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

      {open && !selectedKelas && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Kelas tidak ditemukan</p>
          ) : filtered.map((k) => (
            <button key={k.id} type="button" onClick={() => handleSelect(k.id)}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-gray-50 dark:border-gray-700/40 last:border-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{k.namaKelas}</p>
              <p className="text-xs text-gray-400">{k.tahunAjaran.nama} · {k.tingkatKelas.nama}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
