'use client'

import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  content: string
  className?: string
  /** Default: 'left' — aligns tooltip to the left of the icon (good for right-side sidebars) */
  align?: 'left' | 'center' | 'right'
}

export function InfoTooltip({ content, className, align = 'center' }: InfoTooltipProps) {
  const positionClass =
    align === 'left'   ? 'right-0' :
    align === 'right'  ? 'left-0'  :
    'left-1/2 -translate-x-1/2'

  return (
    <span className={cn('relative group inline-flex items-center shrink-0', className)}>
      <Info
        size={12}
        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 cursor-help transition-colors"
      />
      <span className={cn(
        'absolute bottom-full mb-2 z-50',
        'w-56 rounded-lg border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-900 shadow-lg',
        'px-3 py-2 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed',
        'pointer-events-none whitespace-normal',
        'invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150',
        positionClass,
      )}>
        {content}
      </span>
    </span>
  )
}
