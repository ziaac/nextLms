'use client'

import { MousePointerClick, User, MapPin, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { useBebanMengajar } from '@/hooks/jadwal/useJadwal'
import type { CellKey, GridState, PaletteMapel } from './jadwal-form.types'
import type { HariEnum, KetersediaanResponse, BebanMengajarResponse } from '@/types/jadwal.types'
import type { MasterJam } from '@/types/master-jam.types'
import { useState } from 'react'

interface RuanganOption { id: string; nama: string; jenis: string }

interface Props {
  focusedCellKey:      CellKey | null
  gridState:           GridState
  paletteMapel:        PaletteMapel[]
  masterJamAll:        MasterJam[]
  kelasRuanganId:      string
  kelasRuanganNama:    string
  ruanganOverrideList: RuanganOption[]
  ketersediaan:        KetersediaanResponse | null
  isLoading:           boolean
  semesterId:          string
  onAssignGuru:        (cellKey: CellKey, guruId: string) => void
  onRemoveGuru:        (cellKey: CellKey) => void
  onDeleteJadwal:      (cellKey: CellKey, jadwalId: string) => void
  onAssignRuangan:     (cellKey: CellKey, ruanganId: string, nama: string) => void
}

const HARI_LABEL: Record<string, string> = {
  SENIN: 'Senin', SELASA: 'Selasa', RABU: 'Rabu',
  KAMIS: 'Kamis', JUMAT: 'Jumat',   SABTU: 'Sabtu',
}

export function KetersediaanPanel({
  focusedCellKey, gridState, paletteMapel, masterJamAll,
  kelasRuanganId, kelasRuanganNama, ruanganOverrideList,
  ketersediaan, isLoading, semesterId,
  onAssignGuru, onRemoveGuru, onDeleteJadwal, onAssignRuangan,
}: Props) {
  const cellState = focusedCellKey ? gridState[focusedCellKey] : undefined
  const hasMapel  = !!cellState?.mataPelajaranId

  let hariLabel = ''
  let mjInfo: MasterJam | undefined
  if (focusedCellKey) {
    const parts     = focusedCellKey.split('-')
    const hari      = parts[0] as HariEnum
    const masterJamId = parts.slice(1).join('-')
    hariLabel = HARI_LABEL[hari] ?? hari
    mjInfo    = masterJamAll.find((m) => m.id === masterJamId)
  }

  const guruPool = hasMapel
    ? (paletteMapel.find((p) => p.id === cellState!.mataPelajaranId)?.guruPool ?? [])
    : []

  // API mengembalikan guru BENTROK
  const tersediaGuruSet: Set<string> | null = ketersediaan
    ? new Set((ketersediaan.guruTersedia ?? []).map((g) => g.id))
    : null

  const tersediaRuanganSet: Set<string> | null = ketersediaan
    ? new Set((ketersediaan.ruanganTersedia ?? []).map((r) => r.id))
    : null

  const assignedGuruId    = cellState?.guruId ?? ''
  const assignedRuanganId = cellState?.ruanganId ?? kelasRuanganId
  const [confirmRemoveGuruId, setConfirmRemoveGuruId] = useState<string | null>(null)


  // Hitung usage guru di form ini (JP, pakai bobotJp dari masterJam)
  const guruUsageJP = (guruId: string): number => {
    let jp = 0
    for (const [key, cell] of Object.entries(gridState)) {
      if (cell?.guruId !== guruId) continue
      const mjId = key.split('-').slice(1).join('-')
      const mj   = masterJamAll.find((m) => m.id === mjId)
      jp += mj?.bobotJp ?? 1
    }
    return jp
  }

  if (!focusedCellKey || !hasMapel) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Guru & Ruangan</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MousePointerClick className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Klik sel yang sudah berisi<br />mata pelajaran untuk<br />memilih guru & ruangan
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-emerald-50 dark:bg-emerald-900/10">
        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Sel Aktif</p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">
          {cellState.mataPelajaranNama}
        </p>
        <p className="text-[10px] text-gray-400">
          {hariLabel}{mjInfo ? ' · ' + mjInfo.jamMulai + '–' + mjInfo.jamSelesai : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── GURU ─────────────────────────────────────────────── */}
        <div className="px-3 pt-3 pb-1.5">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <User className="h-3 w-3" />Guru
            {isLoading && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
          </p>

<div className="space-y-1">
            {guruPool.length === 0 && (
              <p className="text-[10px] text-gray-400 italic text-center py-2">
                Belum ada guru untuk mapel ini
              </p>
            )}
          {guruPool.map((g) => {
            const isAssigned = g.guruId === assignedGuruId
            const isBusy     = !isAssigned
              && !isLoading
              && tersediaGuruSet !== null
              && !tersediaGuruSet.has(g.guruId)
            const jpDiForm   = guruUsageJP(g.guruId)

            return (
              <GuruItem
                key={g.guruId}
                guruId={g.guruId}
                namaLengkap={g.namaLengkap}
                isAssigned={isAssigned}
                isBusy={isBusy}
                jpDiForm={jpDiForm}
                semesterId={semesterId}
                onClick={() => {
                  if (isBusy) return
                  if (isAssigned) {
                    // Jika ada jadwalId (sudah tersimpan di DB) → minta konfirmasi
                    if (cellState?.jadwalId) {
                      setConfirmRemoveGuruId(g.guruId)
                    } else {
                      onRemoveGuru(focusedCellKey)
                    }
                  } else {
                    onAssignGuru(focusedCellKey, g.guruId)
                  }
                }}
              />
            )
          })}

    {/* Konfirmasi hapus guru dari DB */}
    {confirmRemoveGuruId && (
      <div className="mt-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-2.5 space-y-2">
        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
          Hapus guru dari jadwal ini?
        </p>
        <p className="text-[10px] text-red-500 dark:text-red-400">
          Data jadwal guru akan dihapus dari database dan slot ini akan kosong.
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setConfirmRemoveGuruId(null)}
            className="flex-1 px-2 py-1 rounded text-[10px] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              if (cellState?.jadwalId) {
                onDeleteJadwal(focusedCellKey, cellState.jadwalId)
              }
              setConfirmRemoveGuruId(null)
            }}
            className="flex-1 px-2 py-1 rounded text-[10px] bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    )}
          </div>
        </div>

        <div className="mx-3 h-px bg-gray-100 dark:bg-gray-800 my-2" />

        {/* ── RUANGAN ───────────────────────────────────────────── */}
        <div className="px-3 pb-3">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />Ruangan
          </p>

          {kelasRuanganId && (
            <RuanganItem id={kelasRuanganId} nama={kelasRuanganNama || 'Ruangan Kelas'}
              jenis="KELAS" isSelected={assignedRuanganId === kelasRuanganId}
              isBusy={tersediaRuanganSet !== null && !tersediaRuanganSet.has(kelasRuanganId)}
              onSelect={() => onAssignRuangan(focusedCellKey, kelasRuanganId, kelasRuanganNama)} />
          )}

          {ruanganOverrideList.length > 0 && (
            <>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-2 mb-1 font-bold">Lab & Lainnya</p>
              <div className="space-y-1">
                {ruanganOverrideList.map((r) => (
                  <RuanganItem key={r.id} id={r.id} nama={r.nama} jenis={r.jenis}
                    isSelected={assignedRuanganId === r.id}
                    isBusy={tersediaRuanganSet !== null && !tersediaRuanganSet.has(r.id)}
                    onSelect={() => onAssignRuangan(focusedCellKey, r.id, r.nama)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── GuruItem — dengan akumulasi JP dari DB ─────────────────────
function GuruItem({
  guruId, namaLengkap, isAssigned, isBusy, jpDiForm, semesterId, onClick,
}: {
  guruId:       string
  namaLengkap:  string
  isAssigned:   boolean
  isBusy:       boolean
  jpDiForm:     number
  semesterId:   string
  onClick:      () => void
}) {
  // Fetch beban dari DB (JP semester ini di semua kelas)
  const { data: bebanRaw } = useBebanMengajar(guruId, semesterId || undefined)
  const beban = bebanRaw as BebanMengajarResponse | undefined
  const jpDB  = beban?.totalSemuaJam ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors text-left',
        isAssigned
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
          : isBusy
          ? 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      ].join(' ')}
    >
      <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
        {isAssigned
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          : <User className="h-3 w-3 text-gray-500" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">
          {namaLengkap}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {/* JP di form ini */}
          {jpDiForm > 0 && (
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />{jpDiForm} JP (form)
            </span>
          )}
          {/* JP di DB semester ini */}
          {jpDB > 0 && (
            <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />{jpDB} JP (semester)
            </span>
          )}
          {/* Status */}
          {isBusy && !isAssigned && (
            <span className="text-[9px] text-orange-400">Bentrok jam ini</span>
          )}
          {!isBusy && !isAssigned && jpDiForm === 0 && jpDB === 0 && (
            <span className="text-[9px] text-gray-400">Tersedia</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── RuanganItem ───────────────────────────────────────────────
function RuanganItem({ id, nama, jenis, isSelected, isBusy, onSelect }: {
  id: string; nama: string; jenis: string
  isSelected: boolean; isBusy: boolean; onSelect: () => void
}) {
  const jenisColor: Record<string, string> = {
    KELAS: 'bg-blue-100 text-blue-600', LAB: 'bg-amber-100 text-amber-600',
    LAINNYA: 'bg-gray-100 text-gray-500', AULA: 'bg-purple-100 text-purple-600',
  }
  return (
    <button type="button" onClick={onSelect}
      className={[
        'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border transition-colors text-left',
        isSelected ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
          : isBusy  ? 'border-gray-100 opacity-50'
          : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 hover:border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      ].join(' ')}>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{nama}</span>
        {isBusy && !isSelected && (
          <span className="text-[9px] text-gray-400 italic">Terpakai di jam ini</span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className={'text-[9px] font-bold px-1 py-0.5 rounded ' + (jenisColor[jenis] ?? jenisColor['LAINNYA'])}>{jenis}</span>
        {isSelected && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
      </div>
    </button>
  )
}
