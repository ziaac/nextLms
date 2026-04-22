'use client'

import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '@/components/ui'
import { useKelasList }         from '@/hooks/kelas/useKelas'
import { useTahunAjaranActive } from '@/hooks/tahun-ajaran/useTahunAjaran'
import { useAuthStore }         from '@/stores/auth.store'
import { canAccess, ROLE_MANAJEMEN } from '@/lib/helpers/role'
import { KelasBelajarFilters } from '../_components/kelas-belajar-filters'
import { KelasBelajarTable }   from '../_components/kelas-belajar-table'
import { useQuery }            from '@tanstack/react-query'
import api                     from '@/lib/axios'
import type { TingkatKelas }   from '@/types/akademik.types'

function useTingkatKelasList() {
  return useQuery({
    queryKey: ['tingkat-kelas'],
    queryFn: async (): Promise<TingkatKelas[]> => {
      const res = await api.get<TingkatKelas[]>('/tingkat-kelas')
      return res.data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}

export default function KelasBelajarManajemenPage() {
  const { user } = useAuthStore()
  // Hanya manajemen yang bisa lihat semua daftar kelas/tabel
  const bolehAkses = canAccess(user?.role, ROLE_MANAJEMEN)

  const [tahunAjaranId,  setTahunAjaranId]  = useState<string>('')
  const [tingkatKelasId, setTingkatKelasId] = useState<string>('')
  const [search,         setSearch]         = useState<string>('')

  const { data: tahunAjaranList = [], isLoading: loadingTA } = useTahunAjaranActive()
  const { data: tingkatKelasList = [] } = useTingkatKelasList()

  useEffect(() => {
    if (tahunAjaranList.length > 0 && !tahunAjaranId) {
      setTahunAjaranId(tahunAjaranList[0].id)
    }
  }, [tahunAjaranList, tahunAjaranId])

  const { data: kelasList = [], isLoading: loadingKelas } = useKelasList({
    tahunAjaranId:  tahunAjaranId  || undefined,
    tingkatKelasId: tingkatKelasId || undefined,
  })

  const filtered = useMemo(() => {
    let result = kelasList
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((k) => k.namaKelas.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => {
      const tA = a.tingkatKelas?.nama ?? ''
      const tB = b.tingkatKelas?.nama ?? ''
      if (tA !== tB) return tA.localeCompare(tB)
      return a.namaKelas.localeCompare(b.namaKelas)
    })
  }, [kelasList, search])

  if (!bolehAkses) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p className="text-sm">Anda tidak memiliki akses ke halaman manajemen ini.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Kelas Belajar"
        description="Daftar seluruh kelas aktif di sekolah"
      />

      <KelasBelajarFilters
        tahunAjaranList={tahunAjaranList}
        tingkatKelasList={tingkatKelasList}
        tahunAjaranId={tahunAjaranId}
        tingkatKelasId={tingkatKelasId}
        search={search}
        onTahunAjaranChange={setTahunAjaranId}
        onTingkatChange={setTingkatKelasId}
        onSearchChange={setSearch}
        showTahunAjaranFilter={tahunAjaranList.length > 1}
      />

      <KelasBelajarTable
        data={filtered}
        isLoading={loadingKelas || loadingTA}
      />
    </div>
  )
}
