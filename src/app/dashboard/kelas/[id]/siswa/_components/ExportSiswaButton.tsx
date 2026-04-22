'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui'
import { toast } from 'sonner'
import api from '@/lib/axios'
import type { ExportBiodataSiswaResponse } from '@/lib/api/kelas-siswa.api'

interface Props {
  kelasId: string
  namaKelas: string
}

export function ExportSiswaButton({ kelasId, namaKelas }: Props) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await api.get<ExportBiodataSiswaResponse[]>(
        `/kelas/${kelasId}/siswa/export`
      )
      const data = response.data

      if (!data || data.length === 0) {
        toast.warning('Tidak ada data siswa untuk diekspor')
        return
      }

      // Dinamis import xlsx agar tidak menambah bundle size
      const XLSX = await import('xlsx')

      // Buat workbook
      const wb = XLSX.utils.book_new()

      // Sheet 1: Data siswa
      const ws = XLSX.utils.json_to_sheet(data)

      // Set lebar kolom otomatis berdasarkan konten
      const cols = Object.keys(data[0]).map((key) => ({
        wch: Math.max(
          key.length,
          ...data.map((row) => String(row[key as keyof ExportBiodataSiswaResponse] ?? '').length)
        ) + 2,
      }))
      ws['!cols'] = cols

      XLSX.utils.book_append_sheet(wb, ws, 'Daftar Siswa')

      // Nama file: DaftarSiswa_NamaKelas_Tanggal.xlsx
      const today = new Date().toLocaleDateString('id-ID', {
        timeZone: 'Asia/Makassar',
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).replace(/\//g, '-')
      const fileName = `DaftarSiswa_${namaKelas.replace(/\s+/g, '_')}_${today}.xlsx`

      XLSX.writeFile(wb, fileName)
      toast.success(`File ${fileName} berhasil diunduh`)
    } catch (err) {
      toast.error('Gagal mengekspor data siswa')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={loading}
      leftIcon={<Download size={14} />}
      onClick={handleExport}
    >
      <span className="hidden sm:inline">Export Excel</span>
      <span className="sm:hidden">Export</span>
    </Button>
  )
}
