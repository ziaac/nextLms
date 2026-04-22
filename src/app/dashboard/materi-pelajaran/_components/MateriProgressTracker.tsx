'use client'

import { useEffect, useState, useRef } from 'react'
import { getSocket } from '@/lib/socket'
import { CheckCircle2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressTrackerProps {
  materiId: string
  siswaId: string
}

export function MateriProgressTracker({ materiId, siswaId }: ProgressTrackerProps) {
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
