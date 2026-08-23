# Kanban Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive Trello-style Kanban Board with drag-and-drop task management, both inside project detail pages and as a global overview board.

**Architecture:** SortableJS handles drag-and-drop via CDN, Vue 3 components render 4-column boards (To Do, In Progress, Review, Done), fractional indexing provides O(1) card reordering. Two views: full interactive board in ProjectDetailView and a preview-only global board at `#/tasks`.

**Tech Stack:** Vue 3 CDN, SortableJS 1.15.2 CDN, Tailwind CSS CDN, PHP 8 REST API, SQLite

## Global Constraints

- No npm, no build tools — all scripts loaded via CDN `<script>` tags
- Vue 3 components registered on `window` object (e.g., `window.KanbanBoardView`)
- Status values are case-sensitive PascalCase: `'Todo'`, `'In Progress'`, `'Review'`, `'Completed'`
- Priority values: `'Low'`, `'Medium'`, `'High'`
- Anti-modal pattern: all forms are inline (no popup modals)
- Follow existing code patterns in `api/tasks.php`, `js/pages/projects.js`, `assets/js/api.js`

---

### Task 1: Backend — Add 'Review' Status & Fractional Order Support

**Files:**
- Modify: `d:\WEB\ClientManagement\api\tasks.php` (lines 84, 129 for status whitelist; lines 22-35 for ORDER BY; line 88 for order_index)
- Modify: `d:\WEB\ClientManagement\api\portal.php` (task ordering consistency)

**Interfaces:**
- Produces: Updated status whitelist `['Todo', 'In Progress', 'Review', 'Completed']` used by all subsequent tasks. `order_index` stored as float. Tasks sorted by `order_index ASC` instead of status-based CASE.

- [ ] **Step 1: Update status whitelist in `createProjectTask`**

In `api/tasks.php`, line 84, change:
```php
$status = in_array($body['status'] ?? '', ['Todo', 'In Progress', 'Completed']) ? $body['status'] : 'Todo';
```
To:
```php
$status = in_array($body['status'] ?? '', ['Todo', 'In Progress', 'Review', 'Completed']) ? $body['status'] : 'Todo';
```

- [ ] **Step 2: Add auto-computed `order_index` in `createProjectTask`**

After the `$priority` line (line 85), before `$completedAt`, add:
```php
// Auto-compute order_index: append to bottom of target column
$maxOrder = $db->fetch(
    "SELECT COALESCE(MAX(order_index), 0) as max_order FROM project_tasks WHERE project_id = ? AND status = ?",
    [$projectId, $status]
);
$orderIndex = floatval($maxOrder['max_order']) + 1000.0;
```

Then in the `$db->insert()` call (line 88-96), add `'order_index' => $orderIndex` to the insert array.

- [ ] **Step 3: Update status whitelist in `updateTask`**

In `api/tasks.php`, line 129, change:
```php
if (isset($body['status']) && in_array($body['status'], ['Todo', 'In Progress', 'Completed'])) {
```
To:
```php
if (isset($body['status']) && in_array($body['status'], ['Todo', 'In Progress', 'Review', 'Completed'])) {
```

- [ ] **Step 4: Add `order_index` float support in `updateTask`**

After the status block (after line 132), add:
```php
if (isset($body['order_index'])) {
    $updateData['order_index'] = floatval($body['order_index']);
}
```

- [ ] **Step 5: Update ORDER BY in `getProjectTasks`**

In `api/tasks.php`, lines 22-35, change the SQL query to:
```php
$tasks = $db->fetchAll(
    "SELECT * FROM project_tasks 
     WHERE project_id = ? 
     ORDER BY 
       CASE status 
         WHEN 'In Progress' THEN 1 
         WHEN 'Review' THEN 2 
         WHEN 'Todo' THEN 3 
         WHEN 'Completed' THEN 4 
         ELSE 5 
       END,
       order_index ASC, 
       id ASC",
    [$projectId]
);
```

- [ ] **Step 6: Add 'Review' counter to statistics**

In `api/tasks.php`, after line 40, update the stats counting:
```php
$total = count($tasks);
$completed = 0;
$inProgress = 0;
$review = 0;
$todo = 0;

foreach ($tasks as $t) {
    if ($t['status'] === 'Completed') $completed++;
    else if ($t['status'] === 'In Progress') $inProgress++;
    else if ($t['status'] === 'Review') $review++;
    else $todo++;
}

$progressPercent = $total > 0 ? (int)round(($completed / $total) * 100) : 0;

Response::success([
    'tasks' => $tasks,
    'stats' => [
        'total' => $total,
        'completed' => $completed,
        'in_progress' => $inProgress,
        'review' => $review,
        'todo' => $todo,
        'progress_percent' => $progressPercent
    ]
]);
```

- [ ] **Step 7: Verify via PHP CLI**

Run: `php -r "require 'config/database.php'; require 'api/tasks.php';"`
Expected: No syntax errors, clean exit.

---

### Task 2: Backend — Global Task Board & Batch Reorder Endpoints

**Files:**
- Modify: `d:\WEB\ClientManagement\api\tasks.php` (add 2 new functions at end of file)
- Modify: `d:\WEB\ClientManagement\index.php` (add 2 new routes)

**Interfaces:**
- Consumes: `Database::getInstance()`, `Response::success()`, `Validator::sanitize()`
- Produces: `getGlobalTaskBoard()` returns tasks across active projects with project titles. `reorderProjectTasks(int $projectId)` batch-updates `order_index` for multiple tasks.

- [ ] **Step 1: Add `getGlobalTaskBoard()` function to `api/tasks.php`**

Append to end of `api/tasks.php` (before closing):
```php
/**
 * Get all tasks across active projects for global Kanban board
 */
function getGlobalTaskBoard(): void {
    $db = Database::getInstance();

    $projectFilter = '';
    $filterParams = [];

    if (!empty($_GET['project_id'])) {
        $projectFilter = 'AND p.id = ?';
        $filterParams[] = (int)$_GET['project_id'];
    }

    $tasks = $db->fetchAll(
        "SELECT t.*, p.title as project_title, p.status as project_status
         FROM project_tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE p.status NOT IN ('Completed', 'Cancelled')
         {$projectFilter}
         ORDER BY t.order_index ASC, t.id ASC",
        $filterParams
    );

    $projects = $db->fetchAll(
        "SELECT id, title FROM projects WHERE status NOT IN ('Completed', 'Cancelled') ORDER BY title ASC"
    );

    $stats = ['total' => 0, 'todo' => 0, 'in_progress' => 0, 'review' => 0, 'completed' => 0];
    foreach ($tasks as $t) {
        $stats['total']++;
        if ($t['status'] === 'Completed') $stats['completed']++;
        else if ($t['status'] === 'In Progress') $stats['in_progress']++;
        else if ($t['status'] === 'Review') $stats['review']++;
        else $stats['todo']++;
    }

    Response::success([
        'tasks' => $tasks,
        'projects' => $projects,
        'stats' => $stats
    ]);
}
```

- [ ] **Step 2: Add `reorderProjectTasks()` function to `api/tasks.php`**

Append after `getGlobalTaskBoard()`:
```php
/**
 * Batch reorder tasks (rebalance order_index values)
 */
function reorderProjectTasks(int $projectId): void {
    $db = Database::getInstance();

    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }

    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $tasks = $body['tasks'] ?? [];

    if (empty($tasks) || !is_array($tasks)) {
        Response::validationError(['tasks' => 'Tasks array is required']);
    }

    foreach ($tasks as $item) {
        if (!isset($item['id']) || !isset($item['order_index'])) continue;
        $db->update('project_tasks', [
            'order_index' => floatval($item['order_index']),
            'updated_at' => date('Y-m-d H:i:s')
        ], 'id = ? AND project_id = ?', [(int)$item['id'], $projectId]);
    }

    Response::success(null, 'Tasks reordered successfully');
}
```

- [ ] **Step 3: Add routes in `index.php`**

In `index.php`, after the existing Task & Milestone Routes block (after line 279), add:
```php
// Global Task Board
if ($uri === '/tasks/board' && $method === 'GET') {
    require __DIR__ . '/api/tasks.php';
    getGlobalTaskBoard();
}

// Batch Reorder Tasks
if (matchRoute('/projects/:id/tasks/reorder', $uri, $params) && $method === 'POST') {
    require __DIR__ . '/api/tasks.php';
    reorderProjectTasks((int)$params['id']);
}
```

> **IMPORTANT:** The `/tasks/board` route MUST be placed BEFORE the `/tasks/:id` route (line 266) to prevent `board` from being matched as a task ID. Insert it between line 279 (end of toggle route) and line 266, or place it before line 255.

- [ ] **Step 4: Verify routes via PHP CLI**

Run: `php -r "require 'config/database.php'; require 'api/tasks.php';"`
Expected: No syntax errors, clean exit.

---

### Task 3: Frontend — API Client & CSS Updates

**Files:**
- Modify: `d:\WEB\ClientManagement\assets\js\api.js` (add 2 new methods)
- Modify: `d:\WEB\ClientManagement\assets\css\app.css` (add kanban drag-drop CSS)
- Modify: `d:\WEB\ClientManagement\index.html` (add SortableJS CDN script tag)

**Interfaces:**
- Produces: `API.tasks.board(projectId)`, `API.projects.reorderTasks(id, tasks)` consumed by kanban components. Kanban CSS classes: `.kanban-ghost`, `.kanban-chosen`, `.kanban-drag`.

- [ ] **Step 1: Add API methods to `assets/js/api.js`**

In `assets/js/api.js`, inside the `tasks` object (after line 104), add:
```javascript
board: (projectId) => apiClient.get('/tasks/board', { params: projectId ? { project_id: projectId } : {} }),
```

In the `projects` object (after line 97, after `regeneratePortalToken`), add:
```javascript
reorderTasks: (id, tasks) => apiClient.post(`/projects/${id}/tasks/reorder`, { tasks }),
```

- [ ] **Step 2: Add Kanban CSS to `assets/css/app.css`**

Append to end of `assets/css/app.css`:
```css
/* ===== Kanban Board Drag & Drop ===== */
.kanban-ghost {
  background-color: rgba(226, 232, 240, 0.6) !important;
  border: 2px dashed #94a3b8 !important;
  border-radius: 0.75rem !important;
  opacity: 0.5 !important;
  box-shadow: none !important;
}
.kanban-ghost > * {
  opacity: 0 !important;
}
.kanban-chosen {
  cursor: grabbing !important;
  transform: scale(1.03) rotate(1deg);
  box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.08) !important;
  z-index: 50;
}
.kanban-drag {
  opacity: 0.95 !important;
  cursor: grabbing !important;
}
```

- [ ] **Step 3: Add SortableJS CDN to `index.html`**

In `index.html`, after line 33 (Chart.js CDN), add:
```html
<script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js"></script>
```

---

### Task 4: Frontend — Project-Level Kanban Board in ProjectDetailView

**Files:**
- Modify: `d:\WEB\ClientManagement\js\pages\projects.js` (modify `ProjectDetailView` — add board view toggle, kanban template, and drag-drop logic)

**Interfaces:**
- Consumes: `window.API.tasks.update(id, data)`, `window.API.projects.getTasks(id)`, `window.API.projects.reorderTasks(id, tasks)`, `window.Sortable` (global from CDN), CSS classes `.kanban-ghost`, `.kanban-chosen`, `.kanban-drag`
- Produces: Interactive 4-column Kanban board inside "Tasks & Milestones" tab with drag-drop, inline expand-edit, and quick-add forms.

- [ ] **Step 1: Add new data properties to `ProjectDetailView`**

In `ProjectDetailView`'s `data()`, add these new properties:
```javascript
taskViewMode: 'list',
kanbanColumns: [
  { id: 'Todo', title: 'To Do', dotColor: 'bg-slate-400', badgeBg: 'bg-slate-200 text-slate-700' },
  { id: 'In Progress', title: 'In Progress', dotColor: 'bg-amber-500', badgeBg: 'bg-amber-100 text-amber-700' },
  { id: 'Review', title: 'Review', dotColor: 'bg-blue-500', badgeBg: 'bg-blue-100 text-blue-700' },
  { id: 'Completed', title: 'Done', dotColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-700' }
],
columnRefs: {},
sortableInstances: [],
expandedCardId: null,
editingTask: { title: '', description: '', priority: 'Medium', due_date: '', status: 'Todo' },
quickAddColumn: null,
quickAddTitle: '',
```

- [ ] **Step 2: Add computed property `getColumnTasks`**

Add method to `methods`:
```javascript
getColumnTasks(status) {
  return this.tasks
    .filter(t => t.status === status)
    .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));
},
```

- [ ] **Step 3: Add Kanban initialization methods**

Add these methods to `ProjectDetailView`:
```javascript
setColumnRef(colId, el) {
  if (el) this.columnRefs[colId] = el;
},

initKanbanSortable() {
  // Destroy existing instances
  this.sortableInstances.forEach(s => s.destroy());
  this.sortableInstances = [];

  this.$nextTick(() => {
    this.kanbanColumns.forEach(col => {
      const el = this.columnRefs[col.id];
      if (!el) return;

      const instance = new Sortable(el, {
        group: 'project-kanban',
        animation: 180,
        ghostClass: 'kanban-ghost',
        chosenClass: 'kanban-chosen',
        dragClass: 'kanban-drag',
        onEnd: (evt) => {
          const taskId = parseInt(evt.item.dataset.id, 10);
          const toStatus = evt.to.dataset.status;
          const newIndex = evt.newIndex;
          this.handleCardDrop(taskId, toStatus, newIndex);
        }
      });
      this.sortableInstances.push(instance);
    });
  });
},

destroyKanbanSortable() {
  this.sortableInstances.forEach(s => s.destroy());
  this.sortableInstances = [];
  this.columnRefs = {};
},
```

- [ ] **Step 4: Add drag-drop handler with optimistic update**

```javascript
async handleCardDrop(taskId, toStatus, newIndex) {
  const task = this.tasks.find(t => t.id === taskId);
  if (!task) return;

  const snapshot = JSON.parse(JSON.stringify(this.tasks));
  
  // Calculate new order_index using fractional indexing
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

    // Precision guard — trigger rebalance if gap too small
    if (Math.abs(next - prev) < 0.001) {
      await this.rebalanceColumn(toStatus);
      return;
    }
  }

  // Optimistic update
  task.status = toStatus;
  task.order_index = newOrder;
  if (toStatus === 'Completed') {
    task.completed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  } else if (snapshot.find(t => t.id === taskId)?.status === 'Completed') {
    task.completed_at = null;
  }

  try {
    await window.API.tasks.update(taskId, { status: toStatus, order_index: newOrder });
    // Refresh stats
    const res = await window.API.projects.getTasks(this.id);
    this.taskStats = res.data?.data?.stats || this.taskStats;
  } catch (err) {
    // Rollback on failure
    this.tasks = snapshot;
    window.Utils.toast('Failed to move task', 'error');
  }
},

async rebalanceColumn(status) {
  const columnTasks = this.tasks
    .filter(t => t.status === status)
    .sort((a, b) => (parseFloat(a.order_index) || 0) - (parseFloat(b.order_index) || 0));
  
  const reorderPayload = columnTasks.map((t, i) => {
    t.order_index = (i + 1) * 1000.0;
    return { id: t.id, order_index: t.order_index };
  });

  try {
    await window.API.projects.reorderTasks(this.id, reorderPayload);
  } catch (err) {
    window.Utils.toast('Failed to rebalance task order', 'error');
    this.loadProject();
  }
},
```

- [ ] **Step 5: Add inline card expand/edit methods**

```javascript
expandCard(task) {
  if (this.expandedCardId === task.id) {
    this.expandedCardId = null;
    return;
  }
  this.expandedCardId = task.id;
  this.editingTask = {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    due_date: task.due_date || '',
    status: task.status
  };
},

async saveExpandedCard(taskId) {
  try {
    await window.API.tasks.update(taskId, this.editingTask);
    this.expandedCardId = null;
    window.Utils.toast('Task updated', 'success');
    this.loadProject();
  } catch (err) {
    window.Utils.toast('Failed to update task', 'error');
  }
},

cancelExpandCard() {
  this.expandedCardId = null;
},
```

- [ ] **Step 6: Add quick-add methods**

```javascript
openQuickAdd(status) {
  this.quickAddColumn = status;
  this.quickAddTitle = '';
  this.$nextTick(() => {
    const input = this.$refs['quickadd_' + status];
    if (input) input.focus();
  });
},

async submitQuickAdd(status) {
  if (!this.quickAddTitle.trim()) return;
  try {
    await window.API.projects.createTask(this.id, {
      title: this.quickAddTitle.trim(),
      status: status,
      priority: 'Medium'
    });
    this.quickAddTitle = '';
    this.quickAddColumn = null;
    window.Utils.toast('Task added', 'success');
    this.loadProject();
  } catch (err) {
    window.Utils.toast('Failed to add task', 'error');
  }
},

cancelQuickAdd() {
  this.quickAddColumn = null;
  this.quickAddTitle = '';
},
```

- [ ] **Step 7: Add view mode toggle watcher**

Add a `watch` block to `ProjectDetailView`:
```javascript
watch: {
  taskViewMode(newMode) {
    if (newMode === 'board') {
      this.$nextTick(() => this.initKanbanSortable());
    } else {
      this.destroyKanbanSortable();
    }
  }
},
```

Also update `beforeUnmount`:
```javascript
beforeUnmount() {
  this.destroyKanbanSortable();
},
```

- [ ] **Step 8: Add Kanban Board template to the Tasks tab**

In `ProjectDetailView`'s template, inside the tasks tab panel, add the view toggle buttons and the board template.

**View Toggle** (place at top of tasks tab, above existing task filter buttons):
```html
<!-- View Mode Toggle -->
<div class="flex items-center gap-2 mb-4">
  <button @click="taskViewMode = 'list'"
    :class="['px-3 py-1.5 text-xs font-bold rounded-lg border transition-all', taskViewMode === 'list' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400']">
    ☰ List
  </button>
  <button @click="taskViewMode = 'board'"
    :class="['px-3 py-1.5 text-xs font-bold rounded-lg border transition-all', taskViewMode === 'board' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400']">
    ⊞ Board
  </button>
</div>
```

**Kanban Board** (wrap existing list view with `v-if="taskViewMode === 'list'"` and add board with `v-else`):
```html
<!-- Kanban Board View -->
<div v-else class="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
  <div class="flex items-start gap-4 min-h-[500px]" style="min-width: max-content;">
    
    <div v-for="col in kanbanColumns" :key="col.id"
      class="w-72 sm:w-80 shrink-0 bg-slate-100/80 rounded-2xl flex flex-col max-h-[600px] border border-slate-200 shadow-sm">
      
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
          class="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
          
          <!-- Card Content (Collapsed) -->
          <div class="p-3.5" @click="expandCard(task)">
            <div class="flex items-center justify-between mb-1.5">
              <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border"
                :class="getPriorityClass(task.priority)">
                {{ task.priority }}
              </span>
              <span class="text-[11px] text-slate-400 font-medium">#{{ task.id }}</span>
            </div>
            <h4 class="text-sm font-semibold text-slate-800 leading-snug"
              :class="{ 'line-through text-slate-400': task.status === 'Completed' }">
              {{ task.title }}
            </h4>
            <p v-if="task.description" class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {{ task.description }}
            </p>
            <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span v-if="task.due_date" class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {{ task.due_date }}
              </span>
              <span v-else>No deadline</span>
              <span class="text-slate-300">{{ task.created_at ? task.created_at.slice(0, 10) : '' }}</span>
            </div>
            <div v-if="task.completed_at" class="mt-1.5 text-[10px] text-emerald-600 font-semibold">
              ✓ Done {{ task.completed_at.slice(0, 10) }}
            </div>
          </div>

          <!-- Expanded Inline Edit Form -->
          <div v-if="expandedCardId === task.id" class="border-t border-slate-200 p-3.5 bg-slate-50/50 rounded-b-xl space-y-3">
            <input v-model="editingTask.title" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Task title">
            <textarea v-model="editingTask.description" rows="2" class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Description (optional)"></textarea>
            <div class="grid grid-cols-2 gap-2">
              <select v-model="editingTask.priority" class="px-2 py-1.5 text-xs border border-slate-300 rounded-lg">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <input v-model="editingTask.due_date" type="date" class="px-2 py-1.5 text-xs border border-slate-300 rounded-lg">
            </div>
            <select v-model="editingTask.status" class="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg">
              <option value="Todo">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Completed">Done</option>
            </select>
            <div class="flex justify-end gap-2 pt-1">
              <button @click="cancelExpandCard" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button @click="saveExpandedCard(task.id)" class="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800">Save</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Add Footer -->
      <div class="p-2 border-t border-slate-200/60">
        <div v-if="quickAddColumn === col.id" class="p-2 space-y-2">
          <input :ref="'quickadd_' + col.id" v-model="quickAddTitle" @keyup.enter="submitQuickAdd(col.id)" @keyup.esc="cancelQuickAdd"
            class="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900" placeholder="Task title...">
          <div class="flex gap-2">
            <button @click="submitQuickAdd(col.id)" class="flex-1 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800">Add</button>
            <button @click="cancelQuickAdd" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">✕</button>
          </div>
        </div>
        <button v-else @click="openQuickAdd(col.id)"
          class="w-full py-2 px-3 flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Add Task
        </button>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 9: Verify — Refresh browser, navigate to a project, toggle to Board view**

Expected: 4 columns appear, existing tasks are displayed in their correct status columns, cards can be dragged between columns, quick-add works at column footer, inline edit works on card click.

---

### Task 5: Frontend — Global Task Board Page

**Files:**
- Create: `d:\WEB\ClientManagement\js\pages\kanban.js`
- Modify: `d:\WEB\ClientManagement\index.html` (add script tag + route)
- Modify: `d:\WEB\ClientManagement\js\components\layout.js` (add navigation item)

**Interfaces:**
- Consumes: `window.API.tasks.board(projectId)`, `window.API.tasks.update(id, data)`, `window.Sortable`
- Produces: `window.KanbanBoardView` — Global task board overview accessible at `#/tasks`

- [ ] **Step 1: Create `js/pages/kanban.js`**

Create file `d:\WEB\ClientManagement\js\pages\kanban.js` with full component:
```javascript
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
```

- [ ] **Step 2: Add script tag in `index.html`**

After line 76 (`js/pages/reports.js`), add:
```html
<script src="js/pages/kanban.js"></script>
```

- [ ] **Step 3: Add route in `index.html`**

In the `currentComponent` computed property, before the line `// Other Routes` (line 147), add:
```javascript
// Task Board Route
if (hash === '#/tasks') return window.KanbanBoardView;
```

- [ ] **Step 4: Add navigation item in `layout.js`**

In `js/components/layout.js`, in the `navigation` array (line 17-24), after the "Projects" entry (line 20), add:
```javascript
{ name: 'Task Board', route: '#/tasks', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
```

- [ ] **Step 5: Verify — Refresh browser, click "Task Board" in sidebar**

Expected: Global kanban board loads with tasks from all active projects grouped by status columns, project name labels on each card, project filter dropdown works, drag-drop updates task status, clicking a card navigates to the project detail page.

---

### Task 6: Update Existing List View for 'Review' Status Compatibility

**Files:**
- Modify: `d:\WEB\ClientManagement\js\pages\projects.js` (update task filter, add task form status options, and priority class for Review)
- Modify: `d:\WEB\ClientManagement\portal.html` (add Review status rendering in portal checklist)

**Interfaces:**
- Consumes: Existing task data with `status: 'Review'`
- Produces: Compatible list view and portal rendering for the new Review status

- [ ] **Step 1: Update task form status options in `ProjectDetailView`**

In `projects.js`, find the `taskForm` default data and update the status field. Also update the status `<select>` in the inline Add Task form template to include a `Review` option:
```html
<option value="Todo">To Do</option>
<option value="In Progress">In Progress</option>
<option value="Review">Review</option>
<option value="Completed">Completed</option>
```

- [ ] **Step 2: Update task filter to handle Review status**

In `filteredTasks` computed property, update the `'active'` filter to also exclude 'Completed' tasks (Review should show as active):
```javascript
// 'active' filter should show Todo, In Progress, and Review
if (this.taskFilter === 'active') return this.tasks.filter(t => t.status !== 'Completed');
```
(This likely already works correctly since it filters `!== 'Completed'`, but verify Review shows in the active list.)

- [ ] **Step 3: Update portal.html task status rendering**

In `portal.html`, find the task status icon/badge rendering and add a case for `'Review'`:

In the status icon section, add after the `In Progress` case:
```html
<span v-else-if="t.status === 'Review'" class="w-2 h-2 rounded-full bg-blue-400"></span>
```

In the status badge, add the Review color class:
```javascript
t.status === 'Review' ? 'bg-blue-50 text-blue-700 border-blue-200' : ...
```

- [ ] **Step 4: Verify — Create a task with "Review" status, check both list and board views**

Expected: Review status appears correctly in list view with proper badge color, in board view in the Review column, and in portal.html with blue styling.

---

### Task 7: Testing & Verification

**Files:**
- Modify: `d:\WEB\ClientManagement\test-suite.php` (add kanban-specific tests)

**Interfaces:**
- Consumes: All API endpoints created/modified in Tasks 1-2.
- Produces: Passing test suite confirming Review status, float order_index, global board endpoint, and batch reorder.

- [ ] **Step 1: Update test-suite.php**

Add a new test section after section 4, testing the new features:
```php
// Test 5: Kanban Board Features
echo "5. Testing Kanban Board Features...\n";

// Test 'Review' status insertion
$reviewTaskId = $db->insert('project_tasks', [
    'project_id' => $projectId,
    'title' => 'Test Review Status Task',
    'status' => 'Review',
    'priority' => 'High',
    'order_index' => 1500.5
]);
$reviewTask = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$reviewTaskId]);
if ($reviewTask['status'] !== 'Review') throw new Exception("Review status not saved correctly");
if (abs(floatval($reviewTask['order_index']) - 1500.5) > 0.01) throw new Exception("Float order_index not saved correctly");
echo "   [OK] Review status and float order_index verified.\n";

// Test global board query
$boardTasks = $db->fetchAll(
    "SELECT t.*, p.title as project_title 
     FROM project_tasks t 
     JOIN projects p ON t.project_id = p.id 
     WHERE p.status NOT IN ('Completed', 'Cancelled')
     ORDER BY t.order_index ASC"
);
echo "   [OK] Global board query returned " . count($boardTasks) . " tasks.\n";

// Cleanup test task
$db->delete('project_tasks', 'id = ?', [$reviewTaskId]);
echo "   [OK] Test task cleaned up.\n";
```

Update the file existence check to include `kanban.js`:
```php
'js/pages/kanban.js',
```

- [ ] **Step 2: Run test suite**

Run: `php test-suite.php`
Expected:
```
=== CLIENTHUB UNIFIED TEST SUITE ===
...
5. Testing Kanban Board Features...
   [OK] Review status and float order_index verified.
   [OK] Global board query returned N tasks.
   [OK] Test task cleaned up.
6. Verifying Static Assets & Views...
   [OK] All 21 asset, page & portal files exist and are verified.

============================================
   ALL TESTS PASSED SUCCESSFULLY! (100%)
============================================
```

---

## File Summary

| Action | File | Purpose |
|---|---|---|
| Modify | `api/tasks.php` | Add Review status, float order_index, global board endpoint, batch reorder |
| Modify | `index.php` | Add routes: `GET /tasks/board`, `POST /projects/:id/tasks/reorder` |
| Modify | `assets/js/api.js` | Add `API.tasks.board()`, `API.projects.reorderTasks()` |
| Modify | `assets/css/app.css` | Add `.kanban-ghost`, `.kanban-chosen`, `.kanban-drag` CSS |
| Modify | `index.html` | Add SortableJS CDN, kanban.js script tag, `#/tasks` route |
| Modify | `js/components/layout.js` | Add "Task Board" navigation item |
| Modify | `js/pages/projects.js` | Add board view toggle, kanban template, drag-drop logic, inline edit, quick-add |
| Create | `js/pages/kanban.js` | Global Task Board page component |
| Modify | `portal.html` | Add Review status rendering |
| Modify | `test-suite.php` | Add kanban verification tests |
