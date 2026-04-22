'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Image as ImageIcon, Settings2, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button, FileUpload } from '@/components/ui'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { uploadApi } from '@/lib/api/upload.api'
import type { SoalKuisPayload, QuizSettings, OpsiKuisPayload } from '@/types/tugas.types'
import { TipeSoalKuis } from '@/types/tugas.types'
import { cn } from '@/lib/utils'

interface QuizBuilderProps {
  soalKuis: SoalKuisPayload[]
  onChangeSoal: (soal: SoalKuisPayload[]) => void
  settings: QuizSettings
  onChangeSettings: (settings: QuizSettings) => void
}

export function QuizBuilder({ soalKuis, onChangeSoal, settings, onChangeSettings }: QuizBuilderProps) {
  const [showSettings, setShowSettings] = useState(false)
  // State for toggling image uploads & collapse
  const [showImgSoal, setShowImgSoal] = useState<Record<number, boolean>>({})
  const [showImgOpsi, setShowImgOpsi] = useState<Record<string, boolean>>({})
  const [collapsedSoal, setCollapsedSoal] = useState<Record<number, boolean>>({})

  const toggleCollapse = (index: number) => setCollapsedSoal(p => ({ ...p, [index]: !p[index] }))
  const toggleImgSoal = (index: number) => setShowImgSoal(p => ({ ...p, [index]: !p[index] }))
  const toggleImgOpsi = (sIndex: number, oIndex: number) => {
    const key = `${sIndex}-${oIndex}`
    setShowImgOpsi(p => ({ ...p, [key]: !p[key] }))
  }

  const handleAddSoal = () => {
    const newSoal: SoalKuisPayload = {
      pertanyaan: '',
      tipe: TipeSoalKuis.MULTIPLE_CHOICE,
      bobot: 1,
      urutan: soalKuis.length + 1,
      opsi: [
        { teks: '', isCorrect: true, urutan: 1 },
        { teks: '', isCorrect: false, urutan: 2 },
        { teks: '', isCorrect: false, urutan: 3 },
        { teks: '', isCorrect: false, urutan: 4 },
      ]
    }
    onChangeSoal([...soalKuis, newSoal])
  }

  const updateSoal = (index: number, partial: Partial<SoalKuisPayload>) => {
    const updated = [...soalKuis]
    updated[index] = { ...updated[index], ...partial }
    onChangeSoal(updated)
  }

  const removeSoal = (index: number) => {
    const updated = soalKuis.filter((_, i) => i !== index)
    onChangeSoal(updated.map((s, i) => ({ ...s, urutan: i + 1 })))
  }

  const updateOpsi = (soalIndex: number, opsiIndex: number, partial: Partial<OpsiKuisPayload>) => {
    const updated = [...soalKuis]
    const opsiLama = updated[soalIndex].opsi ? [...updated[soalIndex].opsi] : []
    
    // Jika user menandai opsi ini sebagai benar, set opsi lain jadi salah
    if (partial.isCorrect) {
      opsiLama.forEach(o => o.isCorrect = false)
    }

    opsiLama[opsiIndex] = { ...opsiLama[opsiIndex], ...partial }
    updated[soalIndex].opsi = opsiLama
    onChangeSoal(updated)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Builder Soal Kuis</h3>
          <p className="text-xs text-blue-600/80 dark:text-blue-400">Total: {soalKuis.length} Soal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowSettings(!showSettings)} leftIcon={<Settings2 size={16} />}>
            Pengaturan Kuis
          </Button>
          <Button size="sm" onClick={handleAddSoal} leftIcon={<Plus size={16} />}>
            Tambah Soal
          </Button>
        </div>
      </div>

      {showSettings && (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 text-emerald-600 accent-emerald-600"
              checked={settings.isAutograde || false}
              onChange={(e) => onChangeSettings({ ...settings, isAutograde: e.target.checked })}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Auto-Grade</span>
              <span className="text-xs text-gray-500">Nilai otomatis dikalkulasi berdasarkan kunci jawaban</span>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 text-emerald-600 accent-emerald-600"
              checked={settings.isAcakSoal || false}
              onChange={(e) => onChangeSettings({ ...settings, isAcakSoal: e.target.checked })}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Acak Urutan Soal</span>
              <span className="text-xs text-gray-500">Mencegah contek massal antar siswa di kelas</span>
            </div>
          </label>
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 text-emerald-600 accent-emerald-600"
              checked={settings.isAcakOpsi || false}
              onChange={(e) => onChangeSettings({ ...settings, isAcakOpsi: e.target.checked })}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Acak Pilihan Ganda</span>
              <span className="text-xs text-gray-500">Opsi jawaban A, B, C, D diacak posisinya</span>
            </div>
          </label>
          <label className={cn(
            "flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition",
            settings.isStrictBrowser ? "border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
          )}>
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 text-red-600 accent-red-600"
              checked={settings.isStrictBrowser || false}
              onChange={(e) => onChangeSettings({ ...settings, isStrictBrowser: e.target.checked })}
            />
            <div className="flex flex-col">
              <span className={cn("text-sm font-medium", settings.isStrictBrowser ? "text-red-700 dark:text-red-400" : "")}>
                Mode Anti-Curang (Strict Browser)
              </span>
              <span className="text-xs text-gray-500">Wajib fullscreen. Hukuman reset jika beralih tab</span>
            </div>
          </label>
        </div>
      )}

      <div className="space-y-4">
        {soalKuis.length === 0 && (
          <div className="p-12 text-center text-sm text-gray-500 bg-white border border-dashed rounded-xl dark:bg-gray-900 dark:border-gray-800">
            Belum ada soal. Klik &quot;Tambah Soal&quot; untuk mulai membuat kuis.
          </div>
        )}

        {soalKuis.map((soal, sIndex) => {
          const isCollapsed = collapsedSoal[sIndex]
          
          return (
          <div key={sIndex} className={cn(
            "rounded-xl border bg-white dark:bg-gray-900 shadow-sm relative group transition-all",
            isCollapsed ? "border-gray-200 dark:border-gray-800 p-3" : "border-gray-200 dark:border-gray-800 p-4"
          )}>
            <div className="absolute top-3 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => toggleCollapse(sIndex)} className="text-gray-400 p-1 hover:bg-gray-50 rounded dark:hover:bg-gray-800" title={isCollapsed ? "Buka Soal" : "Kecilkan Soal"}>
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              </button>
              <button onClick={() => removeSoal(sIndex)} className="text-red-500 p-1 hover:bg-red-50 rounded dark:hover:bg-red-900/30" title="Hapus Soal">
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className="flex items-start gap-3">
              <div className={cn("cursor-move text-gray-400", isCollapsed ? "mt-0.5" : "mt-2")}>
                <GripVertical size={18} />
              </div>
              <div className="flex-1 space-y-4 pr-16">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleCollapse(sIndex)}>
                  <span className="font-semibold text-gray-700 dark:text-gray-300 shrink-0">Soal {soal.urutan}</span>
                  {!isCollapsed && (
                    <>
                      <input 
                        type="number"
                        min="1"
                        title="Bobot/Poin Soal"
                        value={soal.bobot}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateSoal(sIndex, { bobot: parseInt(e.target.value) || 1 })}
                        className="w-16 h-7 px-2 text-xs border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-center"
                        placeholder="Poin"
                      />
                      <span className="text-xs text-gray-500">Poin</span>
                    </>
                  )}
                  {isCollapsed && (
                    <div className="flex-1 truncate text-sm text-gray-500">
                      {soal.pertanyaan ? soal.pertanyaan.replace(/<[^>]+>/g, '').substring(0, 80) + '...' : <span className="italic">Pertanyaan kosong...</span>}
                    </div>
                  )}
                </div>

                {!isCollapsed && (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                  <div className="w-full">
                    <RichTextEditor
                      value={soal.pertanyaan}
                      onChange={(val) => updateSoal(sIndex, { pertanyaan: val })}
                      placeholder="Ketik pertanyaan di sini..."
                      minHeight="120px"
                    />
                  </div>
                  
                  {/* Action Bar Bawah Soal */}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => toggleImgSoal(sIndex)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                        showImgSoal[sIndex] || soal.gambarUrl
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                      )}
                    >
                      <ImageIcon size={14} />
                      {soal.gambarUrl ? "Gambar Disematkan" : "Tambahkan Gambar"}
                    </button>
                  </div>

                  {(showImgSoal[sIndex] || soal.gambarUrl) && (
                    <div className="w-64 mt-2">
                      <FileUpload 
                        label="Gambar Soal (Opsional)"
                        compact
                        accept=".jpg,.jpeg,.png,.webp"
                        hint="Gambar pendukung soal"
                        currentKey={soal.gambarUrl}
                        onUpload={uploadApi.tugas}
                        onSuccess={(key) => updateSoal(sIndex, { gambarUrl: key })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-xs font-medium text-gray-500">Pilihan Jawaban</p>
                  {soal.opsi?.map((opsi, oIndex) => {
                    const imgKey = `${sIndex}-${oIndex}`
                    const showImg = showImgOpsi[imgKey] || opsi.gambarUrl

                    return (
                      <div key={oIndex} className={cn(
                        "flex flex-col gap-2 p-3 rounded-lg border transition-colors",
                        opsi.isCorrect ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-600" : "border-gray-200 dark:border-gray-800"
                      )}>
                        <div className="flex items-start gap-3">
                          <label className="cursor-pointer mt-2.5 px-1 flex items-center justify-center" title="Tandai sebagai kunci jawaban">
                            <input 
                              type="radio"
                              name={`correct-${sIndex}`}
                              checked={opsi.isCorrect}
                              onChange={() => updateOpsi(sIndex, oIndex, { isCorrect: true })}
                              className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                            />
                          </label>
                          <textarea 
                            placeholder={`Ketik opsi ${String.fromCharCode(65 + oIndex)}`}
                            value={opsi.teks}
                            onChange={(e) => updateOpsi(sIndex, oIndex, { teks: e.target.value })}
                            rows={1}
                            className="flex-1 min-h-[40px] px-3 py-2 text-sm rounded border-gray-200 focus:border-emerald-400 focus:ring-0 outline-none bg-white dark:bg-gray-900 dark:border-gray-700 resize-none"
                          />
                          <button
                            type="button"
                            onClick={() => toggleImgOpsi(sIndex, oIndex)}
                            className={cn(
                              "mt-2 shrink-0 p-1.5 rounded transition-colors",
                              showImg
                                ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                            title="Tambahkan Gambar Opsi"
                          >
                            <ImageIcon size={16} />
                          </button>
                        </div>

                        {showImg && (
                          <div className="ml-10 w-64 border-t border-dashed border-gray-100 dark:border-gray-800 pt-3 mt-1">
                            <FileUpload 
                              label={`Gambar Opsi ${String.fromCharCode(65 + oIndex)}`}
                              compact
                              accept=".jpg,.jpeg,.png,.webp"
                              currentKey={opsi.gambarUrl}
                              onUpload={uploadApi.tugas}
                              onSuccess={(key) => updateOpsi(sIndex, oIndex, { gambarUrl: key })}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
