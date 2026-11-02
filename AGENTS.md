<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Panduan Agen — PrintDesk

## Tentang berkas ini

`AGENTS.md` adalah berkas Markdown berisi panduan yang perlu diikuti asisten coding saat bekerja di repositori ini. Bagian panduan proyek di bawah berlaku untuk seluruh repositori. Blok berbahasa Inggris di atas dikelola otomatis oleh Next.js; jangan menghapus atau mengubahnya karena `next dev` akan menambahkannya kembali.

## Gambaran proyek

- PrintDesk adalah aplikasi antrean layanan percetakan/fotokopi kampus.
- Aplikasi menggunakan Next.js App Router, React, dan TypeScript.
- Antarmuka mahasiswa dan petugas berada di `src/components/` dan `src/app/`.
- Endpoint API berada di `src/app/api/`.
- Logika antrean, autentikasi petugas, dan koneksi SQLite berada di `src/lib/`.
- Basis data `data/queue.db` dibuat otomatis dan menyimpan data antrean; jangan menghapus atau meresetnya kecuali diminta secara eksplisit.

## Cara bekerja

- Gunakan bahasa Indonesia untuk penjelasan dan dokumentasi yang ditambahkan atau diubah.
- Sebelum mengubah kode, baca berkas terkait dan ikuti pola yang sudah digunakan proyek.
- Buat perubahan sekecil mungkin dan pertahankan perilaku yang sudah ada.
- Untuk perubahan kode, jalankan pemeriksaan yang paling relevan. Perintah yang tersedia:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- Gunakan Node.js 22 atau lebih baru dan npm 10 atau lebih baru.
- Jangan menambahkan rahasia, PIN, atau berkas lingkungan lokal ke Git. Gunakan `.env.local` untuk konfigurasi lokal.
- Pertahankan penggunaan zona waktu `Asia/Jakarta` untuk tanggal antrean.
- Perubahan skema basis data harus mempertimbangkan data yang sudah tersimpan; jangan mengasumsikan basis data boleh dibuat ulang.

## Dokumentasi proyek

Lihat `README.md` untuk langkah menjalankan aplikasi, konfigurasi variabel lingkungan, dan catatan deployment.
