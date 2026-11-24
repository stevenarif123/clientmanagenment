/**
 * Global Task Board View (Kanban Overview - Preview Only)
 * Route: #/tasks
 */

window.KanbanBoardView = {
  data() {
    return {
      loading: true,
      tasks: [],
      projects: [],
      stats: {},
      selectedProject: '',
      priorityFilter: '',
      searchQuery: '',
      isDragging: false,
      kanbanColumns: [
        { id: 'Todo', title: 'To Do', dotColor: 'bg-slate-400', topAccent: 'border-t-slate-400', badgeBg: 'bg-slate-200 text-slate-700' },
        { id: 'In Progress', title: 'In Progress', dotColor: 'bg-amber-500', topAccent: 'border-t-amber-500', badgeBg: 'bg-amber-100 text-amber-800' },
        { id: 'Review', title: 'Review', dotColor: 'bg-blue-500', topAccent: 'border-t-blue-500', badgeBg: 'bg-blue-100 text-blue-800' },
        { id: 'Completed', title: 'Done', dotColor: 'bg-emerald-500', topAccent: 'border-t-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' }
      ],
      columnRefs: {},
      sortableInstances: []
    };
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
    this.sortableInstances.forEach(s => s.destroy());
  },
  watch: {
    async selectedProject() {
      await this.fetchBoard();
    }
  },
  methods: {
    async fetchBoard() {
      this.loading = true;
      let loaded = false;
      try {
        const res = await window.API.tasks.board(this.selectedProject || null);
        const data = res.data?.data || {};
        this.tasks = data.tasks || [];
        this.projects = data.projects || [];
        this.stats = data.stats || {};
        loaded = true;
      } catch (err) {
        window.Utils.toast('Failed to load task board', 'error');
      } finally {
        this.loading = false;
      }
      if (loaded) {
        await this.$nextTick();
        this.initSortable();
      }
    },

    getColumnTasks(status) {
      return this.filteredTasks
        .filter(t => t.status === status)
        .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));
    },

    setColumnRef(colId, el) {
      if (el) this.columnRefs[colId] = el;
    },

    initSortable() {
      this.sortableInstances.forEach(s => s.destroy());
      this.sortableInstances = [];

      this.kanbanColumns.forEach(col => {
        const el = this.columnRefs[col.id];
        if (!el) return;
        const instance = new Sortable(el, {
          group: 'global-kanban',
          animation: 180,
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
        this.sortableInstances.push(instance);
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

    goToProject(projectId) {
      if (this.isDragging) return;
      window.location.hash = '#/projects/' + projectId;
    },

    getPriorityClass(p) {
      return window.Utils.getPriorityBadgeClass(p);
    },

    isOverdue(dueDate, status) {
      return window.Utils.isOverdue(dueDate, status);
    }
  },

  template: `
    <div>
      <!-- Page Header -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Task Board</h1>
          <p class="text-sm text-slate-500 mt-0.5">Preview tasks across active projects &bull; Drag cards to update status</p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Search -->
          <div class="relative w-full sm:w-52">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Filter tasks..."
              class="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900"
            />
          </div>

          <!-- Priority Filter -->
          <select v-model="priorityFilter"
            class="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900">
            <option value="">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <!-- Project Filter -->
          <select v-model="selectedProject"
            class="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-slate-900">
            <option value="">All Active Projects</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
          </select>
        </div>
      </div>

      <!-- Summary Pills -->
      <div v-if="!loading" class="flex flex-wrap items-center gap-2 mb-5 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-white text-slate-700 font-bold border border-slate-200">{{ stats.total || 0 }} Total</span>
        <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">{{ stats.in_progress || 0 }} In Progress</span>
        <span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">{{ stats.review || 0 }} Review</span>
        <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">{{ stats.completed || 0 }} Done</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-20 text-center">
        <div class="spinner spinner-lg text-slate-900 mx-auto"></div>
        <p class="text-sm text-slate-500 mt-3">Loading task board...</p>
      </div>

      <!-- Kanban Board -->
      <div v-else class="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
        <div class="flex items-start gap-4 snap-x snap-mandatory" style="min-width: max-content;">
          
          <div v-for="col in kanbanColumns" :key="col.id"
            :class="['w-[85vw] sm:w-80 snap-center shrink-0 bg-slate-100/80 rounded-2xl flex flex-col max-h-[calc(100vh-250px)] border border-slate-200/90 border-t-4 shadow-sm', col.topAccent]">
            
            <!-- Column Header -->
            <div class="p-3.5 flex items-center justify-between border-b border-slate-200/60">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="col.dotColor"></span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">{{ col.title }}</h3>
                <span class="px-2 py-0.5 text-[11px] font-bold rounded-full tabular-nums" :class="col.badgeBg">
                  {{ getColumnTasks(col.id).length }}
                </span>
              </div>
            </div>

            <!-- Scrollable Drop Zone -->
            <div :ref="(el) => setColumnRef(col.id, el)" :data-status="col.id"
              class="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[120px]">
              
              <div v-for="task in getColumnTasks(col.id)" :key="task.id" :data-id="task.id"
                class="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200/90 hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing">
                
                <!-- Project Label -->
                <div class="flex items-center justify-between gap-2 mb-2">
                  <a
                    :href="'#/projects/' + task.project_id"
                    @click.stop
                    class="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200/70 truncate max-w-[190px] transition-colors"
                    :title="'Open ' + task.project_title"
                  >
                    {{ task.project_title }}
                  </a>
                  <span class="text-[11px] text-slate-400 font-medium tabular-nums">#{{ task.id }}</span>
                </div>

                <!-- Priority & Title -->
                <div class="flex items-center gap-1.5 mb-1.5">
                  <span class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border" :class="getPriorityClass(task.priority)">
                    {{ task.priority }}
                  </span>
                  <span v-if="isOverdue(task.due_date, task.status)" class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-100 text-rose-700 border border-rose-200">
                    Overdue
                  </span>
                </div>

                <h4 class="text-sm font-semibold text-slate-800 leading-snug"
                  :class="{ 'line-through text-slate-400': task.status === 'Completed' }">
                  {{ task.title }}
                </h4>
                <p v-if="task.description" class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{{ task.description }}</p>

                <!-- Footer -->
                <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span :class="{ 'text-rose-600 font-semibold': isOverdue(task.due_date, task.status) }">
                    {{ task.due_date || 'No deadline' }}
                  </span>
                  <span v-if="task.completed_at" class="text-emerald-600 font-semibold flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    {{ task.completed_at.slice(0, 10) }}
                  </span>
                  <a
                    v-else
                    :href="'#/projects/' + task.project_id"
                    @click.stop
                    class="text-slate-400 hover:text-indigo-600 font-semibold flex items-center gap-0.5 transition-colors"
                  >
                    Open &rarr;
                  </a>
                </div>
              </div>

              <!-- Empty Column Placeholder -->
              <div v-if="getColumnTasks(col.id).length === 0 && !loading"
                class="px-4 py-8 text-center text-xs text-slate-400">
                Drop tasks here
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
