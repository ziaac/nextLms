/**
 * Property-Based Tests — Catatan Sikap Revisi
 * Feature: catatan-sikap-revisi
 *
 * Menggunakan fast-check untuk memverifikasi correctness properties
 * yang didefinisikan di design doc.
 */

import * as fc from 'fast-check'
import type { UserRole } from '@/types/enums'

// ── Pure functions yang diekstrak dari logika komponen ────────────────────────

/**
 * Logika cascade reset filter saat tahunAjaranId berubah.
 * Diekstrak dari SikapKelasView state management.
 */
function applyTahunAjaranChange(
  state: { tahunAjaranId: string; semesterId: string; tingkatKelasId: string; kelasId: string },
  newTahunAjaranId: string,
): { tahunAjaranId: string; semesterId: string; tingkatKelasId: string; kelasId: string } {
  return {
    tahunAjaranId:  newTahunAjaranId,
    semesterId:     '',   // reset
    tingkatKelasId: '',   // reset
    kelasId:        '',   // reset
  }
}

/**
 * Logika cascade reset saat tingkatKelasId berubah.
 */
function applyTingkatChange(
  state: { tahunAjaranId: string; semesterId: string; tingkatKelasId: string; kelasId: string },
  newTingkatId: string,
): { tahunAjaranId: string; semesterId: string; tingkatKelasId: string; kelasId: string } {
  return {
    ...state,
    tingkatKelasId: newTingkatId,
    kelasId:        '',   // reset
  }
}

/**
 * Hitung rekap kelas dari array catatan.
 * Diekstrak dari logika getRekapKelas di backend (direplikasi untuk testing).
 */
function hitungRekapKelas(catatan: Array<{ jenis: 'POSITIF' | 'NEGATIF'; point: number }>) {
  let jumlahPositif = 0
  let jumlahNegatif = 0
  let totalPointPositif = 0
  let totalPointNegatif = 0

  for (const c of catatan) {
    if (c.jenis === 'POSITIF') {
      jumlahPositif++
      totalPointPositif += c.point
    } else {
      jumlahNegatif++
      totalPointNegatif += c.point
    }
  }

  return {
    totalCatatan: catatan.length,
    jumlahPositif,
    jumlahNegatif,
    totalPointPositif,
    totalPointNegatif,
    netPoint: totalPointPositif - totalPointNegatif,
  }
}

/**
 * Hitung rekap individual per siswa lalu agregasi.
 * Digunakan untuk memverifikasi konsistensi dengan rekap kelas.
 */
function hitungRekapIndividual(
  catatan: Array<{ siswaId: string; jenis: 'POSITIF' | 'NEGATIF'; point: number }>,
) {
  const byStudent = new Map<string, Array<{ jenis: 'POSITIF' | 'NEGATIF'; point: number }>>()
  for (const c of catatan) {
    const arr = byStudent.get(c.siswaId) ?? []
    arr.push({ jenis: c.jenis, point: c.point })
    byStudent.set(c.siswaId, arr)
  }

  let totalCatatan = 0
  let jumlahPositif = 0
  let jumlahNegatif = 0

  for (const [, items] of byStudent) {
    for (const item of items) {
      totalCatatan++
      if (item.jenis === 'POSITIF') jumlahPositif++
      else jumlahNegatif++
    }
  }

  return { totalCatatan, jumlahPositif, jumlahNegatif }
}

/**
 * Tentukan apakah nama guru harus ditampilkan berdasarkan role.
 * Diekstrak dari SikapDetailModal visibility logic.
 */
function shouldShowGuru(role: UserRole): boolean {
  const SHOW_GURU_ROLES: UserRole[] = [
    'GURU', 'WALI_KELAS', 'SUPER_ADMIN', 'ADMIN', 'KEPALA_SEKOLAH', 'WAKIL_KEPALA',
  ]
  return SHOW_GURU_ROLES.includes(role)
}

/**
 * Tentukan apakah tombol edit/hapus harus tampil untuk item catatan.
 * Diekstrak dari SikapDetailModal canEditItem logic.
 */
function shouldShowEditDelete(
  catatan: { guruId: string },
  currentUserId: string,
  role: UserRole,
  readonly: boolean,
): boolean {
  if (readonly) return false
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true
  if (role === 'GURU' || role === 'WALI_KELAS') return catatan.guruId === currentUserId
  return false
}

/**
 * Sort siswa secara alfabetis.
 * Diekstrak dari getRekapSiswaKelas di backend.
 */
function sortSiswaAlfabetis<T extends { namaLengkap: string }>(siswaList: T[]): T[] {
  return [...siswaList].sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap, 'id'))
}

/**
 * Render HTML template PDF (versi sederhana untuk testing).
 * Memverifikasi bahwa semua kolom ada di output.
 */
function renderPdfTemplate(
  catatan: Array<{
    tanggal: string
    kategori: string
    poin: number
    lokasi: string
    kronologi: string
    tindakLanjut: string
    guruNama: string
    jenis: 'POSITIF' | 'NEGATIF'
  }>,
): string {
  const positif = catatan.filter((c) => c.jenis === 'POSITIF')
  const negatif = catatan.filter((c) => c.jenis === 'NEGATIF')

  const renderRows = (rows: typeof catatan) =>
    rows
      .map(
        (r) =>
          `<tr data-jenis="${r.jenis}">
            <td>${r.tanggal}</td>
            <td>${r.kategori}</td>
            <td>${r.poin}</td>
            <td>${r.lokasi}</td>
            <td>${r.kronologi}</td>
            <td>${r.tindakLanjut}</td>
            <td>${r.guruNama}</td>
          </tr>`,
      )
      .join('')

  return `
    <section data-section="POSITIF">
      <table>${renderRows(positif)}</table>
    </section>
    <section data-section="NEGATIF">
      <table>${renderRows(negatif)}</table>
    </section>
  `
}

function extractSection(html: string, jenis: 'POSITIF' | 'NEGATIF'): string {
  const regex = new RegExp(
    `<section data-section="${jenis}">(.*?)</section>`,
    's',
  )
  return html.match(regex)?.[1] ?? ''
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Catatan Sikap Revisi — Property-Based Tests', () => {

  // Feature: catatan-sikap-revisi, Property 1: filter reset cascade
  describe('Property 1: Filter Reset Cascade', () => {
    it('mengganti tahunAjaranId selalu mereset tingkatKelasId dan kelasId', () => {
      fc.assert(
        fc.property(
          fc.record({
            tahunAjaranId:  fc.uuid(),
            semesterId:     fc.uuid(),
            tingkatKelasId: fc.uuid(),
            kelasId:        fc.uuid(),
          }),
          fc.uuid(),
          (state, newTaId) => {
            const result = applyTahunAjaranChange(state, newTaId)
            return result.tingkatKelasId === '' && result.kelasId === '' && result.semesterId === ''
          },
        ),
        { numRuns: 100 },
      )
    })

    it('mengganti tingkatKelasId selalu mereset kelasId', () => {
      fc.assert(
        fc.property(
          fc.record({
            tahunAjaranId:  fc.uuid(),
            semesterId:     fc.uuid(),
            tingkatKelasId: fc.uuid(),
            kelasId:        fc.uuid(),
          }),
          fc.uuid(),
          (state, newTingkatId) => {
            const result = applyTingkatChange(state, newTingkatId)
            return result.kelasId === '' && result.tahunAjaranId === state.tahunAjaranId
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  // Feature: catatan-sikap-revisi, Property 2: rekap kelas = agregasi rekap siswa
  describe('Property 2: Rekap Kelas = Agregasi Rekap Siswa', () => {
    it('totalCatatan, jumlahPositif, jumlahNegatif konsisten antara rekap kelas dan individual', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              siswaId: fc.uuid(),
              jenis:   fc.constantFrom('POSITIF' as const, 'NEGATIF' as const),
              point:   fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 0, maxLength: 50 },
          ),
          (catatan) => {
            const rekapKelas      = hitungRekapKelas(catatan)
            const rekapIndividual = hitungRekapIndividual(catatan)

            return (
              rekapKelas.totalCatatan  === rekapIndividual.totalCatatan &&
              rekapKelas.jumlahPositif === rekapIndividual.jumlahPositif &&
              rekapKelas.jumlahNegatif === rekapIndividual.jumlahNegatif
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    it('netPoint = totalPointPositif - totalPointNegatif', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              jenis: fc.constantFrom('POSITIF' as const, 'NEGATIF' as const),
              point: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 0, maxLength: 30 },
          ),
          (catatan) => {
            const rekap = hitungRekapKelas(catatan)
            return rekap.netPoint === rekap.totalPointPositif - rekap.totalPointNegatif
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  // Feature: catatan-sikap-revisi, Property 3: visibilitas nama guru berdasarkan role
  describe('Property 3: Visibilitas Nama Guru Berdasarkan Role', () => {
    it('SISWA dan ORANG_TUA tidak boleh melihat nama guru', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('SISWA' as UserRole, 'ORANG_TUA' as UserRole),
          (role) => {
            return shouldShowGuru(role) === false
          },
        ),
        { numRuns: 100 },
      )
    })

    it('GURU, WALI_KELAS, MANAJEMEN selalu melihat nama guru', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'GURU' as UserRole,
            'WALI_KELAS' as UserRole,
            'SUPER_ADMIN' as UserRole,
            'ADMIN' as UserRole,
            'KEPALA_SEKOLAH' as UserRole,
            'WAKIL_KEPALA' as UserRole,
          ),
          (role) => {
            return shouldShowGuru(role) === true
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  // Feature: catatan-sikap-revisi, Property 4: edit/hapus ownership untuk GURU
  describe('Property 4: Edit/Hapus Ownership untuk GURU', () => {
    it('GURU hanya bisa edit/hapus catatan miliknya sendiri', () => {
      fc.assert(
        fc.property(
          fc.uuid(),   // guruId catatan
          fc.uuid(),   // currentUserId
          fc.constantFrom('GURU' as UserRole, 'WALI_KELAS' as UserRole),
          (guruId, currentUserId, role) => {
            const result = shouldShowEditDelete({ guruId }, currentUserId, role, false)
            return result === (guruId === currentUserId)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('SUPER_ADMIN dan ADMIN selalu bisa edit/hapus semua catatan', () => {
      fc.assert(
        fc.property(
          fc.uuid(),   // guruId catatan (bisa berbeda dengan currentUserId)
          fc.uuid(),   // currentUserId
          fc.constantFrom('SUPER_ADMIN' as UserRole, 'ADMIN' as UserRole),
          (guruId, currentUserId, role) => {
            return shouldShowEditDelete({ guruId }, currentUserId, role, false) === true
          },
        ),
        { numRuns: 100 },
      )
    })

    it('mode readonly selalu menyembunyikan tombol edit/hapus', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom(
            'GURU' as UserRole,
            'WALI_KELAS' as UserRole,
            'SUPER_ADMIN' as UserRole,
            'ADMIN' as UserRole,
          ),
          (guruId, currentUserId, role) => {
            return shouldShowEditDelete({ guruId }, currentUserId, role, true) === false
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  // Feature: catatan-sikap-revisi, Property 5: urutan siswa selalu alfabetis
  describe('Property 5: Urutan Siswa Selalu Alfabetis', () => {
    it('hasil sort selalu dalam urutan A-Z berdasarkan namaLengkap', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              siswaId:     fc.uuid(),
              namaLengkap: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 0, maxLength: 30 },
          ),
          (siswaList) => {
            const sorted = sortSiswaAlfabetis(siswaList)
            for (let i = 0; i < sorted.length - 1; i++) {
              if (sorted[i].namaLengkap.localeCompare(sorted[i + 1].namaLengkap, 'id') > 0) {
                return false
              }
            }
            return true
          },
        ),
        { numRuns: 100 },
      )
    })

    it('sort tidak mengubah jumlah elemen', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({ siswaId: fc.uuid(), namaLengkap: fc.string({ minLength: 1 }) }),
            { minLength: 0, maxLength: 30 },
          ),
          (siswaList) => {
            return sortSiswaAlfabetis(siswaList).length === siswaList.length
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  // Feature: catatan-sikap-revisi, Property 6: kelengkapan kolom PDF
  describe('Property 6: Kelengkapan Kolom PDF', () => {
    it('HTML template mengandung semua data catatan', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              tanggal:      fc.string({ minLength: 1, maxLength: 20 }),
              kategori:     fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('<') && !s.includes('>')),
              poin:         fc.integer({ min: 1, max: 100 }),
              lokasi:       fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('<') && !s.includes('>')),
              kronologi:    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('<') && !s.includes('>')),
              tindakLanjut: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('<') && !s.includes('>')),
              guruNama:     fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('<') && !s.includes('>')),
              jenis:        fc.constantFrom('POSITIF' as const, 'NEGATIF' as const),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (catatan) => {
            const html = renderPdfTemplate(catatan)
            return catatan.every(
              (c) =>
                html.includes(c.kategori) &&
                html.includes(c.guruNama) &&
                html.includes(c.lokasi),
            )
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  // Feature: catatan-sikap-revisi, Property 7: pemisahan section PDF
  describe('Property 7: Pemisahan Section PDF', () => {
    it('catatan POSITIF hanya ada di section POSITIF, NEGATIF hanya di section NEGATIF', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              tanggal:      fc.constant('2025-01-01'),
              poin:         fc.integer({ min: 1, max: 10 }),
              lokasi:       fc.constant('Kelas'),
              kronologi:    fc.constant('kronologi'),
              tindakLanjut: fc.constant('tindak'),
              // Nama unik per item agar bisa diidentifikasi di section
              kategori:     fc.uuid(),
              guruNama:     fc.uuid(),
              jenis:        fc.constantFrom('POSITIF' as const, 'NEGATIF' as const),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (catatan) => {
            const html = renderPdfTemplate(catatan)
            const positifSection = extractSection(html, 'POSITIF')
            const negatifSection = extractSection(html, 'NEGATIF')

            const positifItems = catatan.filter((c) => c.jenis === 'POSITIF')
            const negatifItems = catatan.filter((c) => c.jenis === 'NEGATIF')

            // Setiap item positif ada di section positif dan tidak di negatif
            const positifOk = positifItems.every(
              (c) => positifSection.includes(c.kategori) && !negatifSection.includes(c.kategori),
            )
            // Setiap item negatif ada di section negatif dan tidak di positif
            const negatifOk = negatifItems.every(
              (c) => negatifSection.includes(c.kategori) && !positifSection.includes(c.kategori),
            )

            return positifOk && negatifOk
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
