'use client'

import { Modal, Button, Spinner } from '@/components/ui'
import { AlertTriangle } from 'lucide-react'
import type { Kurikulum } from '@/types/kurikulum.types'

interface ActivateKurikulumModalProps {
  open:          boolean
  onClose:       () => void
  onConfirm:     () => Promise<void>
  targetItem:    Kurikulum | null
  currentActive: Kurikulum | null
  isPending:     boolean
}

export function ActivateKurikulumModal({
  open,
  onClose,
  onConfirm,
  targetItem,
  currentActive,
  isPending,
}: ActivateKurikulumModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aktifkan Kurikulum"
      size="sm"
      footer={
        <div className="flex gap-2 justify-end px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? <><Spinner />&nbsp;Mengaktifkan...</> : 'Ya, Aktifkan'}
          </Button>
        </div>
      }
    >
      <div className="px-6 py-5 flex gap-4">
        <div className="shrink-0 h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Kurikulum{' '}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              &ldquo;{targetItem?.nama}&rdquo;
            </span>{' '}
            akan diaktifkan.
          </p>
          {currentActive && currentActive.id !== targetItem?.id && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kurikulum yang saat ini aktif{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                &ldquo;{currentActive.nama}&rdquo;
              </span>{' '}
              akan dinonaktifkan secara otomatis.
            </p>
          )}
          <p className="text-xs text-gray-400">
            Semua RPP dan generate AI baru akan menggunakan format baku kurikulum ini.
          </p>
        </div>
      </div>
    </Modal>
  )
}
