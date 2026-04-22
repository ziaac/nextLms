import type { HariEnum } from '@/types/jadwal.types'
import type { JadwalMingguanItem } from '@/types/jadwal-view.types'

export function groupByHari(
  items: JadwalMingguanItem[],
): Partial<Record<HariEnum, JadwalMingguanItem[]>> {
  const result: Partial<Record<HariEnum, JadwalMingguanItem[]>> = {}
  for (const item of items) {
    if (!result[item.hari]) result[item.hari] = []
    result[item.hari]!.push(item)
  }
  for (const hari of Object.keys(result) as HariEnum[]) {
    result[hari]!.sort((a, b) => a.urutanJam - b.urutanJam)
  }
  return result
}
