import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Server-side redirect untuk rute /dashboard/jadwal
 * Menghindari history loop saat menekan tombol Back.
 */
export default async function JadwalIndexPage() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('lms-auth')

  if (!authCookie) redirect('/login')

  try {
    const parsed = JSON.parse(decodeURIComponent(authCookie.value))
    const role = parsed?.state?.user?.role
    // Note: isWaliKelas tidak ada di cookie lms-auth (hanya role), 
    // jadi kita arahkan ke guru/manajemen secara umum dulu.
    // Jika perlu sangat spesifik, middleware atau client side bisa menghandle.

    if (role === 'GURU' || role === 'WALI_KELAS') {
      redirect('/dashboard/jadwal/guru')
    }
    
    if (role === 'SISWA') {
      redirect('/dashboard/jadwal/kelas')
    }

    redirect('/dashboard/jadwal/manajemen')
  } catch {
    redirect('/dashboard')
  }
}
