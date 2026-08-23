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
  methods: {
    async fetchDashboard() {
      this.loading = true;
      try {
        const response = await window.API.reports.getDashboard();
        this.data = response.data.data;
        this.$nextTick(() => {
          this.renderCharts();
        });
      } catch (err) {
        this.error = 'Failed to load dashboard data';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    renderCharts() {
      if (!window.Chart) return;

      // 1. Revenue Chart
      const revCtx = document.getElementById('dashboardRevenueChart');
      if (revCtx) {
        if (this.revenueChart) this.revenueChart.destroy();

        const monthly = this.data.monthly_revenue || [];
        const labels = monthly.map(m => m.month);
        const values = monthly.map(m => m.revenue);

        this.revenueChart = new Chart(revCtx, {
          type: 'bar',
          data: {
            labels: labels.length ? labels : ['Current Month'],
            datasets: [{
              label: 'Revenue (IDR)',
              data: values.length ? values : [this.data.budget.total_received],
              backgroundColor: '#0f172a',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) => {
                    if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                    return value;
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
        const counts = statuses.map(s => s.count);

        this.statusChart = new Chart(statusCtx, {
          type: 'doughnut',
          data: {
            labels: labels.length ? labels : ['No Projects'],
            datasets: [{
              data: counts.length ? counts : [1],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#94a3b8'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 10, font: { size: 11 } }
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
        <div class="flex items-center gap-3">
          <a href="#/clients" class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Clients
          </a>
          <a href="#/projects" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Projects
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner w-8 h-8 border-3"></div>
        <p class="text-sm text-slate-500 mt-3 font-medium">Loading statistics...</p>
      </div>

      <div v-else class="space-y-8 animate-in">
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
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Financial Health Overview</h2>
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
              <p class="text-xl font-bold text-indigo-700 mt-1 tabular-nums">{{ formatCurrency(data.budget.profit) }}</p>
            </div>
          </div>
        </div>

        <!-- Visual Analytics Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Revenue Trend (Last 6 Months)</h3>
                <p class="text-xs text-slate-500 mt-0.5">Monthly cash-in from completed payments</p>
              </div>
            </div>
            <div class="relative w-full h-64">
              <canvas id="dashboardRevenueChart"></canvas>
            </div>
          </div>

          <div class="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div class="mb-4">
              <h3 class="text-base font-semibold text-slate-900">Projects by Status</h3>
              <p class="text-xs text-slate-500 mt-0.5">Distribution across pipeline</p>
            </div>
            <div class="relative w-full h-64 flex items-center justify-center">
              <canvas id="dashboardStatusChart"></canvas>
            </div>
          </div>
        </div>

        <!-- 2 Column Layout: Recent Projects & Recent Clients -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Recent Projects -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Recent Projects</h3>
                <p class="text-xs text-slate-500 mt-0.5">Latest project initiatives</p>
              </div>
              <a href="#/projects" class="text-xs font-semibold text-slate-900 hover:underline">View All &rarr;</a>
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
                  <span class="text-xs font-medium px-2.5 py-1 rounded-full border" :class="getStatusBadgeClass(project.status)">
                    {{ project.status }}
                  </span>
                  <span class="text-xs font-semibold text-slate-900 tabular-nums">
                    {{ formatCurrency(project.total_budget) }}
                  </span>
                </div>
              </a>
            </div>
          </div>

          <!-- Recent Clients -->
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Recent Clients</h3>
                <p class="text-xs text-slate-500 mt-0.5">Active client directory</p>
              </div>
              <a href="#/clients" class="text-xs font-semibold text-slate-900 hover:underline">View All &rarr;</a>
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
