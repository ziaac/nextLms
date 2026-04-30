'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, Send, Users, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Select } from '@/components/ui'
import type { SelectOption } from '@/components/ui/Select'
import { broadcastNotifikasi } from '@/lib/api/notifikasi.api'

const ROLE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Semua Pengguna' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'KEPALA_SEKOLAH', label: 'Kepala Sekolah' },
  { value: 'WAKIL_KEPALA', label: 'Wakil Kepala' },
  { value: 'STAFF_TU', label: 'Staff TU' },
  { value: 'STAFF_KEUANGAN', label: 'Staff Keuangan' },
  { value: 'GURU', label: 'Guru' },
  { value: 'WALI_KELAS', label: 'Wali Kelas' },
  { value: 'SISWA', label: 'Siswa' },
  { value: 'ORANG_TUA', label: 'Orang Tua' },
]

export default function BroadcastNotifikasiPage() {
  const router = useRouter()
  const [judul, setJudul] = useState('')
  const [pesan, setPesan] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!judul.trim() || !pesan.trim()) {
      toast.error('Judul dan pesan wajib diisi')
      return
    }
    setIsLoading(true)
    try {
      const result = await broadcastNotifikasi({
        judul: judul.trim(),
        pesan: pesan.trim(),
        ...(targetRole && { targetRole }),
        ...(actionUrl.trim() && { actionUrl: actionUrl.trim() }),
      })
      toast.success(result.message)
      setJudul('')
      setPesan('')
      setTargetRole('')
      setActionUrl('')
    } catch {
      toast.error('Gagal mengirim broadcast notifikasi')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedRoleLabel = ROLE_OPTIONS.find((o) => o.value === targetRole)?.label

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Megaphone size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Broadcast Notifikasi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kirim notifikasi massal ke pengguna
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-5">

          {/* Target Role */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Users size={14} />
              Target Penerima
            </label>
            <Select
              options={ROLE_OPTIONS}
              value={targetRole}
              placeholder="Semua Pengguna"
              onChange={(e) => setTargetRole(e.target.value)}
            />
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Kosongkan untuk mengirim ke semua pengguna aktif
            </p>
          </div>

          {/* Judul */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              maxLength={100}
              placeholder="Contoh: Pengumuman Libur Nasional"
              className="
                w-full h-10 px-3 rounded-lg text-sm
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700/60
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                transition-colors
              "
            />
            <p className="text-xs text-gray-400 dark:text-gray-600 text-right">
              {judul.length}/100
            </p>
          </div>

          {/* Pesan */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pesan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Tulis isi notifikasi di sini..."
              className="
                w-full px-3 py-2.5 rounded-lg text-sm resize-none
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700/60
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                transition-colors
              "
            />
            <p className="text-xs text-gray-400 dark:text-gray-600 text-right">
              {pesan.length}/500
            </p>
          </div>

          {/* Action URL (opsional) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Link Tujuan{' '}
              <span className="text-xs font-normal text-gray-400">(opsional)</span>
            </label>
            <input
              type="text"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="Contoh: /dashboard/pengumuman/123"
              className="
                w-full h-10 px-3 rounded-lg text-sm
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700/60
                text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                transition-colors
              "
            />
            <p className="text-xs text-gray-400 dark:text-gray-600">
              URL halaman yang akan dibuka saat notifikasi diklik
            </p>
          </div>
        </div>

        {/* Preview */}
        {(judul || pesan) && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 space-y-1">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Preview Notifikasi
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {judul || '—'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pesan || '—'}
            </p>
            {targetRole && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                Dikirim ke: {selectedRoleLabel}
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          loading={isLoading}
          disabled={!judul.trim() || !pesan.trim()}
          leftIcon={<Send size={14} />}
          className="w-full"
        >
          Kirim Broadcast
        </Button>
      </form>
    </div>
  )
}
