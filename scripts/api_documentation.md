# Dokumentasi API: Modul Materi Pelajaran & Siswa Progress

Berikut adalah dokumentasi lengkap dari semua *endpoint* HTTP dan koneksi WebSocket yang ada di dalam modul `materi-pelajaran`. Seluruh endpoint dilindungi oleh `JwtAuthGuard` dan `RolesGuard`.

---

## 1. Create Materi Pelajaran
Endpoint ini digunakan oleh Guru/Wali Kelas/Admin untuk membuat materi baru.
- **Endpoint**: `POST /api/v1/materi-pelajaran`
- **Roles**: `GURU`, `WALI_KELAS`, `SUPER_ADMIN`, `ADMIN`

**Request Body (JSON)**:
```json
{
  "mataPelajaranId": "uuid-mata-pelajaran",
  "kelasId": "uuid-kelas",
  "dokumenPengajaranIds": ["uuid-rpp-1", "uuid-modul-2"], // JSON array (optional)
  "tipeMateri": "HYBRID", // "TEXT" | "VIDEO" | "FILE" | "LINK" | "SLIDESHOW" | "HYBRID"
  "judul": "Hukum Tajwid Mad",
  "deskripsi": "Deskripsi singkat materi (optional)",
  "konten": "<p>Teks HTML panjang (optional jika tipe bukan TEXT)</p>",
  "fileUrls": ["url1", "url2"], // JSON array (optional)
  "pertemuanKe": 1, // (optional)
  "kompetensiDasar": "KD 3.1", // (optional)
  "tujuanPembelajaran": "Membedakan hukum Mad", // (optional)
  "tanggalPublikasi": "2026-04-19T10:00:00Z", // (optional)
  "isPublished": false, // Default false
  "minScreenTime": 300, // Detik, default 0
  "tugasIds": ["uuid-tugas-1", "uuid-tugas-2"] // JSON array (optional, M2M)
}
```

**Expected Response (201 Created)**:
```json
{
  "id": "uuid-materi",
  "mataPelajaranId": "uuid-mata-pelajaran",
  "guruId": "uuid-guru",
  "kelasId": "uuid-kelas",
  "tipeMateri": "TEXT",
  "judul": "Hukum Tajwid Mad",
  "isPublished": false,
  "minScreenTime": 300,
  "createdAt": "2026-04-19T10:00:00Z",
  "updatedAt": "2026-04-19T10:00:00Z",
  "mataPelajaran": { "id": "...", "kkm": 75 },
  "kelas": { "namaKelas": "X IPA 1" },
  "guru": { "profile": { "namaLengkap": "Guru A" } }
}
```

---

## 2. Get All Materi Pelajaran (Pencarian & Filter)
Digunakan untuk menarik daftar materi. 
**Filter Otomatis Siswa**: Siswa hanya bisa melihat materi yang:
1. `isPublished: true`
2. `tanggalPublikasi <= Waktu Sekarang` (Atau `null`).
3. Sesuai dengan kelas aktif siswa tersebut.

- **Endpoint**: `GET /api/v1/materi-pelajaran`
- **Roles**: Semua Role

**Query Parameters (Semua Opsional)**:
| Parameter | Tipe | Penjelasan |
| :--- | :--- | :--- |
| `page` | number | Nomor halaman (default: 1) |
| `limit` | number | Jumlah limit data per halaman (default: 10) |
| `search` | string | Pencarian teks pada field `judul` |
| `kelasId` | UUID | Filter kelas spesifik |
| `tingkatKelasId` | UUID | Filter semua materi di tingkat kelas (misal Kelas 10) |
| `mataPelajaranId` | UUID | Filter spesifik ke Mata Pelajaran tertentu |
| `mataPelajaranTingkatId` | UUID | Filter ke Master Mapel Tingkat tertentu |
| `semesterId` | UUID | Filter semester tertentu |
| `tahunAjaranId` | UUID | Filter tahun ajaran tertentu |
| `isSemesterAktif` | boolean | `true`/`false` |
| `isTahunAjaranAktif` | boolean | `true`/`false` |
| `guruId` | UUID | Filter guru pembuat materi |
| `tipeMateri` | string | `TEXT`, `VIDEO`, `PDF`, `HYBRID`, dsb. |
| `jenisDokumen` | string | Tipe RPP referensi materi (`MODUL_AJAR_RPP`, dll) |
| `dokumenPengajaranId` | UUID | Referensi ID dokumen spesifik |
| `isPublished` | boolean | `true`/`false` |

**Expected Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid-materi",
      "mataPelajaranId": "uuid-mapel",
      "judul": "Hukum Tajwid Mad",
      "isPublished": true,
      "minScreenTime": 300,
      "viewCount": 5,
      "mataPelajaran": { "id": "uuid-mapel" },
      "kelas": { "namaKelas": "X IPA 1" },
      "guru": {
        "profile": { "namaLengkap": "Guru A", "fotoUrl": "..." }
      },
      "_count": { "tugas": 0 }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false,
    "nextCursor": null
  }
}
```

---

## 3. Get Latest Materi Pelajaran
Menarik maksimal 50 materi terakhir yang baru saja di-*publish*. Sangat berguna untuk Dashboard Siswa.
- **Endpoint**: `GET /api/v1/materi-pelajaran/latest`
- **Roles**: `SISWA`, `GURU`, `SUPER_ADMIN`, `ADMIN`

**Query Parameters**: `page` (default: 1), `limit` (default: 20).

**Expected Response (200 OK)**:
Format JSON respon sama persis dengan `findAll` di atas.

---

## 4. Get Detail Materi (Trigger Progress `findOne`)
Mengambil satu materi spesifik beserta tugas terkait. **Sangat Penting:** Jika yang memanggil API ini adalah role `SISWA`, sistem akan mencatat materi ini sudah pernah dibuka (`viewCount` bertambah) dan menginisialisasi `SiswaMateriProgress`.
- **Endpoint**: `GET /api/v1/materi-pelajaran/:id`
- **Roles**: Semua Role

**Keamanan Khusus Siswa**:
Jika Role pemanggil adalah `SISWA`, materi hanya bisa diakses jika:
1. `isPublished: true`
2. `tanggalPublikasi <= Waktu Sekarang` (Atau `null`).
Jika syarat tidak terpenuhi, server akan melempar `403 Forbidden`.

**Expected Response (200 OK)**:
```json
{
  "id": "uuid",
  "judul": "Judul Materi",
  "konten": "<p>Teks</p>",
  "minScreenTime": 300,
  "viewCount": 1,
  "isPublished": true,
  "tanggalPublikasi": "2026-04-19T10:00:00Z",
  "mataPelajaran": { "id": "uuid", "bobot": 2 },
  "dokumenPengajarans": [{ "id": "uuid", "judul": "RPP Tajwid", "fileUrl": "url" }],
  "kelas": { "namaKelas": "X IPA 1" },
  "guru": { "profile": { "namaLengkap": "Guru A", "fotoUrl": "url" } },
  "tugas": [
    { "id": "uuid", "judul": "Tugas 1", "tipe": "PILIHAN_GANDA", "tanggalSelesai": "2026-04-20" }
  ]
}
```

---

## 5. Update Materi Pelajaran
- **Endpoint**: `PUT /api/v1/materi-pelajaran/:id`
- **Roles**: `GURU` (Hanya miliknya), `WALI_KELAS`, `SUPER_ADMIN`, `ADMIN`

**Request Body (JSON)**:
Sama dengan `Create` payload, semua property opsional. Anda bisa mengubah `judul`, `konten`, `minScreenTime`, dsb.

**Expected Response (200 OK)**: Mengembalikan object materi yang sudah diperbarui.

---

## 6. Publish / Unpublish Materi (Toggle)
Membalik status publikasi dari *Draft* menjadi *Publish* (dan sebaliknya).
- **Endpoint**: `PATCH /api/v1/materi-pelajaran/:id/publish`
- **Roles**: Sama dengan Update

**Expected Response (200 OK)**:
```json
{
  "id": "uuid",
  "isPublished": true,
  "tanggalPublikasi": "2026-04-19T10:00:00Z"
  // ...other fields
}
```

---

## 7. Delete Materi
Melakukan soft delete.
- **Endpoint**: `DELETE /api/v1/materi-pelajaran/:id`
- **Roles**: Sama dengan Update

**Expected Response (200 OK)**:
```json
{ "message": "Materi berhasil dihapus" }
```

---

## 8. WebSocket (Realtime Screen Time Tracking)
Digunakan secara spesifik untuk merekam berapa lama Siswa (Screen Time) melihat halaman detail materi, dan membalik status progres `isRead` jika sudah terpenuhi.

- **Namespace**: `/materi` (Bukan `/`)
- **Library**: `Socket.io` di Frontend

### a. Siswa Membuka Halaman Materi (Mulai Waktu)
Frontend meng-emit event saat halaman me-render penuh.
- **Event Name**: `join_materi`
- **Payload Data**:
  ```json
  {
    "materiId": "uuid-materi",
    "siswaId": "uuid-siswa"
  }
  ```
- **Response ke Frontend (Acknowledgement)**:
  ```json
  {
    "status": "joined",
    "startTime": 1713530000000
  }
  ```

### b. Siswa Meninggalkan Halaman Materi (Rekam Waktu)
Di-trigger manual saat tombol "Kembali" ditekan, atau otomatis ter-trigger oleh server saat browser tertutup (`disconnect`).
- **Event Name**: `leave_materi`
- **Payload Data**: (Kosong, server sudah mendeteksi `Socket.id`)
- **Aksi Server (Backstage)**:
  1. Menghitung durasi = `Waktu Sekarang` - `Waktu join_materi`.
  2. Akumulasi durasi dengan progres yang ada di DB.
  3. Cek jika `totalDurasi >= materi.minScreenTime`, lalu set `isRead = true`.
  4. Simpan ke database tabel `SiswaMateriProgress`.
- **Response ke Frontend (Acknowledgement)**:
  ```json
  { "status": "left" }
  ```

---

## 9. Bulk Create Materi Pelajaran
Digunakan untuk memasukkan satu materi baru ke banyak kelas sekaligus tanpa perlu mengisi ulang.
- **Endpoint**: `POST /api/v1/materi-pelajaran/bulk`
- **Roles**: `GURU`, `WALI_KELAS`, `SUPER_ADMIN`, `ADMIN`

**Request Body (JSON)**:
```json
{
  "targetMataPelajaranIds": [
    "uuid-mapel-kelas-A",
    "uuid-mapel-kelas-B"
  ],
  "materiData": [
    {
      "tipeMateri": "TEXT",
      "judul": "Hukum Newton",
      "deskripsi": "Pengenalan Fisika",
      "minScreenTime": 300,
      "isPublished": false
    }
  ]
}
```

**Expected Response (201 Created)**:
```json
{
  "message": "Berhasil mendistribusikan 1 materi ke 2 kelas.",
  "totalCreated": 2
}
```

---

## 10. Bulk Copy Materi Pelajaran
Digunakan untuk menyalin (menduplikasi) materi dari kelas lain menuju ke kelas tujuan. Referensi ke `dokumenPengajaranId` (RPP) akan dipaksa `null` karena berbeda kelas.
- **Endpoint**: `POST /api/v1/materi-pelajaran/bulk-copy`
- **Roles**: `GURU` (hanya materi miliknya), `WALI_KELAS`, `SUPER_ADMIN`, `ADMIN`

**Request Body (JSON)**:
```json
{
  "sourceMateriIds": [
    "uuid-materi-sumber-1",
    "uuid-materi-sumber-2"
  ],
  "targetMataPelajaranIds": [
    "uuid-mapel-tujuan-A",
    "uuid-mapel-tujuan-B"
  ]
}
```

**Expected Response (201 Created)**:
```json
{
  "message": "Berhasil menyalin 2 materi ke 2 kelas.",
  "totalCopied": 4
}
```

---

## 11. Export Excel Materi Pelajaran
Mengunduh laporan file berformat Excel (.xlsx) untuk seluruh materi pelajaran, dengan dukungan pemfilteran (*filtering*) dan pengamanan batas data maksimal (10.000 data).
- **Endpoint**: `GET /api/v1/report/export/materi-pelajaran`
- **Roles**: `GURU`, `WALI_KELAS`, `SUPER_ADMIN`, `ADMIN`, `KEPALA_SEKOLAH`, `WAKIL_KEPALA`

**Query Parameters (Semua Opsional)**:
- `tahunAjaranId`: UUID
- `semesterId`: UUID
- `kelasId`: UUID
- `mataPelajaranId`: UUID
- `guruId`: UUID (Akan diabaikan dan dipaksa ke `user.id` bila role adalah `GURU` atau `WALI_KELAS`)

**Expected Response (200 OK)**:
Merupakan *binary stream* yang langsung bisa diunduh oleh klien.
- Header: `Content-Disposition: attachment; filename=materi-pelajaran-{timestamp}.xlsx`
- Header: `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

---

## 12. Get All Dokumen Pengajaran (Pencarian & Filter)
Digunakan untuk mengambil daftar RPP, CP, ATP, atau Modul Ajar milik guru. Sangat penting digunakan pada form "Buat Materi" untuk mengisi pilihan dokumen.

- **Endpoint**: `GET /api/v1/dokumen-pengajaran`
- **Roles**: `GURU` (hanya miliknya), `ADMIN`, `SUPER_ADMIN`

**Query Parameters (Semua Opsional)**:
| Parameter | Tipe | Penjelasan |
| :--- | :--- | :--- |
| `search` | string | Pencarian judul dokumen |
| `mataPelajaranTingkatId` | UUID | **(Sangat Disarankan)** Filter berdasarkan Induk Mapel agar RPP muncul di semua kelas yang sama |
| `mataPelajaranId` | UUID | Filter spesifik ke satu sesi kelas |
| `tahunAjaranId` | UUID | Filter tahun ajaran |
| `semesterId` | UUID | Filter semester |
| `jenisDokumen` | Enum | `CP`, `ATP`, `MODUL_AJAR_RPP`, dsb. |
| `status` | Enum | `DRAFT`, `SUBMITTED`, `APPROVED`, `REVISION_REQUESTED` |

**Expected Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "judul": "Modul Ajar Fisika Bab 1",
      "jenisDokumen": "MODUL_AJAR_RPP",
      "fileUrl": "https://storage.link/file.pdf",
      "status": "APPROVED"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10 }
}
```

---

## 13. Upload Assets (Materi & Dokumen)
Digunakan untuk mengunggah file materi atau dokumen pengajaran.

- **Endpoint (Materi)**: `POST /api/v1/upload/materi`
- **Endpoint (Dokumen)**: `POST /api/v1/upload/dokumen-pengajaran`
- **Format**: `multipart/form-data`
- **Roles**: `GURU`, `ADMIN`, `SUPER_ADMIN`

> [!IMPORTANT]
> **Fitur Auto-Convert**:
> Jika Anda mengunggah file format Office (`.pptx`, `.docx`, `.xlsx`), server akan secara otomatis mengonversinya menjadi **PDF** sebelum disimpan. Respon API akan mengembalikan `key` dengan ekstensi `.pdf`.

**Expected Response (201 Created)**:
```json
{
  "key": "materi/file/8d6d1138-4003-4adb-8bc9-69613a565c4f.pdf",
  "bucket": "lms-private"
}
```
> Gunakan nilai `key` ini untuk diisi ke field `fileUrls` (untuk materi) atau `fileUrl` (untuk dokumen).
