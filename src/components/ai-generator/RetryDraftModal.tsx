'use client'

import { useState } from 'react'
import { Modal, Button, Select, Spinner } from '@/components/ui'
import { KeyRound, RefreshCw } from 'lucide-react'
import type { DraftAIListItem, ProviderAI } from '@/types/ai-generator.types'

const PROVIDER_OPTIONS: { value: ProviderAI; label: string }[] = [
  { value: 'GEMINI',     label: 'Google Gemini (gratis, baca PDF native)' },
  { value: 'OPENAI',     label: 'OpenAI GPT (berbayar, baca PDF native)' },
  { value: 'QWEN',       label: 'Qwen / Alibaba (murah, ~$0.04/1M token)' },
  { value: 'DEEPSEEK',   label: 'DeepSeek (murah, ~$0.07/1M token)' },
  { value: 'OPENROUTER', label: 'OpenRouter (gateway multi-model)' },
]

interface Props {
  open:      boolean
  onClose:   () => void
  draft:     DraftAIListItem | null
  onRetry:   (provider: ProviderAI, apiKey?: string) => Promise<void>
  isPending: boolean
}

export function RetryDraftModal({ open, onClose, draft, onRetry, isPending }: Props) {
  const [provider, setProvider] = useState<ProviderAI>(
    (draft?.provider as ProviderAI) ?? 'GEMINI',
  )
  const [byoa,     setByoa]     = useState(false)
  const [apiKey,   setApiKey]   = useState('')

  const canSubmit = !isPending && (!byoa || apiKey.trim().length > 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onRetry(provider, byoa && apiKey.trim() ? apiKey.trim() : undefined)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ulangi Generate"
      size="md"
      footer={
        <div className="flex gap-2 justify-end px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            type="submit"
            form="retry-form"
            disabled={!canSubmit}
            leftIcon={isPending ? <Spinner /> : <RefreshCw size={14} />}
          >
            {isPending ? 'Memproses…' : 'Ulangi Generate'}
          </Button>
        </div>
      }
    >
      <form id="retry-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {draft && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-4 py-3 space-y-0.5">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{draft.judul}</p>
            <p className="text-xs text-gray-500">{draft.topik}</p>
            {draft.errorMessage && (
              <p className="text-xs text-red-500 mt-1">Error sebelumnya: {draft.errorMessage}</p>
            )}
          </div>
        )}

        <Select
          label="Pilih Provider AI"
          options={PROVIDER_OPTIONS}
          value={provider}
          onChange={(e) => setProvider(e.target.value as ProviderAI)}
        />

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={byoa}
            onChange={(e) => setByoa(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Gunakan API key saya sendiri (BYOA)
          </span>
        </label>

        {byoa && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <KeyRound size={13} className="inline mr-1" />
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... / AIza..."
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required={byoa}
            />
            <p className="text-xs text-gray-400 mt-1">
              Tidak disimpan ke database — hanya digunakan untuk satu sesi ini.
            </p>
          </div>
        )}
      </form>
    </Modal>
  )
}
