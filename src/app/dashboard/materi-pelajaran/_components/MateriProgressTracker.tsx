'use client'

import { useEffect, useState, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { CheckCircle2, Clock, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  materiId:        string
  siswaId:         string
  /** Mode arsip: tidak ada WebSocket, hanya tampilkan ringkasan akhir */
  readOnly?:       boolean
  staticProgress?: { isRead: boolean; timeSpentSeconds: number }
  minScreenTime?:  number
}

// Format detik → "X jam Y mnt" / "Y mnt Z dtk" / "Z dtk"
function formatDuration(sec: number): string {
  if (sec <= 0) return '0 dtk'
  if (sec < 60) return `${sec} dtk`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return s > 0 ? `${m} mnt ${s} dtk` : `${m} mnt`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h} jam ${rm} mnt` : `${h} jam`
}

export function MateriProgressTracker({ materiId, siswaId, readOnly, staticProgress, minScreenTime: minScreenTimeProp }: ProgressTrackerProps) {

  // ── Mode arsip: tampilkan ringkasan statis tanpa WebSocket ────────────
  if (readOnly) {
    const spent = staticProgress?.timeSpentSeconds ?? 0
    const min   = minScreenTimeProp ?? 0
    const done  = staticProgress?.isRead || (min > 0 && spent >= min)
    const pct   = min <= 0 ? (spent > 0 ? 100 : 0) : Math.min(Math.floor((spent / min) * 100), 100)

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'p-1.5 rounded-lg',
              done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400',
            )}>
              {done ? <CheckCircle2 size={18} /> : <BookOpen size={18} />}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
                {done ? 'Sudah dibaca' : 'Belum selesai dibaca'}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {spent > 0
                  ? `Telah dibaca selama ${formatDuration(spent)}`
                  : 'Belum pernah dibuka'}
              </p>
            </div>
          </div>
          <span className={cn(
            'text-xs font-bold',
            done ? 'text-emerald-600' : 'text-gray-400',
          )}>
            {pct}%
          </span>
        </div>

        {min > 0 && (
          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', done ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    )
  }
  // ─────────────────────────────────────────────────────────────────────
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [minSeconds, setMinSeconds] = useState(-1) // -1 berarti belum fetch dari server
  const [isRead, setIsRead] = useState(false)
  const [connected, setConnected] = useState(false)
  
  // Timer lokal untuk menggerakkan progress bar secara real-time
  const [localSeconds, setLocalSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    // 1. Connect ke root socket (sama seperti Absensi)
    const socket = getSocket()
    if (!socket.connected) socket.connect()
    socketRef.current = socket

    const onConnect = () => {
      console.log('[Socket] Connected to root')
      setConnected(true)
      // 2. Join materi
      socket.emit('join_materi', { materiId, siswaId }, (response: any) => {
        if (response) {
          setCurrentSeconds(response.currentProgress || 0)
          setMinSeconds(response.minScreenTime || 0)
          setIsRead(response.isRead || false)
        }
      })
    }

    const onConnectError = (err: any) => {
      console.error('[Socket] Connection error:', err)
      setConnected(false)
    }

    const onDisconnect = () => {
      console.log('[Socket] Disconnected')
      setConnected(false)
    }

    // Bind events
    if (socket.connected) onConnect()
    socket.on('connect', onConnect)
    socket.on('connect_error', onConnectError)
    socket.on('disconnect', onDisconnect)

    // 3. Start local timer — HANYA jalan jika koneksi aktif
    timerRef.current = setInterval(() => {
      setConnected(prevConnected => {
        if (prevConnected) {
          setLocalSeconds(prev => prev + 1)
        }
        return prevConnected
      })
    }, 1000)

    return () => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onConnectError)
      socket.off('disconnect', onDisconnect)
      
      socket.emit('leave_materi')
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [materiId, siswaId])

  // Hitung total akumulasi (database + sesi ini)
  const totalAccumulated = currentSeconds + localSeconds
  
  // Jika minSeconds masih -1, artinya sedang memuat
  const percentage = minSeconds < 0 
    ? 0 
    : minSeconds === 0 
      ? 100 
      : Math.min(Math.floor((totalAccumulated / minSeconds) * 100), 100)

  const isCompleted = minSeconds >= 0 && (isRead || percentage >= 100)

  // Format waktu tersisa
  const remaining = Math.max(minSeconds - totalAccumulated, 0)
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm transition-all",
      !connected && "opacity-60 grayscale-[0.5]"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
          )}>
            {isCompleted ? <CheckCircle2 size={18} /> : <Clock size={18} />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-none">
              {isCompleted ? 'Materi Selesai' : 'Progres Baca'}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              {minSeconds < 0 
                ? 'Menghubungkan ke server...' 
                : isCompleted 
                  ? 'Kriteria waktu terpenuhi.' 
                  : `${formatTime(remaining)} tersisa.`}
            </p>
          </div>
        </div>
        <span className={cn(
          "text-xs font-bold",
          isCompleted ? "text-emerald-600" : "text-blue-600"
        )}>
          {percentage}%
        </span>
      </div>

      {/* Progress Bar Manual */}
      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            isCompleted ? "bg-emerald-500" : "bg-blue-500",
            !connected && "bg-gray-400 animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {!connected && (
        <p className="text-[10px] text-red-500 mt-1 animate-pulse">
          Koneksi terputus...
        </p>
      )}
    </div>
  )
}
