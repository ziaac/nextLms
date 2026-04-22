'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter }       from 'next/navigation'
import { useQueryClient }  from '@tanstack/react-query'
import { Html5Qrcode }     from 'html5-qrcode'
import { scanQR, getSesiDetail } from '@/lib/api/absensi.api'
import {
  MapPin, Camera, CheckCircle2, XCircle,
  AlertTriangle, Loader2, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Step =
  | 'gps-request'
  | 'gps-denied'
  | 'scanning'
  | 'submitting'
  | 'success'
  | 'error'

const SCAN_ERRORS: Record<number, string> = {
  400: 'Kamu berada di luar area absensi.',
  403: 'Kamu bukan bagian dari kelas ini.',
  404: 'Token QR sudah kadaluarsa.',
  409: 'Kamu sudah tercatat hadir untuk sesi ini.',
}

export default function ScanKameraPage() {
  const router      = useRouter()
  const queryClient = useQueryClient()

  const [step,     setStep]     = useState<Step>('gps-request')
  const [coords,   setCoords]   = useState<{ lat: number; lng: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const scannerRef  = useRef<Html5Qrcode | null>(null)
  const scannedRef  = useRef(false)   // guard agar tidak double-submit
  const divId       = 'qr-reader'

  // ── Step 1: Request GPS ───────────────────────────────────────────────────
  const requestGps = useCallback(() => {
    setStep('gps-request')
    if (!navigator.geolocation) {
      // GPS tidak tersedia — tetap lanjut scan, akan dicek saat submit
      setStep('scanning')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStep('scanning')
      },
      () => {
        // GPS denied — tetap lanjut scan kamera
        // Jika sesi ternyata QR_LURING, akan error saat submit
        setCoords(null)
        setStep('scanning')
      },
      { timeout: 10_000, enableHighAccuracy: true, maximumAge: 0 },
    )
  }, [])

  // Auto-request GPS saat halaman dibuka
  useEffect(() => {
    // Delay kecil agar page fully mounted (penting iOS)
    const t = setTimeout(() => requestGps(), 400)
    return () => clearTimeout(t)
  }, [requestGps])

  // ── Step 2: Buka kamera scanner ───────────────────────────────────────────
  useEffect(() => {
    if (step !== 'scanning') return

    const scanner = new Html5Qrcode(divId)
    scannerRef.current = scanner
    scannedRef.current = false

    scanner.start(
      { facingMode: 'environment' },  // kamera belakang
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (scannedRef.current) return
        scannedRef.current = true

        // Stop scanner — ignore error jika sudah stopped
        try {
          if (scanner.isScanning) await scanner.stop()
        } catch { /* ignore */ }

        // Extract token dari URL yang di-encode di QR
        // Format: https://domain.com/dashboard/absensi/scan?token=xxx
        let token = decodedText
        try {
          const url = new URL(decodedText)
          token = url.searchParams.get('token') ?? decodedText
        } catch {
          // Jika bukan URL valid, anggap langsung token
        }

        if (!token) {
          setErrorMsg('QR tidak valid — bukan QR absensi.')
          setStep('error')
          return
        }

        // ── Step 3: Cek requireGps dari detail sesi ─────────────────────
        setStep('submitting')
        try {
          const sesiDetail = await getSesiDetail(token)
          const needGps    = sesiDetail.sesi.requireGps

          // Jika perlu GPS tapi belum ada coords → error
          if (needGps && !coords) {
            setErrorMsg('Sesi ini memerlukan GPS. Kembali dan aktifkan GPS terlebih dahulu.')
            setStep('error')
            return
          }

          // ── Step 4: Submit ──────────────────────────────────────────────
          await scanQR({
            token,
            latitude:  needGps ? coords?.lat : undefined,
            longitude: needGps ? coords?.lng : undefined,
          })
          setStep('success')

          void queryClient.invalidateQueries({ queryKey: ['absensi', 'my-status-hari-ini'] })
          setTimeout(() => router.replace('/dashboard/absensi/siswa'), 3000)
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response?.status
          setErrorMsg(SCAN_ERRORS[status ?? -1] ?? 'Terjadi kesalahan. Coba lagi.')
          setStep('error')
        }
      },
      () => { /* QR belum terbaca, abaikan */ },
    ).catch(() => {
      setErrorMsg('Gagal membuka kamera. Pastikan izin kamera sudah diberikan.')
      setStep('error')
    })

    return () => {
      try {
        if (scanner.isScanning) scanner.stop().catch(() => { /* ignore */ })
      } catch { /* ignore */ }
    }
  }, [step, coords, router])

  // ── UI per step ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 bg-gray-900 border-b border-gray-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-white">Scan QR Absensi</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">

        {/* GPS requesting */}
        {step === 'gps-request' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-blue-900/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
            <div>
              <p className="text-white font-semibold">Mengaktifkan GPS...</p>
              <p className="text-gray-400 text-sm mt-1">
                Izinkan akses lokasi saat browser meminta
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-900/20 border border-blue-800 rounded-lg px-4 py-2.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              GPS diperlukan untuk verifikasi kehadiran di lokasi
            </div>
          </div>
        )}

        {/* Scanning — viewfinder kamera */}
        {step === 'scanning' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800 rounded-full px-3 py-1.5">
              <MapPin className="h-3 w-3" />
              GPS aktif — arahkan kamera ke QR Code
            </div>

            {/* QR Reader container */}
            <div className="relative w-full max-w-sm">
              <div
                id={divId}
                className="w-full rounded-2xl overflow-hidden border-2 border-emerald-500/50"
              />
              {/* Corner overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              </div>
            </div>

            <p className="text-gray-400 text-xs text-center">
              Posisikan QR Code dalam bingkai kamera
            </p>
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-900/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            </div>
            <div>
              <p className="text-white font-semibold">Mencatat kehadiran...</p>
              <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
            </div>
          </div>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <p className="text-white text-xl font-bold">Absensi Tercatat!</p>
              <p className="text-gray-400 text-sm mt-1">
                Kehadiran kamu berhasil dicatat. Selamat belajar!
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Kembali ke halaman absensi dalam 3 detik...
            </p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div className="h-16 w-16 rounded-full bg-red-900/30 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Absensi Gagal</p>
              <p className="text-gray-400 text-sm mt-1">{errorMsg}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => router.back()}>
                Kembali
              </Button>
              <Button
                variant="primary" size="sm"
                onClick={() => {
                  scannedRef.current = false
                  setErrorMsg('')
                  setStep('scanning')
                }}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                Scan Ulang
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
