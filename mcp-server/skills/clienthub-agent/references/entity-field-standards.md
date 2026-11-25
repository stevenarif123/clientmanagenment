# Standar Field, Enum, & Validasi Entitas ClientHub

Dokumen ini memetakan **setiap kolom database SQLite (`setup/database-schema-sqlite.sql`)**, aturan validasi backend (`api/*.php`, `config/constants.php`), dan parameter MCP (`mcpclienthub/src/tools.ts`) agar 100% data yang masuk melalui MCP rapi, valid, dan konsisten dengan Web UI ClientHub.

---

## 1. Klien (`clients` → `clienthub_list_clients` / `clienthub_create_client`)

| Kolom DB / Parameter MCP | Wajib? | Tipe & Aturan Validasi Backend | Standar Pengisian 100% |
|---|---|---|---|
| `name` | **Wajib** | String, maks. 255 karakter | Nama lengkap individu atau PIC utama yang jelas |
| `email` | Disarankan | Format email valid (`FILTER_VALIDATE_EMAIL`) | Gunakan email aktif utama klien (berguna untuk deteksi duplikat lead) |
| `phone` | Disarankan | String telepon (`Validator::phone`) | Format konsisten, misal `081234567890` atau `+6281234567890` |
| `company` | Disarankan | String, maks. 255 karakter | Nama usaha, kampus, instansi, atau brand klien |
| `address` | Disarankan | Text | Alamat kota/kantor klien bila diketahui |
| `notes` | Disarankan | Text | Preferensi komunikasi, konteks kerja sama, atau jam kontak klien |

### Perbandingan Input Klien
- **Buruk (Minimalis):**
  ```json
  { "name": "Budi" }
  ```
- **Ideal (100% Kapabilitas):**
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@nusantara-retail.id",
    "phone": "081234567890",
    "company": "PT Nusantara Retail",
    "address": "Jl. Ahmad Yani No. 45, Makassar",
    "notes": "PIC utama bagian IT; responsif via WhatsApp pada jam kerja 09:00-17:00 WITA."
  }
  ```

---

## 2. Proyek (`projects` → `clienthub_list_projects` / `clienthub_get_project` / `clienthub_create_project` / `clienthub_update_project`)

| Parameter MCP | Wajib (Create) | Tipe & Aturan Validasi Backend | Standar Pengisian 100% |
|---|---|---|---|
| `client_id` | **Wajib** | Integer valid di tabel `clients` | Ambil dari `clienthub_list_clients` |
| `service_id` | Disarankan (`1` default) | Integer valid di tabel `services` | Pilih ID sesuai kategori layanan (lihat tabel mapping di bawah) |
| `title` | **Wajib** | String, maks. 255 karakter | Judul proyek spesifik & profesional (hindari `"Proyek 1"`) |
| `description` | Disarankan | Text | Ruang lingkup (scope), modul utama, dan deliverable yang disepakati |
| `status` | Disarankan | Enum exact: `Pending`, `In Progress`, `Completed`, `On Hold`, `Cancelled` | Set `Pending` untuk penawaran/persiapan; `In Progress` saat pengerjaan berjalan |
| `start_date` | Disarankan | Date `YYYY-MM-DD` | Tanggal kick-off proyek |
| `end_date` | Disarankan | Date `YYYY-MM-DD` | Target serah terima / deadline kontrak |
| `total_budget` | Disarankan | Numeric `>= 0` (mata uang server default `IDR`) | Nilai kontrak bersih dalam Rupiah tanpa titik/simbol, misal `5000000` |

### Referensi `service_id` Bawaan (`setup/database-schema-sqlite.sql`)
| ID | Nama Layanan | Cocok Untuk |
|---|---|---|
| `1` | `Web Development` | Website perusahaan, sistem informasi, dashboard web, REST API |
| `2` | `Mobile App Development` | Aplikasi Android / iOS / Flutter / React Native |
| `3` | `UI/UX Design` | Wireframe, desain Figma, audit & redesign antarmuka |
| `4` | `E-Commerce` | Toko online, katalog produk, checkout & payment gateway |
| `5` | `Website Maintenance` | Perawatan rutin, backup, perbaikan bug berkelanjutan |
| `6` | `SEO Services` | Optimasi SEO teknis, struktur konten, dan performa pencarian |
| `7` | `Other` | Jasa konsultasi atau kategori khusus lainnya |

> **Catatan Edit Parsial (`clienthub_update_project`)**: Backend (`api/projects.php`) menggabungkan field eksisting dari database sebelum validasi. Mengirim hanya field yang berubah (misal `{ "project_id": 3, "status": "Completed" }`) aman dan tidak akan mengosongkan `title`, `description`, atau `total_budget`. Untuk mengubah `title` atau `description`, pastikan tidak memakai HTML entity (`&amp;`).

---

## 3. Tugas & Kanban (`project_tasks` → `clienthub_list_tasks` / `clienthub_create_task` / `clienthub_update_task` / `clienthub_toggle_task` / `clienthub_delete_task`)

| Parameter MCP | Wajib (Create) | Tipe & Aturan Validasi | Standar Pengisian 100% |
|---|---|---|---|
| `project_id` | **Wajib** | Integer valid di tabel `projects` | ID proyek target |
| `title` | **Wajib** | String | Kata kerja + objek spesifik, misal `"Integrasi API Checkout Midtrans"` |
| `description` | Disarankan | Text | Kriteria selesai (*acceptance criteria*), file target, atau detail teknis |
| `status` | Disarankan | Enum exact: `Todo`, `In Progress`, `Review`, `Completed` | Ikuti 4 kolom Kanban secara konsisten |
| `priority` | Disarankan | Enum exact: `Low`, `Medium`, `High` | `High` untuk blocker/deadline dekat; `Medium` untuk fitur utama; `Low` untuk polish |
| `due_date` | Disarankan | Date `YYYY-MM-DD` | Target selesai milestone (dipakai UI untuk penanda `Overdue`) |

### Aturan Status & Timestamp Otomatis (`api/tasks.php`)
- Saat `status` diubah menjadi `Completed` lewat `clienthub_update_task` atau `clienthub_toggle_task`, server otomatis mengisi `completed_at`.
- Saat `status` dikembalikan dari `Completed` ke `Todo`, `In Progress`, atau `Review`, server otomatis mengosongkan `completed_at`.
- Gunakan `clienthub_create_task` per milestone/deliverable yang jelas agar persentase progres di **Dashboard Overview** & **Client Portal** (`completed / total`) akurat.

---

## 4. Work Log & Komunikasi (`communications` → `clienthub_log_work_update`)

| Parameter MCP | Wajib? | Tipe & Nilai Valid | Standar Pengisian 100% |
|---|---|---|---|
| `project_id` | **Wajib** | Integer valid di `projects` | Server otomatis mengaitkan `client_id` pemilik proyek |
| `subject` | **Wajib** | String, maks. 255 karakter | Judul ringkas & deskriptif (misal `"[Release v1.2] Redesign Kanban & Dark Mode"`) |
| `notes` | **Wajib** | Text (dipetakan ke kolom `content`) | Uraian terstruktur: Ringkasan, Perubahan Teknis, Hasil Verifikasi, Tindak Lanjut |
| `channel` | Disarankan (`note` default) | Enum exact: `note`, `email`, `whatsapp` | `note`: catatan teknis internal / log coding AI; `email`/`whatsapp`: log komunikasi klien |
| `direction` | Disarankan (`outgoing` default) | Enum exact: `outgoing`, `incoming` | `outgoing`: update dari kita ke klien/proyek; `incoming`: permintaan/revisi dari klien |

---

## 5. Pembayaran Masuk (`project_payments` → `clienthub_record_payment`)

| Parameter MCP | Wajib? | Tipe & Nilai Valid | Standar Pengisian 100% |
|---|---|---|---|
| `project_id` | **Wajib** | Integer valid di `projects` | ID proyek terkait |
| `amount` | **Wajib** | Numeric **> 0** | Angka mentah Rupiah (misal `1250000`) |
| `payment_date` | Disarankan | Date `YYYY-MM-DD` | Default hari ini di MCP jika kosong; isi tanggal transfer sebenarnya bila mencatat histori |
| `payment_method` | Disarankan | Enum exact: `Bank Transfer`, `Cash`, `E-Wallet`, `Credit Card`, `Other` | Pilih metode transaksi yang sebenarnya |
| `status` | Disarankan | Enum exact: `Received`, `Pending`, `Refunded` | Hanya `Received` yang dihitung sebagai `total_received` & mengurangi sisa tagihan portal |
| `notes` | **Sangat Disarankan** | Text | Sebutkan termin, bank/rekening, atau nomor referensi (misal `"Termin 1 (DP 50%) via BCA a.n. Steven"`) |

---

## 6. Pengeluaran Proyek (`project_expenses` → `clienthub_record_expense`)

| Parameter MCP | Wajib? | Tipe & Nilai Valid | Standar Pengisian 100% |
|---|---|---|---|
| `project_id` | **Wajib** | Integer valid di `projects` | ID proyek terkait |
| `amount` | **Wajib** | Numeric **> 0** | Angka mentah Rupiah (misal `350000`) |
| `category` | **Wajib** | Enum exact: `Hosting`, `Software`, `Materials`, `Labor`, `Transportation`, `Other` | Wajib cocok persis huruf besar-kecil |
| `description` | **WAJIB di Backend** | String tidak kosong, **maks. 255 karakter** | Jelaskan item & vendor (misal `"Perpanjangan Domain .my.id & VPS Hostinger 1 Tahun"`) |
| `expense_date` | **WAJIB di Backend** | Date `YYYY-MM-DD` | MCP memberi default hari ini jika kosong, tetapi selalu isi tanggal nota sebenarnya bila ada |

> **Perhatian Validasi Backend (`api/expenses.php`)**: Meskipun skema MCP hanya menandai `["project_id", "amount", "category"]` sebagai required, API PHP menolak `POST /projects/:id/expenses` dengan HTTP `422` jika `description` kosong atau lebih dari 255 karakter. **Selalu isi `description` secara ringkas dan jelas.**

---

## 7. Portal Klien (`clienthub_get_portal_link`)

| Parameter / Output | Detail |
|---|---|
| Input | `project_id` (wajib integer valid) |
| Output | `project_id`, `project_title`, `client_name`, `portal_enabled`, `portal_token`, `portal_url` |
| Yang Ditampilkan ke Klien | Detail proyek, progress checklist task (tanpa notes internal), ringkasan anggaran & sisa tagihan (`Received` payments), serta jadwal deadline |
