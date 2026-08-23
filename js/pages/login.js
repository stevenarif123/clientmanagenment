/**
 * Login & Setup Views
 */

window.LoginView = {
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: ''
    };
  },
  methods: {
    async handleLogin() {
      if (!this.username || !this.password) {
        this.error = 'Please enter both username and password';
        return;
      }

      this.loading = true;
      this.error = '';

      const result = await window.Auth.login({
        username: this.username,
        password: this.password
      });

      if (result.success) {
        window.Utils.toast('Welcome back!', 'success');
        window.location.hash = '#/';
      } else {
        this.error = result.message || 'Invalid username or password';
      }

      this.loading = false;
    }
  },
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 animate-in">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Sign In to ClientHub</h1>
          <p class="text-sm text-slate-500 mt-1">Enter your admin credentials to access your dashboard</p>
        </div>

        <div v-if="error" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
          <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Username</label>
            <input
              v-model="username"
              type="text"
              required
              autocomplete="username"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="admin"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Password</label>
            <input
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="spinner"></span>
            Sign In
          </button>
        </form>
      </div>
    </div>
  `
};

window.SetupView = {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      loading: false,
      error: ''
    };
  },
  methods: {
    async handleSetup() {
      if (this.password.length < 6) {
        this.error = 'Password must be at least 6 characters';
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.error = 'Passwords do not match';
        return;
      }

      this.loading = true;
      this.error = '';

      const result = await window.Auth.setup({
        username: this.username,
        email: this.email,
        password: this.password
      });

      if (result.success) {
        window.Utils.toast('System setup completed successfully!', 'success');
        window.location.hash = '#/';
      } else {
        this.error = result.message || 'Setup failed';
      }

      this.loading = false;
    }
  },
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 animate-in">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Initial Admin Setup</h1>
          <p class="text-sm text-slate-500 mt-1">Create the primary administrator account for ClientHub</p>
        </div>

        <div v-if="error" class="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSetup" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Admin Username *</label>
            <input
              v-model="username"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="admin"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
            <input
              v-model="email"
              type="email"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="admin@yourdomain.com"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Password *</label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Confirm Password *</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="spinner"></span>
            Create Admin Account & Launch
          </button>
        </form>
      </div>
    </div>
  `
};
