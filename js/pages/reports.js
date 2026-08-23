/**
 * Reports View (Financial Analysis & Exports)
 */

window.ReportsView = {
  data() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = today.toISOString().split('T')[0];

    return {
      loading: true,
      startDate: firstDay,
      endDate: lastDay,
      financialData: {
        total_revenue: 0,
        total_expenses: 0,
        completed_projects: 0,
        projects: []
      },
      budgetOverview: {
        year: today.getFullYear().toString(),
        monthly_expenses: [],
        monthly_payments: [],
        expenses_by_category: [],
        top_projects: []
      },
      chartInstance: null
    };
  },
  computed: {
    profit() {
      return (this.financialData.total_revenue || 0) - (this.financialData.total_expenses || 0);
    }
  },
  async mounted() {
    await this.fetchReports();
  },
  methods: {
    async fetchReports() {
      this.loading = true;
      try {
        const [finRes, budRes] = await Promise.all([
          window.API.reports.getFinancial({ start: this.startDate, end: this.endDate }),
          window.API.reports.getBudgetOverview({ year: new Date().getFullYear() })
        ]);
        this.financialData = finRes.data?.data || this.financialData;
        this.budgetOverview = budRes.data?.data || this.budgetOverview;
        this.$nextTick(() => {
          this.renderChart();
        });
      } catch (err) {
        window.Utils.toast('Failed to load financial reports', 'error');
      } finally {
        this.loading = false;
      }
    },
    renderChart() {
      const ctx = document.getElementById('categoryExpenseChart');
      if (!ctx || !window.Chart) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const categories = this.budgetOverview.expenses_by_category || [];
      const labels = categories.map(c => c.category);
      const data = categories.map(c => c.total);

      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['No Expenses'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: [
              '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'
            ],
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
              labels: { boxWidth: 12, font: { size: 11 } }
            }
          }
        }
      });
    },
    exportCSV(type) {
      const token = localStorage.getItem('auth_token');
      let url = '';
      if (type === 'clients') {
        url = `/api/reports/export/clients?format=csv`;
      } else {
        url = `/api/reports/export/projects?format=csv&start_date=${this.startDate}&end_date=${this.endDate}`;
      }

      fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.Utils.toast('Export downloaded successfully', 'success');
      })
      .catch(() => window.Utils.toast('Failed to download export', 'error'));
    },
    exportPDF() {
      const token = localStorage.getItem('auth_token');
      const url = `/api/reports/export/projects?format=pdf&start_date=${this.startDate}&end_date=${this.endDate}`;
      
      fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.text())
      .then(html => {
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
      })
      .catch(() => window.Utils.toast('Failed to generate PDF view', 'error'));
    },
    downloadDatabaseBackup() {
      const token = localStorage.getItem('auth_token');
      const url = `/api/reports/backup-db`;

      window.Utils.toast('Preparing SQLite database backup...', 'info');

      fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Backup failed');
        return res.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `clienthub_database_${new Date().toISOString().split('T')[0]}.sqlite`;
        link.click();
        window.Utils.toast('Database backup downloaded successfully!', 'success');
      })
      .catch(() => window.Utils.toast('Failed to download database backup', 'error'));
    },
    formatCurrency(val) {
      return window.Utils.formatCurrency(val);
    }
  },
  template: `
    <div>
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Reports & Financials</h1>
          <p class="text-sm text-slate-500 mt-0.5">Analyze financial statements, category expenses, and export records</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            @click="downloadDatabaseBackup"
            class="px-3.5 py-2 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            title="Download full SQLite database copy"
          >
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Backup Database (.sqlite)
          </button>
          <button
            @click="exportCSV('clients')"
            class="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Clients CSV
          </button>
          <button
            @click="exportCSV('projects')"
            class="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Financial CSV
          </button>
          <button
            @click="exportPDF"
            class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print / PDF
          </button>
        </div>
      </div>

      <!-- Date Range Filter Bar -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 uppercase">From</span>
            <input
              v-model="startDate"
              type="date"
              class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-slate-500 uppercase">To</span>
            <input
              v-model="endDate"
              type="date"
              class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            />
          </div>
          <button
            @click="fetchReports"
            class="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Apply Filter
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner w-8 h-8"></div>
        <p class="text-sm text-slate-500 mt-3">Compiling financial report...</p>
      </div>

      <div v-else class="space-y-8 animate-in">
        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Period Revenue</p>
            <p class="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{{ formatCurrency(financialData.total_revenue) }}</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Period Expenses</p>
            <p class="text-2xl font-bold text-rose-600 mt-1 tabular-nums">{{ formatCurrency(financialData.total_expenses) }}</p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Profit</p>
            <p class="text-2xl font-bold mt-1 tabular-nums" :class="profit >= 0 ? 'text-slate-900' : 'text-rose-600'">
              {{ formatCurrency(profit) }}
            </p>
          </div>
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Projects</p>
            <p class="text-2xl font-bold text-blue-600 mt-1 tabular-nums">{{ financialData.completed_projects }}</p>
          </div>
        </div>

        <!-- Visual Analytics Grid: Chart + Category Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Chart -->
          <div class="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col items-center">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 self-start">Expense Distribution</h3>
            <div class="relative w-full h-64 flex items-center justify-center">
              <canvas id="categoryExpenseChart"></canvas>
            </div>
          </div>

          <!-- Category Tiles -->
          <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Annual Breakdown by Category ({{ budgetOverview.year }})</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div
                v-for="cat in budgetOverview.expenses_by_category"
                :key="cat.category"
                class="p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <p class="text-xs font-semibold text-slate-500 uppercase">{{ cat.category }}</p>
                <p class="text-base font-bold text-slate-900 mt-1 tabular-nums">{{ formatCurrency(cat.total) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Project Financial Breakdown Table -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h2 class="text-base font-semibold text-slate-900">Project Financial Breakdown</h2>
            <p class="text-xs text-slate-500 mt-0.5">Projects active or with transactions in the selected date range</p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th class="py-3.5 px-6">Project</th>
                  <th class="py-3.5 px-6">Client</th>
                  <th class="py-3.5 px-6 text-right">Revenue Received</th>
                  <th class="py-3.5 px-6 text-right">Expenses Paid</th>
                  <th class="py-3.5 px-6 text-right">Net Margin</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-sm">
                <tr v-if="financialData.projects.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-400">
                    No project financial activity in this period.
                  </td>
                </tr>
                <tr
                  v-for="p in financialData.projects"
                  :key="p.id"
                  class="hover:bg-slate-50 transition-colors"
                >
                  <td class="py-4 px-6 font-semibold text-slate-900">
                    <a :href="'#/projects/' + p.id" class="hover:underline">{{ p.title }}</a>
                  </td>
                  <td class="py-4 px-6 text-slate-600">
                    {{ p.client_name }}
                  </td>
                  <td class="py-4 px-6 text-right font-bold text-emerald-600 tabular-nums">
                    {{ formatCurrency(p.total_received) }}
                  </td>
                  <td class="py-4 px-6 text-right font-semibold text-rose-600 tabular-nums">
                    {{ formatCurrency(p.total_expenses) }}
                  </td>
                  <td class="py-4 px-6 text-right font-bold tabular-nums" :class="(p.total_received - p.total_expenses) >= 0 ? 'text-slate-900' : 'text-rose-600'">
                    {{ formatCurrency(p.total_received - p.total_expenses) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
};
