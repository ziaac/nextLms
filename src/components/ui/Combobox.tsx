'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'

export interface ComboboxOption {
  label:     string
  value:     string
  group?:    string
  disabled?: boolean   // untuk item bentrok/tidak tersedia
  hint?:     string    // teks kecil di bawah label
}

interface Props {
  options:            ComboboxOption[]
  value:              string
  onChange:           (value: string) => void
  placeholder?:       string
  searchable?:        boolean   // aktifkan mode search (dropdown + search box)
  searchOnly?:        boolean   // input search langsung jadi trigger (tanpa button)
  minSearchLength?:   number    // min karakter sebelum list muncul (default 3)
  searchPlaceholder?: string    // placeholder input search
  size?:              'default' | 'sm' | 'xs' | 'xl'
  disabled?:          boolean
  hasError?:          boolean
  className?:         string
  dropdownMinWidth?:  string
  /** id untuk elemen trigger — dibutuhkan agar label bisa terhubung via htmlFor */
  id?:                string
  /** name untuk hidden input — dibutuhkan untuk form submission & autofill */
  name?:              string
  /** aria-label untuk aksesibilitas jika tidak ada label visual */
  ariaLabel?:         string
}

export function Combobox({
  options, value, onChange,
  placeholder = '— Pilih —',
  searchable = false,
  searchOnly = false,
  minSearchLength = 3,
  searchPlaceholder = 'Ketik untuk mencari...',
  size = 'default',
  disabled, hasError, className = '',
  dropdownMinWidth,
  id, name, ariaLabel,
}: Props) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref               = useRef<HTMLDivElement>(null)
  const listRef           = useRef<HTMLDivElement>(null)
  const searchRef         = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null
    if (el) setTimeout(() => el.scrollIntoView({ block: 'nearest' }), 10)
  }, [open])

  useEffect(() => {
    if (open && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 30)
    }
    if (!open) setQuery('')
  }, [open, searchable])

  // searchOnly: label terpilih untuk ditampilkan di input
  const selected      = options.find((o) => o.value === value)
  const selectedLabel = selected?.label ?? ''

  // Filter options berdasarkan query (hanya aktif jika searchable)
  const isSearchMode = searchable || searchOnly
  const filteredOptions = isSearchMode && query.length >= minSearchLength
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.hint ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : isSearchMode && query.length > 0 && query.length < minSearchLength
    ? []
    : options

  const ungrouped: ComboboxOption[]              = []
  const groups: Record<string, ComboboxOption[]> = {}
  for (const opt of filteredOptions) {
    if (opt.group) {
      if (!groups[opt.group]) groups[opt.group] = []
      groups[opt.group].push(opt)
    } else {
      ungrouped.push(opt)
    }
  }

  const triggerPad  = size === 'xs' ? 'px-1.5 py-2 text-[10px]'
                    : size === 'sm' ? 'px-2.5 py-2 text-xs'
                    : size === 'xl' ? 'px-4 py-2 text-base'
                    :                  'px-3 py-2 text-sm'
  const chevronSize = size === 'xs' ? 'h-3 w-3'
                    : size === 'sm' ? 'h-3.5 w-3.5'
                    :                  'h-4 w-4'
  const itemPad     = size === 'xs' ? 'px-2.5 py-2 text-[11px]'
                    : size === 'sm' ? 'px-3 py-2 text-xs'
                    : size === 'xl' ? 'px-4 py-2 text-sm'
                    :                  'px-3 py-2 text-sm'

  const borderClass = hasError
    ? 'border-orange-300'
    : open
    ? 'border-emerald-500 ring-1 ring-emerald-500'
    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'

  const dropdownStyle: React.CSSProperties = dropdownMinWidth
    ? { minWidth: dropdownMinWidth }
    : {}

  // ── searchOnly mode: render input langsung sebagai trigger ──
  if (searchOnly) {
    return (
      <div ref={ref} className={'relative w-full ' + className}>
        <div className={[
          'w-full flex items-center gap-1 border',
          'rounded-lg',
          'bg-white dark:bg-gray-900 transition-colors',
          hasError
            ? 'border-orange-300'
            : open
            ? 'border-emerald-500 ring-1 ring-emerald-500'
            : 'border-gray-200 dark:border-gray-700',
          disabled ? 'opacity-50' : '',
        ].join(' ')}>
          <input
            ref={searchRef}
            id={id}
            name={name}
            type="text"
            disabled={disabled}
            value={open ? query : selectedLabel}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => { setOpen(true); setQuery('') }}
            placeholder={placeholder}
            aria-label={ariaLabel ?? placeholder}
            aria-expanded={open}
            aria-haspopup="listbox"
            role="combobox"
            autoComplete="off"
            className={[
              'flex-1 min-w-0 bg-transparent outline-none truncate',
              triggerPad,
              'text-gray-800 dark:text-gray-200 placeholder-gray-400',
              disabled ? 'cursor-not-allowed' : '',
            ].join(' ')}
          />
          <ChevronDown className={
            'shrink-0 text-gray-400 mr-2 transition-transform duration-150 ' +
            chevronSize + (open ? ' rotate-180' : '')
          } />
        </div>

        {open && (
          <div
            style={dropdownStyle}
            className="absolute z-[60] top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
          >
            {query.length > 0 && query.length < minSearchLength && (
              <p className="text-[10px] text-gray-400 px-3 pt-2">
                Ketik minimal {minSearchLength} huruf...
              </p>
            )}
            <div ref={listRef} className="max-h-56 overflow-y-auto overscroll-contain py-1">
              {ungrouped.map((opt) => (
                <OptionItem key={opt.value} opt={opt} selected={value === opt.value}
                  itemPad={itemPad} onSelect={(v) => { onChange(v); setOpen(false); setQuery('') }} />
              ))}
              {Object.entries(groups).map(([group, opts]) => (
                <div key={group}>
                  <div className="px-2.5 pt-2 pb-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-gray-800/60">
                    {group}
                  </div>
                  {opts.map((opt) => (
                    <OptionItem key={opt.value} opt={opt} selected={value === opt.value}
                      itemPad={itemPad} onSelect={(v) => { onChange(v); setOpen(false); setQuery('') }} />
                  ))}
                </div>
              ))}
              {filteredOptions.length === 0 && (
                <p className="px-3 py-3 text-xs text-gray-400 text-center italic">
                  {query.length >= minSearchLength
                    ? `Tidak ada hasil untuk "${query}"`
                    : query.length > 0
                    ? `Ketik minimal ${minSearchLength} huruf...`
                    : 'Tidak ada pilihan'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className={'relative w-full ' + className}>
      {/* Hidden input untuk form submission & autofill */}
      {name && (
        <input type="hidden" name={name} value={value} />
      )}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={[
          'w-full flex items-center justify-between gap-1 border',
          'rounded-lg',
          'bg-white dark:bg-gray-900 transition-colors text-left outline-none',
          triggerPad, borderClass,
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <span className={
          'flex-1 truncate ' +
          (selected ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400')
        }>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={
          'shrink-0 text-gray-400 transition-transform duration-150 ' +
          chevronSize + (open ? ' rotate-180' : '')
        } />
      </button>

      {open && (
        <div
          style={dropdownStyle}
          className="absolute z-[60] top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden"
        >
          {searchable && (
            <div className="px-2 py-2 border-b border-gray-100 dark:border-gray-800">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                autoComplete="off"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              {query.length > 0 && query.length < minSearchLength && (
                <p className="text-[10px] text-gray-400 mt-1 px-1">
                  Ketik minimal {minSearchLength} huruf untuk mencari
                </p>
              )}
            </div>
          )}
          <div ref={listRef} className="max-h-56 overflow-y-auto overscroll-contain py-1">
            {ungrouped.map((opt) => (
              <OptionItem key={opt.value} opt={opt} selected={value === opt.value}
                itemPad={itemPad} onSelect={(v) => { onChange(v); setOpen(false) }} />
            ))}
            {Object.entries(groups).map(([group, opts]) => (
              <div key={group}>
                <div className={[
                  'px-2.5 pt-2 pb-0.5 text-[9px] font-bold uppercase tracking-widest',
                  'border-t border-gray-100 dark:border-gray-800 first:border-t-0',
                  group === 'Bentrok' || group.toLowerCase().includes('bentrok')
                    ? 'text-red-400 bg-red-50 dark:bg-red-900/10'
                    : 'text-gray-400 bg-gray-50 dark:bg-gray-800/60',
                ].join(' ')}>
                  {group}
                </div>
                {opts.map((opt) => (
                  <OptionItem key={opt.value} opt={opt} selected={value === opt.value}
                    itemPad={itemPad} onSelect={(v) => { onChange(v); setOpen(false) }} />
                ))}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-3 text-xs text-gray-400 text-center italic">
                {searchable && query.length >= minSearchLength
                  ? `Tidak ada hasil untuk "${query}"`
                  : searchable && query.length > 0
                  ? `Ketik minimal ${minSearchLength} huruf...`
                  : 'Tidak ada pilihan'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function OptionItem({ opt, selected, itemPad, onSelect }: {
  opt:      ComboboxOption
  selected: boolean
  itemPad:  string
  onSelect: (v: string) => void
}) {
  const isBentrok = opt.disabled === true

  return (
    <button
      type="button"
      data-selected={selected}
      onClick={() => onSelect(opt.value)}
      className={[
        'w-full flex items-center justify-between gap-2 text-left transition-colors',
        itemPad,
        isBentrok
          ? 'text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10'
          : selected
          ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
      ].join(' ')}
    >
      <div className="min-w-0">
        <span className="truncate block">{opt.label}</span>
        {opt.hint && (
          <span className="text-[9px] text-gray-400 truncate block">{opt.hint}</span>
        )}
      </div>
      {isBentrok
        ? <AlertCircle className="h-3 w-3 shrink-0 text-red-400" />
        : selected
        ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        : null
      }
    </button>
  )
}
