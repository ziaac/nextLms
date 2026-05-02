'use client'

import { Input } from '@/components/ui'
import type { JenisKontenAI } from '@/types/ai-generator.types'

export interface ParamsValue {
  judul:          string
  topik:          string
  promptTambahan: string
}

interface Props {
  jenisKonten: JenisKontenAI
  value:       ParamsValue
  onChange:    (val: ParamsValue) => void
}

export function StepFillParams({ value, onChange }: Props) {
  const promptLen = value.promptTambahan.length

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Isi Parameter
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Berikan judul, topik, dan instruksi tambahan untuk AI.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Judul <span className="text-red-500">*</span>
        </label>
        <Input
          value={value.judul}
          onChange={(e) => onChange({ ...value, judul: e.target.value })}
          placeholder="Mis. Pengenalan Trigonometri"
          maxLength={250}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Topik <span className="text-red-500">*</span>
        </label>
        <Input
          value={value.topik}
          onChange={(e) => onChange({ ...value, topik: e.target.value })}
          placeholder="Mis. Sin, Cos, Tan dan aplikasinya"
          maxLength={250}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Prompt Tambahan
          </label>
          <span className={`text-xs ${promptLen > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
            {promptLen}/2000
          </span>
        </div>
        <textarea
          value={value.promptTambahan}
          onChange={(e) => onChange({ ...value, promptTambahan: e.target.value.slice(0, 2000) })}
          rows={5}
          maxLength={2000}
          placeholder="Instruksi khusus, gaya bahasa, atau penekanan tertentu untuk AI…"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
        />
      </div>
    </div>
  )
}
