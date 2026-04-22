'use client'

import { useState, useRef, useEffect } from 'react'
import { useGuruList } from '@/hooks/mata-pelajaran/useMataPelajaran'
import type { GuruItem } from '@/types/akademik.types'

interface Props {
  excludeIds: string[]
  onSelect:   (guru: GuruItem) => void
  disabled?:  boolean
}

export default function GuruSearchInput({ excludeIds, onSelect, disabled }: Props) {
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const containerRef      = useRef<HTMLDivElement>(null)

  const { data: allGuru } = useGuruList()

  const filtered = (allGuru ?? []).filter((g) => {
    if (excludeIds.includes(g.id)) return false
    if (!query) return false
    return g.profile.namaLengkap.toLowerCase().includes(query.toLowerCase())
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (guru: GuruItem) => {
    onSelect(guru)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
          placeholder="Ketik nama guru untuk mencari..."
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700/60
            bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            px-4 py-2.5 outline-none transition
            focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {open && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50
          max-h-52 overflow-y-auto rounded-lg shadow-lg
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700/60">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
              Tidak ada guru ditemukan
            </div>
          ) : (
            filtered.map((guru) => (
              <button
                key={guru.id}
                type="button"
                onClick={() => handleSelect(guru)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left
                  hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                  border-b border-gray-100 dark:border-gray-700/40 last:border-0
                  transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                  flex items-center justify-center flex-shrink-0
                  text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {guru.profile.namaLengkap.split(' ').slice(0,2).map(n => n[0]).join('')}
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {guru.profile.namaLengkap}
                </span>
                <div className="ml-auto text-emerald-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
