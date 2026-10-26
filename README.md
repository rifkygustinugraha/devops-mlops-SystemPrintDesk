# PrintDesk

Sistem antrean layanan fotokopi kampus dengan portal mahasiswa, panel petugas, beberapa layanan, dan beberapa loket.

## Menjalankan secara lokal

1. Instal dependensi dengan `npm install`.
2. Salin `.env.example` menjadi `.env.local`.
3. Jalankan `npm run dev`, lalu buka http://localhost:3000.
4. PIN demo lokal adalah `246810`. Atur `STAFF_PIN` sendiri sebelum digunakan bersama orang lain.

Database SQLite dibuat otomatis di `data/queue.db`. Nomor antrean kembali mulai dari awal setiap hari berdasarkan zona waktu Jakarta. Data tiket lama tetap tersimpan untuk riwayat; database tidak di-reset otomatis.

## Konfigurasi

| Variabel         | Wajib      | Keterangan                                                                               |
| ---------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `STAFF_PIN`      | Production | PIN bersama 8–12 digit untuk panel petugas. Gunakan nilai acak yang tidak dipakai ulang. |
| `SESSION_SECRET` | Production | Secret unik minimal 32 karakter untuk tanda tangan cookie sesi petugas.                  |

Di development, aplikasi menyediakan PIN `246810` dan secret sementara. Jangan gunakan nilai bawaan tersebut di production. Cookie sesi bersifat `HttpOnly`, `SameSite=Strict`, dan berakhir setelah delapan jam. Percobaan PIN dibatasi lima kali per alamat klien dalam jendela 15 menit.

## Pemeriksaan

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Catatan deployment

Aplikasi memerlukan runtime Node.js dan penyimpanan disk persisten untuk file SQLite. Jalankan satu instance aplikasi pada volume persisten; filesystem sementara atau beberapa replika aplikasi tidak cocok untuk konfigurasi SQLite ini. Untuk deployment multi-instance, ganti adapter database dengan PostgreSQL sebelum membuka layanan secara luas. Pastikan reverse proxy tepercaya mengatur `X-Real-IP` atau `X-Forwarded-For` untuk pembatasan login.
