/**
 * Global Task Board View (Kanban Overview - Preview Only)
 * Route: #/tasks
 */

window.KanbanBoardView = {
  data() {
    return {
      loading: true,
      error: '',
      tasks: [],
      projects: [],
      stats: {},
      selectedProject: '',
      priorityFilter: '',
      searchQuery: '',
      isDragging: false,
      kanbanColumns: [
        { id: 'Todo', title: 'To Do', dotClass: 'st-neutral' },
        { id: 'In Progress', title: 'In Progress', dotClass: 'st-blue' },
        { id: 'Review', title: 'Review', dotClass: 'st-amber' },
        { id: 'Completed', title: 'Done', dotClass: 'st-green' }
      ]
    };
  },
  created() {
    this._columnRefs = {};
    this._sortableInstances = [];
    this._isUnmounted = false;
  },
  computed: {
    filteredTasks() {
      const q = this.searchQuery.trim().toLowerCase();
      return this.tasks.filter(t => {
        if (this.priorityFilter && t.priority !== this.priorityFilter) return false;
        if (q) {
          const hay = `${t.title || ''} ${t.description || ''} ${t.project_title || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
    }
  },
  async mounted() {
    await this.fetchBoard();
  },
  beforeUnmount() {
    this._isUnmounted = true;
    this.destroySortable();
  },
  watch: {
    async selectedProject() {
      await this.fetchBoard();
    }
  },
  methods: {
    async fetchBoard() {
      this.destroySortable();
      this.loading = true;
      this.error = '';
      let loaded = false;
      try {
        const res = await window.API.tasks.board(this.selectedProject || null);
        const data = res.data?.data || {};
        this.tasks = data.tasks || [];
        this.projects = data.projects || [];
        this.stats = data.stats || {};
        loaded = true;
      } catch (err) {
        this.error = 'Failed to load task board data. Check connection and try again.';
        window.Utils.toast('Failed to load task board', 'error');
      } finally {
        this.loading = false;
      }
      if (loaded && !this._isUnmounted) {
        await this.$nextTick();
        if (!this._isUnmounted) {
          this.initSortable();
        }
      }
    },

    getColumnTasks(status) {
      return this.filteredTasks
        .filter(t => t.status === status)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));
    },

    setColumnRef(colId, el) {
      if (!this._columnRefs) this._columnRefs = {};
      if (el) {
        this._columnRefs[colId] = el;
      } else {
        delete this._columnRefs[colId];
      }
    },

    destroySortable() {
      (this._sortableInstances || []).forEach(s => {
        if (s && s.el) {
          try {
            s.destroy();
          } catch (e) {}
        }
      });
      this._sortableInstances = [];
    },

    initSortable() {
      this.destroySortable();
      if (this._isUnmounted) return;

      this.kanbanColumns.forEach(col => {
        const el = (this._columnRefs || {})[col.id];
        if (!el || !el.isConnected) return;
        if (typeof Sortable.get === 'function') {
          const existing = Sortable.get(el);
          if (existing && existing.el) {
            try {
              existing.destroy();
            } catch (e) {}
          }
        }
        const instance = new Sortable(el, {
          group: 'global-kanban',
          animation: 150,
          ghostClass: 'kanban-ghost',
          chosenClass: 'kanban-chosen',
          dragClass: 'kanban-drag',
          filter: 'a, button',
          preventOnFilter: false,
          onStart: () => {
            this.isDragging = true;
          },
          onEnd: (evt) => {
            setTimeout(() => { this.isDragging = false; }, 120);
            const taskId = parseInt(evt.item.dataset.id, 10);
            const toStatus = evt.to.dataset.status;
            const newIndex = evt.newIndex;
            this.handleDrop(taskId, toStatus, newIndex);
          }
        });
        this._sortableInstances.push(instance);
      });
    },

    async handleDrop(taskId, toStatus, newIndex) {
      const task = this.tasks.find(t => t.id === taskId);
      if (!task) return;

      const snapshot = JSON.parse(JSON.stringify(this.tasks));
      const targetTasks = this.tasks
        .filter(t => t.status === toStatus && t.id !== taskId)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));

      let newOrder = 1000.0;
      if (targetTasks.length === 0) {
        newOrder = 1000.0;
      } else if (newIndex === 0) {
        newOrder = parseFloat(targetTasks[0].order_index) / 2.0;
      } else if (newIndex >= targetTasks.length) {
        newOrder = parseFloat(targetTasks[targetTasks.length - 1].order_index) + 1000.0;
      } else {
        const prev = parseFloat(targetTasks[newIndex - 1].order_index);
        const next = parseFloat(targetTasks[newIndex].order_index);
        newOrder = (prev + next) / 2.0;
      }

      task.status = toStatus;
      task.order_index = newOrder;
      if (toStatus === 'Completed') {
        task.completed_at = task.completed_at || new Date().toISOString().slice(0, 19).replace('T', ' ');
      } else {
        task.completed_at = null;
      }

      try {
        await window.API.tasks.update(taskId, { status: toStatus, order_index: newOrder });
        this.updateLocalStats();
      } catch (err) {
        this.tasks = snapshot;
        window.Utils.toast('Failed to move task', 'error');
      }
    },

    updateLocalStats() {
      const s = { total: 0, todo: 0, in_progress: 0, review: 0, completed: 0 };
      this.tasks.forEach(t => {
        s.total++;
        if (t.status === 'Completed') s.completed++;
        else if (t.status === 'In Progress') s.in_progress++;
        else if (t.status === 'Review') s.review++;
        else s.todo++;
      });
      this.stats = s;
    },

    getPriorityClass(p) {
      return window.Utils.getPriorityBadgeClass(p);
    },

    isOverdue(dueDate, status) {
      return window.Utils.isOverdue(dueDate, status);
    }
  },

  template: `
    <div class="flex flex-col min-h-full">
      <!-- Slim Page Header -->
      <div class="min-h-[44px] px-5 sm:px-6 py-2 hairline-b flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <h1 class="text-sm font-semibold text-ink tracking-tight">Task Board</h1>
          <span class="text-xs text-muted">Preview across active projects; drag cards to move state</span>
        </div>
        <a href="#/projects" class="btn-secondary text-xs py-1 px-2.5">Open Projects</a>
      </div>

      <!-- Filters & State Summary Strip -->
      <div class="px-5 sm:px-6 py-3 hairline-b surface-subtle flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative w-full sm:w-52">
            <svg class="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              aria-label="Filter tasks"
              placeholder="Filter tasks..."
              class="field-input pl-8 py-1.5 text-xs"
            />
          </div>

          <select v-model="priorityFilter" aria-label="Filter by priority" class="field-input w-auto py-1.5 text-xs font-medium">
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select v-model="selectedProject" aria-label="Filter by project" class="field-input w-auto py-1.5 text-xs font-medium">
            <option value="">All Active Projects</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
          </select>
        </div>

        <div v-if="!loading && !error" class="flex flex-wrap items-center gap-4 text-xs">
          <span class="font-medium text-sub tabular-nums">{{ stats.total || 0 }} Total</span>
          <span class="flex items-center gap-1.5 text-sub tabular-nums"><span class="status-sq st-blue" aria-hidden="true"></span> {{ stats.in_progress || 0 }} In Progress</span>
          <span class="flex items-center gap-1.5 text-sub tabular-nums"><span class="status-sq st-amber" aria-hidden="true"></span> {{ stats.review || 0 }} Review</span>
          <span class="flex items-center gap-1.5 text-sub tabular-nums"><span class="status-sq st-green" aria-hidden="true"></span> {{ stats.completed || 0 }} Done</span>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 p-5 sm:p-6">
        <!-- Skeleton Loading -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="n in 4" :key="'kb-sk-' + n" class="surface-subtle border hairline rounded-[8px] p-3 space-y-2.5 h-80">
            <div class="skeleton-bar h-4 w-24"></div>
            <div class="skeleton-bar h-20 w-full"></div>
            <div class="skeleton-bar h-20 w-full"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="surface-card p-6 border-[var(--st-red-border)] flex items-center justify-between gap-4">
          <p class="text-sm text-st-red font-medium">{{ error }}</p>
          <button type="button" @click="fetchBoard" class="btn-secondary">Retry</button>
        </div>

        <!-- Kanban Board -->
        <div v-else class="overflow-x-auto lg:overflow-x-visible pb-4">
          <div class="flex lg:grid lg:grid-cols-4 items-start gap-3.5 snap-x snap-mandatory">
            <div
              v-for="col in kanbanColumns"
              :key="col.id"
              class="w-[82vw] sm:w-72 lg:w-auto min-w-0 snap-center shrink-0 surface-subtle border hairline rounded-[8px] flex flex-col max-h-[calc(100vh-225px)]"
            >
              <!-- Column Header -->
              <div class="px-3.5 py-2.5 flex items-center justify-between hairline-b">
                <div class="flex items-center gap-2">
                  <span class="status-sq" :class="col.dotClass" aria-hidden="true"></span>
                  <h2 class="text-xs font-semibold text-ink">{{ col.title }}</h2>
                </div>
                <span class="text-xs font-semibold text-muted tabular-nums">
                  {{ getColumnTasks(col.id).length }}
                </span>
              </div>

              <!-- Scrollable Drop Zone -->
              <div
                :ref="(el) => setColumnRef(col.id, el)"
                :data-status="col.id"
                class="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-[140px]"
              >
                <div
                  v-for="task in getColumnTasks(col.id)"
                  :key="task.id"
                  :data-id="task.id"
                  class="surface-card p-3 hover:border-[var(--border-strong)] transition-colors cursor-grab active:cursor-grabbing"
                >
                  <div class="flex items-center justify-between gap-2 mb-1.5">
                    <a
                      :href="'#/projects/' + task.project_id"
                      @click.stop
                      class="text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] border badge-blue truncate max-w-[195px]"
                      :title="'Open ' + task.project_title"
                    >
                      {{ task.project_title }}
                    </a>
                    <span class="text-[11px] text-muted font-medium tabular-nums">#{{ task.id }}</span>
                  </div>

                  <div class="flex items-center gap-1.5 mb-1.5">
                    <span class="px-1.5 py-0.5 text-[10px] font-semibold rounded-[4px] border" :class="getPriorityClass(task.priority)">
                      {{ task.priority }}
                    </span>
                    <span v-if="isOverdue(task.due_date, task.status)" class="px-1.5 py-0.5 text-[10px] font-semibold rounded-[4px] border badge-red">
                      Overdue
                    </span>
                  </div>

                  <h3
                    class="text-[13px] font-semibold leading-snug"
                    :class="task.status === 'Completed' ? 'line-through text-muted' : 'text-ink'"
                  >
                    {{ task.title }}
                  </h3>
                  <p v-if="task.description" class="text-xs text-sub mt-1 line-clamp-2 leading-relaxed">{{ task.description }}</p>

                  <div class="mt-2.5 pt-2 hairline-t flex items-center justify-between text-[11px] text-muted">
                    <span :class="{ 'text-st-red font-semibold': isOverdue(task.due_date, task.status) }">
                      {{ task.due_date || 'No deadline' }}
                    </span>
                    <span v-if="task.completed_at" class="text-st-green font-semibold flex items-center gap-1">
                      <svg class="w-3 h-3" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      {{ task.completed_at.slice(0, 10) }}
                    </span>
                    <a
                      v-else
                      :href="'#/projects/' + task.project_id + '?tab=tasks'"
                      @click.stop
                      class="text-accent font-medium hover:underline"
                    >
                      Open
                    </a>
                  </div>
                </div>

                <!-- Empty Column Placeholder -->
                <div
                  v-if="getColumnTasks(col.id).length === 0"
                  class="px-3 py-8 text-center text-xs text-muted"
                >
                  Drop tasks here
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
