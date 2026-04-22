'use client'

import { Combobox } from '@/components/ui'
import type { ComboboxOption } from '@/components/ui'

interface Props {
  value:     string   // "HH:mm"
  onChange:  (val: string) => void
  disabled?: boolean
  hasError?: boolean
}

const HOURS: ComboboxOption[] = Array.from(
  { length: 15 },
  (_, i) => {
    const h = String(i + 6).padStart(2, '0')
    return { label: h, value: h }
  },
)  // 06 – 20

const MINUTES: ComboboxOption[] = [
  '00', '05', '10', '15', '20', '25',
  '30', '35', '40', '45', '50', '55',
].map((m) => ({ label: m, value: m }))

export function TimePicker({ value, onChange, disabled, hasError }: Props) {
  const parts  = (value ?? '').split(':')
  const hour   = parts[0] ?? ''
  const minute = parts[1] ?? ''

  return (
    <div className="flex items-center gap-2">
      {/* Jam */}
      <Combobox
        options={HOURS}
        value={hour}
        onChange={(h) => onChange(h + ':' + (minute || '00'))}
        placeholder="HH"
        disabled={disabled}
        hasError={hasError && !hour}
      />

      <span className="text-base font-bold text-gray-400 select-none leading-none shrink-0">
        :
      </span>

      {/* Menit */}
      <Combobox
        options={MINUTES}
        value={minute}
        onChange={(m) => onChange((hour || '07') + ':' + m)}
        placeholder="MM"
        disabled={disabled}
        hasError={hasError && !minute}
      />
    </div>
  )
}
