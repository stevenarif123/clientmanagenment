/**
 * Reports View (Financial Analysis, Charts & Exports)
 */

window.ReportsView = {
  data() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = today.toISOString().split('T')[0];
    const currentYear = today.getFullYear();

    return {
      loading: true,
      error: '',
      startDate: firstDay,
      endDate: lastDay,
      selectedYear: currentYear,
      availableYears: [currentYear - 2, currentYear - 1, currentYear, currentYear + 1],
      financialData: {
        total_revenue: 0,
        total_expenses: 0,
        completed_projects: 0,
        projects: []
      },
      budgetOverview: {
        year: currentYear.toString(),
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
    this._onThemeChange = async () => {
      if (!this.loading && !this.error) {
        await this.$nextTick();
        this.renderChart();
      }
    };
    window.addEventListener('clienthub-theme-change', this._onThemeChange);
    await this.fetchReports();
  },
  beforeUnmount() {
    window.removeEventListener('clienthub-theme-change', this._onThemeChange);
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  },
  methods: {
    setPeriod(preset) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      if (preset === 'this_month') {
        this.startDate = new Date(y, m, 1).toISOString().split('T')[0];
        this.endDate = now.toISOString().split('T')[0];
        this.selectedYear = y;
      } else if (preset === 'last_month') {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0);
        this.startDate = start.toISOString().split('T')[0];
        this.endDate = end.toISOString().split('T')[0];
        this.selectedYear = start.getFullYear();
      } else if (preset === 'this_year') {
        this.startDate = `${y}-01-01`;
        this.endDate = now.toISOString().split('T')[0];
        this.selectedYear = y;
      }
      this.fetchReports();
    },
    async fetchReports() {
      this.loading = true;
      this.error = '';
      let loaded = false;
      try {
        const [finRes, budRes] = await Promise.all([
          window.API.reports.getFinancial({ start: this.startDate, end: this.endDate }),
          window.API.reports.getBudgetOverview({ year: this.selectedYear })
        ]);
        this.financialData = finRes.data?.data || this.financialData;
        this.budgetOverview = budRes.data?.data || this.budgetOverview;
        loaded = true;
      } catch (err) {
        this.error = 'Failed to compile financial report data.';
        window.Utils.toast('Failed to load financial reports', 'error');
      } finally {
        this.loading = false;
      }
      if (loaded) {
        await this.$nextTick();
        this.renderChart();
      }
    },
    renderChart() {
      const ctx = document.getElementById('categoryExpenseChart');
      if (!ctx || !window.Chart) return;

      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }

      const categories = this.budgetOverview.expenses_by_category || [];
      if (categories.length === 0) return;

      const isDark = window.Utils.getTheme() === 'dark';
      const legendColor = isDark ? '#b4bcc8' : '#4b5563';
      const canvasBg = isDark ? '#141820' : '#ffffff';

      const labels = categories.map(c => c.category);
      const data = categories.map(c => Number(c.total));

      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: [
              '#2563eb', '#16a34a', '#d97706', '#dc2626', '#0891b2', '#64748b', '#475569'
            ],
            borderWidth: 2,
            borderColor: canvasBg
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '64%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                padding: 12,
                color: legendColor,
                font: { size: 11, family: 'Public Sans, sans-serif' }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.label}: ${window.Utils.formatCurrency(context.parsed)}`
              }
            }
          }
        }
      });
    },
    async exportCSV(type) {
      const token = localStorage.getItem('auth_token');
      const apiBase = window.getApiBase();
      const url = type === 'clients'
        ? `${apiBase}/reports/export/clients?format=csv`
        : `${apiBase}/reports/export/projects?format=csv&start_date=${encodeURIComponent(this.startDate)}&end_date=${encodeURIComponent(this.endDate)}`;

      try {
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'No data available to export');
        }
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);
        window.Utils.toast('CSV export downloaded successfully', 'success');
      } catch (err) {
        window.Utils.toast(err.message || 'Failed to download export', 'error');
      }
    },
    async exportPDF() {
      const token = localStorage.getItem('auth_token');
      const apiBase = window.getApiBase();
      const url = `${apiBase}/reports/export/projects?format=pdf&start_date=${encodeURIComponent(this.startDate)}&end_date=${encodeURIComponent(this.endDate)}`;

      try {
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || 'No project data available to print');
        }
        const html = await res.text();
        const win = window.open('', '_blank');
        if (!win) {
          window.Utils.toast('Please allow popups to open the print preview', 'warning');
          return;
        }
        win.document.write(html);
        win.document.close();
      } catch (err) {
        window.Utils.toast(err.message || 'Failed to generate PDF view', 'error');
      }
    },
    async downloadDatabaseBackup() {
      const token = localStorage.getItem('auth_token');
      const apiBase = window.getApiBase();
      const url = `${apiBase}/reports/backup-db`;

      window.Utils.toast('Preparing SQLite database backup...', 'info');

      try {
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Backup failed');
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `clienthub_database_${new Date().toISOString().split('T')[0]}.sqlite`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(link.href);
        window.Utils.toast('Database backup downloaded successfully', 'success');
      } catch (err) {
        window.Utils.toast('Failed to download database backup', 'error');
      }
    },
    formatCurrency(val) {
      return window.Utils.formatCurrency(val);
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <!-- Slim Header -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <h1 class="text-sm font-semibold text-ink tracking-tight">Reports &amp; Financials</h1>
          <span class="text-xs text-muted hidden sm:inline">Cashflow, category expenses &amp; SQLite exports</span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" @click="downloadDatabaseBackup" class="btn-secondary text-xs py-1 px-2.5" title="Download full SQLite database copy">
            Backup DB
          </button>
          <button type="button" @click="exportCSV('clients')" class="btn-secondary text-xs py-1 px-2.5">
            Clients CSV
          </button>
          <button type="button" @click="exportCSV('projects')" class="btn-secondary text-xs py-1 px-2.5">
            Financial CSV
          </button>
          <button type="button" @click="exportPDF" class="btn-primary text-xs py-1 px-2.5">
            Print / PDF
          </button>
        </div>
      </div>

      <!-- Date Range Filter Strip -->
      <div class="px-5 sm:px-6 py-3 hairline-b surface-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="flex items-center gap-1.5">
            <label for="rep-start" class="text-xs font-medium text-sub">From</label>
            <input id="rep-start" v-model="startDate" type="date" class="field-input w-auto py-1 px-2.5 text-xs" />
          </div>
          <div class="flex items-center gap-1.5">
            <label for="rep-end" class="text-xs font-medium text-sub">To</label>
            <input id="rep-end" v-model="endDate" type="date" class="field-input w-auto py-1 px-2.5 text-xs" />
          </div>
          <div class="flex items-center gap-1.5">
            <label for="rep-year" class="text-xs font-medium text-sub">Year</label>
            <select id="rep-year" v-model.number="selectedYear" class="field-input w-auto py-1 px-2.5 text-xs font-medium">
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>
          <button type="button" @click="fetchReports" class="btn-primary text-xs py-1 px-3">
            Apply
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <button type="button" @click="setPeriod('this_month')" class="btn-secondary text-xs py-1 px-2.5">This Month</button>
          <button type="button" @click="setPeriod('last_month')" class="btn-secondary text-xs py-1 px-2.5">Last Month</button>
          <button type="button" @click="setPeriod('this_year')" class="btn-secondary text-xs py-1 px-2.5">Year to Date</button>
        </div>
      </div>

      <div class="p-5 sm:p-6 space-y-6">
        <!-- Skeleton Loading -->
        <div v-if="loading" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div v-for="n in 4" :key="'rep-sk-' + n" class="surface-card p-4 space-y-2"><div class="skeleton-bar h-3 w-24"></div><div class="skeleton-bar h-6 w-28"></div></div>
          </div>
          <div class="surface-card p-5 h-60"><div class="skeleton-bar h-full w-full"></div></div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-5 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-st-red">{{ error }}</p>
          <button type="button" @click="fetchReports" class="btn-secondary">Retry</button>
        </div>

        <div v-else class="space-y-6 animate-in">
          <!-- 4 Metric Tiles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div class="surface-card p-4">
              <p class="text-xs font-medium text-muted">Period Revenue</p>
              <p class="text-xl font-bold text-st-green mt-1 tabular-nums">{{ formatCurrency(financialData.total_revenue) }}</p>
            </div>
            <div class="surface-card p-4">
              <p class="text-xs font-medium text-muted">Period Expenses</p>
              <p class="text-xl font-bold text-st-red mt-1 tabular-nums">{{ formatCurrency(financialData.total_expenses) }}</p>
            </div>
            <div class="surface-card p-4">
              <p class="text-xs font-medium text-muted">Net Profit</p>
              <p class="text-xl font-bold mt-1 tabular-nums" :class="profit >= 0 ? 'text-ink' : 'text-st-red'">
                {{ formatCurrency(profit) }}
              </p>
            </div>
            <div class="surface-card p-4">
              <p class="text-xs font-medium text-muted">Completed Projects</p>
              <p class="text-xl font-bold text-accent mt-1 tabular-nums">{{ financialData.completed_projects }}</p>
            </div>
          </div>

          <!-- Visual Analytics Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-1 surface-card p-5 flex flex-col">
              <h2 class="section-heading mb-4">Expense Distribution</h2>
              <div v-if="!budgetOverview.expenses_by_category || budgetOverview.expenses_by_category.length === 0" class="flex-1 py-10 text-center text-xs text-muted flex items-center justify-center">
                No expenses recorded for {{ budgetOverview.year }}.
              </div>
              <div v-else class="relative w-full h-60 flex items-center justify-center">
                <canvas id="categoryExpenseChart"></canvas>
              </div>
            </div>

            <div class="lg:col-span-2 surface-card p-5">
              <h2 class="section-heading mb-4">Annual Breakdown by Category ({{ budgetOverview.year }})</h2>
              <div v-if="!budgetOverview.expenses_by_category || budgetOverview.expenses_by_category.length === 0" class="py-10 text-center text-xs text-muted">
                No categorized expenses recorded in {{ budgetOverview.year }}.
              </div>
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div
                  v-for="cat in budgetOverview.expenses_by_category"
                  :key="cat.category"
                  class="p-3.5 surface-subtle rounded-[6px] border hairline"
                >
                  <p class="text-xs font-medium text-sub">{{ cat.category }}</p>
                  <p class="text-sm font-bold text-ink mt-1 tabular-nums">{{ formatCurrency(cat.total) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Project Financial Breakdown Table -->
          <div class="surface-card overflow-hidden">
            <div class="px-5 py-3.5 hairline-b">
              <h2 class="section-heading">Project Financial Breakdown</h2>
              <p class="text-xs text-muted mt-0.5">Projects with transactions inside the selected date window</p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="hairline-b surface-subtle text-xs font-semibold text-sub">
                    <th class="py-2.5 px-5">Project</th>
                    <th class="py-2.5 px-5">Client</th>
                    <th class="py-2.5 px-5 text-right">Revenue Received</th>
                    <th class="py-2.5 px-5 text-right">Expenses Paid</th>
                    <th class="py-2.5 px-5 text-right">Net Margin</th>
                  </tr>
                </thead>
                <tbody class="divide-hairline text-[13px]">
                  <tr v-if="financialData.projects.length === 0">
                    <td colspan="5" class="py-8 text-center text-xs text-muted">
                      No project financial activity in this period. Adjust dates or click Year to Date.
                    </td>
                  </tr>
                  <tr v-for="p in financialData.projects" :key="p.id" class="row-hover">
                    <td class="py-3 px-5 font-semibold text-ink">
                      <a :href="'#/projects/' + p.id" class="hover:text-accent hover:underline">{{ p.title }}</a>
                    </td>
                    <td class="py-3 px-5 text-sub">{{ p.client_name }}</td>
                    <td class="py-3 px-5 text-right font-semibold text-st-green tabular-nums">{{ formatCurrency(p.total_received) }}</td>
                    <td class="py-3 px-5 text-right font-semibold text-st-red tabular-nums">{{ formatCurrency(p.total_expenses) }}</td>
                    <td class="py-3 px-5 text-right font-bold tabular-nums" :class="(p.total_received - p.total_expenses) >= 0 ? 'text-ink' : 'text-st-red'">
                      {{ formatCurrency(p.total_received - p.total_expenses) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
