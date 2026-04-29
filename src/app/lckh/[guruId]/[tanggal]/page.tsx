import { notFound } from 'next/navigation'

// Halaman publik LCKH — dapat diakses tanpa login via QR Code
// URL: /lckh/:guruId/:tanggal

interface AktivitasInternal {
  id: string
  tipe: string
  deskripsi: string
  waktu: string
}

interface AktivitasEksternal {
  id: string
  kegiatan: string
  output: string
  volume: number
  satuan: string
  keterangan: string | null
}

interface LckhPublikResponse {
  namaGuru: string
  jabatan: string
  tanggal: string
  namaHari: string
  aktivitasInternal: AktivitasInternal[]
  aktivitasEksternal: AktivitasEksternal[]
  persetujuan: {
    isApproved: boolean
    atasanNama: string | null
    approvedAt: string | null
  }
}

interface PageProps {
  params: Promise<{ guruId: string; tanggal: string }>
}

async function fetchLckhPublik(guruId: string, tanggal: string): Promise<LckhPublikResponse | null> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? ''
  try {
    const res = await fetch(
      `${apiUrl}/guru-log/publik/${guruId}/${tanggal}`,
      { next: { revalidate: 300 } }, // cache 5 menit
    )
    if (!res.ok) return null
    return res.json() as Promise<LckhPublikResponse>
  } catch {
    return null
  }
}

const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

function formatTanggalIndo(tanggal: string): string {
  const [y, m, d] = tanggal.split('-').map(Number)
  return `${d} ${NAMA_BULAN[m - 1]} ${y}`
}

export default async function LckhPublikPage({ params }: PageProps) {
  const { guruId, tanggal } = await params

  const data = await fetchLckhPublik(guruId, tanggal)

  if (!data) notFound()

  const totalAktivitas =
    (data.aktivitasInternal?.length ?? 0) + (data.aktivitasEksternal?.length ?? 0)

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold text-gray-900">Laporan Capaian Kinerja Harian</h1>
          <p className="text-sm text-gray-500">MAN 2 Kota Makassar</p>
        </div>

        {/* Info Guru & Tanggal */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Nama Guru</span>
            <span className="font-medium text-gray-900">{data.namaGuru}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Jabatan</span>
            <span className="font-medium text-gray-900">{data.jabatan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tanggal</span>
            <span className="font-medium text-gray-900">{data.namaHari}, {formatTanggalIndo(tanggal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Aktivitas</span>
            <span className="font-medium text-gray-900">{totalAktivitas} aktivitas</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            {data.persetujuan.isApproved ? (
              <span className="text-emerald-600 font-medium">
                ✓ Disetujui oleh {data.persetujuan.atasanNama ?? '—'}
              </span>
            ) : (
              <span className="text-amber-600 font-medium">Belum disetujui</span>
            )}
          </div>
        </div>

        {/* Aktivitas Internal */}
        {data.aktivitasInternal.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Aktivitas Internal Sistem</h2>
            <div className="space-y-2">
              {data.aktivitasInternal.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <p className="text-gray-700">{item.deskripsi}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aktivitas Eksternal */}
        {data.aktivitasEksternal.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Aktivitas Eksternal</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-3 text-xs text-gray-500 font-medium">Kegiatan</th>
                    <th className="text-left py-2 pr-3 text-xs text-gray-500 font-medium">Output</th>
                    <th className="text-center py-2 pr-3 text-xs text-gray-500 font-medium">Vol.</th>
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">Satuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.aktivitasEksternal.map((ext) => (
                    <tr key={ext.id}>
                      <td className="py-2 pr-3 text-gray-800">{ext.kegiatan}</td>
                      <td className="py-2 pr-3 text-gray-700">{ext.output}</td>
                      <td className="py-2 pr-3 text-center text-gray-700">{ext.volume}</td>
                      <td className="py-2 text-gray-700">{ext.satuan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer verifikasi */}
        <p className="text-center text-xs text-gray-400">
          Dokumen ini dapat diverifikasi melalui QR Code pada cetakan LCKH resmi.
        </p>
      </div>
    </main>
  )
}
