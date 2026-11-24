/**
 * Core Dialogs & Pagination Components for Client Management System
 */

// 1. Generic Confirmation Modal
window.ConfirmModal = {
  props: {
    title: { type: String, default: 'Confirm Action' },
    message: { type: String, default: 'Are you sure you want to proceed?' },
    confirmText: { type: String, default: 'Delete' },
    confirmType: { type: String, default: 'danger' } // 'danger' or 'primary'
  },
  emits: ['confirm', 'cancel'],
  mounted() {
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.$emit('cancel');
    };
    window.addEventListener('keydown', this._escHandler);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this._escHandler);
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div @click="$emit('cancel')" class="fixed inset-0 modal-backdrop transition-opacity"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-start gap-4">
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', confirmType === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900">{{ title }}</h3>
            <p class="text-sm text-slate-600 mt-1.5 leading-relaxed">{{ message }}</p>
          </div>
        </div>
        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="$emit('confirm')"
            :class="['px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-colors', confirmType === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800']"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
};

// 2. Admin Profile Modal
window.ProfileModal = {
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      error: '',
      form: {
        username: window.Auth.admin?.username || '',
        email: window.Auth.admin?.email || ''
      }
    };
  },
  mounted() {
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.$emit('close');
    };
    window.addEventListener('keydown', this._escHandler);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this._escHandler);
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      this.error = '';

      try {
        const response = await window.API.auth.updateProfile(this.form);
        window.Auth.admin = response.data.data;
        window.Utils.toast('Profile updated successfully', 'success');
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update profile';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div @click="$emit('close')" class="fixed inset-0 modal-backdrop"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Admin Profile</h3>
          <button @click="$emit('close')" aria-label="Close modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Username *</label>
            <input
              v-model="form.username"
              type="text"
              required
              class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
            />
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button type="submit" :disabled="loading" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 3. Change Password Modal
window.ChangePasswordModal = {
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      error: '',
      form: {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
    };
  },
  mounted() {
    this._escHandler = (e) => {
      if (e.key === 'Escape') this.$emit('close');
    };
    window.addEventListener('keydown', this._escHandler);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this._escHandler);
  },
  methods: {
    async handleSubmit() {
      if (this.form.new_password !== this.form.confirm_password) {
        this.error = 'New passwords do not match';
        return;
      }
      if (this.form.new_password.length < 6) {
        this.error = 'New password must be at least 6 characters';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        await window.API.auth.changePassword({
          current_password: this.form.current_password,
          new_password: this.form.new_password
        });
        window.Utils.toast('Password changed successfully', 'success');
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to change password';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div @click="$emit('close')" class="fixed inset-0 modal-backdrop"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-bold text-slate-900">Change Password</h3>
          <button @click="$emit('close')" aria-label="Close modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Current Password *</label>
            <input
              v-model="form.current_password"
              type="password"
              required
              class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">New Password *</label>
            <input
              v-model="form.new_password"
              type="password"
              required
              class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Confirm New Password *</label>
            <input
              v-model="form.confirm_password"
              type="password"
              required
              class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
            />
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button type="submit" :disabled="loading" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 4. Reusable Pagination Component
window.Pagination = {
  props: {
    page: { type: Number, default: 1 },
    total: { type: Number, default: 0 },
    perPage: { type: Number, default: 20 }
  },
  emits: ['change'],
  computed: {
    totalPages() {
      return Math.max(1, Math.ceil(this.total / this.perPage));
    },
    from() {
      if (this.total === 0) return 0;
      return (this.page - 1) * this.perPage + 1;
    },
    to() {
      return Math.min(this.page * this.perPage, this.total);
    }
  },
  template: `
    <div v-if="total > 0" class="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="text-xs text-slate-500 font-medium">
        Showing <span class="font-bold text-slate-700">{{ from }}</span> to <span class="font-bold text-slate-700">{{ to }}</span> of <span class="font-bold text-slate-700">{{ total }}</span> records
      </div>
      <div class="flex items-center gap-2">
        <button
          :disabled="page <= 1"
          @click="$emit('change', page - 1)"
          class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span class="text-xs font-semibold text-slate-600 px-2">Page {{ page }} of {{ totalPages }}</span>
        <button
          :disabled="page >= totalPages"
          @click="$emit('change', page + 1)"
          class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  `
};
