'use client'

import { useEffect, useRef, useState } from 'react'
import { CreditCard, Smartphone, QrCode, Building2, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import {
  useCreateSnapToken,
  useCreateDokuCheckout,
  useDigitalPayment,
} from '@/hooks/pembayaran/usePembayaran'
import { usePublicSettings } from '@/hooks/pembayaran/useSystemSetting'
import { getErrorMessage, formatCurrency } from '@/lib/utils'
import type { Tagihan } from '@/types/pembayaran.types'
import type { MetodePembayaran } from '@/types/enums'

// ─── Global type augmentation for Midtrans Snap ───────────────────

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: {
            order_id: string
            transaction_id: string
            payment_type: string
          }) => void
          onError: (result: unknown) => void
          onClose: () => void
        }
      ) => void
    }
  }
}

// ─── Types ────────────────────────────────────────────────────────

type DigitalMetode = Extract<
  MetodePembayaran,
  'TRANSFER' | 'VIRTUAL_ACCOUNT' | 'QRIS' | 'MOBILE_BANKING'
>

type Step = 'pilih-metode' | 'loading' | 'sukses' | 'gagal'

interface MetodeOption {
  value: DigitalMetode
  label: string
  description: string
  icon: React.ReactNode
}

// ─── Constants ────────────────────────────────────────────────────

const METODE_OPTIONS: MetodeOption[] = [
  {
    value: 'TRANSFER',
    label: 'Transfer Bank',
    description: 'Transfer via ATM atau internet banking',
    icon: <Building2 size={22} />,
  },
  {
    value: 'VIRTUAL_ACCOUNT',
    label: 'Virtual Account',
    description: 'Bayar via nomor virtual account',
    icon: <CreditCard size={22} />,
  },
  {
    value: 'QRIS',
    label: 'QRIS',
    description: 'Scan QR code dengan aplikasi apapun',
    icon: <QrCode size={22} />,
  },
  {
    value: 'MOBILE_BANKING',
    label: 'Mobile Banking',
    description: 'Bayar langsung dari aplikasi m-banking',
    icon: <Smartphone size={22} />,
  },
]

// ─── ErrorBox ─────────────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/70 dark:border-red-800/50 px-4 py-3">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────

interface PaymentGatewayModalProps {
  open: boolean
  onClose: () => void
  tagihan: Tagihan
}

// ─── Component ────────────────────────────────────────────────────

export function PaymentGatewayModal({ open, onClose, tagihan }: PaymentGatewayModalProps) {
  const [step, setStep] = useState<Step>('pilih-metode')
  const [selectedMetode, setSelectedMetode] = useState<DigitalMetode | null>(null)
  const [gatewayError, setGatewayError] = useState<string | null>(null)
  const [digitalPaymentError, setDigitalPaymentError] = useState<string | null>(null)

  const scriptsLoadedRef = useRef(false)

  // ─── Hooks ──────────────────────────────────────────────────────

  const { data: settings } = usePublicSettings()
  const createSnapToken = useCreateSnapToken()
  const createDokuCheckout = useCreateDokuCheckout()
  const digitalPayment = useDigitalPayment()

  // ─── Derived settings ───────────────────────────────────────────

  const processorActive = settings?.find(
    (s) => s.key === 'payment.processor.active'
  )?.value

  const midtransEnabled =
    settings?.find((s) => s.key === 'payment.midtrans.enabled')?.value === 'true'

  const dokuEnabled =
    settings?.find((s) => s.key === 'payment.doku.enabled')?.value === 'true'

  const isMidtransProduction =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'

  const isDokuProduction =
    process.env.NEXT_PUBLIC_DOKU_IS_PRODUCTION === 'true'

  // ─── Load CDN scripts ───────────────────────────────────────────

  useEffect(() => {
    if (!open || scriptsLoadedRef.current) return

    // Load Midtrans Snap script
    if (midtransEnabled) {
      const midtransScriptId = 'midtrans-snap-script'
      if (!document.getElementById(midtransScriptId)) {
        const snapUrl = isMidtransProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js'

        const script = document.createElement('script')
        script.id = midtransScriptId
        script.src = snapUrl
        script.setAttribute(
          'data-client-key',
          process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ''
        )
        document.head.appendChild(script)
      }
    }

    // Load Doku Checkout script
    if (dokuEnabled) {
      const dokuScriptId = 'doku-checkout-script'
      if (!document.getElementById(dokuScriptId)) {
        const dokuUrl = isDokuProduction
          ? 'https://checkout.doku.com/checkout/v1/checkout.js'
          : 'https://sandbox.doku.com/checkout/v1/checkout.js'

        const script = document.createElement('script')
        script.id = dokuScriptId
        script.src = dokuUrl
        document.head.appendChild(script)
      }
    }

    scriptsLoadedRef.current = true
  }, [open, midtransEnabled, dokuEnabled, isMidtransProduction, isDokuProduction])

  // ─── Reset state on open/close ──────────────────────────────────

  useEffect(() => {
    if (!open) return
    setStep('pilih-metode')
    setSelectedMetode(null)
    setGatewayError(null)
    setDigitalPaymentError(null)
    scriptsLoadedRef.current = false
  }, [open])

  // ─── Handlers ───────────────────────────────────────────────────

  function handleRetry() {
    setStep('pilih-metode')
    setSelectedMetode(null)
    setGatewayError(null)
    setDigitalPaymentError(null)
  }

  async function handleLanjutkan() {
    if (!selectedMetode) return

    setGatewayError(null)
    setDigitalPaymentError(null)
    setStep('loading')

    const jumlahBayar = Number(tagihan.sisaBayar)

    try {
      if (processorActive === 'midtrans') {
        // ── Midtrans flow ──────────────────────────────────────────
        const snapData = await createSnapToken.mutateAsync({
          tagihanId: tagihan.id,
          jumlahBayar,
          metodePembayaran: selectedMetode,
        })

        window.snap?.pay(snapData.snapToken, {
          onSuccess: async (result) => {
            // Kirim referensi dari gateway ke backend — tidak dimodifikasi
            const referensiBank = result.transaction_id
            try {
              await digitalPayment.mutateAsync({
                tagihanId: tagihan.id,
                jumlahBayar,
                metodePembayaran: selectedMetode,
                tanggalBayar: new Date().toISOString().slice(0, 10),
                referensiBank,
              })
              setStep('sukses')
            } catch (err) {
              setDigitalPaymentError(getErrorMessage(err))
              setStep('gagal')
            }
          },
          onError: (result) => {
            const msg =
              typeof result === 'object' &&
              result !== null &&
              'message' in result &&
              typeof (result as Record<string, unknown>).message === 'string'
                ? (result as Record<string, string>).message
                : 'Pembayaran gagal diproses oleh gateway'
            setGatewayError(msg)
            setStep('gagal')
          },
          onClose: () => {
            setGatewayError('Pembayaran dibatalkan. Silakan coba lagi.')
            setStep('gagal')
          },
        })
      } else if (processorActive === 'doku') {
        // ── Doku flow ─────────────────────────────────────────────
        const dokuData = await createDokuCheckout.mutateAsync({
          tagihanId: tagihan.id,
          jumlahBayar,
          metodePembayaran: selectedMetode,
        })

        window.location.href = dokuData.checkoutUrl
      } else {
        setGatewayError('Payment gateway tidak dikonfigurasi. Hubungi administrator.')
        setStep('gagal')
      }
    } catch (err) {
      setGatewayError(getErrorMessage(err))
      setStep('gagal')
    }
  }

  // ─── Render helpers ─────────────────────────────────────────────

  const isLoading =
    step === 'loading' ||
    createSnapToken.isPending ||
    createDokuCheckout.isPending ||
    digitalPayment.isPending

  const namaKategori = tagihan.kategoriPembayaran?.nama ?? 'Tagihan'
  const jumlahBayar = Number(tagihan.sisaBayar)

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pembayaran Digital"
      description={`${namaKategori} — ${formatCurrency(jumlahBayar)}`}
      size="md"
      bodyClassName="px-6 py-5"
      footer={
        step === 'pilih-metode' ? (
          <>
            <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleLanjutkan}
              disabled={!selectedMetode || isLoading}
              loading={isLoading}
            >
              Lanjutkan
            </Button>
          </>
        ) : step === 'gagal' ? (
          <>
            <Button variant="secondary" onClick={onClose} type="button">
              Tutup
            </Button>
            <Button
              type="button"
              variant="primary"
              leftIcon={<RefreshCw size={14} />}
              onClick={handleRetry}
            >
              Coba Lagi
            </Button>
          </>
        ) : step === 'sukses' ? (
          <Button type="button" onClick={onClose}>
            Selesai
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        {/* ── Step: Pilih Metode ─────────────────────────────────── */}
        {step === 'pilih-metode' && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pilih metode pembayaran digital yang ingin digunakan:
            </p>
            <div className="grid grid-cols-1 gap-3">
              {METODE_OPTIONS.map((opt) => {
                const isSelected = selectedMetode === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedMetode(opt.value)}
                    className={[
                      'flex items-center gap-4 w-full rounded-xl border-2 px-4 py-3 text-left transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800/50',
                    ].join(' ')}
                    aria-pressed={isSelected}
                  >
                    <span
                      className={[
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                        isSelected
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
                      ].join(' ')}
                    >
                      {opt.icon}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span
                        className={[
                          'block text-sm font-medium',
                          isSelected
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-gray-900 dark:text-white',
                        ].join(' ')}
                      >
                        {opt.label}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {opt.description}
                      </span>
                    </span>
                    {isSelected && (
                      <span className="flex-shrink-0 text-emerald-500 dark:text-emerald-400">
                        <CheckCircle2 size={20} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* ── Step: Loading ──────────────────────────────────────── */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Memproses pembayaran, harap tunggu…
            </p>
          </div>
        )}

        {/* ── Step: Sukses ───────────────────────────────────────── */}
        {step === 'sukses' && (
          <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                Pembayaran Berhasil
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Transaksi Anda telah berhasil diproses dan dicatat.
              </p>
            </div>
          </div>
        )}

        {/* ── Step: Gagal ────────────────────────────────────────── */}
        {step === 'gagal' && (
          <div className="space-y-4 py-2">
            {/* Error dari gateway (inline) */}
            {gatewayError && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Pembayaran tidak berhasil
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  {gatewayError}
                </p>
              </div>
            )}

            {/* Error dari POST /pembayaran/digital */}
            {digitalPaymentError && (
              <ErrorBox message={digitalPaymentError} />
            )}

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Klik <strong>Coba Lagi</strong> untuk kembali ke pemilihan metode pembayaran.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
