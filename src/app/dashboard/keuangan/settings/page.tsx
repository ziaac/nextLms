'use client'

import { useState, useCallback, useEffect, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Settings, CheckCircle, XCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Select, Skeleton, ConfirmModal, PageHeader } from '@/components/ui'
import { useAllSettings, useUpdateSetting } from '@/hooks/pembayaran/useSystemSetting'
import { getErrorMessage } from '@/lib/utils'
import type { SystemSetting, PaymentProcessor } from '@/types/pembayaran.types'

// ─── Error Boundary ───────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class PaymentSettingsErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PaymentSettings Error Boundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <XCircle size={48} className="text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Terjadi Kesalahan
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            {this.state.error?.message ?? 'Halaman pengaturan tidak dapat dimuat.'}
          </p>
          <Button
            variant="secondary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Coba Lagi
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Status Badge ─────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">
        <CheckCircle size={12} />
        Aktif
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
      <XCircle size={12} />
      Nonaktif
    </span>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────────

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id: string
}

function ToggleSwitch({ checked, onChange, disabled, id }: ToggleSwitchProps) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`w-11 h-6 rounded-full transition-colors duration-200 ${
          checked
            ? 'bg-emerald-500'
            : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  )
}

// ─── Skeleton Loading ─────────────────────────────────────────────

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────

function PaymentSettingsContent() {
  const { data: settings = [], isLoading, error } = useAllSettings()
  const updateSetting = useUpdateSetting()

  // State untuk konfirmasi perubahan processor
  const [pendingProcessor, setPendingProcessor] = useState<PaymentProcessor | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Tampilkan error fetch
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error))
    }
  }, [error])

  // Helper: ambil nilai setting berdasarkan key
  const getSettingValue = useCallback(
    (key: string): string => {
      const setting = settings.find((s: SystemSetting) => s.key === key)
      return setting?.value ?? ''
    },
    [settings],
  )

  const activeProcessor = getSettingValue('payment.processor.active') as PaymentProcessor | ''
  const midtransEnabled = getSettingValue('payment.midtrans.enabled') === 'true'
  const dokuEnabled = getSettingValue('payment.doku.enabled') === 'true'

  // Handler: toggle enabled/disabled (langsung simpan tanpa konfirmasi)
  const handleToggle = useCallback(
    async (key: string, newValue: boolean) => {
      try {
        await updateSetting.mutateAsync({ key, value: newValue ? 'true' : 'false' })
        toast.success('Pengaturan berhasil disimpan')
      } catch (err) {
        toast.error(getErrorMessage(err))
      }
    },
    [updateSetting],
  )

  // Handler: perubahan processor — simpan ke state dulu, tampilkan konfirmasi
  const handleProcessorChange = useCallback((value: string) => {
    if (value === activeProcessor || value === '') return
    setPendingProcessor(value as PaymentProcessor)
    setConfirmOpen(true)
  }, [activeProcessor])

  // Handler: konfirmasi ganti processor
  const handleConfirmProcessor = useCallback(async () => {
    if (!pendingProcessor) return
    try {
      await updateSetting.mutateAsync({
        key: 'payment.processor.active',
        value: pendingProcessor,
      })
      toast.success(`Payment gateway aktif diubah ke ${pendingProcessor}`)
      setConfirmOpen(false)
      setPendingProcessor(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
      setConfirmOpen(false)
      setPendingProcessor(null)
    }
  }, [pendingProcessor, updateSetting])

  // Handler: batalkan konfirmasi — reset ke nilai sebelumnya
  const handleCancelProcessor = useCallback(() => {
    setConfirmOpen(false)
    setPendingProcessor(null)
  }, [])

  if (isLoading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Payment Gateway"
        description="Kelola konfigurasi payment gateway yang digunakan untuk pembayaran digital"
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Processor Aktif:{' '}
              <span className="capitalize">{activeProcessor || '-'}</span>
            </span>
          </div>
        }
      />

      {/* Status Koneksi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Midtrans Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <Settings size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Midtrans</span>
            </div>
            <StatusBadge active={midtransEnabled} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activeProcessor === 'midtrans'
              ? 'Sedang digunakan sebagai processor aktif'
              : 'Tidak digunakan sebagai processor aktif'}
          </p>
        </div>

        {/* Doku Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center">
                <Settings size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Doku</span>
            </div>
            <StatusBadge active={dokuEnabled} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {activeProcessor === 'doku'
              ? 'Sedang digunakan sebagai processor aktif'
              : 'Tidak digunakan sebagai processor aktif'}
          </p>
        </div>
      </div>

      {/* Pengaturan */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-6">
          Konfigurasi Payment Gateway
        </h2>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {/* Processor Aktif */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 first:pt-0">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Processor Aktif
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Payment gateway yang digunakan untuk memproses pembayaran digital siswa.
                Perubahan ini berdampak langsung pada proses pembayaran.
              </p>
              <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                payment.processor.active
              </code>
            </div>
            <div className="sm:w-48 flex-shrink-0">
              <Select
                value={pendingProcessor ?? activeProcessor}
                onChange={(e) => handleProcessorChange(e.target.value)}
                options={[
                  { value: 'midtrans', label: 'Midtrans' },
                  { value: 'doku', label: 'Doku' },
                ]}
                placeholder="Pilih processor"
                disabled={updateSetting.isPending}
              />
            </div>
          </div>

          {/* Midtrans Enabled */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Aktifkan Midtrans
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mengaktifkan atau menonaktifkan integrasi Midtrans sebagai payment gateway.
              </p>
              <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                payment.midtrans.enabled
              </code>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {midtransEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
              <ToggleSwitch
                id="toggle-midtrans"
                checked={midtransEnabled}
                onChange={(checked) => handleToggle('payment.midtrans.enabled', checked)}
                disabled={updateSetting.isPending}
              />
            </div>
          </div>

          {/* Doku Enabled */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-5 last:pb-0">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Aktifkan Doku
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mengaktifkan atau menonaktifkan integrasi Doku sebagai payment gateway.
              </p>
              <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                payment.doku.enabled
              </code>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {dokuEnabled ? 'Aktif' : 'Nonaktif'}
              </span>
              <ToggleSwitch
                id="toggle-doku"
                checked={dokuEnabled}
                onChange={(checked) => handleToggle('payment.doku.enabled', checked)}
                disabled={updateSetting.isPending}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Konfirmasi Ganti Processor */}
      <ConfirmModal
        open={confirmOpen}
        onClose={handleCancelProcessor}
        onConfirm={handleConfirmProcessor}
        title="Ganti Payment Gateway Aktif"
        confirmLabel="Ya, Ganti"
        isLoading={updateSetting.isPending}
        variant="warning"
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Anda akan mengganti processor aktif ke{' '}
          <span className="font-semibold text-gray-700 dark:text-gray-300 capitalize">
            {pendingProcessor}
          </span>
          . Perubahan ini akan langsung berdampak pada proses pembayaran digital siswa.
          Pastikan konfigurasi{' '}
          <span className="font-semibold capitalize">{pendingProcessor}</span> sudah benar
          sebelum melanjutkan.
        </p>
      </ConfirmModal>
    </div>
  )
}

// ─── Page Export ──────────────────────────────────────────────────

export default function PaymentSettingsPage() {
  return (
    <PaymentSettingsErrorBoundary>
      <PaymentSettingsContent />
    </PaymentSettingsErrorBoundary>
  )
}
