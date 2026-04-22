'use client'

import { useState, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string // Dibuat opsional karena bisa pakai children
  confirmLabel?: string
  isLoading?: boolean   // Diubah jadi isLoading agar sinkron dengan page.tsx
  variant?: 'danger' | 'warning'
  children?: ReactNode  // Ini untuk menampung elemen <p> dari page.tsx
}

export function ConfirmModal({
  open, 
  onClose, 
  onConfirm,
  title, 
  description,
  confirmLabel = 'Hapus',
  isLoading = false, // Default value
  variant = 'danger',
  children,          // SEKARANG SUDAH DIPANGGIL DI SINI
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark]   = useState(false)

  useEffect(() => {
    setMounted(true)
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isLoading) onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, isLoading, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className={isDark ? 'dark' : ''}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !isLoading && onClose()}
        />
        <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-400/40">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div className={cn(
              'w-11 h-11 rounded-2xl flex items-center justify-center',
              variant === 'danger'
                ? 'bg-red-100 dark:bg-red-950/50'
                : 'bg-yellow-100 dark:bg-yellow-950/50',
            )}>
              <AlertTriangle size={20} className={
                variant === 'danger' ? 'text-red-600' : 'text-yellow-600'
              } />
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              title="Tutup"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            
            {/* JIKA ADA CHILDREN (seperti di page.tsx), TAMPILKAN CHILDREN */}
            {children ? (
              <div className="mt-2">{children}</div>
            ) : (
              /* JIKA TIDAK ADA, PAKAI DESCRIPTION BIASA */
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-400/40">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              loading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}