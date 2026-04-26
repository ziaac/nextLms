'use client'

import { useState, useRef, useCallback } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { AlertCircle, LogIn } from 'lucide-react'
import { Select } from '@/components/ui'
import { pendaftaranPublicApi } from '@/lib/api/pendaftaran.api'
import type { VerifikasiIdentitasResult } from '@/types/pendaftaran.types'

const HCAPTCHA_SITE_KEY = 'd8fe199c-0686-469e-ba0e-312e57b4ff9e'
// Di localhost / development, skip captcha agar tidak perlu solve tiap test
const SKIP_CAPTCHA = process.env.NODE_ENV === 'development'

const currentYear = new Date().getFullYear()

const DAY_OPTIONS   = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1).padStart(2, '0') }))
const MONTH_OPTIONS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
].map((m, i) => ({ value: String(i + 1), label: m }))
const YEAR_OPTIONS  = Array.from({ length: currentYear - 2000 + 1 }, (_, i) => currentYear - i)
  .map((y) => ({ value: String(y), label: String(y) }))

interface Props {
  onSuccess: (result: VerifikasiIdentitasResult) => void
}

export function AuthForm({ onSuccess }: Props) {
  const [noPendaftaran, setNoPendaftaran] = useState('')
  const [day, setDay]     = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear]   = useState('')
  const [captchaToken, setCaptchaToken]   = useState<string | null>(SKIP_CAPTCHA ? 'dev-bypass' : null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!noPendaftaran.trim()) { setError('Nomor pendaftaran wajib diisi.'); return }
    if (!day || !month || !year) { setError('Tanggal lahir wajib diisi lengkap.'); return }
    if (!SKIP_CAPTCHA && !captchaToken) { setError('Selesaikan verifikasi captcha terlebih dahulu.'); return }

    const dd = String(day).padStart(2, '0')
    const mm = String(month).padStart(2, '0')
    const tanggalLahir = `${year}-${mm}-${dd}`

    setLoading(true)
    try {
      const result = await pendaftaranPublicApi.verifikasiIdentitas({
        noPendaftaran: noPendaftaran.trim().toUpperCase(),
        tanggalLahir,
      })
      onSuccess(result)
    } catch (err: unknown) {
      if (!SKIP_CAPTCHA) captchaRef.current?.resetCaptcha()
      setCaptchaToken(SKIP_CAPTCHA ? 'dev-bypass' : null)
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg ?? 'Data tidak ditemukan. Periksa kembali nomor pendaftaran dan tanggal lahir.')
    } finally {
      setLoading(false)
    }
  }, [noPendaftaran, day, month, year, captchaToken, onSuccess])

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nomor Pendaftaran */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Nomor Pendaftaran
        </label>
        <input
          type="text"
          value={noPendaftaran}
          onChange={(e) => setNoPendaftaran(e.target.value.toUpperCase())}
          placeholder="Contoh: 2025-001"
          className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          autoComplete="off"
          autoFocus
        />
      </div>

      {/* Tanggal Lahir */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tanggal Lahir
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Select
            size="sm"
            placeholder="Tgl"
            options={DAY_OPTIONS}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
          <Select
            size="sm"
            placeholder="Bulan"
            options={MONTH_OPTIONS}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
          <Select
            size="sm"
            placeholder="Tahun"
            options={YEAR_OPTIONS}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          Gunakan tanggal lahir sesuai akta kelahiran.
        </p>
      </div>

      {/* hCaptcha — disembunyikan di localhost/dev */}
      {!SKIP_CAPTCHA && (
        <div className="flex justify-center">
          <HCaptcha
            ref={captchaRef}
            sitekey={HCAPTCHA_SITE_KEY}
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 text-sm transition-colors"
      >
        {loading ? (
          <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <LogIn size={16} />
        )}
        {loading ? 'Memverifikasi...' : 'Masuk ke Formulir'}
      </button>
    </form>
  )
}
