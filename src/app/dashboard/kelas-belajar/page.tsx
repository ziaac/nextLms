import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function KelasBelajarIndexPage({
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
      targetPath = `/dashboard/kelas-belajar/guru${suffix}`
    } else {
      targetPath = `/dashboard/kelas-belajar/manajemen${suffix}`
    }
  } catch (error) {
    console.error('[KelasBelajarIndex] Error parsing auth cookie:', error)
    targetPath = '/dashboard'
  }

  // Panggil redirect di LUAR try-catch agar tidak dianggap sebagai error oleh Next.js
  redirect(targetPath)
}
