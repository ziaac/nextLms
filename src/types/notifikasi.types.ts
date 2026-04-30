import type { TipeNotifikasi } from './enums'

// ── Entity ────────────────────────────────────────────────────────────────────
export interface NotifikasiItem {
  id: string
  userId: string
  judul: string
  pesan: string
  tipe: TipeNotifikasi
  referenceId: string | null
  referenceType: string | null
  actionUrl: string | null
  imageUrl: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

// ── API Response Shapes ───────────────────────────────────────────────────────
export interface NotifikasiListResponse {
  data: NotifikasiItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    lastId?: string
  }
  totalUnread: number
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkAsReadResponse {
  message: string
  count: number
}

export interface ClearReadResponse {
  message: string
  count: number
}

// ── Query Params ──────────────────────────────────────────────────────────────
export interface NotifikasiQueryParams {
  page?: number
  limit?: number
  tipe?: TipeNotifikasi
  isRead?: boolean
}

// ── Mutation Payloads ─────────────────────────────────────────────────────────
export interface BroadcastPayload {
  judul: string
  pesan: string
  targetRole?: string
  actionUrl?: string
}

// ── Socket Event Payload ──────────────────────────────────────────────────────
export interface NotifikasiBaru {
  id: string
  judul: string
  pesan: string
  tipe: TipeNotifikasi
  actionUrl: string | null
  createdAt: string
}
