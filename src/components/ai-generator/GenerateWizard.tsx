'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepSelectContent } from './StepSelectContent'
import { StepSelectContext, type ContextValue } from './StepSelectContext'
import { StepFillParams, type ParamsValue } from './StepFillParams'
import { StepSelectDokumen } from './StepSelectDokumen'
import { StepConfirm, type ProviderValue } from './StepConfirm'
import type {
  InitiateGenerateDto,
  JenisKontenAI,
} from '@/types/ai-generator.types'

interface Props {
  onSubmit:  (dto: InitiateGenerateDto) => void
  isPending: boolean
}

const STEPS = ['Jenis', 'Konteks', 'Parameter', 'Dokumen', 'Konfirmasi'] as const

export function GenerateWizard({ onSubmit, isPending }: Props) {
  const [step, setStep] = useState(0)

  const [jenisKonten, setJenisKonten] = useState<JenisKontenAI | null>(null)
  const [context, setContext] = useState<ContextValue>({
    tahunAjaranId:          '',
    semesterId:             '',
    tingkatKelasId:         '',
    mataPelajaranTingkatId: '',
  })
  const [params, setParams] = useState<ParamsValue>({
    judul:          '',
    topik:          '',
    promptTambahan: '',
  })
  const [dokumenIds, setDokumenIds] = useState<string[]>([])
  const [provider, setProvider] = useState<ProviderValue>({
    provider: 'GEMINI',
    byoa:     false,
    apiKey:   '',
  })

  const canNext = (() => {
    switch (step) {
      case 0: return jenisKonten !== null
      case 1: return !!(context.tahunAjaranId && context.semesterId && context.tingkatKelasId && context.mataPelajaranTingkatId)
      case 2: return params.judul.trim().length > 0 && params.topik.trim().length > 0 && params.promptTambahan.length <= 2000
      case 3: return true
      default: return false
    }
  })()

  const handleGenerate = () => {
    if (!jenisKonten) return
    onSubmit({
      jenisKonten,
      tahunAjaranId:          context.tahunAjaranId,
      semesterId:             context.semesterId,
      tingkatKelasId:         context.tingkatKelasId,
      mataPelajaranTingkatId: context.mataPelajaranTingkatId,
      judul:                  params.judul.trim(),
      topik:                  params.topik.trim(),
      promptTambahan:         params.promptTambahan.trim() || undefined,
      dokumenPengajaranIds:   dokumenIds.length > 0 ? dokumenIds : undefined,
      provider:               provider.provider,
      apiKey:                 provider.byoa && provider.apiKey.trim() ? provider.apiKey.trim() : undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center w-full">
        {STEPS.map((label, idx) => {
          const done    = idx < step
          const current = idx === step
          return (
            <li
              key={label}
              className={cn(
                'flex items-center',
                idx < STEPS.length - 1 && 'flex-1',
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0',
                  done && 'bg-emerald-500 text-white',
                  current && 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500',
                  !done && !current && 'bg-gray-100 dark:bg-gray-800 text-gray-400',
                )}
              >
                {done ? <Check size={14} /> : idx + 1}
              </div>
              <span
                className={cn(
                  'ml-2 text-xs hidden sm:inline',
                  current ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-500',
                )}
              >
                {label}
              </span>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-3',
                    done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Step body */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        {step === 0 && (
          <StepSelectContent value={jenisKonten} onChange={setJenisKonten} />
        )}
        {step === 1 && (
          <StepSelectContext value={context} onChange={setContext} />
        )}
        {step === 2 && jenisKonten && (
          <StepFillParams jenisKonten={jenisKonten} value={params} onChange={setParams} />
        )}
        {step === 3 && (
          <StepSelectDokumen
            semesterId={context.semesterId}
            tahunAjaranId={context.tahunAjaranId}
            selectedIds={dokumenIds}
            onChange={setDokumenIds}
          />
        )}
        {step === 4 && jenisKonten && (
          <StepConfirm
            summary={{
              jenisKonten,
              judul:          params.judul,
              topik:          params.topik,
              promptTambahan: params.promptTambahan,
              dokumenCount:   dokumenIds.length,
            }}
            value={provider}
            onChange={setProvider}
            onGenerate={handleGenerate}
            isPending={isPending}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || isPending}
          leftIcon={<ChevronLeft size={16} />}
        >
          Sebelumnya
        </Button>

        {step < STEPS.length - 1 && (
          <Button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canNext}
            rightIcon={<ChevronRight size={16} />}
          >
            Selanjutnya
          </Button>
        )}
      </div>
    </div>
  )
}
