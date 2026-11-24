/**
 * Dashboard View Component
 */

window.DashboardView = {
  components: {
    StatsCard: window.StatsCard
  },
  data() {
    return {
      loading: true,
      error: '',
      data: {
        counts: { clients: 0, projects: 0, active_projects: 0, pending_submissions: 0 },
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
  async mounted() {
    await this.fetchDashboard();
  },
  beforeUnmount() {
    if (this.revenueChart) this.revenueChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  },
  methods: {
    async fetchDashboard() {
      this.loading = true;
      this.error = '';
      let loaded = false;
      try {
        const response = await window.API.reports.getDashboard();
        this.data = response.data.data;
        loaded = true;
      } catch (err) {
        this.error = 'Failed to load dashboard data';
        console.error(err);
      } finally {
        this.loading = false;
      }
      if (loaded) {
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

      // 1. Revenue Chart (Backend returns m.total)
      const revCtx = document.getElementById('dashboardRevenueChart');
      if (revCtx) {
        if (this.revenueChart) this.revenueChart.destroy();

        const monthly = this.data.monthly_revenue || [];
        const labels = monthly.map(m => this.formatMonthLabel(m.month));
        const values = monthly.map(m => Number(m.total ?? m.revenue ?? 0));

        this.revenueChart = new Chart(revCtx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['No Revenue Yet'],
            datasets: [{
              label: 'Revenue (IDR)',
              data: values.length ? values : [0],
              backgroundColor: values.length ? '#4f46e5' : '#e2e8f0',
              hoverBackgroundColor: '#4338ca',
              borderRadius: 8,
              maxBarThickness: 44
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
                ticks: { font: { size: 11, family: 'Inter, sans-serif' }, color: '#64748b' }
              },
              y: {
                beginAtZero: true,
                border: { display: false },
                grid: { color: '#f1f5f9' },
                ticks: {
                  font: { size: 11, family: 'Inter, sans-serif' },
                  color: '#64748b',
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

      // 2. Status Doughnut Chart
      const statusCtx = document.getElementById('dashboardStatusChart');
      if (statusCtx) {
        if (this.statusChart) this.statusChart.destroy();

        const statuses = this.data.projects_by_status || [];
        const labels = statuses.map(s => s.status);
        const counts = statuses.map(s => Number(s.count));
        const colorMap = {
          'In Progress': '#3b82f6',
          'Completed': '#10b981',
          'On Hold': '#f59e0b',
          'Cancelled': '#ef4444',
          'Pending': '#94a3b8'
        };
        const bgColors = statuses.map(s => colorMap[s.status] || '#64748b');

        this.statusChart = new Chart(statusCtx, {
          type: 'doughnut',
          data: {
            labels: labels.length ? labels : ['No Projects'],
            datasets: [{
              data: counts.length ? counts : [1],
              backgroundColor: counts.length ? bgColors : ['#e2e8f0'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '66%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 10, padding: 14, font: { size: 11, family: 'Inter, sans-serif' } }
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
    getInitials(name) {
      return window.Utils.getInitials(name);
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
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p class="text-sm text-slate-500 mt-0.5">Welcome back, {{ $root.auth.admin?.username }}! Here is your business summary.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <a href="#/tasks" class="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Task Board
          </a>
          <a href="#/clients/new" class="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            New Client
          </a>
          <a href="#/projects/new" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            New Project
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner spinner-lg text-slate-900"></div>
        <p class="text-sm text-slate-500 mt-3 font-medium">Loading statistics...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
        <p class="font-semibold text-sm">{{ error }}</p>
        <button @click="fetchDashboard" class="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg">Retry</button>
      </div>

      <div v-else class="space-y-7 animate-in">
        <!-- Pending Inquiries Alert -->
        <div v-if="data.counts.pending_submissions > 0" class="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">
                You have {{ data.counts.pending_submissions }} new contact {{ data.counts.pending_submissions === 1 ? 'inquiry' : 'inquiries' }}
              </p>
              <p class="text-xs text-slate-600">Review incoming website leads and convert them into client profiles.</p>
            </div>
          </div>
          <a href="#/submissions" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm self-start sm:self-auto shrink-0 transition-colors">
            Review Inquiries &rarr;
          </a>
        </div>

        <!-- Top Metrics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <stats-card
            title="Total Clients"
            :value="data.counts.clients"
            icon="users"
            color="blue"
          />
          <stats-card
            title="Active Projects"
            :value="data.counts.active_projects"
            :subtitle="data.counts.projects + ' total projects'"
            icon="folder"
            color="indigo"
          />
          <stats-card
            title="Revenue Received"
            :value="data.budget.total_received"
            icon="banknote"
            color="emerald"
            :is-currency="true"
          />
          <stats-card
            title="New Inquiries"
            :value="data.counts.pending_submissions"
            icon="inbox"
            color="amber"
          />
        </div>

        <!-- Financial Summary Banner -->
        <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h2 class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">Financial Health Overview</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div class="sm:pr-4">
              <p class="text-xs font-semibold text-slate-500 uppercase">Total Contract Budget</p>
              <p class="text-xl font-bold text-slate-900 mt-1 tabular-nums">{{ formatCurrency(data.budget.total_budget) }}</p>
            </div>
            <div class="sm:px-4 pt-4 sm:pt-0">
              <p class="text-xs font-semibold text-emerald-600 uppercase">Collected Payments</p>
              <p class="text-xl font-bold text-emerald-700 mt-1 tabular-nums">{{ formatCurrency(data.budget.total_received) }}</p>
            </div>
            <div class="sm:px-4 pt-4 sm:pt-0">
              <p class="text-xs font-semibold text-rose-600 uppercase">Recorded Expenses</p>
              <p class="text-xl font-bold text-rose-700 mt-1 tabular-nums">{{ formatCurrency(data.budget.total_expenses) }}</p>
            </div>
            <div class="sm:pl-4 pt-4 sm:pt-0">
              <p class="text-xs font-semibold text-indigo-600 uppercase">Net Realized Profit</p>
              <p class="text-xl font-bold mt-1 tabular-nums" :class="data.budget.profit >= 0 ? 'text-indigo-700' : 'text-rose-600'">{{ formatCurrency(data.budget.profit) }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Analytics Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-bold text-slate-900">Revenue Trend (Last 6 Months)</h3>
                <p class="text-xs text-slate-500 mt-0.5">Monthly cash-in from received payments</p>
              </div>
              <a href="#/reports" class="text-xs font-semibold text-indigo-600 hover:underline">Full Report &rarr;</a>
            </div>
            <div class="relative w-full h-64">
              <canvas id="dashboardRevenueChart"></canvas>
            </div>
          </div>

          <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
            <div class="mb-4">
              <h3 class="text-base font-bold text-slate-900">Projects by Status</h3>
              <p class="text-xs text-slate-500 mt-0.5">Distribution across pipeline</p>
            </div>
            <div class="relative w-full h-64 flex items-center justify-center">
              <canvas id="dashboardStatusChart"></canvas>
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: Recent Projects & Recent Clients -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Projects -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900">Recent Projects</h3>
                <p class="text-xs text-slate-500 mt-0.5">Latest project initiatives</p>
              </div>
              <a href="#/projects" class="text-xs font-semibold text-indigo-600 hover:underline">View All &rarr;</a>
            </div>

            <div class="flex-1 divide-y divide-slate-100">
              <div v-if="data.recent_projects.length === 0" class="p-8 text-center text-sm text-slate-400">
                No projects recorded yet.
              </div>
              <a
                v-for="project in data.recent_projects"
                :key="project.id"
                :href="'#/projects/' + project.id"
                class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors block"
              >
                <div class="min-w-0 pr-4">
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ project.title }}</p>
                  <p class="text-xs text-slate-500 truncate mt-0.5">{{ project.client_name || 'Client' }}</p>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-xs font-medium px-2.5 py-0.5 rounded-full border" :class="getStatusBadgeClass(project.status)">
                    {{ project.status }}
                  </span>
                  <span class="text-xs font-bold text-slate-900 tabular-nums">
                    {{ formatCurrency(project.total_budget) }}
                  </span>
                </div>
              </a>
            </div>
          </div>

          <!-- Recent Clients -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-base font-bold text-slate-900">Recent Clients</h3>
                <p class="text-xs text-slate-500 mt-0.5">Active client directory</p>
              </div>
              <a href="#/clients" class="text-xs font-semibold text-indigo-600 hover:underline">View All &rarr;</a>
            </div>

            <div class="flex-1 divide-y divide-slate-100">
              <div v-if="data.recent_clients.length === 0" class="p-8 text-center text-sm text-slate-400">
                No clients added yet.
              </div>
              <a
                v-for="client in data.recent_clients"
                :key="client.id"
                :href="'#/clients/' + client.id"
                class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors block"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-xs font-bold shrink-0 border border-slate-200">
                    {{ getInitials(client.name) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate">{{ client.name }}</p>
                    <p class="text-xs text-slate-500 truncate">{{ client.email || client.company || '-' }}</p>
                  </div>
                </div>
                <span class="text-xs text-slate-400 shrink-0">{{ formatDate(client.created_at) }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
