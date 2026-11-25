/**
 * Projects Views (List, Full-Page Form, and Detail with Inline Kanban/List, Payments, Expenses, Comms & Files)
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
      error: '',
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
  beforeUnmount() {
    clearTimeout(this.searchTimeout);
  },
  methods: {
    async fetchProjects() {
      this.loading = true;
      this.error = '';
      try {
        const response = await window.API.projects.getAll({
          page: this.page,
          per_page: this.perPage,
          search: this.search,
          status: this.statusFilter
        });
        this.projects = response.data?.data || [];
        this.total = response.data?.meta?.total ?? this.projects.length;
      } catch (err) {
        this.error = 'Failed to load projects list.';
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
    goToCreate() {
      window.location.hash = '#/projects/new';
    },
    goToEdit(project) {
      window.location.hash = '#/projects/' + project.id + '/edit';
    },
    confirmDelete(project) {
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
    },
    getStatusDotClass(status) {
      return window.Utils.getStatusDotClass(status);
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <!-- Slim Top Header -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <h1 class="text-sm font-semibold text-ink tracking-tight">Projects</h1>
          <span class="text-xs text-muted tabular-nums">{{ total }} total</span>
        </div>
        <button type="button" @click="goToCreate" class="btn-primary text-xs py-1 px-2.5">
          New Project
        </button>
      </div>

      <!-- Filter Strip -->
      <div class="px-5 sm:px-6 py-3 hairline-b surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <div class="relative w-full sm:w-72">
            <svg class="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              v-model="search"
              @input="handleSearch"
              type="text"
              aria-label="Search projects or clients"
              placeholder="Search projects or clients..."
              class="field-input pl-8 py-1.5 text-xs"
            />
          </div>

          <select
            v-model="statusFilter"
            @change="page = 1; fetchProjects();"
            aria-label="Filter projects by status"
            class="field-input w-full sm:w-44 py-1.5 text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <span class="text-xs text-muted tabular-nums">
          Showing {{ projects.length }} of {{ total }} projects
        </span>
      </div>

      <div class="p-5 sm:p-6">
        <!-- Skeleton Loading -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="n in 6" :key="'prj-sk-' + n" class="surface-card p-5 space-y-3">
            <div class="skeleton-bar h-4 w-24"></div>
            <div class="skeleton-bar h-5 w-3/4"></div>
            <div class="skeleton-bar h-3 w-1/2"></div>
            <div class="skeleton-bar h-2 w-full mt-4"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-5 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-st-red">{{ error }}</p>
          <button type="button" @click="fetchProjects" class="btn-secondary">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="projects.length === 0" class="surface-card p-10 text-center">
          <h2 class="text-sm font-semibold text-ink">No projects found</h2>
          <p class="text-xs text-sub mt-1">
            {{ (search || statusFilter) ? 'Adjust your search term or status filter.' : 'Create a project to start tracking deliverables, tasks, and invoices.' }}
          </p>
          <button type="button" @click="goToCreate" class="btn-primary mt-4">Create Project</button>
        </div>

        <!-- Projects Grid -->
        <div v-else class="space-y-5 animate-in">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <article
              v-for="p in projects"
              :key="p.id"
              class="surface-card hover:border-[var(--border-strong)] transition-colors p-5 flex flex-col justify-between"
            >
              <div>
                <div class="flex items-center justify-between gap-2 mb-3">
                  <span class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] border" :class="getStatusBadgeClass(p.status)">
                    <span class="status-sq" :class="getStatusDotClass(p.status)" aria-hidden="true"></span>
                    <span>{{ p.status }}</span>
                  </span>
                  <div class="flex items-center gap-1">
                    <span class="text-[11px] font-medium text-muted mr-1 tabular-nums">#{{ p.id }}</span>
                    <button
                      type="button"
                      @click="goToEdit(p)"
                      :aria-label="'Edit ' + p.title"
                      class="btn-ghost p-1"
                    >
                      <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button
                      type="button"
                      @click="confirmDelete(p)"
                      :aria-label="'Delete ' + p.title"
                      class="btn-ghost p-1 hover:text-st-red"
                    >
                      <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>

                <h2 class="text-[15px] font-semibold leading-snug line-clamp-1">
                  <a :href="'#/projects/' + p.id" class="text-ink hover:text-accent hover:underline">{{ p.title }}</a>
                </h2>
                <p class="text-xs font-medium text-sub mt-1 truncate">
                  {{ p.client_name || 'Client' }} &bull; {{ p.service_name || 'Service' }}
                </p>

                <p v-if="p.description" class="text-xs text-muted mt-2.5 line-clamp-2 leading-relaxed">
                  {{ p.description }}
                </p>
              </div>

              <div class="mt-4 pt-3.5 hairline-t space-y-2.5">
                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-muted">Tasks</span>
                    <span class="font-semibold text-ink tabular-nums">
                      {{ p.task_completed || 0 }}/{{ p.task_total || 0 }} ({{ p.task_progress || 0 }}%)
                    </span>
                  </div>
                  <div class="w-full h-1.5 surface-subtle rounded-full overflow-hidden">
                    <div
                      class="h-full bg-[#2563eb] rounded-full transition-all duration-300"
                      :style="{ width: (p.task_progress || 0) + '%' }"
                    ></div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-muted">Collected</span>
                    <span class="font-semibold text-st-green tabular-nums">
                      {{ p.total_budget > 0 ? Math.round((p.total_received / p.total_budget) * 100) : 0 }}%
                    </span>
                  </div>
                  <div class="w-full h-1.5 surface-subtle rounded-full overflow-hidden">
                    <div
                      class="h-full bg-[#16a34a] rounded-full transition-all duration-300"
                      :style="{ width: (p.total_budget > 0 ? Math.min(100, (p.total_received / p.total_budget) * 100) : 0) + '%' }"
                    ></div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-1 text-xs">
                  <div>
                    <span class="text-muted block">Budget</span>
                    <span class="font-semibold text-ink tabular-nums">{{ formatCurrency(p.total_budget) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-muted block">Received</span>
                    <span class="font-semibold text-st-green tabular-nums">{{ formatCurrency(p.total_received) }}</span>
                  </div>
                </div>
              </div>
            </article>
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
        client_id: defaultClientId ? parseInt(defaultClientId, 10) : '',
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
  watch: {
    id(newId) {
      this.isEdit = !!newId;
      this.initFormData();
    }
  },
  async mounted() {
    await this.initFormData();
  },
  methods: {
    async initFormData() {
      this.loading = true;
      this.error = '';
      try {
        const [clientsRes, servicesRes] = await Promise.all([
          window.API.clients.getAll({ per_page: 100 }),
          window.API.services.getAll()
        ]);
        this.clients = clientsRes.data?.data || [];
        const allServices = servicesRes.data?.data || [];
        this.services = allServices.filter(s => s.is_active);

        if (this.isEdit) {
          const projectRes = await window.API.projects.getOne(this.id);
          const p = projectRes.data?.data;
          if (p) {
            this.form = {
              client_id: p.client_id,
              service_id: p.service_id || (this.services[0]?.id || allServices[0]?.id || ''),
              title: p.title || '',
              description: p.description || '',
              status: p.status || 'Pending',
              total_budget: p.total_budget || 0,
              start_date: p.start_date || '',
              end_date: p.end_date || ''
            };
          }
        } else {
          if (!this.form.service_id && this.services.length > 0) {
            this.form.service_id = this.services[0].id;
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
      if (!this.form.service_id) {
        this.error = 'Please select a service package';
        return;
      }
      if (this.form.start_date && this.form.end_date && this.form.end_date < this.form.start_date) {
        this.error = 'Target end date cannot be earlier than start date';
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
          window.location.hash = newId ? `#/projects/${newId}` : '#/projects';
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save project';
      } finally {
        this.saving = false;
      }
    },
    handleCancel() {
      window.location.hash = this.isEdit ? `#/projects/${this.id}` : '#/projects';
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-sub">
          <a href="#/projects" class="hover:text-ink">Projects</a>
          <span class="text-muted">/</span>
          <span class="font-semibold text-ink">{{ isEdit ? 'Edit Project' : 'New Project' }}</span>
        </div>
        <button type="button" @click="handleCancel" class="btn-secondary text-xs py-1 px-2.5">Cancel</button>
      </div>

      <div class="p-5 sm:p-6 max-w-3xl w-full mx-auto">
        <div class="surface-card overflow-hidden">
          <div class="px-5 py-4 hairline-b">
            <h1 class="text-base font-bold text-ink">{{ isEdit ? 'Edit Project Details' : 'Create New Project' }}</h1>
            <p class="text-xs text-muted mt-0.5">Configure scope, timeline, assigned client, and contract budget.</p>
          </div>

          <div v-if="loading" class="p-6 space-y-4">
            <div class="skeleton-bar h-9 w-full"></div>
            <div class="skeleton-bar h-9 w-full"></div>
          </div>

          <form v-else @submit.prevent="handleSubmit" class="p-5 sm:p-6 space-y-5">
            <div v-if="error" class="p-3 rounded-[6px] border badge-red text-[13px]">
              {{ error }}
            </div>

            <div>
              <label for="proj-title" class="field-label">Project Title *</label>
              <input id="proj-title" v-model="form.title" type="text" required placeholder="Company Website Redesign & CMS" class="field-input font-medium" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="proj-client" class="field-label">Client *</label>
                <select id="proj-client" v-model.number="form.client_id" required class="field-input">
                  <option value="" disabled>Select Client</option>
                  <option v-for="c in clients" :key="c.id" :value="c.id">
                    {{ c.name }} {{ c.company ? '(' + c.company + ')' : '' }}
                  </option>
                </select>
              </div>

              <div>
                <label for="proj-service" class="field-label">Service Package *</label>
                <select id="proj-service" v-model.number="form.service_id" required class="field-input">
                  <option value="" disabled>Select Service Package</option>
                  <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="proj-status" class="field-label">Project Status</label>
                <select id="proj-status" v-model="form.status" class="field-input">
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div>
                <label for="proj-budget" class="field-label">Total Contract Budget (IDR) *</label>
                <input id="proj-budget" v-model.number="form.total_budget" type="number" min="0" step="50000" required class="field-input tabular-nums font-semibold" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="proj-start" class="field-label">Start Date</label>
                <input id="proj-start" v-model="form.start_date" type="date" class="field-input" />
              </div>

              <div>
                <label for="proj-end" class="field-label">Target End Date</label>
                <input id="proj-end" v-model="form.end_date" type="date" class="field-input" />
              </div>
            </div>

            <div>
              <label for="proj-desc" class="field-label">Project Description &amp; Scope</label>
              <textarea
                id="proj-desc"
                v-model="form.description"
                rows="4"
                placeholder="Scope of work, deliverables, client requirements, milestones..."
                class="field-input leading-relaxed"
              ></textarea>
            </div>

            <div class="pt-4 hairline-t flex items-center justify-end gap-2">
              <button type="button" @click="handleCancel" class="btn-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn-primary">
                <span v-if="saving" class="spinner" aria-hidden="true"></span>
                <span>{{ isEdit ? 'Save Changes' : 'Create Project' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
};

// 3. Project Detail View (Tasks, Kanban, Payments, Expenses, Communications & Files)
window.ProjectDetailView = {
  components: {
    ConfirmModal: window.ConfirmModal
  },
  props: {
    id: { type: Number, required: true },
    initialTab: { type: String, default: 'tasks' }
  },
  data() {
    let savedMode = 'list';
    try {
      const m = localStorage.getItem('clienthub_task_view');
      if (m === 'board' || m === 'list') savedMode = m;
    } catch (e) {}

    return {
      loading: true,
      error: '',
      project: null,
      files: [],
      tasks: [],
      taskStats: { total: 0, completed: 0, in_progress: 0, review: 0, todo: 0, progress_percent: 0 },
      activeTab: this.initialTab || 'tasks',
      showDeleteConfirm: false,
      showRegenerateConfirm: false,
      deleteTarget: null,

      projectStatuses: ['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
      paymentMethods: ['Bank Transfer', 'Cash', 'E-Wallet', 'Credit Card', 'Other'],
      expenseCategories: ['Software', 'Hosting', 'Labor', 'Materials', 'Transportation', 'Other'],

      taskFilter: 'all',

      showAddTaskForm: false,
      showAddPaymentForm: false,
      showAddExpenseForm: false,
      showAddCommForm: false,
      showUploadFileForm: false,

      itemSubmitting: false,
      itemError: '',

      taskForm: {
        title: '',
        description: '',
        priority: 'Medium',
        due_date: '',
        status: 'Todo'
      },

      paymentForm: {
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Bank Transfer',
        status: 'Received',
        notes: ''
      },
      editingPaymentId: null,
      editingPayment: {},

      expenseForm: {
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        category: 'Software',
        notes: ''
      },
      editingExpenseId: null,
      editingExpense: {},

      commForm: {
        type: 'whatsapp',
        direction: 'outgoing',
        subject: '',
        content: '',
        contact_info: ''
      },

      selectedFile: null,
      selectedFileName: '',

      taskViewMode: savedMode,
      kanbanColumns: [
        { id: 'Todo', title: 'To Do', dotClass: 'st-neutral' },
        { id: 'In Progress', title: 'In Progress', dotClass: 'st-blue' },
        { id: 'Review', title: 'Review', dotClass: 'st-amber' },
        { id: 'Completed', title: 'Done', dotClass: 'st-green' }
      ],
      expandedCardId: null,
      editingTask: { title: '', description: '', priority: 'Medium', due_date: '', status: 'Todo' },
      quickAddColumn: null,
      quickAddTitle: ''
    };
  },
  created() {
    this._columnRefs = {};
    this._sortableInstances = [];
    this._isUnmounted = false;
  },
  watch: {
    id() {
      this.destroyKanbanSortable();
      this.expandedCardId = null;
      this.editingPaymentId = null;
      this.editingExpenseId = null;
      this.loadProject();
    },
    initialTab(newTab) {
      if (newTab && ['tasks', 'payments', 'expenses', 'communications', 'files'].includes(newTab)) {
        this.activeTab = newTab;
        this.itemError = '';
      }
    },
    taskViewMode(newMode) {
      try {
        localStorage.setItem('clienthub_task_view', newMode);
      } catch (e) {}
      if (newMode === 'board' && this.activeTab === 'tasks') {
        this.$nextTick(() => this.initKanbanSortable());
      } else {
        this.destroyKanbanSortable();
      }
    },
    activeTab(newTab) {
      if (newTab === 'tasks' && this.taskViewMode === 'board') {
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
    this._isUnmounted = true;
    this.destroyKanbanSortable();
  },
  methods: {
    async loadProject() {
      this.destroyKanbanSortable();
      this.loading = true;
      this.error = '';
      try {
        const [projectRes, filesRes, tasksRes] = await Promise.all([
          window.API.projects.getOne(this.id),
          window.API.projects.getFiles(this.id),
          window.API.projects.getTasks(this.id)
        ]);
        this.project = projectRes.data?.data;
        this.files = filesRes.data?.data || [];
        this.tasks = tasksRes.data?.data?.tasks || [];
        this.taskStats = tasksRes.data?.data?.stats || { total: 0, completed: 0, in_progress: 0, review: 0, todo: 0, progress_percent: 0 };
      } catch (err) {
        this.error = 'Failed to load project details.';
        window.Utils.toast('Failed to load project details', 'error');
      } finally {
        this.loading = false;
      }
      if (!this._isUnmounted && this.project && this.activeTab === 'tasks' && this.taskViewMode === 'board') {
        await this.$nextTick();
        if (!this._isUnmounted) {
          this.initKanbanSortable();
        }
      }
    },
    goToEdit() {
      window.location.hash = `#/projects/${this.id}/edit`;
    },
    selectTab(tab) {
      this.activeTab = tab;
      this.itemError = '';
      const targetHash = `#/projects/${this.id}?tab=${tab}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    },
    async updateProjectStatus(newStatus) {
      try {
        await window.API.projects.update(this.id, { status: newStatus });
        this.project.status = newStatus;
        window.Utils.toast('Project status updated to ' + newStatus, 'success');
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to update status', 'error');
      }
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
      const baseDir = window.location.pathname.replace(/\/index\.html$/i, '').replace(/\/+$/, '');
      return `${origin}${baseDir}/portal.html?token=${this.project.portal_token}`;
    },
    copyPortalLink() {
      const url = this.getPortalUrl();
      if (!url) return;
      navigator.clipboard.writeText(url).then(() => {
        window.Utils.toast('Client Portal link copied to clipboard', 'success');
      }).catch(() => {
        window.Utils.toast('Portal URL: ' + url, 'info');
      });
    },
    previewPortal() {
      const url = this.getPortalUrl();
      if (url) {
        window.open(url, '_blank');
      }
    },
    async togglePortalEnabled() {
      const nextVal = this.project.portal_enabled ? 0 : 1;
      try {
        await window.API.projects.update(this.id, { portal_enabled: nextVal });
        this.project.portal_enabled = nextVal;
        window.Utils.toast(nextVal ? 'Client portal enabled' : 'Client portal paused', 'success');
      } catch (err) {
        window.Utils.toast('Failed to update portal visibility', 'error');
      }
    },
    async executeRegeneratePortalLink() {
      try {
        const res = await window.API.projects.regeneratePortalToken(this.id);
        if (res.data?.data?.portal_token) {
          this.project.portal_token = res.data.data.portal_token;
          window.Utils.toast('New Client Portal link generated', 'success');
        }
      } catch (err) {
        window.Utils.toast('Failed to regenerate link', 'error');
      } finally {
        this.showRegenerateConfirm = false;
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
    startEditPayment(pay) {
      if (this.editingPaymentId === pay.id) {
        this.editingPaymentId = null;
        return;
      }
      this.editingPaymentId = pay.id;
      this.editingPayment = {
        amount: pay.amount,
        payment_date: pay.payment_date,
        payment_method: pay.payment_method || 'Bank Transfer',
        status: pay.status || 'Received',
        notes: pay.notes || ''
      };
    },
    async saveEditPayment(payId) {
      if (!this.editingPayment.amount || this.editingPayment.amount <= 0) {
        window.Utils.toast('Amount must be greater than 0', 'error');
        return;
      }
      try {
        await window.API.projects.updatePayment(payId, this.editingPayment);
        this.editingPaymentId = null;
        window.Utils.toast('Payment updated', 'success');
        await this.loadProject();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to update payment', 'error');
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
    startEditExpense(exp) {
      if (this.editingExpenseId === exp.id) {
        this.editingExpenseId = null;
        return;
      }
      this.editingExpenseId = exp.id;
      this.editingExpense = {
        description: exp.description,
        amount: exp.amount,
        expense_date: exp.expense_date,
        category: exp.category || 'Other',
        notes: exp.notes || ''
      };
    },
    async saveEditExpense(expId) {
      if (!this.editingExpense.description?.trim() || !this.editingExpense.amount || this.editingExpense.amount <= 0) {
        window.Utils.toast('Description and positive amount are required', 'error');
        return;
      }
      try {
        await window.API.projects.updateExpense(expId, this.editingExpense);
        this.editingExpenseId = null;
        window.Utils.toast('Expense updated', 'success');
        await this.loadProject();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to update expense', 'error');
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
        if (file.size > 10485760) {
          this.itemError = 'File exceeds maximum 10MB limit';
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
          if (this.expandedCardId === this.deleteTarget.id) this.expandedCardId = null;
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
    getStatusBadgeClass(status) {
      return window.Utils.getStatusBadgeClass(status);
    },
    getPaymentStatusBadgeClass(status) {
      return window.Utils.getPaymentStatusBadgeClass(status);
    },
    getPriorityClass(p) {
      return window.Utils.getPriorityBadgeClass(p);
    },
    isOverdue(dueDate, status) {
      return window.Utils.isOverdue(dueDate, status);
    },

    // KANBAN METHODS
    getColumnTasks(status) {
      return this.tasks
        .filter(t => t.status === status)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));
    },
    setColumnRef(colId, el) {
      if (!this._columnRefs) this._columnRefs = {};
      if (el) {
        this._columnRefs[colId] = el;
      } else {
        delete this._columnRefs[colId];
      }
    },
    initKanbanSortable() {
      this.destroyKanbanSortable();
      if (this._isUnmounted) return;

      this.$nextTick(() => {
        if (this._isUnmounted || this.activeTab !== 'tasks' || this.taskViewMode !== 'board') return;
        this.kanbanColumns.forEach(col => {
          const el = (this._columnRefs || {})[col.id];
          if (!el || !el.isConnected) return;
          if (typeof Sortable.get === 'function') {
            const existing = Sortable.get(el);
            if (existing && existing.el) {
              try {
                existing.destroy();
              } catch (e) {}
            }
          }

          const instance = new Sortable(el, {
            group: 'project-kanban',
            animation: 150,
            ghostClass: 'kanban-ghost',
            chosenClass: 'kanban-chosen',
            dragClass: 'kanban-drag',
            filter: 'input, textarea, select, button, a, .kanban-no-drag',
            preventOnFilter: false,
            onEnd: (evt) => {
              const taskId = parseInt(evt.item.dataset.id, 10);
              const toStatus = evt.to.dataset.status;
              const newIndex = evt.newIndex;
              this.handleCardDrop(taskId, toStatus, newIndex);
            }
          });
          this._sortableInstances.push(instance);
        });
      });
    },
    destroyKanbanSortable() {
      (this._sortableInstances || []).forEach(s => {
        if (s && s.el) {
          try {
            s.destroy();
          } catch (e) {}
        }
      });
      this._sortableInstances = [];
    },
    async handleCardDrop(taskId, toStatus, newIndex) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      const snapshot = JSON.parse(JSON.stringify(this.tasks));
      const targetTasks = this.tasks
        .filter(t => t.status === toStatus && t.id !== taskId)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));

      let newOrder = 1000.0;
      let needsRebalance = false;

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
        if (Math.abs(next - prev) < 0.001) {
          needsRebalance = true;
        }
      }

      task.status = toStatus;
      task.order_index = newOrder;
      if (toStatus === 'Completed') {
        task.completed_at = task.completed_at || new Date().toISOString().slice(0, 19).replace('T', ' ');
      } else {
        task.completed_at = null;
      }

      try {
        await window.API.tasks.update(taskId, { status: toStatus, order_index: newOrder });
        if (needsRebalance) {
          await this.rebalanceColumn(toStatus);
        }
        const res = await window.API.projects.getTasks(this.id);
        this.taskStats = res.data?.data?.stats || this.taskStats;
      } catch (err) {
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
        priority: task.priority || 'Medium',
        due_date: task.due_date || '',
        status: task.status || 'Todo'
      };
    },
    async saveExpandedCard(taskId) {
      if (!this.editingTask.title?.trim()) {
        window.Utils.toast('Task title cannot be empty', 'error');
        return;
      }
      try {
        await window.API.tasks.update(taskId, this.editingTask);
        this.expandedCardId = null;
        window.Utils.toast('Task updated', 'success');
        await this.loadProject();
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
        await this.loadProject();
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
    <div class="flex flex-col min-h-full">
      <!-- Slim Top Breadcrumb & Actions -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-sub min-w-0">
          <a href="#/projects" class="hover:text-ink shrink-0">Projects</a>
          <span class="text-muted shrink-0">/</span>
          <span class="font-semibold text-ink truncate max-w-[240px]">{{ project?.title || ('Project #' + id) }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" @click="goToEdit" class="btn-secondary text-xs py-1 px-2.5">Edit Project</button>
          <button type="button" @click="showDeleteConfirm = true" class="btn-danger text-xs py-1 px-2.5">Delete</button>
        </div>
      </div>

      <div class="p-5 sm:p-6 space-y-5">
        <!-- Skeleton Loading -->
        <div v-if="loading" class="space-y-4">
          <div class="surface-card p-6 space-y-3">
            <div class="skeleton-bar h-6 w-64"></div>
            <div class="skeleton-bar h-4 w-48"></div>
            <div class="skeleton-bar h-3 w-full"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-5 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-st-red">{{ error }}</p>
          <button type="button" @click="loadProject" class="btn-secondary">Retry</button>
        </div>

        <div v-else-if="project" class="space-y-5 animate-in">
          <!-- Project Summary Header -->
          <div class="surface-card p-5 sm:p-6">
            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
              <div class="min-w-0">
                <div class="flex items-center gap-2.5 flex-wrap mb-2">
                  <select
                    :value="project.status"
                    @change="updateProjectStatus($event.target.value)"
                    aria-label="Project status"
                    class="text-xs font-semibold px-2.5 py-0.5 rounded-[4px] border"
                    :class="getStatusBadgeClass(project.status)"
                  >
                    <option v-for="s in projectStatuses" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <span class="text-xs font-medium text-muted">{{ project.service_name || 'Custom Service' }}</span>
                </div>
                <h1 class="text-xl sm:text-2xl font-bold text-ink tracking-tight">{{ project.title }}</h1>
                <p class="text-[13px] text-sub mt-1">
                  Client: <a :href="'#/clients/' + project.client_id" class="text-ink font-semibold hover:text-accent hover:underline">{{ project.client_name }}</a>
                  <span v-if="project.client_company"> ({{ project.client_company }})</span>
                </p>
              </div>

              <!-- Flat Inline Financial Summary -->
              <div class="grid grid-cols-3 gap-5 lg:border-l hairline lg:pl-6 shrink-0">
                <div>
                  <p class="text-xs font-medium text-muted">Total Contract</p>
                  <p class="text-sm sm:text-base font-bold text-ink tabular-nums mt-0.5">{{ formatCurrency(project.total_budget) }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-muted">Collected</p>
                  <p class="text-sm sm:text-base font-bold text-st-green tabular-nums mt-0.5">{{ formatCurrency(project.total_received) }}</p>
                </div>
                <div>
                  <p class="text-xs font-medium text-muted">Expenses</p>
                  <p class="text-sm sm:text-base font-bold text-st-red tabular-nums mt-0.5">{{ formatCurrency(project.total_expenses) }}</p>
                </div>
              </div>
            </div>

            <!-- Dual Progress Indicators -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-4 hairline-t">
              <div>
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="font-medium text-sub">Work Execution Progress</span>
                  <span class="font-semibold text-ink tabular-nums">{{ taskStats.progress_percent }}% ({{ taskStats.completed }}/{{ taskStats.total }} tasks)</span>
                </div>
                <div class="w-full h-1.5 surface-subtle rounded-full overflow-hidden">
                  <div class="h-full bg-[#2563eb] rounded-full transition-all duration-300" :style="{ width: taskStats.progress_percent + '%' }"></div>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs mb-1.5">
                  <span class="font-medium text-sub">Payment Collection</span>
                  <span class="font-semibold text-st-green tabular-nums">
                    {{ project.total_budget > 0 ? Math.round((project.total_received / project.total_budget) * 100) : 0 }}%
                  </span>
                </div>
                <div class="w-full h-1.5 surface-subtle rounded-full overflow-hidden">
                  <div class="h-full bg-[#16a34a] rounded-full transition-all duration-300" :style="{ width: (project.total_budget > 0 ? Math.min(100, (project.total_received / project.total_budget) * 100) : 0) + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3.5 hairline-t flex flex-wrap items-center gap-6 text-xs text-sub">
              <span>Start: <strong class="text-ink">{{ formatDate(project.start_date) }}</strong></span>
              <span>Target End: <strong class="text-ink">{{ formatDate(project.end_date) }}</strong></span>
            </div>
            <p v-if="project.description" class="mt-3 text-[13px] text-sub leading-relaxed whitespace-pre-line">
              {{ project.description }}
            </p>
          </div>

          <!-- CLIENT PORTAL SHARE BAR -->
          <div class="surface-subtle border hairline rounded-[8px] px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="status-sq" :class="project.portal_enabled ? 'st-green' : 'st-amber'" aria-hidden="true"></span>
                <span class="text-xs font-semibold" :class="project.portal_enabled ? 'text-st-green' : 'text-st-amber'">
                  {{ project.portal_enabled ? 'Portal Active' : 'Portal Paused' }}
                </span>
                <span class="text-xs text-muted">&bull;</span>
                <h2 class="text-sm font-semibold text-ink">Client Progress Portal</h2>
              </div>
              <p class="text-xs text-sub max-w-2xl">
                Share this token link with {{ project.client_name }} to track milestones, files, and payment receipts without admin login.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2 shrink-0">
              <button type="button" @click="copyPortalLink" class="btn-primary text-xs py-1.5 px-3">
                Copy Link
              </button>
              <button type="button" @click="previewPortal" class="btn-secondary text-xs py-1.5 px-3">
                Preview
              </button>
              <button type="button" @click="togglePortalEnabled" class="btn-secondary text-xs py-1.5 px-3">
                {{ project.portal_enabled ? 'Pause' : 'Enable' }}
              </button>
              <button
                type="button"
                @click="showRegenerateConfirm = true"
                aria-label="Regenerate portal link"
                title="Regenerate or revoke link"
                class="btn-secondary p-1.5"
              >
                <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
            </div>
          </div>

          <!-- Management Tabs Section -->
          <div class="surface-card overflow-hidden">
            <!-- Tab Headers -->
            <div class="hairline-b surface-subtle px-4 sm:px-5 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
              <div class="flex items-center gap-5 overflow-x-auto min-w-0" role="tablist">
                <button
                  type="button"
                  role="tab"
                  @click="selectTab('tasks')"
                  :class="['tab-link', activeTab === 'tasks' ? 'tab-link-active' : '']"
                >
                  Tasks &amp; Milestones ({{ tasks.length }})
                </button>
                <button
                  type="button"
                  role="tab"
                  @click="selectTab('payments')"
                  :class="['tab-link', activeTab === 'payments' ? 'tab-link-active' : '']"
                >
                  Payments ({{ project.recent_payments?.length || 0 }})
                </button>
                <button
                  type="button"
                  role="tab"
                  @click="selectTab('expenses')"
                  :class="['tab-link', activeTab === 'expenses' ? 'tab-link-active' : '']"
                >
                  Expenses ({{ project.recent_expenses?.length || 0 }})
                </button>
                <button
                  type="button"
                  role="tab"
                  @click="selectTab('communications')"
                  :class="['tab-link', activeTab === 'communications' ? 'tab-link-active' : '']"
                >
                  Communications ({{ project.recent_communications?.length || 0 }})
                </button>
                <button
                  type="button"
                  role="tab"
                  @click="selectTab('files')"
                  :class="['tab-link', activeTab === 'files' ? 'tab-link-active' : '']"
                >
                  Deliverables &amp; Files ({{ files.length }})
                </button>
              </div>

              <!-- Tab Action Button -->
              <div class="shrink-0 pb-2.5 md:pb-0 flex justify-end">
                <button v-if="activeTab === 'tasks'" type="button" @click="showAddTaskForm = !showAddTaskForm; itemError = '';" class="btn-primary text-xs py-1 px-2.5">
                  {{ showAddTaskForm ? 'Close Form' : 'Add Task' }}
                </button>
                <button v-else-if="activeTab === 'payments'" type="button" @click="showAddPaymentForm = !showAddPaymentForm; itemError = '';" class="btn-primary text-xs py-1 px-2.5">
                  {{ showAddPaymentForm ? 'Close Form' : 'Add Payment' }}
                </button>
                <button v-else-if="activeTab === 'expenses'" type="button" @click="showAddExpenseForm = !showAddExpenseForm; itemError = '';" class="btn-primary text-xs py-1 px-2.5">
                  {{ showAddExpenseForm ? 'Close Form' : 'Record Expense' }}
                </button>
                <button v-else-if="activeTab === 'communications'" type="button" @click="showAddCommForm = !showAddCommForm; itemError = '';" class="btn-primary text-xs py-1 px-2.5">
                  {{ showAddCommForm ? 'Close Form' : 'Log Interaction' }}
                </button>
                <button v-else-if="activeTab === 'files'" type="button" @click="showUploadFileForm = !showUploadFileForm; itemError = '';" class="btn-primary text-xs py-1 px-2.5">
                  {{ showUploadFileForm ? 'Close Form' : 'Upload File' }}
                </button>
              </div>
            </div>

            <!-- TAB 1: TASKS & MILESTONES -->
            <div v-if="activeTab === 'tasks'">
              <div v-if="showAddTaskForm" class="p-5 surface-subtle hairline-b animate-in">
                <h3 class="text-xs font-semibold text-ink mb-3.5">Create Project Task / Milestone</h3>
                <div v-if="itemError" class="mb-3 p-2.5 rounded-[6px] border badge-red text-xs">{{ itemError }}</div>

                <form @submit.prevent="handleSaveTask" class="space-y-3.5">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div class="sm:col-span-2">
                      <label for="new-task-title" class="field-label">Task Title *</label>
                      <input id="new-task-title" v-model="taskForm.title" type="text" required placeholder="Wireframe & User Flow Approval" class="field-input font-medium" />
                    </div>
                    <div>
                      <label for="new-task-priority" class="field-label">Priority</label>
                      <select id="new-task-priority" v-model="taskForm.priority" class="field-input">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label for="new-task-due" class="field-label">Target Due Date</label>
                      <input id="new-task-due" v-model="taskForm.due_date" type="date" class="field-input" />
                    </div>
                    <div>
                      <label for="new-task-status" class="field-label">Initial Status</label>
                      <select id="new-task-status" v-model="taskForm.status" class="field-input">
                        <option value="Todo">Todo (Not Started)</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label for="new-task-desc" class="field-label">Description &amp; Deliverables</label>
                    <textarea id="new-task-desc" v-model="taskForm.description" rows="2" placeholder="Requirements, checklist items, or links..." class="field-input"></textarea>
                  </div>

                  <div class="flex items-center justify-end gap-2 pt-1">
                    <button type="button" @click="showAddTaskForm = false" class="btn-secondary text-xs">Cancel</button>
                    <button type="submit" :disabled="itemSubmitting" class="btn-primary text-xs">
                      <span v-if="itemSubmitting" class="spinner" aria-hidden="true"></span>
                      <span>Save Task</span>
                    </button>
                  </div>
                </form>
              </div>

              <!-- View Mode Switcher & Filter Toolbar -->
              <div class="px-4 sm:px-5 py-2.5 surface-canvas hairline-b flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="taskViewMode = 'list'"
                    :class="[taskViewMode === 'list' ? 'btn-primary' : 'btn-secondary', 'text-xs py-1 px-2.5']"
                  >
                    List
                  </button>
                  <button
                    type="button"
                    @click="taskViewMode = 'board'"
                    :class="[taskViewMode === 'board' ? 'btn-primary' : 'btn-secondary', 'text-xs py-1 px-2.5']"
                  >
                    Board
                  </button>
                </div>

                <div v-if="taskViewMode === 'list'" class="flex items-center gap-1.5">
                  <button type="button" @click="taskFilter = 'all'" :class="[taskFilter === 'all' ? 'surface-active text-ink font-semibold' : 'text-sub', 'px-2.5 py-1 text-xs rounded-[5px]']">
                    All ({{ tasks.length }})
                  </button>
                  <button type="button" @click="taskFilter = 'active'" :class="[taskFilter === 'active' ? 'surface-active text-ink font-semibold' : 'text-sub', 'px-2.5 py-1 text-xs rounded-[5px]']">
                    Active ({{ tasks.length - taskStats.completed }})
                  </button>
                  <button type="button" @click="taskFilter = 'completed'" :class="[taskFilter === 'completed' ? 'surface-active text-ink font-semibold' : 'text-sub', 'px-2.5 py-1 text-xs rounded-[5px]']">
                    Completed ({{ taskStats.completed }})
                  </button>
                </div>
              </div>

              <!-- List View -->
              <div v-if="taskViewMode === 'list'" class="divide-hairline">
                <div v-if="filteredTasks.length === 0" class="p-10 text-center">
                  <p class="text-xs font-medium text-sub">No tasks in this view.</p>
                  <button type="button" @click="showAddTaskForm = true" class="btn-secondary text-xs mt-3">Add First Task</button>
                </div>
                <div v-for="t in filteredTasks" :key="t.id" class="p-4 row-hover">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        @click="toggleTask(t)"
                        :aria-label="'Mark ' + t.title + (t.status === 'Completed' ? ' incomplete' : ' complete')"
                        :class="['w-5 h-5 mt-0.5 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors', t.status === 'Completed' ? 'bg-[#16a34a] border-[#16a34a] text-white' : 'border-[var(--border-strong)] surface-canvas']"
                      >
                        <svg v-if="t.status === 'Completed'" class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>

                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            @click="expandCard(t)"
                            class="text-left text-sm font-semibold hover:text-accent transition-colors"
                            :class="t.status === 'Completed' ? 'line-through text-muted' : 'text-ink'"
                          >
                            {{ t.title }}
                          </button>
                          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border uppercase" :class="getPriorityClass(t.priority)">
                            {{ t.priority }}
                          </span>
                          <span v-if="t.status === 'In Progress'" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border badge-blue">
                            In Progress
                          </span>
                          <span v-if="t.status === 'Review'" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border badge-amber">
                            Review
                          </span>
                          <span v-if="isOverdue(t.due_date, t.status)" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] border badge-red">
                            Overdue
                          </span>
                        </div>

                        <p v-if="t.description" class="text-xs text-sub mt-1 leading-relaxed">{{ t.description }}</p>
                        <p v-if="t.due_date" class="text-[11px] text-muted mt-1.5 tabular-nums" :class="{ 'text-st-red font-semibold': isOverdue(t.due_date, t.status) }">
                          Due: {{ formatDate(t.due_date) }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      <button type="button" @click="expandCard(t)" :aria-label="'Edit ' + t.title" class="btn-ghost p-1.5">
                        <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button type="button" @click="deleteTarget = { type: 'task', id: t.id, title: t.title }" :aria-label="'Delete ' + t.title" class="btn-ghost p-1.5 hover:text-st-red">
                        <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Inline Edit Panel for List View -->
                  <div v-if="expandedCardId === t.id" class="mt-3 ml-8 p-3.5 surface-subtle border hairline rounded-[6px] space-y-2.5 animate-in">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input v-model="editingTask.title" aria-label="Task title" class="field-input sm:col-span-2" placeholder="Task title">
                      <select v-model="editingTask.status" aria-label="Task status" class="field-input font-medium">
                        <option value="Todo">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <textarea v-model="editingTask.description" aria-label="Task description" rows="2" class="field-input" placeholder="Description (optional)"></textarea>
                    <div class="flex flex-wrap items-center justify-between gap-2.5">
                      <div class="flex items-center gap-2">
                        <select v-model="editingTask.priority" aria-label="Task priority" class="field-input w-auto py-1 text-xs">
                          <option value="Low">Low Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="High">High Priority</option>
                        </select>
                        <input v-model="editingTask.due_date" aria-label="Task due date" type="date" class="field-input w-auto py-1 text-xs">
                      </div>
                      <div class="flex items-center gap-2">
                        <button type="button" @click="cancelExpandCard" class="btn-secondary text-xs py-1 px-2.5">Cancel</button>
                        <button type="button" @click="saveExpandedCard(t.id)" class="btn-primary text-xs py-1 px-3">Save Changes</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Kanban Board View -->
              <div v-else class="p-4 sm:p-5 overflow-x-auto lg:overflow-x-visible">
                <div class="flex lg:grid lg:grid-cols-4 items-start gap-3.5 min-h-[460px] snap-x snap-mandatory">
                  <div
                    v-for="col in kanbanColumns"
                    :key="col.id"
                    class="w-[82vw] sm:w-72 lg:w-auto min-w-0 snap-center shrink-0 surface-subtle border hairline rounded-[8px] flex flex-col max-h-[600px]"
                  >
                    <div class="px-3.5 py-2.5 flex items-center justify-between hairline-b">
                      <div class="flex items-center gap-2">
                        <span class="status-sq" :class="col.dotClass" aria-hidden="true"></span>
                        <h3 class="text-xs font-semibold text-ink">{{ col.title }}</h3>
                      </div>
                      <span class="text-xs font-semibold text-muted tabular-nums">{{ getColumnTasks(col.id).length }}</span>
                    </div>

                    <div :ref="(el) => setColumnRef(col.id, el)" :data-status="col.id" class="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[100px]">
                      <div
                        v-for="task in getColumnTasks(col.id)"
                        :key="task.id"
                        :data-id="task.id"
                        class="surface-card hover:border-[var(--border-strong)] transition-colors cursor-grab active:cursor-grabbing"
                      >
                        <div class="p-3">
                          <div class="flex items-center justify-between mb-1.5">
                            <div class="flex items-center gap-1.5">
                              <span class="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-[4px] border" :class="getPriorityClass(task.priority)">
                                {{ task.priority }}
                              </span>
                              <span v-if="isOverdue(task.due_date, task.status)" class="px-1.5 py-0.5 text-[10px] font-semibold uppercase rounded-[4px] border badge-red">
                                Overdue
                              </span>
                            </div>
                            <span class="text-[11px] text-muted tabular-nums">#{{ task.id }}</span>
                          </div>
                          <button
                            type="button"
                            @click="expandCard(task)"
                            class="text-left text-[13px] font-semibold leading-snug hover:text-accent block w-full"
                            :class="task.status === 'Completed' ? 'line-through text-muted' : 'text-ink'"
                          >
                            {{ task.title }}
                          </button>
                          <p v-if="task.description" class="text-xs text-sub mt-1 line-clamp-2 leading-relaxed">{{ task.description }}</p>
                          <div class="mt-2.5 pt-2 hairline-t flex items-center justify-between text-[11px] text-muted tabular-nums">
                            <span v-if="task.due_date" :class="{ 'text-st-red font-semibold': isOverdue(task.due_date, task.status) }">
                              {{ task.due_date }}
                            </span>
                            <span v-else>No deadline</span>
                            <span v-if="task.completed_at" class="text-st-green font-semibold">Done {{ task.completed_at.slice(0, 10) }}</span>
                          </div>
                        </div>

                        <!-- Expanded Inline Edit Form -->
                        <div v-if="expandedCardId === task.id" class="kanban-no-drag hairline-t p-3 surface-subtle rounded-b-[8px] space-y-2 cursor-default" @click.stop>
                          <input v-model="editingTask.title" aria-label="Task title" class="field-input" placeholder="Task title">
                          <textarea v-model="editingTask.description" aria-label="Task description" rows="2" class="field-input text-xs" placeholder="Description (optional)"></textarea>
                          <div class="grid grid-cols-2 gap-2">
                            <select v-model="editingTask.priority" aria-label="Priority" class="field-input text-xs py-1">
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                            <input v-model="editingTask.due_date" aria-label="Due date" type="date" class="field-input text-xs py-1">
                          </div>
                          <select v-model="editingTask.status" aria-label="Status" class="field-input text-xs py-1">
                            <option value="Todo">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Review">Review</option>
                            <option value="Completed">Done</option>
                          </select>
                          <div class="flex items-center justify-between gap-2 pt-1">
                            <button type="button" @click.stop="deleteTarget = { type: 'task', id: task.id, title: task.title }" class="btn-danger text-xs py-1 px-2">Delete</button>
                            <div class="flex gap-1.5">
                              <button type="button" @click.stop="cancelExpandCard" class="btn-secondary text-xs py-1 px-2.5">Cancel</button>
                              <button type="button" @click.stop="saveExpandedCard(task.id)" class="btn-primary text-xs py-1 px-2.5">Save</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Quick Add Footer -->
                    <div class="p-2 hairline-t">
                      <div v-if="quickAddColumn === col.id" class="p-1.5 space-y-2">
                        <input
                          :ref="'quickadd_' + col.id"
                          v-model="quickAddTitle"
                          aria-label="New task title"
                          @keyup.enter="submitQuickAdd(col.id)"
                          @keyup.esc="cancelQuickAdd"
                          class="field-input"
                          placeholder="Task title..."
                        >
                        <div class="flex gap-1.5">
                          <button type="button" @click="submitQuickAdd(col.id)" class="btn-primary flex-1 text-xs py-1">Add</button>
                          <button type="button" @click="cancelQuickAdd" class="btn-secondary text-xs py-1 px-2.5">Cancel</button>
                        </div>
                      </div>
                      <button v-else type="button" @click="openQuickAdd(col.id)" class="btn-ghost w-full justify-start text-xs py-1.5">
                        <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 2: PAYMENTS -->
            <div v-else-if="activeTab === 'payments'">
              <div v-if="showAddPaymentForm" class="p-5 surface-subtle hairline-b animate-in">
                <h3 class="text-xs font-semibold text-ink mb-3.5">Record New Payment</h3>
                <div v-if="itemError" class="mb-3 p-2.5 rounded-[6px] border badge-red text-xs">{{ itemError }}</div>

                <form @submit.prevent="handleSavePayment" class="space-y-3.5">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label for="pay-amount" class="field-label">Amount (IDR) *</label>
                      <input id="pay-amount" v-model.number="paymentForm.amount" type="number" min="1" required placeholder="5000000" class="field-input tabular-nums font-semibold" />
                    </div>
                    <div>
                      <label for="pay-date" class="field-label">Payment Date</label>
                      <input id="pay-date" v-model="paymentForm.payment_date" type="date" required class="field-input" />
                    </div>
                    <div>
                      <label for="pay-status" class="field-label">Status</label>
                      <select id="pay-status" v-model="paymentForm.status" class="field-input">
                        <option value="Received">Received</option>
                        <option value="Pending">Pending</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label for="pay-method" class="field-label">Payment Method</label>
                      <select id="pay-method" v-model="paymentForm.payment_method" class="field-input">
                        <option v-for="m in paymentMethods" :key="m" :value="m">{{ m }}</option>
                      </select>
                    </div>
                    <div>
                      <label for="pay-notes" class="field-label">Notes / Transaction Ref</label>
                      <input id="pay-notes" v-model="paymentForm.notes" type="text" placeholder="DP 50%, Invoice #001" class="field-input" />
                    </div>
                  </div>

                  <div class="flex items-center justify-end gap-2 pt-1">
                    <button type="button" @click="showAddPaymentForm = false" class="btn-secondary text-xs">Cancel</button>
                    <button type="submit" :disabled="itemSubmitting" class="btn-primary text-xs">
                      <span v-if="itemSubmitting" class="spinner" aria-hidden="true"></span>
                      <span>Save Payment</span>
                    </button>
                  </div>
                </form>
              </div>

              <div class="divide-hairline">
                <div v-if="!project.recent_payments || project.recent_payments.length === 0" class="p-10 text-center">
                  <p class="text-xs font-medium text-sub">No payments recorded yet for this project.</p>
                  <button type="button" @click="showAddPaymentForm = true" class="btn-secondary text-xs mt-3">Record Payment</button>
                </div>
                <div v-for="pay in project.recent_payments" :key="pay.id" class="p-4 row-hover">
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-2.5">
                        <p class="font-bold text-ink text-sm tabular-nums">{{ formatCurrency(pay.amount) }}</p>
                        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-[4px] border" :class="getPaymentStatusBadgeClass(pay.status)">
                          {{ pay.status }}
                        </span>
                      </div>
                      <p class="text-xs text-sub mt-1">
                        {{ pay.payment_method || 'Payment' }} &bull; {{ formatDate(pay.payment_date) }}
                        <span v-if="pay.notes" class="text-muted"> &bull; {{ pay.notes }}</span>
                      </p>
                    </div>

                    <div class="flex items-center gap-1 shrink-0">
                      <button type="button" @click="startEditPayment(pay)" aria-label="Edit payment" class="btn-ghost p-1.5">
                        <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button type="button" @click="deleteTarget = { type: 'payment', id: pay.id, title: 'Payment of ' + formatCurrency(pay.amount) }" aria-label="Delete payment" class="btn-ghost p-1.5 hover:text-st-red">
                        <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Inline Edit Payment -->
                  <div v-if="editingPaymentId === pay.id" class="mt-3 p-3.5 surface-subtle border hairline rounded-[6px] space-y-2.5 animate-in">
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <input v-model.number="editingPayment.amount" aria-label="Amount" type="number" min="1" class="field-input text-xs font-semibold tabular-nums" placeholder="Amount">
                      <input v-model="editingPayment.payment_date" aria-label="Payment date" type="date" class="field-input text-xs">
                      <select v-model="editingPayment.payment_method" aria-label="Payment method" class="field-input text-xs">
                        <option v-for="m in paymentMethods" :key="m" :value="m">{{ m }}</option>
                      </select>
                      <select v-model="editingPayment.status" aria-label="Payment status" class="field-input text-xs font-medium">
                        <option value="Received">Received</option>
                        <option value="Pending">Pending</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <input v-model="editingPayment.notes" aria-label="Payment notes" type="text" class="field-input flex-1 text-xs" placeholder="Notes / reference">
                      <div class="flex items-center justify-end gap-2">
                        <button type="button" @click="editingPaymentId = null" class="btn-secondary text-xs py-1 px-2.5">Cancel</button>
                        <button type="button" @click="saveEditPayment(pay.id)" class="btn-primary text-xs py-1 px-3">Save</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 3: EXPENSES -->
            <div v-else-if="activeTab === 'expenses'">
              <div v-if="showAddExpenseForm" class="p-5 surface-subtle hairline-b animate-in">
                <h3 class="text-xs font-semibold text-ink mb-3.5">Record New Expense</h3>
                <div v-if="itemError" class="mb-3 p-2.5 rounded-[6px] border badge-red text-xs">{{ itemError }}</div>

                <form @submit.prevent="handleSaveExpense" class="space-y-3.5">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div class="sm:col-span-2">
                      <label for="exp-desc" class="field-label">Expense Description *</label>
                      <input id="exp-desc" v-model="expenseForm.description" type="text" required placeholder="Hosting setup, Theme license" class="field-input" />
                    </div>
                    <div>
                      <label for="exp-cat" class="field-label">Category</label>
                      <select id="exp-cat" v-model="expenseForm.category" class="field-input">
                        <option v-for="cat in expenseCategories" :key="cat" :value="cat">{{ cat }}</option>
                      </select>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label for="exp-amount" class="field-label">Amount (IDR) *</label>
                      <input id="exp-amount" v-model.number="expenseForm.amount" type="number" min="1" required placeholder="250000" class="field-input tabular-nums font-semibold" />
                    </div>
                    <div>
                      <label for="exp-date" class="field-label">Expense Date</label>
                      <input id="exp-date" v-model="expenseForm.expense_date" type="date" required class="field-input" />
                    </div>
                    <div>
                      <label for="exp-notes" class="field-label">Notes</label>
                      <input id="exp-notes" v-model="expenseForm.notes" type="text" placeholder="Vendor or invoice reference" class="field-input" />
                    </div>
                  </div>

                  <div class="flex items-center justify-end gap-2 pt-1">
                    <button type="button" @click="showAddExpenseForm = false" class="btn-secondary text-xs">Cancel</button>
                    <button type="submit" :disabled="itemSubmitting" class="btn-primary text-xs">
                      <span v-if="itemSubmitting" class="spinner" aria-hidden="true"></span>
                      <span>Save Expense</span>
                    </button>
                  </div>
                </form>
              </div>

              <div class="divide-hairline">
                <div v-if="!project.recent_expenses || project.recent_expenses.length === 0" class="p-10 text-center">
                  <p class="text-xs font-medium text-sub">No expenses recorded yet for this project.</p>
                  <button type="button" @click="showAddExpenseForm = true" class="btn-secondary text-xs mt-3">Record Expense</button>
                </div>
                <div v-for="exp in project.recent_expenses" :key="exp.id" class="p-4 row-hover">
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-semibold text-ink text-sm">{{ exp.description }}</p>
                        <span class="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border badge-neutral">{{ exp.category }}</span>
                      </div>
                      <p class="text-xs text-sub mt-1">
                        {{ formatDate(exp.expense_date) }}
                        <span v-if="exp.notes" class="text-muted"> &bull; {{ exp.notes }}</span>
                      </p>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="font-bold text-st-red text-sm tabular-nums mr-1">-{{ formatCurrency(exp.amount) }}</span>
                      <button type="button" @click="startEditExpense(exp)" aria-label="Edit expense" class="btn-ghost p-1.5">
                        <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                      </button>
                      <button type="button" @click="deleteTarget = { type: 'expense', id: exp.id, title: exp.description }" aria-label="Delete expense" class="btn-ghost p-1.5 hover:text-st-red">
                        <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Inline Edit Expense -->
                  <div v-if="editingExpenseId === exp.id" class="mt-3 p-3.5 surface-subtle border hairline rounded-[6px] space-y-2.5 animate-in">
                    <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <input v-model="editingExpense.description" aria-label="Description" type="text" class="field-input sm:col-span-2 text-xs" placeholder="Description">
                      <select v-model="editingExpense.category" aria-label="Category" class="field-input text-xs">
                        <option v-for="cat in expenseCategories" :key="cat" :value="cat">{{ cat }}</option>
                      </select>
                      <input v-model.number="editingExpense.amount" aria-label="Amount" type="number" min="1" class="field-input text-xs font-semibold tabular-nums" placeholder="Amount">
                    </div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div class="flex flex-1 gap-2">
                        <input v-model="editingExpense.expense_date" aria-label="Expense date" type="date" class="field-input w-auto text-xs">
                        <input v-model="editingExpense.notes" aria-label="Expense notes" type="text" class="field-input flex-1 text-xs" placeholder="Notes">
                      </div>
                      <div class="flex items-center justify-end gap-2">
                        <button type="button" @click="editingExpenseId = null" class="btn-secondary text-xs py-1 px-2.5">Cancel</button>
                        <button type="button" @click="saveEditExpense(exp.id)" class="btn-primary text-xs py-1 px-3">Save</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 4: COMMUNICATIONS -->
            <div v-else-if="activeTab === 'communications'">
              <div v-if="showAddCommForm" class="p-5 surface-subtle hairline-b animate-in">
                <h3 class="text-xs font-semibold text-ink mb-3.5">Log Interaction / Work Update</h3>
                <div v-if="itemError" class="mb-3 p-2.5 rounded-[6px] border badge-red text-xs">{{ itemError }}</div>

                <form @submit.prevent="handleSaveComm" class="space-y-3.5">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label for="comm-type" class="field-label">Channel</label>
                      <select id="comm-type" v-model="commForm.type" class="field-input">
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="note">Internal / Work Note</option>
                      </select>
                    </div>
                    <div>
                      <label for="comm-dir" class="field-label">Direction</label>
                      <select id="comm-dir" v-model="commForm.direction" class="field-input">
                        <option value="outgoing">Outgoing</option>
                        <option value="incoming">Incoming</option>
                      </select>
                    </div>
                    <div>
                      <label for="comm-subject" class="field-label">Subject</label>
                      <input id="comm-subject" v-model="commForm.subject" type="text" placeholder="Design revision summary" class="field-input" />
                    </div>
                  </div>

                  <div v-if="commForm.type !== 'note'">
                    <label for="comm-contact" class="field-label">Contact Info (Optional)</label>
                    <input id="comm-contact" v-model="commForm.contact_info" type="text" placeholder="Phone number or email address" class="field-input" />
                  </div>

                  <div>
                    <label for="comm-content" class="field-label">Content &amp; Decisions *</label>
                    <textarea id="comm-content" v-model="commForm.content" rows="4" required placeholder="Meeting notes, work progress, or client feedback..." class="field-input leading-relaxed"></textarea>
                  </div>

                  <div class="flex items-center justify-end gap-2 pt-1">
                    <button type="button" @click="showAddCommForm = false" class="btn-secondary text-xs">Cancel</button>
                    <button type="submit" :disabled="itemSubmitting" class="btn-primary text-xs">
                      <span v-if="itemSubmitting" class="spinner" aria-hidden="true"></span>
                      <span>Save Interaction</span>
                    </button>
                  </div>
                </form>
              </div>

              <div class="divide-hairline">
                <div v-if="!project.recent_communications || project.recent_communications.length === 0" class="p-10 text-center">
                  <p class="text-xs font-medium text-sub">No communications logged yet for this project.</p>
                  <button type="button" @click="showAddCommForm = true" class="btn-secondary text-xs mt-3">Log Interaction</button>
                </div>
                <div v-for="comm in project.recent_communications" :key="comm.id" class="p-4 row-hover">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded-[4px] border badge-neutral">{{ comm.type }}</span>
                        <span class="text-xs text-muted">{{ comm.direction }}</span>
                        <span v-if="comm.contact_info" class="text-xs text-sub">({{ comm.contact_info }})</span>
                      </div>
                      <h4 v-if="comm.subject" class="font-semibold text-ink text-sm mt-1.5">{{ comm.subject }}</h4>
                      <p class="text-[13px] text-sub mt-1 leading-relaxed whitespace-pre-line">{{ comm.content }}</p>
                      <p class="text-[11px] text-muted mt-1.5 tabular-nums">{{ formatDateTime(comm.created_at) }}</p>
                    </div>

                    <button type="button" @click="deleteTarget = { type: 'comm', id: comm.id, title: 'Interaction log' }" aria-label="Delete communication" class="btn-ghost p-1.5 hover:text-st-red shrink-0">
                      <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- TAB 5: DELIVERABLES & FILES -->
            <div v-else-if="activeTab === 'files'">
              <div v-if="showUploadFileForm" class="p-5 surface-subtle hairline-b animate-in">
                <h3 class="text-xs font-semibold text-ink mb-3">Upload Deliverable / File (Max 10MB)</h3>
                <div v-if="itemError" class="mb-3 p-2.5 rounded-[6px] border badge-red text-xs">{{ itemError }}</div>

                <div class="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    aria-label="Select deliverable file"
                    @change="handleFileChange"
                    class="block w-full text-xs text-sub file:mr-3 file:py-1.5 file:px-3 file:rounded-[6px] file:border file:border-[var(--border-strong)] file:text-xs file:font-semibold file:bg-[var(--bg-canvas)] file:text-[var(--text-primary)]"
                  />
                  <div class="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button type="button" @click="showUploadFileForm = false" class="btn-secondary text-xs">Cancel</button>
                    <button type="button" :disabled="itemSubmitting || !selectedFile" @click="handleUploadFile" class="btn-primary text-xs">
                      <span v-if="itemSubmitting" class="spinner" aria-hidden="true"></span>
                      <span>Upload Now</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="divide-hairline">
                <div v-if="files.length === 0" class="p-10 text-center">
                  <p class="text-xs font-medium text-sub">No files or deliverables attached to this project yet.</p>
                  <button type="button" @click="showUploadFileForm = true" class="btn-secondary text-xs mt-3">Upload Deliverable</button>
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
                    <button type="button" @click="deleteTarget = { type: 'file', id: f.id, title: f.original_name }" aria-label="Delete attachment" class="btn-ghost p-1.5 hover:text-st-red">
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
        title="Delete Project"
        :message="'Are you sure you want to delete this project and all its records?'"
        @confirm="deleteProject"
        @cancel="showDeleteConfirm = false"
      />

      <confirm-modal
        v-if="showRegenerateConfirm"
        title="Regenerate Portal Link"
        message="Generate a fresh Client Portal link? The previous link shared with the client will stop working immediately."
        confirm-text="Regenerate Link"
        confirm-type="primary"
        @confirm="executeRegeneratePortalLink"
        @cancel="showRegenerateConfirm = false"
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
