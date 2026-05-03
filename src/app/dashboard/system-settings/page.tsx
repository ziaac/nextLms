'use client'

import { useState, useEffect } from 'react'
import { Settings, Clock, School, ClipboardCheck, ToggleLeft, CreditCard, Bot, KeyRound, CheckCircle, XCircle, AlertTriangle, MessageSquareDiff } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton, PageHeader } from '@/components/ui'
import { useAllSettings, useUpdateSetting } from '@/hooks/pembayaran/useSystemSetting'
import { getErrorMessage } from '@/lib/utils'
import type { SystemSetting } from '@/types/pembayaran.types'

function get(settings: SystemSetting[], key: string): string {
  return settings.find((s) => s.key === key)?.value ?? ''
}
function getJson<T>(settings: SystemSetting[], key: string, fallback: T): T {
  try { const v = settings.find((s) => s.key === key)?.value; return v ? (JSON.parse(v) as T) : fallback } catch { return fallback }
}
function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon size={16} className="text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">{children}</div>
    </div>
  )
}
function Row({ label, description, settingKey, children }: { label: string; description: string; settingKey?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        {settingKey && <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">{settingKey}</code>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}
function ToggleSwitch({ id, checked, onChange, disabled }: { id: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
      <input id={id} type="checkbox" className="sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </label>
  )
}
function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"><CheckCircle size={12} />Aktif</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"><XCircle size={12} />Nonaktif</span>
  )
}
function TextInput({ value, onSave, disabled, placeholder, type = 'text', min, max }: { value: string; onSave: (v: string) => void; disabled?: boolean; placeholder?: string; type?: string; min?: number; max?: number }) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <input type={type} min={min} max={max}
      className="w-full sm:w-56 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
      value={local} placeholder={placeholder} disabled={disabled}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local.trim() !== value) onSave(local.trim()) }}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
    />
  )
}
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-96" /></div>
      {[1,2,3].map(i => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          {[1,2].map(j => (
            <div key={j} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div className="space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-64" /></div>
              <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
interface TabProps { settings: SystemSetting[]; onToggle: (key: string, value: string) => void; onSave: (key: string, value: string) => void; isPending: boolean }
const TABS = [
  { id: 'umum', label: 'Umum', icon: Clock },
  { id: 'sekolah', label: 'Sekolah', icon: School },
  { id: 'absensi', label: 'Absensi', icon: ClipboardCheck },
  { id: 'fitur', label: 'Fitur', icon: ToggleLeft },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'ai', label: 'AI Generator', icon: Bot },
  { id: 'prompt', label: 'Prompt AI', icon: MessageSquareDiff },
] as const
type TabId = (typeof TABS)[number]['id']
const AI_PROVIDERS = ['GEMINI', 'OPENAI', 'QWEN', 'DEEPSEEK', 'OPENROUTER'] as const
type AiProvider = (typeof AI_PROVIDERS)[number]
const AI_LABELS: Record<AiProvider, string> = { GEMINI: 'Google Gemini', OPENAI: 'OpenAI', QWEN: 'Alibaba Qwen', DEEPSEEK: 'DeepSeek', OPENROUTER: 'OpenRouter' }
const AI_MODELS: Record<AiProvider, string> = { GEMINI: 'gemini-3.1-flash-lite-preview', OPENAI: 'gpt-5.4-nano', QWEN: 'qwen3.5-plus', DEEPSEEK: 'deepseek-v4-flash', OPENROUTER: 'google/gemini-flash-1.5' }
const AI_DOCS: Record<AiProvider, string> = { GEMINI: 'https://aistudio.google.com/app/apikey', OPENAI: 'https://platform.openai.com/api-keys', QWEN: 'https://dashscope.console.aliyun.com', DEEPSEEK: 'https://platform.deepseek.com/api-keys', OPENROUTER: 'https://openrouter.ai/keys' }

function TabUmum({ settings, onSave, isPending }: TabProps) {
  return (
    <SectionCard title="Waktu & Lokalisasi" icon={Clock}>
      <Row label="Timezone" description="Timezone yang digunakan seluruh sistem." settingKey="timezone">
        <TextInput value={get(settings, 'timezone')} onSave={(v) => onSave('timezone', v)} disabled={isPending} placeholder="Asia/Makassar" />
      </Row>
      <Row label="Locale" description="Format tanggal dan angka." settingKey="locale">
        <TextInput value={get(settings, 'locale')} onSave={(v) => onSave('locale', v)} disabled={isPending} placeholder="id-ID" />
      </Row>
    </SectionCard>
  )
}
function TabSekolah({ settings, onSave, isPending }: TabProps) {
  const sekolah = getJson(settings, 'sekolah', { nama: '', namaSingkat: '', npsn: '', alamat: '', email: '', telepon: '', website: '' })
  const saveField = (field: string, value: string) => onSave('sekolah', JSON.stringify({ ...sekolah, [field]: value }))
  const fields: [string, string, string][] = [['nama','Nama Lengkap','Nama resmi madrasah/sekolah'],['namaSingkat','Nama Singkat','Nama singkat untuk tampilan'],['npsn','NPSN','Nomor Pokok Sekolah Nasional'],['alamat','Alamat','Alamat lengkap sekolah'],['email','Email','Email resmi sekolah'],['telepon','Telepon','Nomor telepon sekolah'],['website','Website','URL website resmi sekolah']]
  return (
    <SectionCard title="Identitas Sekolah" icon={School}>
      {fields.map(([field, label, desc]) => (
        <Row key={field} label={label} description={desc}>
          <TextInput value={(sekolah as Record<string,string>)[field] ?? ''} onSave={(v) => saveField(field, v)} disabled={isPending} placeholder={label} />
        </Row>
      ))}
    </SectionCard>
  )
}
function TabAbsensi({ settings, onSave, isPending }: TabProps) {
  const absensi = getJson(settings, 'absensi', { toleransiMenitDefault: 15, durasiSesiMenitDefault: 30, radiusGpsMeterDefault: 100 })
  const saveField = (field: string, value: number) => onSave('absensi', JSON.stringify({ ...absensi, [field]: value }))
  return (
    <SectionCard title="Konfigurasi Absensi" icon={ClipboardCheck}>
      <Row label="Toleransi Keterlambatan" description="Batas menit keterlambatan yang masih dianggap hadir." settingKey="absensi.toleransiMenitDefault">
        <div className="flex items-center gap-2"><TextInput type="number" min={0} max={60} value={String(absensi.toleransiMenitDefault)} onSave={(v) => saveField('toleransiMenitDefault', parseInt(v)||15)} disabled={isPending} placeholder="15" /><span className="text-sm text-gray-500">menit</span></div>
      </Row>
      <Row label="Durasi Sesi Absensi" description="Durasi default sesi absensi berlangsung." settingKey="absensi.durasiSesiMenitDefault">
        <div className="flex items-center gap-2"><TextInput type="number" min={5} max={120} value={String(absensi.durasiSesiMenitDefault)} onSave={(v) => saveField('durasiSesiMenitDefault', parseInt(v)||30)} disabled={isPending} placeholder="30" /><span className="text-sm text-gray-500">menit</span></div>
      </Row>
      <Row label="Radius GPS" description="Radius maksimum (meter) dari lokasi sekolah untuk absensi valid." settingKey="absensi.radiusGpsMeterDefault">
        <div className="flex items-center gap-2"><TextInput type="number" min={10} max={1000} value={String(absensi.radiusGpsMeterDefault)} onSave={(v) => saveField('radiusGpsMeterDefault', parseInt(v)||100)} disabled={isPending} placeholder="100" /><span className="text-sm text-gray-500">meter</span></div>
      </Row>
    </SectionCard>
  )
}
function TabFitur({ settings, onToggle, isPending }: TabProps) {
  const fitur = getJson(settings, 'fitur', { pendaftaranAktif: true, pembayaranAktif: true })
  const saveField = (field: string, value: boolean) => onToggle('fitur', JSON.stringify({ ...fitur, [field]: value }))
  return (
    <SectionCard title="Feature Flags" icon={ToggleLeft}>
      <Row label="Modul Pendaftaran Ulang" description="Aktifkan atau nonaktifkan modul pendaftaran ulang siswa." settingKey="fitur.pendaftaranAktif">
        <div className="flex items-center gap-3"><StatusBadge active={fitur.pendaftaranAktif} /><ToggleSwitch id="toggle-pendaftaran" checked={fitur.pendaftaranAktif} onChange={(v) => saveField('pendaftaranAktif', v)} disabled={isPending} /></div>
      </Row>
      <Row label="Modul Pembayaran" description="Aktifkan atau nonaktifkan modul pembayaran digital siswa." settingKey="fitur.pembayaranAktif">
        <div className="flex items-center gap-3"><StatusBadge active={fitur.pembayaranAktif} /><ToggleSwitch id="toggle-pembayaran" checked={fitur.pembayaranAktif} onChange={(v) => saveField('pembayaranAktif', v)} disabled={isPending} /></div>
      </Row>
    </SectionCard>
  )
}
function TabPayment({ settings, onToggle, onSave, isPending }: TabProps) {
  const activeProcessor = get(settings, 'payment.processor.active')
  const midtransEnabled = get(settings, 'payment.midtrans.enabled') === 'true'
  const dokuEnabled = get(settings, 'payment.doku.enabled') === 'true'
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['midtrans', 'doku'] as const).map((p) => {
          const enabled = p === 'midtrans' ? midtransEnabled : dokuEnabled
          return (
            <div key={p} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-2"><span className="font-semibold text-gray-900 dark:text-white capitalize">{p}</span><StatusBadge active={enabled} /></div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activeProcessor === p ? 'Sedang digunakan sebagai processor aktif' : 'Tidak digunakan sebagai processor aktif'}</p>
            </div>
          )
        })}
      </div>
      <SectionCard title="Konfigurasi Payment Gateway" icon={CreditCard}>
        <Row label="Processor Aktif" description="Payment gateway yang digunakan untuk memproses pembayaran digital." settingKey="payment.processor.active">
          <select className="w-full sm:w-48 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500" value={activeProcessor} disabled={isPending} onChange={(e) => onSave('payment.processor.active', e.target.value)}>
            <option value="midtrans">Midtrans</option><option value="doku">Doku</option>
          </select>
        </Row>
        <Row label="Aktifkan Midtrans" description="Aktifkan integrasi Midtrans sebagai payment gateway." settingKey="payment.midtrans.enabled">
          <div className="flex items-center gap-3"><span className="text-sm text-gray-500">{midtransEnabled ? 'Aktif' : 'Nonaktif'}</span><ToggleSwitch id="toggle-midtrans" checked={midtransEnabled} onChange={(v) => onToggle('payment.midtrans.enabled', v ? 'true' : 'false')} disabled={isPending} /></div>
        </Row>
        <Row label="Aktifkan Doku" description="Aktifkan integrasi Doku sebagai payment gateway." settingKey="payment.doku.enabled">
          <div className="flex items-center gap-3"><span className="text-sm text-gray-500">{dokuEnabled ? 'Aktif' : 'Nonaktif'}</span><ToggleSwitch id="toggle-doku" checked={dokuEnabled} onChange={(v) => onToggle('payment.doku.enabled', v ? 'true' : 'false')} disabled={isPending} /></div>
        </Row>
      </SectionCard>
    </div>
  )
}
function TabAI({ settings, onToggle, onSave, isPending }: TabProps) {
  const defaultProvider = get(settings, 'AI_DEFAULT_PROVIDER')
  const maxConcurrent = get(settings, 'AI_MAX_CONCURRENT_PER_GURU') || '3'
  const activeCount = AI_PROVIDERS.filter(p => get(settings, `AI_${p}_ENABLED`) !== 'false').length
  return (
    <div className="space-y-6">
      {activeCount === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">Semua provider dinonaktifkan. Guru hanya dapat menggunakan AI Generator dengan BYOA.</p>
        </div>
      )}
      <SectionCard title="Pengaturan Global" icon={Settings}>
        <Row label="Provider Default" description="Provider yang digunakan jika guru tidak memilih secara manual." settingKey="AI_DEFAULT_PROVIDER">
          <select className="w-full sm:w-48 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500" value={defaultProvider} disabled={isPending} onChange={(e) => onSave('AI_DEFAULT_PROVIDER', e.target.value)}>
            {AI_PROVIDERS.map(p => <option key={p} value={p}>{AI_LABELS[p]}</option>)}
          </select>
        </Row>
        <Row label="Maks. Generate Bersamaan per Guru" description="Batas maksimum job AI yang boleh berjalan bersamaan per guru (1-10)." settingKey="AI_MAX_CONCURRENT_PER_GURU">
          <TextInput type="number" min={1} max={10} value={maxConcurrent} onSave={(v) => { const n = parseInt(v); if (n >= 1 && n <= 10) onSave('AI_MAX_CONCURRENT_PER_GURU', String(n)) }} disabled={isPending} placeholder="3" />
        </Row>
      </SectionCard>
      <SectionCard title="Provider AI" icon={Bot}>
        {AI_PROVIDERS.map((provider) => {
          const isEnabled = get(settings, `AI_${provider}_ENABLED`) !== 'false'
          const modelValue = get(settings, `AI_${provider}_DEFAULT_MODEL`) || AI_MODELS[provider]
          const isDefault = defaultProvider === provider
          return (
            <div key={provider} className="py-5 first:pt-0 last:pb-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{AI_LABELS[provider]}</p>
                    <StatusBadge active={isEnabled} />
                    {isDefault && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400">Default</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">Model:</span>
                    <TextInput value={modelValue} onSave={(v) => onSave(`AI_${provider}_DEFAULT_MODEL`, v)} disabled={isPending} placeholder={AI_MODELS[provider]} />
                  </div>
                  <a href={AI_DOCS[provider]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline">
                    <KeyRound size={11} />Dapatkan API key
                  </a>
                </div>
                <div className="flex items-center gap-3 sm:pt-1">
                  <span className="text-sm text-gray-500">{isEnabled ? 'Aktif' : 'Nonaktif'}</span>
                  <ToggleSwitch id={`toggle-ai-${provider}`} checked={isEnabled} onChange={(v) => onToggle(`AI_${provider}_ENABLED`, v ? 'true' : 'false')} disabled={isPending} />
                </div>
              </div>
            </div>
          )
        })}
      </SectionCard>
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <KeyRound size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-600 dark:text-blue-400"><span className="font-semibold text-blue-800 dark:text-blue-300">BYOA (Bring Your Own API key): </span>Guru selalu dapat menggunakan API key milik sendiri. API key BYOA tidak pernah disimpan ke database.</p>
      </div>
    </div>
  )
}

// ─── Prompt Tab ───────────────────────────────────────────────────

/** Textarea dengan auto-save saat blur */
function PromptTextarea({ settingKey, value, onSave, disabled, placeholder }: {
  settingKey: string; value: string; onSave: (key: string, v: string) => void
  disabled?: boolean; placeholder?: string
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <code className="text-xs text-gray-400 dark:text-gray-500 font-mono">{settingKey}</code>
        {local !== value && (
          <span className="text-xs text-amber-500">Belum disimpan — klik di luar untuk simpan</span>
        )}
      </div>
      <textarea
        rows={12}
        className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y font-mono leading-relaxed"
        value={local}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { if (local !== value) onSave(settingKey, local) }}
      />
    </div>
  )
}

function TabPrompt({ settings, onSave, isPending }: TabProps) {
  const PROMPTS: { key: string; label: string; description: string; placeholder: string }[] = [
    {
      key:         'AI_PROMPT_RPP',
      label:       'Instruksi RPP',
      description: 'Instruksi output untuk generate RPP. Menggantikan instruksi hardcoded sistem. Kosongkan untuk menggunakan default sistem.',
      placeholder: 'Contoh:\nOutput JSON — WAJIB SATU FIELD:\n{"konten": "<seluruh RPP dalam satu string HTML>"}\n\nSTRUKTUR HTML:\n...',
    },
    {
      key:         'AI_PROMPT_MATERI',
      label:       'Instruksi Materi Pelajaran',
      description: 'Instruksi output untuk generate Materi Pelajaran. Kosongkan untuk menggunakan default.',
      placeholder: 'Contoh:\nOutput JSON:\n{"judul": "...", "konten": "<html>", ...}',
    },
    {
      key:         'AI_PROMPT_TUGAS',
      label:       'Instruksi Tugas / Kuis',
      description: 'Instruksi output untuk generate Tugas dan Soal Kuis. Kosongkan untuk menggunakan default.',
      placeholder: 'Contoh:\nOutput JSON:\n{"judul": "...", "soalKuis": [...]}',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
        <MessageSquareDiff size={16} className="text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-violet-800 dark:text-violet-300">Custom Prompt Instructions</p>
          <p className="text-xs text-violet-600 dark:text-violet-400">
            Instruksi di sini menggantikan instruksi output hardcoded sistem untuk setiap jenis konten.
            Jika dikosongkan, sistem menggunakan instruksi default bawaan.
            Perubahan langsung berlaku untuk generate berikutnya — tidak perlu restart server.
          </p>
        </div>
      </div>

      {PROMPTS.map(({ key, label, description, placeholder }) => (
        <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          </div>
          <PromptTextarea
            settingKey={key}
            value={get(settings, key)}
            onSave={onSave}
            disabled={isPending}
            placeholder={placeholder}
          />
          {get(settings, key) && (
            <button
              className="text-xs text-red-500 hover:text-red-600 transition-colors"
              disabled={isPending}
              onClick={() => onSave(key, '')}
            >
              Reset ke default sistem
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('umum')
  const { data: settings = [], isLoading, error } = useAllSettings()
  const updateSetting = useUpdateSetting()

  useEffect(() => { if (error) toast.error(getErrorMessage(error)) }, [error])

  const handleSave = async (key: string, value: string) => {
    try { await updateSetting.mutateAsync({ key, value }); toast.success('Pengaturan disimpan') }
    catch (err) { toast.error(getErrorMessage(err)) }
  }
  const handleToggle = async (key: string, value: string) => {
    try { await updateSetting.mutateAsync({ key, value }); toast.success('Pengaturan disimpan') }
    catch (err) { toast.error(getErrorMessage(err)) }
  }

  const tabProps: TabProps = { settings, onToggle: handleToggle, onSave: handleSave, isPending: updateSetting.isPending }

  if (isLoading) return <SettingsSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan Sistem" description="Kelola semua konfigurasi sistem LMS MAN 2 Kota Makassar" />

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id as TabId)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === id ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'umum'    && <TabUmum    {...tabProps} />}
      {activeTab === 'sekolah' && <TabSekolah {...tabProps} />}
      {activeTab === 'absensi' && <TabAbsensi {...tabProps} />}
      {activeTab === 'fitur'   && <TabFitur   {...tabProps} />}
      {activeTab === 'payment' && <TabPayment {...tabProps} />}
      {activeTab === 'ai'      && <TabAI      {...tabProps} />}
      {activeTab === 'prompt'  && <TabPrompt  {...tabProps} />}
    </div>
  )
}
