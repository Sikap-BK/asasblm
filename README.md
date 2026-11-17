# ASAS — Administrasi Sumatif Akhir Semester

Aplikasi web untuk membuat dan mencetak **Kartu Sumatif, Daftar Hadir, dan Berita Acara**.
Frontend statis (HTML/CSS/JS murni) + backend Google Apps Script sebagai REST API (Google Sheets & Drive).

Folder ini adalah **akar repository GitHub Pages** — `index.html` harus tetap berada di sini.

```
index.html
css/style.css
js/config.js   ← isi GAS_URL di sini
js/core.js     ← inti: login, router, cache, antrean simpan
js/pages.js    ← Dashboard, Data Siswa, Ruang & No Ujian, Jadwal Sesi
js/design.js   ← Kop Surat, Desain Kartu, Pengaturan Tampilan
js/cetak.js    ← Cetak Dokumen, Laporan Tabel
js/demo.js     ← Mode Demo (hanya dimuat bila GAS_URL kosong)
manifest.webmanifest, sw.js, pwa.js, offline.html, icons/  ← agar bisa diinstal (PWA)
```

Cara pasang: lihat `PANDUAN-INSTALASI.md`.
