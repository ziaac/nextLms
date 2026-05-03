'use client'

import { Select, Input, Button, Spinner } from '@/components/ui'
import { Sparkles } from 'lucide-react'
import type { JenisKontenAI, ProviderAI } from '@/types/ai-generator.types'

const PROVIDER_OPTIONS: { value: ProviderAI; label: string; hint?: string }[] = [
  { value: 'GEMINI',     label: 'Google Gemini',   hint: 'Direkomendasikan · Gratis · Baca PDF native' },
  { value: 'OPENAI',     label: 'OpenAI (GPT)',     hint: 'Wajib API key berbayar · Free tier sangat terbatas (3 req/menit) · Baca PDF native' },
  { value: 'QWEN',       label: 'Qwen (Alibaba)',   hint: 'Murah · qwen-plus ~$0.04/1M token' },
  { value: 'DEEPSEEK',   label: 'DeepSeek',         hint: 'Murah · deepseek-chat ~$0.07/1M token' },
  { value: 'OPENROUTER', label: 'OpenRouter',       hint: 'Gateway multi-model · harga variatif' },
]

const JENIS_LABEL: Record<JenisKontenAI, string> = {
  RPP:              'RPP',
  MATERI_PELAJARAN: 'Materi Pelajaran',
  TUGAS:            'Tugas / Kuis',
}

export interface ProviderValue {
  provider: ProviderAI
  byoa:     boolean
  apiKey:   string
}

interface Summary {
  jenisKonten:    JenisKontenAI
  judul:          string
  topik:          string
  promptTambahan: string
  dokumenCount:   number
}

interface Props {
  summary:    Summary
  value:      ProviderValue
  onChange:   (val: ProviderValue) => void
  onGenerate: () => void
  isPending:  boolean
}

export function StepConfirm({ summary, value, onChange, onGenerate, isPending }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Konfirmasi & Generate
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Periksa ringkasan, pilih provider AI, lalu jalankan generator.
        </p>
      </div>

      {/* Ringkasan */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Jenis</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {JENIS_LABEL[summary.jenisKonten]}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Dokumen Konteks</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {summary.dokumenCount} dokumen
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Judul</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
              {summary.judul}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Topik</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
              {summary.topik}
            </p>
          </div>
          {summary.promptTambahan && (
            <div className="col-span-2">
              <p className="text-xs text-gray-500">Prompt Tambahan</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {summary.promptTambahan}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Provider */}
      <div className="space-y-3">
        <div>
          <Select
            label="Provider AI"
            options={PROVIDER_OPTIONS}
            value={value.provider}
            onChange={(e) => onChange({ ...value, provider: e.target.value as ProviderAI })}
          />
          {PROVIDER_OPTIONS.find((p) => p.value === value.provider)?.hint && (
            <p className="mt-1 text-xs text-gray-400">
              {PROVIDER_OPTIONS.find((p) => p.value === value.provider)?.hint}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={value.byoa}
            onChange={(e) => onChange({ ...value, byoa: e.target.checked, apiKey: '' })}
            className="accent-emerald-500"
          />
          Gunakan API Key sendiri (BYOA)
        </label>

        {value.byoa && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <Input
              type="password"
              value={value.apiKey}
              onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
              placeholder="API key tidak akan disimpan ke database"
            />
            <p className="text-xs text-gray-400 mt-1">
              API key hanya dipakai sekali untuk job ini dan tidak akan disimpan.
            </p>
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button
          onClick={onGenerate}
          disabled={isPending || (value.byoa && !value.apiKey.trim())}
          leftIcon={isPending ? <Spinner /> : <Sparkles size={16} />}
        >
          {isPending ? 'Memulai…' : 'Generate'}
        </Button>
      </div>
    </div>
  )
}
