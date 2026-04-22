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
  default: { bg: '#f3f4f6', color: '#374151' },          // gray-100 / gray-700
  success: { bg: '#d1fae5', color: '#065f46' },          // emerald-100 / emerald-800
  warning: { bg: '#fef9c3', color: '#854d0e' },          // yellow-100 / yellow-800
  danger:  { bg: '#fee2e2', color: '#991b1b' },          // red-100 / red-800
  info:    { bg: '#dbeafe', color: '#1e40af' },          // blue-100 / blue-800
  purple:  { bg: '#ede9fe', color: '#5b21b6' },          // purple-100 / purple-800
}

// ── Warna dark mode ───────────────────────────────────────────
const DARK: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: '#1f2937', color: '#d1d5db' },          // gray-800 / gray-300
  success: { bg: '#022c22', color: '#34d399' },          // emerald-950/50 / emerald-400
  warning: { bg: '#1c1500', color: '#fbbf24' },          // yellow-950/50 / yellow-400
  danger:  { bg: '#1f0707', color: '#f87171' },          // red-950/50 / red-400
  info:    { bg: '#071730', color: '#60a5fa' },          // blue-950/50 / blue-400
  purple:  { bg: '#1e0840', color: '#a78bfa' },          // purple-950/50 / purple-400
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
