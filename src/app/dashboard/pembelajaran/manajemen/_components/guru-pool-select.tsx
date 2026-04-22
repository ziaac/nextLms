'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, X, Star } from 'lucide-react'
import type { GuruMapel } from '@/types/akademik.types'

interface Props {
  guruPool:  GuruMapel[]
  value:     string[]       // index 0 = koordinator
  onChange:  (guruIds: string[]) => void
  disabled?: boolean
}

export function GuruPoolSelect({ guruPool, value, onChange, disabled }: Props) {
  const [search, setSearch] = useState('')
  const [open,   setOpen]   = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return guruPool
    const q = search.toLowerCase()
    return guruPool.filter((gm) =>
      gm.guru.profile.namaLengkap.toLowerCase().includes(q) ||
      (gm.guru.profile.nip ?? '').includes(q),
    )
  }, [guruPool, search])

  const selectedGuru = useMemo(
    () => value
      .map((id) => guruPool.find((gm) => gm.guruId === id))
      .filter(Boolean) as GuruMapel[],
    [guruPool, value],
  )

  function toggle(guruId: string) {
    if (value.includes(guruId)) {
      onChange(value.filter((id) => id !== guruId))
    } else {
      onChange([...value, guruId])
    }
  }

  function remove(guruId: string) {
    onChange(value.filter((id) => id !== guruId))
  }

  // Jadikan koordinator = pindah ke index 0
  function jadikanKoordinator(guruId: string) {
    if (value[0] === guruId) return
    onChange([guruId, ...value.filter((id) => id !== guruId)])
  }

  if (guruPool.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm text-amber-700">
          Belum ada guru di pool mata pelajaran ini.
          Tambahkan guru terlebih dahulu di menu{' '}
          <span className="font-semibold">Master Mapel</span>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2" ref={containerRef}>

      {/* Chips guru terpilih */}
      {selectedGuru.length > 0 && (
        <div className="space-y-1.5">
          {selectedGuru.map((gm, idx) => {
            const isKoordinator = idx === 0
            return (
              <div
                key={gm.guruId}
                className={[
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                  isKoordinator
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-gray-200 bg-gray-50',
                ].join(' ')}
              >
                {/* Toggle koordinator */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => jadikanKoordinator(gm.guruId)}
                    title={isKoordinator ? 'Koordinator' : 'Jadikan koordinator'}
                    className={[
                      'shrink-0 transition-colors',
                      isKoordinator
                        ? 'text-emerald-500 cursor-default'
                        : 'text-gray-300 hover:text-emerald-400',
                    ].join(' ')}
                  >
                    <Star className={['w-3.5 h-3.5', isKoordinator ? 'fill-emerald-500' : ''].join(' ')} />
                  </button>
                )}
                {disabled && (
                  <Star className={[
                    'w-3.5 h-3.5 shrink-0',
                    isKoordinator ? 'fill-emerald-500 text-emerald-500' : 'text-gray-300',
                  ].join(' ')} />
                )}

                {/* Nama guru */}
                <div className="flex-1 min-w-0">
                  <span className={[
                    'font-medium truncate block',
                    isKoordinator ? 'text-emerald-800' : 'text-gray-700',
                  ].join(' ')}>
                    {gm.guru.profile.namaLengkap}
                  </span>
                  {isKoordinator && (
                    <span className="text-emerald-500 text-[10px]">Koordinator</span>
                  )}
                </div>

                {/* Hapus */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => remove(gm.guruId)}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Search input */}
      {!disabled && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Cari guru dari pool..."
            value={search}
            style={{ fontSize: '16px' }}
            onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />

          {open && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Tidak ada guru ditemukan</p>
              ) : (
                filtered.map((gm) => {
                  const isSelected = value.includes(gm.guruId)
                  return (
                    <button
                      key={gm.guruId}
                      type="button"
                      onClick={() => { toggle(gm.guruId); setSearch('') }}
                      className={[
                        'w-full text-left px-4 py-2.5 text-sm transition-colors',
                        'border-b border-gray-50 last:border-0',
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'hover:bg-gray-50 text-gray-800',
                      ].join(' ')}
                    >
                      <p className="font-medium">{gm.guru.profile.namaLengkap}</p>
                      {gm.guru.profile.nip && (
                        <p className="text-xs text-gray-400">{gm.guru.profile.nip}</p>
                      )}
                      {isSelected && (
                        <p className="text-xs text-emerald-500 mt-0.5">Dipilih</p>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {selectedGuru.length} dari {guruPool.length} guru dipilih
        {selectedGuru.length > 0 && (
          <span className="ml-1">— klik <Star className="w-3 h-3 inline" /> untuk atur koordinator</span>
        )}
      </p>
    </div>
  )
}
