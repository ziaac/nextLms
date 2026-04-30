import { describe, it, expect } from 'vitest'
import { getNavForRole } from '../nav.config'
import type { UserRole } from '@/types'

describe('nav.config - Modul Pembayaran', () => {
  describe('KEUANGAN group visibility', () => {
    it('should show KEUANGAN group for SISWA', () => {
      const nav = getNavForRole({ role: 'SISWA' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeDefined()
    })

    it('should show KEUANGAN group for ORANG_TUA', () => {
      const nav = getNavForRole({ role: 'ORANG_TUA' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeDefined()
    })

    it('should show KEUANGAN group for STAFF_KEUANGAN', () => {
      const nav = getNavForRole({ role: 'STAFF_KEUANGAN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeDefined()
    })

    it('should show KEUANGAN group for ADMIN', () => {
      const nav = getNavForRole({ role: 'ADMIN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeDefined()
    })

    it('should show KEUANGAN group for SUPER_ADMIN', () => {
      const nav = getNavForRole({ role: 'SUPER_ADMIN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeDefined()
    })

    it('should show KEUANGAN group for KEPALA_SEKOLAH', () => {
      const nav = getNavForRole({ role: 'KEPALA_SEKOLAH' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeDefined()
    })

    it('should NOT show KEUANGAN group for GURU', () => {
      const nav = getNavForRole({ role: 'GURU' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeUndefined()
    })

    it('should NOT show KEUANGAN group for WALI_KELAS', () => {
      const nav = getNavForRole({ role: 'WALI_KELAS' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup).toBeUndefined()
    })
  })

  describe('Menu items for SISWA and ORANG_TUA', () => {
    it('should show only "Tagihan Saya" for SISWA', () => {
      const nav = getNavForRole({ role: 'SISWA' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup?.items).toHaveLength(1)
      expect(keuanganGroup?.items[0].label).toBe('Tagihan Saya')
      expect(keuanganGroup?.items[0].href).toBe('/dashboard/pembelajaran/siswa/tagihan')
    })

    it('should show only "Tagihan Saya" for ORANG_TUA', () => {
      const nav = getNavForRole({ role: 'ORANG_TUA' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup?.items).toHaveLength(1)
      expect(keuanganGroup?.items[0].label).toBe('Tagihan Saya')
      expect(keuanganGroup?.items[0].href).toBe('/dashboard/pembelajaran/siswa/tagihan')
    })
  })

  describe('Menu items for STAFF_KEUANGAN', () => {
    it('should show Kategori Pembayaran, Tagihan, Pembayaran, and Laporan for STAFF_KEUANGAN', () => {
      const nav = getNavForRole({ role: 'STAFF_KEUANGAN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup?.items).toHaveLength(4)
      
      const menuLabels = keuanganGroup?.items.map((item) => item.label)
      expect(menuLabels).toContain('Kategori Pembayaran')
      expect(menuLabels).toContain('Tagihan')
      expect(menuLabels).toContain('Pembayaran')
      expect(menuLabels).toContain('Laporan')
      expect(menuLabels).not.toContain('Pengaturan Payment')
    })

    it('should have correct routes for STAFF_KEUANGAN menus', () => {
      const nav = getNavForRole({ role: 'STAFF_KEUANGAN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      
      const kategoriMenu = keuanganGroup?.items.find((item) => item.label === 'Kategori Pembayaran')
      expect(kategoriMenu?.href).toBe('/dashboard/keuangan/kategori')
      
      const tagihanMenu = keuanganGroup?.items.find((item) => item.label === 'Tagihan')
      expect(tagihanMenu?.href).toBe('/dashboard/keuangan/tagihan')
      
      const pembayaranMenu = keuanganGroup?.items.find((item) => item.label === 'Pembayaran')
      expect(pembayaranMenu?.href).toBe('/dashboard/keuangan/pembayaran')
      
      const laporanMenu = keuanganGroup?.items.find((item) => item.label === 'Laporan')
      expect(laporanMenu?.href).toBe('/dashboard/keuangan/laporan')
    })
  })

  describe('Menu items for ADMIN and SUPER_ADMIN', () => {
    it('should show all 5 menu items for ADMIN', () => {
      const nav = getNavForRole({ role: 'ADMIN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup?.items).toHaveLength(5)
      
      const menuLabels = keuanganGroup?.items.map((item) => item.label)
      expect(menuLabels).toContain('Kategori Pembayaran')
      expect(menuLabels).toContain('Tagihan')
      expect(menuLabels).toContain('Pembayaran')
      expect(menuLabels).toContain('Laporan')
      expect(menuLabels).toContain('Pengaturan Payment')
    })

    it('should show all 5 menu items for SUPER_ADMIN', () => {
      const nav = getNavForRole({ role: 'SUPER_ADMIN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup?.items).toHaveLength(5)
      
      const menuLabels = keuanganGroup?.items.map((item) => item.label)
      expect(menuLabels).toContain('Kategori Pembayaran')
      expect(menuLabels).toContain('Tagihan')
      expect(menuLabels).toContain('Pembayaran')
      expect(menuLabels).toContain('Laporan')
      expect(menuLabels).toContain('Pengaturan Payment')
    })

    it('should have Pengaturan Payment route for ADMIN', () => {
      const nav = getNavForRole({ role: 'ADMIN' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      
      const settingsMenu = keuanganGroup?.items.find((item) => item.label === 'Pengaturan Payment')
      expect(settingsMenu?.href).toBe('/dashboard/keuangan/settings')
    })
  })

  describe('Menu items for KEPALA_SEKOLAH', () => {
    it('should show only Laporan for KEPALA_SEKOLAH', () => {
      const nav = getNavForRole({ role: 'KEPALA_SEKOLAH' })
      const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
      expect(keuanganGroup?.items).toHaveLength(1)
      expect(keuanganGroup?.items[0].label).toBe('Laporan')
      expect(keuanganGroup?.items[0].href).toBe('/dashboard/keuangan/laporan')
    })
  })

  describe('Kategori Bayar removed from Master Data', () => {
    it('should NOT show Kategori Bayar in Manajemen Master Data for ADMIN', () => {
      const nav = getNavForRole({ role: 'ADMIN' })
      const masterDataGroup = nav.find((g) => g.label === 'Manajemen Master Data')
      
      const menuLabels = masterDataGroup?.items.map((item) => item.label)
      expect(menuLabels).not.toContain('Kategori Bayar')
    })

    it('should NOT show Kategori Bayar in Manajemen Master Data for STAFF_KEUANGAN', () => {
      const nav = getNavForRole({ role: 'STAFF_KEUANGAN' })
      const masterDataGroup = nav.find((g) => g.label === 'Manajemen Master Data')
      
      // STAFF_KEUANGAN should not see Master Data group at all
      expect(masterDataGroup).toBeUndefined()
    })
  })

  describe('Role-based filtering', () => {
    it('should filter menu items correctly based on role permissions', () => {
      const roles: UserRole[] = [
        'SISWA', 'ORANG_TUA', 'GURU', 'WALI_KELAS',
        'STAFF_KEUANGAN', 'STAFF_TU', 'KEPALA_SEKOLAH',
        'WAKIL_KEPALA', 'ADMIN', 'SUPER_ADMIN'
      ]

      roles.forEach((role) => {
        const nav = getNavForRole({ role })
        const keuanganGroup = nav.find((g) => g.label === 'KEUANGAN')
        
        // Verify each menu item respects role restrictions
        keuanganGroup?.items.forEach((item) => {
          if (item.roles) {
            expect(item.roles).toContain(role)
          }
        })
      })
    })
  })
})
