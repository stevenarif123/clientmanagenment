/**
 * App Layout Component (Sidebar, Mobile Drawer, User Menu & Shell)
 */

window.AppLayout = {
  components: {
    ProfileModal: window.ProfileModal,
    ChangePasswordModal: window.ChangePasswordModal
  },
  props: ['currentRoute'],
  data() {
    return {
      mobileMenuOpen: false,
      userMenuOpen: false,
      showProfileModal: false,
      showPasswordModal: false,
      pendingSubmissionsCount: 0,
      navigation: [
        { name: 'Dashboard', route: '#/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { name: 'Clients', route: '#/clients', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Projects', route: '#/projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        { name: 'Task Board', route: '#/tasks', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
        { name: 'Submissions', route: '#/submissions', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4', badgeKey: 'submissions' },
        { name: 'Services', route: '#/services', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        { name: 'Reports', route: '#/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
      ]
    };
  },
  computed: {
    admin() {
      return window.Auth.admin;
    },
    publicFormUrl() {
      return window.Utils.resolveAssetUrl('public-contact-form.html');
    }
  },
  watch: {
    currentRoute() {
      this.userMenuOpen = false;
      this.mobileMenuOpen = false;
      this.fetchNotificationCount();
    }
  },
  mounted() {
    this._outsideClick = (e) => {
      if (this.userMenuOpen && this.$refs.userMenuContainer && !this.$refs.userMenuContainer.contains(e.target)) {
        this.userMenuOpen = false;
      }
    };
    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        this.userMenuOpen = false;
        this.mobileMenuOpen = false;
      }
    };
    document.addEventListener('click', this._outsideClick);
    window.addEventListener('keydown', this._escHandler);
    this.fetchNotificationCount();
  },
  beforeUnmount() {
    document.removeEventListener('click', this._outsideClick);
    window.removeEventListener('keydown', this._escHandler);
  },
  methods: {
    async fetchNotificationCount() {
      try {
        const res = await window.API.submissions.getAll({ status: 'New', per_page: 1 });
        this.pendingSubmissionsCount = res.data?.meta?.total || 0;
      } catch (e) {
        // Silent background check
      }
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
    <div class="flex h-screen bg-slate-50 overflow-hidden">
      <!-- Desktop Sidebar -->
      <aside class="w-64 bg-white border-r border-slate-200/80 hidden lg:flex flex-col shrink-0">
        <!-- Brand Logo -->
        <div class="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <a href="#/" class="flex items-center gap-3 group">
            <div class="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-600 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div>
              <span class="font-bold text-slate-900 tracking-tight text-base block leading-none">ClientHub</span>
              <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1 block">Workspace</span>
            </div>
          </a>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 p-3.5 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          <a
            v-for="item in navigation"
            :key="item.name"
            :href="item.route"
            class="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            :class="isActive(item.route)
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'"
          >
            <div class="flex items-center gap-3 min-w-0">
              <svg class="w-4 h-4 shrink-0" :class="isActive(item.route) ? 'text-indigo-300' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
              </svg>
              <span class="truncate">{{ item.name }}</span>
            </div>
            <span
              v-if="item.badgeKey === 'submissions' && pendingSubmissionsCount > 0"
              class="px-2 py-0.5 text-[10px] font-bold rounded-full tabular-nums"
              :class="isActive(item.route) ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'"
            >
              {{ pendingSubmissionsCount }}
            </span>
          </a>

          <!-- Quick Utility Link -->
          <div class="pt-4 mt-4 border-t border-slate-100">
            <p class="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">External</p>
            <a
              :href="publicFormUrl"
              target="_blank"
              class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-colors"
            >
              <span class="flex items-center gap-2.5">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
                Public Contact Form
              </span>
            </a>
          </div>
        </nav>

        <!-- User Profile & Dropdown -->
        <div ref="userMenuContainer" class="p-3.5 border-t border-slate-100 relative">
          <button
            type="button"
            @click="userMenuOpen = !userMenuOpen"
            class="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {{ (admin?.username || 'A').charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 truncate">{{ admin?.username || 'Admin' }}</p>
              <p class="text-xs text-slate-500 truncate">{{ admin?.email || 'Administrator' }}</p>
            </div>
            <svg class="w-4 h-4 text-slate-400 transition-transform" :class="{ 'rotate-180': userMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
            </svg>
          </button>

          <!-- User Menu Dropdown -->
          <div
            v-if="userMenuOpen"
            class="absolute bottom-full left-3.5 right-3.5 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in divide-y divide-slate-100"
          >
            <div class="px-4 py-2.5">
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
              <p class="text-sm font-semibold text-slate-900 truncate mt-0.5">{{ admin?.username }}</p>
            </div>
            <div class="py-1">
              <button
                @click="userMenuOpen = false; showProfileModal = true;"
                class="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Profile Settings
              </button>
              <button
                @click="userMenuOpen = false; showPasswordModal = true;"
                class="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                Change Password
              </button>
            </div>
            <div class="py-1">
              <button
                @click="logout"
                class="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Mobile Top Navigation Header -->
      <div class="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <button
          @click="mobileMenuOpen = true"
          aria-label="Open menu"
          class="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <a href="#/" class="font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span class="w-6 h-6 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs">C</span>
          ClientHub
        </a>

        <button
          @click="showProfileModal = true"
          aria-label="Profile settings"
          class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold"
        >
          {{ (admin?.username || 'A').charAt(0).toUpperCase() }}
        </button>
      </div>

      <!-- Mobile Drawer Backdrop & Menu -->
      <div
        v-if="mobileMenuOpen"
        class="lg:hidden fixed inset-0 z-50 flex"
      >
        <div @click="mobileMenuOpen = false" class="fixed inset-0 modal-backdrop transition-opacity"></div>

        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10">
          <div class="h-14 flex items-center justify-between px-5 border-b border-slate-100">
            <span class="font-bold text-slate-900">ClientHub</span>
            <button @click="mobileMenuOpen = false" aria-label="Close menu" class="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
            <a
              v-for="item in navigation"
              :key="item.name"
              :href="item.route"
              @click="mobileMenuOpen = false"
              class="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              :class="isActive(item.route)
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'"
            >
              <span class="flex items-center gap-3">
                <svg class="w-4 h-4" :class="isActive(item.route) ? 'text-indigo-300' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="item.icon" />
                </svg>
                {{ item.name }}
              </span>
              <span
                v-if="item.badgeKey === 'submissions' && pendingSubmissionsCount > 0"
                class="px-2 py-0.5 text-[10px] font-bold rounded-full"
                :class="isActive(item.route) ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-700'"
              >
                {{ pendingSubmissionsCount }}
              </span>
            </a>
          </nav>

          <div class="p-4 border-t border-slate-100 space-y-1.5">
            <button
              @click="mobileMenuOpen = false; showProfileModal = true;"
              class="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Profile Settings
            </button>
            <button
              @click="mobileMenuOpen = false; showPasswordModal = true;"
              class="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50"
            >
              Change Password
            </button>
            <button
              @click="logout"
              class="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 font-semibold rounded-xl hover:bg-rose-50"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto pt-14 lg:pt-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8 animate-in">
          <slot></slot>
        </div>
      </main>

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
