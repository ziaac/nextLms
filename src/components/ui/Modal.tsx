'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  fullHeight?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  /** Class tambahan untuk body scrollable. Gunakan untuk set padding, misal 'px-6 py-5' */
  bodyClassName?: string
}

const SIZE = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-lg',
  xl:  'max-w-2xl',
  '2xl': 'max-w-5xl',
}

export function Modal({ open, onClose, title, description, size = 'md', fullHeight, children, footer, bodyClassName }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
  <div className={isDark ? 'dark' : ''}>
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className={cn(
        'relative w-full flex flex-col',
        fullHeight
          ? 'h-[calc(100vh-32px)]'
          : 'max-h-[90vh]',
        'bg-white dark:bg-gray-900',
        'rounded-2xl shadow-2xl',
        'border border-gray-200 dark:border-gray-400/40',
        SIZE[size],
      )}>

        {/* Header — sticky */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-400/40 flex-shrink-0">
          <div className="space-y-0.5 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            title="Close"
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {/* Body — scrollable */}
        <div className={cn('overflow-y-auto flex-1 min-h-0', bodyClassName)}>
          {children}
        </div>

        {/* Footer — sticky, via prop */}
        {footer && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-400/40 flex-shrink-0 rounded-b-2xl"
            style={{ backgroundColor: isDark ? 'rgb(17, 24, 39)' : 'white' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  </div>,
  document.body,
)
}

// ModalFooter tetap ada untuk backward compatibility
export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-400/40 bg-white dark:bg-gray-900 flex-shrink-0 rounded-b-2xl">
      {children}
    </div>
  )
}