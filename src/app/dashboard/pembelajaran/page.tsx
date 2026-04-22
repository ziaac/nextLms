import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PembelajaranIndexPage() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('lms-auth')

  if (!authCookie) redirect('/login')

  let targetPath = '/dashboard'

  try {
    const rawValue = decodeURIComponent(authCookie.value)
    const parsed = JSON.parse(rawValue)
    const roleRaw = parsed?.state?.user?.role || ''
    const role = roleRaw.toUpperCase()

    if (role === 'GURU' || role === 'WALI_KELAS') {
      targetPath = '/dashboard/pembelajaran/guru'
    } else if (role === 'SISWA' || role === 'ORANG_TUA') {
      targetPath = '/dashboard/pembelajaran/siswa'
    } else {
      targetPath = '/dashboard/pembelajaran/manajemen'
    }
  } catch (error) {
    console.error('[PembelajaranIndex] Error parsing auth cookie:', error)
  }

  redirect(targetPath)
}
