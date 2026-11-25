/**
 * App Layout Component - Plane-Inspired Two-Tier Workspace Shell
 * Includes Slim Topbar, Working Ctrl+K Global Search, Light/Dark Toggle,
 * Collapsible Sidebar with Live Projects Tree, Mobile Drawer, and User Menu.
 */

window.AppLayout = {
  components: {
    ProfileModal: window.ProfileModal,
    ChangePasswordModal: window.ChangePasswordModal
  },
  props: ['currentRoute'],
  data() {
    let collapsed = false;
    try {
      collapsed = localStorage.getItem('clienthub_sidebar_collapsed') === '1';
    } catch (e) {}

    return {
      mobileMenuOpen: false,
      sidebarCollapsed: collapsed,
      projectsSectionOpen: true,
      userMenuOpen: false,
      showProfileModal: false,
      showPasswordModal: false,
      theme: window.Utils.getTheme(),
      pendingSubmissionsCount: 0,
      sidebarProjects: [],
      projectsLoading: true,

      // Global Search Command Palette
      showSearchModal: false,
      searchQuery: '',
      searchLoading: false,
      searchDataLoaded: false,
      searchClients: [],
      searchProjects: [],
      searchTasks: [],
      activeSearchIndex: 0,

      navigation: [
        { name: 'Overview', route: '#/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Clients', route: '#/clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        { name: 'Projects', route: '#/projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        { name: 'Task Board', route: '#/tasks', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
        { name: 'Submissions', route: '#/submissions', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4', badgeKey: 'submissions' },
        { name: 'Services', route: '#/services', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        { name: 'Reports', route: '#/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
      ],

      projectSubTabs: [
        { id: 'tasks', label: 'Tasks & Milestones' },
        { id: 'payments', label: 'Payments' },
        { id: 'expenses', label: 'Expenses' },
        { id: 'communications', label: 'Communications' },
        { id: 'files', label: 'Deliverables & Files' }
      ]
    };
  },
  computed: {
    admin() {
      return window.Auth.admin;
    },
    publicFormUrl() {
      return window.Utils.resolveAssetUrl('public-contact-form.html');
    },
    activeProjectId() {
      const clean = (this.currentRoute || '').split('?')[0];
      const match = clean.match(/^#\/projects\/(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    },
    activeProjectTab() {
      const raw = this.currentRoute || '';
      const qIdx = raw.indexOf('?');
      if (qIdx === -1) return 'tasks';
      return new URLSearchParams(raw.slice(qIdx + 1)).get('tab') || 'tasks';
    },
    searchResults() {
      const q = this.searchQuery.trim().toLowerCase();
      const items = [];

      const quickActions = [
        { type: 'Action', title: 'Go to Overview', subtitle: 'Summary, workload & financials', href: '#/', key: 'act-overview' },
        { type: 'Action', title: 'Create New Project', subtitle: 'Configure client, service & budget', href: '#/projects/new', key: 'act-new-proj' },
        { type: 'Action', title: 'Add New Client', subtitle: 'Register contact & organization', href: '#/clients/new', key: 'act-new-client' },
        { type: 'Action', title: 'Open Global Task Board', subtitle: 'Drag tasks across active projects', href: '#/tasks', key: 'act-tasks' },
        { type: 'Action', title: 'Open Financial Reports', subtitle: 'Period revenue, expenses & CSV/PDF export', href: '#/reports', key: 'act-reports' },
        { type: 'Action', title: this.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode', subtitle: 'Toggle workspace appearance', action: 'toggleTheme', key: 'act-theme' }
      ];

      this.searchProjects.forEach(p => {
        const text = `${p.title || ''} ${p.client_name || ''} ${p.status || ''}`.toLowerCase();
        if (!q || text.includes(q)) {
          items.push({
            type: 'Project',
            title: p.title,
            subtitle: `${p.client_name || 'Client'} - ${p.status}`,
            href: `#/projects/${p.id}`,
            status: p.status,
            key: `proj-${p.id}`
          });
        }
      });

      this.searchClients.forEach(c => {
        const text = `${c.name || ''} ${c.company || ''} ${c.email || ''}`.toLowerCase();
        if (!q || text.includes(q)) {
          items.push({
            type: 'Client',
            title: c.name,
            subtitle: c.company || c.email || 'Client account',
            href: `#/clients/${c.id}`,
            key: `cli-${c.id}`
          });
        }
      });

      this.searchTasks.forEach(t => {
        const text = `${t.title || ''} ${t.project_title || ''} ${t.status || ''}`.toLowerCase();
        if (!q || text.includes(q)) {
          items.push({
            type: 'Task',
            title: t.title,
            subtitle: `${t.project_title || 'Project'} - ${t.status}`,
            href: `#/projects/${t.project_id}?tab=tasks`,
            status: t.status,
            key: `task-${t.id}`
          });
        }
      });

      quickActions.forEach(a => {
        const text = `${a.title} ${a.subtitle}`.toLowerCase();
        if (!q || text.includes(q)) {
          items.push(a);
        }
      });

      return items.slice(0, 14);
    }
  },
  watch: {
    currentRoute() {
      this.userMenuOpen = false;
      this.mobileMenuOpen = false;
      this.fetchShellCounts();
    },
    searchQuery() {
      this.activeSearchIndex = 0;
    }
  },
  mounted() {
    this._outsideClick = (e) => {
      if (this.userMenuOpen && this.$refs.userMenuContainer && !this.$refs.userMenuContainer.contains(e.target)) {
        this.userMenuOpen = false;
      }
    };
    this._keyHandler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.showSearchModal) {
          this.showSearchModal = false;
        } else {
          this.openGlobalSearch();
        }
        return;
      }
      if (e.key === 'Escape') {
        if (this.showSearchModal) this.showSearchModal = false;
        if (this.userMenuOpen) this.userMenuOpen = false;
        if (this.mobileMenuOpen) this.mobileMenuOpen = false;
      }
    };
    this._themeHandler = (e) => {
      this.theme = e.detail?.theme || window.Utils.getTheme();
    };
    document.addEventListener('click', this._outsideClick);
    window.addEventListener('keydown', this._keyHandler);
    window.addEventListener('clienthub-theme-change', this._themeHandler);
    this.fetchShellCounts();
  },
  beforeUnmount() {
    document.removeEventListener('click', this._outsideClick);
    window.removeEventListener('keydown', this._keyHandler);
    window.removeEventListener('clienthub-theme-change', this._themeHandler);
  },
  methods: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      try {
        localStorage.setItem('clienthub_sidebar_collapsed', this.sidebarCollapsed ? '1' : '0');
      } catch (e) {}
    },
    toggleTheme() {
      this.theme = window.Utils.toggleTheme();
    },
    async fetchShellCounts() {
      try {
        const [subRes, projRes] = await Promise.all([
          window.API.submissions.getAll({ status: 'New', per_page: 1 }),
          window.API.projects.getAll({ per_page: 8 })
        ]);
        this.pendingSubmissionsCount = subRes.data?.meta?.total || 0;
        const list = projRes.data?.data || [];
        this.sidebarProjects = list.filter(p => p.status !== 'Cancelled').slice(0, 7);
      } catch (e) {
        // Silent background shell refresh
      } finally {
        this.projectsLoading = false;
      }
    },
    async openGlobalSearch() {
      this.showSearchModal = true;
      this.searchQuery = '';
      this.activeSearchIndex = 0;

      this.$nextTick(() => {
        this.$refs.globalSearchInput?.focus();
      });

      if (!this.searchDataLoaded) {
        this.searchLoading = true;
        try {
          const [projRes, clientRes, taskRes] = await Promise.all([
            window.API.projects.getAll({ per_page: 25 }),
            window.API.clients.getAll({ per_page: 25 }),
            window.API.tasks.board()
          ]);
          this.searchProjects = projRes.data?.data || [];
          this.searchClients = clientRes.data?.data || [];
          this.searchTasks = taskRes.data?.data?.tasks || [];
          this.searchDataLoaded = true;
        } catch (e) {
          // Allow quick actions even if search preload fails
        } finally {
          this.searchLoading = false;
        }
      }
    },
    handleSearchKeydown(e) {
      const len = this.searchResults.length;
      if (len === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.activeSearchIndex = (this.activeSearchIndex + 1) % len;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.activeSearchIndex = (this.activeSearchIndex - 1 + len) % len;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = this.searchResults[this.activeSearchIndex];
        if (item) this.selectSearchItem(item);
      }
    },
    selectSearchItem(item) {
      this.showSearchModal = false;
      if (item.action === 'toggleTheme') {
        this.toggleTheme();
        return;
      }
      if (item.href) {
        window.location.hash = item.href.replace(/^#/, '#');
      }
    },
    getStatusDotClass(status) {
      return window.Utils.getStatusDotClass(status);
    },
    isActive(itemRoute) {
      const cleanCurrent = (this.currentRoute || '#/').split('?')[0];
      if (itemRoute === '#/') {
        return cleanCurrent === '#/' || cleanCurrent === '' || cleanCurrent === '#';
      }
      return cleanCurrent === itemRoute || cleanCurrent.startsWith(itemRoute + '/');
    },
    async logout() {
      this.userMenuOpen = false;
      this.mobileMenuOpen = false;
      await window.Auth.logout();
    }
  },
  template: `
    <div class="flex flex-col h-screen surface-canvas overflow-hidden">
      <!-- Top Utility Bar -->
      <header class="h-11 surface-chrome hairline-b flex items-center justify-between px-3 sm:px-4 shrink-0 z-30 gap-3">
        <!-- Left: Sidebar Toggles & Brand -->
        <div class="flex items-center gap-1.5 min-w-0 shrink-0">
          <button
            type="button"
            @click="mobileMenuOpen = true"
            aria-label="Open navigation menu"
            class="lg:hidden btn-ghost p-2 -ml-1"
          >
            <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          <button
            type="button"
            @click="toggleSidebar"
            :aria-label="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            class="hidden lg:inline-flex btn-ghost p-1.5"
          >
            <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
            </svg>
          </button>

          <a href="#/" class="flex items-center gap-2 px-1 py-1 rounded-[6px] hover:opacity-90">
            <span class="ch-mark w-6 h-6 text-[11px]" aria-hidden="true">CH</span>
            <span class="font-semibold text-[13px] text-ink tracking-tight">ClientHub</span>
          </a>
        </div>

        <!-- Center: Global Search Trigger -->
        <div class="flex-1 flex justify-center min-w-0 max-w-md mx-auto">
          <button
            type="button"
            @click="openGlobalSearch"
            aria-label="Search workspace"
            class="w-full h-7 px-2.5 rounded-[6px] surface-canvas border hairline hover:border-[var(--border-strong)] flex items-center justify-between gap-2 text-xs text-muted transition-colors"
          >
            <span class="flex items-center gap-2 min-w-0">
              <svg class="w-3.5 h-3.5 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span class="truncate">Search clients, projects, tasks...</span>
            </span>
            <kbd class="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium rounded surface-subtle border hairline text-muted shrink-0">Ctrl K</kbd>
          </button>
        </div>

        <!-- Right: Utility Actions & Account -->
        <div class="flex items-center gap-1 shrink-0">
          <a
            :href="publicFormUrl"
            target="_blank"
            rel="noopener"
            class="hidden md:inline-flex btn-ghost text-xs px-2.5 py-1"
            title="Open public contact inquiry form"
          >
            <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            <span>Contact Form</span>
          </a>

          <button
            type="button"
            @click="toggleTheme"
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            class="btn-ghost p-1.5"
          >
            <svg v-if="theme === 'dark'" class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.9">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
            </svg>
            <svg v-else class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.9">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          </button>

          <!-- User Profile Dropdown -->
          <div ref="userMenuContainer" class="relative">
            <button
              type="button"
              @click="userMenuOpen = !userMenuOpen"
              aria-label="Open account menu"
              :aria-expanded="userMenuOpen ? 'true' : 'false'"
              class="flex items-center gap-2 p-1 rounded-[6px] hover:bg-[var(--bg-active)] transition-colors"
            >
              <span class="w-6 h-6 rounded-[6px] surface-subtle border hairline text-ink inline-flex items-center justify-center text-[11px] font-bold">
                {{ (admin?.username || 'A').charAt(0).toUpperCase() }}
              </span>
              <span class="hidden sm:inline text-xs font-medium text-ink max-w-[100px] truncate">{{ admin?.username || 'Admin' }}</span>
              <svg class="w-3.5 h-3.5 text-muted hidden sm:block" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div
              v-if="userMenuOpen"
              class="fixed right-3 top-12 w-56 surface-popover py-1 z-50 animate-in divide-hairline"
            >
              <div class="px-3.5 py-2.5">
                <p class="text-[11px] text-muted font-medium">Signed in as</p>
                <p class="text-[13px] font-semibold text-ink truncate mt-0.5">{{ admin?.username }}</p>
                <p v-if="admin?.email" class="text-xs text-muted truncate">{{ admin.email }}</p>
              </div>
              <div class="py-1">
                <button
                  type="button"
                  @click="userMenuOpen = false; showProfileModal = true;"
                  class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink row-hover text-left"
                >
                  <svg class="w-3.5 h-3.5 text-muted" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  Profile Settings
                </button>
                <button
                  type="button"
                  @click="userMenuOpen = false; showPasswordModal = true;"
                  class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink row-hover text-left"
                >
                  <svg class="w-3.5 h-3.5 text-muted" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                  Change Password
                </button>
              </div>
              <div class="py-1">
                <button
                  type="button"
                  @click="logout"
                  class="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-st-red row-hover text-left"
                >
                  <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Workspace Body: Sidebar + Main Canvas -->
      <div class="flex-1 flex min-h-0 overflow-hidden">
        <!-- Desktop Collapsible Sidebar -->
        <aside
          v-show="!sidebarCollapsed"
          class="w-[236px] surface-sidebar hairline-r hidden lg:flex flex-col shrink-0"
        >
          <!-- Primary CTA -->
          <div class="p-3">
            <a
              href="#/projects/new"
              class="w-full btn-secondary justify-start text-[13px] font-medium py-1.5 px-2.5"
            >
              <svg class="w-3.5 h-3.5 text-sub" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span>New project</span>
            </a>
          </div>

          <!-- Primary Navigation -->
          <nav class="flex-1 px-2.5 pb-3 space-y-0.5 overflow-y-auto" aria-label="Main Navigation">
            <a
              v-for="item in navigation"
              :key="item.name"
              :href="item.route"
              class="flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[13px] transition-colors"
              :class="isActive(item.route)
                ? 'surface-active text-ink font-semibold'
                : 'text-sub font-medium hover:bg-[var(--bg-active)] hover:text-ink'"
            >
              <span class="flex items-center gap-2.5 min-w-0">
                <svg
                  class="w-4 h-4 shrink-0"
                  aria-hidden="true"
                  :class="isActive(item.route) ? 'text-accent' : 'text-muted'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="1.8"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                </svg>
                <span class="truncate">{{ item.name }}</span>
              </span>
              <span
                v-if="item.badgeKey === 'submissions' && pendingSubmissionsCount > 0"
                class="px-1.5 py-0.5 text-[11px] font-semibold rounded-[4px] border tabular-nums badge-blue"
              >
                {{ pendingSubmissionsCount }}
              </span>
            </a>

            <!-- Active Projects Tree -->
            <div class="pt-3 mt-3 hairline-t">
              <div class="flex items-center justify-between px-2.5 mb-1">
                <button
                  type="button"
                  @click="projectsSectionOpen = !projectsSectionOpen"
                  class="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
                >
                  <svg
                    class="w-3 h-3 transition-transform"
                    aria-hidden="true"
                    :class="{ '-rotate-90': !projectsSectionOpen }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                  <span>Active projects</span>
                </button>
                <a
                  href="#/projects/new"
                  aria-label="Create project"
                  title="New project"
                  class="p-0.5 rounded text-muted hover:text-ink"
                >
                  <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </a>
              </div>

              <div v-if="projectsSectionOpen" class="space-y-0.5">
                <div v-if="projectsLoading" class="px-2.5 py-1.5 space-y-2">
                  <div class="skeleton-bar h-3 w-4/5"></div>
                  <div class="skeleton-bar h-3 w-3/5"></div>
                </div>
                <p v-else-if="sidebarProjects.length === 0" class="px-2.5 py-1.5 text-xs text-muted">
                  No active projects
                </p>
                <template v-else v-for="proj in sidebarProjects" :key="proj.id">
                  <a
                    :href="'#/projects/' + proj.id"
                    class="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[13px] transition-colors"
                    :class="activeProjectId === proj.id
                      ? 'surface-active text-ink font-semibold'
                      : 'text-sub hover:bg-[var(--bg-active)] hover:text-ink'"
                  >
                    <span class="status-sq" :class="getStatusDotClass(proj.status)" aria-hidden="true"></span>
                    <span class="truncate">{{ proj.title }}</span>
                  </a>

                  <!-- Indented Project Tab Shortcuts when active -->
                  <div v-if="activeProjectId === proj.id" class="ml-4 pl-2.5 hairline-l space-y-0.5 my-1">
                    <a
                      v-for="sub in projectSubTabs"
                      :key="sub.id"
                      :href="'#/projects/' + proj.id + '?tab=' + sub.id"
                      class="block px-2 py-1 rounded-[5px] text-xs transition-colors"
                      :class="activeProjectTab === sub.id
                        ? 'text-accent font-semibold bg-[var(--accent-soft)]'
                        : 'text-muted hover:text-ink hover:bg-[var(--bg-active)]'"
                    >
                      {{ sub.label }}
                    </a>
                  </div>
                </template>
              </div>
            </div>
          </nav>

          <!-- Compact Sidebar Footer -->
          <div class="px-3 py-2.5 hairline-t flex items-center justify-between text-xs text-muted">
            <span class="tabular-nums">{{ sidebarProjects.length }} active</span>
            <a :href="publicFormUrl" target="_blank" rel="noopener" class="hover:text-ink transition-colors font-medium">
              Public Form
            </a>
          </div>
        </aside>

        <!-- Mobile Drawer -->
        <div
          v-if="mobileMenuOpen"
          class="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div @click="mobileMenuOpen = false" class="fixed inset-0 modal-backdrop"></div>

          <div class="relative flex flex-col max-w-xs w-full surface-sidebar shadow-xl z-10 hairline-r">
            <div class="h-12 flex items-center justify-between px-4 hairline-b">
              <div class="flex items-center gap-2">
                <span class="ch-mark w-6 h-6 text-[11px]" aria-hidden="true">CH</span>
                <span class="font-semibold text-sm text-ink">ClientHub</span>
              </div>
              <button type="button" @click="mobileMenuOpen = false" aria-label="Close navigation menu" class="btn-ghost p-2">
                <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="p-3 hairline-b">
              <a
                href="#/projects/new"
                @click="mobileMenuOpen = false"
                class="w-full btn-primary justify-center"
              >
                New Project
              </a>
            </div>

            <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Mobile Navigation">
              <a
                v-for="item in navigation"
                :key="'mob-' + item.name"
                :href="item.route"
                @click="mobileMenuOpen = false"
                class="flex items-center justify-between px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors"
                :class="isActive(item.route)
                  ? 'surface-active text-ink font-semibold'
                  : 'text-sub hover:bg-[var(--bg-active)]'"
              >
                <span class="flex items-center gap-3">
                  <svg class="w-4 h-4" aria-hidden="true" :class="isActive(item.route) ? 'text-accent' : 'text-muted'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                  </svg>
                  <span>{{ item.name }}</span>
                </span>
                <span
                  v-if="item.badgeKey === 'submissions' && pendingSubmissionsCount > 0"
                  class="px-2 py-0.5 text-xs font-semibold rounded-[4px] border badge-blue tabular-nums"
                >
                  {{ pendingSubmissionsCount }}
                </span>
              </a>
            </nav>

            <div class="p-3 hairline-t space-y-1">
              <button
                type="button"
                @click="toggleTheme"
                class="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-ink rounded-[6px] row-hover"
              >
                <span>Appearance</span>
                <span class="text-muted">{{ theme === 'dark' ? 'Dark' : 'Light' }}</span>
              </button>
              <button
                type="button"
                @click="mobileMenuOpen = false; showProfileModal = true;"
                class="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-ink rounded-[6px] row-hover text-left"
              >
                Profile Settings
              </button>
              <button
                type="button"
                @click="mobileMenuOpen = false; showPasswordModal = true;"
                class="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-ink rounded-[6px] row-hover text-left"
              >
                Change Password
              </button>
              <button
                type="button"
                @click="logout"
                class="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-st-red font-semibold rounded-[6px] row-hover text-left"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <!-- Main Scrollable Canvas -->
        <main class="flex-1 min-w-0 overflow-y-auto surface-canvas">
          <slot></slot>
        </main>
      </div>

      <!-- Global Search / Command Palette Modal -->
      <div
        v-if="showSearchModal"
        class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        role="dialog"
        aria-modal="true"
        aria-label="Global workspace search"
      >
        <div @click="showSearchModal = false" class="fixed inset-0 modal-backdrop"></div>
        <div class="relative w-full max-w-lg surface-popover overflow-hidden z-10 animate-in">
          <div class="flex items-center gap-2.5 px-3.5 py-2.5 hairline-b">
            <svg class="w-4 h-4 text-muted shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              ref="globalSearchInput"
              v-model="searchQuery"
              @keydown="handleSearchKeydown"
              type="text"
              placeholder="Jump to project, client, task, or action..."
              class="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              @click="showSearchModal = false"
              aria-label="Close search"
              class="text-[11px] font-medium px-1.5 py-0.5 rounded surface-subtle border hairline text-muted"
            >
              Esc
            </button>
          </div>

          <div class="max-h-80 overflow-y-auto py-1.5">
            <div v-if="searchLoading" class="p-4 space-y-2">
              <div class="skeleton-bar h-4 w-3/4"></div>
              <div class="skeleton-bar h-4 w-1/2"></div>
            </div>

            <div v-else-if="searchResults.length === 0" class="px-4 py-8 text-center text-xs text-muted">
              No projects, clients, or tasks matched "{{ searchQuery }}".
            </div>

            <button
              v-else
              v-for="(item, idx) in searchResults"
              :key="item.key"
              type="button"
              @click="selectSearchItem(item)"
              @mouseenter="activeSearchIndex = idx"
              class="w-full px-3.5 py-2 flex items-center justify-between gap-3 text-left transition-colors"
              :class="activeSearchIndex === idx ? 'surface-active' : ''"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <span v-if="item.status" class="status-sq" :class="getStatusDotClass(item.status)" aria-hidden="true"></span>
                <span v-else class="status-sq st-neutral" aria-hidden="true"></span>
                <div class="min-w-0">
                  <p class="text-[13px] font-medium text-ink truncate">{{ item.title }}</p>
                  <p class="text-[11px] text-muted truncate">{{ item.subtitle }}</p>
                </div>
              </div>
              <span class="text-[11px] font-medium px-1.5 py-0.5 rounded surface-subtle border hairline text-sub shrink-0">
                {{ item.type }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Profile & Password Modals -->
      <profile-modal
        v-if="showProfileModal"
        @close="showProfileModal = false"
        @saved="showProfileModal = false"
      />

      <change-password-modal
        v-if="showPasswordModal"
        @close="showPasswordModal = false"
        @saved="showPasswordModal = false"
      />
    </div>
  `
};
