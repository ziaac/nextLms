import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AbsensiIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('lms-auth')
  const params = await searchParams
  const queryString = new URLSearchParams(params as any).toString()
  const suffix = queryString ? `?${queryString}` : ''

  if (!authCookie) redirect('/login')

  let targetPath = '/dashboard'

  try {
    const rawValue = decodeURIComponent(authCookie.value)
    const parsed = JSON.parse(rawValue)
    const roleRaw = parsed?.state?.user?.role || ''
    const role = roleRaw.toUpperCase()

    if (role === 'GURU' || role === 'WALI_KELAS') {
      targetPath = `/dashboard/absensi/guru${suffix}`
    } else if (['SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA', 'STAFF_TU'].includes(role)) {
      targetPath = `/dashboard/absensi/manajemen${suffix}`
    } else if (role === 'SISWA' || role === 'ORANG_TUA') {
      targetPath = `/dashboard/absensi/siswa${suffix}`
    }
  } catch (error) {
    console.error('[AbsensiIndex] Error parsing auth cookie:', error)
  }

  redirect(targetPath)
}
