# Panduan Instalasi ASAS

ASAS terdiri dari dua bagian:

| Bagian | Berkas | Dipasang di |
| --- | --- | --- |
| **Backend** (server + database) | `Kode.gs` | Google Apps Script (akun Google sekolah) |
| **Frontend** (tampilan) | isi folder `asas` (hasil ekstrak ZIP) | GitHub Pages |

Urutannya: pasang backend dulu → dapat alamat `/exec` → tempel ke frontend → unggah frontend.

> **Ingin mencoba dulu tanpa memasang apa pun?** Ekstrak ZIP, lalu buka `index.html`. Aplikasi berjalan dalam **Mode Demo** (login `admin` / `admin`, data contoh, tersimpan hanya di perangkat itu).

---

## Bagian A — Backend (Google Apps Script)

1. Buka <https://script.google.com> dengan akun Google sekolah → **Proyek baru**.
2. Hapus isi `Kode.gs` bawaan, lalu tempel **seluruh** isi berkas `Kode.gs` dari saya. Klik ikon simpan.
3. Di daftar fungsi (atas editor), pilih **`setupAppEnvironment`** → klik **Jalankan**.
   - Saat diminta izin: **Tinjau izin** → pilih akun → **Lanjutan** → **Buka proyek (tidak aman)** → **Izinkan**. Ini wajar karena skripnya milik Anda sendiri.
4. Buka **Log eksekusi** di bawah. Catat:
   - **Nama Pengguna:** `admin`
   - **Kata Sandi:** (10 karakter acak — hanya muncul sekali di log ini)
5. Periksa Google Drive: ada folder **ASAS** berisi `Logo`, `TandaTangan`, `Foto`, `Login`, dan spreadsheet **ASAS — Database**.
6. Klik **Deploy → New deployment** → ikon roda gigi → **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Klik **Deploy**, lalu **salin URL Web app** (berakhiran `/exec`).

> ⚠️ `setupAppEnvironment` cukup dijalankan **sekali**. Bila dijalankan lagi, ia tidak mengubah apa pun.
>
> **Lupa kata sandi?** Jalankan fungsi `resetKataSandiAdmin` → kata sandi baru muncul di Log eksekusi.

---

## Bagian B — Sambungkan frontend ke backend

1. Ekstrak `asas-frontend.zip`. Hasilnya folder **`asas`** yang isinya langsung `index.html`, `css`, `js`.
2. Buka `asas/js/config.js` dengan Notepad, tempel URL `/exec` di antara tanda kutip:

   ```js
   const GAS_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```

3. Simpan.

---

## Bagian C — Unggah ke GitHub Pages

**Folder yang di-`git init` adalah folder `asas` itu sendiri** — folder yang ketika dibuka langsung terlihat `index.html`. Jangan naik satu tingkat, jangan masuk ke `css` atau `js`.

1. Pasang Git (<https://git-scm.com/download/win>) dan buat akun di <https://github.com> bila belum punya.
2. Sekali saja per komputer:

   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   ```

3. Di GitHub: **+ → New repository** → nama misalnya `asas` → **Public** → jangan centang README → **Create repository**.
4. Buka folder `asas` di File Explorer → klik kolom alamat → ketik `powershell` → Enter. Lalu periksa:

   ```powershell
   dir
   ```

   Harus terlihat `index.html`, `css`, `js`. Kalau tidak, Anda di folder yang salah — berhenti dulu.
5. Jalankan satu per satu (ganti `USERNAME`):

   ```bash
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/asas.git
   git push -u origin main
   ```

   Saat diminta **Password**, tempel **Personal Access Token** (bukan kata sandi GitHub). Buat di <https://github.com/settings/tokens> → *Generate new token (classic)* → centang **repo**. Saat ditempel, layar memang tidak menampilkan apa-apa — itu normal.
6. Di repository: **Settings → Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → **Save** → centang **Enforce HTTPS**.
7. Tunggu 1–2 menit. Alamat aplikasi: `https://USERNAME.github.io/asas/`

---

## Bagian D — Langkah pertama di aplikasi

1. Masuk dengan `admin` + kata sandi dari Log eksekusi → **Pengaturan Tampilan → Akun Admin** → ganti kata sandi.
2. **Kop Surat** — unggah logo, atur baris teks, **Simpan**. Nama sekolah terisi otomatis dari baris yang memuat SD/SMP/SMA/SMK/MI/MTs/MA.
3. **Pengaturan Tampilan** — isi tahun ajaran, semester, kepala sekolah, tanda tangan.
4. **Data Siswa** — Unduh Templat Excel → isi → Impor Excel → Unggah Foto (nama berkas = NISN, mis. `0091823412.jpg`).
5. **Ruang & No Ujian** — Buat Banyak ruang → atur format nomor → Bagi Otomatis.
6. **Jadwal Sesi** — Tambah Sesi (bisa langsung untuk semua ruang), isi pengawas per ruang.
7. **Desain Kartu** — pilih kertas & jumlah kartu, seret elemen, **Simpan Templat**.
8. **Cetak Dokumen** — di dialog cetak: skala **100%**, margin **Default/None**, matikan **Header dan footer**. Uji satu lembar dulu di printer asli.

---

## Menginstal ASAS sebagai aplikasi (HP & laptop)

Setelah situs online di GitHub Pages (HTTPS), ASAS bisa dipasang seperti aplikasi biasa:

- **Laptop (Chrome/Edge):** klik tombol **Instal aplikasi** di halaman login atau di menu samping, atau ikon instal di ujung kanan bilah alamat.
- **HP Android (Chrome):** tombol **Instal aplikasi**, atau menu ⋮ → **Instal aplikasi**.
- **iPhone/iPad (Safari):** tombol **Bagikan** → **Tambahkan ke Layar Utama**.

Setelah terpasang, aplikasi terbuka tanpa bilah alamat dan tampilannya tetap muncul walau sinyal hilang (data terakhir dari perangkat). Saat ada versi baru, muncul pita **Versi baru tersedia** → ketuk **Muat ulang**.

Ini bukan aplikasi Play Store; pemasangannya lewat browser. Bila alamat situs diganti, aplikasi harus dipasang ulang dari alamat baru.

---

## Memperbarui dari versi sebelumnya (paket pembaruan)

1. **Backend:** buka proyek Apps Script → ganti seluruh isi `Kode.gs` dengan berkas baru → simpan → **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. URL `/exec` tetap sama. Jangan jalankan `setupAppEnvironment` lagi.
2. **Frontend:** ekstrak ZIP pembaruan, lalu salin **isi** folder `asas` di dalamnya ke folder `asas` lama Anda dan pilih **Ganti/Replace**. Paket pembaruan sengaja **tidak** berisi `js/config.js`, jadi URL `/exec` Anda tidak tertimpa.
3. Dari folder `asas`: `git add .` → `git commit -m "Perbarui"` → `git push`. Tunggu 1–2 menit, buka situs, tekan **Ctrl+Shift+R**.

---

## Memperbarui aplikasi

**Frontend** (setelah mengubah berkas di folder `asas`):

```bash
git add .
git commit -m "Perbarui"
git push
```

Bila tampilan masih lama, tekan **Ctrl+Shift+R**.

> Karena aplikasi bisa diinstal, berkas disimpan di perangkat. Setiap kali Anda sendiri mengubah berkas frontend (termasuk `js/config.js`), naikkan angka versi di baris `const VERSION = 'asas-v1.1.4';` pada `sw.js` (mis. menjadi `asas-v1.1.5`) sebelum `git push`, supaya perangkat mengambil berkas baru.

**Backend** (setelah mengubah `Kode.gs`): **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
Jangan pilih *New deployment* — itu membuat URL `/exec` baru dan aplikasi berhenti tersambung.

---

## Bila ada masalah

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| Halaman 404 di GitHub Pages | `git init` dijalankan di folder yang salah | Buka repository di browser: `index.html` harus terlihat di halaman depan. Kalau tidak, ulangi dari folder `asas` dan `git push -u origin main --force` |
| Tampil tanpa warna/tata letak | Folder `css` / `js` tidak ikut | Jangan unggah lewat tombol *Upload files*; pakai perintah git di atas |
| Masih "MODE DEMO" setelah online | `GAS_URL` belum diisi / belum di-push | Isi `js/config.js`, lalu `git add .` → `commit` → `push` |
| "Server membalas HTTP … (bukan JSON)" | Akses deploy bukan **Anyone**, atau URL bukan `/exec` | Periksa pengaturan deploy dan URL |
| "Aplikasi belum dipasang" | `setupAppEnvironment` belum dijalankan | Jalankan sekali di editor Apps Script |
| "Terlalu banyak percobaan gagal" | 5 kali salah sandi | Tunggu 10 menit, atau jalankan `resetKataSandiAdmin` |
| Chip kanan atas "Menunggu koneksi…" | Internet putus | Biarkan — perubahan tersimpan di perangkat dan terkirim otomatis saat tersambung |
| Ukuran kartu cetak meleset | Skala cetak bukan 100% | Dialog cetak → Skala **100%**, bukan "Fit to page" |

**Mengukur kecepatan:** tekan F12 → Console → ketik `Perf.table()` untuk melihat waktu tiap panggilan (total, server, jaringan).
