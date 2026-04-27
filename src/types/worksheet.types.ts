// ── Enums ──────────────────────────────────────────────────────────────────

export enum TipeWidgetWorksheet {
  TEXT_INPUT      = 'TEXT_INPUT',
  NUMBER_INPUT    = 'NUMBER_INPUT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  DROPDOWN        = 'DROPDOWN',
  FILL_IN_BLANK   = 'FILL_IN_BLANK',
  AUDIO_PLAYER    = 'AUDIO_PLAYER',
  DRAWING_AREA    = 'DRAWING_AREA',
  MATCHING        = 'MATCHING',
}

// Tipe yang bisa auto-grade
export const AUTO_GRADE_TYPES: TipeWidgetWorksheet[] = [
  TipeWidgetWorksheet.MULTIPLE_CHOICE,
  TipeWidgetWorksheet.DROPDOWN,
  TipeWidgetWorksheet.FILL_IN_BLANK,
  TipeWidgetWorksheet.NUMBER_INPUT,
  TipeWidgetWorksheet.MATCHING,
];

// Tipe yang siswa isi secara interaktif (bukan hanya dengarkan)
export const INPUT_TYPES: TipeWidgetWorksheet[] = [
  TipeWidgetWorksheet.TEXT_INPUT,
  TipeWidgetWorksheet.NUMBER_INPUT,
  TipeWidgetWorksheet.MULTIPLE_CHOICE,
  TipeWidgetWorksheet.DROPDOWN,
  TipeWidgetWorksheet.FILL_IN_BLANK,
  TipeWidgetWorksheet.DRAWING_AREA,
  TipeWidgetWorksheet.MATCHING,
];

// ── Konfigurasi per tipe ───────────────────────────────────────────────────

export interface MatchingPair {
  left:  string;
  right: string;
}

export interface KonfigurasiWidget {
  // TEXT_INPUT / NUMBER_INPUT / FILL_IN_BLANK
  correctAnswer?: string;
  bobot?: number;
  placeholder?: string;
  isRequired?: boolean;
  // MULTIPLE_CHOICE / DROPDOWN
  options?: string[];
  // AUDIO_PLAYER
  audioKey?: string;
  audioUrl?: string; // presigned (runtime only)
  // DRAWING_AREA
  bgColor?: string;
  // MATCHING
  pairs?: MatchingPair[];
}

// ── Widget ─────────────────────────────────────────────────────────────────

export interface WidgetWorksheet {
  id: string;
  halamanId: string;
  tipe: TipeWidgetWorksheet;
  label?: string;
  posisiX: number;   // 0.0 – 1.0 relatif terhadap lebar gambar
  posisiY: number;   // 0.0 – 1.0 relatif terhadap tinggi gambar
  lebarPct: number;  // 0.0 – 1.0
  tinggiPct: number; // 0.0 – 1.0
  urutan: number;
  konfigurasi?: KonfigurasiWidget;
  audioUrl?: string; // presigned (runtime, dari server)
}

// Widget dalam state builder (sebelum disimpan, id bisa temp)
export interface WidgetDraft extends Omit<WidgetWorksheet, 'id' | 'halamanId'> {
  id: string; // bisa "temp-{uuid}" sebelum disimpan
}

// ── Halaman ────────────────────────────────────────────────────────────────

export interface HalamanWorksheet {
  id: string;
  tugasId: string;
  urutan: number;
  imageKey: string;
  imageUrl?: string; // presigned (runtime)
  widget: WidgetWorksheet[];
}

export interface HalamanDraft {
  id: string;          // temp id sebelum simpan
  urutan: number;
  imageKey: string;
  imageUrl?: string;   // object URL (preview lokal) atau presigned
  widget: WidgetDraft[];
}

// ── Definisi lengkap ───────────────────────────────────────────────────────

export interface WorksheetDefinition {
  tugasId: string;
  halaman: HalamanWorksheet[];
}

// ── Jawaban siswa ──────────────────────────────────────────────────────────

export interface MyWorksheetJawaban {
  pengumpulanId: string | null;
  status: string | null;
  tanggalSubmit?: string | null;
  catatan?: string | null;         // catatan guru (untuk REVISI / kembalikan)
  jawaban: Record<string, string>; // widgetId → jawaban
}

// ── Payload kirim ke server ────────────────────────────────────────────────

export interface SaveDefinitionPayload {
  tugasId: string;
  halaman: {
    urutan: number;
    imageKey: string;
    widget: {
      tipe: TipeWidgetWorksheet;
      label?: string;
      posisiX: number;
      posisiY: number;
      lebarPct: number;
      tinggiPct: number;
      urutan: number;
      konfigurasi?: KonfigurasiWidget;
    }[];
  }[];
}

export interface GradeManualPayload {
  pengumpulanId: string;
  nilaiManual: number;
  catatan?: string;
}

// ── Grading ────────────────────────────────────────────────────────────────

export interface GradingRekapItem {
  pengumpulanId: string;
  siswaId: string;
  namaSiswa: string;
  status: string;
  tanggalSubmit: string | null;
  isLate: boolean;
  nilai: number | null;
  jumlahJawaban: number;
}

export interface GradingDetailResult {
  pengumpulanId: string;
  siswaId: string;
  namaSiswa: string;
  status: string;
  tanggalSubmit: string | null;
  isLate: boolean;
  nilai: number | null;
  jawaban: Record<string, string>;
}

// ── Upload ─────────────────────────────────────────────────────────────────

export interface PdfConvertResult {
  pages: { key: string; bucket: string; pageIndex: number }[];
}
