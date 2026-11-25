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
      error: '',
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
      this.error = '';
      try {
        const response = await window.API.services.getAll();
        this.services = response.data?.data || [];
      } catch (err) {
        this.error = 'Failed to load services catalog.';
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
    async toggleActive(service) {
      try {
        await window.API.services.update(service.id, {
          name: service.name,
          description: service.description || '',
          is_active: service.is_active ? 0 : 1
        });
        service.is_active = service.is_active ? 0 : 1;
        window.Utils.toast('Service status updated', 'success');
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to update service', 'error');
      }
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
    <div class="flex flex-col min-h-full">
      <!-- Slim Top Header -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <h1 class="text-sm font-semibold text-ink tracking-tight">Services Catalog</h1>
          <span class="text-xs text-muted tabular-nums">{{ services.length }} offerings</span>
        </div>
        <button
          type="button"
          @click="showInlineForm ? showInlineForm = false : openCreate()"
          class="btn-primary text-xs py-1 px-2.5"
        >
          {{ showInlineForm ? 'Close Form' : 'Add Service' }}
        </button>
      </div>

      <div class="p-5 sm:p-6 space-y-6">
        <!-- INLINE Service Form Card -->
        <div v-if="showInlineForm" class="surface-card p-5 animate-in">
          <div class="flex items-center justify-between pb-3.5 hairline-b mb-4">
            <h2 class="text-sm font-semibold text-ink">{{ selectedService ? 'Edit Service Offering' : 'New Service Offering' }}</h2>
            <button type="button" @click="showInlineForm = false" class="btn-ghost text-xs py-1 px-2">Cancel</button>
          </div>

          <div v-if="formError" class="mb-4 p-3 rounded-[6px] border badge-red text-xs">
            {{ formError }}
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="sm:col-span-2">
                <label for="service-name" class="field-label">Service Name *</label>
                <input
                  id="service-name"
                  v-model="form.name"
                  type="text"
                  required
                  class="field-input font-medium"
                  placeholder="Custom Web Application Development"
                />
              </div>
              <div>
                <label for="service-status" class="field-label">Availability</label>
                <select id="service-status" v-model="form.is_active" class="field-input">
                  <option :value="1">Active (Shown in forms)</option>
                  <option :value="0">Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            <div>
              <label for="service-desc" class="field-label">Description &amp; Scope</label>
              <textarea
                id="service-desc"
                v-model="form.description"
                rows="3"
                class="field-input leading-relaxed"
                placeholder="Deliverables included, timeline assumptions, or stack notes..."
              ></textarea>
            </div>

            <div class="pt-3 hairline-t flex items-center justify-end gap-2">
              <button type="button" @click="showInlineForm = false" class="btn-secondary">Cancel</button>
              <button type="submit" :disabled="formLoading" class="btn-primary">
                <span v-if="formLoading" class="spinner" aria-hidden="true"></span>
                <span>{{ selectedService ? 'Save Changes' : 'Create Service' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Skeleton Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="n in 6" :key="'srv-sk-' + n" class="surface-card p-5 space-y-3">
            <div class="skeleton-bar h-4 w-2/3"></div>
            <div class="skeleton-bar h-3 w-full"></div>
            <div class="skeleton-bar h-3 w-4/5"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-5 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-st-red">{{ error }}</p>
          <button type="button" @click="fetchServices" class="btn-secondary">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="services.length === 0" class="surface-card p-10 text-center">
          <h2 class="text-sm font-semibold text-ink">No services defined yet</h2>
          <p class="text-xs text-sub mt-1">Create service packages so they populate project forms and your public contact form.</p>
          <button type="button" @click="openCreate" class="btn-primary mt-4">Add First Service</button>
        </div>

        <!-- Services Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in">
          <div
            v-for="s in services"
            :key="s.id"
            class="surface-card p-4 sm:p-5 hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between"
          >
            <div>
              <div class="flex items-start justify-between gap-3 mb-2">
                <h2 class="text-sm font-semibold text-ink leading-snug">{{ s.name }}</h2>
                <button
                  type="button"
                  @click="toggleActive(s)"
                  :aria-label="'Toggle status for ' + s.name"
                  title="Click to toggle status"
                  class="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-[4px] border shrink-0 transition-colors"
                  :class="s.is_active ? 'badge-green' : 'badge-neutral'"
                >
                  <span class="status-sq" :class="s.is_active ? 'st-green' : 'st-neutral'" aria-hidden="true"></span>
                  <span>{{ s.is_active ? 'Active' : 'Inactive' }}</span>
                </button>
              </div>

              <p class="text-xs text-sub leading-relaxed mt-1.5">
                {{ s.description || 'No scope description provided.' }}
              </p>
            </div>

            <div class="mt-4 pt-3 hairline-t flex items-center justify-between">
              <span class="text-xs font-medium text-muted tabular-nums">
                {{ s.project_count || 0 }} projects linked
              </span>

              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="openEdit(s)"
                  :aria-label="'Edit ' + s.name"
                  class="btn-ghost p-1.5"
                  title="Edit Service"
                >
                  <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                </button>
                <button
                  type="button"
                  @click="deleteTarget = s"
                  :aria-label="'Delete ' + s.name"
                  class="btn-ghost p-1.5 hover:text-st-red"
                  title="Delete Service"
                >
                  <svg class="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation -->
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
