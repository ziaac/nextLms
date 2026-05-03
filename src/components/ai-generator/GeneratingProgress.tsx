'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2, XCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusDraftAI, ProviderAI } from '@/types/ai-generator.types'

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  id:       string
  label:    string
  detail:   string
  /** Durasi minimum (ms) sebelum step ini dianggap selesai secara visual */
  minMs:    number
}

const STEPS: Step[] = [
  {
    id:     'queue',
    label:  'Permintaan diterima',
    detail: 'Draft dibuat dan job dikirim ke antrian',
    minMs:  800,
  },
  {
    id:     'processing',
    label:  'Memulai proses',
    detail: 'Worker mengambil job dari antrian',
    minMs:  1_200,
  },
  {
    id:     'documents',
    label:  'Mengambil dokumen referensi',
    detail: 'Mengunduh dan mengekstrak teks dari PDF',
    minMs:  2_500,
  },
  {
    id:     'rag',
    label:  'Membangun konteks RAG',
    detail: 'Menyusun prompt dengan format kurikulum aktif',
    minMs:  1_500,
  },
  {
    id:     'ai',
    label:  'Memanggil AI provider',
    detail: 'Menunggu respons dari model AI',
    minMs:  8_000,
  },
  {
    id:     'saving',
    label:  'Menyimpan hasil',
    detail: 'Memproses dan menyimpan konten yang digenerate',
    minMs:  800,
  },
]

// ─── Provider label ───────────────────────────────────────────────────────────

const PROVIDER_LABELS: Partial<Record<ProviderAI, string>> = {
  GEMINI:     'Google Gemini',
  OPENAI:     'OpenAI',
  QWEN:       'Alibaba Qwen',
  DEEPSEEK:   'DeepSeek',
  OPENROUTER: 'OpenRouter',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type StepStatus = 'waiting' | 'active' | 'done' | 'error'

interface Props {
  /** Status dari polling backend */
  backendStatus: StatusDraftAI
  provider?:     ProviderAI | null
  judul?:        string
  errorMessage?: string | null
  onViewHistory: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GeneratingProgress({
  backendStatus,
  provider,
  judul,
  errorMessage,
  onViewHistory,
}: Props) {
  // Index step yang sedang aktif secara visual (0-based)
  const [visualStep, setVisualStep] = useState(0)
  // Waktu mulai untuk menghitung elapsed
  const [startTime]                 = useState(() => Date.now())
  // Apakah sudah selesai (COMPLETED atau FAILED)
  const isDone    = backendStatus === 'COMPLETED' || backendStatus === 'SAVED'
  const isFailed  = backendStatus === 'FAILED'
  const isTerminal = isDone || isFailed

  // ── Advance visual steps berdasarkan waktu ──────────────────────────────────
  useEffect(() => {
    if (isTerminal) {
      // Jika backend sudah selesai, langsung tunjukkan semua step done/error
      setVisualStep(isFailed ? visualStep : STEPS.length)
      return
    }

    // Hitung kapan step berikutnya harus maju
    const elapsed = Date.now() - startTime
    let accumulated = 0
    let nextStep = 0

    for (let i = 0; i < STEPS.length; i++) {
      accumulated += STEPS[i].minMs
      if (elapsed < accumulated) {
        nextStep = i
        break
      }
      nextStep = i + 1
    }

    // Jangan maju melewati step "ai" (index 4) sampai backend PROCESSING
    const maxStep = backendStatus === 'PROCESSING' ? STEPS.length - 1 : 3
    const clampedStep = Math.min(nextStep, maxStep)

    if (clampedStep > visualStep) {
      setVisualStep(clampedStep)
    }

    // Schedule advance ke step berikutnya
    if (clampedStep < STEPS.length && !isTerminal) {
      let delay = 0
      let acc2 = 0
      for (let i = 0; i <= clampedStep; i++) acc2 += STEPS[i].minMs
      delay = Math.max(100, acc2 - (Date.now() - startTime))

      const timer = setTimeout(() => {
        setVisualStep((prev) => {
          const max2 = backendStatus === 'PROCESSING' ? STEPS.length - 1 : 3
          return Math.min(prev + 1, max2)
        })
      }, delay)

      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendStatus, isTerminal, isFailed, startTime])

  // ── Determine per-step status ───────────────────────────────────────────────
  const getStepStatus = (index: number): StepStatus => {
    if (isFailed && index >= visualStep) return index === visualStep ? 'error' : 'waiting'
    if (isDone || index < visualStep)    return 'done'
    if (index === visualStep)            return 'active'
    return 'waiting'
  }

  const providerLabel = provider ? (PROVIDER_LABELS[provider] ?? provider) : 'AI'

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className={cn(
        'px-6 py-4 flex items-center gap-3',
        isDone   ? 'bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-800' :
        isFailed ? 'bg-red-50 dark:bg-red-950/40 border-b border-red-100 dark:border-red-800' :
                   'bg-violet-50 dark:bg-violet-950/40 border-b border-violet-100 dark:border-violet-800',
      )}>
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          isDone   ? 'bg-emerald-100 dark:bg-emerald-900/60' :
          isFailed ? 'bg-red-100 dark:bg-red-900/60' :
                     'bg-violet-100 dark:bg-violet-900/60',
        )}>
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : isFailed ? (
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold truncate',
            isDone   ? 'text-emerald-800 dark:text-emerald-200' :
            isFailed ? 'text-red-800 dark:text-red-200' :
                       'text-violet-800 dark:text-violet-200',
          )}>
            {isDone   ? 'Konten berhasil digenerate!' :
             isFailed ? 'Generate gagal' :
                        `${providerLabel} sedang memproses…`}
          </p>
          {judul && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{judul}</p>
          )}
        </div>
        {isTerminal && (
          <button
            onClick={onViewHistory}
            className={cn(
              'shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
              isDone
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
            )}
          >
            {isDone ? 'Buka Hasil →' : 'Lihat Riwayat'}
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="px-6 py-5 space-y-0">
        {STEPS.map((step, index) => {
          const status = getStepStatus(index)
          const isLast = index === STEPS.length - 1

          return (
            <div key={step.id} className="flex gap-4">
              {/* Icon + connector */}
              <div className="flex flex-col items-center">
                <StepIcon status={status} />
                {!isLast && (
                  <div className={cn(
                    'w-px flex-1 my-1 transition-colors duration-500',
                    status === 'done' ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700',
                  )} style={{ minHeight: 20 }} />
                )}
              </div>

              {/* Content */}
              <div className={cn('pb-4 flex-1 min-w-0', isLast && 'pb-0')}>
                <p className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  status === 'done'    ? 'text-emerald-700 dark:text-emerald-400' :
                  status === 'active'  ? 'text-gray-900 dark:text-white' :
                  status === 'error'   ? 'text-red-600 dark:text-red-400' :
                                         'text-gray-400 dark:text-gray-600',
                )}>
                  {step.label}
                  {status === 'active' && (
                    <span className="ml-2 inline-flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1 h-1 rounded-full bg-violet-500 dark:bg-violet-400 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </p>
                <p className={cn(
                  'text-xs mt-0.5 transition-colors duration-300',
                  status === 'active'  ? 'text-gray-500 dark:text-gray-400' :
                  status === 'done'    ? 'text-emerald-600/70 dark:text-emerald-500/70' :
                  status === 'error'   ? 'text-red-500 dark:text-red-400' :
                                         'text-gray-300 dark:text-gray-700',
                )}>
                  {status === 'error' && errorMessage
                    ? errorMessage.slice(0, 120)
                    : step.detail}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer — elapsed / hint */}
      {!isTerminal && (
        <div className="px-6 pb-4">
          <ElapsedTimer startTime={startTime} />
        </div>
      )}
    </div>
  )
}

// ─── Step icon ────────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    )
  }
  if (status === 'active') {
    return (
      <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/60 flex items-center justify-center shrink-0">
        <Loader2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 animate-spin" />
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center shrink-0">
        <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
      </div>
    )
  }
  // waiting
  return (
    <div className="w-6 h-6 rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
      <Circle className="w-2.5 h-2.5 text-gray-300 dark:text-gray-600" />
    </div>
  )
}

// ─── Elapsed timer ────────────────────────────────────────────────────────────

function ElapsedTimer({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const label = mins > 0
    ? `${mins}m ${secs}s`
    : `${secs}s`

  return (
    <p className="text-xs text-gray-400 dark:text-gray-600">
      Waktu berjalan: <span className="font-mono">{label}</span>
      {' · '}Anda dapat menutup halaman ini, hasil tersimpan di Riwayat
    </p>
  )
}
