# 🤖 ClientHub Model Context Protocol (MCP) Server

**ClientHub MCP Server (`mcpclienthub`)** memungkinkan AI Agent (Google Antigravity, Claude, Cursor, ChatGPT) berinteraksi langsung dengan **ClientHub** — mengelola klien, proyek, papan Kanban 4-tahap, work log/komunikasi, pembayaran, pengeluaran, dan portal klien.

---

## 🛠️ Daftar 16 Tools MCP yang Tersedia

### 1. 📡 Diagnostik & Koneksi
- `clienthub_test_connection`: Menguji koneksi ke API ClientHub dan memvalidasi autentikasi (`X-API-Key` atau Session Token).

### 2. 📁 Manajemen Proyek
- `clienthub_list_projects`: Melihat daftar proyek (filter status: `Pending`, `In Progress`, `Completed`, `On Hold`, `Cancelled`, atau pencarian kata kunci).
- `clienthub_get_project`: Mengambil detail lengkap proyek, klien, anggaran, total pembayaran/pengeluaran, dan statistik.
- `clienthub_create_project`: Membuat proyek baru untuk klien tertentu.
- `clienthub_update_project`: Memperbarui judul, deskripsi, status, tanggal, atau total anggaran proyek secara parsial maupun penuh.

### 3. 🔨 Tugas & Milestone (Kanban Board)
- `clienthub_list_tasks`: Mengambil seluruh tugas/milestone proyek beserta status (`Todo`, `In Progress`, `Review`, `Completed`) dan persentase progres.
- `clienthub_create_task`: Membuat tugas/milestone baru di papan Kanban proyek.
- `clienthub_update_task`: Memindahkan status tugas antar kolom Kanban atau mengubah detail, prioritas, dan deadline.
- `clienthub_toggle_task`: Centang 1-klik status tugas (`Completed` ↔ `Todo`).
- `clienthub_delete_task`: Menghapus tugas dari proyek.

### 4. 💬 Log Progres Pekerjaan (*Work Log*)
- `clienthub_log_work_update`: Menulis catatan pembaruan pekerjaan atau log komunikasi klien (`note`, `email`, `whatsapp`) pada suatu proyek.

### 5. 👥 Manajemen Klien
- `clienthub_list_clients`: Mencari & melihat daftar klien terdaftar beserta total nilai kontrak.
- `clienthub_create_client`: Menambahkan data klien baru lengkap dengan kontak, perusahaan, alamat, dan catatan.

### 6. 🌐 Portal Klien Publik
- `clienthub_get_portal_link`: Mengambil URL Portal Klien live (`portal.html?token=...`) yang siap dibagikan ke klien.

### 7. 💰 Keuangan Proyek
- `clienthub_record_payment`: Mencatat pembayaran uang masuk (`Bank Transfer`, `Cash`, `E-Wallet`, `Credit Card`, `Other`).
- `clienthub_record_expense`: Mencatat biaya pengeluaran operasional proyek (`Hosting`, `Software`, `Materials`, `Labor`, `Transportation`, `Other`).

---

## ⚙️ Konfigurasi Environment (`.env`)

Salin file `.env.example` menjadi `.env` (file `.env` otomatis diabaikan Git):

```env
CLIENTHUB_BASE_URL=https://client.stevenarif.my.id
CLIENTHUB_API_KEY=your_clienthub_api_key_here
CLIENTHUB_USERNAME=admin
CLIENTHUB_PASSWORD=your_admin_password_here
```

Atau daftarkan di `mcp_config.json` klien AI Anda:

```json
{
  "mcpServers": {
    "clienthub": {
      "command": "node",
      "args": ["/path/to/ClientManagement/mcp-server/dist/server.js"],
      "env": {
        "CLIENTHUB_BASE_URL": "https://client.stevenarif.my.id",
        "CLIENTHUB_API_KEY": "your_clienthub_api_key_here"
      }
    }
  }
}
```

---

## 🧠 Bundled AI Agent Skill (`clienthub-agent`)

Playbook resmi agar AI Agent memasukkan dan mengedit data secara rapi dengan 100% kapabilitas aplikasi tersedia di:
- [skills/clienthub-agent/SKILL.md](skills/clienthub-agent/SKILL.md)
- [skills/clienthub-agent/references/entity-field-standards.md](skills/clienthub-agent/references/entity-field-standards.md)
- [skills/clienthub-agent/references/workflows-and-templates.md](skills/clienthub-agent/references/workflows-and-templates.md)

---

## 🚀 Cara Build & Menjalankan

```bash
cd mcp-server

# Install dependencies
npm install

# Build TypeScript ke dist/
npm run build

# (Opsional) Export skema JSON tool ke folder MCP lokal
node export-schemas.js

# Jalankan MCP Server (Stdio)
npm start
```
