'use client'

import React, { useState } from 'react'
import {
  MessageCircle, Send, Trash2, Pin, PinOff, Lock,
  ChevronDown, ChevronUp, Loader2, MessageSquare,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import {
  DiskusiItem, BalasanItem,
} from '@/lib/api/diskusi.api'

// ─── shared types ─────────────────────────────────────────────────────────────

export interface DiskusiPanelHooks {
  /** list query */
  items:     DiskusiItem[]
  loading:   boolean
  /** mutations */
  onCreate:  (payload: { isi: string; isPrivate?: boolean }) => Promise<unknown>
  onDelete:  (diskusiId: string) => Promise<unknown>
  onPin:     (diskusiId: string) => Promise<unknown>
  onReply:   (diskusiId: string, isi: string) => Promise<unknown>
  onDeleteReply: (balasanId: string) => Promise<unknown>
  /** for guru: toggle diskusi aktif */
  isDiskusiAktif?:  boolean
  onToggleAktif?:   () => Promise<unknown>
  /** pending states */
  creatingDiskusi?: boolean
  deletingId?:      string | null
  pinningId?:       string | null
  replyingId?:      string | null
  deletingReplyId?: string | null
}

interface Props extends DiskusiPanelHooks {
  /** for UI labeling */
  contextLabel?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const GURU_ROLES = ['GURU', 'WALI_KELAS', 'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH']

function isGuru(role: string): boolean {
  return GURU_ROLES.includes(role)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Avatar({ name, foto }: { name: string; foto?: string | null }) {
  if (foto) {
    return <img src={foto} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center shrink-0 font-semibold">
      {initials}
    </div>
  )
}

interface BalasanCardProps {
  balasan: BalasanItem
  myId: string
  myRole: string
  onDelete: (id: string) => Promise<unknown>
  deleting: boolean
}

function BalasanCard({ balasan, myId, myRole, onDelete, deleting }: BalasanCardProps) {
  const canDelete = isGuru(myRole) || balasan.user.id === myId
  const nama = balasan.user.profile?.namaLengkap ?? 'Pengguna'

  return (
    <div className="flex gap-2 group">
      <Avatar name={nama} foto={balasan.user.profile?.fotoUrl} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{nama}</span>
          <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">{fmtDate(balasan.createdAt)}</span>
          {canDelete && (
            <button
              onClick={() => onDelete(balasan.id)}
              disabled={deleting}
              className="ml-auto opacity-60 sm:opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
              title="Hapus balasan"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-0.5">{balasan.isi}</p>
      </div>
    </div>
  )
}

interface DiskusiCardProps {
  item: DiskusiItem
  myId: string
  myRole: string
  onDelete:       (id: string) => Promise<unknown>
  onPin:          (id: string) => Promise<unknown>
  onReply:        (id: string, isi: string) => Promise<unknown>
  onDeleteReply:  (id: string) => Promise<unknown>
  deleting:       boolean
  pinning:        boolean
  replying:       boolean
  deletingReplyId: string | null | undefined
}

function DiskusiCard({
  item, myId, myRole,
  onDelete, onPin, onReply, onDeleteReply,
  deleting, pinning, replying, deletingReplyId,
}: DiskusiCardProps) {
  const [expanded, setExpanded]   = useState(true)
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')

  const canDelete = isGuru(myRole) || item.user.id === myId
  const canPin    = isGuru(myRole)
  const nama      = item.user.profile?.namaLengkap ?? 'Pengguna'
  const isOwner   = item.user.id === myId

  function handleReply() {
    if (!replyText.trim()) return
    onReply(item.id, replyText.trim()).then(() => {
      setReplyText('')
      setShowReply(false)
    })
  }

  return (
    <div className={[
      'rounded-xl border bg-white dark:bg-gray-800 shadow-sm transition-all',
      item.isPinned ? 'border-amber-400 dark:border-amber-500' : 'border-gray-200 dark:border-gray-700',
      item.isPrivate && !isOwner && !isGuru(myRole) ? 'hidden' : '',
    ].join(' ')}>
      {/* header */}
      <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
        <Avatar name={nama} foto={item.user.profile?.fotoUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{nama}</span>
            {item.isPrivate && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                <Lock size={9} /> Private
              </span>
            )}
            {item.isPinned && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 shrink-0">
                <Pin size={9} /> Pin
              </span>
            )}
            <span className="text-[10px] sm:text-xs text-gray-400 ml-auto whitespace-nowrap">{fmtDate(item.createdAt)}</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{item.isi}</p>
        </div>
      </div>

      {/* action bar */}
      <div className="flex flex-wrap items-center gap-1 px-3 sm:px-4 pb-2 sm:pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
        <button
          onClick={() => setShowReply(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
        >
          <MessageSquare size={12} />
          Balas {item.balasan.length > 0 && `(${item.balasan.length})`}
        </button>

        {item.balasan.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Sembunyikan' : 'Lihat'}
          </button>
        )}

        <div className="ml-auto flex items-center gap-1">
          {canPin && (
            <button
              onClick={() => onPin(item.id)}
              disabled={pinning}
              title={item.isPinned ? 'Lepas sematkan' : 'Sematkan'}
              className="text-gray-400 hover:text-amber-500 p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              {pinning
                ? <Loader2 size={12} className="animate-spin" />
                : item.isPinned ? <PinOff size={12} /> : <Pin size={12} />
              }
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(item.id)}
              disabled={deleting}
              title="Hapus diskusi"
              className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* reply form */}
      {showReply && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Tulis balasan…"
              rows={2}
              className="flex-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleReply() }}
            />
            <button
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
              className="self-end px-2.5 sm:px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {replying ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 hidden sm:block">Ctrl+Enter untuk kirim</p>
        </div>
      )}

      {/* balasan list */}
      {expanded && item.balasan.length > 0 && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-3 ml-4">
          {item.balasan.map(b => (
            <BalasanCard
              key={b.id}
              balasan={b}
              myId={myId}
              myRole={myRole}
              onDelete={onDeleteReply}
              deleting={deletingReplyId === b.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PANEL
// ═════════════════════════════════════════════════════════════════════════════

export default function DiskusiPanel({
  items, loading,
  onCreate, onDelete, onPin, onReply, onDeleteReply,
  isDiskusiAktif, onToggleAktif,
  creatingDiskusi, deletingId, pinningId, replyingId, deletingReplyId,
  contextLabel = 'materi',
}: Props) {
  const { user } = useAuthStore()
  const [isi, setIsi]             = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  if (!user) return null

  const guru = isGuru(user.role)
  const diskusiOff = isDiskusiAktif === false

  function handleSubmit() {
    if (!isi.trim()) return
    onCreate({ isi: isi.trim(), isPrivate: guru ? isPrivate : false }).then(() => {
      setIsi('')
      setIsPrivate(false)
    })
  }

  return (
    <section className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
          <MessageCircle size={16} className="text-indigo-500 shrink-0" />
          <span>Diskusi {contextLabel}</span>
          {!diskusiOff && items.length > 0 && (
            <span className="text-xs font-normal text-gray-400">({items.length})</span>
          )}
        </h3>

        {guru && onToggleAktif && (
          <button
            onClick={() => onToggleAktif()}
            className={[
              'text-xs px-2.5 sm:px-3 py-1.5 rounded-lg border font-medium transition-colors whitespace-nowrap',
              diskusiOff
                ? 'border-green-400 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
            ].join(' ')}
          >
            {diskusiOff ? 'Aktifkan' : 'Nonaktifkan'}
          </button>
        )}
      </div>

      {/* diskusi off banner */}
      {diskusiOff && !guru && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-5 py-8 text-center text-sm text-gray-500">
          Diskusi dinonaktifkan oleh guru
        </div>
      )}

      {/* compose */}
      {(!diskusiOff || guru) && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 space-y-2 sm:space-y-3">
          <textarea
            value={isi}
            onChange={e => setIsi(e.target.value)}
            placeholder={`Tulis pertanyaan atau komentar tentang ${contextLabel} ini…`}
            rows={3}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 resize-none bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleSubmit() }}
          />
          <div className="flex flex-wrap items-center gap-2">
            {guru && (
              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={e => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <Lock size={11} className="text-amber-500" />
                <span className="whitespace-nowrap">Private</span>
              </label>
            )}
            <p className="text-xs text-gray-400 hidden sm:block">Ctrl+Enter untuk kirim</p>
            <button
              onClick={handleSubmit}
              disabled={!isi.trim() || !!creatingDiskusi}
              className="ml-auto flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white text-xs sm:text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {creatingDiskusi ? <Loader2 size={14} className="animate-spin" /> : <Send size={13} />}
              Kirim
            </button>
          </div>
        </div>
      )}

      {/* list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 && !diskusiOff ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-10 text-center text-sm text-gray-400">
          Belum ada diskusi. Jadilah yang pertama bertanya!
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <DiskusiCard
              key={item.id}
              item={item}
              myId={user.id}
              myRole={user.role}
              onDelete={id => onDelete(id)}
              onPin={id => onPin(id)}
              onReply={(id, text) => onReply(id, text)}
              onDeleteReply={onDeleteReply}
              deleting={deletingId === item.id}
              pinning={pinningId === item.id}
              replying={replyingId === item.id}
              deletingReplyId={deletingReplyId}
            />
          ))}
        </div>
      )}
    </section>
  )
}
