# SOP Alur Kerja & Template ClientHub MCP

Gunakan alur standar di bawah ini agar setiap pencatatan melalui `clienthub` MCP konsisten, aman, dan memaksimalkan seluruh fitur dashboard maupun Portal Klien.

---

## SOP 1: Onboarding Klien Baru + Proyek + Milestone Awal

1. **Cek duplikasi klien terlebih dahulu:**
   ```json
   { "search": "Ribka" }
   ```
   *(Tool: `clienthub_list_clients`)*

2. **Jika klien belum ada, buat dengan data lengkap:**
   ```json
   {
     "name": "Ribka Padang",
     "email": "ribka@salut-toraja.ac.id",
     "phone": "081244556677",
     "company": "SALUT Tana Toraja",
     "address": "Makale, Tana Toraja, Sulawesi Selatan",
     "notes": "Komunikasi utama via WhatsApp. Membutuhkan laporan progres mingguan lewat Portal Klien."
   }
   ```
   *(Tool: `clienthub_create_client` → catat `id` klien hasil respons)*

3. **Cek apakah proyek sejenis sudah ada (`clienthub_list_projects`), lalu buat proyek lengkap:**
   ```json
   {
     "client_id": 2,
     "service_id": 1,
     "title": "Sistem Informasi & Dashboard Mahasiswa SALUT Tana Toraja",
     "description": "Pengembangan modul pendaftaran mahasiswa, verifikasi kelulusan, dashboard profil diri, cek kurikulum dinamis, dan cek nilai mahasiswa.",
     "status": "In Progress",
     "start_date": "2026-11-01",
     "end_date": "2026-11-30",
     "total_budget": 5000000
   }
   ```
   *(Tool: `clienthub_create_project` → catat `id` proyek hasil respons)*

4. **Pecah kontrak menjadi 3–6 milestone nyata di Kanban (`clienthub_create_task`):**
   ```json
   {
     "project_id": 3,
     "title": "Setup Schema Database & Autentikasi Mahasiswa",
     "description": "Migrasi tabel mahasiswa, kurikulum, dan endpoint login/session.",
     "status": "Todo",
     "priority": "High",
     "due_date": "2026-11-07"
   }
   ```

5. **Ambil link Portal Klien untuk dibagikan ke user/klien (`clienthub_get_portal_link`):**
   ```json
   { "project_id": 3 }
   ```
   *(Link portal dapat dibuka di `https://client.stevenarif.my.id/portal.html?token=<portal_token>` atau sesuai `baseUrl` server.)*

---

## SOP 2: Siklus Eksekusi Coding Harian (AI Coding Workflow)

Jalankan siklus ini setiap kali Anda mengerjakan tugas coding pada proyek yang terdaftar di ClientHub:

1. **Identifikasi proyek & daftar task aktif:**
   - Panggil `clienthub_list_projects({ status: "In Progress" })`
   - Panggil `clienthub_list_tasks({ project_id: 3 })`

2. **Mulai bekerja (pindahkan task ke `In Progress`):**
   - Jika task sudah ada:
     ```json
     {
       "task_id": 14,
       "status": "In Progress",
       "priority": "High"
     }
     ```
   - Jika pekerjaan merupakan kebutuhan baru yang belum ada di board, buat dulu dengan `clienthub_create_task` (`status: "In Progress"`).

3. **Selesai coding & sebelum review manual user (opsional tahap `Review`):**
   - Jika butuh UAT/pengecekan user: set `status: "Review"` lewat `clienthub_update_task`.
   - Jika sudah terverifikasi lulus tes: set `status: "Completed"` lewat `clienthub_update_task`.

4. **Tulis Work Log Terstruktur via `clienthub_log_work_update`:**
   ```json
   {
     "project_id": 3,
     "channel": "note",
     "direction": "outgoing",
     "subject": "Implementasi Fitur Cek Kurikulum & Nilai Mahasiswa",
     "notes": "Ringkasan:\nMenyelesaikan endpoint dan antarmuka Dashboard Mahasiswa untuk melihat kurikulum serta riwayat nilai.\n\nPerubahan Teknis:\n- api/kurikulum.php & api/nilai.php: endpoint query kurikulum per semester\n- js/pages/dashboard-mahasiswa.js: tabel nilai responsif + filter semester\n\nVerifikasi:\n- Syntax check & uji endpoint lokal/live mengembalikan HTTP 200 tanpa error.\n\nTindak Lanjut:\nSiap ditinjau oleh PIC SALUT Tana Toraja melalui Portal Klien."
   }
   ```

5. **Verifikasi kondisi akhir:**
   - Panggil `clienthub_list_tasks({ project_id: 3 })` atau `clienthub_get_project({ project_id: 3 })` untuk memastikan persentase `task_progress` naik sesuai harapan.

---

## SOP 3: Pencatatan Keuangan & Rekonsiliasi Anggaran

### A. Pembayaran Masuk (DP / Termin / Pelunasan)
```json
{
  "project_id": 3,
  "amount": 2500000,
  "payment_date": "2026-11-25",
  "payment_method": "Bank Transfer",
  "status": "Received",
  "notes": "DP 50% Tahap Awal sesuai kesepakatan kontrak (Transfer Bank BCA)."
}
```
*(Tool: `clienthub_record_payment` — untuk menagih/mencatat invoice yang belum dibayar, gunakan `"status": "Pending"`, lalu ubah via Web UI ketika dana cair.)*

### B. Pengeluaran Proyek
```json
{
  "project_id": 3,
  "amount": 450000,
  "category": "Hosting",
  "description": "Sewa Cloud Hosting & SSL Domain Proyek 1 Tahun",
  "expense_date": "2026-11-25"
}
```
*(Tool: `clienthub_record_expense` — **wajib** isi `description` <= 255 karakter & `expense_date`.)*

### C. Rekonsiliasi Cepat
Panggil `clienthub_get_project({ project_id: 3 })` dan periksa:
- `total_budget`, `total_received`, `pending_payments`
- `total_expenses`, `remaining_budget`, `budget_utilization`
- Daftar `recent_payments` & `recent_expenses` agar tidak terjadi input ganda.

---

## SOP 4: Pencatatan Komunikasi Klien (`whatsapp` / `email`)

Gunakan `clienthub_log_work_update` saat klien mengirim feedback atau saat Anda mengirim laporan lewat WhatsApp/Email agar riwayat komunikasi terpusat di tab **Communications** proyek:

- **Feedback / Revisi dari Klien (`incoming`):**
  ```json
  {
    "project_id": 3,
    "channel": "whatsapp",
    "direction": "incoming",
    "subject": "Permintaan Revisi Label Status Mahasiswa",
    "notes": "Klien meminta label status kelulusan diubah menjadi 'Lulus Administrasi' dan menambah kolom NIM di ekspor tabel."
  }
  ```
- **Pengiriman Update Portal ke Klien (`outgoing`):**
  ```json
  {
    "project_id": 3,
    "channel": "whatsapp",
    "direction": "outgoing",
    "subject": "Pengiriman Link Live Progress Portal & Update Mingguan",
    "notes": "Mengirimkan link Portal Klien beserta ringkasan penyelesaian modul Dashboard & Kurikulum."
  }
  ```

---

## SOP 5: Penutupan Proyek (`Completed`)

Sebelum memindahkan status proyek ke `Completed` melalui `clienthub_update_project`:
1. Panggil `clienthub_list_tasks({ project_id })` — pastikan semua task selesai (`Completed`) atau task yang batal sudah dibersihkan/diperjelas.
2. Panggil `clienthub_get_project({ project_id })` — cek apakah seluruh pembayaran (`total_received`) & pengeluaran (`total_expenses`) sudah tercatat lengkap.
3. Panggil `clienthub_update_project({ project_id, status: "Completed", end_date: "YYYY-MM-DD" })`.
4. Catat final handover log lewat `clienthub_log_work_update` (`subject: "Handover & Penutupan Proyek"`).

---

## Matriks Cakupan MCP v1.0 vs REST API Lengkap ClientHub

`mcpclienthub` v1.0 sudah mencakup siklus inti (Klien dasar, Proyek, Task Kanban, Work Log/Comms, Pembayaran, Pengeluaran, Portal Link). Namun fitur berikut **tersedia di aplikasi web / REST API ClientHub (`index.php`), dan BELUM memiliki tool MCP v1.0**:

| Fitur / Entitas | Operasi Belum Ada di MCP v1.0 | Endpoint REST API / Lokasi Web UI | Cara Menangani Saat Diminta User |
|---|---|---|---|
| **Klien** | Edit / hapus data klien | `PUT/DELETE /clients/:id` (`#/clients/:id`) | Arahkan ke halaman `#/clients/:id` atau pakai HTTP API langsung jika diizinkan |
| **Proyek** | Hapus proyek, ganti `service_id`, toggle `portal_enabled`, regenerasi `portal_token` | `PUT /projects/:id` (`service_id`, `portal_enabled`), `DELETE /projects/:id`, `POST /projects/:id/regenerate-portal-token` | Informasikan batasan MCP v1.0; edit di `#/projects/:id` atau upgrade `mcpclienthub` |
| **Keuangan** | Edit / hapus pembayaran & pengeluaran, input kolom `notes` pada expense | `PUT/DELETE /payments/:id`, `PUT/DELETE /expenses/:id`, kolom `notes` di `POST /projects/:id/expenses` | Edit/hapus melalui tab `Payments` atau `Expenses` di `#/projects/:id` |
| **Komunikasi** | Hapus log komunikasi, baca log per klien secara terpisah | `DELETE /communications/:id`, `GET /clients/:id/communications` | Kelola lewat tab `Communications` di UI |
| **Layanan (`Services`)** | List, tambah, edit, toggle aktif, hapus layanan | `GET/POST /services`, `PUT/DELETE /services/:id` (`#/services`) | Gunakan catalog di `#/services` (MCP memakai `service_id` 1..7) |
| **Inquiries / Leads** | Lihat form masuk, deteksi duplikat, konversi jadi klien | `GET/PUT/DELETE /submissions`, `POST /submissions/:id/convert` (`#/submissions`) | Proses konversi lead di `#/submissions`, lalu lanjut kelola proyek via MCP |
| **Lampiran File** | Upload, list, dan hapus dokumen/gambar proyek atau klien | `GET /projects/:id/files`, `POST /files/upload`, `DELETE /files/:id` | Upload lewat tab `Files` di `#/projects/:id` atau `#/clients/:id` |
| **Laporan & Backup** | Statistik dashboard global, laporan keuangan periodik, export CSV, backup DB | `GET /reports/dashboard`, `GET /reports/financial`, `GET /reports/export/*`, `GET /reports/backup-db` | Buka `#/` Overview atau `#/reports` |
| **Kanban Global & Reorder** | Ambil board lintas proyek & ubah `order_index` | `GET /tasks/board`, `POST /projects/:id/tasks/reorder` | Gunakan `#/tasks` untuk board lintas proyek |

> **Prinsip Jujur**: Jangan pernah mengarang nama tool `clienthub_*` yang tidak ada di daftar 16 tool di `SKILL.md`. Selalu sampaikan dengan jelas mana yang dilakukan via MCP dan mana yang perlu lewat Web UI atau upgrade MCP Server.
