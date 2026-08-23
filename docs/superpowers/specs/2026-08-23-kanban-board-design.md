# Kanban Board — Design Specification

## Overview

Menambahkan fitur papan Kanban (Kanban Board) interaktif ala Trello ke dalam aplikasi ClientHub. Fitur ini memungkinkan admin mengelola tugas proyek secara visual dengan drag-and-drop antar kolom status, menampilkan progres pekerjaan secara real-time, dan menyediakan overview global lintas proyek.

---

## Keputusan Desain yang Telah Disetujui

| Aspek | Keputusan |
|---|---|
| Penempatan | Dua tempat: (1) Project-level di tab Tasks & Milestones, (2) Global preview di menu sidebar |
| Kolom Status | 4 kolom: To Do → In Progress → Review → Done |
| Detail Kartu | Lengkap: judul, deskripsi 2-baris, badge prioritas, deadline, ID, tanggal dibuat/selesai, nama proyek (global) |
| Portal Klien | Tetap list view checklist (tidak berubah) |
| Interaksi Kartu | Klik → expand inline di dalam kolom (anti-modal, sesuai pattern yang sudah ada) |
| Quick Add | Tombol "+ Add Task" di bawah setiap kolom, form inline tanpa modal |
| Drag & Drop Library | SortableJS v1.15.2 via CDN |
| Card Ordering | Fractional indexing (`order_index REAL`) — 1 DB update per drag |
| Mobile | Horizontal snap scroll antar kolom |

---

## 1. Komponen & Halaman

### 1.1 Project-Level Kanban Board (di dalam ProjectDetailView)

**Lokasi**: Tab "Tasks & Milestones" pada halaman detail proyek (`#/projects/:id`).

**Toggle View**: Tombol switcher di header tab:
```
[ ☰ List ]  [ ⊞ Board ]
```
- **List View**: Tampilan checklist yang sudah ada (tidak berubah).
- **Board View**: Tampilan Kanban 4 kolom.

**Fitur Board View**:
- 4 kolom horizontal: **To Do** (slate), **In Progress** (amber), **Review** (blue), **Done** (emerald).
- Setiap kolom menampilkan counter jumlah kartu.
- Kartu bisa di-drag dari satu kolom ke kolom lain → status dan `order_index` otomatis terupdate.
- Klik kartu → kartu mengembang (expand) menampilkan form edit inline (judul, deskripsi, prioritas, deadline, status). Tekan "Save" untuk menyimpan, "Cancel" untuk menutup.
- Tombol "+ Add Task" di footer setiap kolom → menampilkan form inline di dalam kolom untuk menambah tugas baru dengan status sesuai kolom tersebut.
- Progress bar tetap tampil di header proyek, otomatis terupdate saat kartu dipindahkan.

### 1.2 Global Task Board (Halaman Baru di Menu Utama)

**Route**: `#/tasks`  
**Menu Sidebar**: Ditambahkan item "Task Board" dengan ikon clipboard/kanban di antara "Projects" dan "Submissions".

**Sifat**: Preview overview — bukan tempat editing utama.

**Fitur**:
- Menampilkan tugas dari **semua proyek aktif** (status proyek bukan 'Completed' atau 'Cancelled').
- Filter dropdown per proyek (opsional, default: semua proyek).
- 4 kolom Kanban yang sama (To Do, In Progress, Review, Done).
- Setiap kartu menampilkan **nama proyek** sebagai label tambahan di atas judul tugas.
- Kartu **bisa di-drag** antar kolom (mengubah status tugas).
- Klik kartu → navigasi ke halaman detail proyek yang bersangkutan (`#/projects/:id`), tab tasks.
- Tidak menampilkan form edit inline — hanya preview dan drag untuk quick status update.

---

## 2. Data Model & Database

### 2.1 Perubahan pada `project_tasks`

**Kolom `order_index`**: Sudah ada di schema saat ini sebagai `INTEGER DEFAULT 0`. Perlu diubah menjadi `REAL DEFAULT 0` untuk mendukung fractional indexing.

> SQLite tidak mendukung `ALTER COLUMN`. Karena `order_index` sudah bertipe `INTEGER` dan SQLite secara internal menyimpan angka sebagai tipe dinamis, nilai `REAL` (float) sudah bisa disimpan tanpa migrasi kolom. Kita hanya perlu memastikan kode PHP dan JavaScript memperlakukannya sebagai float.

**Status values whitelist**: Diperluas dari `['Todo', 'In Progress', 'Completed']` menjadi `['Todo', 'In Progress', 'Review', 'Completed']`.

### 2.2 Fractional Indexing Algorithm

Saat kartu di-drop ke posisi baru di kolom target:

| Kondisi Drop | Perhitungan `order_index` Baru |
|---|---|
| Kolom kosong | `1000.0` |
| Di posisi paling atas (`index 0`) | `firstCard.order_index / 2.0` |
| Di posisi paling bawah | `lastCard.order_index + 1000.0` |
| Di antara dua kartu | `(prevCard.order_index + nextCard.order_index) / 2.0` |

**Precision guard**: Jika `|next - prev| < 0.001`, trigger rebalance → reset semua kartu di kolom ke `1000, 2000, 3000, ...`.

---

## 3. Backend API

### 3.1 Perubahan pada `api/tasks.php`

**`updateTask(int $id)`** — Sudah mendukung update `status` dan `order_index`. Perubahan yang diperlukan:
- Tambahkan `'Review'` ke whitelist status: `['Todo', 'In Progress', 'Review', 'Completed']`.
- Pastikan `order_index` disimpan sebagai float (cast `floatval()`).
- Saat status berubah ke `'Completed'` → set `completed_at`. Saat berubah dari `'Completed'` ke status lain → reset `completed_at = null`.

**`createProjectTask(int $projectId)`** — Perubahan:
- Tambahkan `'Review'` ke whitelist status.
- Hitung `order_index` default: `SELECT MAX(order_index) + 1000 FROM project_tasks WHERE project_id = ? AND status = ?` (append ke bawah kolom).

**`getProjectTasks(int $projectId)`** — Perubahan:
- Ubah ORDER BY untuk mengurutkan berdasarkan `order_index ASC` sebagai primary sort (bukan status-based CASE).
- Tambahkan counter untuk status `'Review'` di statistik.

### 3.2 Endpoint Baru: Batch Reorder (Rebalance)

**`POST /api/projects/{id}/tasks/reorder`**

Request body:
```json
{
  "tasks": [
    { "id": 1, "order_index": 1000 },
    { "id": 2, "order_index": 2000 },
    { "id": 3, "order_index": 3000 }
  ]
}
```

Dipanggil otomatis saat fractional precision habis. Melakukan batch update `order_index` untuk semua tugas yang dikirim.

### 3.3 Endpoint Baru: Global Tasks (untuk halaman Global Task Board)

**`GET /api/tasks/board`**

Response:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "project_id": 2,
        "project_title": "Website Redesign",
        "title": "Create wireframes",
        "description": "Low-fidelity wireframes for homepage",
        "status": "In Progress",
        "priority": "High",
        "due_date": "2026-09-01",
        "order_index": 1000.0,
        "completed_at": null,
        "created_at": "2026-08-21 10:00:00"
      }
    ],
    "projects": [
      { "id": 2, "title": "Website Redesign" },
      { "id": 5, "title": "Mobile App" }
    ],
    "stats": {
      "total": 24,
      "todo": 8,
      "in_progress": 6,
      "review": 4,
      "completed": 6
    }
  }
}
```

Query: Mengambil semua tugas dari proyek yang statusnya bukan `'Completed'` dan bukan `'Cancelled'`, dengan JOIN ke tabel `projects` untuk mendapatkan `project_title`. Mendukung query parameter `?project_id=2` untuk filter per proyek.

---

## 4. Frontend

### 4.1 Library Tambahan (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
```

Diload di `index.html` sebelum script komponen.

### 4.2 File Baru: `js/pages/kanban.js`

Mendaftarkan `window.KanbanBoardView` — komponen Vue 3 untuk halaman global Task Board.

**Fitur**:
- `mounted()`: Fetch `GET /api/tasks/board`, lalu inisialisasi SortableJS pada setiap kolom.
- Dropdown filter proyek di header.
- 4 kolom Kanban dengan kartu preview (judul, nama proyek, prioritas, deadline).
- Drag-drop antar kolom → panggil `API.tasks.update(id, { status, order_index })`.
- Klik kartu → `window.location.hash = '#/projects/' + task.project_id` (navigasi ke detail proyek).

### 4.3 Perubahan pada `js/pages/projects.js` (ProjectDetailView)

**Tambahan state**:
- `taskViewMode: 'list'` — toggle antara `'list'` dan `'board'`.

**Tambahan di template tab Tasks**:
- Tombol toggle `[ ☰ List | ⊞ Board ]` di header tab.
- `v-if="taskViewMode === 'list'"`: Render tampilan checklist yang sudah ada (tidak berubah).
- `v-else`: Render Kanban Board 4 kolom dengan:
  - SortableJS pada setiap kolom (group: `'project-kanban'`).
  - Kartu detail lengkap (judul, deskripsi 2-baris, prioritas, deadline, ID, tanggal).
  - Klik kartu → expand inline form edit.
  - Footer kolom → inline quick add form.

**Drag handler `onCardDropped(taskId, toStatus, newIndex)`**:
1. Snapshot state untuk rollback.
2. Hitung `order_index` baru (fractional).
3. Update state lokal secara optimistic.
4. Panggil `API.tasks.update(taskId, { status: toStatus, order_index: newOrder })`.
5. Jika gagal → rollback + toast error.
6. Jika status berubah ke/dari `'Completed'` → refresh statistik progress.

### 4.4 Perubahan pada `js/components/layout.js`

Tambah item navigasi baru di array `navigation`:
```javascript
{ name: 'Task Board', route: '#/tasks', icon: '...' }
```
Ditempatkan setelah "Projects" dan sebelum "Submissions".

### 4.5 Perubahan pada `index.html`

- Load `js/pages/kanban.js` setelah `projects.js`.
- Load SortableJS CDN di bagian head.
- Tambah route: `#/tasks` → `window.KanbanBoardView`.

### 4.6 Perubahan pada `assets/js/api.js`

Tambah method baru:
```javascript
API.tasks.board = (projectId) => api.get('/tasks/board' + (projectId ? '?project_id=' + projectId : ''));
API.projects.reorderTasks = (id, tasks) => api.post('/projects/' + id + '/tasks/reorder', { tasks });
```

### 4.7 Perubahan pada `assets/css/app.css`

Tambah CSS classes untuk drag-and-drop:
```css
.kanban-ghost { ... }    /* Placeholder dashed border */
.kanban-chosen { ... }   /* Grabbed card shadow + slight rotate */
.kanban-drag { ... }     /* Card in flight opacity */
```

---

## 5. Styling & Warna Kolom

| Kolom | Dot Color | Header Text | Card Count Badge |
|---|---|---|---|
| To Do | `bg-slate-400` | `text-slate-700` | `bg-slate-300 text-slate-700` |
| In Progress | `bg-amber-500` | `text-amber-800` | `bg-amber-100 text-amber-700` |
| Review | `bg-blue-500` | `text-blue-800` | `bg-blue-100 text-blue-700` |
| Done | `bg-emerald-500` | `text-emerald-800` | `bg-emerald-100 text-emerald-700` |

Kolom background: `bg-slate-100/80` dengan `border border-slate-200` dan `rounded-2xl`.

---

## 6. Mobile Responsiveness

- **≥ 640px (sm+)**: Kolom lebar `w-80`, horizontal scroll.
- **< 640px**: Kolom lebar `w-[85vw]`, horizontal snap scroll (`snap-x snap-mandatory`), setiap kolom `snap-center`.
- Kartu tetap bisa di-drag pada touchscreen (SortableJS sudah mendukung native touch).
- Tombol panah `◀ ▶` tidak diperlukan karena SortableJS menangani touch gesture secara native.

---

## 7. Optimistic UI & Error Handling

1. **Snapshot sebelum drag**: Clone array `tasks` sebelum operasi.
2. **Update lokal instant**: Pindahkan task ke kolom baru di memori, hitung `order_index`.
3. **API call async**: `PUT /api/tasks/:id` dengan `{ status, order_index }`.
4. **Gagal → rollback**: Kembalikan array `tasks` dari snapshot, tampilkan toast error, refresh SortableJS.
5. **Debounce**: Jika user drag beberapa kartu berturut-turut dalam < 150ms, debounce API call per task ID.

---

## 8. Hal yang TIDAK Berubah

- **Portal klien** (`portal.html`): Tetap list view checklist.
- **List view di tab Tasks**: Tetap ada, bisa dipilih via toggle.
- **Task API yang sudah ada**: `toggle`, `delete`, `create` tetap berfungsi.
- **Dashboard, Reports, dan halaman lain**: Tidak terpengaruh.
- **Database schema lainnya**: Tidak ada tabel baru, hanya penambahan status value dan perlakuan `order_index` sebagai float.

---

## 9. Routing Summary

| Route | Komponen | Deskripsi |
|---|---|---|
| `#/tasks` | `window.KanbanBoardView` | Global Task Board (preview lintas proyek) |
| `#/projects/:id` (tab Tasks, mode Board) | `window.ProjectDetailView` | Project-level Kanban Board (interaktif penuh) |

---

## 10. Verification Plan

### Automated Tests (test-suite.php)
- Verifikasi status `'Review'` bisa disimpan dan di-query.
- Verifikasi `order_index` float bisa disimpan (`1500.5`).
- Verifikasi endpoint `GET /api/tasks/board` mengembalikan data lintas proyek.
- Verifikasi endpoint `POST /api/projects/:id/tasks/reorder` batch update berhasil.

### Manual Verification
- Drag kartu dari To Do ke In Progress → status terupdate di database.
- Drag kartu ke Done → `completed_at` terisi otomatis.
- Drag kartu dari Done kembali ke Review → `completed_at` di-reset null.
- Progress bar di header proyek terupdate setelah drag.
- Quick add task di kolom Review → task dibuat dengan status `'Review'`.
- Toggle antara List ↔ Board view → data konsisten.
- Halaman Global Task Board menampilkan tugas dari semua proyek aktif.
- Filter per proyek di Global Board bekerja.
- Mobile: horizontal scroll dan touch drag berfungsi.
