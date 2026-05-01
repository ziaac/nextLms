'use client'

import { Skeleton } from '@/components/ui'
import { useRekapSikapKelas } from '@/hooks/sikap/useSikap'
import { TrendingUp, TrendingDown, ClipboardList, Activity } from 'lucide-react'

interface SikapStatCardsProps {
  kelasId:    string
  semesterId?: string
}

export function SikapStatCards({ kelasId, semesterId }: SikapStatCardsProps) {
  const { data, isLoading } = useRekapSikapKelas(kelasId || null, semesterId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
            <Skeleton className="h-4 w-24 rounded mb-3" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const rekap = data?.rekap ?? {
    totalCatatan: 0,
    jumlahPositif: 0,
    jumlahNegatif: 0,
    netPoint: 0,
  }

  const cards = [
    {
      label: 'Total Catatan',
      value: rekap.totalCatatan,
      icon: ClipboardList,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800/50',
      border: 'border-gray-200 dark:border-gray-700',
    },
    {
      label: 'Catatan Positif',
      value: rekap.jumlahPositif,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      label: 'Catatan Negatif',
      value: rekap.jumlahNegatif,
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-100 dark:border-red-900/40',
    },
    {
      label: 'Net Point',
      value: rekap.netPoint >= 0 ? `+${rekap.netPoint}` : `${rekap.netPoint}`,
      icon: Activity,
      color: rekap.netPoint >= 0
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-orange-600 dark:text-orange-400',
      bg: rekap.netPoint >= 0
        ? 'bg-blue-50 dark:bg-blue-950/20'
        : 'bg-orange-50 dark:bg-orange-950/20',
      border: rekap.netPoint >= 0
        ? 'border-blue-100 dark:border-blue-900/40'
        : 'border-orange-100 dark:border-orange-900/40',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`rounded-2xl border p-4 ${card.bg} ${card.border}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${card.color}`} />
              <p className={`text-xs font-medium ${card.color}`}>{card.label}</p>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        )
      })}
    </div>
  )
}
