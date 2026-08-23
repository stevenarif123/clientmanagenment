/**
 * Projects Views (List, Detail, and Full-Page Form with Tasks & Client Portal)
 */

// 1. Projects List View
window.ProjectsView = {
  components: {
    ConfirmModal: window.ConfirmModal,
    Pagination: window.Pagination
  },
  data() {
    return {
      loading: true,
      projects: [],
      total: 0,
      page: 1,
      perPage: 12,
      search: '',
      statusFilter: '',
      searchTimeout: null,
      deleteProjectTarget: null,
      statuses: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
    };
  },
  async mounted() {
    await this.fetchProjects();
  },
  methods: {
    async fetchProjects() {
      this.loading = true;
      try {
        const response = await window.API.projects.getAll({
          page: this.page,
          per_page: this.perPage,
          search: this.search,
          status: this.statusFilter
        });
        this.projects = response.data?.data || [];
        this.total = response.data?.meta?.total || this.projects.length;
      } catch (err) {
        window.Utils.toast('Failed to load projects', 'error');
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.page = 1;
        this.fetchProjects();
      }, 300);
    },
    handlePageChange(newPage) {
      this.page = newPage;
      this.fetchProjects();
    },
    goToDetail(id) {
      window.location.hash = '#/projects/' + id;
    },
    goToCreate() {
      window.location.hash = '#/projects/new';
    },
    goToEdit(project, event) {
      if (event) event.stopPropagation();
      window.location.hash = '#/projects/' + project.id + '/edit';
    },
    confirmDelete(project, event) {
      if (event) event.stopPropagation();
      this.deleteProjectTarget = project;
    },
    async executeDelete() {
      if (!this.deleteProjectTarget) return;
      try {
        await window.API.projects.delete(this.deleteProjectTarget.id);
        window.Utils.toast('Project deleted successfully', 'success');
        this.deleteProjectTarget = null;
        await this.fetchProjects();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to delete project', 'error');
      }
    },
    formatCurrency(val) {
      return window.Utils.formatCurrency(val);
    },
    formatDate(val) {
      return window.Utils.formatDate(val);
    },
    getStatusBadgeClass(status) {
      return window.Utils.getStatusBadgeClass(status);
    }
  },
  template: `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p class="text-sm text-slate-500 mt-0.5">Track deliverables, timelines, tasks, budgets, and client portals</p>
        </div>
        <button
          @click="goToCreate"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          New Project
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-72">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="search"
              @input="handleSearch"
              type="text"
              placeholder="Search projects..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <select
            v-model="statusFilter"
            @change="page = 1; fetchProjects();"
            class="w-full sm:w-44 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
          >
            <option value="">All Statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="text-xs text-slate-500 font-medium">
          Showing {{ projects.length }} of {{ total }} projects
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner w-8 h-8"></div>
        <p class="text-sm text-slate-500 mt-3">Loading projects...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="projects.length === 0" class="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
        </div>
        <h3 class="text-base font-semibold text-slate-900">No projects found</h3>
        <p class="text-sm text-slate-500 mt-1">Start a new project or change your filters.</p>
        <button
          @click="goToCreate"
          class="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          Create Project
        </button>
      </div>

      <!-- Projects Grid -->
      <div v-else class="space-y-6 animate-in">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="p in projects"
            :key="p.id"
            @click="goToDetail(p.id)"
            class="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all p-6 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-3">
                <span class="text-xs font-medium px-2.5 py-0.5 rounded-full border" :class="getStatusBadgeClass(p.status)">
                  {{ p.status }}
                </span>
                <span class="text-xs font-semibold text-slate-400">#{{ p.id }}</span>
              </div>

              <h3 class="text-base font-bold text-slate-900 leading-snug line-clamp-1">{{ p.title }}</h3>
              <p class="text-xs font-medium text-slate-500 mt-1 truncate">
                {{ p.client_name || 'Client' }} &bull; {{ p.service_name || 'Service' }}
              </p>

              <p v-if="p.description" class="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                {{ p.description }}
              </p>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100">
              <!-- Payment Progress Bar -->
              <div class="mb-3">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-500 font-medium">Payment Collected</span>
                  <span class="font-bold text-slate-900 tabular-nums">
                    {{ p.total_budget > 0 ? Math.round((p.total_received / p.total_budget) * 100) : 0 }}%
                  </span>
                </div>
                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    :style="{ width: (p.total_budget > 0 ? Math.min(100, (p.total_received / p.total_budget) * 100) : 0) + '%' }"
                  ></div>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Budget</p>
                  <p class="text-sm font-bold text-slate-900 tabular-nums">{{ formatCurrency(p.total_budget) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Collected</p>
                  <p class="text-sm font-bold text-emerald-600 tabular-nums">{{ formatCurrency(p.total_received) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <pagination
          :page="page"
          :total="total"
          :per-page="perPage"
          @change="handlePageChange"
        />
      </div>

      <!-- Delete Confirmation (Static Backdrop) -->
      <confirm-modal
        v-if="deleteProjectTarget"
        title="Delete Project"
        :message="'Are you sure you want to delete ' + deleteProjectTarget.title + '? All associated expenses, tasks, and payments will be deleted.'"
        @confirm="executeDelete"
        @cancel="deleteProjectTarget = null"
      />
    </div>
  `
};

// 2. Project Full-Page Form View (New / Edit)
window.ProjectFormView = {
  props: ['id'],
  data() {
    const hash = window.location.hash || '';
    const queryParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
    const defaultClientId = queryParams.get('client_id');

    return {
      isEdit: !!this.id,
      loading: true,
      saving: false,
      error: '',
      clients: [],
      services: [],
      form: {
        client_id: defaultClientId ? parseInt(defaultClientId) : '',
        service_id: '',
        title: '',
        description: '',
        status: 'Pending',
        total_budget: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      },
      statuses: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled']
    };
  },
  async mounted() {
    await this.initFormData();
  },
  methods: {
    async initFormData() {
      this.loading = true;
      try {
        const [clientsRes, servicesRes] = await Promise.all([
          window.API.clients.getAll({ per_page: 100 }),
          window.API.services.getAll()
        ]);
        this.clients = clientsRes.data?.data || [];
        this.services = (servicesRes.data?.data || []).filter(s => s.is_active);

        if (this.isEdit) {
          const projectRes = await window.API.projects.getOne(this.id);
          const p = projectRes.data?.data;
          if (p) {
            this.form = {
              client_id: p.client_id,
              service_id: p.service_id || '',
              title: p.title || '',
              description: p.description || '',
              status: p.status || 'Pending',
              total_budget: p.total_budget || 0,
              start_date: p.start_date || '',
              end_date: p.end_date || ''
            };
          }
        }
      } catch (err) {
        this.error = 'Failed to load project details';
      } finally {
        this.loading = false;
      }
    },
    async handleSubmit() {
      if (!this.form.title.trim()) {
        this.error = 'Project title is required';
        return;
      }
      if (!this.form.client_id) {
        this.error = 'Please select a client';
        return;
      }

      this.saving = true;
      this.error = '';

      try {
        if (this.isEdit) {
          await window.API.projects.update(this.id, this.form);
          window.Utils.toast('Project updated successfully', 'success');
          window.location.hash = `#/projects/${this.id}`;
        } else {
          const res = await window.API.projects.create(this.form);
          const newId = res.data?.data?.id;
          window.Utils.toast('Project created successfully', 'success');
          if (newId) {
            window.location.hash = `#/projects/${newId}`;
          } else {
            window.location.hash = '#/projects';
          }
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save project';
      } finally {
        this.saving = false;
      }
    },
    handleCancel() {
      if (this.isEdit) {
        window.location.hash = `#/projects/${this.id}`;
      } else {
        window.location.hash = '#/projects';
      }
    }
  },
  template: `
    <div class="max-w-3xl mx-auto">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <a href="#/projects" class="hover:text-slate-900 transition-colors">Projects</a>
        <span>/</span>
        <span class="font-medium text-slate-900">{{ isEdit ? 'Edit Project' : 'New Project' }}</span>
      </div>

      <!-- Main Form Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-slate-900">{{ isEdit ? 'Edit Project Details' : 'Create New Project' }}</h1>
            <p class="text-xs text-slate-500 mt-1">Configure project specifications, timeline, and contract value.</p>
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
          <div class="spinner w-8 h-8"></div>
          <p class="text-sm text-slate-500 mt-3">Loading project data...</p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="p-6 sm:p-8 space-y-6">
          <div v-if="error" class="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {{ error }}
          </div>

          <!-- Project Title -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Project Title <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              placeholder="e.g. E-Commerce Redesign & Payment Gateway"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all font-medium"
            />
          </div>

          <!-- Client & Service Selection -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Client <span class="text-rose-500">*</span>
              </label>
              <select
                v-model.number="form.client_id"
                required
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
              >
                <option value="" disabled>Select Client</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">
                  {{ c.name }} {{ c.company ? '(' + c.company + ')' : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Service Package
              </label>
              <select
                v-model.number="form.service_id"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
              >
                <option value="">General Service</option>
                <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <!-- Status & Budget -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Project Status
              </label>
              <select
                v-model="form.status"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
              >
                <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Total Contract Budget (IDR) <span class="text-rose-500">*</span>
              </label>
              <input
                v-model.number="form.total_budget"
                type="number"
                min="0"
                step="50000"
                required
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all tabular-nums font-semibold"
              />
            </div>
          </div>

          <!-- Timeline Dates -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Start Date
              </label>
              <input
                v-model="form.start_date"
                type="date"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Target End Date
              </label>
              <input
                v-model="form.end_date"
                type="date"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Project Description & Scope
            </label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Scope of work, deliverables, client requirements, milestones..."
              class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all leading-relaxed"
            ></textarea>
          </div>

          <!-- Action Buttons -->
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
              class="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all"
            >
              <span v-if="saving" class="spinner"></span>
              {{ isEdit ? 'Save Changes' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 3. Project Detail View (with Tasks & Milestones + Public Portal Link + Inline Forms)
window.ProjectDetailView = {
  components: {
    ConfirmModal: window.ConfirmModal
  },
  props: ['id'],
  data() {
    return {
      loading: true,
      project: null,
      files: [],
      tasks: [],
      taskStats: { total: 0, completed: 0, in_progress: 0, todo: 0, progress_percent: 0 },
      activeTab: 'tasks', // 'tasks', 'payments', 'expenses', 'communications', 'files'
      showDeleteConfirm: false,
      deleteTarget: null, // { type: 'task'|'expense'|'payment'|'comm'|'file', id, title }

      // Task Filter ('all', 'active', 'completed')
      taskFilter: 'all',

      // Inline Forms Expansion States
      showAddTaskForm: false,
      showAddPaymentForm: false,
      showAddExpenseForm: false,
      showAddCommForm: false,
      showUploadFileForm: false,

      // Form Loading States
      itemSubmitting: false,
      itemError: '',

      // Inline Task Form Data
      taskForm: {
        title: '',
        description: '',
        priority: 'Medium',
        due_date: '',
        status: 'Todo'
      },

      // Inline Payment Form Data
      paymentForm: {
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Bank Transfer',
        status: 'Received',
        notes: ''
      },

      // Inline Expense Form Data
      expenseForm: {
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category: 'Software',
        notes: ''
      },

      // Inline Communication Form Data
      commForm: {
        type: 'whatsapp',
        direction: 'outgoing',
        subject: '',
        content: '',
        contact_info: ''
      },

      // Inline File Upload Data
      selectedFile: null,
      selectedFileName: '',

      // Kanban Board Data
      taskViewMode: 'list',
      kanbanColumns: [
        { id: 'Todo', title: 'To Do', dotColor: 'bg-slate-400', badgeBg: 'bg-slate-200 text-slate-700' },
        { id: 'In Progress', title: 'In Progress', dotColor: 'bg-amber-500', badgeBg: 'bg-amber-100 text-amber-700' },
        { id: 'Review', title: 'Review', dotColor: 'bg-blue-500', badgeBg: 'bg-blue-100 text-blue-700' },
        { id: 'Completed', title: 'Done', dotColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-700' }
      ],
      columnRefs: {},
      sortableInstances: [],
      expandedCardId: null,
      editingTask: { title: '', description: '', priority: 'Medium', due_date: '', status: 'Todo' },
      quickAddColumn: null,
      quickAddTitle: ''
    };
  },
  watch: {
    taskViewMode(newMode) {
      if (newMode === 'board') {
        this.$nextTick(() => this.initKanbanSortable());
      } else {
        this.destroyKanbanSortable();
      }
    }
  },
  computed: {
    filteredTasks() {
      if (this.taskFilter === 'active') {
        return this.tasks.filter(t => t.status !== 'Completed');
      }
      if (this.taskFilter === 'completed') {
        return this.tasks.filter(t => t.status === 'Completed');
      }
      return this.tasks;
    }
  },
  async mounted() {
    await this.loadProject();
  },
  beforeUnmount() {
    this.destroyKanbanSortable();
  },
  methods: {
    async loadProject() {
      this.loading = true;
      try {
        const [projectRes, filesRes, tasksRes] = await Promise.all([
          window.API.projects.getOne(this.id),
          window.API.projects.getFiles(this.id),
          window.API.projects.getTasks(this.id)
        ]);
        this.project = projectRes.data?.data;
        this.files = filesRes.data?.data || [];
        this.tasks = tasksRes.data?.data?.tasks || [];
        this.taskStats = tasksRes.data?.data?.stats || { total: 0, completed: 0, in_progress: 0, todo: 0, progress_percent: 0 };
      } catch (err) {
        window.Utils.toast('Failed to load project details', 'error');
      } finally {
        this.loading = false;
      }
    },
    goToEdit() {
      window.location.hash = `#/projects/${this.id}/edit`;
    },
    async deleteProject() {
      try {
        await window.API.projects.delete(this.id);
        window.Utils.toast('Project deleted successfully', 'success');
        window.location.hash = '#/projects';
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to delete project', 'error');
      }
    },

    // CLIENT PORTAL ACTIONS
    getPortalUrl() {
      if (!this.project?.portal_token) return '';
      const origin = window.location.origin || (window.location.protocol + '//' + window.location.host);
      return `${origin}/portal.html?token=${this.project.portal_token}`;
    },
    copyPortalLink() {
      const url = this.getPortalUrl();
      if (!url) return;
      navigator.clipboard.writeText(url).then(() => {
        window.Utils.toast('Client Portal link copied to clipboard!', 'success');
      }).catch(() => {
        window.Utils.toast('Failed to copy. URL: ' + url, 'info');
      });
    },
    previewPortal() {
      const url = this.getPortalUrl();
      if (url) {
        window.open(url, '_blank');
      }
    },
    async regeneratePortalLink() {
      if (!confirm('Regenerate Client Portal link? The previous link shared with the client will stop working.')) return;
      try {
        const res = await window.API.projects.regeneratePortalToken(this.id);
        if (res.data?.data?.portal_token) {
          this.project.portal_token = res.data.data.portal_token;
          window.Utils.toast('New Client Portal link generated', 'success');
        }
      } catch (err) {
        window.Utils.toast('Failed to regenerate link', 'error');
      }
    },

    // TASK MANAGEMENT METHODS
    async handleSaveTask() {
      if (!this.taskForm.title.trim()) {
        this.itemError = 'Task title is required';
        return;
      }
      this.itemSubmitting = true;
      this.itemError = '';
      try {
        await window.API.projects.createTask(this.id, this.taskForm);
        window.Utils.toast('Task added successfully', 'success');
        this.showAddTaskForm = false;
        this.taskForm = { title: '', description: '', priority: 'Medium', due_date: '', status: 'Todo' };
        await this.loadProject();
      } catch (err) {
        this.itemError = err.response?.data?.message || 'Failed to add task';
      } finally {
        this.itemSubmitting = false;
      }
    },
    async toggleTask(task) {
      try {
        await window.API.tasks.toggle(task.id);
        await this.loadProject();
      } catch (err) {
        window.Utils.toast('Failed to update task status', 'error');
      }
    },

    // PAYMENT METHODS
    async handleSavePayment() {
      if (!this.paymentForm.amount || this.paymentForm.amount <= 0) {
        this.itemError = 'Please enter a valid payment amount';
        return;
      }
      this.itemSubmitting = true;
      this.itemError = '';
      try {
        await window.API.projects.createPayment(this.id, this.paymentForm);
        window.Utils.toast('Payment recorded successfully', 'success');
        this.showAddPaymentForm = false;
        this.paymentForm = { amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Bank Transfer', status: 'Received', notes: '' };
        await this.loadProject();
      } catch (err) {
        this.itemError = err.response?.data?.message || 'Failed to save payment';
      } finally {
        this.itemSubmitting = false;
      }
    },

    // EXPENSE METHODS
    async handleSaveExpense() {
      if (!this.expenseForm.description.trim()) {
        this.itemError = 'Expense description is required';
        return;
      }
      if (!this.expenseForm.amount || this.expenseForm.amount <= 0) {
        this.itemError = 'Please enter a valid expense amount';
        return;
      }
      this.itemSubmitting = true;
      this.itemError = '';
      try {
        await window.API.projects.createExpense(this.id, this.expenseForm);
        window.Utils.toast('Expense recorded successfully', 'success');
        this.showAddExpenseForm = false;
        this.expenseForm = { description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], category: 'Software', notes: '' };
        await this.loadProject();
      } catch (err) {
        this.itemError = err.response?.data?.message || 'Failed to save expense';
      } finally {
        this.itemSubmitting = false;
      }
    },

    // COMMUNICATION METHODS
    async handleSaveComm() {
      if (!this.commForm.content.trim()) {
        this.itemError = 'Interaction content / note is required';
        return;
      }
      this.itemSubmitting = true;
      this.itemError = '';
      try {
        await window.API.projects.createCommunication(this.id, {
          client_id: this.project.client_id,
          type: this.commForm.type,
          direction: this.commForm.direction,
          subject: this.commForm.subject,
          content: this.commForm.content,
          contact_info: this.commForm.contact_info
        });
        window.Utils.toast('Communication logged successfully', 'success');
        this.showAddCommForm = false;
        this.commForm = { type: 'whatsapp', direction: 'outgoing', subject: '', content: '', contact_info: '' };
        await this.loadProject();
      } catch (err) {
        this.itemError = err.response?.data?.message || 'Failed to log interaction';
      } finally {
        this.itemSubmitting = false;
      }
    },

    // FILE UPLOAD METHODS
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 5242880) {
          this.itemError = 'File exceeds maximum 5MB limit';
          this.selectedFile = null;
          this.selectedFileName = '';
          return;
        }
        this.selectedFile = file;
        this.selectedFileName = file.name;
        this.itemError = '';
      }
    },
    async handleUploadFile() {
      if (!this.selectedFile) {
        this.itemError = 'Please select a file to upload';
        return;
      }
      this.itemSubmitting = true;
      this.itemError = '';

      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('project_id', this.id);

      try {
        await window.API.files.upload(formData);
        window.Utils.toast('Deliverable / file uploaded successfully', 'success');
        this.showUploadFileForm = false;
        this.selectedFile = null;
        this.selectedFileName = '';
        await this.loadProject();
      } catch (err) {
        this.itemError = err.response?.data?.message || 'Failed to upload file';
      } finally {
        this.itemSubmitting = false;
      }
    },

    // DELETE ITEM
    async executeItemDelete() {
      if (!this.deleteTarget) return;
      try {
        if (this.deleteTarget.type === 'task') {
          await window.API.tasks.delete(this.deleteTarget.id);
          window.Utils.toast('Task deleted', 'success');
        } else if (this.deleteTarget.type === 'expense') {
          await window.API.projects.deleteExpense(this.deleteTarget.id);
          window.Utils.toast('Expense deleted', 'success');
        } else if (this.deleteTarget.type === 'payment') {
          await window.API.projects.deletePayment(this.deleteTarget.id);
          window.Utils.toast('Payment deleted', 'success');
        } else if (this.deleteTarget.type === 'comm') {
          await window.API.projects.deleteCommunication(this.deleteTarget.id);
          window.Utils.toast('Interaction log deleted', 'success');
        } else if (this.deleteTarget.type === 'file') {
          await window.API.files.delete(this.deleteTarget.id);
          window.Utils.toast('File attachment deleted', 'success');
        }
        this.deleteTarget = null;
        await this.loadProject();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to delete item', 'error');
      }
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
    getStatusBadgeClass(status) {
      return window.Utils.getStatusBadgeClass(status);
    },
    getPaymentStatusBadgeClass(status) {
      return window.Utils.getPaymentStatusBadgeClass(status);
    },
    getPriorityClass(p) {
      if (p === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
      if (p === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
      return 'bg-slate-100 text-slate-700 border-slate-200';
    },

    // KANBAN METHODS
    getColumnTasks(status) {
      return this.tasks
        .filter(t => t.status === status)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));
    },
    setColumnRef(colId, el) {
      if (el) this.columnRefs[colId] = el;
    },
    initKanbanSortable() {
      // Destroy existing instances
      this.sortableInstances.forEach(s => s.destroy());
      this.sortableInstances = [];

      this.$nextTick(() => {
        this.kanbanColumns.forEach(col => {
          const el = this.columnRefs[col.id];
          if (!el) return;

          const instance = new Sortable(el, {
            group: 'project-kanban',
            animation: 180,
            ghostClass: 'kanban-ghost',
            chosenClass: 'kanban-chosen',
            dragClass: 'kanban-drag',
            onEnd: (evt) => {
              const taskId = parseInt(evt.item.dataset.id, 10);
              const toStatus = evt.to.dataset.status;
              const newIndex = evt.newIndex;
              this.handleCardDrop(taskId, toStatus, newIndex);
            }
          });
          this.sortableInstances.push(instance);
        });
      });
    },
    destroyKanbanSortable() {
      this.sortableInstances.forEach(s => s.destroy());
      this.sortableInstances = [];
      this.columnRefs = {};
    },
    async handleCardDrop(taskId, toStatus, newIndex) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      const snapshot = JSON.parse(JSON.stringify(this.tasks));
      
      // Calculate new order_index using fractional indexing
      const targetTasks = this.tasks
        .filter(t => t.status === toStatus && t.id !== taskId)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));

      let newOrder = 1000.0;
      if (targetTasks.length === 0) {
        newOrder = 1000.0;
      } else if (newIndex === 0) {
        newOrder = parseFloat(targetTasks[0].order_index) / 2.0;
      } else if (newIndex >= targetTasks.length) {
        newOrder = parseFloat(targetTasks[targetTasks.length - 1].order_index) + 1000.0;
      } else {
        const prev = parseFloat(targetTasks[newIndex - 1].order_index);
        const next = parseFloat(targetTasks[newIndex].order_index);
        newOrder = (prev + next) / 2.0;

        // Precision guard — trigger rebalance if gap too small
        if (Math.abs(next - prev) < 0.001) {
          await this.rebalanceColumn(toStatus);
          return;
        }
      }

      // Optimistic update
      task.status = toStatus;
      task.order_index = newOrder;
      if (toStatus === 'Completed') {
        task.completed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      } else if (snapshot.find(t => t.id === taskId)?.status === 'Completed') {
        task.completed_at = null;
      }

      try {
        await window.API.tasks.update(taskId, { status: toStatus, order_index: newOrder });
        // Refresh stats
        const res = await window.API.projects.getTasks(this.id);
        this.taskStats = res.data?.data?.stats || this.taskStats;
      } catch (err) {
        // Rollback on failure
        this.tasks = snapshot;
        window.Utils.toast('Failed to move task', 'error');
      }
    },
    async rebalanceColumn(status) {
      const columnTasks = this.tasks
        .filter(t => t.status === status)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));
      
      const reorderPayload = columnTasks.map((t, i) => {
        t.order_index = (i + 1) * 1000.0;
        return { id: t.id, order_index: t.order_index };
      });

      try {
        await window.API.projects.reorderTasks(this.id, reorderPayload);
      } catch (err) {
        window.Utils.toast('Failed to rebalance task order', 'error');
        this.loadProject();
      }
    },
    expandCard(task) {
      if (this.expandedCardId === task.id) {
        this.expandedCardId = null;
        return;
      }
      this.expandedCardId = task.id;
      this.editingTask = {
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        due_date: task.due_date || '',
        status: task.status
      };
    },
    async saveExpandedCard(taskId) {
      try {
        await window.API.tasks.update(taskId, this.editingTask);
        this.expandedCardId = null;
        window.Utils.toast('Task updated', 'success');
        this.loadProject();
      } catch (err) {
        window.Utils.toast('Failed to update task', 'error');
      }
    },
    cancelExpandCard() {
      this.expandedCardId = null;
    },
    openQuickAdd(status) {
      this.quickAddColumn = status;
      this.quickAddTitle = '';
      this.$nextTick(() => {
        const input = this.$refs['quickadd_' + status];
        if (input) {
          if (Array.isArray(input)) {
            input[0]?.focus?.();
          } else {
            input.focus?.();
          }
        }
      });
    },
    async submitQuickAdd(status) {
      if (!this.quickAddTitle.trim()) return;
      try {
        await window.API.projects.createTask(this.id, {
          title: this.quickAddTitle.trim(),
          status: status,
          priority: 'Medium'
        });
        this.quickAddTitle = '';
        this.quickAddColumn = null;
        window.Utils.toast('Task added', 'success');
        this.loadProject();
      } catch (err) {
        window.Utils.toast('Failed to add task', 'error');
      }
    },
    cancelQuickAdd() {
      this.quickAddColumn = null;
      this.quickAddTitle = '';
    }
  },
  template: `
    <div>
      <!-- Back Navigation & Actions -->
      <div class="flex items-center justify-between gap-4 mb-6">
        <a href="#/projects" class="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Back to Projects
        </a>
        <div class="flex items-center gap-2">
          <button
            @click="goToEdit"
            class="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            Edit Project
          </button>
          <button
            @click="showDeleteConfirm = true"
            class="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-medium rounded-lg flex items-center gap-1.5"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner w-8 h-8"></div>
        <p class="text-sm text-slate-500 mt-3">Loading project details...</p>
      </div>

      <div v-else-if="project" class="space-y-6 animate-in">
        <!-- Project Header Card -->
        <div class="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full border" :class="getStatusBadgeClass(project.status)">
                  {{ project.status }}
                </span>
                <span class="text-xs text-slate-400 font-medium">{{ project.service_name || 'Custom Service' }}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{{ project.title }}</h1>
              <p class="text-sm font-medium text-slate-600 mt-1">
                Client: <a :href="'#/clients/' + project.client_id" class="text-slate-900 font-semibold hover:underline">{{ project.client_name }}</a>
                <span v-if="project.client_company"> ({{ project.client_company }})</span>
              </p>
            </div>

            <!-- Financial Quick Stats -->
            <div class="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 w-full lg:w-auto">
              <div class="text-center sm:text-left">
                <p class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Contract</p>
                <p class="text-base sm:text-lg font-bold text-slate-900 tabular-nums mt-0.5">{{ formatCurrency(project.total_budget) }}</p>
              </div>
              <div class="text-center sm:text-left">
                <p class="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Collected</p>
                <p class="text-base sm:text-lg font-bold text-emerald-700 tabular-nums mt-0.5">{{ formatCurrency(project.total_received) }}</p>
              </div>
              <div class="text-center sm:text-left">
                <p class="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Expenses</p>
                <p class="text-base sm:text-lg font-bold text-rose-700 tabular-nums mt-0.5">{{ formatCurrency(project.total_expenses) }}</p>
              </div>
            </div>
          </div>

          <!-- Dual Progress Bars: Work Completion vs Payment -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 pt-6 border-t border-slate-100">
            <!-- Work Progress -->
            <div class="bg-slate-50/75 p-4 rounded-xl border border-slate-200/60">
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🔨</span> Work Execution Progress
                </span>
                <span class="font-bold text-slate-900">{{ taskStats.progress_percent }}% ({{ taskStats.completed }}/{{ taskStats.total }} tasks)</span>
              </div>
              <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-blue-600 rounded-full transition-all duration-500"
                  :style="{ width: taskStats.progress_percent + '%' }"
                ></div>
              </div>
            </div>

            <!-- Payment Progress -->
            <div class="bg-slate-50/75 p-4 rounded-xl border border-slate-200/60">
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>💳</span> Payment Collection
                </span>
                <span class="font-bold text-emerald-700">
                  {{ project.total_budget > 0 ? Math.round((project.total_received / project.total_budget) * 100) : 0 }}%
                </span>
              </div>
              <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  :style="{ width: (project.total_budget > 0 ? Math.min(100, (project.total_received / project.total_budget) * 100) : 0) + '%' }"
                ></div>
              </div>
            </div>
          </div>

          <!-- Timeline & Description -->
          <div class="mt-4 flex items-center gap-6 text-xs text-slate-500">
            <span>Start: <strong class="text-slate-700">{{ formatDate(project.start_date) }}</strong></span>
            <span>Target End: <strong class="text-slate-700">{{ formatDate(project.end_date) }}</strong></span>
          </div>
          <p v-if="project.description" class="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-100">
            {{ project.description }}
          </p>
        </div>

        <!-- CLIENT PORTAL SHARE BANNER -->
        <div class="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Public Link
              </span>
              <h3 class="font-bold text-white text-base">Client Progress Portal</h3>
            </div>
            <p class="text-xs text-slate-300 max-w-xl leading-relaxed">
              Share this secure link with {{ project.client_name }} to let them track real-time milestones, tasks, deliverables, and invoices without admin login.
            </p>
          </div>

          <div class="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              @click="copyPortalLink"
              class="flex-1 sm:flex-initial px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
              Copy Link
            </button>
            <button
              @click="previewPortal"
              class="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Open portal in new tab"
            >
              <span>👁️ Preview</span>
            </button>
            <button
              @click="regeneratePortalLink"
              class="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Regenerate/Revoke link"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>

        <!-- Management Tabs Section -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <!-- Tab Headers -->
          <div class="border-b border-slate-200 bg-slate-50/75 px-6 flex items-center justify-between">
            <div class="flex space-x-6 sm:space-x-8 overflow-x-auto">
              <button
                @click="activeTab = 'tasks'; itemError = '';"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'tasks' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Tasks & Milestones ({{ tasks.length }})
              </button>
              <button
                @click="activeTab = 'payments'; itemError = '';"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'payments' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Payments ({{ project.recent_payments?.length || 0 }})
              </button>
              <button
                @click="activeTab = 'expenses'; itemError = '';"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'expenses' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Expenses ({{ project.recent_expenses?.length || 0 }})
              </button>
              <button
                @click="activeTab = 'communications'; itemError = '';"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'communications' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Communications ({{ project.recent_communications?.length || 0 }})
              </button>
              <button
                @click="activeTab = 'files'; itemError = '';"
                :class="['py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap', activeTab === 'files' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700']"
              >
                Deliverables & Files ({{ files.length }})
              </button>
            </div>

            <!-- Tab Action Button -->
            <div class="shrink-0 pl-4">
              <button
                v-if="activeTab === 'tasks'"
                @click="showAddTaskForm = !showAddTaskForm; itemError = '';"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ showAddTaskForm ? 'Close Form' : 'Add Task' }}
              </button>
              <button
                v-else-if="activeTab === 'payments'"
                @click="showAddPaymentForm = !showAddPaymentForm; itemError = '';"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ showAddPaymentForm ? 'Close Form' : 'Add Payment' }}
              </button>
              <button
                v-else-if="activeTab === 'expenses'"
                @click="showAddExpenseForm = !showAddExpenseForm; itemError = '';"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ showAddExpenseForm ? 'Close Form' : 'Record Expense' }}
              </button>
              <button
                v-else-if="activeTab === 'communications'"
                @click="showAddCommForm = !showAddCommForm; itemError = '';"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ showAddCommForm ? 'Close Form' : 'Log Interaction' }}
              </button>
              <button
                v-else-if="activeTab === 'files'"
                @click="showUploadFileForm = !showUploadFileForm; itemError = '';"
                class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                {{ showUploadFileForm ? 'Close Form' : 'Upload File' }}
              </button>
            </div>
          </div>

          <!-- TAB 1: TASKS & MILESTONES -->
          <div v-if="activeTab === 'tasks'">
            <!-- Inline Add Task Form Card -->
            <div v-if="showAddTaskForm" class="p-6 bg-slate-50 border-b border-slate-200">
              <h3 class="text-sm font-bold text-slate-900 mb-4">Create Project Task / Milestone</h3>
              <div v-if="itemError" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{{ itemError }}</div>

              <form @submit.prevent="handleSaveTask" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Task Title *</label>
                    <input
                      v-model="taskForm.title"
                      type="text"
                      required
                      placeholder="e.g. Wireframe & User Flow Approval"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 font-medium"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Priority</label>
                    <select
                      v-model="taskForm.priority"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Target Due Date</label>
                    <input
                      v-model="taskForm.due_date"
                      type="date"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Initial Status</label>
                    <select
                      v-model="taskForm.status"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    >
                      <option value="Todo">Todo (Not Started)</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review">Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Description & Deliverables</label>
                  <textarea
                    v-model="taskForm.description"
                    rows="2"
                    placeholder="Specific requirements, checklist items, or links..."
                    class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  ></textarea>
                </div>

                <div class="flex items-center justify-end gap-3 pt-2">
                  <button type="button" @click="showAddTaskForm = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" :disabled="itemSubmitting" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5">
                    <span v-if="itemSubmitting" class="spinner"></span>
                    Save Task
                  </button>
                </div>
              </form>
            </div>

            <!-- View Mode Switcher & Filter Toolbar -->
            <div class="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button @click="taskViewMode = 'list'"
                  :class="['px-3 py-1.5 text-xs font-bold rounded-lg border transition-all', taskViewMode === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400']">
                  ☰ List
                </button>
                <button @click="taskViewMode = 'board'"
                  :class="['px-3 py-1.5 text-xs font-bold rounded-lg border transition-all', taskViewMode === 'board' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400']">
                  ⊞ Board
                </button>
              </div>

              <!-- List Filter Options (only visible when in list mode) -->
              <div v-if="taskViewMode === 'list'" class="flex items-center gap-2">
                <button
                  @click="taskFilter = 'all'"
                  :class="['px-3 py-1 text-xs font-semibold rounded-lg transition-colors', taskFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200']"
                >
                  All ({{ tasks.length }})
                </button>
                <button
                  @click="taskFilter = 'active'"
                  :class="['px-3 py-1 text-xs font-semibold rounded-lg transition-colors', taskFilter === 'active' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200']"
                >
                  Active ({{ tasks.length - taskStats.completed }})
                </button>
                <button
                  @click="taskFilter = 'completed'"
                  :class="['px-3 py-1 text-xs font-semibold rounded-lg transition-colors', taskFilter === 'completed' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200']"
                >
                  Completed ({{ taskStats.completed }})
                </button>
              </div>
            </div>

            <!-- List View (when taskViewMode === 'list') -->
            <div v-if="taskViewMode === 'list'" class="divide-y divide-slate-100">
              <div v-if="filteredTasks.length === 0" class="p-12 text-center text-sm text-slate-400">
                No tasks found. Click "Add Task" to create your first milestone.
              </div>
              <div
                v-for="t in filteredTasks"
                :key="t.id"
                class="p-4 sm:p-5 flex items-start justify-between hover:bg-slate-50 transition-colors gap-4"
              >
                <div class="flex items-start gap-3.5 min-w-0">
                  <!-- Checkbox Toggle -->
                  <button
                    type="button"
                    @click="toggleTask(t)"
                    :class="['w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-colors', t.status === 'Completed' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-slate-500 bg-white']"
                  >
                    <svg v-if="t.status === 'Completed'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  </button>

                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span
                        :class="['text-sm font-semibold transition-all', t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900']"
                      >
                        {{ t.title }}
                      </span>
                      <span
                        class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase"
                        :class="getPriorityClass(t.priority)"
                      >
                        {{ t.priority }}
                      </span>
                      <span v-if="t.status === 'In Progress'" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        In Progress
                      </span>
                      <span v-if="t.status === 'Review'" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Review
                      </span>
                    </div>

                    <p v-if="t.description" class="text-xs text-slate-600 mt-1 leading-relaxed">{{ t.description }}</p>
                    <p v-if="t.due_date" class="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <span>📅 Due:</span> {{ formatDate(t.due_date) }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                  <button
                    @click="deleteTarget = { type: 'task', id: t.id, title: t.title }"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Kanban Board View (when taskViewMode === 'board') -->
            <div v-else class="p-4 sm:p-6 overflow-x-auto">
              <div class="flex items-start gap-4 min-h-[500px]" style="min-width: max-content;">
                
                <div v-for="col in kanbanColumns" :key="col.id"
                  class="w-72 sm:w-80 shrink-0 bg-slate-100/80 rounded-2xl flex flex-col max-h-[600px] border border-slate-200 shadow-sm">
                  
                  <!-- Column Header -->
                  <div class="p-3.5 flex items-center justify-between border-b border-slate-200/60">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full" :class="col.dotColor"></span>
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">{{ col.title }}</h3>
                      <span class="px-2 py-0.5 text-[11px] font-bold rounded-full" :class="col.badgeBg">
                        {{ getColumnTasks(col.id).length }}
                      </span>
                    </div>
                  </div>

                  <!-- Scrollable Drop Zone -->
                  <div :ref="(el) => setColumnRef(col.id, el)" :data-status="col.id"
                    class="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[100px]">
                    
                    <div v-for="task in getColumnTasks(col.id)" :key="task.id" :data-id="task.id"
                      class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
                      
                      <!-- Card Content (Collapsed) -->
                      <div class="p-3.5" @click="expandCard(task)">
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border"
                            :class="getPriorityClass(task.priority)">
                            {{ task.priority }}
                          </span>
                          <span class="text-[11px] text-slate-400 font-medium">#{{ task.id }}</span>
                        </div>
                        <h4 class="text-sm font-semibold text-slate-800 leading-snug"
                          :class="{ 'line-through text-slate-400': task.status === 'Completed' }">
                          {{ task.title }}
                        </h4>
                        <p v-if="task.description" class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {{ task.description }}
                        </p>
                        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span v-if="task.due_date" class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                            {{ task.due_date }}
                          </span>
                          <span v-else>No deadline</span>
                          <span class="text-slate-300">{{ task.created_at ? task.created_at.slice(0, 10) : '' }}</span>
                        </div>
                        <div v-if="task.completed_at" class="mt-1.5 text-[10px] text-emerald-600 font-semibold">
                          ✓ Done {{ task.completed_at.slice(0, 10) }}
                        </div>
                      </div>

                      <!-- Expanded Inline Edit Form -->
                      <div v-if="expandedCardId === task.id" class="border-t border-slate-200 p-3.5 bg-slate-50/50 rounded-b-xl space-y-3" @click.stop>
                        <input v-model="editingTask.title" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Task title">
                        <textarea v-model="editingTask.description" rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Description (optional)"></textarea>
                        <div class="grid grid-cols-2 gap-2">
                          <select v-model="editingTask.priority" class="px-2 py-1.5 text-xs border border-slate-300 rounded-lg">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                          <input v-model="editingTask.due_date" type="date" class="px-2 py-1.5 text-xs border border-slate-300 rounded-lg">
                        </div>
                        <select v-model="editingTask.status" class="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg">
                          <option value="Todo">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Review">Review</option>
                          <option value="Completed">Done</option>
                        </select>
                        <div class="flex justify-end gap-2 pt-1">
                          <button @click.stop="cancelExpandCard" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                          <button @click.stop="saveExpandedCard(task.id)" class="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800">Save</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Quick Add Footer -->
                  <div class="p-2 border-t border-slate-200/60">
                    <div v-if="quickAddColumn === col.id" class="p-2 space-y-2">
                      <input :ref="'quickadd_' + col.id" v-model="quickAddTitle" @keyup.enter="submitQuickAdd(col.id)" @keyup.esc="cancelQuickAdd"
                        class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Task title...">
                      <div class="flex gap-2">
                        <button @click="submitQuickAdd(col.id)" class="flex-1 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800">Add</button>
                        <button @click="cancelQuickAdd" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">✕</button>
                      </div>
                    </div>
                    <button v-else @click="openQuickAdd(col.id)"
                      class="w-full py-2 px-3 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                      Add Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: PAYMENTS -->
          <div v-else-if="activeTab === 'payments'">
            <div v-if="showAddPaymentForm" class="p-6 bg-slate-50 border-b border-slate-200">
              <h3 class="text-sm font-bold text-slate-900 mb-4">Record New Payment</h3>
              <div v-if="itemError" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{{ itemError }}</div>

              <form @submit.prevent="handleSavePayment" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Amount (IDR) *</label>
                    <input
                      v-model.number="paymentForm.amount"
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 5000000"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 tabular-nums font-semibold"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Payment Date</label>
                    <input
                      v-model="paymentForm.payment_date"
                      type="date"
                      required
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Status</label>
                    <select
                      v-model="paymentForm.status"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    >
                      <option value="Received">Received</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Payment Method</label>
                    <input
                      v-model="paymentForm.payment_method"
                      type="text"
                      placeholder="Bank Transfer, Cash, Stripe..."
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Notes / Transaction Ref</label>
                    <input
                      v-model="paymentForm.notes"
                      type="text"
                      placeholder="DP 50%, Invoice #001..."
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-end gap-3 pt-2">
                  <button type="button" @click="showAddPaymentForm = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" :disabled="itemSubmitting" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5">
                    <span v-if="itemSubmitting" class="spinner"></span>
                    Save Payment
                  </button>
                </div>
              </form>
            </div>

            <!-- Payments List -->
            <div class="divide-y divide-slate-100">
              <div v-if="!project.recent_payments || project.recent_payments.length === 0" class="p-12 text-center text-sm text-slate-400">
                No payments recorded yet for this project.
              </div>
              <div
                v-for="pay in project.recent_payments"
                :key="pay.id"
                class="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div class="flex items-center gap-3">
                    <p class="font-bold text-slate-900 text-base tabular-nums">{{ formatCurrency(pay.amount) }}</p>
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full border" :class="getPaymentStatusBadgeClass(pay.status)">
                      {{ pay.status }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ pay.payment_method || 'Payment' }} &bull; {{ formatDate(pay.payment_date) }}
                    <span v-if="pay.notes" class="text-slate-400"> &bull; {{ pay.notes }}</span>
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="deleteTarget = { type: 'payment', id: pay.id, title: 'Payment of ' + formatCurrency(pay.amount) }"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: EXPENSES -->
          <div v-else-if="activeTab === 'expenses'">
            <div v-if="showAddExpenseForm" class="p-6 bg-slate-50 border-b border-slate-200">
              <h3 class="text-sm font-bold text-slate-900 mb-4">Record New Expense</h3>
              <div v-if="itemError" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{{ itemError }}</div>

              <form @submit.prevent="handleSaveExpense" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Expense Description *</label>
                    <input
                      v-model="expenseForm.description"
                      type="text"
                      required
                      placeholder="e.g. Hosting setup, Theme license..."
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Category</label>
                    <select
                      v-model="expenseForm.category"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    >
                      <option value="Software">Software</option>
                      <option value="Hosting">Hosting</option>
                      <option value="Labor">Labor</option>
                      <option value="Materials">Materials</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Amount (IDR) *</label>
                    <input
                      v-model.number="expenseForm.amount"
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 250000"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 tabular-nums font-semibold"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Expense Date</label>
                    <input
                      v-model="expenseForm.expense_date"
                      type="date"
                      required
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-end gap-3 pt-2">
                  <button type="button" @click="showAddExpenseForm = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" :disabled="itemSubmitting" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5">
                    <span v-if="itemSubmitting" class="spinner"></span>
                    Save Expense
                  </button>
                </div>
              </form>
            </div>

            <!-- Expenses List -->
            <div class="divide-y divide-slate-100">
              <div v-if="!project.recent_expenses || project.recent_expenses.length === 0" class="p-12 text-center text-sm text-slate-400">
                No expenses recorded yet for this project.
              </div>
              <div
                v-for="exp in project.recent_expenses"
                :key="exp.id"
                class="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div class="flex items-center gap-3">
                    <p class="font-semibold text-slate-900 text-sm sm:text-base">{{ exp.description }}</p>
                    <span class="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {{ exp.category }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ formatDate(exp.expense_date) }}
                    <span v-if="exp.notes" class="text-slate-400"> &bull; {{ exp.notes }}</span>
                  </p>
                </div>

                <div class="flex items-center gap-4">
                  <span class="font-bold text-rose-600 text-sm sm:text-base tabular-nums">
                    -{{ formatCurrency(exp.amount) }}
                  </span>
                  <button
                    @click="deleteTarget = { type: 'expense', id: exp.id, title: exp.description }"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: COMMUNICATIONS -->
          <div v-else-if="activeTab === 'communications'">
            <div v-if="showAddCommForm" class="p-6 bg-slate-50 border-b border-slate-200">
              <h3 class="text-sm font-bold text-slate-900 mb-4">Log Interaction / Conversation</h3>
              <div v-if="itemError" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{{ itemError }}</div>

              <form @submit.prevent="handleSaveComm" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Channel</label>
                    <select
                      v-model="commForm.type"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="note">Internal Note</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Direction</label>
                    <select
                      v-model="commForm.direction"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    >
                      <option value="outgoing">Outgoing</option>
                      <option value="incoming">Incoming</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Subject</label>
                    <input
                      v-model="commForm.subject"
                      type="text"
                      placeholder="e.g. Design Revision Discussion"
                      class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase text-slate-700 mb-1">Content & Decisions *</label>
                  <textarea
                    v-model="commForm.content"
                    rows="4"
                    required
                    placeholder="Write detailed notes, meeting minutes, or client feedback..."
                    class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 leading-relaxed"
                  ></textarea>
                </div>

                <div class="flex items-center justify-end gap-3 pt-2">
                  <button type="button" @click="showAddCommForm = false" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg">Cancel</button>
                  <button type="submit" :disabled="itemSubmitting" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5">
                    <span v-if="itemSubmitting" class="spinner"></span>
                    Save Interaction
                  </button>
                </div>
              </form>
            </div>

            <!-- Communications List -->
            <div class="divide-y divide-slate-100">
              <div v-if="!project.recent_communications || project.recent_communications.length === 0" class="p-12 text-center text-sm text-slate-400">
                No communications logged yet for this project.
              </div>
              <div
                v-for="comm in project.recent_communications"
                :key="comm.id"
                class="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
              >
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                        {{ comm.type }}
                      </span>
                      <span class="text-xs text-slate-400">{{ comm.direction }}</span>
                      <span v-if="comm.contact_info" class="text-xs text-slate-500">({{ comm.contact_info }})</span>
                    </div>
                    <h4 v-if="comm.subject" class="font-semibold text-slate-900 text-sm mt-2">{{ comm.subject }}</h4>
                    <p class="text-sm text-slate-700 mt-1 leading-relaxed whitespace-pre-line">{{ comm.content }}</p>
                    <p class="text-[11px] text-slate-400 mt-2">{{ formatDateTime(comm.created_at) }}</p>
                  </div>

                  <button
                    @click="deleteTarget = { type: 'comm', id: comm.id, title: 'Interaction log' }"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-md shrink-0"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 5: DELIVERABLES & FILES -->
          <div v-else-if="activeTab === 'files'">
            <div v-if="showUploadFileForm" class="p-6 bg-slate-50 border-b border-slate-200">
              <h3 class="text-sm font-bold text-slate-900 mb-3">Upload Deliverable / File</h3>
              <div v-if="itemError" class="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">{{ itemError }}</div>

              <div class="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="file"
                  @change="handleFileChange"
                  class="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                />
                <div class="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    type="button"
                    @click="showUploadFileForm = false"
                    class="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    :disabled="itemSubmitting || !selectedFile"
                    @click="handleUploadFile"
                    class="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <span v-if="itemSubmitting" class="spinner"></span>
                    Upload Now
                  </button>
                </div>
              </div>
            </div>

            <!-- Files List -->
            <div class="divide-y divide-slate-100">
              <div v-if="files.length === 0" class="p-12 text-center text-sm text-slate-400">
                No files or deliverables attached to this project yet.
              </div>
              <div
                v-for="f in files"
                :key="f.id"
                class="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  </div>
                  <div class="min-w-0">
                    <a :href="f.file_url" target="_blank" class="font-semibold text-slate-900 hover:underline text-sm truncate block">{{ f.original_name }}</a>
                    <p class="text-xs text-slate-500 mt-0.5">{{ formatFileSize(f.file_size) }} &bull; {{ formatDateTime(f.uploaded_at) }}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a
                    :href="f.file_url"
                    target="_blank"
                    download
                    class="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700"
                  >
                    Download
                  </a>
                  <button
                    @click="deleteTarget = { type: 'file', id: f.id, title: f.original_name }"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Dialogs (Static Backdrop) -->
      <confirm-modal
        v-if="showDeleteConfirm"
        title="Delete Project"
        :message="'Are you sure you want to delete this project and all its records?'"
        @confirm="deleteProject"
        @cancel="showDeleteConfirm = false"
      />

      <confirm-modal
        v-if="deleteTarget"
        :title="'Delete ' + (deleteTarget.type === 'task' ? 'Task' : deleteTarget.type === 'expense' ? 'Expense' : deleteTarget.type === 'payment' ? 'Payment' : deleteTarget.type === 'file' ? 'Attachment' : 'Log')"
        :message="'Are you sure you want to delete ' + deleteTarget.title + '?'"
        @confirm="executeItemDelete"
        @cancel="deleteTarget = null"
      />
    </div>
  `
};
