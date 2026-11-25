/**
 * Submissions View (Contact Form Inquiries & Leads)
 */

window.SubmissionsView = {
  components: {
    ConfirmModal: window.ConfirmModal,
    Pagination: window.Pagination
  },
  data() {
    return {
      loading: true,
      error: '',
      submissions: [],
      total: 0,
      page: 1,
      perPage: 15,
      statusFilter: '',
      searchQuery: '',
      showDuplicates: false,
      selectedSubmission: null,
      showDetailModal: false,
      showConvertModal: false,
      convertCompany: '',
      convertAddress: '',
      convertLoading: false,
      deleteTarget: null,
      statuses: ['New', 'Reviewed', 'Converted', 'Spam']
    };
  },
  computed: {
    visibleSubmissions() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return this.submissions;
      return this.submissions.filter(s => {
        const hay = `${s.name || ''} ${s.email || ''} ${s.phone || ''} ${s.message || ''} ${s.service_name || ''}`.toLowerCase();
        return hay.includes(q);
      });
    },
    publicFormUrl() {
      return window.Utils.resolveAssetUrl('public-contact-form.html');
    }
  },
  async mounted() {
    this._escHandler = (e) => {
      if (e.key === 'Escape') {
        if (this.showConvertModal) this.showConvertModal = false;
        else if (this.showDetailModal) this.showDetailModal = false;
      }
    };
    window.addEventListener('keydown', this._escHandler);
    await this.fetchSubmissions();
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this._escHandler);
  },
  methods: {
    async fetchSubmissions() {
      this.loading = true;
      this.error = '';
      try {
        const response = await window.API.submissions.getAll({
          page: this.page,
          per_page: this.perPage,
          status: this.statusFilter,
          show_duplicates: this.showDuplicates
        });
        this.submissions = response.data?.data || [];
        this.total = response.data?.meta?.total ?? this.submissions.length;
      } catch (err) {
        this.error = 'Failed to load contact submissions.';
        window.Utils.toast('Failed to load submissions', 'error');
      } finally {
        this.loading = false;
      }
    },
    clearFilters() {
      this.statusFilter = '';
      this.searchQuery = '';
      this.showDuplicates = false;
      this.page = 1;
      this.fetchSubmissions();
    },
    handlePageChange(newPage) {
      this.page = newPage;
      this.fetchSubmissions();
    },
    async updateStatus(submission, newStatus) {
      try {
        await window.API.submissions.update(submission.id, { status: newStatus });
        submission.status = newStatus;
        window.Utils.toast('Status updated to ' + newStatus, 'success');
      } catch (err) {
        window.Utils.toast('Failed to update status', 'error');
      }
    },
    async openDetail(submission) {
      this.selectedSubmission = submission;
      this.showDetailModal = true;
      try {
        const res = await window.API.submissions.getOne(submission.id);
        if (res.data?.data) {
          this.selectedSubmission = res.data.data;
        }
      } catch (e) {
        // Keep list copy if detail fetch fails
      }
    },
    openConvert(submission) {
      this.selectedSubmission = submission;
      this.convertCompany = '';
      this.convertAddress = '';
      this.showConvertModal = true;
    },
    async executeConvert() {
      if (!this.selectedSubmission) return;
      this.convertLoading = true;
      try {
        await window.API.submissions.convertToClient(this.selectedSubmission.id, {
          company: this.convertCompany,
          address: this.convertAddress
        });
        window.Utils.toast('Lead converted to client successfully', 'success');
        this.showConvertModal = false;
        this.showDetailModal = false;
        await this.fetchSubmissions();
      } catch (err) {
        window.Utils.toast(err.response?.data?.message || 'Failed to convert lead', 'error');
      } finally {
        this.convertLoading = false;
      }
    },
    async executeDelete() {
      if (!this.deleteTarget) return;
      try {
        await window.API.submissions.delete(this.deleteTarget.id);
        window.Utils.toast('Submission deleted', 'success');
        this.deleteTarget = null;
        await this.fetchSubmissions();
      } catch (err) {
        window.Utils.toast('Failed to delete submission', 'error');
      }
    },
    formatDate(val) {
      return window.Utils.formatDate(val);
    },
    formatDateTime(val) {
      return window.Utils.formatDateTime(val);
    },
    getSubmissionStatusBadgeClass(status) {
      return window.Utils.getSubmissionStatusBadgeClass(status);
    },
    getWhatsAppUrl(phone, name) {
      const msg = `Halo ${name}, terima kasih telah menghubungi kami. Terkait inquiry proyek Anda...`;
      return window.Utils.getWhatsAppUrl(phone, msg);
    },
    getMailtoUrl(email, name) {
      const subject = `Re: Inquiry Web Development - ${name}`;
      return window.Utils.getMailtoUrl(email, subject);
    }
  },
  template: `
    <div class="flex flex-col min-h-full">
      <!-- Slim Page Header -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <h1 class="text-sm font-semibold text-ink tracking-tight">Contact Inquiries</h1>
          <span class="text-xs text-muted tabular-nums">{{ total }} total</span>
        </div>
        <a :href="publicFormUrl" target="_blank" rel="noopener" class="btn-secondary text-xs py-1 px-2.5">
          Open Contact Form
        </a>
      </div>

      <!-- Filter Strip -->
      <div class="px-5 sm:px-6 py-3 hairline-b surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div class="relative w-full sm:w-64">
            <svg class="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              aria-label="Filter submissions on page"
              placeholder="Filter current page..."
              class="field-input pl-8 py-1.5 text-xs"
            />
          </div>

          <select
            v-model="statusFilter"
            @change="page = 1; fetchSubmissions();"
            aria-label="Filter by submission status"
            class="field-input w-auto py-1.5 text-xs font-medium"
          >
            <option value="">All Statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>

          <label for="sub-show-dups" class="flex items-center gap-2 text-xs font-medium text-sub select-none">
            <input
              id="sub-show-dups"
              v-model="showDuplicates"
              @change="page = 1; fetchSubmissions();"
              type="checkbox"
              class="rounded border-[var(--border-strong)]"
            />
            <span>Show duplicates</span>
          </label>
        </div>

        <span class="text-xs text-muted tabular-nums">
          Showing {{ visibleSubmissions.length }} of {{ total }}
        </span>
      </div>

      <div class="p-5 sm:p-6">
        <!-- Skeleton Loading -->
        <div v-if="loading" class="surface-card overflow-hidden">
          <div class="p-4 space-y-3">
            <div v-for="n in 5" :key="'sub-sk-' + n" class="flex items-center justify-between gap-4">
              <div class="skeleton-bar h-4 w-48"></div>
              <div class="skeleton-bar h-4 w-28"></div>
              <div class="skeleton-bar h-4 w-20"></div>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-5 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm font-medium text-st-red">{{ error }}</p>
          <button type="button" @click="fetchSubmissions" class="btn-secondary">Retry</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="visibleSubmissions.length === 0" class="surface-card p-10 text-center">
          <h2 class="text-sm font-semibold text-ink">No submissions found</h2>
          <p class="text-xs text-sub mt-1">
            {{ (statusFilter || searchQuery) ? 'Try clearing the active search or status filter.' : 'Website leads submitted through your public contact form will appear here.' }}
          </p>
          <div class="mt-4 flex items-center justify-center gap-2">
            <button v-if="statusFilter || searchQuery" type="button" @click="clearFilters" class="btn-secondary text-xs">Clear Filters</button>
            <a :href="publicFormUrl" target="_blank" rel="noopener" class="btn-secondary text-xs">Preview Contact Form</a>
          </div>
        </div>

        <!-- Submissions Container -->
        <div v-else class="surface-card overflow-hidden animate-in">
          <!-- Mobile List -->
          <div class="md:hidden divide-hairline">
            <div
              v-for="sub in visibleSubmissions"
              :key="'m-sub-' + sub.id"
              class="p-4 space-y-2.5"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <button type="button" @click="openDetail(sub)" class="text-sm font-semibold text-ink hover:text-accent text-left truncate block">
                    {{ sub.name }}
                  </button>
                  <p class="text-xs text-muted mt-0.5">{{ sub.service_name || 'General Inquiry' }}</p>
                </div>
                <select
                  :value="sub.status"
                  @change="updateStatus(sub, $event.target.value)"
                  :aria-label="'Status for ' + sub.name"
                  class="text-[11px] font-semibold px-2 py-1 rounded-[4px] border shrink-0"
                  :class="getSubmissionStatusBadgeClass(sub.status)"
                >
                  <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <p class="text-xs text-sub line-clamp-2">{{ sub.message || 'No message provided' }}</p>
              <div class="flex items-center justify-between gap-2 pt-1">
                <div class="flex items-center gap-2">
                  <a v-if="sub.phone" :href="getWhatsAppUrl(sub.phone, sub.name)" target="_blank" rel="noopener" class="btn-secondary text-xs py-1 px-2">WA</a>
                  <a v-if="sub.email" :href="getMailtoUrl(sub.email, sub.name)" class="btn-secondary text-xs py-1 px-2">Email</a>
                </div>
                <div class="flex items-center gap-1.5">
                  <button v-if="sub.status !== 'Converted'" type="button" @click="openConvert(sub)" class="btn-primary text-xs py-1 px-2.5">
                    Convert
                  </button>
                  <a v-else-if="sub.converted_client_id" :href="'#/clients/' + sub.converted_client_id" class="btn-secondary text-xs py-1 px-2.5">
                    Client
                  </a>
                  <button type="button" @click="deleteTarget = sub" aria-label="Delete submission" class="btn-ghost p-1.5 hover:text-st-red">
                    <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="hairline-b surface-subtle text-xs font-semibold text-sub">
                  <th class="py-2.5 px-4">Sender</th>
                  <th class="py-2.5 px-4">Quick Contact</th>
                  <th class="py-2.5 px-4">Requested Service</th>
                  <th class="py-2.5 px-4">Received</th>
                  <th class="py-2.5 px-4">Status</th>
                  <th class="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-hairline text-[13px]">
                <tr
                  v-for="sub in visibleSubmissions"
                  :key="sub.id"
                  class="row-hover"
                >
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      <button type="button" @click="openDetail(sub)" class="font-semibold text-ink hover:text-accent hover:underline text-left">
                        {{ sub.name }}
                      </button>
                      <span v-if="sub.has_duplicate_warning" class="px-1.5 py-0.5 rounded-[4px] border text-[10px] font-semibold badge-amber">
                        Duplicate Match
                      </span>
                    </div>
                    <p class="text-xs text-muted mt-0.5 line-clamp-1">{{ sub.message || 'No message' }}</p>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-1.5">
                      <a
                        v-if="sub.phone"
                        :href="getWhatsAppUrl(sub.phone, sub.name)"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border text-xs font-medium badge-green"
                        title="Follow up via WhatsApp"
                      >
                        WA
                      </a>
                      <a
                        v-if="sub.email"
                        :href="getMailtoUrl(sub.email, sub.name)"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border text-xs font-medium badge-blue"
                        title="Reply via Email"
                      >
                        Email
                      </a>
                    </div>
                  </td>
                  <td class="py-3 px-4 text-sub font-medium">
                    {{ sub.service_name || 'General Inquiry' }}
                  </td>
                  <td class="py-3 px-4 text-muted text-xs whitespace-nowrap tabular-nums">
                    {{ formatDateTime(sub.created_at) }}
                  </td>
                  <td class="py-3 px-4">
                    <select
                      :value="sub.status"
                      @change="updateStatus(sub, $event.target.value)"
                      :aria-label="'Update status for ' + sub.name"
                      class="text-xs font-semibold px-2 py-0.5 rounded-[4px] border"
                      :class="getSubmissionStatusBadgeClass(sub.status)"
                    >
                      <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </td>
                  <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      @click="openDetail(sub)"
                      class="btn-ghost text-xs py-1 px-2"
                    >
                      Inspect
                    </button>
                    <button
                      v-if="sub.status !== 'Converted'"
                      type="button"
                      @click="openConvert(sub)"
                      class="btn-secondary text-xs py-1 px-2.5"
                    >
                      Convert to Client
                    </button>
                    <a
                      v-else-if="sub.converted_client_id"
                      :href="'#/clients/' + sub.converted_client_id"
                      class="btn-secondary text-xs py-1 px-2.5"
                    >
                      View Client
                    </a>
                    <button
                      type="button"
                      @click="deleteTarget = sub"
                      :aria-label="'Delete submission from ' + sub.name"
                      class="btn-ghost p-1.5 hover:text-st-red"
                    >
                      <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <pagination
            :page="page"
            :total="total"
            :per-page="perPage"
            @change="handlePageChange"
          />
        </div>
      </div>

      <!-- Detail Modal -->
      <div v-if="showDetailModal && selectedSubmission" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Inquiry Details">
        <div @click="showDetailModal = false" class="fixed inset-0 modal-backdrop"></div>
        <div class="relative surface-popover max-w-lg w-full p-5 z-10 animate-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3.5 hairline-b mb-4">
            <h3 class="text-sm font-semibold text-ink">Inquiry Details</h3>
            <button type="button" @click="showDetailModal = false" aria-label="Close inquiry details" class="btn-ghost p-1">
              <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="space-y-4 text-[13px]">
            <div>
              <p class="text-xs font-medium text-muted">Sender</p>
              <p class="text-base font-bold text-ink mt-0.5">{{ selectedSubmission.name }}</p>
              <div class="flex items-center gap-3 mt-1 text-xs">
                <a v-if="selectedSubmission.email" :href="getMailtoUrl(selectedSubmission.email, selectedSubmission.name)" class="text-accent hover:underline">{{ selectedSubmission.email }}</a>
                <span v-if="selectedSubmission.phone" class="text-muted">|</span>
                <a v-if="selectedSubmission.phone" :href="getWhatsAppUrl(selectedSubmission.phone, selectedSubmission.name)" target="_blank" rel="noopener" class="text-st-green hover:underline">{{ selectedSubmission.phone }}</a>
              </div>
            </div>

            <div v-if="selectedSubmission.duplicate_warnings && selectedSubmission.duplicate_warnings.length > 0" class="p-3 rounded-[6px] border badge-amber text-xs space-y-1">
              <p class="font-semibold">Possible Duplicate Matches Detected:</p>
              <ul class="list-disc pl-4 space-y-0.5">
                <li v-for="w in selectedSubmission.duplicate_warnings" :key="w.id">
                  <span v-if="w.client_name">Existing client: <strong>{{ w.client_name }}</strong> ({{ w.client_email }})</span>
                  <span v-else-if="w.submission_name">Previous submission: <strong>{{ w.submission_name }}</strong> ({{ w.submission_email }})</span>
                  : matched by {{ w.match_type }}
                </li>
              </ul>
            </div>

            <div>
              <p class="text-xs font-medium text-muted">Requested Service</p>
              <p class="font-medium text-ink mt-0.5">{{ selectedSubmission.service_name || 'General Inquiry' }}</p>
            </div>

            <div>
              <p class="text-xs font-medium text-muted">Message</p>
              <div class="mt-1 p-3.5 surface-subtle rounded-[6px] border hairline text-ink whitespace-pre-line leading-relaxed">
                {{ selectedSubmission.message || 'No message provided' }}
              </div>
            </div>

            <div>
              <p class="text-xs font-medium text-muted">Received On</p>
              <p class="text-xs text-sub mt-0.5 tabular-nums">{{ formatDateTime(selectedSubmission.created_at) }}</p>
            </div>
          </div>

          <div class="mt-5 pt-4 hairline-t flex items-center justify-between gap-2">
            <button type="button" @click="showDetailModal = false" class="btn-secondary">Close</button>
            <button
              v-if="selectedSubmission.status !== 'Converted'"
              type="button"
              @click="openConvert(selectedSubmission)"
              class="btn-primary"
            >
              Convert to Client Profile
            </button>
            <a
              v-else-if="selectedSubmission.converted_client_id"
              :href="'#/clients/' + selectedSubmission.converted_client_id"
              @click="showDetailModal = false"
              class="btn-primary"
            >
              Open Client Profile
            </a>
          </div>
        </div>
      </div>

      <!-- Convert to Client Modal -->
      <div v-if="showConvertModal && selectedSubmission" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Convert Lead to Client">
        <div @click="showConvertModal = false" class="fixed inset-0 modal-backdrop"></div>
        <div class="relative surface-popover max-w-md w-full p-5 z-10 animate-in">
          <div class="flex items-center justify-between pb-3.5 hairline-b mb-4">
            <h3 class="text-sm font-semibold text-ink">Convert Lead to Client</h3>
            <button type="button" @click="showConvertModal = false" aria-label="Close convert dialog" class="btn-ghost p-1">
              <svg class="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-3 rounded-[6px] border badge-green text-xs mb-4">
            Creating client profile for <strong>{{ selectedSubmission.name }}</strong> ({{ selectedSubmission.email }}).
          </div>

          <form @submit.prevent="executeConvert" class="space-y-4">
            <div>
              <label for="convert-company" class="field-label">Company (Optional)</label>
              <input
                id="convert-company"
                v-model="convertCompany"
                type="text"
                class="field-input"
                placeholder="Company or organization name"
              />
            </div>

            <div>
              <label for="convert-address" class="field-label">Address (Optional)</label>
              <textarea
                id="convert-address"
                v-model="convertAddress"
                rows="2"
                class="field-input"
                placeholder="Street, city, or billing address"
              ></textarea>
            </div>

            <div class="pt-4 hairline-t flex items-center justify-end gap-2">
              <button type="button" @click="showConvertModal = false" class="btn-secondary">Cancel</button>
              <button type="submit" :disabled="convertLoading" class="btn-primary">
                <span v-if="convertLoading" class="spinner" aria-hidden="true"></span>
                <span>Create Client Record</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <confirm-modal
        v-if="deleteTarget"
        title="Delete Submission"
        :message="'Are you sure you want to delete the submission from ' + deleteTarget.name + '?'"
        @confirm="executeDelete"
        @cancel="deleteTarget = null"
      />
    </div>
  `
};
