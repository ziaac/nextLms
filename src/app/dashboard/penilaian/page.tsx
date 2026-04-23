import { redirect } from 'next/navigation'

/** /dashboard/penilaian → digabung ke /dashboard/tugas */
export default function PenilaianPage() {
  redirect('/dashboard/tugas')
}
