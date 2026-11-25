/**
 * Core Dialogs & Pagination Components for ClientHub Workspace
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
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" :aria-label="title">
      <div @click="$emit('cancel')" class="fixed inset-0 modal-backdrop"></div>
      <div class="relative surface-popover max-w-md w-full p-5 z-10 animate-in">
        <div class="flex items-start gap-3.5">
          <div
            :class="[
              'w-9 h-9 rounded-[6px] border flex items-center justify-center shrink-0',
              confirmType === 'danger' ? 'badge-red' : 'badge-blue'
            ]"
            aria-hidden="true"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-sm font-semibold text-ink">{{ title }}</h3>
            <p class="text-[13px] text-sub mt-1 leading-relaxed">{{ message }}</p>
          </div>
        </div>
        <div class="mt-5 pt-4 hairline-t flex items-center justify-end gap-2">
          <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancel</button>
          <button
            type="button"
            @click="$emit('confirm')"
            :class="confirmType === 'danger' ? 'btn-danger-solid' : 'btn-primary'"
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
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Admin Profile">
      <div @click="$emit('close')" class="fixed inset-0 modal-backdrop"></div>
      <div class="relative surface-popover max-w-md w-full p-5 z-10 animate-in">
        <div class="flex items-center justify-between pb-3.5 hairline-b mb-4">
          <h3 class="text-sm font-semibold text-ink">Admin Profile</h3>
          <button type="button" @click="$emit('close')" aria-label="Close profile dialog" class="btn-ghost p-1">
            <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 rounded-[6px] border badge-red text-[13px]">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="profile-username" class="field-label">Username *</label>
            <input
              id="profile-username"
              v-model="form.username"
              type="text"
              required
              class="field-input"
            />
          </div>

          <div>
            <label for="profile-email" class="field-label">Email Address</label>
            <input
              id="profile-email"
              v-model="form.email"
              type="email"
              class="field-input"
              placeholder="name@company.com"
            />
          </div>

          <div class="pt-4 hairline-t flex items-center justify-end gap-2">
            <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading" class="btn-primary">
              <span v-if="loading" class="spinner" aria-hidden="true"></span>
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
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Change Password">
      <div @click="$emit('close')" class="fixed inset-0 modal-backdrop"></div>
      <div class="relative surface-popover max-w-md w-full p-5 z-10 animate-in">
        <div class="flex items-center justify-between pb-3.5 hairline-b mb-4">
          <h3 class="text-sm font-semibold text-ink">Change Password</h3>
          <button type="button" @click="$emit('close')" aria-label="Close password dialog" class="btn-ghost p-1">
            <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 rounded-[6px] border badge-red text-[13px]">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="cp-current" class="field-label">Current Password *</label>
            <input
              id="cp-current"
              v-model="form.current_password"
              type="password"
              required
              autocomplete="current-password"
              class="field-input"
            />
          </div>

          <div>
            <label for="cp-new" class="field-label">New Password *</label>
            <input
              id="cp-new"
              v-model="form.new_password"
              type="password"
              required
              autocomplete="new-password"
              class="field-input"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label for="cp-confirm" class="field-label">Confirm New Password *</label>
            <input
              id="cp-confirm"
              v-model="form.confirm_password"
              type="password"
              required
              autocomplete="new-password"
              class="field-input"
            />
          </div>

          <div class="pt-4 hairline-t flex items-center justify-end gap-2">
            <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
            <button type="submit" :disabled="loading" class="btn-primary">
              <span v-if="loading" class="spinner" aria-hidden="true"></span>
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
    <div v-if="total > 0" class="px-5 py-3 surface-canvas hairline-t flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="text-xs text-muted tabular-nums">
        Showing <span class="font-semibold text-ink">{{ from }}</span> to <span class="font-semibold text-ink">{{ to }}</span> of <span class="font-semibold text-ink">{{ total }}</span> records
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="page <= 1"
          @click="$emit('change', page - 1)"
          class="btn-secondary px-2.5 py-1 text-xs"
        >
          Previous
        </button>
        <span class="text-xs font-medium text-sub px-1.5 tabular-nums">Page {{ page }} / {{ totalPages }}</span>
        <button
          type="button"
          :disabled="page >= totalPages"
          @click="$emit('change', page + 1)"
          class="btn-secondary px-2.5 py-1 text-xs"
        >
          Next
        </button>
      </div>
    </div>
  `
};
