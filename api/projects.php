<?php
/**
 * Projects API Endpoints
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/validator.php';

/**
 * Get all projects with pagination and filters
 */
function getProjects(array $params): void {
    $db = Database::getInstance();
    
    $page = max(1, (int)($params['page'] ?? 1));
    $perPage = min(100, max(1, (int)($params['per_page'] ?? 20)));
    $offset = ($page - 1) * $perPage;
    $search = $params['search'] ?? '';
    $status = $params['status'] ?? '';
    $clientId = $params['client_id'] ?? '';
    $serviceId = $params['service_id'] ?? '';
    
    $where = [];
    $queryParams = [];
    
    if (!empty($search)) {
        $where[] = "(p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ? OR c.company LIKE ?)";
        $searchTerm = "%{$search}%";
        $queryParams[] = $searchTerm;
        $queryParams[] = $searchTerm;
        $queryParams[] = $searchTerm;
        $queryParams[] = $searchTerm;
    }
    
    if (!empty($status) && in_array($status, PROJECT_STATUSES, true)) {
        $where[] = "p.status = ?";
        $queryParams[] = $status;
    }
    
    if (!empty($clientId)) {
        $where[] = "p.client_id = ?";
        $queryParams[] = (int)$clientId;
    }
    
    if (!empty($serviceId)) {
        $where[] = "p.service_id = ?";
        $queryParams[] = (int)$serviceId;
    }
    
    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Get total count (join clients so client search works)
    $countSql = "SELECT COUNT(*) as total FROM projects p LEFT JOIN clients c ON p.client_id = c.id {$whereClause}";
    $countResult = $db->fetch($countSql, $queryParams);
    $total = (int)($countResult['total'] ?? 0);
    
    // Use pre-aggregated subqueries to prevent cross-join multiplication
    $sql = "SELECT p.*, 
                   c.name as client_name,
                   c.company as client_company,
                   s.name as service_name,
                   COALESCE(e.total_expenses, 0) as total_expenses,
                   COALESCE(pay.total_received, 0) as total_received,
                   COALESCE(t.task_total, 0) as task_total,
                   COALESCE(t.task_completed, 0) as task_completed
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN services s ON p.service_id = s.id
            LEFT JOIN (
                SELECT project_id, SUM(amount) as total_expenses
                FROM project_expenses
                GROUP BY project_id
            ) e ON p.id = e.project_id
            LEFT JOIN (
                SELECT project_id, SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) as total_received
                FROM project_payments
                GROUP BY project_id
            ) pay ON p.id = pay.project_id
            LEFT JOIN (
                SELECT project_id,
                       COUNT(*) as task_total,
                       SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as task_completed
                FROM project_tasks
                GROUP BY project_id
            ) t ON p.id = t.project_id
            {$whereClause}
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?";
    
    $projects = $db->fetchAll($sql, array_merge($queryParams, [$perPage, $offset]));
    
    // Calculate budget utilization and task progress for each project
    foreach ($projects as &$project) {
        $totalBudget = (float)$project['total_budget'];
        $totalExpenses = (float)$project['total_expenses'];
        $project['remaining_budget'] = $totalBudget - $totalExpenses;
        $project['budget_utilization'] = $totalBudget > 0 
            ? round(($totalExpenses / $totalBudget) * 100, 2) 
            : 0;
        $tTotal = (int)$project['task_total'];
        $tCompleted = (int)$project['task_completed'];
        $project['task_progress'] = $tTotal > 0 ? (int)round(($tCompleted / $tTotal) * 100) : 0;
    }
    
    Response::paginated($projects, $total, $page, $perPage);
}

/**
 * Get single project by ID
 */
function getProject(int $id): void {
    $db = Database::getInstance();
    
    $sql = "SELECT p.*, 
                   c.name as client_name,
                   c.email as client_email,
                   c.phone as client_phone,
                   c.company as client_company,
                   s.name as service_name,
                   COALESCE(e.total_expenses, 0) as total_expenses,
                   COALESCE(pay.total_received, 0) as total_received,
                   COALESCE(pay.pending_payments, 0) as pending_payments
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN services s ON p.service_id = s.id
            LEFT JOIN (
                SELECT project_id, SUM(amount) as total_expenses
                FROM project_expenses
                GROUP BY project_id
            ) e ON p.id = e.project_id
            LEFT JOIN (
                SELECT project_id,
                       SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END) as total_received,
                       SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as pending_payments
                FROM project_payments
                GROUP BY project_id
            ) pay ON p.id = pay.project_id
            WHERE p.id = ?";
    
    $project = $db->fetch($sql, [$id]);
    
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Calculate budget info
    $totalBudget = (float)$project['total_budget'];
    $totalExpenses = (float)$project['total_expenses'];
    $project['remaining_budget'] = $totalBudget - $totalExpenses;
    $project['budget_utilization'] = $totalBudget > 0 
        ? round(($totalExpenses / $totalBudget) * 100, 2) 
        : 0;
    
    // Load complete project activity lists (capped cleanly at 200 to prevent unbounded memory)
    $project['recent_expenses'] = $db->fetchAll(
        "SELECT * FROM project_expenses WHERE project_id = ? ORDER BY expense_date DESC, created_at DESC LIMIT 200",
        [$id]
    );
    
    $project['recent_payments'] = $db->fetchAll(
        "SELECT * FROM project_payments WHERE project_id = ? ORDER BY payment_date DESC, created_at DESC LIMIT 200",
        [$id]
    );
    
    $project['recent_communications'] = $db->fetchAll(
        "SELECT * FROM communications WHERE project_id = ? ORDER BY created_at DESC LIMIT 200",
        [$id]
    );
    
    Response::success($project);
}

/**
 * Create new project
 */
function createProject(array $body): void {
    $db = Database::getInstance();
    
    // Fallback service_id to first active service if omitted by external caller
    if (empty($body['service_id'])) {
        $defaultService = $db->fetch("SELECT id FROM services WHERE is_active = 1 ORDER BY id ASC LIMIT 1");
        if ($defaultService) {
            $body['service_id'] = $defaultService['id'];
        }
    }

    // Validate input
    $validator = new Validator($body);
    $validator
        ->required('client_id', 'Client is required')
        ->integer('client_id')
        ->required('service_id', 'Service is required')
        ->integer('service_id')
        ->required('title', 'Project title is required')
        ->maxLength('title', 255, 'Title must not exceed 255 characters')
        ->inArray('status', PROJECT_STATUSES)
        ->date('start_date')
        ->date('end_date')
        ->numeric('total_budget')
        ->positive('total_budget');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }
    
    // Check if client exists
    $client = $db->fetch("SELECT id FROM clients WHERE id = ?", [(int)$body['client_id']]);
    if (!$client) {
        Response::error('Client not found', 400);
    }
    
    // Check if service exists
    $service = $db->fetch("SELECT id FROM services WHERE id = ?", [(int)$body['service_id']]);
    if (!$service) {
        Response::error('Service not found', 400);
    }
    
    // Create project with generated portal token
    $projectId = $db->insert('projects', [
        'client_id' => (int)$body['client_id'],
        'service_id' => (int)$body['service_id'],
        'title' => Validator::sanitize($body['title']),
        'description' => isset($body['description']) ? Validator::sanitize($body['description']) : null,
        'status' => $body['status'] ?? 'Pending',
        'start_date' => !empty($body['start_date']) ? $body['start_date'] : null,
        'end_date' => !empty($body['end_date']) ? $body['end_date'] : null,
        'total_budget' => (float)($body['total_budget'] ?? 0),
        'currency' => $body['currency'] ?? DEFAULT_CURRENCY,
        'portal_token' => bin2hex(random_bytes(16)),
        'portal_enabled' => isset($body['portal_enabled']) ? (int)(bool)$body['portal_enabled'] : 1
    ]);
    
    $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$projectId]);
    
    Response::created($project, 'Project created successfully');
}

/**
 * Update project (supports full form updates and partial API/MCP updates)
 */
function updateProject(int $id, array $body): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $existing = $db->fetch("SELECT * FROM projects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Project not found');
    }

    // Merge defaults from existing record so partial PUT requests work reliably
    $merged = [
        'client_id' => array_key_exists('client_id', $body) ? $body['client_id'] : $existing['client_id'],
        'service_id' => array_key_exists('service_id', $body) && $body['service_id'] !== '' ? $body['service_id'] : $existing['service_id'],
        'title' => array_key_exists('title', $body) ? $body['title'] : $existing['title'],
        'description' => array_key_exists('description', $body) ? $body['description'] : $existing['description'],
        'status' => array_key_exists('status', $body) ? $body['status'] : $existing['status'],
        'start_date' => array_key_exists('start_date', $body) ? ($body['start_date'] ?: null) : $existing['start_date'],
        'end_date' => array_key_exists('end_date', $body) ? ($body['end_date'] ?: null) : $existing['end_date'],
        'total_budget' => array_key_exists('total_budget', $body) ? $body['total_budget'] : $existing['total_budget'],
        'currency' => array_key_exists('currency', $body) ? $body['currency'] : $existing['currency'],
    ];
    
    // Validate input
    $validator = new Validator($merged);
    $validator
        ->required('client_id', 'Client is required')
        ->integer('client_id')
        ->required('service_id', 'Service is required')
        ->integer('service_id')
        ->required('title', 'Project title is required')
        ->maxLength('title', 255, 'Title must not exceed 255 characters')
        ->inArray('status', PROJECT_STATUSES)
        ->date('start_date')
        ->date('end_date')
        ->numeric('total_budget')
        ->positive('total_budget');
    
    if ($validator->fails()) {
        Response::validationError($validator->getErrors());
    }

    // Verify client & service exist
    $client = $db->fetch("SELECT id FROM clients WHERE id = ?", [(int)$merged['client_id']]);
    if (!$client) {
        Response::error('Client not found', 400);
    }
    $service = $db->fetch("SELECT id FROM services WHERE id = ?", [(int)$merged['service_id']]);
    if (!$service) {
        Response::error('Service not found', 400);
    }

    $updateFields = [
        'client_id' => (int)$merged['client_id'],
        'service_id' => (int)$merged['service_id'],
        'title' => Validator::sanitize((string)$merged['title']),
        'description' => $merged['description'] !== null ? Validator::sanitize((string)$merged['description']) : null,
        'status' => $merged['status'] ?? 'Pending',
        'start_date' => $merged['start_date'],
        'end_date' => $merged['end_date'],
        'total_budget' => (float)($merged['total_budget'] ?? 0),
        'currency' => $merged['currency'] ?? DEFAULT_CURRENCY
    ];

    if (array_key_exists('portal_enabled', $body)) {
        $updateFields['portal_enabled'] = (int)(bool)$body['portal_enabled'];
    }
    
    // Update project
    $db->update('projects', $updateFields, 'id = ?', [$id]);
    
    $project = $db->fetch("SELECT * FROM projects WHERE id = ?", [$id]);
    
    Response::success($project, 'Project updated successfully');
}

/**
 * Delete project
 */
function deleteProject(int $id): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $existing = $db->fetch("SELECT id FROM projects WHERE id = ?", [$id]);
    if (!$existing) {
        Response::notFound('Project not found');
    }
    
    // Delete project (cascades to expenses, payments, communications)
    $db->delete('projects', 'id = ?', [$id]);
    
    Response::success(null, 'Project deleted successfully');
}

/**
 * Get project budget summary
 */
function getProjectBudgetSummary(int $id): void {
    $db = Database::getInstance();
    
    // Check if project exists
    $project = $db->fetch("SELECT id, title, total_budget, currency FROM projects WHERE id = ?", [$id]);
    if (!$project) {
        Response::notFound('Project not found');
    }
    
    // Get expenses by category
    $expensesByCategory = $db->fetchAll(
        "SELECT category, SUM(amount) as total 
         FROM project_expenses 
         WHERE project_id = ? 
         GROUP BY category 
         ORDER BY total DESC",
        [$id]
    );
    
    // Get total expenses
    $totalExpenses = $db->fetch(
        "SELECT COALESCE(SUM(amount), 0) as total FROM project_expenses WHERE project_id = ?",
        [$id]
    );
    
    // Get payments summary
    $paymentsSummary = $db->fetch(
        "SELECT 
            COALESCE(SUM(CASE WHEN status = 'Received' THEN amount ELSE 0 END), 0) as total_received,
            COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) as total_pending,
            COALESCE(SUM(CASE WHEN status = 'Refunded' THEN amount ELSE 0 END), 0) as total_refunded
         FROM project_payments 
         WHERE project_id = ?",
        [$id]
    );
    
    $totalBudget = (float)$project['total_budget'];
    $totalExpensesAmount = (float)($totalExpenses['total'] ?? 0);
    $remainingBudget = $totalBudget - $totalExpensesAmount;
    $budgetUtilization = $totalBudget > 0 ? round(($totalExpensesAmount / $totalBudget) * 100, 2) : 0;
    
    Response::success([
        'project_id' => $id,
        'project_title' => $project['title'],
        'currency' => $project['currency'],
        'total_budget' => $totalBudget,
        'total_expenses' => $totalExpensesAmount,
        'remaining_budget' => $remainingBudget,
        'budget_utilization' => $budgetUtilization,
        'expenses_by_category' => $expensesByCategory,
        'payments' => [
            'total_received' => (float)($paymentsSummary['total_received'] ?? 0),
            'total_pending' => (float)($paymentsSummary['total_pending'] ?? 0),
            'total_refunded' => (float)($paymentsSummary['total_refunded'] ?? 0)
        ],
        'profit_estimate' => (float)($paymentsSummary['total_received'] ?? 0) - $totalExpensesAmount
    ]);
}
