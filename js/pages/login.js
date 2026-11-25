/**
 * Login & Initial Admin Setup Views
 */

window.LoginView = {
  data() {
    return {
      username: '',
      password: '',
      showPassword: false,
      loading: false,
      error: '',
      theme: window.Utils.getTheme()
    };
  },
  methods: {
    toggleTheme() {
      this.theme = window.Utils.toggleTheme();
    },
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
        window.Utils.toast('Signed in to ClientHub', 'success');
        window.location.hash = '#/';
      } else {
        this.error = result.message || 'Invalid username or password';
      }

      this.loading = false;
    }
  },
  template: `
    <div class="min-h-screen surface-chrome flex flex-col justify-between p-4 sm:p-6">
      <div class="flex items-center justify-between max-w-md w-full mx-auto">
        <span class="text-xs font-medium text-muted">ClientHub Workspace</span>
        <button
          type="button"
          @click="toggleTheme"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          class="btn-secondary text-xs py-1 px-2.5"
        >
          {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
        </button>
      </div>

      <div class="max-w-sm w-full mx-auto surface-card p-6 sm:p-7 my-auto animate-in">
        <div class="mb-6">
          <div class="ch-mark w-9 h-9 text-xs mb-3" aria-hidden="true">CH</div>
          <h1 class="text-lg font-bold text-ink tracking-tight">Sign in to ClientHub</h1>
          <p class="text-[13px] text-sub mt-1">Enter your administrator credentials to open the workspace.</p>
        </div>

        <div v-if="error" class="mb-4 p-3 rounded-[6px] border badge-red text-[13px] flex items-center gap-2">
          <svg class="w-4 h-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>{{ error }}</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="login-username" class="field-label">Username</label>
            <input
              id="login-username"
              v-model="username"
              type="text"
              required
              autocomplete="username"
              class="field-input"
              placeholder="admin"
            />
          </div>

          <div>
            <label for="login-password" class="field-label">Password</label>
            <div class="relative">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="field-input pr-10"
                placeholder="Enter password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1.5 rounded-[4px]"
              >
                <svg v-if="showPassword" class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                <svg v-else class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-2.5 mt-1"
          >
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            <span>Sign In</span>
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-muted">Self-hosted Client Operations Workspace</p>
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
      showPassword: false,
      loading: false,
      error: '',
      theme: window.Utils.getTheme()
    };
  },
  methods: {
    toggleTheme() {
      this.theme = window.Utils.toggleTheme();
    },
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
        window.Utils.toast('System setup completed successfully', 'success');
        window.location.hash = '#/';
      } else {
        this.error = result.message || 'Setup failed';
      }

      this.loading = false;
    }
  },
  template: `
    <div class="min-h-screen surface-chrome flex flex-col justify-between p-4 sm:p-6">
      <div class="flex items-center justify-between max-w-md w-full mx-auto">
        <span class="text-xs font-medium text-muted">ClientHub Setup</span>
        <button
          type="button"
          @click="toggleTheme"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          class="btn-secondary text-xs py-1 px-2.5"
        >
          {{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}
        </button>
      </div>

      <div class="max-w-sm w-full mx-auto surface-card p-6 sm:p-7 my-auto animate-in">
        <div class="mb-6">
          <div class="ch-mark w-9 h-9 text-xs mb-3" aria-hidden="true">CH</div>
          <h1 class="text-lg font-bold text-ink tracking-tight">Initial Admin Setup</h1>
          <p class="text-[13px] text-sub mt-1">Create the primary administrator account for ClientHub.</p>
        </div>

        <div v-if="error" class="mb-4 p-3 rounded-[6px] border badge-red text-[13px]">
          {{ error }}
        </div>

        <form @submit.prevent="handleSetup" class="space-y-4">
          <div>
            <label for="setup-username" class="field-label">Admin Username *</label>
            <input
              id="setup-username"
              v-model="username"
              type="text"
              required
              autocomplete="username"
              class="field-input"
              placeholder="admin"
            />
          </div>

          <div>
            <label for="setup-email" class="field-label">Email Address</label>
            <input
              id="setup-email"
              v-model="email"
              type="email"
              autocomplete="email"
              class="field-input"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label for="setup-password" class="field-label">Password *</label>
            <div class="relative">
              <input
                id="setup-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
                class="field-input pr-10"
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-1.5 rounded-[4px]"
              >
                <svg v-if="showPassword" class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                <svg v-else class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
          </div>

          <div>
            <label for="setup-confirm" class="field-label">Confirm Password *</label>
            <input
              id="setup-confirm"
              v-model="confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              class="field-input"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full py-2.5 mt-1"
          >
            <span v-if="loading" class="spinner" aria-hidden="true"></span>
            <span>Create Admin Account</span>
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-muted">Self-hosted Client Operations Workspace</p>
    </div>
  `
};
