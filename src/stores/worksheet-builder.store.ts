'use client'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid' // built-in ke Next.js
import type { HalamanDraft, WidgetDraft, KonfigurasiWidget, SaveDefinitionPayload } from '@/types/worksheet.types'
import { TipeWidgetWorksheet } from '@/types/worksheet.types'

// ── Default sizes per tipe widget ─────────────────────────────────────────

const DEFAULT_SIZE: Record<TipeWidgetWorksheet, { w: number; h: number }> = {
  [TipeWidgetWorksheet.TEXT_INPUT]:     { w: 0.25, h: 0.05 },
  [TipeWidgetWorksheet.NUMBER_INPUT]:   { w: 0.12, h: 0.05 },
  [TipeWidgetWorksheet.MULTIPLE_CHOICE]:{ w: 0.30, h: 0.18 },
  [TipeWidgetWorksheet.DROPDOWN]:       { w: 0.22, h: 0.05 },
  [TipeWidgetWorksheet.FILL_IN_BLANK]:  { w: 0.18, h: 0.05 },
  [TipeWidgetWorksheet.AUDIO_PLAYER]:   { w: 0.28, h: 0.06 },
  [TipeWidgetWorksheet.DRAWING_AREA]:   { w: 0.40, h: 0.25 },
  [TipeWidgetWorksheet.MATCHING]:       { w: 0.42, h: 0.32 },
}

// ── Store interface ────────────────────────────────────────────────────────

interface WorksheetBuilderState {
  halaman:             HalamanDraft[]
  halamanAktifIndex:   number
  widgetTerpilihId:    string | null
  isDirty:             boolean   // ada perubahan belum tersimpan

  // ── Halaman ──
  addHalaman:         (imageKey: string, imageUrl: string) => void
  removeHalaman:      (index: number) => void
  setHalamanAktif:    (index: number) => void
  updateHalamanImage: (index: number, imageKey: string, imageUrl: string) => void
  reorderHalaman:     (from: number, to: number) => void

  // ── Widget ──
  addWidget:          (tipe: TipeWidgetWorksheet, dropX?: number, dropY?: number) => void
  updateWidget:       (id: string, partial: Partial<WidgetDraft>) => void
  updateKonfigurasi:  (id: string, cfg: Partial<KonfigurasiWidget>) => void
  removeWidget:       (id: string) => void
  selectWidget:       (id: string | null) => void
  duplicateWidget:    (id: string) => void

  // ── Init / reset ──
  loadFromServer:     (halaman: HalamanDraft[]) => void
  reset:              () => void
  markClean:          () => void

  // ── Computed ──
  toSavePayload:      (tugasId: string) => SaveDefinitionPayload
  getHalamanAktif:    () => HalamanDraft | null
  getWidgetTerpilih:  () => WidgetDraft | null
}

// ── Helper: nanoid pakai Math.random (tidak perlu crypto) ──────────────────
function genId() { return 'w-' + Math.random().toString(36).slice(2, 10) }

// ── Store ──────────────────────────────────────────────────────────────────

export const useWorksheetBuilderStore = create<WorksheetBuilderState>()(
  immer((set, get) => ({
    halaman:           [],
    halamanAktifIndex: 0,
    widgetTerpilihId:  null,
    isDirty:           false,

    // ── Halaman ──────────────────────────────────────────────────────────

    addHalaman: (imageKey, imageUrl) =>
      set((s) => {
        s.halaman.push({
          id: genId(),
          urutan: s.halaman.length,
          imageKey,
          imageUrl,
          widget: [],
        })
        s.halamanAktifIndex = s.halaman.length - 1
        s.isDirty = true
      }),

    removeHalaman: (index) =>
      set((s) => {
        s.halaman.splice(index, 1)
        s.halaman.forEach((h, i) => { h.urutan = i })
        s.halamanAktifIndex = Math.max(0, Math.min(s.halamanAktifIndex, s.halaman.length - 1))
        s.widgetTerpilihId  = null
        s.isDirty = true
      }),

    setHalamanAktif: (index) =>
      set((s) => {
        s.halamanAktifIndex = index
        s.widgetTerpilihId = null
      }),

    updateHalamanImage: (index, imageKey, imageUrl) =>
      set((s) => {
        if (!s.halaman[index]) return
        s.halaman[index].imageKey = imageKey
        s.halaman[index].imageUrl = imageUrl
        s.isDirty = true
      }),

    reorderHalaman: (from, to) =>
      set((s) => {
        const [moved] = s.halaman.splice(from, 1)
        s.halaman.splice(to, 0, moved)
        s.halaman.forEach((h, i) => { h.urutan = i })
        s.halamanAktifIndex = to
        s.isDirty = true
      }),

    // ── Widget ───────────────────────────────────────────────────────────

    addWidget: (tipe, dropX = 0.1, dropY = 0.1) =>
      set((s) => {
        const hal = s.halaman[s.halamanAktifIndex]
        if (!hal) return
        const { w, h } = DEFAULT_SIZE[tipe]
        const id = genId()
        const newWidget: WidgetDraft = {
          id,
          tipe,
          label:     '',
          posisiX:   Math.min(dropX, 1 - w),
          posisiY:   Math.min(dropY, 1 - h),
          lebarPct:  w,
          tinggiPct: h,
          urutan:    hal.widget.length,
          konfigurasi: tipe === TipeWidgetWorksheet.MULTIPLE_CHOICE
            ? { options: ['', '', '', ''], bobot: 1 }
            : tipe === TipeWidgetWorksheet.DROPDOWN
              ? { options: ['', ''], bobot: 1 }
              : tipe === TipeWidgetWorksheet.MATCHING
                ? { pairs: [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }], bobot: 1 }
                : { bobot: 1 },
        }
        hal.widget.push(newWidget)
        s.widgetTerpilihId = id
        s.isDirty = true
      }),

    updateWidget: (id, partial) =>
      set((s) => {
        for (const hal of s.halaman) {
          const w = hal.widget.find((w) => w.id === id)
          if (w) {
            Object.assign(w, partial)
            s.isDirty = true
            return
          }
        }
      }),

    updateKonfigurasi: (id, cfg) =>
      set((s) => {
        for (const hal of s.halaman) {
          const w = hal.widget.find((w) => w.id === id)
          if (w) {
            w.konfigurasi = { ...(w.konfigurasi ?? {}), ...cfg }
            s.isDirty = true
            return
          }
        }
      }),

    removeWidget: (id) =>
      set((s) => {
        for (const hal of s.halaman) {
          const idx = hal.widget.findIndex((w) => w.id === id)
          if (idx >= 0) {
            hal.widget.splice(idx, 1)
            hal.widget.forEach((w, i) => { w.urutan = i })
            if (s.widgetTerpilihId === id) s.widgetTerpilihId = null
            s.isDirty = true
            return
          }
        }
      }),

    selectWidget: (id) =>
      set((s) => { s.widgetTerpilihId = id }),

    duplicateWidget: (id) =>
      set((s) => {
        for (const hal of s.halaman) {
          const w = hal.widget.find((w) => w.id === id)
          if (w) {
            const copy: WidgetDraft = {
              ...JSON.parse(JSON.stringify(w)),
              id:      genId(),
              posisiX: Math.min(w.posisiX + 0.02, 0.95),
              posisiY: Math.min(w.posisiY + 0.02, 0.95),
              urutan:  hal.widget.length,
            }
            hal.widget.push(copy)
            s.widgetTerpilihId = copy.id
            s.isDirty = true
            return
          }
        }
      }),

    // ── Init / reset ─────────────────────────────────────────────────────

    loadFromServer: (halaman) =>
      set((s) => {
        s.halaman = halaman.map((h) => ({
          ...h,
          widget: h.widget.map((w) => ({ ...w })),
        }))
        s.halamanAktifIndex = 0
        s.widgetTerpilihId  = null
        s.isDirty           = false
      }),

    reset: () =>
      set((s) => {
        s.halaman           = []
        s.halamanAktifIndex = 0
        s.widgetTerpilihId  = null
        s.isDirty           = false
      }),

    markClean: () => set((s) => { s.isDirty = false }),

    // ── Computed ─────────────────────────────────────────────────────────

    toSavePayload: (tugasId) => ({
      tugasId,
      halaman: get().halaman.map((h, hi) => ({
        urutan:   hi,
        imageKey: h.imageKey,
        widget:   h.widget.map((w, wi) => ({
          tipe:        w.tipe,
          label:       w.label,
          posisiX:     w.posisiX,
          posisiY:     w.posisiY,
          lebarPct:    w.lebarPct,
          tinggiPct:   w.tinggiPct,
          urutan:      wi,
          konfigurasi: w.konfigurasi,
        })),
      })),
    }),

    getHalamanAktif: () => {
      const { halaman, halamanAktifIndex } = get()
      return halaman[halamanAktifIndex] ?? null
    },

    getWidgetTerpilih: () => {
      const { halaman, widgetTerpilihId } = get()
      if (!widgetTerpilihId) return null
      for (const h of halaman) {
        const w = h.widget.find((w) => w.id === widgetTerpilihId)
        if (w) return w
      }
      return null
    },
  })),
)
