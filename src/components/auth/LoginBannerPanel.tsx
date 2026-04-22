'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, GraduationCap, BookOpen, Clock, AlertCircle, X, ChevronRight } from 'lucide-react'
import { API_URL } from '@/lib/constants'

const BANNER_URL = 'https://storagelms.man2kotamakassar.sch.id/static-assets/static_login_image.webp'
const HOME_URL = 'https://lms.man2kotamakassar.sch.id'
const HARI_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export function LoginBannerPanel() {
  const [stats, setStats] = useState<any>(null)
  const [jadwal, setJadwal] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const hariIni = HARI_ID[new Date().getDay()]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, jRes] = await Promise.all([
          fetch(`${API_URL}/report/public/stats`),
          fetch(`${API_URL}/jadwal-pelajaran/publik/hari-ini`)
        ])
        setStats(await sRes.json())
        const jData = await jRes.json()
        setJadwal(jData.data ?? [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const allSesi = jadwal.flatMap((k: any) => 
    k.jadwal.map((j: any) => ({ ...j, namaKelas: k.namaKelas }))
  ).slice(0, 15)

  return (
    <div className="relative w-full h-full min-h-[600px] flex items-stretch">
      {/* Background Image */}
      <img src={BANNER_URL} alt="Banner" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 backdrop-brightness-75" />

      {/* Kontainer Utama - Padding rapat atas/bawah agar card lebih luas */}
      <div className="relative z-10 w-full flex flex-col px-8 py-4 lg:px-12 lg:py-6 h-full">
        
        {/* Tombol Close */}
        <div className="flex justify-end mb-3">
          <Link
            href={HOME_URL}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white"
          >
            <X size={18} strokeWidth={1.5} />
          </Link>
        </div>

        {/* Card Informasi Transparan */}
        <div className="relative flex-1 flex flex-col rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
          
          {/* Layer Blur Fading */}
          <div 
            className="absolute inset-0 z-0 bg-white/[0.03]"
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              maskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 0%, black 85%)',
            }}
          />

          {/* Konten Card */}
          <div className="relative z-10 px-8 py-6 flex flex-col h-full font-normal">
            <div className="mb-6">
              <h3 className="text-[11px] text-white/60 mb-1 uppercase">Live Report</h3>
              <h2 className="text-2xl text-white leading-none">Informasi Akademik</h2>
            </div>

            {error ? (
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center gap-3 text-white">
                <AlertCircle size={18} strokeWidth={1.5} />
                <span className="text-[12px] uppercase">Gagal memuat data akademik</span>
              </div>
            ) : (
              <div className="flex flex-col flex-1 overflow-hidden">
                
                {/* Statistik Box */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <StatBox label="Siswa" value={stats?.totalSiswa ?? 0} icon={<GraduationCap size={18} strokeWidth={1.5} />} loading={loading} />
                  <StatBox label="Guru" value={stats?.totalGuru ?? 0} icon={<Users size={18} strokeWidth={1.5} />} loading={loading} />
                  <StatBox label="Kelas" value={stats?.totalKelas ?? 0} icon={<BookOpen size={18} strokeWidth={1.5} />} loading={loading} />
                </div>

                {/* Jadwal Pelajaran Area */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex justify-between items-end mb-3 border-b border-white/10 pb-2">
                    <p className="text-[11px] text-white/60 uppercase">Jadwal Pelajaran Hari Ini</p>
                    <p className="text-[11px] text-white/80 uppercase">{hariIni}</p>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scroll pb-2">
                    {allSesi.length > 0 ? (
                      allSesi.map((s, idx) => (
                        <div key={idx} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-2xl p-3.5 hover:bg-white/10 transition-all">
                          <div className="flex flex-col items-center shrink-0 min-w-[50px]">
                            <Clock size={16} strokeWidth={1.5} className="text-white/60 mb-1.5" />
                            <span className="text-[11px] text-white">{s.jamMulai}</span>
                          </div>
                          <div className="flex flex-col min-w-0 border-l border-white/10 pl-4 justify-center">
                            <span className="text-[13px] text-white truncate uppercase">{s.namaMapel}</span>
                            <span className="text-[11px] text-white/50 mt-1">{s.namaKelas}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-white/40 text-[12px] uppercase">
                        Tidak ada jadwal berlangsung hari ini
                      </div>
                    )}
                  </div>
                </div>

                {/* Link di pojok kiri bawah card */}
                <div className="mt-4 pt-2 border-t border-white/5">
                  <Link 
                    href="/jadwal-publik" 
                    className="flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white transition-colors uppercase"
                  >
                    Jadwal Selengkapnya
                    <ChevronRight size={12} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  )
}

function StatBox({ label, value, icon, loading }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[24px] p-3 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors h-[110px]">
      <div className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 mb-2 text-white/80">
        {icon}
      </div>
      {loading ? (
        <div className="h-5 w-10 bg-white/10 animate-pulse rounded my-0.5" />
      ) : (
        <div className="text-xl text-white leading-none my-0.5">{value.toLocaleString('id')}</div>
      )}
      <div className="text-[10px] text-white/50 uppercase mt-1 font-normal">{label}</div>
    </div>
  )
}