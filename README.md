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

**SystemPrintDesk** adalah aplikasi antrean layanan percetakan kampus. Mahasiswa dapat memilih layanan, mengambil tiket, dan melihat perkembangan antreannya secara langsung. Petugas mengelola pemanggilan dan penyelesaian tiket melalui dashboard khusus.

Project ini dikembangkan sebagai bagian dari pembelajaran **DevOps/MLOps**, dengan fokus pada pengembangan aplikasi, pengelolaan source code, dan kolaborasi menggunakan Git dan GitHub.

## ✨ Fitur Utama

- 🎫 **Ambil nomor antrean** berdasarkan layanan yang tersedia.
- 📱 **Pantau status tiket** dan perkiraan waktu tunggu dari halaman publik.
- 🔔 **Notifikasi browser** saat nomor antrean dipanggil.
- 🧑‍💼 **Dashboard petugas** untuk memanggil antrean berikutnya, menyelesaikan, atau melewati tiket.
- 🪟 **Beberapa loket** dengan informasi tiket yang sedang dilayani.
- 🔄 **Pembaruan antrean otomatis** pada halaman mahasiswa dan petugas.
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

### Konfigurasi & keamanan

| Variabel | Keterangan |
| --- | --- |
| `STAFF_PIN` | PIN bersama 8–12 digit untuk masuk ke dashboard petugas. |
| `SESSION_SECRET` | Secret unik minimal 32 karakter untuk menandatangani sesi petugas. |

Jika belum dikonfigurasi di development, aplikasi menggunakan PIN demo `246810` dan secret sementara. Jangan gunakan nilai bawaan tersebut di lingkungan bersama atau production. Cookie sesi menggunakan `HttpOnly` dan `SameSite=Strict`, berakhir setelah delapan jam, dan percobaan PIN dibatasi lima kali per alamat klien dalam jendela 15 menit.

## 🧪 Pemeriksaan

Jalankan perintah berikut untuk memeriksa kualitas dan kesiapan aplikasi:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

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
