'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { CheckCircle, RefreshCw } from 'lucide-react'
import { ThemeToggle } from '@/components/dashboard/ThemeToggle'
import type { VerifikasiIdentitasResult, BiodataSiswaBaru } from '@/types/pendaftaran.types'
import { pendaftaranPublicApi } from '@/lib/api/pendaftaran.api'
import { AuthForm } from './_components/AuthForm'
import { FormBiodata } from './_components/FormBiodata'

const LOGO_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_logoman-150h.png'

type Stage = 'auth' | 'form' | 'done'

const JALUR_LABEL: Record<string, string> = {
  ZONASI:       'Zonasi',
  PRESTASI:     'Prestasi',
  AFIRMASI:     'Afirmasi',
  PERPINDAHAN:  'Perpindahan',
  REGULER:      'Reguler',
}

export default function SiswaBaruPage() {
  const [stage, setStage]         = useState<Stage>('auth')
  const [session, setSession]     = useState<VerifikasiIdentitasResult | null>(null)
  const [biodata, setBiodata]     = useState<BiodataSiswaBaru | null>(null)
  const [doneStatus, setDoneStatus] = useState<'draft' | 'diajukan'>('draft')
  const [loadingBiodata, setLoadingBiodata] = useState(false)

  const handleAuthSuccess = useCallback(async (result: VerifikasiIdentitasResult) => {
    setSession(result)

    // If they have an existing biodata, fetch it
    if (result.biodataId) {
      setLoadingBiodata(true)
      try {
        const existing = await pendaftaranPublicApi.updateBiodata(result.biodataId, {}) as unknown as BiodataSiswaBaru
        setBiodata(existing)
      } catch {
        setBiodata(null)
      } finally {
        setLoadingBiodata(false)
      }
    }

    setStage('form')
  }, [])

  const handleDone = useCallback((status: 'draft' | 'diajukan') => {
    setDoneStatus(status)
    setStage('done')
  }, [])

  const handleReset = useCallback(() => {
    setStage('auth')
    setSession(null)
    setBiodata(null)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9">
              <Image src={LOGO_URL} alt="Logo MAN 2" fill className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">MAN 2 Kota Makassar</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pendaftaran Siswa Baru</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stage !== 'auth' && (
              <button
                onClick={handleReset}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <RefreshCw size={12} /> Keluar
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* ── AUTH STAGE ── */}
        {stage === 'auth' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-7">
              <div className="relative h-16 w-16 mx-auto mb-4">
                <Image src={LOGO_URL} alt="Logo MAN 2 Kota Makassar" fill className="object-contain" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Masuk ke Formulir Pendaftaran</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Masukkan nomor pendaftaran dan tanggal lahir yang telah diberikan oleh sekolah.
              </p>
            </div>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        )}

        {/* ── FORM STAGE ── */}
        {stage === 'form' && session && (
          <div>
            {/* Student info bar */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-4 py-3 mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{session.nama}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  No. Pendaftaran: <span className="font-mono font-semibold">{session.noPendaftaran}</span>
                  {session.jalurPendaftaran && (
                    <> &bull; {JALUR_LABEL[session.jalurPendaftaran] ?? session.jalurPendaftaran}</>
                  )}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-medium">
                {session.tahunAjaran.nama}
              </span>
            </div>

            {loadingBiodata ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center">
                <span className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-sm">
                <FormBiodata
                  session={session}
                  existingBiodata={biodata}
                  onDone={handleDone}
                />
              </div>
            )}
          </div>
        )}

        {/* ── DONE STAGE ── */}
        {stage === 'done' && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-sm">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 mb-5">
              <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            {doneStatus === 'diajukan' ? (
              <>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Formulir Berhasil Dikirim</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Data Anda telah kami terima dan sedang dalam proses verifikasi oleh pihak sekolah.
                  Anda akan dihubungi melalui nomor telepon yang terdaftar.
                </p>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                  Simpan nomor pendaftaran Anda untuk keperluan verifikasi selanjutnya.
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Draf Tersimpan</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Data Anda telah disimpan sebagai draf. Login kembali menggunakan nomor pendaftaran
                  dan tanggal lahir untuk melanjutkan dan mengirimkan formulir.
                </p>
              </>
            )}
            <button
              onClick={handleReset}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Kembali ke halaman awal
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
