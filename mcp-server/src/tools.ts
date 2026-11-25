import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const TOOLS: Tool[] = [
  // -------------------------------------------------------------
  // 1. Connection & Diagnostic Tools
  // -------------------------------------------------------------
  {
    name: 'clienthub_test_connection',
    description:
      'Menguji koneksi ke ClientHub REST API dan memvalidasi kredensial (API Key atau Login Token). Mengembalikan status server dan info admin.',
    inputSchema: {
      type: 'object',
      properties: {
        baseUrl: {
          type: 'string',
          description:
            'URL target ClientHub (opsional, default dari .env: https://stevenarif.my.id/client atau http://localhost:8000).',
        },
      },
    },
  },

  // -------------------------------------------------------------
  // 2. Project Management Tools
  // -------------------------------------------------------------
  {
    name: 'clienthub_list_projects',
    description:
      'Melihat daftar seluruh proyek di ClientHub. Dapat difilter berdasarkan status (Pending, In Progress, Completed, On Hold, Cancelled) atau pencarian kata kunci.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled', ''],
          description: 'Filter status proyek.',
        },
        search: {
          type: 'string',
          description: 'Kata kunci pencarian judul proyek atau nama klien.',
        },
        page: {
          type: 'number',
          description: 'Nomor halaman (default: 1).',
        },
        per_page: {
          type: 'number',
          description: 'Jumlah data per halaman (default: 20).',
        },
      },
    },
  },
  {
    name: 'clienthub_get_project',
    description:
      'Mengambil rincian lengkap suatu proyek berdasarkan ID proyek (termasuk klien, status, tanggal mulai/selesai, total anggaran, progres pengerjaan, dan token portal).',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID unik proyek (contoh: 2).',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'clienthub_create_project',
    description:
      'Membuat proyek baru untuk klien tertentu di ClientHub.',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: {
          type: 'number',
          description: 'ID klien pemilik proyek.',
        },
        service_id: {
          type: 'number',
          description: 'ID tipe layanan (opsional, default 1: Web Development).',
        },
        title: {
          type: 'string',
          description: 'Nama/judul proyek (contoh: "Pembuatan Website E-Commerce").',
        },
        description: {
          type: 'string',
          description: 'Deskripsi dan ruang lingkup pekerjaan proyek.',
        },
        total_budget: {
          type: 'number',
          description: 'Nilai total kontrak / anggaran proyek dalam Rupiah (contoh: 5000000).',
        },
        start_date: {
          type: 'string',
          description: 'Tanggal mulai proyek (format: YYYY-MM-DD).',
        },
        end_date: {
          type: 'string',
          description: 'Target tanggal selesai proyek (format: YYYY-MM-DD).',
        },
        status: {
          type: 'string',
          enum: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
          description: 'Status awal proyek (default: In Progress).',
        },
      },
      required: ['client_id', 'title'],
    },
  },
  {
    name: 'clienthub_update_project',
    description:
      'Memperbarui status, deskripsi, tanggal, atau anggaran proyek di ClientHub.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID proyek yang akan diperbarui.',
        },
        title: {
          type: 'string',
          description: 'Judul baru proyek.',
        },
        description: {
          type: 'string',
          description: 'Deskripsi baru proyek.',
        },
        status: {
          type: 'string',
          enum: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
          description: 'Status baru proyek.',
        },
        total_budget: {
          type: 'number',
          description: 'Total anggaran baru.',
        },
        start_date: {
          type: 'string',
          description: 'Tanggal mulai (YYYY-MM-DD).',
        },
        end_date: {
          type: 'string',
          description: 'Target selesai (YYYY-MM-DD).',
        },
      },
      required: ['project_id'],
    },
  },

  // -------------------------------------------------------------
  // 3. Task & Milestone Tools (Kanban Management)
  // -------------------------------------------------------------
  {
    name: 'clienthub_list_tasks',
    description:
      'Mengambil daftar seluruh tugas dan milestone pada proyek tertentu, lengkap dengan status pengerjaan (Todo, In Progress, Review, Completed), prioritas, deadline, dan persentase progres.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID proyek yang ingin dilihat tugas-tugasnya.',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'clienthub_create_task',
    description:
      'Membuat tugas/milestone baru pada proyek. AI Agent dapat memanggil tool ini untuk mencatat rencana kerja atau sub-task sebelum mulai coding.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID proyek target.',
        },
        title: {
          type: 'string',
          description: 'Judul tugas (contoh: "Slicing UI Dashboard", "Integrasi Payment Gateway").',
        },
        description: {
          type: 'string',
          description: 'Rincian instruksi atau hasil yang diharapkan dari tugas ini.',
        },
        status: {
          type: 'string',
          enum: ['Todo', 'In Progress', 'Review', 'Completed'],
          description: 'Status awal tugas (default: Todo).',
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Medium', 'High'],
          description: 'Tingkat prioritas tugas (default: Medium).',
        },
        due_date: {
          type: 'string',
          description: 'Target deadline tugas (format: YYYY-MM-DD).',
        },
      },
      required: ['project_id', 'title'],
    },
  },
  {
    name: 'clienthub_update_task',
    description:
      'Memperbarui status, rincian, atau prioritas tugas di papan Kanban. AI Agent dapat memindahkan status tugas ke "In Progress" saat mulai bekerja, "Review" saat butuh pengujian, atau "Completed" saat selesai.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'number',
          description: 'ID tugas yang akan diperbarui.',
        },
        status: {
          type: 'string',
          enum: ['Todo', 'In Progress', 'Review', 'Completed'],
          description: 'Status baru tugas.',
        },
        title: {
          type: 'string',
          description: 'Judul tugas baru.',
        },
        description: {
          type: 'string',
          description: 'Deskripsi tugas baru.',
        },
        priority: {
          type: 'string',
          enum: ['Low', 'Medium', 'High'],
          description: 'Prioritas baru.',
        },
        due_date: {
          type: 'string',
          description: 'Deadline baru (YYYY-MM-DD).',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'clienthub_toggle_task',
    description:
      'Mencentang 1-klik status tugas antara Completed dan Todo. Sangat berguna untuk menandai cepat tugas yang baru saja diselesaikan AI.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'number',
          description: 'ID tugas yang ingin di-toggle selesai/belum.',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'clienthub_delete_task',
    description: 'Menghapus suatu tugas dari proyek.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'number',
          description: 'ID tugas yang ingin dihapus.',
        },
      },
      required: ['task_id'],
    },
  },

  // -------------------------------------------------------------
  // 4. Work Log & Communication Updates
  // -------------------------------------------------------------
  {
    name: 'clienthub_log_work_update',
    description:
      'Menulis catatan log pembaruan pekerjaan (Work Update / Progress Log) pada proyek. AI Agent dapat memanggil tool ini untuk mendokumentasikan apa saja file yang diubah dan fitur yang baru saja dibangun.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID proyek yang dikerjakan.',
        },
        subject: {
          type: 'string',
          description: 'Judul update (contoh: "Update Slicing UI & Kanban Board").',
        },
        notes: {
          type: 'string',
          description: 'Catatan detail apa saja yang telah dikerjakan, file yang dimodifikasi, atau kendala yang dihadapi.',
        },
        channel: {
          type: 'string',
          enum: ['note', 'email', 'whatsapp'],
          description: 'Kategori saluran catatan (default: "note").',
        },
        direction: {
          type: 'string',
          enum: ['outgoing', 'incoming'],
          description: 'Arah komunikasi (default: "outgoing").',
        },
      },
      required: ['project_id', 'subject', 'notes'],
    },
  },

  // -------------------------------------------------------------
  // 5. Client Management Tools
  // -------------------------------------------------------------
  {
    name: 'clienthub_list_clients',
    description:
      'Melihat daftar klien yang terdaftar di ClientHub beserta nomor kontak, email, perusahaan, dan total nilai kontrak.',
    inputSchema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Pencarian nama klien, email, atau nama perusahaan.',
        },
      },
    },
  },
  {
    name: 'clienthub_create_client',
    description: 'Menambahkan data klien baru ke dalam ClientHub.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nama lengkap klien.',
        },
        email: {
          type: 'string',
          description: 'Alamat email klien.',
        },
        phone: {
          type: 'string',
          description: 'Nomor WhatsApp / telepon klien (contoh: "081234567890").',
        },
        company: {
          type: 'string',
          description: 'Nama perusahaan / instansi klien.',
        },
        address: {
          type: 'string',
          description: 'Alamat klien.',
        },
        notes: {
          type: 'string',
          description: 'Catatan khusus mengenai klien.',
        },
      },
      required: ['name'],
    },
  },

  // -------------------------------------------------------------
  // 6. Client Portal Link
  // -------------------------------------------------------------
  {
    name: 'clienthub_get_portal_link',
    description:
      'Mengambil link Portal Klien Publik (Live Progress Portal URL) untuk suatu proyek. Link ini siap dibagikan ke klien agar klien bisa memantau progres checklist secara live.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID proyek yang ingin diambil link portalnya.',
        },
      },
      required: ['project_id'],
    },
  },

  // -------------------------------------------------------------
  // 7. Financial Tools (Payments & Expenses)
  // -------------------------------------------------------------
  {
    name: 'clienthub_record_payment',
    description: 'Mencatat pembayaran uang masuk (DP/Pelunasan) dari klien untuk proyek.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID proyek terkait.',
        },
        amount: {
          type: 'number',
          description: 'Jumlah uang pembayaran dalam Rupiah.',
        },
        payment_date: {
          type: 'string',
          description: 'Tanggal pembayaran (format: YYYY-MM-DD, default: hari ini).',
        },
        payment_method: {
          type: 'string',
          enum: ['Bank Transfer', 'Cash', 'E-Wallet', 'Credit Card', 'Other'],
          description: 'Metode pembayaran.',
        },
        status: {
          type: 'string',
          enum: ['Received', 'Pending', 'Refunded'],
          description: 'Status pembayaran (default: Received).',
        },
        notes: {
          type: 'string',
          description: 'Keterangan/catatan pembayaran (misal: "DP 50%").',
        },
      },
      required: ['project_id', 'amount'],
    },
  },
  {
    name: 'clienthub_record_expense',
    description: 'Mencatat biaya pengeluaran operasional proyek (misal: beli hosting, domain, lisensi plugin).',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'number',
          description: 'ID proyek terkait.',
        },
        amount: {
          type: 'number',
          description: 'Jumlah biaya pengeluaran dalam Rupiah.',
        },
        category: {
          type: 'string',
          enum: ['Hosting', 'Software', 'Materials', 'Labor', 'Transportation', 'Other'],
          description: 'Kategori pengeluaran.',
        },
        description: {
          type: 'string',
          description: 'Keterangan pengeluaran.',
        },
        expense_date: {
          type: 'string',
          description: 'Tanggal pengeluaran (format: YYYY-MM-DD).',
        },
      },
      required: ['project_id', 'amount', 'category'],
    },
  },
];
