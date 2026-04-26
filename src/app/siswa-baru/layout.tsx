import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pendaftaran Siswa Baru — MAN 2 Kota Makassar',
  description: 'Formulir pendaftaran ulang calon siswa baru MAN 2 Kota Makassar',
}

export default function SiswaBaru({ children }: { children: React.ReactNode }) {
  return children
}
