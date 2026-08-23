/**
 * Modals & Dialog Components for Client Management System
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
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">

        <div class="flex items-start gap-4">
          <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', confirmType === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600']">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
            <p class="text-sm text-slate-600 mt-1.5 leading-relaxed">{{ message }}</p>
          </div>
        </div>
        <div class="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="$emit('confirm')"
            :class="['px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors', confirmType === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800']"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `
};

// 2. Client Create/Edit Modal
window.ClientModal = {
  props: ['client'],
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      error: '',
      form: {
        name: this.client?.name || '',
        email: this.client?.email || '',
        phone: this.client?.phone || '',
        company: this.client?.company || '',
        address: this.client?.address || '',
        notes: this.client?.notes || ''
      }
    };
  },
  methods: {
    async handleSubmit() {
      if (!this.form.name.trim()) {
        this.error = 'Client name is required';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        if (this.client?.id) {
          await window.API.clients.update(this.client.id, this.form);
          window.Utils.toast('Client updated successfully', 'success');
        } else {
          await window.API.clients.create(this.form);
          window.Utils.toast('Client created successfully', 'success');
        }
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save client';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 z-10 max-h-[90vh] overflow-y-auto animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">{{ client?.id ? 'Edit Client' : 'New Client' }}</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Full Name *</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="e.g. Budi Santoso"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Email</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                placeholder="budi@example.com"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Phone</label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                placeholder="+62 812 3456 789"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Company</label>
            <input
              v-model="form.company"
              type="text"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="PT Maju Bersama"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Address</label>
            <textarea
              v-model="form.address"
              rows="2"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Office or home address"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Notes</label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Internal notes regarding client"
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <span v-if="loading" class="spinner"></span>
              {{ client?.id ? 'Save Changes' : 'Create Client' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 3. Project Create/Edit Modal
window.ProjectModal = {
  props: ['project', 'defaultClientId'],
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      clientsLoading: true,
      servicesLoading: true,
      error: '',
      clients: [],
      services: [],
      form: {
        client_id: this.project?.client_id || this.defaultClientId || '',
        service_id: this.project?.service_id || '',
        title: this.project?.title || '',
        description: this.project?.description || '',
        status: this.project?.status || 'Pending',
        start_date: this.project?.start_date || '',
        end_date: this.project?.end_date || '',
        total_budget: this.project?.total_budget || 0,
        currency: this.project?.currency || 'IDR'
      }
    };
  },
  async mounted() {
    try {
      const [clientRes, serviceRes] = await Promise.all([
        window.API.clients.getAll({ per_page: 100 }),
        window.API.services.getAll()
      ]);
      this.clients = clientRes.data?.data || [];
      this.services = serviceRes.data?.data || [];

      if (!this.form.service_id && this.services.length > 0) {
        this.form.service_id = this.services[0].id;
      }
    } catch (err) {
      this.error = 'Failed to load clients or services list';
    } finally {
      this.clientsLoading = false;
      this.servicesLoading = false;
    }
  },
  methods: {
    async handleSubmit() {
      if (!this.form.client_id) {
        this.error = 'Please select a client';
        return;
      }
      if (!this.form.title.trim()) {
        this.error = 'Project title is required';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        if (this.project?.id) {
          await window.API.projects.update(this.project.id, this.form);
          window.Utils.toast('Project updated successfully', 'success');
        } else {
          await window.API.projects.create(this.form);
          window.Utils.toast('Project created successfully', 'success');
        }
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save project';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 z-10 max-h-[90vh] overflow-y-auto animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">{{ project?.id ? 'Edit Project' : 'New Project' }}</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Client *</label>
              <select
                v-model="form.client_id"
                required
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option value="" disabled>Select a client...</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }} ({{ c.company || 'Personal' }})</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Service Type *</label>
              <select
                v-model="form.service_id"
                required
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option value="" disabled>Select service...</option>
                <option v-for="s in services" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Project Title *</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="e.g. Website Redesign & SEO"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Total Budget (IDR) *</label>
              <input
                v-model.number="form.total_budget"
                type="number"
                min="0"
                step="1000"
                required
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Status</label>
              <select
                v-model="form.status"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Start Date</label>
              <input
                v-model="form.start_date"
                type="date"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Target End Date</label>
              <input
                v-model="form.end_date"
                type="date"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Description / Scope</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Brief details about deliverables & milestones..."
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <span v-if="loading" class="spinner"></span>
              {{ project?.id ? 'Save Changes' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 4. Expense Create/Edit Modal
window.ExpenseModal = {
  props: ['projectId', 'expense'],
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      error: '',
      form: {
        description: this.expense?.description || '',
        amount: this.expense?.amount || 0,
        category: this.expense?.category || 'Hosting',
        expense_date: this.expense?.expense_date || new Date().toISOString().split('T')[0],
        notes: this.expense?.notes || ''
      },
      categories: ['Materials', 'Labor', 'Hosting', 'Software', 'Transportation', 'Other']
    };
  },
  methods: {
    async handleSubmit() {
      if (!this.form.description.trim()) {
        this.error = 'Expense description is required';
        return;
      }
      if (this.form.amount <= 0) {
        this.error = 'Amount must be greater than 0';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        if (this.expense?.id) {
          await window.API.projects.updateExpense(this.expense.id, this.form);
          window.Utils.toast('Expense updated successfully', 'success');
        } else {
          await window.API.projects.createExpense(this.projectId, this.form);
          window.Utils.toast('Expense added successfully', 'success');
        }
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to record expense';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">{{ expense?.id ? 'Edit Expense' : 'Add Project Expense' }}</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Description *</label>
            <input
              v-model="form.description"
              type="text"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="e.g. Domain registration & SSL"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Amount (IDR) *</label>
              <input
                v-model.number="form.amount"
                type="number"
                min="0"
                step="1000"
                required
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Category</label>
              <select
                v-model="form.category"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Expense Date</label>
            <input
              v-model="form.expense_date"
              type="date"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Notes</label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Vendor details, invoice reference..."
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" :disabled="loading" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              {{ expense?.id ? 'Save Changes' : 'Record Expense' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 5. Payment Create/Edit Modal
window.PaymentModal = {
  props: ['projectId', 'payment'],
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      error: '',
      form: {
        amount: this.payment?.amount || 0,
        payment_date: this.payment?.payment_date || new Date().toISOString().split('T')[0],
        payment_method: this.payment?.payment_method || 'Bank Transfer',
        status: this.payment?.status || 'Received',
        notes: this.payment?.notes || ''
      },
      paymentMethods: ['Bank Transfer', 'Cash', 'E-Wallet', 'Credit Card', 'Other'],
      statuses: ['Received', 'Pending', 'Refunded']
    };
  },
  methods: {
    async handleSubmit() {
      if (this.form.amount <= 0) {
        this.error = 'Amount must be greater than 0';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        if (this.payment?.id) {
          await window.API.projects.updatePayment(this.payment.id, this.form);
          window.Utils.toast('Payment updated successfully', 'success');
        } else {
          await window.API.projects.createPayment(this.projectId, this.form);
          window.Utils.toast('Payment recorded successfully', 'success');
        }
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to record payment';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">{{ payment?.id ? 'Edit Payment' : 'Record Client Payment' }}</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Amount (IDR) *</label>
            <input
              v-model.number="form.amount"
              type="number"
              min="0"
              step="1000"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Payment Method</label>
              <select
                v-model="form.payment_method"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option v-for="m in paymentMethods" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Status</label>
              <select
                v-model="form.status"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Payment Date</label>
            <input
              v-model="form.payment_date"
              type="date"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Notes</label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Bank reference number, receipt notes..."
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" :disabled="loading" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              {{ payment?.id ? 'Save Changes' : 'Record Payment' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 6. Communication Create Modal
window.CommunicationModal = {
  props: ['projectId'],
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      error: '',
      form: {
        type: 'whatsapp',
        subject: '',
        contact_info: '',
        content: '',
        direction: 'outgoing'
      }
    };
  },
  methods: {
    async handleSubmit() {
      if (!this.form.content.trim()) {
        this.error = 'Communication content is required';
        return;
      }

      this.loading = true;
      this.error = '';

      try {
        await window.API.projects.createCommunication(this.projectId, this.form);
        window.Utils.toast('Interaction logged successfully', 'success');
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to log interaction';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">Log Communication</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Type</label>
              <select
                v-model="form.type"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="note">Internal Note</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Direction</label>
              <select
                v-model="form.direction"
                class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option value="outgoing">Outgoing</option>
                <option value="incoming">Incoming</option>
              </select>
            </div>
          </div>

          <div v-if="form.type === 'email'">
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Subject</label>
            <input
              v-model="form.subject"
              type="text"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="e.g. Project Quotation & Timeline"
            />
          </div>

          <div v-if="form.type !== 'note'">
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Contact Details</label>
            <input
              v-model="form.contact_info"
              type="text"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Recipient email or phone number"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Content / Summary *</label>
            <textarea
              v-model="form.content"
              rows="4"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Summary of conversation, action items, or notes..."
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" :disabled="loading" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              Log Interaction
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 7. File Upload Modal
window.FileUploadModal = {
  props: ['projectId', 'clientId'],
  emits: ['close', 'saved'],
  data() {
    return {
      loading: false,
      error: '',
      file: null,
      fileName: ''
    };
  },
  methods: {
    handleFileChange(event) {
      const selected = event.target.files[0];
      if (selected) {
        if (selected.size > 5242880) {
          this.error = 'File exceeds maximum 5MB limit';
          this.file = null;
          this.fileName = '';
          return;
        }
        this.file = selected;
        this.fileName = selected.name;
        this.error = '';
      }
    },
    async handleUpload() {
      if (!this.file) {
        this.error = 'Please select a file to upload';
        return;
      }

      this.loading = true;
      this.error = '';

      const formData = new FormData();
      formData.append('file', this.file);
      if (this.projectId) formData.append('project_id', this.projectId);
      if (this.clientId) formData.append('client_id', this.clientId);

      try {
        await window.API.files.upload(formData);
        window.Utils.toast('File uploaded successfully', 'success');
        this.$emit('saved');
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to upload file';
      } finally {
        this.loading = false;
      }
    }
  },
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">Upload Attachment</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleUpload" class="space-y-4">
          <div class="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-6 text-center cursor-pointer relative bg-slate-50/50">
            <input
              type="file"
              @change="handleFileChange"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div class="flex flex-col items-center">
              <svg class="w-10 h-10 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <p class="text-sm font-medium text-slate-700">
                {{ fileName || 'Click or drag file to upload' }}
              </p>
              <p class="text-xs text-slate-400 mt-1">PDF, DOC, XLS, PNG, JPG, ZIP (Max 5MB)</p>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" :disabled="loading || !file" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              Upload File
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 8. Admin Profile Modal
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
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">Admin Profile</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Username *</label>
            <input
              v-model="form.username"
              type="text"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" :disabled="loading" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 9. Change Password Modal
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
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      <div class="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <h3 class="text-lg font-semibold text-slate-900">Change Password</h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Current Password *</label>
            <input
              v-model="form.current_password"
              type="password"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">New Password *</label>
            <input
              v-model="form.new_password"
              type="password"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Confirm New Password *</label>
            <input
              v-model="form.confirm_password"
              type="password"
              required
              class="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="$emit('close')" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" :disabled="loading" class="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2">
              <span v-if="loading" class="spinner"></span>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  `
};

// 10. Reusable Pagination Component
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
    <div v-if="total > 0" class="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
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

