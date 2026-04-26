import type { ReactNode } from 'react'

interface LabelProps {
  htmlFor?: string
  required?: boolean
  children: ReactNode
}

export function Label({ htmlFor, required, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

interface FieldProps {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
}

export function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full rounded-xl border ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 ${className}`}
      {...props}
    />
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function Select({ error, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full rounded-xl border ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-6 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
      {children}
    </h3>
  )
}
