/**
 * Services View (Service Offerings Catalog with Inline Form)
 */

window.ServicesView = {
  components: {
    ConfirmModal: window.ConfirmModal
  },
  data() {
    return {
      loading: true,
      services: [],
      showInlineForm: false,
      selectedService: null,
      deleteTarget: null,
      formLoading: false,
      formError: '',
      form: {
        name: '',
        description: '',
        is_active: 1
      }
    };
  },
  async mounted() {
    await this.fetchServices();
  },
  methods: {
    async fetchServices() {
      this.loading = true;
      try {
        const response = await window.API.services.getAll();
        this.services = response.data?.data || [];
      } catch (err) {
        window.Utils.toast('Failed to load services', 'error');
      } finally {
        this.loading = false;
      }
    },
    openCreate() {
      this.selectedService = null;
      this.form = { name: '', description: '', is_active: 1 };
      this.formError = '';
      this.showInlineForm = true;
    },
    openEdit(service) {
      this.selectedService = service;
      this.form = {
        name: service.name,
        description: service.description || '',
        is_active: service.is_active ? 1 : 0
      };
      this.formError = '';
      this.showInlineForm = true;
    },
    async handleSubmit() {
      if (!this.form.name.trim()) {
        this.formError = 'Service name is required';
        return;
      }

      this.formLoading = true;
      this.formError = '';

      try {
        if (this.selectedService?.id) {
          await window.API.services.update(this.selectedService.id, this.form);
          window.Utils.toast('Service updated successfully', 'success');
        } else {
          await window.API.services.create(this.form);
          window.Utils.toast('Service created successfully', 'success');
        }
        this.showInlineForm = false;
        await this.fetchServices();
      } catch (err) {
        this.formError = err.response?.data?.message || 'Failed to save service';
      } finally {
        this.formLoading = false;
      }
    },
    async executeDelete() {
      if (!this.deleteTarget) return;
      try {
        await window.API.services.delete(this.deleteTarget.id);
        window.Utils.toast('Service deleted', 'success');
        this.deleteTarget = null;
        await this.fetchServices();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to delete service', 'error');
      }
    }
  },
  template: `
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Services Catalog</h1>
          <p class="text-sm text-slate-500 mt-0.5">Manage your agency service offerings and deliverables</p>
        </div>
        <button
          @click="showInlineForm ? showInlineForm = false : openCreate()"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          {{ showInlineForm ? 'Close Form' : 'Add Service' }}
        </button>
      </div>

      <!-- INLINE Service Form Card -->
      <div v-if="showInlineForm" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8 animate-in">
        <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h2 class="text-base font-bold text-slate-900">{{ selectedService ? 'Edit Service Offering' : 'New Service Offering' }}</h2>
          <button @click="showInlineForm = false" class="text-xs font-semibold text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </div>

        <div v-if="formError" class="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {{ formError }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div class="sm:col-span-2">
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Service Name *</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 font-medium"
                placeholder="e.g. Custom Web Application Development"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Status</label>
              <select
                v-model="form.is_active"
                class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              >
                <option :value="1">Active (Available in dropdowns)</option>
                <option :value="0">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Description & Scope</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 leading-relaxed"
              placeholder="Detail deliverables, features included, SLA, or tech stack..."
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" @click="showInlineForm = false" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
            <button type="submit" :disabled="formLoading" class="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2">
              <span v-if="formLoading" class="spinner"></span>
              {{ selectedService ? 'Save Changes' : 'Create Service' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner w-8 h-8"></div>
        <p class="text-sm text-slate-500 mt-3">Loading services catalog...</p>
      </div>

      <!-- Services Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
        <div
          v-for="s in services"
          :key="s.id"
          class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div class="flex items-start justify-between gap-3 mb-2">
              <h3 class="text-base font-bold text-slate-900">{{ s.name }}</h3>
              <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase"
                :class="s.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'"
              >
                {{ s.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed mt-2">
              {{ s.description || 'No description provided for this service offering.' }}
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">
              {{ s.project_count || 0 }} projects linked
            </span>

            <div class="flex items-center gap-1">
              <button
                @click="openEdit(s)"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Edit Service"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              <button
                @click="deleteTarget = s"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Delete Service"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation (Static Backdrop) -->
      <confirm-modal
        v-if="deleteTarget"
        title="Delete Service"
        :message="'Are you sure you want to delete ' + deleteTarget.name + '?'"
        @confirm="executeDelete"
        @cancel="deleteTarget = null"
      />
    </div>
  `
};
