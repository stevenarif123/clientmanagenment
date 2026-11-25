---
name: clienthub-agent
description: Standar operasional penggunaan ClientHub MCP (`mcpclienthub` / `mcpclientmanager`) agar seluruh input dan pembaruan data klien, proyek, papan Kanban 4-tahap, work log/komunikasi, pembayaran, pengeluaran, dan portal klien dilakukan secara rapi, bebas duplikasi, valid, dan memanfaatkan 100% kapabilitas aplikasi ClientHub.
---

# ClientHub MCP Master Playbook (`mcpclienthub`)

Skill ini mengatur cara AI Agent memakai server MCP `clienthub` (`mcpclienthub` v1.0) secara **disiplin, rapi, dan memanfaatkan 100% field serta kapabilitas aplikasi ClientHub**.

> **Panduan Detail (Progressive Disclosure)**
> - **Standar Field, Enum, Validasi & Anti-Slop Input**: baca [references/entity-field-standards.md](references/entity-field-standards.md) sebelum menginput atau mengedit entitas apa pun.
> - **SOP Alur Kerja, Template Work Log & Matriks Cakupan MCP vs API**: baca [references/workflows-and-templates.md](references/workflows-and-templates.md) saat menjalankan onboarding, coding sprint, pencatatan keuangan, atau penutupan proyek.

---

## 8 Aturan Wajib (100% Kapabilitas & Kerapian Data)

1. **Read-Before-Write & Anti-Duplikasi**
   - Wajib panggil `clienthub_list_clients` (dengan `search`) sebelum memanggil `clienthub_create_client`.
   - Wajib panggil `clienthub_list_projects` (dan `clienthub_get_project` saat akan mengedit) sebelum memanggil `clienthub_create_project` atau `clienthub_update_project`.
   - Wajib panggil `clienthub_list_tasks` sebelum membuat atau memindahkan status tugas agar tidak membuat task ganda dan urutan prioritas terbaca utuh.

2. **Full-Field Completeness (Dilarang Input Setengah Jadi)**
   - Isi **semua parameter relevan yang tersedia** sesuai konteks user—bukan hanya `title` atau `name` saja.
   - Contoh: saat membuat klien, lengkapi `email`, `phone`, `company`, `address`, dan `notes` bila informasinya tersedia. Saat membuat proyek, lengkapi `service_id`, `description`, `total_budget`, `start_date`, `end_date`, dan `status`.

3. **Disiplin Enum, Tanggal, Mata Uang, & Teks Bersih**
   - **Tanggal**: wajib format ISO `YYYY-MM-DD` (misal `2026-11-25`). Jangan mengirim format lokal (`25/11/2026`) atau teks bebas.
   - **Nominal Uang**: kirim angka mentah IDR (`2500000`), jangan pernah format string (`"Rp 2.500.000"`, `"2.5jt"`).
   - **Enum Case-Sensitive**: wajib persis sesuai konstanta backend (`In Progress`, `Bank Transfer`, `Received`, `Hosting`, dll.—lihat daftar lengkap di [references/entity-field-standards.md](references/entity-field-standards.md)).
   - **Teks Polos Bersih**: tulis karakter normal (`&`, `"`, `'`) tanpa HTML entity manual (`&amp;`). `Validator::sanitize` hanya membersihkan whitespace & null-byte tanpa meng-escape ulang.

4. **Siklus Kanban 4-Tahap (`Todo → In Progress → Review → Completed`)**
   - Gunakan `clienthub_update_task` dengan `status` eksplisit (`Todo`, `In Progress`, `Review`, `Completed`), `priority` (`Low`, `Medium`, `High`), `description`, dan `due_date`.
   - Pakai `clienthub_toggle_task` **hanya** untuk flip cepat 1-klik (`Todo ↔ Completed`), bukan saat memindahkan ke `In Progress` atau `Review`.
   - Jangan meninggalkan tugas dalam status `Todo` saat sebenarnya sudah dikerjakan atau selesai.

5. **Work Log Terstruktur Wajib di `clienthub_log_work_update`**
   - Setiap selesai mengerjakan fitur, bugfix, atau milestone, wajib tulis catatan melalui `clienthub_log_work_update` berisi 4 bagian jelas: **Ringkasan**, **Perubahan Teknis (file/endpoint)**, **Verifikasi (hasil tes)**, dan **Tindak Lanjut**.
   - Pilih `channel` secara akurat: `note` untuk catatan teknis internal/progres coding, `whatsapp` atau `email` untuk ringkasan komunikasi dengan klien beserta `direction` (`outgoing` / `incoming`).

6. **Jaga Validasi API pada Keuangan (`record_expense` & `record_payment`)**
   - **Trap `clienthub_record_expense`**: backend `api/expenses.php` **mewajibkan** `description` (tidak kosong, maks. 255 karakter) dan `expense_date` (`YYYY-MM-DD`), serta `amount > 0`. Selalu isi kedua field tersebut walaupun schema MCP menandainya opsional.
   - **Trap `clienthub_record_payment`**: view `v_project_budget_summary` hanya menghitung pembayaran berstatus `Received` ke `total_received`. Pastikan `status: "Received"` diisi ketika dana benar-benar sudah diterima, atau `Pending` untuk tagihan/janji bayar, lengkap dengan `payment_method`, `payment_date`, dan `notes` (misal `"Termin 1 - DP 50%"`).

7. **Verifikasi Pasca-Tulis (`clienthub_get_project`)**
   - Setelah perubahan besar pada proyek, tugas, pembayaran, atau pengeluaran, panggil `clienthub_get_project` atau `clienthub_list_tasks` untuk memverifikasi `task_progress`, `total_received`, `total_expenses`, dan `remaining_budget` sesuai.
   - Saat membagikan akses klien lewat `clienthub_get_portal_link`, pastikan `portal_enabled` bernilai `true` dan periksa URL live-nya (`https://client.stevenarif.my.id/portal.html?token=...` atau sesuai `baseUrl`).

8. **Keamanan Kredensial (Zero Secret Leakage)**
   - Jangan pernah menuliskan, menyalin, atau mencetak API key, token sesi, atau password di file skill, catatan proyek, work log, maupun balasan ke user. Semua kredensial dikelola melalui `mcp_config.json`.

---

## Matriks Lengkap 16 Tool `clienthub` MCP

| Domain | Tool | Parameter | Catatan Pemakaian |
|---|---|---|---|
| **Koneksi** | `clienthub_test_connection` | `baseUrl?` | Cek koneksi awal & status setup server |
| **Proyek** | `clienthub_list_projects` | `status?`, `search?`, `page?`, `per_page?` | Selalu cek sebelum membuat proyek baru |
| | `clienthub_get_project` | **`project_id`** | Cek detail lengkap, klien, budget & aktivitas |
| | `clienthub_create_project` | **`client_id`**, **`title`**, `service_id?`, `description?`, `total_budget?`, `start_date?`, `end_date?`, `status?` | Isi seluruh metadata & jadwal yang tersedia |
| | `clienthub_update_project` | **`project_id`**, `title?`, `description?`, `status?`, `total_budget?`, `start_date?`, `end_date?` | Mendukung update parsial tanpa menimpa field lain |
| **Kanban & Task** | `clienthub_list_tasks` | **`project_id`** | Ambil semua tugas + statistik progres |
| | `clienthub_create_task` | **`project_id`**, **`title`**, `description?`, `status?`, `priority?`, `due_date?` | Gunakan deskripsi terukur & target deadline |
| | `clienthub_update_task` | **`task_id`**, `status?`, `title?`, `description?`, `priority?`, `due_date?` | Transisi `Todo / In Progress / Review / Completed` |
| | `clienthub_toggle_task` | **`task_id`** | Toggle cepat `Completed ↔ Todo` |
| | `clienthub_delete_task` | **`task_id`** | Hapus hanya jika duplikat atau atas izin user |
| **Work Log** | `clienthub_log_work_update` | **`project_id`**, **`subject`**, **`notes`**, `channel?`, `direction?` | Wajib setelah implementasi / komunikasi klien |
| **Klien** | `clienthub_list_clients` | `search?` | Anti-duplikasi klien berdasarkan nama/email/HP |
| | `clienthub_create_client` | **`name`**, `email?`, `phone?`, `company?`, `address?`, `notes?` | Lengkapi kontak & konteks bisnis klien |
| **Portal** | `clienthub_get_portal_link` | **`project_id`** | Ambil `portal_url` & status `portal_enabled` |
| **Keuangan** | `clienthub_record_payment` | **`project_id`**, **`amount`**, `payment_date?`, `payment_method?`, `status?`, `notes?` | Catat DP, termin, pelunasan, atau refund |
| | `clienthub_record_expense` | **`project_id`**, **`amount`**, **`category`**, `description?`, `expense_date?` | **Wajib sertakan** `description` & `expense_date` |

> *Jika user meminta operasi di luar 16 tool di atas (misalnya edit profil klien, kelola katalog layanan, proses contact submission, upload file lampiran, edit/hapus pembayaran/pengeluaran, atau ekspor laporan CSV), cek bagian **Matriks Cakupan MCP v1.0 vs REST API** di [references/workflows-and-templates.md](references/workflows-and-templates.md) agar agent mengarahkan user secara jujur dan akurat.*

---

## Pre-Completion Gate (Sebelum Menjawab User)

- [ ] Sudah cek record eksisting sebelum `create_*` (nol duplikat klien/proyek/tugas).
- [ ] Semua field opsional yang datanya tersedia sudah diisi lengkap sesuai format (`YYYY-MM-DD`, angka IDR mentah, enum valid).
- [ ] Status task Kanban mutakhir (`In Progress` / `Review` / `Completed`).
- [ ] Work log terstruktur sudah dicatat via `clienthub_log_work_update` bila ada pengerjaan teknis atau update klien.
- [ ] Hasil perubahan diverifikasi lewat `clienthub_get_project` / `clienthub_list_tasks`.
