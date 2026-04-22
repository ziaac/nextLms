'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (e: { target: { value: string; name?: string } }) => void
  name?: string
  disabled?: boolean
  className?: string
  id?: string
  size?: 'default' | 'sm'
}

export const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      label, error, hint, options, placeholder,
      value: controlledValue, defaultValue,
      onChange, name, disabled, className, id, size = 'default',
    },
    _ref,
  ) => {
    const [open, setOpen]           = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const containerRef = useRef<HTMLDivElement>(null)

    // Support both controlled (value prop) and uncontrolled (react-hook-form ref)
    const currentValue = controlledValue !== undefined ? controlledValue : internalValue
    const selectedLabel = options.find(o => o.value === currentValue)?.label

    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

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

    const handleSelect = (optValue: string) => {
      setInternalValue(optValue)
      setOpen(false)
      onChange?.({ target: { value: optValue, name } })
    }

    return (
      <div className={cn('space-y-1.5', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative">
          {/* Trigger button */}
          <button
            id={selectId}
            type="button"
            disabled={disabled}
            onClick={() => setOpen(v => !v)}
            className={cn(
              'w-full flex items-center justify-between',
              size === 'sm' ? 'rounded-lg px-3 py-2 text-sm' : 'rounded-lg px-4 py-2 text-base',
              'bg-white dark:bg-gray-800',
              'text-left outline-none transition',
              'focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border border-red-400 dark:border-red-500/70'
                : 'border border-gray-200 dark:border-gray-700/60',
              !currentValue && 'text-gray-400 dark:text-gray-500',
              currentValue && 'text-gray-900 dark:text-white',
            )}
          >
            <span className="truncate">
              {selectedLabel ?? placeholder ?? 'Pilih...'}
            </span>
            <ChevronDown
              size={16}
              className={cn(
                'flex-shrink-0 text-gray-400 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="
              absolute top-full left-0 right-0 mt-1 z-50
              max-h-56 overflow-y-auto
              rounded-lg bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700/60
              shadow-lg
            ">
              {placeholder && (
                <button
                  type="button"
                  onClick={() => handleSelect('')}
                  className={cn(
                    "w-full text-left px-4 text-sm",
                    "py-2",
                    "text-gray-400 dark:text-gray-500 italic hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700/40"
                  )}
                >
                  {placeholder}
                </button>
              )}
              {options.map((opt) => {
                const isSelected = opt.value === currentValue
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between',
                      'px-4 text-sm text-left',
                      'py-2',
                      'transition-colors',
                      'border-b border-gray-100 dark:border-gray-700/40 last:border-0',
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                    )}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <Check size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
