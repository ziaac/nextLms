'use client'

import React, { Suspense } from 'react'
import { PageHeader } from '@/components/ui'
import { RekapKeuangan } from '@/components/pembayaran/RekapKeuangan'
import { RekapTagihanKelas } from '@/components/pembayaran/RekapTagihanKelas'

// ─── Error Boundary ───────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class LaporanErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Terjadi kesalahan
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {this.state.error?.message ?? 'Silakan muat ulang halaman.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Main Content ─────────────────────────────────────────────────

function LaporanContent() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan Keuangan"
        description="Rekap dan laporan keuangan sekolah"
      />

      {/* Section 1: Rekap Pembayaran */}
      <section className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Rekap Pembayaran
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Ringkasan transaksi pembayaran berdasarkan periode dan metode
          </p>
        </div>
        <RekapKeuangan />
      </section>

      {/* Section 2: Rekap Tagihan per Kelas */}
      <section className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Rekap Tagihan per Kelas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Rekap tagihan dan pembayaran berdasarkan kelas dan tahun ajaran
          </p>
        </div>
        <RekapTagihanKelas />
      </section>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────

export default function LaporanKeuanganPage() {
  return (
    <LaporanErrorBoundary>
      <Suspense fallback={<div className="flex justify-center py-12">Loading...</div>}>
        <LaporanContent />
      </Suspense>
    </LaporanErrorBoundary>
  )
}
