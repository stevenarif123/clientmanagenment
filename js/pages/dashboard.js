/**
 * Overview Dashboard View - Plane-Inspired Two-Column Workspace Overview
 */

window.DashboardView = {
  components: {
    StatsCard: window.StatsCard
  },
  data() {
    return {
      loading: true,
      error: '',
      activeTab: 'summary', // 'summary', 'projects', 'clients', 'inquiries'
      data: {
        counts: { clients: 0, projects: 0, active_projects: 0, pending_submissions: 0 },
        task_counts: { total: 0, todo: 0, in_progress: 0, review: 0, completed: 0, overdue: 0 },
        tasks_by_priority: [],
        active_projects_progress: [],
        recent_tasks: [],
        budget: { total_budget: 0, total_expenses: 0, total_received: 0, profit: 0 },
        projects_by_status: [],
        recent_clients: [],
        recent_projects: [],
        recent_submissions: [],
        monthly_revenue: []
      },
      revenueChart: null,
      statusChart: null
    };
  },
  computed: {
    openTasksCount() {
      const tc = this.data.task_counts || {};
      return (tc.todo || 0) + (tc.in_progress || 0) + (tc.review || 0);
    },
    hasMonthlyRevenue() {
      const monthly = this.data.monthly_revenue || [];
      return monthly.some(m => Number(m.total ?? m.revenue ?? 0) > 0);
    },
    totalTasksCount() {
      return Number(this.data.task_counts?.total || 0);
    },
    adminInitial() {
      return (this.$root.auth.admin?.username || 'A').charAt(0).toUpperCase();
    },
    localTimezone() {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
      } catch (e) {
        return 'Local';
      }
    },
    formattedToday() {
      try {
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
      } catch (e) {
        return new Date().toISOString().slice(0, 10);
      }
    },
    workloadCards() {
      const tc = this.data.task_counts || {};
      return [
        { label: 'To Do', count: tc.todo || 0, dot: 'st-neutral' },
        { label: 'In Progress', count: tc.in_progress || 0, dot: 'st-blue' },
        { label: 'Review', count: tc.review || 0, dot: 'st-amber' },
        { label: 'Completed', count: tc.completed || 0, dot: 'st-green' },
        { label: 'Overdue', count: tc.overdue || 0, dot: 'st-red' }
      ];
    },
    taskStateBreakdown() {
      const tc = this.data.task_counts || {};
      return [
        { label: 'To Do', count: tc.todo || 0, dot: 'st-neutral', color: '#6b7280' },
        { label: 'In Progress', count: tc.in_progress || 0, dot: 'st-blue', color: '#2563eb' },
        { label: 'Review', count: tc.review || 0, dot: 'st-amber', color: '#d97706' },
        { label: 'Completed', count: tc.completed || 0, dot: 'st-green', color: '#16a34a' }
      ];
    }
  },
  async mounted() {
    this._onThemeChange = async () => {
      if (this.activeTab === 'summary' && !this.loading) {
        await this.$nextTick();
        this.renderCharts();
      }
    };
    window.addEventListener('clienthub-theme-change', this._onThemeChange);
    await this.fetchDashboard();
  },
  beforeUnmount() {
    window.removeEventListener('clienthub-theme-change', this._onThemeChange);
    this.destroyCharts();
  },
  methods: {
    destroyCharts() {
      if (this.revenueChart) {
        this.revenueChart.destroy();
        this.revenueChart = null;
      }
      if (this.statusChart) {
        this.statusChart.destroy();
        this.statusChart = null;
      }
    },
    async switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'summary' && !this.loading && !this.error) {
        await this.$nextTick();
        this.renderCharts();
      } else {
        this.destroyCharts();
      }
    },
    async fetchDashboard() {
      this.loading = true;
      this.error = '';
      let loaded = false;
      try {
        const response = await window.API.reports.getDashboard();
        this.data = response.data.data;
        loaded = true;
      } catch (err) {
        this.error = 'Failed to load workspace overview data. Check your API connection and try again.';
        console.error(err);
      } finally {
        this.loading = false;
      }
      if (loaded && this.activeTab === 'summary') {
        await this.$nextTick();
        this.renderCharts();
      }
    },
    formatMonthLabel(ym) {
      if (!ym || !ym.includes('-')) return ym;
      const [year, month] = ym.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return isNaN(d.getTime()) ? ym : d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    },
    renderCharts() {
      if (!window.Chart) return;
      const isDark = window.Utils.getTheme() === 'dark';
      const tickColor = isDark ? '#939dac' : '#596370';
      const gridColor = isDark ? '#262d3b' : '#e4e6eb';
      const canvasBg = isDark ? '#141820' : '#ffffff';
      const barColor = isDark ? '#3b82f6' : '#2563eb';
      const barHover = isDark ? '#60a5fa' : '#1d4ed8';

      // 1. Revenue Collected Chart
      const revCtx = document.getElementById('dashboardRevenueChart');
      if (revCtx && this.hasMonthlyRevenue) {
        if (this.revenueChart) this.revenueChart.destroy();
        const monthly = this.data.monthly_revenue || [];
        const labels = monthly.map(m => this.formatMonthLabel(m.month));
        const values = monthly.map(m => Number(m.total ?? m.revenue ?? 0));

        this.revenueChart = new Chart(revCtx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Revenue (IDR)',
              data: values,
              backgroundColor: barColor,
              hoverBackgroundColor: barHover,
              borderRadius: 4,
              maxBarThickness: 38
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => window.Utils.formatCurrency(ctx.parsed.y)
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 11, family: 'Public Sans, sans-serif' }, color: tickColor }
              },
              y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: gridColor },
                ticks: {
                  font: { size: 11, family: 'Public Sans, sans-serif' },
                  color: tickColor,
                  callback: (value) => {
                    if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
                    if (value >= 1000) return 'Rp ' + (value / 1000).toFixed(0) + 'K';
                    return 'Rp ' + value;
                  }
                }
              }
            }
          }
        });
      }

      // 2. Tasks by State Doughnut Chart
      const statusCtx = document.getElementById('dashboardStatusChart');
      if (statusCtx && this.totalTasksCount > 0) {
        if (this.statusChart) this.statusChart.destroy();
        const breakdown = this.taskStateBreakdown;
        this.statusChart = new Chart(statusCtx, {
          type: 'doughnut',
          data: {
            labels: breakdown.map(s => s.label),
            datasets: [{
              data: breakdown.map(s => s.count),
              backgroundColor: breakdown.map(s => s.color),
              borderWidth: 2,
              borderColor: canvasBg
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.label}: ${ctx.parsed} tasks`
                }
              }
            }
          }
        });
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
    getInitials(name) {
      return window.Utils.getInitials(name);
    },
    getStatusDotClass(status) {
      return window.Utils.getStatusDotClass(status);
    },
    getStatusBadgeClass(status) {
      return window.Utils.getStatusBadgeClass(status);
    },
    getSubmissionStatusBadgeClass(status) {
      return window.Utils.getSubmissionStatusBadgeClass(status);
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <!-- Slim Top Workspace Bar -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-sub" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <h1 class="text-sm font-semibold text-ink tracking-tight">Overview</h1>
        </div>
        <div class="flex items-center gap-2">
          <a href="#/clients/new" class="btn-secondary text-xs py-1 px-2.5">New Client</a>
          <a href="#/projects/new" class="btn-primary text-xs py-1 px-2.5">New Project</a>
        </div>
      </div>

      <!-- Inline Underline Tabs -->
      <div class="px-5 sm:px-6 hairline-b flex items-center gap-6 overflow-x-auto" role="tablist" aria-label="Overview sections">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'summary' ? 'true' : 'false'"
          @click="switchTab('summary')"
          :class="['tab-link', activeTab === 'summary' ? 'tab-link-active' : '']"
        >
          Summary
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'projects' ? 'true' : 'false'"
          @click="switchTab('projects')"
          :class="['tab-link', activeTab === 'projects' ? 'tab-link-active' : '']"
        >
          Projects ({{ data.counts.projects }})
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'clients' ? 'true' : 'false'"
          @click="switchTab('clients')"
          :class="['tab-link', activeTab === 'clients' ? 'tab-link-active' : '']"
        >
          Clients ({{ data.counts.clients }})
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'inquiries' ? 'true' : 'false'"
          @click="switchTab('inquiries')"
          :class="['tab-link flex items-center gap-1.5', activeTab === 'inquiries' ? 'tab-link-active' : '']"
        >
          <span>Inquiries</span>
          <span v-if="data.counts.pending_submissions > 0" class="px-1.5 py-0.5 text-[10px] font-semibold rounded-[4px] border badge-blue tabular-nums">
            {{ data.counts.pending_submissions }}
          </span>
        </button>
      </div>

      <!-- Two-Column Operational Body -->
      <div class="flex-1 flex flex-col xl:flex-row">
        <!-- Main Operational Column -->
        <div class="flex-1 min-w-0 p-5 sm:p-6">
          <!-- Skeleton Loading State -->
          <div v-if="loading" class="space-y-6" aria-label="Loading overview statistics">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div class="surface-card p-4 space-y-2"><div class="skeleton-bar h-3 w-24"></div><div class="skeleton-bar h-6 w-16"></div></div>
              <div class="surface-card p-4 space-y-2"><div class="skeleton-bar h-3 w-24"></div><div class="skeleton-bar h-6 w-16"></div></div>
              <div class="surface-card p-4 space-y-2"><div class="skeleton-bar h-3 w-24"></div><div class="skeleton-bar h-6 w-28"></div></div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div v-for="n in 5" :key="'sk-w-' + n" class="surface-card p-3.5 space-y-2"><div class="skeleton-bar h-3 w-16"></div><div class="skeleton-bar h-6 w-10"></div></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div class="surface-card p-5 h-64"><div class="skeleton-bar h-full w-full"></div></div>
              <div class="surface-card p-5 h-64"><div class="skeleton-bar h-full w-full"></div></div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="surface-card p-6 border-[var(--st-red-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-st-red">Unable to load overview</p>
              <p class="text-xs text-sub mt-1">{{ error }}</p>
            </div>
            <button type="button" @click="fetchDashboard" class="btn-secondary shrink-0">Retry</button>
          </div>

          <!-- TAB 1: SUMMARY -->
          <div v-else-if="activeTab === 'summary'" class="space-y-6 animate-in">
            <!-- Conditional Pending Inquiries Notice -->
            <div v-if="data.counts.pending_submissions > 0" class="surface-subtle border hairline rounded-[8px] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <span class="status-sq st-blue" aria-hidden="true"></span>
                <p class="text-[13px] font-medium text-ink">
                  <span class="font-semibold tabular-nums">{{ data.counts.pending_submissions }}</span>
                  new contact {{ data.counts.pending_submissions === 1 ? 'inquiry awaits' : 'inquiries await' }} triage from your public form.
                </p>
              </div>
              <a href="#/submissions" class="btn-secondary text-xs py-1 px-2.5 self-start sm:self-auto shrink-0">
                Review Inquiries
              </a>
            </div>

            <!-- Section 1: Overview Metrics -->
            <section aria-labelledby="ov-heading">
              <h2 id="ov-heading" class="section-heading mb-3">Overview</h2>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <stats-card
                  title="Active Projects"
                  :value="data.counts.active_projects"
                  :subtitle="data.counts.projects + ' total projects'"
                  icon="folder"
                />
                <stats-card
                  title="Open Tasks"
                  :value="openTasksCount"
                  :subtitle="(data.task_counts?.total || 0) + ' total across workspace'"
                  icon="tasks"
                />
                <stats-card
                  title="Revenue Received"
                  :value="data.budget.total_received"
                  icon="banknote"
                  :is-currency="true"
                />
              </div>
            </section>

            <!-- Section 2: 5-State Workload -->
            <section aria-labelledby="wl-heading">
              <div class="flex items-center justify-between mb-3">
                <h2 id="wl-heading" class="section-heading">Workload</h2>
                <a href="#/tasks" class="text-xs font-medium text-accent hover:underline">Open Task Board</a>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <a
                  v-for="item in workloadCards"
                  :key="item.label"
                  href="#/tasks"
                  class="surface-card p-3.5 hover:border-[var(--border-strong)] transition-colors block"
                >
                  <div class="flex items-center gap-2">
                    <span class="status-sq" :class="item.dot" aria-hidden="true"></span>
                    <span class="text-xs font-medium text-sub truncate">{{ item.label }}</span>
                  </div>
                  <p class="text-xl font-bold text-ink tabular-nums mt-2">{{ item.count }}</p>
                </a>
              </div>
            </section>

            <!-- Section 3: Charts Grid -->
            <section class="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-label="Workspace analytics">
              <!-- Revenue Chart -->
              <div class="surface-card p-4 sm:p-5 flex flex-col">
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 class="section-heading">Revenue Collected (Last 6 Months)</h2>
                    <p class="text-xs text-muted mt-0.5">Payments marked as Received</p>
                  </div>
                  <a href="#/reports" class="text-xs font-medium text-accent hover:underline shrink-0">Full Report</a>
                </div>

                <div v-if="!hasMonthlyRevenue" class="flex-1 py-10 flex flex-col items-center justify-center text-center">
                  <p class="text-xs font-medium text-sub">No received payments recorded in the last 6 months.</p>
                  <a href="#/projects" class="btn-secondary text-xs py-1 px-2.5 mt-3">Record Payment in Projects</a>
                </div>
                <div v-else class="relative w-full h-56 mt-1">
                  <canvas id="dashboardRevenueChart"></canvas>
                </div>
              </div>

              <!-- Tasks by State -->
              <div class="surface-card p-4 sm:p-5 flex flex-col">
                <div class="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h2 class="section-heading">Tasks by State</h2>
                    <p class="text-xs text-muted mt-0.5">Live milestone count per workflow column</p>
                  </div>
                  <span class="text-xs font-medium text-muted tabular-nums">{{ totalTasksCount }} total</span>
                </div>

                <div v-if="totalTasksCount === 0" class="flex-1 py-10 flex flex-col items-center justify-center text-center">
                  <p class="text-xs font-medium text-sub">No project tasks tracked yet.</p>
                  <a href="#/projects" class="btn-secondary text-xs py-1 px-2.5 mt-3">Create Tasks in a Project</a>
                </div>
                <div v-else class="flex-1 flex flex-col sm:flex-row items-center justify-between gap-5 py-2">
                  <div class="relative w-36 h-36 shrink-0 mx-auto sm:mx-2">
                    <canvas id="dashboardStatusChart"></canvas>
                  </div>
                  <div class="flex-1 w-full space-y-2.5">
                    <div
                      v-for="row in taskStateBreakdown"
                      :key="row.label"
                      class="flex items-center justify-between text-xs py-1 hairline-b last:border-b-0"
                    >
                      <span class="flex items-center gap-2 text-sub font-medium">
                        <span class="status-sq" :class="row.dot" aria-hidden="true"></span>
                        {{ row.label }}
                      </span>
                      <span class="font-semibold text-ink tabular-nums">{{ row.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 4: Recent Activity -->
            <section class="surface-card overflow-hidden" aria-labelledby="ra-heading">
              <div class="px-4 py-3 hairline-b flex items-center justify-between">
                <h2 id="ra-heading" class="section-heading">Recent Activity</h2>
                <a href="#/tasks" class="text-xs font-medium text-accent hover:underline">View Board</a>
              </div>

              <div v-if="data.recent_tasks && data.recent_tasks.length > 0" class="divide-hairline">
                <a
                  v-for="t in data.recent_tasks"
                  :key="'rt-' + t.id"
                  :href="'#/projects/' + t.project_id + '?tab=tasks'"
                  class="px-4 py-2.5 flex items-center justify-between gap-4 row-hover"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="status-sq" :class="getStatusDotClass(t.status)" aria-hidden="true"></span>
                    <div class="min-w-0">
                      <p class="text-[13px] font-medium text-ink truncate">{{ t.title }}</p>
                      <p class="text-xs text-muted truncate">{{ t.project_title || ('Project #' + t.project_id) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border" :class="getStatusBadgeClass(t.status)">
                      {{ t.status === 'Completed' ? 'Done' : t.status }}
                    </span>
                    <span class="text-xs text-muted tabular-nums hidden sm:inline">{{ formatDate(t.updated_at) }}</span>
                  </div>
                </a>
              </div>

              <div v-else-if="data.recent_projects.length > 0" class="divide-hairline">
                <a
                  v-for="p in data.recent_projects"
                  :key="'rp-' + p.id"
                  :href="'#/projects/' + p.id"
                  class="px-4 py-2.5 flex items-center justify-between gap-4 row-hover"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="status-sq" :class="getStatusDotClass(p.status)" aria-hidden="true"></span>
                    <div class="min-w-0">
                      <p class="text-[13px] font-medium text-ink truncate">{{ p.title }}</p>
                      <p class="text-xs text-muted truncate">{{ p.client_name || 'Client' }}</p>
                    </div>
                  </div>
                  <span class="text-xs font-semibold text-ink tabular-nums shrink-0">{{ formatCurrency(p.total_budget) }}</span>
                </a>
              </div>

              <div v-else class="p-8 text-center">
                <p class="text-xs font-medium text-sub">No activity recorded yet.</p>
                <a href="#/projects/new" class="btn-primary text-xs py-1.5 px-3 mt-3">Create First Project</a>
              </div>
            </section>
          </div>

          <!-- TAB 2: PROJECTS PREVIEW -->
          <div v-else-if="activeTab === 'projects'" class="surface-card overflow-hidden animate-in">
            <div class="px-4 py-3 hairline-b flex items-center justify-between">
              <h2 class="section-heading">Recent Projects</h2>
              <a href="#/projects" class="text-xs font-medium text-accent hover:underline">Manage All Projects</a>
            </div>
            <div v-if="data.recent_projects.length === 0" class="p-8 text-center">
              <p class="text-xs font-medium text-sub">No projects created yet.</p>
              <a href="#/projects/new" class="btn-primary text-xs py-1.5 px-3 mt-3">New Project</a>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="hairline-b surface-subtle text-xs font-semibold text-sub">
                    <th class="py-2.5 px-4">Project</th>
                    <th class="py-2.5 px-4">Client</th>
                    <th class="py-2.5 px-4">Status</th>
                    <th class="py-2.5 px-4 text-right">Budget</th>
                  </tr>
                </thead>
                <tbody class="divide-hairline text-[13px]">
                  <tr v-for="p in data.recent_projects" :key="'tp-' + p.id" class="row-hover">
                    <td class="py-2.5 px-4 font-medium text-ink">
                      <a :href="'#/projects/' + p.id" class="hover:text-accent hover:underline">{{ p.title }}</a>
                    </td>
                    <td class="py-2.5 px-4 text-sub">{{ p.client_name || '-' }}</td>
                    <td class="py-2.5 px-4">
                      <span class="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border" :class="getStatusBadgeClass(p.status)">{{ p.status }}</span>
                    </td>
                    <td class="py-2.5 px-4 text-right font-semibold text-ink tabular-nums">{{ formatCurrency(p.total_budget) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 3: CLIENTS PREVIEW -->
          <div v-else-if="activeTab === 'clients'" class="surface-card overflow-hidden animate-in">
            <div class="px-4 py-3 hairline-b flex items-center justify-between">
              <h2 class="section-heading">Recent Clients</h2>
              <a href="#/clients" class="text-xs font-medium text-accent hover:underline">Open Client Directory</a>
            </div>
            <div v-if="data.recent_clients.length === 0" class="p-8 text-center">
              <p class="text-xs font-medium text-sub">No clients registered yet.</p>
              <a href="#/clients/new" class="btn-primary text-xs py-1.5 px-3 mt-3">Add Client</a>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="hairline-b surface-subtle text-xs font-semibold text-sub">
                    <th class="py-2.5 px-4">Client</th>
                    <th class="py-2.5 px-4">Company</th>
                    <th class="py-2.5 px-4">Email</th>
                    <th class="py-2.5 px-4 text-right">Added</th>
                  </tr>
                </thead>
                <tbody class="divide-hairline text-[13px]">
                  <tr v-for="c in data.recent_clients" :key="'tc-' + c.id" class="row-hover">
                    <td class="py-2.5 px-4 font-medium text-ink">
                      <a :href="'#/clients/' + c.id" class="hover:text-accent hover:underline">{{ c.name }}</a>
                    </td>
                    <td class="py-2.5 px-4 text-sub">{{ c.company || '-' }}</td>
                    <td class="py-2.5 px-4 text-sub">{{ c.email || '-' }}</td>
                    <td class="py-2.5 px-4 text-right text-xs text-muted tabular-nums">{{ formatDate(c.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB 4: INQUIRIES PREVIEW -->
          <div v-else-if="activeTab === 'inquiries'" class="surface-card overflow-hidden animate-in">
            <div class="px-4 py-3 hairline-b flex items-center justify-between">
              <h2 class="section-heading">Recent Contact Submissions</h2>
              <a href="#/submissions" class="text-xs font-medium text-accent hover:underline">Manage All Inquiries</a>
            </div>
            <div v-if="!data.recent_submissions || data.recent_submissions.length === 0" class="p-8 text-center">
              <p class="text-xs font-medium text-sub">No contact form submissions received yet.</p>
              <a href="#/submissions" class="btn-secondary text-xs py-1.5 px-3 mt-3">Open Submissions Inbox</a>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="hairline-b surface-subtle text-xs font-semibold text-sub">
                    <th class="py-2.5 px-4">Sender</th>
                    <th class="py-2.5 px-4">Email</th>
                    <th class="py-2.5 px-4">Status</th>
                    <th class="py-2.5 px-4 text-right">Received</th>
                  </tr>
                </thead>
                <tbody class="divide-hairline text-[13px]">
                  <tr v-for="sub in data.recent_submissions" :key="'ts-' + sub.id" class="row-hover">
                    <td class="py-2.5 px-4 font-medium text-ink">
                      <a href="#/submissions" class="hover:text-accent hover:underline">{{ sub.name }}</a>
                    </td>
                    <td class="py-2.5 px-4 text-sub">{{ sub.email || '-' }}</td>
                    <td class="py-2.5 px-4">
                      <span class="text-[11px] font-medium px-2 py-0.5 rounded-[4px] border" :class="getSubmissionStatusBadgeClass(sub.status)">{{ sub.status }}</span>
                    </td>
                    <td class="py-2.5 px-4 text-right text-xs text-muted tabular-nums">{{ formatDateTime(sub.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Contextual Right Rail (Plane-Inspired Operator Profile + Financial + Project Progress) -->
        <aside class="xl:w-[300px] xl:border-l hairline-t xl:border-t-0 hairline shrink-0 surface-canvas flex flex-col">
          <!-- Minimal Dark Architectural Header Strip -->
          <div class="h-14 bg-[#141923] border-b-2 border-[#2563eb] shrink-0" aria-hidden="true"></div>
          <div class="px-5 pb-5">
            <div class="relative z-10 -mt-6 mb-3">
              <div class="w-12 h-12 rounded-[8px] bg-[#2563eb] text-white font-bold text-base flex items-center justify-center border-2 border-[var(--bg-canvas)]">
                {{ adminInitial }}
              </div>
            </div>
            <p class="text-[15px] font-semibold text-ink leading-tight">{{ $root.auth.admin?.username || 'Admin' }}</p>
            <p class="text-xs text-muted mt-0.5">{{ $root.auth.admin?.email || 'Workspace Administrator' }}</p>

            <dl class="mt-4 space-y-2 text-xs">
              <div class="flex items-center justify-between gap-3">
                <dt class="text-muted">Today</dt>
                <dd class="font-medium text-ink tabular-nums">{{ formattedToday }}</dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-muted">Timezone</dt>
                <dd class="font-medium text-ink truncate">{{ localTimezone }}</dd>
              </div>
            </dl>
          </div>

          <!-- Financial Ledger Summary -->
          <div class="p-5 hairline-t space-y-2.5">
            <div class="flex items-center justify-between">
              <h3 class="section-heading">Financial Ledger</h3>
              <a href="#/reports" class="text-xs font-medium text-accent hover:underline">Reports</a>
            </div>
            <dl class="space-y-2 text-xs">
              <div class="flex items-center justify-between gap-2">
                <dt class="text-sub">Contract Budget</dt>
                <dd class="font-semibold text-ink tabular-nums">{{ formatCurrency(data.budget.total_budget) }}</dd>
              </div>
              <div class="flex items-center justify-between gap-2">
                <dt class="text-sub">Collected Payments</dt>
                <dd class="font-semibold text-st-green tabular-nums">{{ formatCurrency(data.budget.total_received) }}</dd>
              </div>
              <div class="flex items-center justify-between gap-2">
                <dt class="text-sub">Recorded Expenses</dt>
                <dd class="font-semibold text-st-red tabular-nums">{{ formatCurrency(data.budget.total_expenses) }}</dd>
              </div>
              <div class="pt-2 hairline-t flex items-center justify-between gap-2">
                <dt class="font-semibold text-ink">Net Profit</dt>
                <dd class="font-bold tabular-nums" :class="data.budget.profit >= 0 ? 'text-accent' : 'text-st-red'">
                  {{ formatCurrency(data.budget.profit) }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Active Projects Progress -->
          <div class="p-5 hairline-t space-y-3 flex-1">
            <div class="flex items-center justify-between">
              <h3 class="section-heading">Active Projects</h3>
              <span class="text-xs text-muted tabular-nums">{{ (data.active_projects_progress || []).length }}</span>
            </div>

            <div v-if="!data.active_projects_progress || data.active_projects_progress.length === 0" class="text-xs text-muted py-2">
              No active projects in progress.
            </div>

            <div v-else class="space-y-3">
              <a
                v-for="proj in data.active_projects_progress"
                :key="'rail-' + proj.id"
                :href="'#/projects/' + proj.id"
                class="block group"
              >
                <div class="flex items-center justify-between gap-2 text-xs">
                  <span class="flex items-center gap-2 min-w-0 font-medium text-ink group-hover:text-accent transition-colors">
                    <span class="status-sq" :class="getStatusDotClass(proj.status)" aria-hidden="true"></span>
                    <span class="truncate">{{ proj.title }}</span>
                  </span>
                  <span class="text-[11px] font-semibold text-accent tabular-nums shrink-0">{{ proj.task_progress }}%</span>
                </div>
                <div class="w-full h-1 surface-subtle rounded-full overflow-hidden mt-1.5">
                  <div
                    class="h-full bg-[#2563eb] rounded-full transition-all duration-300"
                    :style="{ width: proj.task_progress + '%' }"
                  ></div>
                </div>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  `
};
