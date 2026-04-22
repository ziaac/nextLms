'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { marked } from 'marked'
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Link, Code, Minus,
  AlignLeft, AlignCenter, AlignRight,
  Code2, X, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value:       string       // HTML string
  onChange:    (html: string) => void
  placeholder?: string
  minHeight?:  string       // e.g. "200px"
  disabled?:   boolean
  className?:  string
}

type ExecCmd =
  | 'bold' | 'italic' | 'underline' | 'strikeThrough'
  | 'insertOrderedList' | 'insertUnorderedList'
  | 'justifyLeft' | 'justifyCenter' | 'justifyRight'
  | 'formatBlock' | 'createLink' | 'insertHorizontalRule' | 'formatBlock'

function exec(cmd: ExecCmd, value?: string) {
  document.execCommand(cmd, false, value)
}

interface ToolbarBtnProps {
  title:    string
  onClick:  () => void
  active?:  boolean
  children: React.ReactNode
}

function ToolbarBtn({ title, onClick, active, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200',
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5" />
}

// ── Markdown icon (lucide tidak punya, pakai custom SVG kecil) ──
function MarkdownIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* M */}
      <polyline points="4 18 4 6 9 12 14 6 14 18" />
      {/* ↓ arrow */}
      <line x1="18" y1="8" x2="18" y2="16" />
      <polyline points="15 13 18 16 21 13" />
    </svg>
  )
}

// ── Fungsi konversi Markdown → HTML via marked ────────────────
function markdownToHtml(md: string): string {
  // Konfigurasi marked: GFM (GitHub Flavored Markdown) + line breaks
  marked.setOptions({
    gfm:    true,
    breaks: true,
  } as any)

  const raw = marked.parse(md)
  // marked.parse bisa return string | Promise<string> — ambil nilai sync
  if (typeof raw === 'string') return raw
  return '' // fallback jika Promise (tidak terjadi dengan config sync)
}

export function RichTextEditor({
  value, onChange, placeholder = 'Tulis konten di sini...', minHeight = '200px', disabled, className,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInternalChange = useRef(false)

  // ── Paste HTML modal state ───────────────────────────────────
  const [pasteHtmlOpen, setPasteHtmlOpen] = useState(false)
  const [pasteHtmlValue, setPasteHtmlValue] = useState('')

  // ── Paste Markdown modal state ───────────────────────────────
  const [pasteMdOpen, setPasteMdOpen] = useState(false)
  const [pasteMdValue, setPasteMdValue] = useState('')
  const [mdPreviewHtml, setMdPreviewHtml] = useState('')

  // Simpan seleksi sebelum modal dibuka (shared antara dua modal)
  const savedRange = useRef<Range | null>(null)

  // Sync value → DOM (hanya jika berubah dari luar)
  useEffect(() => {
    const el = editorRef.current
    if (!el || isInternalChange.current) return
    if (el.innerHTML !== value) {
      el.innerHTML = value ?? ''
    }
  }, [value])

  const handleInput = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    isInternalChange.current = true
    onChange(el.innerHTML)
    // Reset flag setelah microtask selesai
    Promise.resolve().then(() => { isInternalChange.current = false })
  }, [onChange])

  // ── Live preview markdown saat mengetik ──────────────────────
  useEffect(() => {
    if (!pasteMdOpen) return
    if (!pasteMdValue.trim()) { setMdPreviewHtml(''); return }
    setMdPreviewHtml(markdownToHtml(pasteMdValue))
  }, [pasteMdValue, pasteMdOpen])

  // ── Helper: simpan posisi kursor sekarang ────────────────────
  const saveCurrentRange = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange()
    }
  }

  // ── Helper: sisipkan HTML pada savedRange ────────────────────
  const insertHtmlAtSavedRange = (html: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (sel && savedRange.current) {
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
      savedRange.current.deleteContents()
      const fragment = document.createRange().createContextualFragment(html)
      savedRange.current.insertNode(fragment)
      savedRange.current.collapse(false)
      sel.removeAllRanges()
      sel.addRange(savedRange.current)
    } else {
      el.innerHTML += html
    }
    isInternalChange.current = true
    onChange(el.innerHTML)
    Promise.resolve().then(() => { isInternalChange.current = false })
  }

  // ── Paste HTML ───────────────────────────────────────────────
  const openPasteHtml = () => {
    saveCurrentRange()
    setPasteHtmlValue('')
    setPasteHtmlOpen(true)
  }

  const insertHtml = () => {
    if (!pasteHtmlValue.trim()) { setPasteHtmlOpen(false); return }
    insertHtmlAtSavedRange(pasteHtmlValue)
    setPasteHtmlOpen(false)
    setPasteHtmlValue('')
  }

  // ── Paste Markdown ───────────────────────────────────────────
  const openPasteMd = () => {
    saveCurrentRange()
    setPasteMdValue('')
    setMdPreviewHtml('')
    setPasteMdOpen(true)
  }

  const insertMarkdown = () => {
    if (!pasteMdValue.trim()) { setPasteMdOpen(false); return }
    const html = markdownToHtml(pasteMdValue)
    insertHtmlAtSavedRange(html)
    setPasteMdOpen(false)
    setPasteMdValue('')
    setMdPreviewHtml('')
  }

  const insertLink = () => {
    const url = prompt('Masukkan URL:')
    if (url) exec('createLink', url)
  }

  const formatBlock = (tag: string) => exec('formatBlock', tag)

  return (
    <div className={cn(
      'rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
      'bg-white dark:bg-gray-900',
      disabled && 'opacity-60 pointer-events-none',
      className,
    )}>

      {/* ── Paste HTML Modal ── */}
      {pasteHtmlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tempel HTML</p>
              </div>
              <button type="button" onClick={() => setPasteHtmlOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-400">
                Paste atau ketik HTML mentah di bawah ini. Konten akan disisipkan pada posisi kursor.
              </p>
              <textarea
                autoFocus
                value={pasteHtmlValue}
                onChange={e => setPasteHtmlValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) insertHtml()
                  if (e.key === 'Escape') setPasteHtmlOpen(false)
                }}
                rows={10}
                placeholder={'<p>Contoh konten</p>\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>'}
                className="w-full text-xs font-mono px-3 py-2.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
              />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <p className="text-[11px] text-gray-400">Ctrl+Enter untuk sisipkan</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPasteHtmlOpen(false)}
                  className="h-8 px-3 rounded-md text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Batal
                </button>
                <button type="button" onClick={insertHtml} disabled={!pasteHtmlValue.trim()}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Check className="w-3.5 h-3.5" /> Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Paste Markdown Modal ── */}
      {pasteMdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <MarkdownIcon size={16} />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Tempel Markdown</p>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                  GFM
                </span>
              </div>
              <button type="button" onClick={() => setPasteMdOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body — split pane: input kiri, preview kanan */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800" style={{ minHeight: 280 }}>
              {/* Input */}
              <div className="flex flex-col">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Markdown</p>
                </div>
                <textarea
                  autoFocus
                  value={pasteMdValue}
                  onChange={e => setPasteMdValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) insertMarkdown()
                    if (e.key === 'Escape') setPasteMdOpen(false)
                  }}
                  placeholder={
                    '# Judul\n\n**Tebal**, *miring*, ~~coret~~\n\n## Sub Judul\n\n- Item 1\n- Item 2\n\n1. Nomor 1\n2. Nomor 2\n\n> Blockquote\n\n`kode inline`\n\n```\nblok kode\n```\n\n---'
                  }
                  className="flex-1 resize-none text-xs font-mono px-4 py-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none"
                />
              </div>

              {/* Preview */}
              <div className="flex flex-col">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Preview</p>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {mdPreviewHtml ? (
                    <div
                      className="prose dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: mdPreviewHtml }}
                    />
                  ) : (
                    <p className="text-xs text-gray-300 dark:text-gray-600 italic">
                      Preview akan muncul saat Anda mengetik...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <p className="text-[11px] text-gray-400">
                Mendukung <span className="font-medium">GFM</span> — heading, bold, italic, list, table, blockquote, code
                &nbsp;·&nbsp; Ctrl+Enter untuk sisipkan
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPasteMdOpen(false)}
                  className="h-8 px-3 rounded-md text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  Batal
                </button>
                <button type="button" onClick={insertMarkdown} disabled={!pasteMdValue.trim()}
                  className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Check className="w-3.5 h-3.5" /> Sisipkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        {/* Format heading */}
        <ToolbarBtn title="Heading 1" onClick={() => formatBlock('h1')}><Heading1 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Heading 2" onClick={() => formatBlock('h2')}><Heading2 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Heading 3" onClick={() => formatBlock('h3')}><Heading3 size={14} /></ToolbarBtn>
        <ToolbarBtn title="Paragraf" onClick={() => formatBlock('p')}>
          <span className="text-[11px] font-bold">P</span>
        </ToolbarBtn>

        <Sep />

        {/* Text style */}
        <ToolbarBtn title="Tebal (Ctrl+B)"       onClick={() => exec('bold')}>          <Bold size={14} /></ToolbarBtn>
        <ToolbarBtn title="Miring (Ctrl+I)"      onClick={() => exec('italic')}>        <Italic size={14} /></ToolbarBtn>
        <ToolbarBtn title="Garis bawah (Ctrl+U)" onClick={() => exec('underline')}>    <Underline size={14} /></ToolbarBtn>
        <ToolbarBtn title="Coret"                onClick={() => exec('strikeThrough')}><Strikethrough size={14} /></ToolbarBtn>
        <ToolbarBtn title="Kode inline"          onClick={() => formatBlock('code')}>   <Code size={14} /></ToolbarBtn>

        <Sep />

        {/* Lists */}
        <ToolbarBtn title="Daftar biasa"    onClick={() => exec('insertUnorderedList')}><List size={14} /></ToolbarBtn>
        <ToolbarBtn title="Daftar bernomor" onClick={() => exec('insertOrderedList')}><ListOrdered size={14} /></ToolbarBtn>

        <Sep />

        {/* Align */}
        <ToolbarBtn title="Rata kiri"  onClick={() => exec('justifyLeft')}>  <AlignLeft size={14} /></ToolbarBtn>
        <ToolbarBtn title="Tengah"     onClick={() => exec('justifyCenter')}><AlignCenter size={14} /></ToolbarBtn>
        <ToolbarBtn title="Rata kanan" onClick={() => exec('justifyRight')}> <AlignRight size={14} /></ToolbarBtn>

        <Sep />

        {/* Extras */}
        <ToolbarBtn title="Sisipkan tautan"  onClick={insertLink}>                          <Link size={14} /></ToolbarBtn>
        <ToolbarBtn title="Garis horizontal" onClick={() => exec('insertHorizontalRule')}><Minus size={14} /></ToolbarBtn>

        <Sep />

        {/* Paste HTML */}
        <ToolbarBtn title="Tempel HTML mentah" onClick={openPasteHtml}>
          <Code2 size={14} />
        </ToolbarBtn>

        {/* Paste Markdown */}
        <ToolbarBtn title="Tempel Markdown" onClick={openPasteMd}>
          <MarkdownIcon size={14} />
        </ToolbarBtn>
      </div>

      {/* ── Editable area ── */}
      {/*
        Gunakan class `prose` yang SAMA persis dengan tampilan preview di [id]/page.tsx
        agar WYSIWYG — apa yang terlihat di editor = apa yang tampil di halaman detail.
      */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={cn(
          'px-7 py-6 outline-none',
          'prose dark:prose-invert max-w-none',
          'empty:before:content-[attr(data-placeholder)]',
          'empty:before:text-gray-400 empty:before:pointer-events-none empty:before:not-italic',
        )}
      />
    </div>
  )
}
