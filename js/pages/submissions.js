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
        window.Utils.toast('Failed to load submissions', 'error');
      } finally {
        this.loading = false;
      }
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
        window.Utils.toast('Lead converted to client successfully!', 'success');
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
    <div>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Contact Inquiries</h1>
          <p class="text-sm text-slate-500 mt-0.5">Review website submissions, follow up leads, and convert to clients</p>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-64">
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filter current page..."
              class="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
            />
          </div>

          <select
            v-model="statusFilter"
            @change="page = 1; fetchSubmissions();"
            class="px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
          >
            <option value="">All Statuses</option>
            <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
          </select>

          <label class="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              v-model="showDuplicates"
              @change="page = 1; fetchSubmissions();"
              type="checkbox"
              class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            Show duplicates
          </label>
        </div>

        <div class="text-xs text-slate-500 font-medium">
          Showing {{ visibleSubmissions.length }} of {{ total }} inquiries
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <div class="spinner spinner-lg text-slate-900"></div>
        <p class="text-sm text-slate-500 mt-3">Loading inquiries...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="visibleSubmissions.length === 0" class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
        </div>
        <h3 class="text-base font-bold text-slate-900">No submissions found</h3>
        <p class="text-sm text-slate-500 mt-1">Inquiries from your website contact form will appear here.</p>
      </div>

      <!-- Submissions List -->
      <div v-else class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th class="py-3.5 px-6">Sender Details</th>
                <th class="py-3.5 px-6">Quick Contact</th>
                <th class="py-3.5 px-6">Service Requested</th>
                <th class="py-3.5 px-6">Date</th>
                <th class="py-3.5 px-6">Status</th>
                <th class="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              <tr
                v-for="sub in visibleSubmissions"
                :key="sub.id"
                @click="openDetail(sub)"
                class="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-slate-900">{{ sub.name }}</span>
                    <span v-if="sub.has_duplicate_warning" class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Duplicate Match
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1 line-clamp-1 italic">"{{ sub.message || 'No message' }}"</p>
                </td>
                <td class="py-4 px-6" @click.stop>
                  <div class="flex items-center gap-2">
                    <a
                      v-if="sub.phone"
                      :href="getWhatsAppUrl(sub.phone, sub.name)"
                      target="_blank"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-colors"
                      title="Follow up via WhatsApp"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      WA
                    </a>
                    <a
                      v-if="sub.email"
                      :href="getMailtoUrl(sub.email, sub.name)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors"
                      title="Reply via Email"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      Email
                    </a>
                  </div>
                </td>
                <td class="py-4 px-6 text-slate-700 font-medium">
                  {{ sub.service_name || 'General Inquiry' }}
                </td>
                <td class="py-4 px-6 text-slate-500 text-xs whitespace-nowrap">
                  {{ formatDateTime(sub.created_at) }}
                </td>
                <td class="py-4 px-6" @click.stop>
                  <select
                    :value="sub.status"
                    @change="updateStatus(sub, $event.target.value)"
                    class="text-xs font-semibold px-2.5 py-1 rounded-full border bg-white focus:outline-none"
                    :class="getSubmissionStatusBadgeClass(sub.status)"
                  >
                    <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
                  </select>
                </td>
                <td class="py-4 px-6 text-right space-x-2 whitespace-nowrap" @click.stop>
                  <button
                    v-if="sub.status !== 'Converted'"
                    @click="openConvert(sub)"
                    class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Convert to Client
                  </button>
                  <a
                    v-else-if="sub.converted_client_id"
                    :href="'#/clients/' + sub.converted_client_id"
                    class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg inline-block transition-colors"
                  >
                    View Client &rarr;
                  </a>
                  <button
                    @click="deleteTarget = sub"
                    aria-label="Delete submission"
                    class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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

      <!-- Detail Modal -->
      <div v-if="showDetailModal && selectedSubmission" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div @click="showDetailModal = false" class="fixed inset-0 modal-backdrop"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 z-10 animate-in max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h3 class="text-lg font-bold text-slate-900">Inquiry Details</h3>
            <button @click="showDetailModal = false" aria-label="Close modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="space-y-4 text-sm">
            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sender</p>
              <p class="text-base font-bold text-slate-900 mt-0.5">{{ selectedSubmission.name }}</p>
              <div class="flex items-center gap-3 mt-1 text-xs">
                <a v-if="selectedSubmission.email" :href="getMailtoUrl(selectedSubmission.email, selectedSubmission.name)" class="text-blue-600 hover:underline">{{ selectedSubmission.email }}</a>
                <span v-if="selectedSubmission.phone">&bull;</span>
                <a v-if="selectedSubmission.phone" :href="getWhatsAppUrl(selectedSubmission.phone, selectedSubmission.name)" target="_blank" class="text-emerald-600 hover:underline">{{ selectedSubmission.phone }}</a>
              </div>
            </div>

            <div v-if="selectedSubmission.duplicate_warnings && selectedSubmission.duplicate_warnings.length > 0" class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p class="font-bold">Possible Duplicate Matches Detected:</p>
              <ul class="list-disc pl-4 space-y-0.5">
                <li v-for="w in selectedSubmission.duplicate_warnings" :key="w.id">
                  <span v-if="w.client_name">Existing client: <strong>{{ w.client_name }}</strong> ({{ w.client_email }})</span>
                  <span v-else-if="w.submission_name">Previous submission: <strong>{{ w.submission_name }}</strong> ({{ w.submission_email }})</span>
                  &mdash; matched by {{ w.match_type }}
                </li>
              </ul>
            </div>

            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Requested Service</p>
              <p class="font-medium text-slate-800 mt-0.5">{{ selectedSubmission.service_name || 'General Inquiry' }}</p>
            </div>

            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Message</p>
              <div class="mt-1 p-4 bg-slate-50 rounded-xl text-slate-700 border border-slate-200/60 whitespace-pre-line leading-relaxed">
                {{ selectedSubmission.message || 'No message provided' }}
              </div>
            </div>

            <div>
              <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Received On</p>
              <p class="text-xs text-slate-600 mt-0.5">{{ formatDateTime(selectedSubmission.created_at) }}</p>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              @click="showDetailModal = false"
              class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Close
            </button>
            <button
              v-if="selectedSubmission.status !== 'Converted'"
              type="button"
              @click="openConvert(selectedSubmission)"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm"
            >
              Convert to Client Profile &rarr;
            </button>
            <a
              v-else-if="selectedSubmission.converted_client_id"
              :href="'#/clients/' + selectedSubmission.converted_client_id"
              @click="showDetailModal = false"
              class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm"
            >
              Open Client Profile &rarr;
            </a>
          </div>
        </div>
      </div>

      <!-- Convert to Client Modal -->
      <div v-if="showConvertModal && selectedSubmission" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div @click="showConvertModal = false" class="fixed inset-0 modal-backdrop"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 z-10 animate-in">
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h3 class="text-lg font-bold text-slate-900">Convert Lead to Client</h3>
            <button @click="showConvertModal = false" aria-label="Close modal" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl mb-4">
            Creating client profile for <strong>{{ selectedSubmission.name }}</strong> ({{ selectedSubmission.email }}).
          </div>

          <form @submit.prevent="executeConvert" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Company (Optional)</label>
              <input
                v-model="convertCompany"
                type="text"
                class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
                placeholder="Company / Organization Name"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">Address (Optional)</label>
              <textarea
                v-model="convertAddress"
                rows="2"
                class="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
                placeholder="Client address..."
              ></textarea>
            </div>

            <div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" @click="showConvertModal = false" class="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl">Cancel</button>
              <button type="submit" :disabled="convertLoading" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm flex items-center gap-2">
                <span v-if="convertLoading" class="spinner"></span>
                Create Client Record
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
