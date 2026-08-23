# Panduan Setup Lengkap - Client Management System

Dokumentasi lengkap untuk setup dan menjalankan Client Management System.

## 📋 Daftar Isi
1. [Prasyarat](#prasyarat)
2. [Konfigurasi Database](#konfigurasi-database)
3. [Setup Backend](#setup-backend)
4. [Setup Frontend](#setup-frontend)
5. [Menjalankan Aplikasi](#menjalankan-aplikasi)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Prasyarat

Sebelum memulai, pastikan Anda telah menginstall:

- **PHP 8.0 atau lebih tinggi** (dengan extension: PDO, JSON, curl)
- **Node.js 18+** dan npm
- **Supabase account** (tier gratis sudah cukup)
- **Git** (opsional, untuk cloning repository)
- **Web Server** (Apache, Nginx, atau PHP built-in server)

### Verifikasi Instalasi

```bash
# Check PHP version
php -v

# Check Node.js version
node -v

# Check npm version
npm -v
```

---

## 🗄️ Konfigurasi Database

### Langkah 1: Buat Supabase Project

1. Kunjungi [supabase.com](https://supabase.com)
2. Login atau daftar akun gratis
3. Klik **"New Project"**
4. Isi form dengan data berikut:
   - **Name**: `ClientManagement` (atau nama pilihan Anda)
   - **Database Password**: Buat password yang kuat (SIMPAN BAIK-BAIK!)
   - **Region**: Pilih region terdekat dengan lokasi Anda
5. Klik **"Create new project"** dan tunggu proses selesai (biasanya 2-3 menit)

### Langkah 2: Ambil Kredensial Database

1. Di dashboard Supabase, buka **Project Settings** (ikon gear)
2. Pilih tab **Database** di sidebar kiri
3. Cari bagian **"Connection string"**
4. Catat informasi berikut:
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Password yang Anda buat tadi

Contoh connection string:
```
postgresql://postgres:YourPasswordHere@db.cqnyyhwzuhibltwbnmsh.supabase.co:5432/postgres
```

### Langkah 3: Buat Schema Database

1. Masih di dashboard Supabase, klik **SQL Editor** (sidebar kiri)
2. Klik **New query**
3. Buka file `backend/setup/database-schema.sql` dari project
4. Copy seluruh isi file dan paste ke SQL Editor
5. Klik **Run** (tombol play hijau)
6. Tunggu sampai eksekusi selesai

**Tabel yang akan dibuat:**
- `admins` - User admin
- `clients` - Data klien
- `services` - Jenis layanan
- `projects` - Project/pekerjaan
- `project_services` - Relasi project dengan services
- `expenses` - Pengeluaran project
- `payments` - Pembayaran dari klien
- `communications` - Log komunikasi
- `files` - Metadata file
- `submissions` - Submission dari form publik
- `sessions` - Session autentikasi
- `api_logs` - Log request API

### Langkah 4 (Opsional): Load Sample Data

Jika ingin data contoh untuk testing:

1. Di SQL Editor, buat query baru
2. Buka file `backend/setup/seed-data.sql`
3. Copy dan paste ke SQL Editor
4. Klik **Run**

Data contoh ini termasuk:
- 5 sample clients
- 10 sample projects
- Data expenses dan payments
- Communication logs

---

## 🔐 Setup Backend

### Langkah 1: Konfigurasi Environment

1. Navigasi ke folder `backend/config/`
2. Cari file `.env.php` (jika belum ada, lihat file `.env.example.php` sebagai template)
3. Edit file `.env.php` dan isi dengan kredensial Supabase Anda:

```php
<?php
/**
 * Environment Configuration
 */

return [
    // Supabase Configuration
    'SUPABASE_URL' => 'https://cqnyyhwzuhibltwbnmsh.supabase.co',
    'SUPABASE_ANON_KEY' => 'YOUR_ANON_KEY_HERE',
    'SUPABASE_SERVICE_KEY' => 'YOUR_SERVICE_ROLE_KEY_HERE',
    
    // Database Connection (PostgreSQL via Supabase)
    'DB_HOST' => 'db.cqnyyhwzuhibltwbnmsh.supabase.co',
    'DB_PORT' => '5432',
    'DB_NAME' => 'postgres',  // PENTING: gunakan 'postgres' bukan 'clientmanagement'
    'DB_USER' => 'postgres',
    'DB_PASSWORD' => 'YourDatabasePasswordHere',
    
    // Application Settings
    'APP_NAME' => 'Client Management System',
    'APP_ENV' => 'development',  // Ubah ke 'production' saat deploy
    'APP_DEBUG' => true,         // Set ke false di production
    'APP_URL' => 'http://localhost',
    
    // Session Configuration
    'SESSION_LIFETIME' => 86400, // 24 jam dalam detik
    'SESSION_SECRET' => 'your-secret-key-change-this-in-production',
    
    // File Upload Configuration
    'MAX_FILE_SIZE' => 5242880,  // 5MB dalam bytes
    'ALLOWED_FILE_TYPES' => ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip'],
    
    // CORS Configuration
    'CORS_ALLOWED_ORIGINS' => ['http://localhost:5173', 'http://localhost:3000'],
    
    // Default Admin (untuk first-time setup)
    'DEFAULT_ADMIN_USERNAME' => 'admin',
    'DEFAULT_ADMIN_PASSWORD' => 'admin123',  // UBAH setelah login pertama!
];
```

### Langkah 2: Ambil API Key Supabase

1. Di dashboard Supabase, buka **Project Settings**
2. Pilih tab **API** di sidebar
3. Di bagian **"Project API keys"**, copy:
   - **`anon` / `public` key** → masukkan ke `SUPABASE_ANON_KEY`
   - **`service_role` key** → masukkan ke `SUPABASE_SERVICE_KEY`

### Langkah 3: Verifikasi Koneksi Backend

Buka terminal/command prompt di folder `backend/` dan cek koneksi database:

```bash
php -r "require 'config/database.php'; \$db = Database::getInstance(); echo 'Database connected!'; var_dump(\$db->fetch('SELECT NOW()'));"
```

Jika berhasil, akan muncul output dengan timestamp database.

---

## 🎨 Setup Frontend

### Langkah 1: Install Dependencies

Navigasi ke folder `frontend/`:

```bash
cd frontend
npm install
```

Ini akan menginstall semua package yang diperlukan seperti:
- Vue.js 3
- Vue Router
- Pinia (state management)
- Axios (HTTP client)
- Tailwind CSS
- Chart.js
- Dan lainnya

### Langkah 2: Konfigurasi API Endpoint

Edit file `frontend/src/services/api.js` dan pastikan URL API mengarah ke backend Anda:

```javascript
const API_BASE_URL = 'http://localhost/backend/api' || process.env.VITE_API_URL;
// Atau jika menggunakan PHP built-in server:
// const API_BASE_URL = 'http://localhost:8000/backend/api';
```

### Langkah 3: Konfigurasi Vite

File `frontend/vite.config.js` seharusnya sudah benar, tapi pastikan:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: 'localhost'
  }
})
```

---

## ▶️ Menjalankan Aplikasi

### Opsi 1: Menggunakan PHP Built-in Server (Untuk Development)

**Terminal 1 - Backend:**
```bash
cd backend
php -S localhost:8000
```

Backend akan berjalan di: `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend akan berjalan di: `http://localhost:5173`

### Opsi 2: Menggunakan Web Server (Apache/Nginx)

#### Jika menggunakan Apache:

1. Copy folder `backend/` ke web root (biasanya `C:\xampp\htdocs\` atau `/var/www/html/`)
2. Copy folder `frontend/` atau hasil build-nya ke lokasi yang sama
3. Akses melalui `http://localhost/ClientManagement/` atau domain Anda

#### Setup Virtual Host (Opsional):

Edit file Apache config (`httpd.conf` atau di folder `conf-extra/`):

```apache
<VirtualHost *:80>
    ServerName clientmanagement.local
    DocumentRoot "D:\Project\ClientManagement\backend"
    
    <Directory "D:\Project\ClientManagement\backend">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Rewrite rules untuk routing
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.php$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.php [L]
    </IfModule>
</VirtualHost>
```

Tambah ke file `hosts` (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 clientmanagement.local
```

### Langkah 1: Akses Setup Awal

1. Buka browser dan kunjungi aplikasi:
   - Development: `http://localhost:5173`
   - Production: `http://yourdomain.com`

2. Anda akan diminta setup admin awal
3. Masukkan:
   - **Username**: Nama user admin (min 3 karakter)
   - **Password**: Password yang kuat (min 6 karakter)
   - **Email** (opsional): Email admin

4. Klik **"Setup"** dan tunggu selesai

### Langkah 2: Login

1. Gunakan username dan password yang baru saja dibuat
2. Klik **"Login"**
3. Selesai! Anda sudah bisa mulai menggunakan aplikasi

---

## 🔐 Security Notes - Password Hashing

Project ini menggunakan **BCRYPT** dengan cost factor 12 untuk hashing password, yang merupakan standar industry untuk keamanan password.

Implementasi ada di `backend/middleware/auth.php`:

```php
public static function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

public static function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}
```

Keuntungan BCRYPT:
- ✅ Tahan terhadap brute force attacks
- ✅ Cost factor 12 memberikan delay yang signifikan
- ✅ Hash berbeda setiap kali (karena salt yang unik)
- ✅ Secure by default dengan PHP's password_* functions

---

## 🚀 Build untuk Production

### Build Frontend

```bash
cd frontend
npm run build
```

Hasil build akan ada di folder `frontend/dist/`. Upload folder ini ke web server Anda.

### Konfigurasi Production

1. Edit `backend/config/.env.php`:
   ```php
   'APP_ENV' => 'production',
   'APP_DEBUG' => false,
   'APP_URL' => 'https://yourdomain.com',
   ```

2. Update `CORS_ALLOWED_ORIGINS` dengan domain produksi Anda

3. Gunakan HTTPS di production

4. Setup log rotation untuk `backend/logs/`

---

## 🆘 Troubleshooting

### Error: "Database connection failed"

**Penyebab**: Kredensial database salah atau koneksi tidak tercapai

**Solusi**:
1. Verifikasi host, port, database name, user, dan password di `.env.php`
2. Pastikan IP Anda di-whitelist di Supabase Settings
3. Cek firewall/antivirus yang mungkin memblokir koneksi

### Error: "CORS error" atau "OPTIONS 403"

**Penyebab**: Frontend tidak bisa akses API backend

**Solusi**:
1. Update `CORS_ALLOWED_ORIGINS` di `.env.php` dengan URL frontend
2. Contoh:
   ```php
   'CORS_ALLOWED_ORIGINS' => ['http://localhost:5173', 'https://yourdomain.com'],
   ```

### Error: "Setup already completed" tapi tidak bisa login

**Penyebab**: Admin pertama sudah dibuat tapi passwordnya lupa

**Solusi**:
1. Query database untuk reset admin:
   ```sql
   -- Reset admin password melalui SQL Editor Supabase
   UPDATE admins SET password_hash = '$2y$12$...' WHERE username = 'admin';
   ```
   
2. Atau delete admin dan setup ulang:
   ```sql
   DELETE FROM sessions;
   DELETE FROM admins;
   ```
   
3. Maka aplikasi akan kembali ke setup screen

### Frontend tidak bisa connect ke Backend

**Penyebab**: API endpoint salah atau backend tidak running

**Solusi**:
1. Pastikan backend sudah running (php -S localhost:8000)
2. Check URL API di `frontend/src/services/api.js`
3. Check network tab di browser DevTools (F12)

### File tidak bisa di-upload

**Penyebab**: Folder logs atau temp tidak writable

**Solusi**:
```bash
# Linux/Mac
chmod -R 755 backend/logs

# Windows: Right-click folder → Properties → Security → Edit → Give Full Control
```

### PHP Error: "Class 'PDO' not found"

**Penyebab**: Extension PDO tidak enable

**Solusi**:
1. Edit file `php.ini`
2. Uncomment baris: `;extension=pdo_pgsql`
3. Restart PHP/Web Server

---

## 📞 Struktur API

Semua endpoint API ada di `backend/api/`:

| File | Endpoints |
|------|-----------|
| `auth.php` | Login, Setup, Logout |
| `clients.php` | CRUD Clients |
| `projects.php` | CRUD Projects |
| `expenses.php` | CRUD Expenses |
| `payments.php` | CRUD Payments |
| `communications.php` | CRUD Communications |
| `services.php` | CRUD Services |
| `files.php` | Upload, Download Files |
| `submissions.php` | Form Submissions |
| `reports.php` | Dashboard Stats, Reports |

Base URL: `http://localhost:8000/backend/api/`

Dokumentasi lengkap API ada di `docs/API-DOCUMENTATION.md`

---

## 📦 Struktur Folder Project

```
ClientManagement/
├── backend/                    # PHP REST API
│   ├── api/                   # Endpoint API
│   │   ├── auth.php
│   │   ├── clients.php
│   │   ├── projects.php
│   │   ├── expenses.php
│   │   ├── payments.php
│   │   ├── communications.php
│   │   ├── services.php
│   │   ├── submissions.php
│   │   ├── files.php
│   │   ├── reports.php
│   │   └── index.php (router)
│   ├── config/
│   │   ├── .env.php          # Konfigurasi (RAHASIA)
│   │   ├── database.php       # Database connection class
│   │   └── constants.php
│   ├── middleware/
│   │   └── auth.php           # Authentication & password hashing
│   ├── utils/
│   │   ├── response.php       # Response formatter
│   │   ├── validator.php      # Input validation
│   │   ├── logger.php         # Request logging
│   │   └── duplicateDetector.php
│   ├── setup/
│   │   ├── database-schema.sql  # Database schema
│   │   └── seed-data.sql        # Sample data
│   ├── logs/                    # Request logs
│   └── index.php               # Main entry point
│
├── frontend/                   # Vue.js 3 Frontend
│   ├── src/
│   │   ├── components/        # Vue components
│   │   │   ├── Auth/
│   │   │   ├── Budget/
│   │   │   ├── Clients/
│   │   │   ├── Communications/
│   │   │   ├── Common/
│   │   │   ├── Dashboard/
│   │   │   ├── Files/
│   │   │   ├── Layout/
│   │   │   ├── Projects/
│   │   │   ├── Reports/
│   │   │   ├── Services/
│   │   │   └── Submissions/
│   │   ├── views/              # Page views
│   │   ├── router/             # Vue Router config
│   │   ├── services/           # API service
│   │   ├── stores/             # Pinia stores
│   │   ├── App.vue
│   │   ├── main.js
│   │   └── style.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── docs/
│   ├── SETUP-LENGKAP.md        # File ini
│   ├── SETUP-GUIDE.md          # Setup singkat
│   ├── API-DOCUMENTATION.md    # API reference
│   └── DEPLOYMENT-GUIDE.md     # Deployment guide
│
├── testing/
│   └── postman-collection.json # API testing
│
└── README.md                   # Project overview
```

---

## ✅ Checklist Setup

Pastikan Anda sudah menyelesaikan:

- [ ] Install PHP 8.0+, Node.js 18+, npm
- [ ] Buat Supabase project
- [ ] Ambil database credentials
- [ ] Run database schema SQL
- [ ] (Opsional) Run seed data SQL
- [ ] Edit `backend/config/.env.php` dengan credentials
- [ ] Verifikasi koneksi database
- [ ] Run `npm install` di folder frontend
- [ ] Update API endpoint di frontend (jika perlu)
- [ ] Start backend server
- [ ] Start frontend dev server
- [ ] Akses aplikasi di browser
- [ ] Lakukan setup admin awal
- [ ] Login dengan akun admin
- [ ] Ubah default password admin
- [ ] Setup CORS dengan domain yang tepat

---

## 📚 Dokumentasi Tambahan

- **API Documentation**: `docs/API-DOCUMENTATION.md`
- **Deployment Guide**: `docs/DEPLOYMENT-GUIDE.md`
- **README Project**: `README.md`

---

**Last Updated**: 5 Januari 2026
**Version**: 1.0.0

