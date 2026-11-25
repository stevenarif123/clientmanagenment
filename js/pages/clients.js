/**
 * Clients Views (List, Detail, and Full-Page Form)
 */

// 1. Clients List View
window.ClientsView = {
  components: {
    ConfirmModal: window.ConfirmModal,
    Pagination: window.Pagination
  },
  data() {
    return {
      loading: true,
      error: '',
      clients: [],
      total: 0,
      page: 1,
      perPage: 15,
      search: '',
      searchTimeout: null,
      deleteClientTarget: null
    };
  },
  async mounted() {
    await this.fetchClients();
  },
  beforeUnmount() {
    clearTimeout(this.searchTimeout);
  },
  methods: {
    async fetchClients() {
      this.loading = true;
      this.error = '';
      try {
        const response = await window.API.clients.getAll({
          page: this.page,
          per_page: this.perPage,
          search: this.search
        });
        this.clients = response.data?.data || [];
        this.total = response.data?.meta?.total ?? this.clients.length;
      } catch (err) {
        this.error = 'Failed to load client directory.';
        window.Utils.toast('Failed to load clients', 'error');
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.page = 1;
        this.fetchClients();
      }, 300);
    },
    handlePageChange(newPage) {
      this.page = newPage;
      this.fetchClients();
    },
    goToCreate() {
      window.location.hash = '#/clients/new';
    },
    goToEdit(client) {
      window.location.hash = '#/clients/' + client.id + '/edit';
    },
    confirmDelete(client) {
      this.deleteClientTarget = client;
    },
    async executeDelete() {
      if (!this.deleteClientTarget) return;
      try {
        await window.API.clients.delete(this.deleteClientTarget.id);
        window.Utils.toast('Client deleted successfully', 'success');
        this.deleteClientTarget = null;
        await this.fetchClients();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to delete client', 'error');
      }
    },
    formatCurrency(val) {
      return window.Utils.formatCurrency(val);
    },
    getInitials(name) {
      return window.Utils.getInitials(name);
    },
    getWhatsAppUrl(phone) {
      return window.Utils.getWhatsAppUrl(phone);
    },
    getMailtoUrl(email) {
      return window.Utils.getMailtoUrl(email);
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <!-- Slim Top Header -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <h1 class="text-sm font-semibold text-ink tracking-tight">Clients</h1>
          <span class="text-xs text-muted tabular-nums">{{ total }} accounts</span>
        </div>
        <button type="button" @click="goToCreate" class="btn-primary text-xs py-1 px-2.5">
          Add Client
        </button>
      </div>

      <!-- Search Filter Bar -->
      <div class="px-5 sm:px-6 py-3 hairline-b surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="relative w-full sm:w-80">
          <svg class="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="search"
            @input="handleSearch"
            type="text"
            aria-label="Search clients"
            placeholder="Search by name, email, company..."
            class="field-input pl-8 py-1.5 text-xs"
          />
        </div>
        <span class="text-xs text-muted tabular-nums">
          Showing {{ clients.length }} of {{ total }} clients
        </span>
      </div>

      <div class="p-5 sm:p-6">
        <!-- Skeleton Loading -->
        <div v-if="loading" class="surface-card p-4 space-y-3">
          <div v-for="n in 5" :key="'cli-sk-' + n" class="flex items-center justify-between gap-4">
            <div class="skeleton-bar h-4 w-44"></div>
            <div class="skeleton-bar h-4 w-28"></div>
            <div class="skeleton-bar h-4 w-24"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-5 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-st-red">{{ error }}</p>
          <button type="button" @click="fetchClients" class="btn-secondary">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="clients.length === 0" class="surface-card p-10 text-center">
          <h2 class="text-sm font-semibold text-ink">No clients found</h2>
          <p class="text-xs text-sub mt-1">
            {{ search ? 'No client records matched your search query.' : 'Add your first client account to start tracking projects and billing.' }}
          </p>
          <button type="button" @click="goToCreate" class="btn-primary mt-4">Add New Client</button>
        </div>

        <!-- Clients Container -->
        <div v-else class="surface-card overflow-hidden animate-in">
          <!-- Mobile Cards -->
          <div class="md:hidden divide-hairline">
            <div v-for="c in clients" :key="'m-' + c.id" class="p-4 space-y-3">
              <div class="flex items-start justify-between gap-3">
                <a :href="'#/clients/' + c.id" class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-[6px] surface-subtle border hairline text-ink flex items-center justify-center text-xs font-bold shrink-0">
                    {{ getInitials(c.name) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-ink text-sm truncate">{{ c.name }}</p>
                    <p class="text-xs text-muted truncate">{{ c.company || 'Private Client' }}</p>
                  </div>
                </a>
                <span class="text-sm font-semibold text-ink tabular-nums shrink-0">{{ formatCurrency(c.total_budget) }}</span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <a v-if="c.phone" :href="getWhatsAppUrl(c.phone)" target="_blank" rel="noopener" class="px-2.5 py-1 rounded-[4px] border text-xs font-medium badge-green">
                    WhatsApp
                  </a>
                  <a v-if="c.email" :href="getMailtoUrl(c.email)" class="px-2.5 py-1 rounded-[4px] border text-xs font-medium badge-blue">
                    Email
                  </a>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" @click="goToEdit(c)" :aria-label="'Edit ' + c.name" class="btn-ghost p-2">
                    <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button type="button" @click="confirmDelete(c)" :aria-label="'Delete ' + c.name" class="btn-ghost p-2 hover:text-st-red">
                    <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="hairline-b surface-subtle text-xs font-semibold text-sub">
                  <th class="py-2.5 px-5">Client</th>
                  <th class="py-2.5 px-5">Company</th>
                  <th class="py-2.5 px-5">Direct Contact</th>
                  <th class="py-2.5 px-5">Projects</th>
                  <th class="py-2.5 px-5 text-right">Total Value</th>
                  <th class="py-2.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-hairline text-[13px]">
                <tr v-for="c in clients" :key="c.id" class="row-hover">
                  <td class="py-3 px-5">
                    <a :href="'#/clients/' + c.id" class="flex items-center gap-3 group">
                      <div class="w-8 h-8 rounded-[6px] surface-subtle border hairline text-ink flex items-center justify-center text-xs font-bold shrink-0">
                        {{ getInitials(c.name) }}
                      </div>
                      <div>
                        <p class="font-semibold text-ink group-hover:text-accent group-hover:underline">{{ c.name }}</p>
                        <p class="text-[11px] text-muted tabular-nums">#{{ c.id }}</p>
                      </div>
                    </a>
                  </td>
                  <td class="py-3 px-5 text-sub font-medium">{{ c.company || '-' }}</td>
                  <td class="py-3 px-5">
                    <div class="flex items-center gap-1.5">
                      <a v-if="c.phone" :href="getWhatsAppUrl(c.phone)" target="_blank" rel="noopener" class="px-2 py-0.5 rounded-[4px] border text-xs font-medium badge-green" title="Chat on WhatsApp">
                        WA
                      </a>
                      <a v-if="c.email" :href="getMailtoUrl(c.email)" class="px-2 py-0.5 rounded-[4px] border text-xs font-medium badge-blue" title="Send Email">
                        Email
                      </a>
                      <span v-if="!c.phone && !c.email" class="text-xs text-muted">-</span>
                    </div>
                  </td>
                  <td class="py-3 px-5">
                    <div class="flex items-center gap-1.5 tabular-nums">
                      <span class="px-2 py-0.5 rounded-[4px] border text-xs font-medium badge-neutral">
                        {{ c.total_projects || 0 }} total
                      </span>
                      <span v-if="c.active_projects > 0" class="px-2 py-0.5 rounded-[4px] border text-xs font-medium badge-blue">
                        {{ c.active_projects }} active
                      </span>
                    </div>
                  </td>
                  <td class="py-3 px-5 text-right font-semibold text-ink tabular-nums">
                    {{ formatCurrency(c.total_budget) }}
                  </td>
                  <td class="py-3 px-5 text-right space-x-1">
                    <button type="button" @click="goToEdit(c)" :aria-label="'Edit ' + c.name" class="btn-ghost p-1.5" title="Edit Client">
                      <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button type="button" @click="confirmDelete(c)" :aria-label="'Delete ' + c.name" class="btn-ghost p-1.5 hover:text-st-red" title="Delete Client">
                      <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <pagination
            :page="page"
            :total="total"
            :per-page="perPage"
            @change="handlePageChange"
          />
        </div>
      </div>

      <confirm-modal
        v-if="deleteClientTarget"
        title="Delete Client"
        :message="'Are you sure you want to delete ' + deleteClientTarget.name + '? This action cannot be undone.'"
        confirm-text="Delete Client"
        @confirm="executeDelete"
        @cancel="deleteClientTarget = null"
      />
    </div>
  `
};

// 2. Client Full-Page Form View (New / Edit)
window.ClientFormView = {
  props: ['id'],
  data() {
    return {
      isEdit: !!this.id,
      loading: !!this.id,
      saving: false,
      error: '',
      form: {
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      }
    };
  },
  watch: {
    id(newId) {
      this.isEdit = !!newId;
      if (newId) {
        this.fetchClient();
      } else {
        this.form = { name: '', company: '', email: '', phone: '', address: '', notes: '' };
        this.loading = false;
      }
    }
  },
  async mounted() {
    if (this.isEdit) {
      await this.fetchClient();
    }
  },
  methods: {
    async fetchClient() {
      this.loading = true;
      try {
        const response = await window.API.clients.getOne(this.id);
        const c = response.data?.data;
        if (c) {
          this.form = {
            name: c.name || '',
            company: c.company || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            notes: c.notes || ''
          };
        }
      } catch (err) {
        this.error = 'Failed to load client data';
      } finally {
        this.loading = false;
      }
    },
    async handleSubmit() {
      if (!this.form.name.trim()) {
        this.error = 'Client name is required';
        return;
      }

      this.saving = true;
      this.error = '';

      try {
        if (this.isEdit) {
          await window.API.clients.update(this.id, this.form);
          window.Utils.toast('Client updated successfully', 'success');
          window.location.hash = `#/clients/${this.id}`;
        } else {
          const res = await window.API.clients.create(this.form);
          const newId = res.data?.data?.id;
          window.Utils.toast('Client created successfully', 'success');
          window.location.hash = newId ? `#/clients/${newId}` : '#/clients';
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save client';
      } finally {
        this.saving = false;
      }
    },
    handleCancel() {
      window.location.hash = this.isEdit ? `#/clients/${this.id}` : '#/clients';
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-sub">
          <a href="#/clients" class="hover:text-ink">Clients</a>
          <span class="text-muted">/</span>
          <span class="font-semibold text-ink">{{ isEdit ? 'Edit Client' : 'New Client' }}</span>
        </div>
        <button type="button" @click="handleCancel" class="btn-secondary text-xs py-1 px-2.5">Cancel</button>
      </div>

      <div class="p-5 sm:p-6 max-w-3xl w-full mx-auto">
        <div class="surface-card overflow-hidden">
          <div class="px-5 py-4 hairline-b">
            <h1 class="text-base font-bold text-ink">{{ isEdit ? 'Edit Client Profile' : 'Add New Client' }}</h1>
            <p class="text-xs text-muted mt-0.5">Record contact channels, organization info, and account notes.</p>
          </div>

          <div v-if="loading" class="p-6 space-y-4">
            <div class="skeleton-bar h-9 w-full"></div>
            <div class="skeleton-bar h-9 w-full"></div>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="p-5 sm:p-6 space-y-5">
            <div v-if="error" class="p-3 rounded-[6px] border badge-red text-[13px]">
              {{ error }}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label for="client-name" class="field-label">Client / Contact Name *</label>
                <input id="client-name" v-model="form.name" type="text" required placeholder="Full client name" class="field-input" />
              </div>

              <div>
                <label for="client-company" class="field-label">Company / Organization</label>
                <input id="client-company" v-model="form.company" type="text" placeholder="Company or organization" class="field-input" />
              </div>

              <div>
                <label for="client-email" class="field-label">Email Address</label>
                <input id="client-email" v-model="form.email" type="email" placeholder="client@company.com" class="field-input" />
              </div>

              <div>
                <label for="client-phone" class="field-label">WhatsApp / Phone Number</label>
                <input id="client-phone" v-model="form.phone" type="tel" placeholder="08xxxxxxxxxx" class="field-input" />
              </div>

              <div>
                <label for="client-address" class="field-label">Business Address</label>
                <input id="client-address" v-model="form.address" type="text" placeholder="City, street, or office address" class="field-input" />
              </div>
            </div>

            <div>
              <label for="client-notes" class="field-label">Internal Notes</label>
              <textarea
                id="client-notes"
                v-model="form.notes"
                rows="4"
                placeholder="Communication preferences, billing notes, background context..."
                class="field-input leading-relaxed"
              ></textarea>
            </div>

            <div class="pt-4 hairline-t flex items-center justify-end gap-2">
              <button type="button" @click="handleCancel" class="btn-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn-primary">
                <span v-if="saving" class="spinner" aria-hidden="true"></span>
                <span>{{ isEdit ? 'Save Changes' : 'Create Client' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
};

// 3. Client Detail View (Projects, Communications & Files)
window.ClientDetailView = {
  components: {
    ConfirmModal: window.ConfirmModal
  },
  props: ['id'],
  data() {
    return {
      loading: true,
      error: '',
      client: null,
      communications: [],
      files: [],
      activeTab: 'projects',
      showDeleteConfirm: false,
      deleteFileTarget: null,
      showUploadCard: false,
      uploading: false,
      uploadError: '',
      selectedFile: null,
      selectedFileName: ''
    };
  },
  watch: {
    id() {
      this.loadClient();
    }
  },
  async mounted() {
    await this.loadClient();
  },
  methods: {
    async loadClient() {
      this.loading = true;
      this.error = '';
      try {
        const [clientRes, commsRes, filesRes] = await Promise.all([
          window.API.clients.getOne(this.id),
          window.API.clients.getCommunications(this.id),
          window.API.clients.getFiles(this.id)
        ]);
        this.client = clientRes.data?.data;
        this.communications = commsRes.data?.data || [];
        this.files = filesRes.data?.data || [];
      } catch (err) {
        this.error = 'Failed to load client details.';
        window.Utils.toast('Failed to load client details', 'error');
      } finally {
        this.loading = false;
      }
    },
    goToEdit() {
      window.location.hash = `#/clients/${this.id}/edit`;
    },
    goToCreateProject() {
      window.location.hash = `#/projects/new?client_id=${this.id}`;
    },
    async deleteClient() {
      try {
        await window.API.clients.delete(this.id);
        window.Utils.toast('Client deleted successfully', 'success');
        window.location.hash = '#/clients';
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to delete client', 'error');
      }
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 10485760) {
          this.uploadError = 'File exceeds maximum 10MB limit';
          this.selectedFile = null;
          this.selectedFileName = '';
          return;
        }
        this.selectedFile = file;
        this.selectedFileName = file.name;
        this.uploadError = '';
      }
    },
    async handleUploadFile() {
      if (!this.selectedFile) {
        this.uploadError = 'Please select a file to upload';
        return;
      }

      this.uploading = true;
      this.uploadError = '';

      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('client_id', this.id);

      try {
        await window.API.files.upload(formData);
        window.Utils.toast('Attachment uploaded successfully', 'success');
        this.showUploadCard = false;
        this.selectedFile = null;
        this.selectedFileName = '';
        await this.loadClient();
      } catch (err) {
        this.uploadError = err.response?.data?.message || 'Failed to upload file';
      } finally {
        this.uploading = false;
      }
    },
    async executeFileDelete() {
      if (!this.deleteFileTarget) return;
      try {
        await window.API.files.delete(this.deleteFileTarget.id);
        window.Utils.toast('File deleted', 'success');
        this.deleteFileTarget = null;
        await this.loadClient();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to delete file', 'error');
      }
    },
    resolveAssetUrl(url) {
      return window.Utils.resolveAssetUrl(url);
    },
    formatCurrency(val) {
      return window.Utils.formatCurrency(val);
    },
    formatDate(val) {
      return window.Utils.formatDate(val);
    },
    formatDateTime(val) {
      return window.Utils.formatDateTime(val);
    },
    formatFileSize(bytes) {
      return window.Utils.formatFileSize(bytes);
    },
    getInitials(name) {
      return window.Utils.getInitials(name);
    },
    getStatusBadgeClass(status) {
      return window.Utils.getStatusBadgeClass(status);
    },
    getStatusDotClass(status) {
      return window.Utils.getStatusDotClass(status);
    },
    getWhatsAppUrl(phone) {
      return window.Utils.getWhatsAppUrl(phone);
    },
    getMailtoUrl(email) {
      return window.Utils.getMailtoUrl(email);
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <!-- Top Action Bar -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-sub">
          <a href="#/clients" class="hover:text-ink">Clients</a>
          <span class="text-muted">/</span>
          <span class="font-semibold text-ink truncate max-w-[200px]">{{ client?.name || ('#' + id) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <a v-if="client?.phone" :href="getWhatsAppUrl(client.phone)" target="_blank" rel="noopener" class="btn-secondary text-xs py-1 px-2.5">
            WhatsApp
          </a>
          <button type="button" @click="goToEdit" class="btn-secondary text-xs py-1 px-2.5">Edit</button>
          <button type="button" @click="showDeleteConfirm = true" class="btn-danger text-xs py-1 px-2.5">Delete</button>
        </div>
      </div>

      <div class="p-5 sm:p-6 space-y-5">
        <!-- Skeleton Loading -->
        <div v-if="loading" class="surface-card p-6 space-y-4">
          <div class="skeleton-bar h-6 w-48"></div>
          <div class="skeleton-bar h-4 w-72"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-5 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-st-red">{{ error }}</p>
          <button type="button" @click="loadClient" class="btn-secondary">Retry</button>
        </div>

        <div v-else-if="client" class="space-y-5 animate-in">
          <!-- Client Header Summary -->
          <div class="surface-card p-5 sm:p-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-[8px] bg-[#2563eb] text-white flex items-center justify-center text-base font-bold shrink-0">
                  {{ getInitials(client.name) }}
                </div>
                <div>
                  <h1 class="text-xl font-bold text-ink tracking-tight">{{ client.name }}</h1>
                  <p class="text-[13px] text-sub mt-0.5">{{ client.company || 'Private Client' }} &bull; Since {{ formatDate(client.created_at) }}</p>
                </div>
              </div>

              <div class="flex items-center gap-6 sm:border-l hairline sm:pl-6">
                <div>
                  <p class="text-xs font-medium text-muted">Total Contracted</p>
                  <p class="text-base font-bold text-ink tabular-nums mt-0.5">{{ formatCurrency(client.total_budget) }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-muted">Total Paid</p>
                  <p class="text-base font-bold text-st-green tabular-nums mt-0.5">{{ formatCurrency(client.total_received) }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-4 hairline-t text-[13px]">
              <div class="flex items-center gap-2.5 min-w-0">
                <svg class="w-4 h-4 text-muted shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <a v-if="client.email" :href="getMailtoUrl(client.email)" class="text-ink hover:text-accent hover:underline truncate">{{ client.email }}</a>
                <span v-else class="text-muted truncate">No email registered</span>
              </div>
              <div class="flex items-center gap-2.5 min-w-0">
                <svg class="w-4 h-4 text-muted shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <a v-if="client.phone" :href="getWhatsAppUrl(client.phone)" target="_blank" rel="noopener" class="text-ink hover:text-st-green hover:underline truncate">{{ client.phone }}</a>
                <span v-else class="text-muted truncate">No phone registered</span>
              </div>
              <div class="flex items-center gap-2.5 min-w-0">
                <svg class="w-4 h-4 text-muted shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span class="truncate" :class="client.address ? 'text-ink' : 'text-muted'">{{ client.address || 'No address provided' }}</span>
              </div>
            </div>

            <div v-if="client.notes" class="mt-4 pt-4 hairline-t text-xs text-sub leading-relaxed whitespace-pre-line">
              <span class="font-semibold text-ink block mb-1">Notes</span>
              {{ client.notes }}
            </div>
          </div>

          <!-- Detail Tabs Section -->
          <div class="surface-card overflow-hidden">
            <div class="hairline-b surface-subtle px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div class="flex items-center gap-6 overflow-x-auto min-w-0" role="tablist">
                <button type="button" role="tab" @click="activeTab = 'projects'" :class="['tab-link', activeTab === 'projects' ? 'tab-link-active' : '']">
                  Projects ({{ client.recent_projects?.length || 0 }})
                </button>
                <button type="button" role="tab" @click="activeTab = 'communications'" :class="['tab-link', activeTab === 'communications' ? 'tab-link-active' : '']">
                  Communications ({{ communications.length }})
                </button>
                <button type="button" role="tab" @click="activeTab = 'files'" :class="['tab-link', activeTab === 'files' ? 'tab-link-active' : '']">
                  Attachments &amp; Files ({{ files.length }})
                </button>
              </div>

              <div class="shrink-0 pb-2.5 sm:pb-0 flex justify-end">
                <button v-if="activeTab === 'projects'" type="button" @click="goToCreateProject" class="btn-primary text-xs py-1 px-2.5">
                  New Project
                </button>
                <button v-else-if="activeTab === 'files'" type="button" @click="showUploadCard = !showUploadCard" class="btn-primary text-xs py-1 px-2.5">
                  {{ showUploadCard ? 'Close Upload' : 'Upload File' }}
                </button>
              </div>
            </div>

            <!-- TAB 1: PROJECTS -->
            <div v-if="activeTab === 'projects'" class="divide-hairline">
              <div v-if="!client.recent_projects || client.recent_projects.length === 0" class="p-8 text-center">
                <p class="text-xs font-medium text-sub">No projects created for this client yet.</p>
                <button type="button" @click="goToCreateProject" class="btn-secondary text-xs mt-3">Create Project</button>
              </div>
              <a
                v-for="p in client.recent_projects"
                :key="p.id"
                :href="'#/projects/' + p.id"
                class="p-4 flex items-center justify-between row-hover gap-4"
              >
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="status-sq" :class="getStatusDotClass(p.status)" aria-hidden="true"></span>
                  <div class="min-w-0">
                    <p class="font-semibold text-ink text-sm truncate">{{ p.title }}</p>
                    <p class="text-xs text-muted mt-0.5">{{ p.service_name || 'General Service' }} &bull; Started {{ formatDate(p.start_date) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border" :class="getStatusBadgeClass(p.status)">
                    {{ p.status }}
                  </span>
                  <div class="text-right">
                    <span class="text-xs font-bold text-ink tabular-nums block">{{ formatCurrency(p.total_budget) }}</span>
                    <span class="text-[11px] text-st-green font-medium tabular-nums">Paid {{ formatCurrency(p.total_received || 0) }}</span>
                  </div>
                </div>
              </a>
            </div>

            <!-- TAB 2: COMMUNICATIONS -->
            <div v-else-if="activeTab === 'communications'" class="divide-hairline">
              <div v-if="communications.length === 0" class="p-8 text-center text-xs text-muted">
                No communications logged for this client yet. Log notes inside a project's Communications tab.
              </div>
              <div v-for="comm in communications" :key="comm.id" class="p-4 row-hover">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded-[4px] border badge-neutral">{{ comm.type }}</span>
                    <span class="text-xs text-muted">{{ comm.direction }}</span>
                    <a v-if="comm.project_id" :href="'#/projects/' + comm.project_id" class="text-xs font-medium text-accent hover:underline">
                      {{ comm.project_title || ('Project #' + comm.project_id) }}
                    </a>
                  </div>
                  <span class="text-xs text-muted tabular-nums">{{ formatDateTime(comm.created_at) }}</span>
                </div>
                <h3 v-if="comm.subject" class="font-semibold text-ink text-sm mt-2">{{ comm.subject }}</h3>
                <p class="text-[13px] text-sub mt-1 leading-relaxed whitespace-pre-line">{{ comm.content }}</p>
              </div>
            </div>

            <!-- TAB 3: FILES -->
            <div v-else-if="activeTab === 'files'">
              <div v-if="showUploadCard" class="p-5 surface-subtle hairline-b">
                <h3 class="text-xs font-semibold text-ink mb-3">Upload File Attachment (Max 10MB)</h3>
                <div v-if="uploadError" class="mb-3 p-2.5 rounded-[6px] border badge-red text-xs">{{ uploadError }}</div>
                <div class="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    aria-label="Select file to upload"
                    @change="handleFileChange"
                    class="block w-full text-xs text-sub file:mr-3 file:py-1.5 file:px-3 file:rounded-[6px] file:border file:border-[var(--border-strong)] file:text-xs file:font-semibold file:bg-[var(--bg-canvas)] file:text-[var(--text-primary)]"
                  />
                  <div class="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button type="button" @click="showUploadCard = false" class="btn-secondary text-xs">Cancel</button>
                    <button type="button" :disabled="uploading || !selectedFile" @click="handleUploadFile" class="btn-primary text-xs">
                      <span v-if="uploading" class="spinner" aria-hidden="true"></span>
                      <span>Upload Now</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="divide-hairline">
                <div v-if="files.length === 0" class="p-8 text-center text-xs text-muted">
                  No attachments uploaded for this client yet.
                </div>
                <div v-for="f in files" :key="f.id" class="p-4 flex items-center justify-between row-hover gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-[6px] surface-subtle border hairline text-sub flex items-center justify-center shrink-0" aria-hidden="true">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div class="min-w-0">
                      <a :href="resolveAssetUrl(f.file_url)" target="_blank" rel="noopener" class="font-semibold text-ink hover:text-accent hover:underline text-sm truncate block">{{ f.original_name }}</a>
                      <p class="text-xs text-muted mt-0.5 tabular-nums">{{ formatFileSize(f.file_size) }} &bull; {{ formatDateTime(f.uploaded_at) }}</p>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <a :href="resolveAssetUrl(f.file_url)" target="_blank" rel="noopener" download class="btn-secondary text-xs py-1 px-2.5">
                      Download
                    </a>
                    <button type="button" @click="deleteFileTarget = f" :aria-label="'Delete ' + f.original_name" class="btn-ghost p-1.5 hover:text-st-red">
                      <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <confirm-modal
        v-if="showDeleteConfirm"
        title="Delete Client Profile"
        :message="'Are you sure you want to delete ' + (client?.name || 'this client') + '?'"
        @confirm="deleteClient"
        @cancel="showDeleteConfirm = false"
      />

      <confirm-modal
        v-if="deleteFileTarget"
        title="Delete File Attachment"
        :message="'Are you sure you want to delete ' + deleteFileTarget.original_name + '?'"
        @confirm="executeFileDelete"
        @cancel="deleteFileTarget = null"
      />
    </div>
  `
};
