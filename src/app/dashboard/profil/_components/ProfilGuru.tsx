'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
import { Button, PageHeader, Skeleton } from '@/components/ui'
import { useProfil } from '@/hooks/users/useProfil'
import { ProfilSection, ProfilField } from './ProfilSection'
import { ProfilEditModal } from './ProfilEditModal'
import { ProfilFotoCard } from './ProfilFotoCard'

export function ProfilGuru() {
  const { data, isLoading } = useProfil()
  const [editOpen, setEditOpen] = useState(false)

  const p = data?.profile

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Informasi akun dan data pribadi guru"
        actions={
          <Button leftIcon={<Edit size={16} />} onClick={() => setEditOpen(true)}>
            Edit Profil
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfilFotoCard
            namaLengkap={p?.namaLengkap ?? ''}
            fotoUrl={p?.fotoUrl}
            role={data?.role}
            email={data?.email}
            username={data?.username}
            extra={[
              { label: 'NIP', value: p?.nip },
              { label: 'NUPTK', value: p?.nuptk },
            ]}
          />

          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            <ProfilSection title="Identitas Pribadi">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilField label="Nama Lengkap" value={p?.namaLengkap} />
                <ProfilField label="Nama Panggilan" value={p?.namaPanggilan} />
                <ProfilField label="Jenis Kelamin" value={p?.jenisKelamin === 'L' ? 'Laki-laki' : p?.jenisKelamin === 'P' ? 'Perempuan' : null} />
                <ProfilField label="Agama" value={p?.agama} />
                <ProfilField label="Tempat Lahir" value={p?.tempatLahir} />
                <ProfilField label="Tanggal Lahir" value={p?.tanggalLahir ? new Date(p.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
              </div>
            </ProfilSection>

            <ProfilSection title="Nomor Identitas">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilField label="NIK" value={p?.nik} />
                <ProfilField label="No. Kartu Keluarga" value={p?.noKK} />
                <ProfilField label="NIP" value={p?.nip} />
                <ProfilField label="NUPTK" value={p?.nuptk} />
              </div>
            </ProfilSection>

            <ProfilSection title="Kontak">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProfilField label="No. Telepon" value={p?.noTelepon} />
                <ProfilField label="No. WhatsApp" value={p?.noWa} />
                <ProfilField label="No. Telp Rumah" value={p?.noTelpRumah} />
              </div>
            </ProfilSection>

            <ProfilSection title="Alamat">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <ProfilField label="Alamat Lengkap" value={p?.alamat} />
                </div>
                <ProfilField label="Kelurahan" value={p?.kelurahan} />
                <ProfilField label="Kecamatan" value={p?.kecamatan} />
                <ProfilField label="Kabupaten / Kota" value={p?.kabupaten} />
                <ProfilField label="Provinsi" value={p?.provinsi} />
                <ProfilField label="Kode Pos" value={p?.kodePos} />
              </div>
            </ProfilSection>

            <ProfilSection title="Data Fisik">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ProfilField label="Golongan Darah" value={p?.bloodType?.replace('_POS', '+').replace('_NEG', '-')} />
                <ProfilField label="Tinggi Badan" value={p?.tinggi ? `${p.tinggi} cm` : null} />
                <ProfilField label="Berat Badan" value={p?.berat ? `${p.berat} kg` : null} />
              </div>
            </ProfilSection>
          </div>
        </div>
      )}

      <ProfilEditModal open={editOpen} onClose={() => setEditOpen(false)} mode="guru" />
    </div>
  )
}
