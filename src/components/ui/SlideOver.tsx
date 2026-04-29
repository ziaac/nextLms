'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlideOverProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  width?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const WIDTH = {
  sm:  'max-w-sm',
  md:  'max-w-md',
  lg:  'max-w-2xl',
  xl:  'max-w-4xl',
}

export function SlideOver({
  open, onClose, title, description, width = 'md', children,
}: SlideOverProps) {

  useEffect(() => {
    if (!open) return
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed top-0 right-0 z-50 flex flex-col',
          'h-dvh w-full',
          'bg-white dark:bg-gray-900',
          'border-l border-gray-200 dark:border-gray-700',
          'shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          WIDTH[width],
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex-shrink-0 flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-0.5 pr-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}