'use client'

import { useRef } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value:      string          // "YYYY-MM-DD"
  onChange:   (v: string) => void
  min?:       string
  max?:       string
  disabled?:  boolean
  hasError?:  boolean
  className?: string
  placeholder?: string
  /** id untuk native input — dibutuhkan agar label bisa terhubung via htmlFor */
  id?:        string
  /** name untuk native input — dibutuhkan untuk form submission & autofill */
  name?:      string
  /** label teks — jika diisi, akan merender <label> yang terhubung ke input */
  label?:     string
}

/**
 * Styled date input — wraps native <input type="date"> dengan tampilan
 * custom yang konsisten, mengklik area manapun membuka native picker.
 */
export function DateInput({
  value, onChange, min, max, disabled, hasError, className,
  placeholder = 'Pilih tanggal', id, name, label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-generate id dari label jika tidak disediakan
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  // Format display: "Rabu, 20 April 2026" atau placeholder
  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex items-center gap-2 h-10 px-3 rounded-lg border bg-white dark:bg-gray-900',
          'cursor-pointer transition-colors',
          hasError
            ? 'border-red-400 dark:border-red-500'
            : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
        onClick={() => !disabled && inputRef.current?.showPicker?.()}
      >
        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
        <span className={cn(
          'flex-1 text-sm select-none',
          displayValue ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400',
        )}>
          {displayValue || placeholder}
        </span>

        {/* Native input — invisible but functional */}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="date"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label ?? placeholder}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ colorScheme: 'light dark' }}
        />
      </div>
    </div>
  )
}
