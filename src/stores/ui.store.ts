import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar:    () => void
  setSidebarCollapsed: (v: boolean) => void

  // Fullscreen mode (untuk halaman form kompleks)
  fullscreen:    boolean
  setFullscreen: (v: boolean) => void
  toggleFullscreen: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed:    false,
      toggleSidebar:       () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      fullscreen:       false,
      setFullscreen:    (v) => set({ fullscreen: v }),
      toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
    }),
    {
      name:    'lms-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
      // fullscreen tidak di-persist — reset setiap kali load
    },
  ),
)
