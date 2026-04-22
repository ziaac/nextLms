import { io, type Socket } from 'socket.io-client'
import { SOCKET_URL } from './constants'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 5_000,
      autoConnect: false,
    })
  }
  return socket
}

export const getNamespaceSocket = (namespace: string): Socket => {
  return io(`${SOCKET_URL}${namespace}`, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    autoConnect: true,
  })
}

export const connectSocket = (userId: string, kelasId?: string): Socket => {
  const s = getSocket()
  if (!s.connected) s.connect()
  s.emit('join', userId)
  if (kelasId) s.emit('join:kelas', kelasId)
  return s
}

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect()
    socket = null
  }
}
