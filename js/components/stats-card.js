/**
 * StatsCard Component - Flat Hairline Metric Tile
 */

window.StatsCard = {
  props: {
    title: { type: String, required: true },
    value: { type: [String, Number], default: 0 },
    icon: { type: String, default: 'chart' },
    color: { type: String, default: 'blue' },
    isCurrency: { type: Boolean, default: false },
    subtitle: { type: String, default: '' }
  },
  computed: {
    formattedValue() {
      if (this.isCurrency) {
        return window.Utils.formatCurrency(this.value);
      }
      return Number(this.value || 0).toLocaleString('id-ID');
    },
    iconSvg() {
      switch (this.icon) {
        case 'users':
          return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z';
        case 'folder':
          return 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z';
        case 'tasks':
          return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
        case 'inbox':
          return 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4';
        case 'banknote':
        case 'currency':
          return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        default:
          return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
      }
    }
  },
  template: `
    <div class="surface-card p-4 flex items-center gap-3.5 hover:border-[var(--border-strong)] transition-colors">
      <div class="w-9 h-9 rounded-[6px] surface-subtle border hairline flex items-center justify-center shrink-0 text-sub" aria-hidden="true">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" :d="iconSvg" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[12px] font-medium text-muted truncate">{{ title }}</p>
        <p class="text-lg sm:text-xl font-bold text-ink tabular-nums tracking-tight truncate mt-0.5">{{ formattedValue }}</p>
        <p v-if="subtitle" class="text-[11px] text-muted mt-0.5 truncate">{{ subtitle }}</p>
      </div>
    </div>
  `
};
