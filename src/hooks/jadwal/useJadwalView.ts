import { useQuery, useMutation } from '@tanstack/react-query'
import { jadwalViewApi } from '@/lib/api/jadwal-view.api'

export function useMyJadwalMingguan(semesterId: string | null) {
  return useQuery({
    queryKey:  ['jadwal-view', 'my-mingguan', semesterId],
    queryFn:   () => jadwalViewApi.getMyMingguan(semesterId!),
    enabled:   !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useKelasJadwalMingguan(kelasId: string | null, semesterId: string | null) {
  return useQuery({
    queryKey:  ['jadwal-view', 'kelas-mingguan', kelasId, semesterId],
    queryFn:   () => jadwalViewApi.getKelasMingguan(kelasId!, semesterId!),
    enabled:   !!kelasId && !!semesterId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useJadwalHariIni(semesterId: string | null) {
  return useQuery({
    queryKey:        ['jadwal-view', 'hari-ini', semesterId],
    queryFn:         () => jadwalViewApi.getHariIni(semesterId!),
    enabled:         !!semesterId,
    staleTime:       1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 2,
  })
}

export function useExportJadwalGuru() {
  return useMutation({
    mutationFn: ({ guruId, semesterId }: { guruId: string; semesterId: string }) =>
      jadwalViewApi.exportGuru(guruId, semesterId).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a   = document.createElement('a')
        a.href = url; a.download = 'jadwal-mengajar.xlsx'; a.click()
        URL.revokeObjectURL(url)
      }),
  })
}

export function useExportJadwalKelas() {
  return useMutation({
    mutationFn: ({ kelasId, semesterId }: { kelasId: string; semesterId: string }) =>
      jadwalViewApi.exportKelas(kelasId, semesterId).then((blob) => {
        const url = URL.createObjectURL(blob)
        const a   = document.createElement('a')
        a.href = url; a.download = 'jadwal-kelas.xlsx'; a.click()
        URL.revokeObjectURL(url)
      }),
  })
}

export function useExportMyJadwal() {
  return useMutation({
    mutationFn: async (semesterId: string) => {
      const blob = await jadwalViewApi.exportMy(semesterId)
      const url  = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Jadwal.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
  })
}
