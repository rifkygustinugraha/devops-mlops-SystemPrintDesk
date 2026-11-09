<<<<<<< HEAD
<div align="center">

# 🖨️ SystemPrintDesk

### Sistem Antrean Layanan Percetakan Kampus

Portal antrean digital untuk membantu mahasiswa mengambil nomor dan memantau antrean, sekaligus membantu petugas mengelola layanan dari beberapa loket.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![SQLite](https://img.shields.io/badge/Database-SQLite-003b57?logo=sqlite)

</div>

---

## 📌 Tentang Project
=======
# PrintDesk — Sistem Antrean Layanan Cetak Kampus

## Deskripsi Project

PrintDesk adalah aplikasi web untuk mengelola antrean layanan fotokopi dan
cetak di lingkungan kampus. Mahasiswa dapat memilih layanan, mengambil nomor
antrean, dan memantau status antrean secara real-time. Petugas dapat mengelola
antrean, memanggil nomor berikutnya, menyelesaikan layanan, atau melewati
antrean melalui panel petugas.

Project ini dikembangkan sebagai bagian dari pembelajaran DevOps/MLOps dengan
menerapkan pengelolaan source code menggunakan Git dan GitHub.

## Tujuan Project

- Memudahkan mahasiswa mengambil nomor antrean layanan cetak secara digital.
- Menampilkan status antrean dan informasi loket yang sedang melayani.
- Membantu petugas mengelola antrean dari satu panel terpusat.
- Menyimpan data antrean dan riwayat layanan secara lokal menggunakan SQLite.
- Mempelajari pengembangan aplikasi web serta kolaborasi menggunakan Git dan
  GitHub.

## Fitur Utama

- Portal publik untuk memilih layanan dan mengambil nomor antrean.
- Pemantauan status antrean tanpa perlu memuat ulang halaman secara manual.
- Panel petugas dengan autentikasi PIN.
- Dukungan beberapa jenis layanan dan loket.
- Aksi petugas untuk memanggil, menyelesaikan, dan melewati antrean.
- Petugas dapat mengatur jumlah orang dan estimasi tunggu yang ditampilkan
  kepada mahasiswa, atau mengembalikannya ke perhitungan otomatis.
- Nomor antrean dimulai kembali setiap hari berdasarkan zona waktu Jakarta,
  sementara data historis tetap tersimpan.

## Teknologi yang Digunakan

- Next.js 16
- React 19
- TypeScript
- SQLite dengan `better-sqlite3`
- Tailwind CSS 4
- Lucide React
- Node.js
- Git dan GitHub

## Menjalankan Project Secara Lokal

### Prasyarat

- Node.js versi LTS
- npm

### Instalasi

1. Kloning repository:

   ```bash
   git clone https://github.com/rifkygustinugraha/devops-mlops-SystemPrintDesk.git
   cd devops-mlops-SystemPrintDesk
   ```

2. Instal dependensi:

   ```bash
   npm install
   ```

3. Salin `.env.example` menjadi `.env.local`, lalu sesuaikan nilainya:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Jalankan server development:

   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000) di browser. Panel
   petugas tersedia di [http://localhost:3000/petugas](http://localhost:3000/petugas).

Pada development, PIN petugas bawaan adalah `246810`. Ganti nilai ini sebelum
aplikasi digunakan bersama orang lain.

## Konfigurasi Environment

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `STAFF_PIN` | Production | PIN petugas berupa 8–12 digit angka. |
| `SESSION_SECRET` | Production | Secret unik minimal 32 karakter untuk menandatangani cookie sesi. |

Di development, aplikasi menyediakan PIN `246810` dan secret sementara. Jangan
gunakan nilai bawaan tersebut di production. Cookie sesi petugas bersifat
`HttpOnly`, `SameSite=Strict`, dan berlaku selama delapan jam. Percobaan PIN
dibatasi maksimal lima kali per alamat klien dalam jendela 15 menit.

## Struktur Repository

```text
SystemPrintDesk/
├── README.md
├── .env.example
├── data/
│   └── queue.db
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── petugas/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   └── lib/
├── package.json
└── tsconfig.json
```

- `src/app/page.tsx`: halaman publik untuk pengambilan dan pemantauan antrean.
- `src/app/petugas/page.tsx`: halaman panel petugas.
- `src/app/api/`: endpoint antrean dan sesi petugas.
- `src/components/`: komponen antarmuka portal publik dan dashboard petugas.
- `src/lib/queue.ts`: logika pembuatan serta pengelolaan antrean.
- `src/lib/auth.ts`: autentikasi PIN dan sesi petugas.
- `src/lib/db.ts`: inisialisasi serta akses database SQLite.
- `data/queue.db`: database lokal yang dibuat otomatis saat aplikasi berjalan.
>>>>>>> 5c856be (update box for identitas user)

**SystemPrintDesk** adalah aplikasi antrean layanan percetakan kampus. Mahasiswa dapat memilih layanan, mengambil tiket, dan melihat perkembangan antreannya secara langsung. Petugas mengelola pemanggilan dan penyelesaian tiket melalui dashboard khusus.

Project ini dikembangkan sebagai bagian dari pembelajaran **DevOps/MLOps**, dengan fokus pada pengembangan aplikasi, pengelolaan source code, dan kolaborasi menggunakan Git dan GitHub.

## ✨ Fitur Utama

- 🎫 **Ambil nomor antrean** berdasarkan layanan yang tersedia.
- 📱 **Pantau status tiket** dan perkiraan waktu tunggu dari halaman publik.
- 🔔 **Notifikasi browser** saat nomor antrean dipanggil.
- 🧑‍💼 **Dashboard petugas** untuk memanggil antrean berikutnya, menyelesaikan, atau melewati tiket.
- 🪟 **Beberapa loket** dengan informasi tiket yang sedang dilayani.
- 🔄 **Pembaruan antrean otomatis** pada halaman mahasiswa dan petugas.
- 🗓️ **Reservasi slot waktu** setiap 30 menit dengan kapasitas per layanan.
- 💾 **Penyimpanan SQLite** untuk data layanan, loket, dan tiket.

### Layanan bawaan

| Layanan | Awalan nomor | Estimasi awal |
| --- | :---: | :---: |
| Fotokopi | F | 3 menit |
| Cetak dokumen | C | 4 menit |
| Jilid & laminasi | J | 8 menit |
| Pindai dokumen | S | 5 menit |

Estimasi waktu tunggu dapat berubah mengikuti jumlah antrean yang sedang berjalan.

## 🧰 Teknologi

- **Next.js 16** dan **React 19**
- **TypeScript**
- **SQLite** melalui `better-sqlite3`
- **Tailwind CSS 4**
- **Lucide React**
- **Git** dan **GitHub**

## 🚀 Menjalankan Secara Lokal

### Prasyarat

- Node.js **22 atau lebih baru**
- npm
- Di Windows, instalasi `better-sqlite3` mungkin membutuhkan Visual Studio Build Tools dengan workload **Desktop development with C++**.

### Langkah-langkah

1. Clone repository dan masuk ke folder project:

   ```bash
   git clone https://github.com/rifkygustinugraha/devops-mlops-SystemPrintDesk.git
   cd devops-mlops-SystemPrintDesk
   ```

2. Instal dependensi:

   ```bash
   npm install
   ```

3. Buat file `.env.local` dari `.env.example`, lalu ubah nilainya:

   ```env
   STAFF_PIN=buat-pin-8-sampai-12-digit
   SESSION_SECRET=ganti-dengan-secret-acak-minimal-32-karakter
   ```

   Di PowerShell, file contoh dapat disalin dengan:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Jalankan server development:

   ```bash
   npm run dev
   ```

5. Buka [http://localhost:3000](http://localhost:3000).

Halaman antrean mahasiswa tersedia di `/`, sedangkan dashboard petugas tersedia di `/petugas`.

> **Penting:** Jangan gunakan PIN demo atau secret sementara untuk lingkungan bersama maupun production. Gunakan PIN khusus 8–12 digit dan `SESSION_SECRET` acak minimal 32 karakter.

### Database

Database SQLite dibuat otomatis di `data/queue.db` saat aplikasi dijalankan. Layanan bawaan dan tiga loket awal juga dibuat otomatis. Nomor antrean dimulai kembali setiap hari berdasarkan zona waktu Jakarta, sementara tiket sebelumnya tetap disimpan sebagai riwayat.

Reservasi tersedia untuk hari berjalan pada slot 30 menit dari pukul 08.00
hingga 17.00 WIB. Setiap layanan memiliki kapasitas lima reservasi per slot.
Tiket reservasi tetap berstatus menunggu, tetapi tidak dapat dipanggil petugas
sebelum waktu reservasinya. Migrasi menambahkan kolom reservasi otomatis tanpa
menghapus tiket yang sudah tersimpan.

### Konfigurasi & keamanan

| Variabel | Keterangan |
| --- | --- |
| `STAFF_PIN` | PIN bersama 8–12 digit untuk masuk ke dashboard petugas. |
| `SESSION_SECRET` | Secret unik minimal 32 karakter untuk menandatangani sesi petugas. |

Jika belum dikonfigurasi di development, aplikasi menggunakan PIN demo `246810` dan secret sementara. Jangan gunakan nilai bawaan tersebut di lingkungan bersama atau production. Cookie sesi menggunakan `HttpOnly` dan `SameSite=Strict`, berakhir setelah delapan jam, dan percobaan PIN dibatasi lima kali per alamat klien dalam jendela 15 menit.

## 🧪 Pemeriksaan

Jalankan perintah berikut untuk memeriksa kualitas dan kesiapan aplikasi:

Jalankan pemeriksaan berikut sebelum melakukan perubahan ke repository:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

<<<<<<< HEAD
## 🗂️ Struktur Repository

```text
.
├── data/                 # Database SQLite lokal
├── public/               # Aset statis
├── src/
│   ├── app/              # Halaman dan endpoint API
│   │   ├── api/          # API antrean, tiket, dan sesi petugas
│   │   └── petugas/      # Halaman dashboard petugas
│   ├── components/       # Antarmuka antrean publik dan dashboard
│   └── lib/              # Database, autentikasi, dan logika antrean
├── .env.example          # Contoh konfigurasi environment
├── package.json
└── README.md
```

## 🌐 Endpoint Utama

| Endpoint | Kegunaan |
| --- | --- |
| `GET /api/queue` | Melihat antrean publik dan status loket |
| `POST /api/queue` | Membuat tiket antrean |
| `GET /api/tickets/[token]` | Melihat status tiket |
| `DELETE /api/tickets/[token]` | Membatalkan tiket |
| `/api/staff/session` | Mengelola sesi login petugas |
| `/api/staff/queue` | Melihat dan mengelola antrean sebagai petugas |

## ☁️ Catatan Deployment

Aplikasi memerlukan runtime Node.js dan penyimpanan disk persisten untuk file SQLite. Jalankan satu instance aplikasi pada volume persisten; filesystem sementara atau beberapa replika aplikasi tidak cocok untuk konfigurasi database ini. Untuk deployment multi-instance, ganti adapter database dengan PostgreSQL sebelum membuka layanan secara luas. Pastikan reverse proxy tepercaya mengatur `X-Real-IP` atau `X-Forwarded-For` agar pembatasan percobaan login dapat menggunakan alamat klien.

## 👥 Anggota Kelompok

| Nama | NIM | GitHub |
| --- | --- | --- |
| Fahreza Nur Efendi | 23.01.53.0022 | [FahrezaNurEfendi](https://github.com/FahrezaNurEfendi) |
| Rifky Gusti Nugraha | 23.01.53.0030 | [rifkygustinugraha](https://github.com/rifkygustinugraha) |
| Irving Bayu Ananda Praditya | 23.01.53.0031 | [IrvingBayuAnanda](https://github.com/IrvingBayuAnanda) |

## 📈 Status Project

Project berupa aplikasi antrean digital dengan portal publik, dashboard petugas, beberapa layanan dan loket, serta penyimpanan SQLite. Pengembangan dan penyempurnaan fitur dilakukan secara bertahap.
=======
## Catatan Deployment

Aplikasi membutuhkan runtime Node.js dan penyimpanan disk persisten untuk file
SQLite. Gunakan satu instance aplikasi pada volume persisten; filesystem
sementara atau beberapa replika aplikasi tidak cocok untuk konfigurasi SQLite
saat ini. Untuk deployment multi-instance, gunakan adapter database seperti
PostgreSQL terlebih dahulu.

Pastikan reverse proxy tepercaya meneruskan `X-Real-IP` atau
`X-Forwarded-For` secara benar karena informasi tersebut digunakan untuk
pembatasan percobaan login.

## Anggota Kelompok

1. **Fahreza Nur Efendi**

   - NIM: `23.01.53.0022`
   - GitHub: [FahrezaNurEfendi](https://github.com/FahrezaNurEfendi)

2. **Rifky Gusti Nugraha**

   - NIM: `23.01.53.0030`
   - GitHub: [rifkygustinugraha](https://github.com/rifkygustinugraha)

3. **Irving Bayu**

   - NIM: `23.01.53.0031`
   - GitHub: [irvingbayu2-cmd](https://github.com/irvingbayu2-cmd)

## Status Project

Tahap pengembangan: aplikasi antrean dan panel petugas telah tersedia untuk
dijalankan secara lokal. Pengembangan dan penyempurnaan fitur dilakukan secara
kolaboratif melalui Git dan GitHub.
>>>>>>> 5c856be (update box for identitas user)
