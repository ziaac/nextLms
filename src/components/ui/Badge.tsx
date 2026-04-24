'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
type BadgeSize    = 'sm' | 'md'

interface BadgeProps {
  children:  React.ReactNode
  variant?:  BadgeVariant
  size?:     BadgeSize
  className?: string
}

// ── Warna light mode ──────────────────────────────────────────
const LIGHT: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: '#f9fafb', color: '#6b7280' },          // gray-50  / gray-500
  success: { bg: '#ecfdf5', color: '#059669' },          // emerald-50 / emerald-600
  warning: { bg: '#fefce8', color: '#ca8a04' },          // yellow-50 / yellow-600
  danger:  { bg: '#fef2f2', color: '#dc2626' },          // red-50   / red-600
  info:    { bg: '#eff6ff', color: '#3b82f6' },          // blue-50  / blue-500
  purple:  { bg: '#faf5ff', color: '#9333ea' },          // purple-50 / purple-600
}

// ── Warna dark mode ───────────────────────────────────────────
const DARK: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },   // gray muted
  success: { bg: 'rgba(5,150,105,0.12)',   color: '#6ee7b7' },   // emerald muted
  warning: { bg: 'rgba(202,138,4,0.12)',   color: '#fde68a' },   // yellow muted
  danger:  { bg: 'rgba(220,38,38,0.12)',   color: '#fca5a5' },   // red muted
  info:    { bg: 'rgba(59,130,246,0.12)',  color: '#93c5fd' },   // blue muted
  purple:  { bg: 'rgba(147,51,234,0.12)', color: '#d8b4fe' },   // purple muted
}

const SIZE_CLASS: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-0.5 text-xs',
}

// ── Hook isDark (MutationObserver) ────────────────────────────
function useIsDark() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => obs.disconnect()
  }, [])
  return isDark
}

// ── Component ─────────────────────────────────────────────────
export function Badge({
  children,
  variant  = 'default',
  size     = 'md',
  className,
}: BadgeProps) {
  const isDark  = useIsDark()
  const palette = isDark ? DARK[variant] : LIGHT[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        SIZE_CLASS[size],
        className,
      )}
      style={{
        backgroundColor: palette.bg,
        color:           palette.color,
      }}
    >
      {children}
    </span>
  )
}
