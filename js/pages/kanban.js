/**
 * Global Task Board View (Kanban Overview)
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
      kanbanColumns: [
        { id: 'Todo', title: 'To Do', dotColor: 'bg-slate-400', badgeBg: 'bg-slate-200 text-slate-700' },
        { id: 'In Progress', title: 'In Progress', dotColor: 'bg-amber-500', badgeBg: 'bg-amber-100 text-amber-700' },
        { id: 'Review', title: 'Review', dotColor: 'bg-blue-500', badgeBg: 'bg-blue-100 text-blue-700' },
        { id: 'Completed', title: 'Done', dotColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-700' }
      ],
      columnRefs: {},
      sortableInstances: []
    };
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
      try {
        const res = await window.API.tasks.board(this.selectedProject || null);
        const data = res.data?.data || {};
        this.tasks = data.tasks || [];
        this.projects = data.projects || [];
        this.stats = data.stats || {};
        this.$nextTick(() => this.initSortable());
      } catch (err) {
        window.Utils.toast('Failed to load task board', 'error');
      } finally {
        this.loading = false;
      }
    },

    getColumnTasks(status) {
      return this.tasks
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
          onEnd: (evt) => {
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
        task.completed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
      } else if (snapshot.find(t => t.id === taskId)?.status === 'Completed') {
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
      window.location.hash = '#/projects/' + projectId;
    },

    getPriorityClass(p) {
      if (p === 'High') return 'bg-rose-50 text-rose-700 border-rose-200';
      if (p === 'Medium') return 'bg-amber-50 text-amber-700 border-amber-200';
      return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  },

  template: `
    <div>
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Task Board</h1>
          <p class="text-sm text-slate-500 mt-0.5">Overview of all tasks across active projects</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Stats Pills -->
          <div class="hidden sm:flex items-center gap-2 text-xs">
            <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">{{ stats.total || 0 }} Total</span>
            <span class="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">{{ stats.in_progress || 0 }} Active</span>
            <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">{{ stats.completed || 0 }} Done</span>
          </div>
          <!-- Project Filter -->
          <select v-model="selectedProject"
            class="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900">
            <option value="">All Projects</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.title }}</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="py-20 text-center">
        <div class="spinner w-8 h-8 mx-auto"></div>
        <p class="text-sm text-slate-500 mt-3">Loading task board...</p>
      </div>

      <!-- Kanban Board -->
      <div v-else class="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
        <div class="flex items-start gap-4 snap-x snap-mandatory" style="min-width: max-content;">
          
          <div v-for="col in kanbanColumns" :key="col.id"
            class="w-[85vw] sm:w-80 snap-center shrink-0 bg-slate-100/80 rounded-2xl flex flex-col max-h-[calc(100vh-220px)] border border-slate-200 shadow-sm">
            
            <!-- Column Header -->
            <div class="p-3.5 flex items-center justify-between border-b border-slate-200/60">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="col.dotColor"></span>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700">{{ col.title }}</h3>
                <span class="px-2 py-0.5 text-[11px] font-bold rounded-full" :class="col.badgeBg">
                  {{ getColumnTasks(col.id).length }}
                </span>
              </div>
            </div>

            <!-- Scrollable Drop Zone -->
            <div :ref="(el) => setColumnRef(col.id, el)" :data-status="col.id"
              class="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[100px]">
              
              <div v-for="task in getColumnTasks(col.id)" :key="task.id" :data-id="task.id"
                @click="goToProject(task.project_id)"
                class="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing">
                
                <!-- Project Label -->
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[140px]">
                    {{ task.project_title }}
                  </span>
                  <span class="text-[11px] text-slate-400 font-medium">#{{ task.id }}</span>
                </div>

                <!-- Priority & Title -->
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border" :class="getPriorityClass(task.priority)">
                    {{ task.priority }}
                  </span>
                </div>
                <h4 class="text-sm font-semibold text-slate-800 leading-snug"
                  :class="{ 'line-through text-slate-400': task.status === 'Completed' }">
                  {{ task.title }}
                </h4>
                <p v-if="task.description" class="text-xs text-slate-500 mt-1 line-clamp-2">{{ task.description }}</p>

                <!-- Footer -->
                <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{{ task.due_date || 'No deadline' }}</span>
                  <span v-if="task.completed_at" class="text-emerald-600 font-semibold">✓ {{ task.completed_at.slice(0, 10) }}</span>
                  <span v-else>{{ task.created_at ? task.created_at.slice(0, 10) : '' }}</span>
                </div>
              </div>
            </div>

            <!-- Empty Column Placeholder -->
            <div v-if="getColumnTasks(col.id).length === 0 && !loading"
              class="px-4 py-8 text-center text-xs text-slate-400">
              No tasks
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
