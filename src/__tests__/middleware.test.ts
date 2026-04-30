import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '../middleware'
import type { UserRole } from '@/types/enums'

// Helper to create mock request with auth cookie
function createMockRequest(pathname: string, role: UserRole | null = null, search = '') {
  const url = `http://localhost:3000${pathname}${search}`
  const request = new NextRequest(url)
  
  if (role) {
    const authState = {
      state: {
        isAuthenticated: true,
        user: { role: role.toUpperCase() }
      }
    }
    const cookieValue = encodeURIComponent(JSON.stringify(authState))
    request.cookies.set('lms-auth', cookieValue)
  }
  
  return request
}

describe('middleware - Modul Pembayaran Route Guards', () => {
  describe('Financial routes - /dashboard/keuangan/settings', () => {
    it('should allow ADMIN to access settings', () => {
      const request = createMockRequest('/dashboard/keuangan/settings', 'ADMIN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      // Should not redirect (NextResponse.next() returns a response without redirect)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow SUPER_ADMIN to access settings', () => {
      const request = createMockRequest('/dashboard/keuangan/settings', 'SUPER_ADMIN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should deny STAFF_KEUANGAN access to settings', () => {
      const request = createMockRequest('/dashboard/keuangan/settings', 'STAFF_KEUANGAN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })

    it('should deny SISWA access to settings', () => {
      const request = createMockRequest('/dashboard/keuangan/settings', 'SISWA')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Financial routes - /dashboard/keuangan/laporan', () => {
    it('should allow KEPALA_SEKOLAH to access laporan', () => {
      const request = createMockRequest('/dashboard/keuangan/laporan', 'KEPALA_SEKOLAH')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow STAFF_KEUANGAN to access laporan', () => {
      const request = createMockRequest('/dashboard/keuangan/laporan', 'STAFF_KEUANGAN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow ADMIN to access laporan', () => {
      const request = createMockRequest('/dashboard/keuangan/laporan', 'ADMIN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should deny SISWA access to laporan', () => {
      const request = createMockRequest('/dashboard/keuangan/laporan', 'SISWA')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })

    it('should deny GURU access to laporan', () => {
      const request = createMockRequest('/dashboard/keuangan/laporan', 'GURU')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Financial routes - /dashboard/keuangan/kategori', () => {
    it('should allow STAFF_KEUANGAN to access kategori', () => {
      const request = createMockRequest('/dashboard/keuangan/kategori', 'STAFF_KEUANGAN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow ADMIN to access kategori', () => {
      const request = createMockRequest('/dashboard/keuangan/kategori', 'ADMIN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should deny KEPALA_SEKOLAH access to kategori', () => {
      const request = createMockRequest('/dashboard/keuangan/kategori', 'KEPALA_SEKOLAH')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })

    it('should deny SISWA access to kategori', () => {
      const request = createMockRequest('/dashboard/keuangan/kategori', 'SISWA')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Financial routes - /dashboard/keuangan/tagihan', () => {
    it('should allow STAFF_KEUANGAN to access tagihan', () => {
      const request = createMockRequest('/dashboard/keuangan/tagihan', 'STAFF_KEUANGAN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow ADMIN to access tagihan', () => {
      const request = createMockRequest('/dashboard/keuangan/tagihan', 'ADMIN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should deny SISWA access to staff tagihan page', () => {
      const request = createMockRequest('/dashboard/keuangan/tagihan', 'SISWA')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Financial routes - /dashboard/keuangan/pembayaran', () => {
    it('should allow STAFF_KEUANGAN to access pembayaran', () => {
      const request = createMockRequest('/dashboard/keuangan/pembayaran', 'STAFF_KEUANGAN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow ADMIN to access pembayaran', () => {
      const request = createMockRequest('/dashboard/keuangan/pembayaran', 'ADMIN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should deny ORANG_TUA access to staff pembayaran page', () => {
      const request = createMockRequest('/dashboard/keuangan/pembayaran', 'ORANG_TUA')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Student routes - /dashboard/pembelajaran/siswa/tagihan', () => {
    it('should allow SISWA to access their tagihan', () => {
      const request = createMockRequest('/dashboard/pembelajaran/siswa/tagihan', 'SISWA')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should allow ORANG_TUA to access student tagihan', () => {
      const request = createMockRequest('/dashboard/pembelajaran/siswa/tagihan', 'ORANG_TUA')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toBeNull()
    })

    it('should deny STAFF_KEUANGAN access to student tagihan page', () => {
      const request = createMockRequest('/dashboard/pembelajaran/siswa/tagihan', 'STAFF_KEUANGAN')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })

    it('should deny GURU access to student tagihan page', () => {
      const request = createMockRequest('/dashboard/pembelajaran/siswa/tagihan', 'GURU')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Route specificity order', () => {
    it('should match most specific route first - settings over general keuangan', () => {
      // If settings route is matched correctly, only ADMIN/SUPER_ADMIN can access
      const requestStaff = createMockRequest('/dashboard/keuangan/settings', 'STAFF_KEUANGAN')
      const responseStaff = middleware(requestStaff)
      
      // Should be redirected because STAFF_KEUANGAN doesn't have access to settings
      expect(responseStaff.headers.get('location')).toContain('/dashboard')
      
      const requestAdmin = createMockRequest('/dashboard/keuangan/settings', 'ADMIN')
      const responseAdmin = middleware(requestAdmin)
      
      // Should not be redirected
      expect(responseAdmin.headers.get('location')).toBeNull()
    })

    it('should match specific route before general route - laporan', () => {
      // KEPALA_SEKOLAH can access laporan but not other keuangan routes
      const requestLaporan = createMockRequest('/dashboard/keuangan/laporan', 'KEPALA_SEKOLAH')
      const responseLaporan = middleware(requestLaporan)
      
      expect(responseLaporan.headers.get('location')).toBeNull()
      
      const requestKategori = createMockRequest('/dashboard/keuangan/kategori', 'KEPALA_SEKOLAH')
      const responseKategori = middleware(requestKategori)
      
      expect(responseKategori.headers.get('location')).toContain('/dashboard')
    })
  })

  describe('Unauthenticated access', () => {
    it('should redirect to login for unauthenticated user accessing keuangan routes', () => {
      const request = createMockRequest('/dashboard/keuangan/tagihan')
      const response = middleware(request)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should preserve redirect path with query params', () => {
      const request = createMockRequest('/dashboard/keuangan/tagihan', null, '?page=2')
      const response = middleware(request)
      
      const location = response.headers.get('location')
      expect(location).toContain('/login')
      expect(location).toContain('redirect=')
      // Query params are URL-encoded in the redirect parameter
      expect(decodeURIComponent(location || '')).toContain('page=2')
    })
  })

  describe('All financial roles comprehensive test', () => {
    const testCases: Array<{
      route: string
      allowedRoles: UserRole[]
      deniedRoles: UserRole[]
    }> = [
      {
        route: '/dashboard/keuangan/settings',
        allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
        deniedRoles: ['STAFF_KEUANGAN', 'KEPALA_SEKOLAH', 'SISWA', 'ORANG_TUA', 'GURU']
      },
      {
        route: '/dashboard/keuangan/laporan',
        allowedRoles: ['KEPALA_SEKOLAH', 'STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
        deniedRoles: ['SISWA', 'ORANG_TUA', 'GURU', 'WALI_KELAS']
      },
      {
        route: '/dashboard/keuangan/kategori',
        allowedRoles: ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
        deniedRoles: ['KEPALA_SEKOLAH', 'SISWA', 'ORANG_TUA', 'GURU']
      },
      {
        route: '/dashboard/keuangan/tagihan',
        allowedRoles: ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
        deniedRoles: ['KEPALA_SEKOLAH', 'SISWA', 'ORANG_TUA', 'GURU']
      },
      {
        route: '/dashboard/keuangan/pembayaran',
        allowedRoles: ['STAFF_KEUANGAN', 'ADMIN', 'SUPER_ADMIN'],
        deniedRoles: ['KEPALA_SEKOLAH', 'SISWA', 'ORANG_TUA', 'GURU']
      },
      {
        route: '/dashboard/pembelajaran/siswa/tagihan',
        allowedRoles: ['SISWA', 'ORANG_TUA'],
        deniedRoles: ['STAFF_KEUANGAN', 'ADMIN', 'GURU', 'KEPALA_SEKOLAH']
      }
    ]

    testCases.forEach(({ route, allowedRoles, deniedRoles }) => {
      describe(`Route: ${route}`, () => {
        allowedRoles.forEach((role) => {
          it(`should allow ${role} to access`, () => {
            const request = createMockRequest(route, role)
            const response = middleware(request)
            
            expect(response.headers.get('location')).toBeNull()
          })
        })

        deniedRoles.forEach((role) => {
          it(`should deny ${role} access`, () => {
            const request = createMockRequest(route, role)
            const response = middleware(request)
            
            expect(response.headers.get('location')).toContain('/dashboard')
          })
        })
      })
    })
  })
})
