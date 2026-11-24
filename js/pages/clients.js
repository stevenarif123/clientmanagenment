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
      try {
        const response = await window.API.clients.getAll({
          page: this.page,
          per_page: this.perPage,
          search: this.search
        });
        this.clients = response.data?.data || [];
        this.total = response.data?.meta?.total ?? this.clients.length;
      } catch (err) {
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
    goToDetail(id) {
      window.location.hash = '#/clients/' + id;
    },
    goToCreate() {
      window.location.hash = '#/clients/new';
    },
    goToEdit(client, event) {
      if (event) event.stopPropagation();
      window.location.hash = '#/clients/' + client.id + '/edit';
    },
    confirmDelete(client, event) {
      if (event) event.stopPropagation();
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
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p class="text-sm text-slate-500 mt-0.5">Manage your client accounts and relationships</p>
        </div>
        <button
          @click="goToCreate"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add Client
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="relative w-full sm:w-80">
          <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            v-model="search"
            @input="handleSearch"
            type="text"
            placeholder="Search by name, email, company..."
            class="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
          />
        </div>
        <div class="text-xs text-slate-500 font-medium">
          Showing {{ clients.length }} of {{ total }} clients
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner spinner-lg text-slate-900"></div>
        <p class="text-sm text-slate-500 mt-3">Loading clients...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="clients.length === 0" class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </div>
        <h3 class="text-base font-bold text-slate-900">No clients found</h3>
        <p class="text-sm text-slate-500 mt-1">Get started by creating your first client record.</p>
        <button
          @click="goToCreate"
          class="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm inline-flex items-center gap-2"
        >
          Add New Client
        </button>
      </div>

      <!-- Clients Container -->
      <div v-else class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in">
        <!-- Mobile Cards -->
        <div class="md:hidden divide-y divide-slate-100">
          <div
            v-for="c in clients"
            :key="'m-' + c.id"
            @click="goToDetail(c.id)"
            class="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {{ getInitials(c.name) }}
                </div>
                <div class="min-w-0">
                  <p class="font-bold text-slate-900 truncate">{{ c.name }}</p>
                  <p class="text-xs text-slate-500 truncate">{{ c.company || 'Private Client' }}</p>
                </div>
              </div>
              <span class="text-sm font-bold text-slate-900 tabular-nums shrink-0">{{ formatCurrency(c.total_budget) }}</span>
            </div>
            <div class="mt-3 flex items-center justify-between gap-2" @click.stop>
              <div class="flex items-center gap-2">
                <a
                  v-if="c.phone"
                  :href="getWhatsAppUrl(c.phone)"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200"
                >
                  WhatsApp
                </a>
                <a
                  v-if="c.email"
                  :href="getMailtoUrl(c.email)"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200"
                >
                  Email
                </a>
              </div>
              <div class="flex items-center gap-1">
                <button @click="goToEdit(c, $event)" aria-label="Edit Client" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button @click="confirmDelete(c, $event)" aria-label="Delete Client" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Table -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th class="py-3.5 px-6">Client Name</th>
                <th class="py-3.5 px-6">Company</th>
                <th class="py-3.5 px-6">Direct Contact</th>
                <th class="py-3.5 px-6">Projects</th>
                <th class="py-3.5 px-6 text-right">Total Value</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr
                v-for="c in clients"
                :key="c.id"
                @click="goToDetail(c.id)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {{ getInitials(c.name) }}
                    </div>
                    <div>
                      <p class="font-semibold text-slate-900">{{ c.name }}</p>
                      <p class="text-xs text-slate-400">ID: #{{ c.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6 font-medium text-slate-700">
                  {{ c.company || '-' }}
                </td>
                <td class="py-4 px-6" @click.stop>
                  <div class="flex items-center gap-2">
                    <a
                      v-if="c.phone"
                      :href="getWhatsAppUrl(c.phone)"
                      target="_blank"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
                      title="Chat on WhatsApp"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      WA
                    </a>
                    <a
                      v-if="c.email"
                      :href="getMailtoUrl(c.email)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors"
                      title="Send Email"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      Email
                    </a>
                    <span v-if="!c.phone && !c.email" class="text-xs text-slate-400">-</span>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                      {{ c.total_projects || 0 }} total
                    </span>
                    <span v-if="c.active_projects > 0" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {{ c.active_projects }} active
                    </span>
                  </div>
                </td>
                <td class="py-4 px-6 text-right font-semibold text-slate-900 tabular-nums">
                  {{ formatCurrency(c.total_budget) }}
                </td>
                <td class="py-4 px-6 text-right space-x-1" @click.stop>
                  <button
                    @click="goToEdit(c, $event)"
                    aria-label="Edit Client"
                    class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Client"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button
                    @click="confirmDelete(c, $event)"
                    aria-label="Delete Client"
                    class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Client"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <pagination
          :page="page"
          :total="total"
          :per-page="perPage"
          @change="handlePageChange"
        />
      </div>

      <!-- Delete Confirmation Modal -->
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
    <div class="max-w-3xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <a href="#/clients" class="hover:text-slate-900 transition-colors">Clients</a>
        <span>/</span>
        <span class="font-medium text-slate-900">{{ isEdit ? 'Edit Client' : 'New Client' }}</span>
      </div>

      <!-- Main Form Card -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div class="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-slate-900">{{ isEdit ? 'Edit Client Profile' : 'Add New Client' }}</h1>
            <p class="text-xs text-slate-500 mt-1">Fill in the contact information and notes below.</p>
          </div>
          <button
            type="button"
            @click="handleCancel"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        <div v-if="loading" class="p-12 text-center">
          <div class="spinner spinner-lg text-slate-900 mx-auto"></div>
          <p class="text-sm text-slate-500 mt-3">Loading client profile...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="p-6 sm:p-8 space-y-6">
          <div v-if="error" class="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {{ error }}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Client / Contact Name <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                required
                placeholder="e.g. Budi Pratama"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Company / Organization</label>
              <input
                v-model="form.company"
                type="text"
                placeholder="e.g. PT Maju Bersama"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="budi@example.com"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">WhatsApp / Phone Number</label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="08123456789"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Office / Business Address</label>
              <input
                v-model="form.address"
                type="text"
                placeholder="City, Street, Building..."
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Internal Notes &amp; Preferences</label>
            <textarea
              v-model="form.notes"
              rows="4"
              placeholder="Add important details, communication preferences, background context..."
              class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900 transition-all leading-relaxed"
            ></textarea>
          </div>

          <div class="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="handleCancel"
              class="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <span v-if="saving" class="spinner"></span>
              {{ isEdit ? 'Save Changes' : 'Create Client' }}
            </button>
          </div>
        </form>
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
      client: null,
      communications: [],
      files: [],
      activeTab: 'projects', // 'projects', 'communications', 'files'
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
    getWhatsAppUrl(phone) {
      return window.Utils.getWhatsAppUrl(phone);
    },
    getMailtoUrl(email) {
      return window.Utils.getMailtoUrl(email);
    }
  },
  template: `
    <div>
      <!-- Back button & Actions -->
      <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <a href="#/clients" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Clients
        </a>
        <div class="flex items-center gap-2">
          <a
            v-if="client?.phone"
            :href="getWhatsAppUrl(client.phone)"
            target="_blank"
            class="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            WhatsApp
          </a>
          <button
            @click="goToEdit"
            class="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            Edit Profile
          </button>
          <button
            @click="showDeleteConfirm = true"
            class="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner spinner-lg text-slate-900"></div>
        <p class="text-sm text-slate-500 mt-3">Loading client profile...</p>
      </div>

      <div v-else-if="client" class="space-y-6 animate-in">
        <!-- Client Profile Header Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-md">
                {{ getInitials(client.name) }}
              </div>
              <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ client.name }}</h1>
                <p class="text-sm font-medium text-slate-500 mt-0.5">{{ client.company || 'Private Client' }}</p>
                <p class="text-xs text-slate-400 mt-1">Client since {{ formatDate(client.created_at) }}</p>
              </div>
            </div>

            <!-- Financial Quick Stats -->
            <div class="flex items-center gap-6 divide-x divide-slate-100 sm:border-l sm:border-slate-100 sm:pl-6">
              <div>
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Contracted</p>
                <p class="text-lg font-bold text-slate-900 mt-0.5 tabular-nums">{{ formatCurrency(client.total_budget) }}</p>
              </div>
              <div class="pl-6">
                <p class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Paid</p>
                <p class="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">{{ formatCurrency(client.total_received) }}</p>
              </div>
            </div>
          </div>

          <!-- Contact Details Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100 text-sm">
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <a v-if="client.email" :href="getMailtoUrl(client.email)" class="text-slate-700 hover:text-indigo-600 hover:underline truncate">{{ client.email }}</a>
              <span v-else class="text-slate-400 truncate">No email registered</span>
            </div>
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <a v-if="client.phone" :href="getWhatsAppUrl(client.phone)" target="_blank" class="text-slate-700 hover:text-emerald-600 hover:underline truncate">{{ client.phone }}</a>
              <span v-else class="text-slate-400 truncate">No phone registered</span>
            </div>
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span class="text-slate-700 truncate" :class="{ 'text-slate-400': !client.address }">{{ client.address || 'No address provided' }}</span>
            </div>
          </div>

          <div v-if="client.notes" class="mt-5 p-4 bg-slate-50 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-200/60 whitespace-pre-line">
            <span class="font-semibold text-slate-900 block mb-1 text-xs uppercase tracking-wider">Notes</span>
            {{ client.notes }}
          </div>
        </div>

        <!-- Detail Tabs (Projects, Communications, Files) -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="border-b border-slate-200 bg-slate-50/75 px-6 flex items-center justify-between gap-4">
            <div class="flex space-x-6 sm:space-x-8 overflow-x-auto">
              <button
                @click="activeTab = 'projects'"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'projects' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Projects ({{ client.recent_projects?.length || 0 }})
              </button>
              <button
                @click="activeTab = 'communications'"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'communications' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Communications ({{ communications.length }})
              </button>
              <button
                @click="activeTab = 'files'"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'files' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Attachments &amp; Files ({{ files.length }})
              </button>
            </div>

            <div class="shrink-0">
              <button
                v-if="activeTab === 'projects'"
                @click="goToCreateProject"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                New Project
              </button>
              <button
                v-else-if="activeTab === 'files'"
                @click="showUploadCard = !showUploadCard"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ showUploadCard ? 'Close Upload' : 'Upload File' }}
              </button>
            </div>
          </div>

          <!-- TAB 1: PROJECTS -->
          <div v-if="activeTab === 'projects'" class="divide-y divide-slate-100">
            <div v-if="!client.recent_projects || client.recent_projects.length === 0" class="p-10 text-center text-sm text-slate-400">
              No projects created for this client yet.
            </div>
            <a
              v-for="p in client.recent_projects"
              :key="p.id"
              :href="'#/projects/' + p.id"
              class="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors block gap-4"
            >
              <div class="min-w-0">
                <p class="font-semibold text-slate-900 text-sm sm:text-base truncate">{{ p.title }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ p.service_name || 'General Service' }} &bull; Started {{ formatDate(p.start_date) }}</p>
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <span class="text-xs font-medium px-2.5 py-0.5 rounded-full border" :class="getStatusBadgeClass(p.status)">
                  {{ p.status }}
                </span>
                <div class="text-right">
                  <span class="text-sm font-bold text-slate-900 tabular-nums block">{{ formatCurrency(p.total_budget) }}</span>
                  <span class="text-[11px] text-emerald-600 font-medium tabular-nums">Paid {{ formatCurrency(p.total_received || 0) }}</span>
                </div>
              </div>
            </a>
          </div>

          <!-- TAB 2: COMMUNICATIONS -->
          <div v-else-if="activeTab === 'communications'" class="divide-y divide-slate-100">
            <div v-if="communications.length === 0" class="p-10 text-center text-sm text-slate-400">
              No communications or work logs recorded for this client yet.
            </div>
            <div
              v-for="comm in communications"
              :key="comm.id"
              class="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white">{{ comm.type }}</span>
                  <span class="text-xs text-slate-400">{{ comm.direction }}</span>
                  <a v-if="comm.project_id" :href="'#/projects/' + comm.project_id" class="text-xs font-semibold text-indigo-600 hover:underline">
                    {{ comm.project_title || ('Project #' + comm.project_id) }}
                  </a>
                </div>
                <span class="text-xs text-slate-400">{{ formatDateTime(comm.created_at) }}</span>
              </div>
              <h4 v-if="comm.subject" class="font-semibold text-slate-900 text-sm mt-2">{{ comm.subject }}</h4>
              <p class="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-line">{{ comm.content }}</p>
            </div>
          </div>

          <!-- TAB 3: FILES -->
          <div v-else-if="activeTab === 'files'">
            <div v-if="showUploadCard" class="p-6 bg-slate-50 border-b border-slate-200">
              <h4 class="text-sm font-bold text-slate-900 mb-3">Upload File Attachment (Max 10MB)</h4>
              <div v-if="uploadError" class="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{{ uploadError }}</div>
              <div class="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  @change="handleFileChange"
                  class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
                <div class="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    @click="showUploadCard = false"
                    class="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    :disabled="uploading || !selectedFile"
                    @click="handleUploadFile"
                    class="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <span v-if="uploading" class="spinner"></span>
                    Upload Now
                  </button>
                </div>
              </div>
            </div>

            <div class="divide-y divide-slate-100">
              <div v-if="files.length === 0" class="p-10 text-center text-sm text-slate-400">
                No attachments uploaded for this client yet.
              </div>
              <div
                v-for="f in files"
                :key="f.id"
                class="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors gap-3"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div class="min-w-0">
                    <a :href="resolveAssetUrl(f.file_url)" target="_blank" class="font-semibold text-slate-900 hover:underline text-sm truncate block">{{ f.original_name }}</a>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatFileSize(f.file_size) }} &bull; {{ formatDateTime(f.uploaded_at) }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <a
                    :href="resolveAssetUrl(f.file_url)"
                    target="_blank"
                    download
                    class="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700"
                  >
                    Download
                  </a>
                  <button
                    @click="deleteFileTarget = f"
                    aria-label="Delete file"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <confirm-modal
        v-if="showDeleteConfirm"
        title="Delete Client Profile"
        :message="'Are you sure you want to delete ' + client.name + '?'"
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
