<?php
/**
 * Project Tasks & Milestones API
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all tasks for a project with progress statistics
 */
function getProjectTasks(int $projectId): void {
    $db = Database::getInstance();

    // Verify project exists
    $project = $db->fetch("SELECT id, title FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }

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
}

/**
 * Create a new task for a project
 */
function createProjectTask(int $projectId): void {
    $db = Database::getInstance();

    // Verify project exists
    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }

    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $errors = Validator::validate($body, [
        'title' => 'required'
    ]);

    if (!empty($errors)) {
        Response::validationError($errors);
    }

    $status = in_array($body['status'] ?? '', ['Todo', 'In Progress', 'Review', 'Completed']) ? $body['status'] : 'Todo';
    $priority = in_array($body['priority'] ?? '', ['Low', 'Medium', 'High']) ? $body['priority'] : 'Medium';
    $completedAt = $status === 'Completed' ? date('Y-m-d H:i:s') : null;

    // Auto-compute order_index: append to bottom of target column
    $maxOrder = $db->fetch(
        "SELECT COALESCE(MAX(order_index), 0) as max_order FROM project_tasks WHERE project_id = ? AND status = ?",
        [$projectId, $status]
    );
    $orderIndex = floatval($maxOrder['max_order']) + 1000.0;

    $taskId = $db->insert('project_tasks', [
        'project_id' => $projectId,
        'title' => Validator::sanitize($body['title']),
        'description' => isset($body['description']) ? Validator::sanitize($body['description']) : null,
        'status' => $status,
        'priority' => $priority,
        'due_date' => !empty($body['due_date']) ? Validator::sanitize($body['due_date']) : null,
        'completed_at' => $completedAt,
        'order_index' => $orderIndex
    ]);

    $task = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$taskId]);

    Response::success($task, 'Task created successfully', 201);
}

/**
 * Update an existing task
 */
function updateTask(int $id): void {
    $db = Database::getInstance();

    $existing = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Task not found');
    }

    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $updateData = [];
    if (array_key_exists('title', $body)) {
        if (trim((string)$body['title']) === '') {
            Response::validationError(['title' => 'Task title cannot be empty']);
        }
        $updateData['title'] = Validator::sanitize((string)$body['title']);
    }
    if (array_key_exists('description', $body)) {
        $updateData['description'] = !empty($body['description']) ? Validator::sanitize((string)$body['description']) : null;
    }
    if (isset($body['priority']) && in_array($body['priority'], ['Low', 'Medium', 'High'], true)) {
        $updateData['priority'] = $body['priority'];
    }
    if (array_key_exists('due_date', $body)) {
        $updateData['due_date'] = !empty($body['due_date']) ? Validator::sanitize((string)$body['due_date']) : null;
    }
    if (isset($body['status']) && in_array($body['status'], ['Todo', 'In Progress', 'Review', 'Completed'], true)) {
        $updateData['status'] = $body['status'];
        if ($body['status'] === 'Completed') {
            $updateData['completed_at'] = $existing['status'] === 'Completed' && !empty($existing['completed_at'])
                ? $existing['completed_at']
                : date('Y-m-d H:i:s');
        } else {
            $updateData['completed_at'] = null;
        }
    }
    if (isset($body['order_index'])) {
        $updateData['order_index'] = floatval($body['order_index']);
    }

    $updateData['updated_at'] = date('Y-m-d H:i:s');

    $db->update('project_tasks', $updateData, 'id = ?', [$id]);

    $task = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$id]);

    Response::success($task, 'Task updated successfully');
}

/**
 * Toggle task status (Todo/In Progress <-> Completed)
 */
function toggleTaskStatus(int $id): void {
    $db = Database::getInstance();

    $task = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$id]);
    if (!$task) {
        Response::notFound('Task not found');
    }

    $newStatus = $task['status'] === 'Completed' ? 'Todo' : 'Completed';
    $completedAt = $newStatus === 'Completed' ? date('Y-m-d H:i:s') : null;

    $db->update('project_tasks', [
        'status' => $newStatus,
        'completed_at' => $completedAt,
        'updated_at' => date('Y-m-d H:i:s')
    ], 'id = ?', [$id]);

    $updated = $db->fetch("SELECT * FROM project_tasks WHERE id = ?", [$id]);

    Response::success($updated, 'Task status updated');
}

/**
 * Delete a task
 */
function deleteTask(int $id): void {
    $db = Database::getInstance();

    $task = $db->fetch("SELECT id FROM project_tasks WHERE id = ?", [$id]);
    if (!$task) {
        Response::notFound('Task not found');
    }

    $db->delete('project_tasks', 'id = ?', [$id]);

    Response::success(null, 'Task deleted successfully');
}

/**
 * Get global task board data across active projects
 */
function getGlobalTaskBoard(): void {
    $db = Database::getInstance();

    $projectId = !empty($_GET['project_id']) ? (int)$_GET['project_id'] : null;

    if ($projectId) {
        $tasks = $db->fetchAll(
            "SELECT t.*, p.title as project_title, p.status as project_status
             FROM project_tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE p.status NOT IN ('Completed', 'Cancelled')
               AND p.id = ?
             ORDER BY t.order_index ASC, t.id ASC",
            [$projectId]
        );
    } else {
        $tasks = $db->fetchAll(
            "SELECT t.*, p.title as project_title, p.status as project_status
             FROM project_tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE p.status NOT IN ('Completed', 'Cancelled')
             ORDER BY t.order_index ASC, t.id ASC"
        );
    }

    $projects = $db->fetchAll(
        "SELECT id, title FROM projects WHERE status NOT IN ('Completed', 'Cancelled') ORDER BY title ASC"
    );

    $total = count($tasks);
    $completed = 0;
    $inProgress = 0;
    $review = 0;
    $todo = 0;

    foreach ($tasks as $t) {
        if ($t['status'] === 'Completed') {
            $completed++;
        } else if ($t['status'] === 'In Progress') {
            $inProgress++;
        } else if ($t['status'] === 'Review') {
            $review++;
        } else {
            $todo++;
        }
    }

    $stats = [
        'total' => $total,
        'todo' => $todo,
        'in_progress' => $inProgress,
        'review' => $review,
        'completed' => $completed
    ];

    Response::success([
        'tasks' => $tasks,
        'projects' => $projects,
        'stats' => $stats
    ]);
}

/**
 * Batch reorder tasks within a project
 */
function reorderProjectTasks(int $projectId): void {
    $db = Database::getInstance();

    // Verify project exists
    $project = $db->fetch("SELECT id FROM projects WHERE id = ?", [$projectId]);
    if (!$project) {
        Response::notFound('Project not found');
    }

    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $tasks = $body['tasks'] ?? [];

    if (!is_array($tasks)) {
        Response::validationError(['tasks' => 'Tasks array is required']);
    }

    foreach ($tasks as $item) {
        if (isset($item['id']) && isset($item['order_index'])) {
            $db->update(
                'project_tasks',
                [
                    'order_index' => floatval($item['order_index']),
                    'updated_at' => date('Y-m-d H:i:s')
                ],
                'id = ? AND project_id = ?',
                [(int)$item['id'], $projectId]
            );
        }
    }

    Response::success(null, 'Tasks reordered successfully');
}

