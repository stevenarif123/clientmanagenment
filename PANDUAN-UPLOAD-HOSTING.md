# 🚀 Panduan Upload & Deployment ClientHub ke Web Hosting / cPanel

Aplikasi **ClientHub** dirancang dengan arsitektur **Unified No-Build PHP + SQLite + Vue 3 CDN**. Anda tidak memerlukan setup database MySQL yang rumit, tidak memerlukan `npm install`, dan tidak memerlukan build tools. Cukup upload, ekstrak, dan aplikasi langsung jalan!

---

## 🔑 Informasi Akun Login Admin Default

- **URL Login**: `https://domain-anda.com/#/login` (atau subdomain Anda)
- **Username**: `admin`
- **Password**: `Mantapfb1_`

> 💡 *Setelah berhasil login pertama kali, Anda dapat mengubah username, email, dan password kapan saja melalui menu Profil di pojok kiri bawah.*

---

## 📋 Persyaratan Server / Hosting

- **Web Server**: Apache (mendukung `.htaccess` / `mod_rewrite`), Nginx, atau LiteSpeed.
- **Versi PHP**: PHP 7.4, 8.0, 8.1, 8.2, atau 8.3.
- **Ekstensi PHP yang dibutuhkan** *(sudah aktif secara default di 99% cPanel / Shared Hosting)*:
  - `pdo_sqlite`
  - `sqlite3`
  - `json`
  - `mbstring`

---

## 🛠️ Langkah-Langkah Upload ke cPanel / Shared Hosting

### Cara 1: Menggunakan File ZIP Siap Upload (Paling Mudah)

1. **Buat / Gunakan File ZIP**:
   - Di komputer Anda, jalankan skrip `package-production.ps1` (atau gunakan file **`ClientHub-Ready-Upload.zip`** yang sudah dibuat).
2. **Buka cPanel**:
   - Masuk ke **cPanel** akun hosting Anda.
   - Buka menu **File Manager**.
   - Masuk ke direktori **`public_html`** (atau folder subdomain Anda, misal `client.domainanda.com`).
3. **Upload & Ekstrak**:
   - Klik tombol **Upload** $\to$ pilih file `ClientHub-Ready-Upload.zip`.
   - Setelah selesai, klik kanan pada file ZIP $\to$ pilih **Extract**.
4. **Periksa Permission Folder**:
   - Pastikan folder **`data/`** dan folder **`uploads/`** memiliki permission **`755`** atau **`775`** agar PHP dapat menulis database dan menyimpan file lampiran.
5. **Selesai! 🎉**:
   - Buka domain Anda di browser: `https://domain-anda.com`
   - Masuk dengan username `admin` dan password `Mantapfb1_`.

---

## 🛡️ Keamanan & Proteksi yang Sudah Diterapkan

1. **Proteksi Database SQLite (`data/.htaccess`)**:
   - File database `data/database.sqlite` diblokir total dari akses web publik menggunakan aturan Apache `Require all denied`.
2. **Proteksi Direktori Upload (`uploads/.htaccess`)**:
   - Mencegah eksekusi skrip PHP jahat yang diunggah (`php_flag engine off` dan blokir ekstensi file eksekusi).
3. **Header Keamanan Web (`.htaccess`)**:
   - Dilengkapi dengan proteksi `X-Content-Type-Options`, `X-Frame-Options`, dan `X-XSS-Protection`.
4. **Sesi Login Aman**:
   - Sesi terenkripsi dan otomatis tersimpan selama 30 hari.

---

## 🌐 Halaman Publik yang Tersedia

1. **Dashboard Admin**: `https://domain-anda.com/#/`
2. **Portal Klien**: `https://domain-anda.com/portal.html?token=...` *(Tautan otomatis dibuat di halaman detail setiap proyek)*
3. **Form Kontak / Lead Inquiries Publik**: `https://domain-anda.com/public-contact-form.html`

---

## ❓ Troubleshooting (Tanya & Jawab)

- **Q: Muncul error 404 saat request API?**
  - **A**: Pastikan module Apache `mod_rewrite` aktif dan file `.htaccess` di root folder ikut terunggah (pastikan opsi *"Show Hidden Files"* di cPanel File Manager dicentang).
- **Q: Database tidak bisa menyimpan data (Error Read-Only)?**
  - **A**: Berikan permission `775` atau `755` pada folder `data/` dan file `data/database.sqlite`.
- **Q: Ingin ganti password admin?**
  - **A**: Login ke aplikasi $\to$ klik nama akun di pojok kiri bawah $\to$ pilih **"Change Password"**.
